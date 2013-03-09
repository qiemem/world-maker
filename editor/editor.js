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
        self.evalContents();
      }, 100);
    });

    var complete = function() {self.doCompletions();};
    d3.select(this.editor).on('click', complete).on('keydown', complete).on('focus', complete);
  }

  Editor.prototype.evalContents = function() {
    for (var i = 0; i < this.evalListeners.length; i++) {
      this.evalListeners[i]();
    }
    eval(this.editor.value);
    console.log('Eval successful');
  }

  Editor.prototype.slideIn = function() {
    d3.select(this.drawer).transition().style("left", "0px");
    this.editor.focus();
    this.visible = true;
  }

  Editor.prototype.slideOut = function() {
    var drawer = d3.select(this.drawer);
    drawer.transition().style("left", "-" + drawer.style("width"));
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

  Editor.prototype.doCompletions = function() {
    this.showCompletions(this.getCompletions(this.editor.selectionStart));
  }

  Editor.prototype.getCompletions = function(position) {
    return ["cursor.cube()", "cursor.sphere()", ".color('red')"];
  }

  Editor.prototype.showCompletions = function(completions) {
    console.log(completions);
    var li = d3.select(this.completionsList).selectAll("li").data(completions);
    var self = this;
    li.enter().append("li")
      .text(function (d) {return d;})
      .classed("completion", 1)
      .on("mouseover", function(d) {
        var editor = self.editor;
        var text = editor.value;
        var insertStart = editor.selectionStart;
        var insertEnd = editor.selectionEnd;
        editor.value = text.slice(0, insertStart) + d + text.slice(insertEnd);
        editor.selectionStart = insertStart;
        editor.selectionEnd = insertStart + d.length;
        self.evalContents();
      })
      .on("mouseout", function(d) {
        var editor = self.editor;
        var text = editor.value;
        var insertStart = editor.selectionStart;
        var insertEnd = editor.selectionEnd;
        editor.value = text.slice(0,insertStart) + text.slice(insertEnd);
        editor.selectionStart = editor.selectionEnd = insertStart;
        self.evalContents();
      })
      .on("click", function() {
        self.editor.selectionStart = self.editor.selectionEnd;
      })
        ;
      
    li.exit().remove();
  }

  return Editor;
}());

