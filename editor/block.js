var block = (function() {
  'use strict';

  var gotBlock = false;

  function contains(startPos, endPos, pos) {
    return startPos.line <= pos.line && pos.line <= endPos.line && 
           startPos.ch <= pos.ch && pos.ch <= endPos.ch;
  }

  function Block(cm, startPos, endPos) {
    gotBlock = true;
    this.cm = cm;
    this.startPos = startPos;
    this.endPos = endPos;
    this.container = cm.getWrapperElement();
    this.mark = cm.markText(startPos, endPos, {className: 'block'});
    this.blockHandle = document.createElement('div');
    this.blockHandle.classList.add('block-handle');
    cm.addWidget(startPos, this.blockHandle);
    document.body.appendChild(this.blockHandle);
  }

  function NumberBlock(cm,  startPos, endPos) {
    Block.call(this, cm, startPos, endPos);
    this.blockHandle.classList.add('number-block-handle');

    this.boundMouseMove = this.onMouseMove.bind(this);
    this.container.addEventListener('mousemove', this.boundMouseMove);
    this.blockHandle.addEventListener('mouseover', function() {console.log('hi');});
    this.blockHandle.addEventListener('mousedown', this.handleMouseDown.bind(this));
  }

  NumberBlock.prototype = Object.create(Block.prototype);

  NumberBlock.SENSITIVITY = 3;

  NumberBlock.watch = function (cm) {
    cm.getWrapperElement().addEventListener('mousemove',
      NumberBlock.onMouseMove.bind(NumberBlock, cm));
  };

  NumberBlock.onMouseMove = function (cm, e) {
    if (!gotBlock) {
      var mousePos = cm.coordsChar({top: e.pageY, left: e.pageX});
      var token = cm.getTokenAt(mousePos);

      if (token.type === "number") {
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

  NumberBlock.prototype.clear = function () {
    console.log('clear');
    this.mark.clear();
    this.blockHandle.parentNode.removeChild(this.blockHandle);
    this.container.removeEventListener('mousemove', this.boundMouseMove);
    gotBlock = false;
  };

  NumberBlock.prototype.onMouseMove = function (e) {
    var mousePos = this.cm.coordsChar({top: e.pageY, left: e.pageX});
    if (!contains(this.startPos, this.endPos, mousePos)) {
      this.clear();
    }
  };

  NumberBlock.prototype.handleMouseDown = function (e) {
    e.preventDefault();
    // So we don't clear
    this.container.removeEventListener('mousemove', this.boundMouseMove);

    this.cm.setSelection(this.startPos, this.endPos);
    var string = this.cm.getSelection();

    var decimal = string.indexOf('.');
    var numDecimals = decimal < 0 ? 0 : string.length - decimal - 1;
    var scale = 1 / Math.pow(10, numDecimals);
    console.log(scale);

    var lastY = e.pageY;

    var mouseMove = function (e) {
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

    var mouseUp = function (e) {
      document.removeEventListener('mouseup', mouseUp);
      document.removeEventListener('mousemove', mouseMove);
      this.clear();
    }.bind(this);

    document.addEventListener('mousemove', mouseMove);
    document.addEventListener('mouseup', mouseUp);
  };

  return{
    NumberBlock: NumberBlock
  };
})();