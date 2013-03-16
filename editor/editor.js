Editor = (function() {
  function Editor(container) {
    this.container = container;
    this.drawer = document.createElement("div");
    this.drawer.classList.add("drawer");
    this.editor = new SimpleEditor();
    this.drawer.appendChild(this.editor.domElement);

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


    this.evalListeners = [];
    var me = this;
    function changeListener() {
      clearTimeout(me.evalTimeout);
      me.evalTimeout = setTimeout(function() {
        me.ast = acorn.parse_dammit(me.editor.getValue());
        me.evalContents();
      }, 100);
    }
    this.editor.onChange(changeListener);
    //this.editor.domElement.addEventListener("focus", changeListener);

    var complete = function() {me.doCompletions();};
    this.editor.domElement.addEventListener("mousedown", complete);
    this.editor.domElement.addEventListener("mouseup", complete);
    this.editor.domElement.addEventListener("keydown", complete);
    this.editor.domElement.addEventListener("keyup", complete);
    //this.editor.on('cursorActivity', complete);
    //this.editor.on('focus', complete);
/*
    this.editor.getScrollerElement().addEventListener("mousemove", function(e) {
      var pos = {top: e.pageY, left: e.pageX};
      var loc = me.editor.coordsChar(pos);
      var node = me.getSmallestNode(loc);
      if (node) {
        console.log(node);
        console.log(me.editor.getValue().substr(node.start, node.end-node.start));
      }
      var token = me.editor.getTokenAt(loc);
      me.mouseOnToken(loc, token);
    });
    */
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
    this.showCompletions(this.getCompletions(this.editor.getSelectionStart()));
  }

  Editor.prototype.getCompletions = function(position) {
    return [ ";\n"
      ,"cursor"
      ,"scene"
      ,".cube()"
      , ".sphere()"
      , ".color('red')"
      , ".rgb(0.20, 0.50, 0.70)"
      , ".hsl(0.20, 1.0, 0.5)"
      , ".forward(1.0)"
      , ".backward(1.0)"
      , ".right(90)"
      , ".left(90)"
      , ".up(90)"
      , ".down(90)"
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

    // TODO: Make this play nice with undo history
    var lastSelected;
    var chosen;
    li.enter().append("li")
      .text(function (d) {return d;})
      .classed("completion", 1)
      .on("mouseover", function(d) {
        lastSelected = me.editor.getSelection();
        me.editor.replaceSelection(d);
      })
      .on("mouseout", function(d) {
        if (!chosen) {
          me.editor.replaceSelection(lastSelected);
        }
        chosen = false;
      })
      .on("click", function() {
        me.editor.collapseSelectionRight();
        chosen = true;
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
        this.numberSelector.style.display = "inline";
        var startLoc = {line: loc.line, ch: token.start};
        var endLoc = {line: loc.line, ch: token.end};

        // Code Mirror doesn't detect, eg, ".1" properly, so check for it.
        var checkStart = {line: loc.line, ch: token.start - 1};
        if (token.string.indexOf(".")<0 
            && this.editor.getRange(checkStart, endLoc).indexOf(".") >= 0) {
          startLoc = checkStart;
        }

        var string = this.editor.getRange(startLoc, endLoc);
        if (string.charAt(0) === ".") {
          string = "0" + string;
        }
          
        var startPos = this.editor.cursorCoords(startLoc);
        var endPos = this.editor.cursorCoords(endLoc);

        this.numberSelector.style.top = startPos.top + "px";
        this.numberSelector.style.left = startPos.left + "px";
        this.numberSelector.style.width = (endPos.left - startPos.left) + "px";

        var decimal = string.indexOf(".");
        var numDecimals = decimal < 0 ? 0 : string.length - decimal - 1;
        var value = parseFloat(string);
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

          function stop(e) {
            document.removeEventListener("mousemove", drag);
            document.removeEventListener("mouseup", stop);
          }

          document.addEventListener("mousemove", drag);
          document.addEventListener("mouseup", stop);
        };
        break;
      default:
        this.numberSelector.style.display = "none";
        this.numberSelector.onmousedown = null;
    }
  }

  Editor.prototype.getNodes = function(loc) {
    var matchingNodes = [];
    var me = this;
    var index = this.editor.indexFromPos(loc);
    acorn.walk.simple(this.ast, {
      Statement: function(node) {
        if (node.start <= index && node.end > index) {
          matchingNodes.push(node);
        }
      }
    });
    return matchingNodes;
  }

  Editor.prototype.getSmallestNode = function(loc) {
    var matchingNodes = this.getNodes(loc);
    var smallest = null, smallestLength = Infinity;
    var length = matchingNodes.length;
    for (var i=0; i<length; i++) {
      var node = matchingNodes[i];
      var nodeLength = node.end - node.start;
      if (nodeLength < smallestLength) {
        smallest = node;
        smallestLength = nodeLength;
      }
    }
    return smallest;
  }
    
  return Editor;
}());
