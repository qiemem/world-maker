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
    
    var aspect = window.innerWidth/window.innerHeight;
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

    //window.cursor = World.cursor().fd(5);

    World.playerLight = new THREE.PointLight(0xFFFFFF);
    scene.add(World.playerLight);
  }

  World.animate = function() {
    World.playerLight.position.copy(World.camera.position);
    controls.update(clock.getDelta());
    renderer.render(scene, camera);
    requestAnimationFrame(World.animate);
  }

  World.cursor = function() {
    //var outerSphere = World.sphere().color(0xFFFFAA).transparency(0.5);

    //var innerSphere = World.sphere().grow(-.5).color(0xAAAAAAFF).transparency(0.5);

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

    return World.compositeObject(back, right, left, backBottom, bottom);
  }


  var AgentProto = THREE.Object3D.prototype;

  // TODO: Translate methods only use rotation, not scaling, from matrix

  AgentProto.trans = function(xDist, yDist, zDist) {
    this._vector.set(xDist, yDist, zDist);
    var dist = this._vector.length();
    this.translate(dist, this._vector.setLength(1));
    return this;
  }

  return World;
}());
