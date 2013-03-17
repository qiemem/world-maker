Editor = (function() {
  function Editor(container) {
    this.container = container;
    this.drawer = document.createElement("div");
    this.drawer.classList.add("drawer");
    this.editor = CodeMirror(this.drawer, {
      mode: "javascript",
      lineNumbers: false,
      theme: "solarized dark"

    });

    this.completions = document.createElement("div");
    this.completions.classList.add("completions");
    this.drawer.appendChild(this.completions);

    this.completionsList = document.createElement("ul");
    this.completionsList.classList.add("completions-list");
    this.completions.appendChild(this.completionsList);

    this.container.appendChild(this.drawer);
    this.visible = false;
    this.evalTimeout = -1;

    this.numberSelector = document.createElement("div");
    this.numberSelector.id = ("number-selector");
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
    var markedStatement;
    var blockHandle;
    var hoverHandle = false;
    var gotBlock = false;
    this.editor.getScrollerElement().addEventListener("mousemove", function(e) {
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
          var end   = me.editor.posFromIndex(node.end);
          markedStatement = me.editor.markText(start, end, {className: 'statement'});

          blockHandle = document.createElement("div");
          blockHandle.classList.add("block-handle");
          blockHandle.addEventListener("mouseover", function() {
            hoverHandle = true;
          });
          blockHandle.addEventListener("mouseout", function() {
            hoverHandle = false;
            blockHandle.parentNode.removeChild(blockHandle);
            blockHandle = null;
            if (gotBlock) {
              var block = document.createElement("div");
              block.classList.add("block");
              block.innerText = me.editor.getSelection();
              document.body.appendChild(block);
              var blockInsert = document.createElement("div");
              var insertWidget; 
              blockInsert.classList.add("block-insert");
              me.editor.replaceSelection("");
              if (me.editor.getLine(me.editor.getCursor().line)==="") {
                me.editor.removeLine(me.editor.getCursor().line);
              }
              function followMouse (e) {
                block.style.top = e.pageY + "px";
                block.style.left = e.pageX + "px";
                var loc = me.editor.coordsChar({left: e.pageX, top: e.pageY});
                if (insertWidget) {
                  insertWidget.clear();
                }
                insertionLine = loc.line;
                insertWidget = me.editor.addLineWidget(insertionLine, blockInsert);
              }
              document.addEventListener("mousemove", followMouse);
              function cleanUp() {
                document.removeEventListener("mousemove", followMouse);
                document.removeEventListener("mouseup", cleanUp);
                me.editor.setCursor({line: insertionLine+1, ch: 0});
                me.editor.replaceSelection(block.innerText+"\n");
                block.parentNode.removeChild(block);
                block = null;
                if (insertWidget) {
                  insertWidget.clear();
                }
                gotBlock = false;
              }
              document.addEventListener("mouseup", cleanUp);
            }
          });
          blockHandle.addEventListener("mousedown", function(e) {
            me.editor.setSelection(start, end);
            gotBlock = true;
            e.preventDefault();
          });
          blockHandle.addEventListener("mouseup", function() {
            gotBlock = false;
          });
          blockHandle.addEventListener("mousemove", function() {
          });
          me.editor.addWidget(start, blockHandle);
        }
        var token = me.editor.getTokenAt(loc);
        me.mouseOnToken(loc, token);
      }
    });
  }

  Editor.prototype.evalContents = function() {
    for (var i = 0; i < this.evalListeners.length; i++) {
      this.evalListeners[i]();
    }
    eval(this.editor.getValue());
    console.log('Eval successful');
  }

  Editor.prototype.slideIn = function() {
    d3.select(this.drawer).transition().style("left", "0px");
    this.visible = true;
  }

  Editor.prototype.slideOut = function() {
    var drawer = d3.select(this.drawer);
    drawer.transition().style("left", "-" + drawer.style("width"));
    this.visible = false;
  }

  Editor.prototype.toggleSlide = function() {
    if (this.visible) {
      this.slideOut();
    } else {
      this.slideIn();
    }
  }

  Editor.prototype.addEvalListener = function(func) {
    this.evalListeners.push(func);
  }

  Editor.prototype.doCompletions = function() {
    this.showCompletions(this.getCompletions(this.editor.selectionStart));
  }

  Editor.prototype.getCompletions = function(position) {
    return [ ";\n"
      ,"cursor"
      ,"scene"
      ,".cube()"
      , ".sphere()"
      , ".color('red')"
      , ".rgb(0.20, 0.50, 0.70)"
      , ".hsl(0.20, 1.0, 0.5)"
      , ".forward(1.0)"
      , ".backward(1.0)"
      , ".right(90)"
      , ".left(90)"
      , ".up(90)"
      , ".down(90)"
      , ".rollRight(90)"
      , ".rollLeft(90)"
      , ".grow(1.0)"
      , ".growWide(1.0)"
      , ".growLong(1.0)"
      , ".growTall(1.0)"
      , ".transparency(0.5)"];
  }

  Editor.prototype.showCompletions = function(completions) {
    var li = d3.select(this.completionsList).selectAll("li").data(completions);
    var me = this;

    // Preserves selected text if the user doesn't click on anything.
    var lastSelected;
    var chosen;
    li.enter().append("li")
      .text(function (d) {return d;})
      .classed("completion", 1)
      .on("mouseover", function(d) {
        lastSelected = me.editor.getSelection();
        me.editor.replaceSelection(d);
      })
      .on("mouseout", function(d) {
        if (!chosen) {
          // Don't mess up undo history
          var hist = me.editor.getHistory();
          me.editor.replaceSelection(lastSelected);
          hist.done.splice(hist.done.length-1);
          me.editor.setHistory(hist);
        }
        chosen = false;
      })
      .on("click", function() {
        me.editor.setCursor(me.editor.getCursor("end"));
        me.editor.focus();
        chosen = true;
      })
        ;
      
    li.exit().remove();
  }

  /**
   * loc - {line, ch}
   */
  Editor.prototype.mouseOnToken = function(loc, token) {
    switch (token.type) {
      case "number":
        this.numberSelector.style.display = "inline";
        var startLoc = {line: loc.line, ch: token.start};
        var endLoc = {line: loc.line, ch: token.end};

        // Code Mirror doesn't detect, eg, ".1" properly, so check for it.
        var checkStart = {line: loc.line, ch: token.start - 1};
        if (token.string.indexOf(".")<0 
            && this.editor.getRange(checkStart, endLoc).indexOf(".") >= 0) {
          startLoc = checkStart;
        }

        var string = this.editor.getRange(startLoc, endLoc);
        if (string.charAt(0) === ".") {
          string = "0" + string;
        }
          
        var startPos = this.editor.cursorCoords(startLoc);
        var endPos = this.editor.cursorCoords(endLoc);

        this.numberSelector.style.top = startPos.top + "px";
        this.numberSelector.style.left = startPos.left + "px";
        this.numberSelector.style.width = (endPos.left - startPos.left) + "px";

        var decimal = string.indexOf(".");
        var numDecimals = decimal < 0 ? 0 : string.length - decimal - 1;
        var value = parseFloat(string);
        var me = this;
        this.numberSelector.onmousedown = function(e) {
          var lastVal = e.pageY;

          function drag(e) {
            var curVal = e.pageY;
            var diff = Math.round((lastVal - curVal)/2);
            var changeBy = numDecimals === 0 ? diff : diff / Math.pow(10, numDecimals);
            var newStr = (value + changeBy).toFixed(numDecimals);
            me.editor.replaceRange(newStr, startLoc, endLoc);
            endLoc.ch = startLoc.ch + newStr.length;
            me.evalContents();
          }

          function stop(e) {
            document.removeEventListener("mousemove", drag);
            document.removeEventListener("mouseup", stop);
          }

          document.addEventListener("mousemove", drag);
          document.addEventListener("mouseup", stop);
        };
        break;
      default:
        this.numberSelector.style.display = "none";
        this.numberSelector.onmousedown = null;
    }
  }

  Editor.prototype.getNodes = function(loc) {
    var matchingNodes = [];
    var me = this;
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
  }

  Editor.prototype.getSmallestNode = function(loc) {
    var matchingNodes = this.getNodes(loc);
    var smallest = null, smallestLength = Infinity;
    var length = matchingNodes.length;
    for (var i=0; i<length; i++) {
      var node = matchingNodes[i];
      var nodeLength = node.end - node.start;
      if (nodeLength < smallestLength) {
        smallest = node;
        smallestLength = nodeLength;
      }
    }
    return smallest;
  }
    
  return Editor;
}());
