CodeDrop = window.CodeDrop || {};
CodeDrop.PoleControls = function ( object, domElement ) {

  this.object = object;
  this.domElement = typeof domElement === 'undefined' ? document : domElement;
  this.enabled = true;

  this.rotateSpeed = 1.0;
  this.zoomSpeed = 0.001;
  this.panSpeed = 0.001;

  // If zoom hits 0 or Infinity, it breaks
  this.minDistance = 0.1;
  this.maxDistance = 10000.0;

  this.keys = {
    pan: 17 /*ctrl*/,
    zoom: 16
  }

  this.target = new THREE.Vector3();

  this.lastY = -1;
  
  this.distance = function (newDist) {
    if (typeof newDist === 'undefined') {
      return this.object.position.distanceTo(this.target);
    } else {
      //this.object.position.sub(this.target).normalize().multiplyScalar(newDist);
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

  this.wheel = function (units) {
    this.zoom(Math.exp(this.zoomSpeed * units));
  };

  this.dragVertical = function (pixels) {
    this.panVertical(this.distance() * this.panSpeed * pixels);
  };


  this.panVertical = function (distance) {
    var lastPos = this.object.position.clone();
    this.object.translateY(distance);
    this.target.add(lastPos.sub(this.object.position).negate());
    return this;
  };

  this.handleMouseWheel = function (e, delta) {
    this.wheel(delta);
  }.bind(this);

  this.handleMouseMove = function (e) {
    if (e.which === 1) {
      if (this.lastY >= 0 ) {
        this.dragVertical(e.pageY - this.lastY);
      } 
      this.lastY = e.pageY;
    } else {
      this.lastY = -1;
    }
  }.bind(this);

  $(domElement).mousemove(this.handleMouseMove);
  $(domElement).mousewheel(this.handleMouseWheel);

};
