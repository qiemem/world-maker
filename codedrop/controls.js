/* global THREE */
/* global $ */

var CodeDrop = window.CodeDrop || {};

CodeDrop.PoleControls = function ( object, domElement ) {
  'use strict';

  this.object = object;
  this.domElement = typeof domElement === 'undefined' ? document : domElement;
  this.enabled = true;

  this.rotateSpeed = 2 * Math.PI;
  this.zoomSpeed = 0.001;
  this.panSpeed = 0.001;

  // If zoom hits 0 or Infinity, it breaks
  this.minDistance = 0.1;
  this.maxDistance = 10000.0;

  this.mouseDown = false;

  this.keys = {
    pan: 17 /*ctrl*/,
    zoom: 16
  };

  this.target = new THREE.Vector3();

  this.lastMouseX = -1;
  this.lastMouseY = -1;
  
  this.distance = function (newDist) {
    if (typeof newDist === 'undefined') {
      return this.object.position.distanceTo(this.target);
    } else {
      this.object.translateZ(newDist - this.distance());
      return this;
    }
  };

  this.zoom = function (scalar) {
    if (typeof scalar === 'undefined') {
      return 1.0 / this.distance();
    } else {
      return this.distance(this.distance() / scalar);
    }
  };

  this.panVertical = function (distance) {
    var lastPos = this.object.position.clone();
    this.object.translateY(distance);
    this.target.add(lastPos.sub(this.object.position).negate());
    return this;
  };

  this.rotate = function (angle) {
    var d = this.distance();
    this.object.translateZ(-d * (1 - Math.cos(angle)));
    this.object.translateX(d * Math.sin(angle));
    this.object.lookAt(this.target);
  };

  this.wheel = function (units) {
    this.zoom(Math.exp(this.zoomSpeed * units));
  };

  this.dragVertical = function (button, pixels) {
    this.panVertical(this.distance() * this.panSpeed * pixels);
  };

  this.dragHorizontal = function (button, pixels) {
    this.rotate ( Math.asin( - this.rotateSpeed * pixels / window.innerWidth));
  };

  this.handleMouseWheel = function (e, delta) {
    this.wheel(delta);
  }.bind(this);

  this.handleMouseMove = function (e) {
    // e.which prevents chrome from snagging when mouse goes off window
    // no way to prevent that in ff
    if (e.which && this.mouseDown) {
      if (this.lastMouseY >= 0 ) {
        this.dragVertical(e.which, e.pageY - this.lastMouseY);
        this.dragHorizontal(e.which, e.pageX - this.lastMouseX);
      }
      this.lastMouseX = e.pageX;
      this.lastMouseY = e.pageY;
    } else {
      this.lastMouseX = -1;
      this.lastMouseY = -1;
    }
  }.bind(this);

  $(domElement).mousemove(this.handleMouseMove);
  $(domElement).mousewheel(this.handleMouseWheel);
  $(document).mousedown(function() {this.mouseDown = true;}.bind(this));
  $(document).mouseup(function() {this.mouseDown = false;}.bind(this));

};
