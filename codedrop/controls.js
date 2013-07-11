CodeDrop = window.CodeDrop || {};
CodeDrop.PoleControls = function ( object, domElement ) {

  this.object = object;
  this.domElement = typeof domElement === 'undefined' ? document : domElement;
  this.enabled = true;

  this.rotateSpeed = 1.0;
  this.zoomSpeed = 0.001;
  this.panSpeed = 0.3;

  // If zoom hits 0 or Infinity, it breaks
  this.minDistance = 0.1;
  this.maxDistance = 10000.0;

  this.keys = {
    pan: 17 /*ctrl*/,
    zoom: 16
  }

  this.target = new THREE.Vector3();
  
  this.distance = function (newDist) {
    if (typeof newDist === 'undefined') {
      return this.object.position.distanceTo(this.target);
    } else {
      this.object.position.sub(this.target).normalize().multiplyScalar(newDist);
      return this;
    }
  };

  this.zoom = function (scalar) {
    console.log(scalar);
    return this.distance(this.distance() / scalar);
  };

  this.wheel = function (units) {
    this.zoom(Math.exp(this.zoomSpeed * units));
  };

  this.handleMouseWheel = function (e, delta) {
    this.wheel(delta);
  }.bind(this);

  $(domElement).bind('mousewheel', this.handleMouseWheel);

};
