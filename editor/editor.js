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

    this.evalListeners = [];
    var self = this;
    this.editor.on('change', function() {
      clearTimeout(self.evalTimeout);
      self.evalTimeout = setTimeout(function() {
        self.evalContents();
      }, 100);
    });
    var complete = function() {self.doCompletions();};
    this.editor.on('cursorActivity', complete);
    this.editor.on('focus', complete);
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
    return ["cursor"
      ,".cube()"
      , ".sphere()"
      , ".color('red')"
      , ".rgb(.2, .5, .7)"
      , ".hsl(.2, 1, .5)"
      , ".forward(1)"
      , ".backward(1)"
      , ".right(90)"
      , ".left(90)"
      , ".upward(90)"
      , ".downward(90)"
      , ".rollRight(90)"
      , ".rollLeft(90)"
      , ".grow(1)"
      , ".growWide(1)"
      , ".growLong(1)"
      , ".growTall(1)"
      , ".transparency(.5)"];
  }

  Editor.prototype.showCompletions = function(completions) {
    var li = d3.select(this.completionsList).selectAll("li").data(completions);
    var self = this;
    li.enter().append("li")
      .text(function (d) {return d;})
      .classed("completion", 1)
      .on("mouseover", function(d) {
        self.editor.replaceSelection(d);
      })
      .on("mouseout", function(d) {
        self.editor.replaceSelection("");
      })
      .on("click", function() {
        self.editor.setCursor(self.editor.getCursor("end"));
        self.editor.focus();
      })
        ;
      
    li.exit().remove();
  }

  return Editor;
}());

