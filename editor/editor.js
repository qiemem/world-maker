var Editor = (function(d3, acorn, block, Completer) {
  'use strict';

  function Editor(container, reEval) {
    this.reEval = reEval;
    this.container = container;
    this.drawer = document.createElement('div');
    this.drawer.classList.add('drawer');
    this.editor = CodeMirror(this.drawer, {
      mode: 'javascript',
      lineNumbers: false,
      theme: 'solarized dark',
      styleSelectedText: true
    });

    this.completer = new Completer(this.editor, [], ['agency/agency.json']);
    //this.completer = new Completer(this.editor, ['agency/agency.js'], []);
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


    this.preEvalListeners = [];
    this.postEvalListeners = [];
    var me = this;
    this.editor.on('change', function() {
      clearTimeout(me.evalTimeout);
      me.evalTimeout = setTimeout(function() {
        me.ast = acorn.parse_dammit(me.editor.getValue());
        me.evalContents();
      }, 100);
    });


    block.CodeBlock.watch(this.editor, function(){return me.ast;});
    block.NumberBlock.watch(this.editor, this.evalContents.bind(this));

    var complete = function() {me.doCompletions();};
    this.editor.on('cursorActivity', complete);
    this.editor.on('focus', complete);
  }

  Editor.prototype.evalContents = function() {
    for (var i = 0; i < this.preEvalListeners.length; i++) {
      this.preEvalListeners[i]();
    }
    var startTime = (new Date()).getTime();
    this.reEval(this.editor.getValue());
    var endTime = (new Date()).getTime();
    for (var i = 0; i < this.postEvalListeners.length; i++) {
      this.postEvalListeners[i]();
    }
    console.log('Evaluated in ' + (endTime - startTime));
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

  Editor.prototype.addPreEvalListener = function(func) {
    this.preEvalListeners.push(func);
  };

  Editor.prototype.addPostEvalListener = function(func) {
    this.postEvalListeners.push(func);
  };

  Editor.prototype.doCompletions = function() {
    this.completer.complete(this.editor.getCursor('start'),
       this.showCompletions.bind(this));
  };

  Editor.prototype.showCompletions = function(completions) {
    var li = d3.select(this.completionsList).selectAll('li').data(completions);
    var me = this;

    // Preserves selected text if the user doesn't click on anything.
    li.enter().append('li');
    li.text(function(d) {return d;})
      .classed('completion', 1)
      .on('mouseover', function(d) {
        me.editor.replaceSelection(d);
      })
      .on('mouseout', function() {
        // Don't want tons of completion events filling the undo history.
        me.editor.undo();
      })
      .on('click', function() {
        me.editor.setCursor(me.editor.getCursor('end'));
        // Adds an empty event to the undo history, so that when the mouseout
        // event hits, the undo is innocuous. Note that since the list item
        // changes after this click (the list of completions is different)
        // closured variables will be lost.
        me.editor.replaceSelection('');
        me.editor.setCursor(me.editor.getCursor('end'));
        me.editor.focus();
      });


    li.exit().remove();
  };

  return Editor;
}(d3, acorn, block, Completer));
