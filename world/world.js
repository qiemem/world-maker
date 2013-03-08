World = (function () {
  World = {};

  var VIEW_ANGLE = 45,
      NEAR = 0.1,
      FAR = 1000;

  var renderer,
      camera,
      scene;

  var clock = new THREE.Clock();

  World.init = function(container) {
    renderer = new THREE.WebGLRenderer();
    
    var aspect = window.innerWidth/window.innerHeight
    camera = new THREE.PerspectiveCamera(VIEW_ANGLE, aspect, NEAR, FAR);

    controls = new THREE.FirstPersonControls(camera);
    controls.lookSpeed = .1;
    controls.movementSpeed = 2;

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(new THREE.Color(0x000000, 1));

    THREEx.WindowResize(renderer, camera);

    scene = new THREE.Scene();
    scene.add(camera);
    
    World.scene = scene;
    World.camera = camera;
    World.controls = controls;
    World.renderer = renderer;

    container.appendChild(renderer.domElement);

    World.reset();

    World.animate();
  }

  World.reset = function() {
    for (var i = scene.children.length - 1; i>=0; i--) {
      obj = scene.children[i];
      if (obj !== camera) {
        scene.remove(obj);
      }
    }
    /*
    World.cube().fd(10).color('red');
    World.cube().bk(10).color('blue');
    World.cube().rt(90).fd(10).color('green');
    World.cube().lt(90).fd(10).color('yellow');
    World.cube().uw(90).fd(10).color('purple');
    World.cube().dw(90).fd(10).color('orange');
    */

    window.cursor = World.cursor().fd(5);

    var playerLight = new THREE.PointLight(0xFFFFFF);
    World.playerLight = playerLight;
    scene.add(playerLight);
  }

  World.animate = function() {
    World.playerLight.position.copy(World.camera.position);
    controls.update(clock.getDelta());
    renderer.render(scene, camera);
    requestAnimationFrame(World.animate);
  }

  World.cursor = function() {
    var outerSphere = World.sphere().color(0xFFFFAA).transparency(0.5);

    var innerSphere = World.sphere().grow(-.5).color(0xAAAAAAFF).transparency(0.5);

    var back = World.cube().bk(.635).gl(-.75).gt(-.75);
    back.transparency(.2);

    var right = World.cube().bk(.135).rt(90).fd(.625).lt(90).gw(-.75).gt(-.75).gl(.25);
    right.transparency(.2);
    var left = right.cube().lt(90).fd(1.25).lt(90);
    left.transparency(.2);

    var backBottom = World.cube().bk(.635).gl(-.75).gt(-.5).gw(-.75).dw(90).fd(.25).uw(90);
    backBottom.transparency(.2);

    var bottom = right.cube().dw(90).fd(.625).uw(90).lt(90).fd(.625).rt(90);
    bottom.transparency(.2);

    return World.compositeObject(outerSphere, innerSphere, back, right, left, backBottom, bottom);
  }

  World.sphere = function() {
    // create the sphere's material
    var sphereMaterial =
      new THREE.MeshPhongMaterial();

    var sphere = new THREE.Mesh(
        new THREE.SphereGeometry(.5,16,16),
        sphereMaterial);

    scene.add(sphere);
    return sphere;
  }

  World.cube = function() {
    var material = new THREE.MeshPhongMaterial();
    var cube = new THREE.Mesh(new THREE.CubeGeometry(1,1,1), material);
    scene.add(cube);
    return cube;
  }

  World.compositeObject = function() {
    var obj = new THREE.Object3D();
    for (var i=0; i<arguments.length; i++) {
      obj.add(arguments[i]);
    }
    scene.add(obj);
    return obj;
  }


  var AgentProto = THREE.Object3D.prototype;

  // TODO: Translate methods only use rotation, not scaling, from matrix
  AgentProto.forward = AgentProto.fd = function(distance) {
    this.translateX(distance);
    this.updateMatrix();
    return this;
  }

  AgentProto.backward = AgentProto.bk = function(distance) {
    return this.fd(-distance);
  }
    
  AgentProto.right = AgentProto.rt = function(angle) {
    return this.lt(-angle);
  }

  AgentProto.left = AgentProto.lt = function(angle) {
    this.matrix.multiply(new THREE.Matrix4().makeRotationY(2*Math.PI*angle/360));
    var mat = new THREE.Matrix4().extractRotation( this.matrix );
    this.rotation.setEulerFromRotationMatrix( mat, this.eulerOrder );
    return this;
  }

  AgentProto.upward = AgentProto.uw = function(angle) {
    this.matrix.multiply(new THREE.Matrix4().makeRotationZ(2*Math.PI*angle/360));
    var mat = new THREE.Matrix4().extractRotation( this.matrix );
    this.rotation.setEulerFromRotationMatrix( mat, this.eulerOrder );
    return this;
  }

  AgentProto.downward = AgentProto.dw = function(angle) {
    return this.uw(-angle);
  }

  AgentProto.rollLeft = AgentProto.rl = function(angle) {
    this.matrix.multiply(new THREE.Matrix4().makeRotationZ(2*Math.PI*angle/360));
    var mat = new THREE.Matrix4().extractRotation( this.matrix );
    this.rotation.setEulerFromRotationMatrix( mat, this.eulerOrder );
    return this;
  }

  AgentProto.rollRight = AgentProto.rr = function(angle) {
    return this.rl(-angle);
  }

  // TODO: Scalar methods do not use matrix multiplication.
  AgentProto.grow = function(amount) {
    return this.gw(amount).gl(amount).gt(amount);
  }

  AgentProto.growWide = AgentProto.gw = function(amount) {
    this.scale.z += amount;
    this.updateMatrix();
    return this;
  }

  AgentProto.growLong = AgentProto.gl = function(amount) {
    this.scale.x += amount;
    this.updateMatrix();
    return this;
  }

  AgentProto.growTall = AgentProto.gt = function(amount) {
    this.scale.y += amount;
    this.updateMatrix();
    return this;
  }

  AgentProto.color = function(color) {
    this.material.color.set(color);
    return this;
  }

  AgentProto.transparency = function(amount) {
    if (amount > 0 && amount <= 1) {
      this.material.transparent = true;
      this.material.opacity = 1-amount;
    } else {
      this.material.transparent = false;
      this.material.opacity = 1;
    }
    return this;
  }

  AgentProto.sphere = function() {
    var sphere = World.sphere();
    if (this.material) {
      sphere.material.color.copy(this.material.color);
    }
    sphere.applyMatrix(this.matrix);
    return sphere;
  }

  AgentProto.cube = function() {
    var cube = World.cube();
    if (this.material) {
      cube.material.color.copy(this.material.color);
    }
    cube.applyMatrix(this.matrix);
    return cube;
  }

  return World;
}());
