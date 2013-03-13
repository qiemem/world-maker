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

    //controls = new THREE.FirstPersonControls(camera);
    controls = new THREE.TrackballControls(camera);
    controls.rotateSpeed = 1.5;
    controls.zoomSpeed = 12.0;
    controls.panSpeed = 1.0;
    camera.position.z = 20;
    controls.staticMoving = true;
    
    //controls.lookSpeed = .1;
    //controls.movementSpeed = 2;

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(new THREE.Color(0x000000, 1));

    THREEx.WindowResize(renderer, camera);
    window.addEventListener('resize', function() {controls.handleResize();});

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

    scene.rotation.set(0,0,0);
    scene.scale.set(1,1,1);
    scene.position.set(0,0,0);

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

  return World;
}());
