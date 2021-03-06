var World = (function(THREE, THREEx, TWEEN, Physijs) {
  'use strict';

  var VIEW_ANGLE = 45,
      NEAR = 0.1,
      FAR = 1000;

  var renderer,
      camera,
      scene,
      controlModes,
    // First person controls are special. We want to be able toreport player
    // position.
      fpControls,
      fpPosition,
      controls,
      activeControlMode,
      playerLight,
      hemisphereLight;

  var ControlModes = {
    FIRST_PERSON: 'firstPerson',
    TRACKBALL: 'trackball'
  };

  // physijs worker loads ammo, so that url must be made relative to it.
  Physijs.scripts.worker = 'libs/physijs_worker.js';
  Physijs.scripts.ammo = 'ammo.js';

  var clock = new THREE.Clock();

  var init = function(container) {
    renderer = new THREE.WebGLRenderer();

    var aspect = window.innerWidth / window.innerHeight;
    camera = new THREE.PerspectiveCamera(VIEW_ANGLE, aspect, NEAR, FAR);

    var trackballControls =
      new THREE.TrackballControls(camera, renderer.domElement);
    trackballControls = trackballControls;
    trackballControls.rotateSpeed = 1.5;
    trackballControls.zoomSpeed = 12;
    trackballControls.panSpeed = 1.0;
    trackballControls.staticMoving = true;
    // TODO: Set default trackball position
    var trackballPosition = camera.position.clone().setY(20);
    var trackballUp = camera.up.clone().setX(1).setY(0);
    trackballControls.setActive = function(val) {
      this.enabled = val;
    };

    trackballControls.setActive(false);

    fpControls = new THREE.FirstPersonControls(camera);
    fpControls.lookSpeed = 0.1;
    fpControls.movementSpeed = 2;
    fpPosition = camera.position.clone().setX(-5.0);
    fpPosition = fpPosition;
    var fpUp = camera.up.clone();
    fpControls.setActive = function(val) {
      this.freeze = !val;
      this.activeLook = val;
    };
    fpControls.setActive(false);

    var controlList = [trackballControls, fpControls];
    controlModes = {
      trackball: {
        controls: trackballControls,
        position: trackballPosition,
        up: trackballUp
      },
      firstPerson: {
        controls: fpControls,
        position: fpPosition,
        up: fpUp
      }
    };

    switchControls(ControlModes.FIRST_PERSON);

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 1);

    THREEx.WindowResize(renderer, camera);
    controlList.forEach(function(c) {
      if (c.handleResize) {
        window.addEventListener('resize', function() {c.handleResize();});
      }
    });

    scene = new Physijs.Scene();
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

  var switchControls = function(controlMode) {
    var SWITCH_TIME = 500;
    if (controls) {
      controls.setActive(false);
    }
    if (activeControlMode) {
      activeControlMode.position.copy(camera.position);
      activeControlMode.up.copy(camera.up);
    }
    activeControlMode = controlModes[controlMode];
    var oldControls = controls;
    controls = activeControlMode.controls;
    var targetPos = activeControlMode.position;
    var posTween = new TWEEN.Tween(camera.position)
      .to({x: targetPos.x, y: targetPos.y, z: targetPos.z}, SWITCH_TIME)
      .onComplete(function() {
        controls.setActive(true);
      })
      .start();
    var targetUp = activeControlMode.up;
    var upTween = new TWEEN.Tween(camera.up)
      .to({x: targetUp.x, y: targetUp.y, z: targetUp.z}, SWITCH_TIME)
      .start();

    if (oldControls) {
      var lookingAt = oldControls.target.clone().normalize().multiplyScalar(10);
      var lookTarget = controls.target.clone().normalize().multiplyScalar(10);
      var lookingAtTween = new TWEEN.Tween(lookingAt)
        .to({x: lookTarget.x, y: lookTarget.y, z: lookTarget.z}, SWITCH_TIME)
        .onUpdate(function() {
          camera.lookAt(lookingAt);
        })
        .start();
    }
  };

  var animate = function() {
    playerLight.position.copy(camera.position);
    controls.update(clock.getDelta());
    if (fpControls.activeLook) {
      fpPosition = fpControls.object.position.clone();
    }
    TWEEN.update();
    scene.simulate();
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  };

  return {
    ControlModes: ControlModes,
    init: init,
    switchControls: switchControls,
    scene: function() {return scene;},
    camera: function() {return camera;},
    playerPosition: function() {return fpPosition.clone();},
    playerDirection: function() {return fpControls.target.clone();},
    controls: function() {return controls;},
    renderer: function() {return renderer;},
    clock: function() {return clock;},
    playerLight: function() {return playerLight;},
    hemisphereLight: function() {return hemisphereLight;},
    animate: animate
  };
})(THREE, THREEx, TWEEN, Physijs);
