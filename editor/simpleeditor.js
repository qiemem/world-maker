SimpleEditor = (function() {
  SimpleEditor = function() {
    var me = this;
    this.domElement = document.createElement("div");
    this.domElement.classList.add("editor");
    this.domElement.contentEditable = "true";
    this.range = null;
    this.changeListeners = [];

    function trackSelection(e) {
      //console.log('track', e);
      if (me.hasFocus()) {
        // getRange() updates the stored range
        me._updateRange();
        //console.log("save", e.type, me.getSelectionStart(), me.getSelectionEnd(), me.getRange());
      }
    }
    //document.addEventListener('mousedown', trackSelection);
    document.addEventListener('mouseup', trackSelection);
    //document.addEventListener('mouseclick', trackSelection);
    //document.addEventListener('keydown', trackSelection);
    document.addEventListener('keyup', trackSelection);
    document.addEventListener('selectionchange', trackSelection);
    //document.addEventListener('keypress', trackSelection);

    var lastValue = "";
    this.domElement.addEventListener('DOMSubtreeModified', function(e) {
      if (me.getValue() != "" && lastValue != me.getValue()) {
        //console.log('change', me.getSelectionStart(), me.getSelectionEnd());
        lastValue = me.getValue();
        for (var i=0; i<me.changeListeners.length; i++) {
          me.changeListeners[i](e);
        }
      }
    });

    this.domElement.addEventListener('focus', function() {
      if (me.getRange()) {
        var selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(me.getRange());
      }
    });
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

  SimpleEditor.prototype.hasFocus = function() {
    return this.domElement.contains(window.getSelection().focusNode);
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

  SimpleEditor.prototype.getRange = function() {
    /*
    var selection = window.getSelection();
    // Always prefer the current range object if we've got it.
    if (selection.rangeCount) {
      var range = selection.getRangeAt(0);
      if (this.range.startContainer === range.startContainer &&
          this.range.startOffset    === range.startOffset    &&
          this.range.endContainer   === range.endContainer   &&
          this.range.endOffset      === range.endOffset      &&
          this.domElement.contains(range.commonAncestorContainer)) {
        this.range = range.cloneRange();
      }
    }
    */
    if (!this.range) {
      this.range = document.createRange();
    }
    return this.range
  }

  SimpleEditor.prototype.replaceSelection = function(text) {
    var selection = window.getSelection(),
        textNode  = document.createTextNode(text),
        range     = this.getRange();
    range.deleteContents();
    range.insertNode(textNode);
    range.selectNode(textNode);
    selection.removeAllRanges();
    selection.addRange(range);
  };

  // Thanks to
  // http://stackoverflow.com/questions/4811822/get-a-ranges-start-and-end-offsets-relative-to-its-parent-container/4812022#4812022
  // for the idea for the selection methods.

  SimpleEditor.prototype.getSelectionStart = function() {
    if (!this.getRange()) return 0;
    var range = this.getRange();
        preCursorRange = range.cloneRange();
    preCursorRange.selectNodeContents(this.domElement);
    preCursorRange.setEnd(this.getRange().startContainer, this.getRange().startOffset);
    // range.toString() doesn't show newlines (but selection.toString()
    // does...), so we extract the dom content of the range, stick it in a div
    // and use that divs innerText, which will have the newlines.
    var tempDiv = document.createElement('div');
    tempDiv.appendChild(preCursorRange.cloneContents());
    return tempDiv.innerText.length;
  };

  SimpleEditor.prototype.getSelectionEnd = function() {
    if (!this.getRange()) return 0;
    var range = this.getRange();
        preCursorRange = range.cloneRange();
    preCursorRange.selectNodeContents(this.domElement);
    preCursorRange.setEnd(this.getRange().endContainer, this.getRange().endOffset);
    // range.toString() doesn't show newlines (but selection.toString()
    // does...), so we extract the dom content of the range, stick it in a div
    // and use that divs innerText, which will have the newlines.
    var tempDiv = document.createElement('div');
    tempDiv.appendChild(preCursorRange.cloneContents());
    return tempDiv.innerText.length;
  };

  SimpleEditor.prototype.getSelection = function() {
    return window.getSelection().toString();
  };

  SimpleEditor.prototype._updateRange = function() {
    this.range = window.getSelection().getRangeAt(0);
  };

  SimpleEditor.prototype.selectRange = function(range) {
    var selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    this.range = range.cloneRange();
  };

  SimpleEditor.prototype.collapseSelectionLeft = function() {
    var range = this.getRange();
    range.collapse(true);
    this.selectRange(range);
  };

  SimpleEditor.prototype.collapseSelectionRight = function() {
    var range = this.getRange();
    range.collapse(false);
    this.selectRange(range);
  };

  SimpleEditor.prototype.cursorToEnd = function() {
    var range = this.getRange();
    range.selectNodeContents(this.domElement);
    this.selectRange(range);
    this.collapseSelectionRight();
  };

  SimpleEditor.prototype.select = function(start, end) {
    var startLoc = this.indexToNode(start - 1),
        endLoc   = this.indexToNode(end - 1),
        range    = this.getRange();
    range.setStart(startLoc.node, startLoc.offset + 1);
    range.setEnd(endLoc.node, endLoc.offset + 1);
    this.selectRange(range);
  }

  SimpleEditor.prototype.indexToNode = function(index) {
    function indexToNode(index, node) {
      if (node.hasChildNodes()) {
        for (var i=0; i<node.childNodes.length; i++) {
          var c    = node.childNodes[i],
              text = c.innerText || c.textContent;
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
