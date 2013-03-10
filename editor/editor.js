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

    this.numberSelector = document.createElement("div");
    this.numberSelector.id = ("number-selector");
    container.appendChild(this.numberSelector);

    this.ast;

    this.evalListeners = [];
    var me = this;
    this.editor.on('change', function() {
      clearTimeout(me.evalTimeout);
      me.evalTimeout = setTimeout(function() {
        me.ast = self.acorn.parse_dammit(me.editor.getValue());
        me.evalContents();
      }, 100);
    });

    var complete = function() {me.doCompletions();};
    this.editor.on('cursorActivity', complete);
    this.editor.on('focus', complete);

    this.editor.getScrollerElement().addEventListener("mousemove", function(e) {
      var pos = {top: e.pageY, left: e.pageX};
      var loc = me.editor.coordsChar(pos);
      var token = me.editor.getTokenAt(loc);
      me.mouseOnToken(loc, token);
    });
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
    return [ ";\n"
      ,"cursor"
      ,".cube()"
      , ".sphere()"
      , ".color('red')"
      , ".rgb(0.20, 0.50, 0.70)"
      , ".hsl(0.20, 1.0, 0.5)"
      , ".forward(1.0)"
      , ".backward(1.0)"
      , ".right(90)"
      , ".left(90)"
      , ".upward(90)"
      , ".downward(90)"
      , ".rollRight(90)"
      , ".rollLeft(90)"
      , ".grow(1.0)"
      , ".growWide(1.0)"
      , ".growLong(1.0)"
      , ".growTall(1.0)"
      , ".transparency(0.5)"];
  }

  Editor.prototype.showCompletions = function(completions) {
    var li = d3.select(this.completionsList).selectAll("li").data(completions);
    var me = this;
    li.enter().append("li")
      .text(function (d) {return d;})
      .classed("completion", 1)
      .on("mouseover", function(d) {
        me.editor.replaceSelection(d);
      })
      .on("mouseout", function(d) {
        me.editor.replaceSelection("");
      })
      .on("click", function() {
        me.editor.setCursor(me.editor.getCursor("end"));
        me.editor.focus();
      })
        ;
      
    li.exit().remove();
  }

  /**
   * loc - {line, ch}
   */
  Editor.prototype.mouseOnToken = function(loc, token) {
    switch (token.type) {
      case "number":
        // TODO: Make this tolerant of ".1"
        this.numberSelector.style.display = "inline";
        var startLoc = {line: loc.line, ch: token.start};
        var endLoc = {line: loc.line, ch: token.end};
        var startPos = this.editor.cursorCoords(startLoc);
        var endPos = this.editor.cursorCoords(endLoc);

        this.numberSelector.style.top = startPos.top + "px";
        this.numberSelector.style.left = startPos.left + "px";

        var string = token.string;
        var decimal = token.string.indexOf(".");
        var numDecimals = decimal < 0 ? 0 : string.length - decimal - 1;
        var value = parseInt(token.string);
        var me = this;
        this.numberSelector.onmousedown = function(e) {
          var lastVal = e.pageY;

          function drag(e) {
            var curVal = e.pageY;
            var diff = Math.round((lastVal - curVal)/2);
            var changeBy = numDecimals === 0 ? diff : diff / Math.pow(10, numDecimals);
            var newStr = (value + changeBy).toFixed(numDecimals);
            me.editor.replaceRange(newStr, startLoc, endLoc);
            endLoc.ch = startLoc.ch + newStr.length;
            me.evalContents();
          }

          window.addEventListener("mousemove", drag);
          window.addEventListener("mouseup", stop);
          function stop(e) {
            window.removeEventListener("mousemove", drag);
            window.removeEventListener("mouseup", stop);
          }
        };
        break;
      default:
        this.numberSelector.style.display = "none";
        this.numberSelector.onmousedown = null;
        this.editor.focus();
    }
  }

  return Editor;
}());

