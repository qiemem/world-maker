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
        // Since this changes the dom content of the editor, the Range object
        // will get screwed up. Thus, we keep track of cursor by character
        // index
        var start = me.editor.getSelectionStart(),
            end   = me.editor.getSelectionEnd();
        me.parsedCode = me.updateEditorTree();
        me.editor.setHTML(me.parsedCode.innerHTML);
        var length = me.editor.getValue().length;
        me.editor.select(Math.min(start, length), Math.min(end, length));
        me.evalContents();
      }, 100);
    }
    this.editor.onChange(changeListener);

    var complete = function() {me.doCompletions();};
    this.editor.domElement.addEventListener("mousedown", complete);
    this.editor.domElement.addEventListener("mouseup", complete);
    this.editor.domElement.addEventListener("keydown", complete);
    this.editor.domElement.addEventListener("keyup", complete);
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
      });
      
    li.exit().remove();
  };

  Editor.prototype.updateEditorTree = function() {
    var text = this.editor.getValue(),
        ast  = acorn.parse_dammit(text);
    window.ast = ast;

    var tree = {
      type:     "Program",
      start:    0,
      end:      text.length,
      children: []
    }
    
    function insert(tree, node) {
      for (var i=0; i<tree.children.length; i++) {
        var c = tree.children[i];
        if (node.end <= c.start) {
          // node is before this child; insert it here
          tree.children.splice(i, 0, node);
          return
        } else if (c.start <= node.start && node.end <= c.end) {
          insert(c, node);
          return;
        } else if (node.start <= c.start && c.end <= node.end) {
          //tree.children[i] = node;
          tree.children.splice(i,1);
          insert(node, c);
          i--;
        }
      }
      // Node didn't belong in any child; push it on the end:
      tree.children.push(node);
    }

    function normalize(astNode) {
      return {
        type: astNode.type,
        start: astNode.start,
        end: astNode.end,
        children: []
      }
    }

    function insertASTNode(astNode) {
      insert(tree, normalize(astNode));
    }

    acorn.walk.simple(ast, {
      Expression: insertASTNode,
      Statement: insertASTNode,
      ScopeBody: insertASTNode
    });

    function textNode(start, end) {
      /*
      var frag = document.createDocumentFragment();
      var i = start,
          substr = text.substr(start, end-start);
      while (i = substr.indexOf("\n") >= 0) {
        frag.appendChild(document.createTextNode(substr.substr(0, i)));
        frag.appendChild(document.createElement("br"));
        substr = substr.substr(i+1);
      }
      frag.appendChild(document.createTextNode(substr.substr(i)));
      return frag;
      */
      return document.createTextNode(text.substr(start, end-start));
    }

    function makeTreeDOM(tree) {
      var elt = document.createElement("span");
      elt.classList.add(tree.type);
      var written = tree.start;
      for (var i=0; i < tree.children.length; i++) {
        var c = tree.children[i];
        if (c.start > written) {
          elt.appendChild(textNode(written, c.start));
        }
        elt.appendChild(makeTreeDOM(c));
        written = c.end;
      }
      if (tree.end > written) {
        elt.appendChild(textNode(written, tree.end));
      }
      return elt;
    }
    var parsedCode = makeTreeDOM(tree);
    parsedCode.innerHTML = parsedCode.innerHTML.replace(/\n/g, "<br/>");
    return parsedCode;
  };

    
  return Editor;
}());
