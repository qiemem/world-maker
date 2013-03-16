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
    document.addEventListener('mouseup', trackSelection);
    document.addEventListener('keyup', trackSelection);
    document.addEventListener('selectionchange', trackSelection);

    this.domElement.addEventListener('keyup', function() {me.change();});
    this.domElement.addEventListener('input', function() {me.change();});

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
    this.change();
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

  SimpleEditor.prototype.change = function() {
    //console.log('change', this.getSelectionStart(), this.getSelectionEnd());
    lastValue = this.getValue();
    for (var i=0; i<this.changeListeners.length; i++) {
      this.changeListeners[i]();
    }
  }

  SimpleEditor.prototype.getRange = function() {
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
    this.change();
  };

  // Thanks to
  // http://stackoverflow.com/questions/4811822/get-a-ranges-start-and-end-offsets-relative-to-its-parent-container/4812022#4812022
  // for the idea for the selection methods.

  // FIXME: This methods don't account for line breaks due to divs. It's not
  // a super big deal in this case  as divs get swapped out for brs with the
  // AST embedding stuff, but it makes it so that the cursor doesn't change
  // lines when the user presses enter (though the newline is created).
  SimpleEditor.prototype.getSelectionStart = function() {
    if (!this.getRange()) return 0;
    var range = this.getRange(),
        preCursorRange = range.cloneRange();
    //console.log(range.cloneContents());
    preCursorRange.selectNodeContents(this.domElement);
    preCursorRange.setEnd(this.getRange().startContainer, this.getRange().startOffset);
    // range.toString() doesn't show newlines (but selection.toString()
    // does...), so we extract the dom content of the range, stick it in a div
    // and use that divs innerText, which will have the newlines.
    var tempDiv = document.createElement('div');
    tempDiv.appendChild(preCursorRange.cloneContents());
    //console.log(preCursorRange.cloneContents());
    return tempDiv.innerText.length;
  };

  SimpleEditor.prototype.getSelectionEnd = function() {
    if (!this.getRange()) return 0;
    var range = this.getRange(),
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
    var startLoc = this.indexToNode(start),
        endLoc   = this.indexToNode(end),
        range    = this.getRange();
    range.setStart(startLoc.node, startLoc.offset);
    range.setEnd(endLoc.node, endLoc.offset);
    this.selectRange(range);
  }

  SimpleEditor.prototype.indexToNode = function(index) {
    function indexToNode(index, node) {
      if (index === 0) {
        return {node: node, offset: 0}
      }
      if (node.hasChildNodes()) {
        for (var i=0; i<node.childNodes.length; i++) {
          var c    = node.childNodes[i],
              text = c.innerText || c.textContent;
          if (c.tagName === "BR") {
            index--;
          } else if (index < text.length) {
            return indexToNode(index, c);
          } else {
            index -= text.length
          }
          if (index === 0) {
            return {node: node, offset: i+1}
          }
        }
      } else {
        return {node: node, offset: index}
      }
    }
    return indexToNode(index, this.domElement);
  };

  return SimpleEditor;
})();
