var World = (function(THREE, THREEx, TWEEN) {
  'use strict';

  var VIEW_ANGLE = 45,
      NEAR = 0.1,
      FAR = 1000;

  var renderer,
      camera,
      scene,
    // First person controls are special. We want to be able toreport player
    // position.
      controls,
      playerLight,
      hemisphereLight;

  Physijs.scripts.worker = '/libs/physijs_worker.js';
  Physijs.scripts.ammo = '/libs/ammo.js';

  var clock = new THREE.Clock();

  var init = function(container) {
    renderer = new THREE.WebGLRenderer();

    var aspect = window.innerWidth / window.innerHeight;
    camera = new THREE.PerspectiveCamera(VIEW_ANGLE, aspect, NEAR, FAR);

    /*
    controls = new THREE.TrackballControls(camera, renderer.domElement);
    controls.rotateSpeed = 1.5;
    controls.zoomSpeed = 12;
    controls.panSpeed = 1.0;
    controls.staticMoving = true;
    window.addEventListener('resize', function() {console.log('handle');controls.handleResize();});
    */
    // TODO: Set default trackball position
    camera.position.setZ(30);
    camera.lookAt(new THREE.Vector3(0,0,0));
    controls = new CodeDrop.PoleControls(camera, renderer.domElement);


    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 1);

    THREEx.WindowResize(renderer, camera);
    scene = new Physijs.Scene({fixedTimeStep: 1/240 /* ms */});
    scene.add(camera);

    container.appendChild(renderer.domElement);

    scene.rotation.set(0, 0, 0);
    scene.scale.set(1, 1, 1);
    scene.position.set(0, 0, 0);

    playerLight = new THREE.PointLight(0xFFFFFF, 0.5);
    scene.add(playerLight);
    hemisphereLight = new THREE.HemisphereLight(0xCCCCFF, 0xFFCCCC, 0.5);
    scene.add(hemisphereLight);
    
    animate();
  };

  var animate = function() {
    playerLight.position.copy(camera.position);
    //controls.update(clock.getDelta());

    // Don't define how much time to simulate in each call (defaults to time
    // since last call). Max of ten time steps.
    scene.simulate(undefined, 10);
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  };

  return {
    init: init,
    scene: function() {return scene;},
    camera: function() {return camera;},
    controls: function() {return controls;},
    renderer: function() {return renderer;},
    clock: function() {return clock;},
    playerLight: function() {return playerLight;},
    hemisphereLight: function() {return hemisphereLight;},
    animate: animate
  };
})(THREE, THREEx);
