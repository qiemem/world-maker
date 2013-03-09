Editor = (function() {
  function Editor(container) {
    this.container = container;
    this.drawer = document.createElement("div");
    this.drawer.classList.add("drawer");
    this.editor = document.createElement("textarea");
    this.editor.classList.add("editor");
    this.drawer.appendChild(this.editor);

    this.completions = document.createElement("div");
    this.completions.classList.add("completions");
    this.drawer.appendChild(this.completions);

    this.completionsList = document.createElement("ul");
    this.completionsList.classList.add("completions-list");
    this.completions.appendChild(this.completionsList);

    this.container.appendChild(this.drawer);
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
        console.log('Eval successful');
      }, 100);
    });
  }

  Editor.prototype.slideIn = function() {
    $(this.drawer).animate({left: 0});
    this.drawer.focus();
    this.visible = true;
  }

  Editor.prototype.slideOut = function() {
    $(this.drawer).animate({left: -$(this.drawer).width()});
    this.drawer.blur();
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

