Editor = (function() {
  function Editor(container) {
    this.container = container;
    this.editor = document.createElement("textarea");
    this.editor.classList.add("editor");
    this.container.appendChild(this.editor);
    this.visible = false;
    this.evalTimeout = -1;

    this.evalListeners = [];
    var self = this;
    //this.editor.onchange = function() { console.log('test'); };
    this.editor.addEventListener('input', function() {
      clearTimeout(self.evalTimeout);
      self.evalTimeout = setTimeout(function() {
        for (var i = 0; i < self.evalListeners.length; i++) {
          self.evalListeners[i]();
        }
        eval(self.editor.value);
      }, 100);
    });
  }

  Editor.prototype.slideIn = function() {
    $(this.editor).animate({left: 0});
    this.editor.focus();
    this.visible = true;
  }

  Editor.prototype.slideOut = function() {
    $(this.editor).animate({left: -$(this.editor).width()});
    this.editor.blur();
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


  return Editor;
}());

