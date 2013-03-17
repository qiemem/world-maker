var block = (function() {
  'use strict';

  var gotBlock = null;

  function contains(startPos, endPos, pos) {
    return startPos.line <= pos.line && pos.line <= endPos.line && 
           startPos.ch <= pos.ch && pos.ch <= endPos.ch;
  }

  function Block(cm, startPos, endPos) {
    gotBlock = this;
    this.priority = 0;
    this.cm = cm;
    this.startPos = startPos;
    this.endPos = endPos;
    this.container = cm.getWrapperElement();
    this.mark = cm.markText(startPos, endPos, {className: 'block'});
    this.blockHandle = document.createElement('div');
    this.blockHandle.classList.add('block-handle');
    cm.addWidget(startPos, this.blockHandle);
    document.body.appendChild(this.blockHandle);

    this.boundMouseMove = this.onMouseMove.bind(this);
    this.container.addEventListener('mousemove', this.boundMouseMove);
    this.blockHandle.addEventListener('mousedown', this.handleMouseDown.bind(this));
  }

  Block.prototype.clear = function () {
    console.log('clear');
    this.mark.clear();
    this.container.removeEventListener('mousemove', this.boundMouseMove);
    this.blockHandle.parentNode.removeChild(this.blockHandle);
    gotBlock = false;
  };

  Block.prototype.onMouseMove = function (e) {
    var mousePos = this.cm.coordsChar({top: e.pageY, left: e.pageX});
    if (!contains(this.startPos, this.endPos, mousePos)) {
      this.clear();
    }
  };

  Block.prototype.handleMouseDown = function (e) {
    e.preventDefault();
    // So we don't clear
    this.container.removeEventListener('mousemove', this.boundMouseMove);

    this.cm.setSelection(this.startPos, this.endPos);

    this.boundHandleMouseUp = this.handleMouseUp.bind(this);
    document.addEventListener('mouseup', this.boundHandleMouseUp);
  };

  Block.prototype.handleMouseUp = function (e) {
    document.removeEventListener('mouseup', this.boundHandleMouseUp);
    this.clear();
  };

  function NumberBlock(cm,  startPos, endPos) {
    this.priority = NumberBlock.PRIORITY;
    Block.call(this, cm, startPos, endPos);
    this.blockHandle.classList.add('number-block-handle');
  }

  NumberBlock.prototype = Object.create(Block.prototype);

  NumberBlock.SENSITIVITY = 3;
  NumberBlock.PRIORITY = 10;

  NumberBlock.watch = function (cm) {
    cm.getWrapperElement().addEventListener('mousemove',
      NumberBlock.onMouseMove.bind(NumberBlock, cm));
  };

  NumberBlock.onMouseMove = function (cm, e) {
    if (!gotBlock || gotBlock.priority < NumberBlock.PRIORITY) {
      var mousePos = cm.coordsChar({top: e.pageY, left: e.pageX});
      var token = cm.getTokenAt(mousePos);

      if (token.type === "number") {
        if (gotBlock) {
          gotBlock.clear();
        }
        var startPos   = {line: mousePos.line, ch: token.start},
        endPos     = {line: mousePos.line, ch: token.end},
        checkStart = {line: mousePos.line, ch: token.start - 1};
        
        // Code Mirror doesn't detect, eg, ".1" properly, so check for it.
        if (token.string.indexOf('.') < 0 &&
            checkStart.ch >= 0 && 
            cm.getRange(checkStart, endPos).indexOf('.') >= 0) {
          startPos = checkStart;
        }
        new NumberBlock(cm, startPos, endPos);
      }
    }
  };

  NumberBlock.prototype.handleMouseDown = function (e) {
    Block.prototype.handleMouseDown.call(this, e);

    var string = this.cm.getSelection();

    var decimal = string.indexOf('.');
    var numDecimals = decimal < 0 ? 0 : string.length - decimal - 1;
    var scale = 1 / Math.pow(10, numDecimals);

    var lastY = e.pageY;

    this.boundHandleMouseMove = function (e) {
      e.preventDefault();

      var value = parseFloat(this.cm.getSelection());

      var curY = e.pageY;
      var diff = Math.round((lastY - curY)/NumberBlock.SENSITIVITY);
      if (Math.abs(diff) >= 1) {
        var changeBy = numDecimals === 0 ? diff : diff * scale;
        var newStr = (value + changeBy).toFixed(numDecimals);
        this.cm.replaceSelection(newStr);
        lastY = curY;

        this.endPos.ch = this.startPos.ch + newStr.length;
      }

      this.blockHandle.style.top = curY + 'px';
    }.bind(this);

    document.addEventListener('mousemove', this.boundHandleMouseMove);
  };

  NumberBlock.prototype.handleMouseUp  = function (e) {
    document.removeEventListener('mousemove', this.boundHandleMouseMove);
    Block.prototype.handleMouseUp.call(this, e);
  };

  function CodeBlock(cm, startPos, endPos) {
    this.priority = CodeBlock.PRIORITY;
    Block.call(this, cm, startPos, endPos);
  }

  CodeBlock.prototype = Object.create(Block.prototype);

  CodeBlock.PRIORITY = 0;

  CodeBlock.watch = function (cm, getAST) {
    cm.getWrapperElement().addEventListener('mousemove',
      CodeBlock.onMouseMove.bind(CodeBlock, cm, getAST));
  };

  CodeBlock.onMouseMove = function (cm, getAST, e) {
    if (!gotBlock || gotBlock.priority < CodeBlock.PRIORITY) {
      var mousePos = cm.coordsChar({top: e.pageY, left: e.pageX}),
          node = CodeBlock.getSmallestNode(cm, getAST, mousePos);
      if (node) {
        if (gotBlock) {
          gotBlock.clear();
        }
        var startPos = cm.posFromIndex(node.start),
            endPos = cm.posFromIndex(node.end);

        new CodeBlock(cm, startPos, endPos);
      }
    }
  };

  CodeBlock.getNodes = function (cm, getAST, pos) {
    var matchingNodes = [];
    var index = cm.indexFromPos(pos);
    // TODO: Include semicolons in VariableDeclaration
    acorn.walk.simple(getAST(), {
      Statement: function(node) {
        if (node.start <= index && node.end > index) {
          matchingNodes.push(node);
        }
      }
    });
    return matchingNodes;
  };

  CodeBlock.getSmallestNode = function(cm, getAST, pos) {
    var matchingNodes = CodeBlock.getNodes(cm, getAST, pos);
    var smallest = null, smallestLength = Infinity;
    var length = matchingNodes.length;
    for (var i = 0; i < length; i++) {
      var node = matchingNodes[i];
      var nodeLength = node.end - node.start;
      if (nodeLength < smallestLength) {
        smallest = node;
        smallestLength = nodeLength;
      }
    }
    return smallest;
  };

  return{
    NumberBlock: NumberBlock,
    CodeBlock:   CodeBlock
  };
})();