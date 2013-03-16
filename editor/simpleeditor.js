SimpleEditor = (function() {
  SimpleEditor = function() {
    var me = this;
    this.domElement = document.createElement("div");
    this.domElement.classList.add("editor");
    this.domElement.contentEditable = "true";
    this.hasFocus = false;
    this.range = null;
    this.changeListeners = [];

    function trackSelection(e) {
      if (me.hasFocus) {
        me.range = window.getSelection().getRangeAt(0);
        console.log('save', me.range);
      }
    }
    document.addEventListener('mousedown', trackSelection);
    document.addEventListener('mouseup', trackSelection);
    document.addEventListener('keydown', trackSelection);
    document.addEventListener('keyup', trackSelection);
    this.onChange(trackSelection);

    var lastValue = "";
    this.domElement.addEventListener('DOMSubtreeModified', function(e) {
      if (me.getValue() != "" && lastValue != me.getValue()) {
        lastValue = me.getValue();
        for (var i=0; i<me.changeListeners.length; i++) {
          me.changeListeners[i](e);
        }
      }
    });

    this.domElement.addEventListener('focus', function() {
      me.hasFocus=true;
      if (me.range) {
        var selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(me.range);
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
    this.range.deleteContents();
    this.range.insertNode(textNode);
    this.range.selectNode(textNode);
    selection.removeAllRanges();
    selection.addRange(this.range);
  };

  // Thanks to
  // http://stackoverflow.com/questions/4811822/get-a-ranges-start-and-end-offsets-relative-to-its-parent-container/4812022#4812022
  // for the idea for the selection methods.

  SimpleEditor.prototype.getSelectionStart = function() {
    if (!this.range) return 0;
    var preCursorRange = this.range.cloneRange();
    preCursorRange.selectNodeContents(this.domElement);
    preCursorRange.setEnd(this.range.startContainer, this.range.startOffset);
    return preCursorRange.toString().length;
  };

  SimpleEditor.prototype.getSelectionEnd = function() {
    if (!this.range) return 0;
    var preCursorRange = this.range.cloneRange();
    preCursorRange.selectNodeContents(this.domElement);
    preCursorRange.setEnd(this.range.endContainer, this.range.endOffset);
    return preCursorRange.toString().length;
  };

  SimpleEditor.prototype.getSelection = function() {
    return window.getSelection().toString();
  };

  SimpleEditor.prototype.selectRange = function(range) {
    var selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    this.range = range.cloneRange();
  };

  SimpleEditor.prototype.collapseSelectionLeft = function() {
    if (!this.range) return;
    this.range.collapse(true);
    this.selectRange(this.range);
  };

  SimpleEditor.prototype.collapseSelectionRight = function() {
    if (!this.range) return;
    this.range.collapse(false);
    this.selectRange(this.range);
  };

  SimpleEditor.prototype.cursorToEnd = function() {
    if (!this.range) {
      this.range = document.createRange();
    }
    this.range.selectNodeContents(this.domElement);
    this.collapseSelectionRight();
  };

  SimpleEditor.prototype.select = function(start, end) {
    var startLoc = this.indexToNode(start - 1),
        endLoc   = this.indexToNode(end - 1);
    this.range.setStart(startLoc.node, startLoc.offset + 1);
    this.range.setEnd(endLoc.node, endLoc.offset + 1);
    this.selectRange(this.range);
  }

  SimpleEditor.prototype.indexToNode = function(index) {
    function indexToNode(index, node) {
      if (node.hasChildNodes()) {
        for (var i=0; i<node.childNodes.length; i++) {
          var c    = node.childNodes[i],
              text = c.textContent;
          if (index < text.length) {
            return indexToNode(index, c);
          }
          index -= text.length
        }
      } else {
        return {node: node, offset: index}
      }
    }
    return indexToNode(index, this.domElement);
  };

  return SimpleEditor;
})();
