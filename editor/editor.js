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


    this.evalListeners = [];
    var me = this;
    this.editor.on('change', function() {
      clearTimeout(me.evalTimeout);
      me.evalTimeout = setTimeout(function() {
        me.ast = acorn.parse_dammit(me.editor.getValue());
        me.evalContents();
      }, 100);
    });

    var complete = function() {me.doCompletions();};
    this.editor.on('cursorActivity', complete);
    this.editor.on('focus', complete);

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

    // Preserves selected text if the user doesn't click on anything.
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
          // Don't mess up undo history
          var hist = me.editor.getHistory();
          me.editor.replaceSelection(lastSelected);
          hist.done.splice(hist.done.length-1);
          me.editor.setHistory(hist);
        }
        chosen = false;
      })
      .on("click", function() {
        me.editor.setCursor(me.editor.getCursor("end"));
        me.editor.focus();
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

  /**
   * Picks the longest node per start location. Thus, if you have:
   * var cursor = scene.cursor.fd(5);
   * and loc is in "scene", the available nodes are 
   *
   * var cursor = scene.cursor.fd(5);
   * scene.cursor.fd(5)
   * scene.cursor
   * scene
   *
   * "var cursor = scene.cursor.fd(5);" and "scene.cursor.fd(5)" will be 
   * returned. This strategy is meant to pick nodes that could be removed
   * and not complete destroy the integrity of the programs. If "scene" or
   * "scene.cursor" are remove, you're left with a method without an object.
   * If "scene.cursor.fd(5)" is removed, you're left with an assignment with no
   * value, but that's simpler to fill in.
   *
   * There are UI considerations for doing this too. In the interface, if the
   * user mouses over "fd" and "scene.cursor.fd(5)" would be highlighted. If
   * they then mouse over "scene" in order to grab that box, we want
   * "scene.cursor.fd(5)" to remain highlighted, not "scene".
   */
  Editor.prototype.getNodes = function(loc) {
    var matchingNodes = [];
    var me = this;

    var index = this.editor.indexFromPos(loc);
    function nodesAt(node) {
      if (node.start<=index && node.end>=index) {
        if (!matchingNodes[node.start] 
            || node.end > matchingNodes[node.start].end) {
          matchingNodes[node.start] = node;
        }
      }
    }
    acorn.walk.simple(this.ast, {
      Statement: nodesAt,
      Expression: nodesAt,
      ScopeBody: nodesAt
    });
    var nodes = [];
    for (var i=0; i<matchingNodes.length; i++) {
      if (matchingNodes[i]) {
        nodes.push(matchingNodes[i]);
      }
    }
    return nodes;
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

