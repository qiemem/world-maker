World = (function () {
  World = {};

  var VIEW_ANGLE = 45,
      NEAR = 0.1,
      FAR = 1000;

  var renderer,
      camera,
      scene;

  World.init = function(container) {
    renderer = new THREE.WebGLRenderer();
    //renderer.setClearColor(new THREE.Color(0x000000), 1.0);
    // 1.0 = Arbitrary aspect; WindowResize takes care of it for us
    camera = new THREE.PerspectiveCamera(VIEW_ANGLE, 1.0, NEAR, FAR);
    renderer.setClearColor(new THREE.Color(0x000000, 1));
    scene = new THREE.Scene();
    World.scene = scene;
    World.camera = camera;
    scene.add(camera);
    THREEx.WindowResize(renderer, camera);
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    // create a point light
    var pointLight =
      new THREE.PointLight(0xFFFFFF);

    // add to the scene
    scene.add(pointLight);

    World.animate();
  }

  World.reset = function() {
    for (var i = scene.children.length - 1; i>=0; i--) {
      obj = scene.children[i];
      if (obj !== camera) {
        scene.remove(obj);
      }
    }
    // create a point light
    var pointLight =
      new THREE.PointLight(0xFFFFFF);

    // add to the scene
    scene.add(pointLight);
  }

  World.animate = function(dt) {
    renderer.render(scene, camera);
    requestAnimationFrame(World.animate);
  }


  return World;
}());
