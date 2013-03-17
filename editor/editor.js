var Editor = (function(d3, acorn) {
  'use strict';

  function Editor(container) {
    this.container = container;
    this.drawer = document.createElement('div');
    this.drawer.classList.add('drawer');
    this.editor = CodeMirror(this.drawer, {
      mode: 'javascript',
      lineNumbers: false,
      theme: 'solarized dark',
      styleSelectedText: true
    });

    block.NumberBlock.watch(this.editor);

    this.completions = document.createElement('div');
    this.completions.classList.add('completions');
    this.drawer.appendChild(this.completions);

    this.completionsList = document.createElement('ul');
    this.completionsList.classList.add('completions-list');
    this.completions.appendChild(this.completionsList);

    this.container.appendChild(this.drawer);
    this.visible = false;
    this.evalTimeout = -1;

    this.numberSelector = document.createElement('div');
    this.numberSelector.id = ('number-selector');
    container.appendChild(this.numberSelector);


    this.evalListeners = [];
    var me = this;
    this.editor.on('change', function() {
      clearTimeout(me.evalTimeout);
      me.evalTimeout = setTimeout(function() {
        me.ast = acorn.parse_dammit(me.editor.getValue());
        me.evalContents();
      }, 100);
    });

    var complete = function() {me.doCompletions();};
    this.editor.on('cursorActivity', complete);
    this.editor.on('focus', complete);

    // TODO: Need some serious refactoring here. Works, but very ugly
    // TODO: Put in signifier of where block came from.
    var markedStatement;
    var blockHandle;
    var hoverHandle = false;
    var gotBlock = false;

    this.editor.getScrollerElement().addEventListener('mousemove', function(e) {
      if (!hoverHandle && !gotBlock) {
        var pos = {top: e.pageY, left: e.pageX};
        var loc = me.editor.coordsChar(pos);
        var node = me.getSmallestNode(loc);
        if (markedStatement) {
          markedStatement.clear();
        }
        if (blockHandle) {
          blockHandle.parentNode.removeChild(blockHandle);
          blockHandle = null;
        }
        if (node) {
          var start = me.editor.posFromIndex(node.start);
          var end = me.editor.posFromIndex(node.end);
          markedStatement = me.editor.markText(start, end, {
            className: 'statement'
          });

          blockHandle = document.createElement('div');
          blockHandle.classList.add('block-handle');
          blockHandle.addEventListener('mouseover', function() {
            hoverHandle = true;
          });
          blockHandle.addEventListener('mouseout', function() {
            hoverHandle = false;
            blockHandle.parentNode.removeChild(blockHandle);
            blockHandle = null;
            if (gotBlock) {
              var block = document.createElement('div');
              block.classList.add('picked-block');
              block.innerText = me.editor.getSelection();
              document.body.appendChild(block);
              var blockInsert = document.createElement('div');
              var insertWidget;
              var insertionLine;
              blockInsert.classList.add('block-insert');
              me.editor.replaceSelection('');
              if (me.editor.getLine(me.editor.getCursor().line) === '') {
                me.editor.removeLine(me.editor.getCursor().line);
              }
              var followMouse = function (e) {
                block.style.top = e.pageY + 'px';
                block.style.left = e.pageX + 'px';
                var loc = me.editor.coordsChar({left: e.pageX, top: e.pageY});
                if (insertWidget) {
                  insertWidget.clear();
                }
                insertionLine = loc.line;
                insertWidget = me.editor.addLineWidget(
                    insertionLine, blockInsert, {
                      above: true
                    });
              };
              document.addEventListener('mousemove', followMouse);
              var cleanUp = function () {
                document.removeEventListener('mousemove', followMouse);
                document.removeEventListener('mouseup', cleanUp);
                me.editor.setCursor({line: insertionLine, ch: 0});
                me.editor.replaceSelection(block.innerText + '\n');
                block.parentNode.removeChild(block);
                block = null;
                if (insertWidget) {
                  insertWidget.clear();
                }
                gotBlock = false;
              };
              document.addEventListener('mouseup', cleanUp);
            }
          });
          blockHandle.addEventListener('mousedown', function(e) {
            me.editor.setSelection(start, end);
            gotBlock = true;
            e.preventDefault();
          });
          blockHandle.addEventListener('mouseup', function() {
            gotBlock = false;
          });
          blockHandle.addEventListener('mousemove', function() {
          });
          me.editor.addWidget(start, blockHandle);
        }
      }
    });
  }

  Editor.prototype.evalContents = function() {
    for (var i = 0; i < this.evalListeners.length; i++) {
      this.evalListeners[i]();
    }
    eval(this.editor.getValue());
    console.log('Eval successful');
  };

  Editor.prototype.slideIn = function() {
    d3.select(this.drawer).transition().style('left', '0px');
    this.visible = true;
  };

  Editor.prototype.slideOut = function() {
    var drawer = d3.select(this.drawer);
    drawer.transition().style('left', '-' + drawer.style('width'));
    this.visible = false;
  };

  Editor.prototype.toggleSlide = function() {
    if (this.visible) {
      this.slideOut();
    } else {
      this.slideIn();
    }
  };

  Editor.prototype.addEvalListener = function(func) {
    this.evalListeners.push(func);
  };

  Editor.prototype.doCompletions = function() {
    this.showCompletions(this.getCompletions(this.editor.selectionStart));
  };

  Editor.prototype.getCompletions = function(position) {
    return [';\n',
      'cursor',
      'scene',
      '.cube()',
      '.sphere()',
      '.color("red")',
      '.rgb(0.20, 0.50, 0.70)',
      '.hsl(0.20, 1.0, 0.5)',
      '.forward(1.0)',
      '.backward(1.0)',
      '.right(90)',
      '.left(90)',
      '.up(90)',
      '.down(90)',
      '.rollRight(90)',
      '.rollLeft(90)',
      '.grow(1.0)',
      '.growWide(1.0)',
      '.growLong(1.0)',
      '.growTall(1.0)',
      '.transparency(0.5)',
      'for (var i=0; i<10; i++) {\n}\n'];
  };

  Editor.prototype.showCompletions = function(completions) {
    var li = d3.select(this.completionsList).selectAll('li').data(completions);
    var me = this;

    // Preserves selected text if the user doesn't click on anything.
    var lastSelected;
    var chosen;
    li.enter().append('li')
      .text(function(d) {return d;})
      .classed('completion', 1)
      .on('mouseover', function(d) {
        lastSelected = me.editor.getSelection();
        me.editor.replaceSelection(d);
      })
      .on('mouseout', function() {
        if (!chosen) {
          // Don't mess up undo history
          var hist = me.editor.getHistory();
          me.editor.replaceSelection(lastSelected);
          hist.done.splice(hist.done.length - 1);
          me.editor.setHistory(hist);
        }
        chosen = false;
      })
      .on('click', function() {
        me.editor.setCursor(me.editor.getCursor('end'));
        me.editor.focus();
        chosen = true;
      });


    li.exit().remove();
  };

  Editor.prototype.getNodes = function(loc) {
    var matchingNodes = [];
    var index = this.editor.indexFromPos(loc);
    // TODO: Include semicolons in statements
    acorn.walk.simple(this.ast, {
      Statement: function(node) {
        if (node.start <= index && node.end > index) {
          matchingNodes.push(node);
        }
      }
    });
    return matchingNodes;
  };

  Editor.prototype.getSmallestNode = function(loc) {
    var matchingNodes = this.getNodes(loc);
    var smallest = null, smallestLength = Infinity;
    var length = matchingNodes.length;
    for (var i = 0; i < length; i++) {
      var node = matchingNodes[i];
      var nodeLength = node.end - node.start;
      if (nodeLength < smallestLength) {
        smallest = node;
        smallestLength = nodeLength;
      }
    }
    return smallest;
  };

  return Editor;
}(d3, acorn));
