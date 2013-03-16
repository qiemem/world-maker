SimpleEditor = (function() {
  SimpleEditor = function() {
    var me = this;
    this.domElement = document.createElement("div");
    this.domElement.classList.add("editor");
    this.domElement.contentEditable = "true";
    this.hasFocus = false;
    this._range = null;
    this.changeListeners = [];

    function trackSelection(e) {
      if (me.hasFocus) {
        me._range = window.getSelection().getRangeAt(0);
      }
    }
    document.addEventListener('mousedown', trackSelection);
    document.addEventListener('mouseup', trackSelection);
    document.addEventListener('keydown', trackSelection);
    document.addEventListener('keyup', trackSelection);

    var lastValue = "";
    this.domElement.addEventListener('DOMSubtreeModified', function(e) {
      if (lastValue != me.getValue()) {
        lastValue = me.getValue();
        for (var i=0; i<me.changeListeners.length; i++) {
          me.changeListeners[i](e);
        }
      }
    });

    this.domElement.addEventListener('focus', function() {
      me.hasFocus=true;
      if (me._range) {
        var selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(me._range);
      }
    });
    this.domElement.addEventListener('blur', function() {me.hasFocus=false;});
  }

  SimpleEditor.prototype.getValue = function() {
    return this.domElement.innerText;
  };

  SimpleEditor.prototype.setValue = function(value) {
    this.domElement.innerText = value;
  };

  SimpleEditor.prototype.setHTML = function(value) {
    this.domElement.innerHTML = value;
  };

  SimpleEditor.prototype.focus = function() {
    this.domElement.focus();
  };

  SimpleEditor.prototype.blur = function() {
    this.domElement.blur();
  };

  SimpleEditor.prototype.onChange = function(callback) {
    this.changeListeners.push(callback);
  };

  SimpleEditor.prototype.replaceSelection = function(text) {
    var selection = window.getSelection(),
        textNode  = document.createTextNode(text);
    this._range.deleteContents();
    this._range.insertNode(textNode);
    this._range.selectNode(textNode);
    selection.removeAllRanges();
    selection.addRange(this._range);
  };

  // Thanks to
  // http://stackoverflow.com/questions/4811822/get-a-ranges-start-and-end-offsets-relative-to-its-parent-container/4812022#4812022
  // for the idea for the selection methods.

  SimpleEditor.prototype.getSelectionStart = function() {
    if (!this._range) return 0;
    var preCursorRange = this._range.cloneRange();
    preCursorRange.selectNodeContents(this.domElement);
    preCursorRange.setEnd(this._range.startContainer, this._range.startOffset);
    return preCursorRange.toString().length;
  };

  SimpleEditor.prototype.getSelectionEnd = function() {
    if (!this._range) return 0;
    var preCursorRange = this._range.cloneRange();
    preCursorRange.selectNodeContents(this.domElement);
    preCursorRange.setEnd(this._range.endContainer, this._range.endOffset);
    return preCursorRange.toString().length;
  };

  SimpleEditor.prototype.getSelection = function() {
    return window.getSelection().toString();
  };

  SimpleEditor.prototype.selectRange = function(range) {
    var selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
  };

  SimpleEditor.prototype.collapseSelectionLeft = function() {
    if (!this._range) return;
    this._range.collapse(true);
    this.selectRange(this._range);
  };

  SimpleEditor.prototype.collapseSelectionRight = function() {
    if (!this._range) return;
    this._range.collapse(false);
    this.selectRange(this._range);
  };

  SimpleEditor.prototype.cursorToEnd = function() {
    if (!this._range) {
      this._range = document.createRange();
    }
    this._range.selectNodeContents(this.domElement);
    this.collapseSelectionRight();
  };

  return SimpleEditor;
})();
