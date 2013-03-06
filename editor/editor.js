Editor = (function() {
  function Editor(container) {
    this.container = container;
    this.editor = document.createElement("textarea");
    this.editor.classList.add("editor");
    this.container.appendChild(this.editor);
    this.visible = false;
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
  return Editor;
}());

