World = (function () {
  World = {};

  var VIEW_ANGLE = 45,
      NEAR = 0.1,
      FAR = 1000;

  var renderer,
      camera,
      scene,
      controlModes,
      controls,
      activeControlMode,
      playerLight;

  var ControlModes = {
    FIRST_PERSON: "firstPerson",
    TRACKBALL:    "trackball"
  }

  var clock = new THREE.Clock();

  var init = function(container) {
    renderer = new THREE.WebGLRenderer();
    
    var aspect = window.innerWidth/window.innerHeight;
    camera = new THREE.PerspectiveCamera(VIEW_ANGLE, aspect, NEAR, FAR);

    trackballControls = new THREE.TrackballControls(camera, renderer.domElement);
    trackballControls = trackballControls
    trackballControls.rotateSpeed = 1.5;
    trackballControls.zoomSpeed = 12.0;
    trackballControls.panSpeed = 1.0;
    trackballControls.staticMoving = true;
    trackballPosition = camera.position.clone().setZ(20);
    trackballUp = camera.up.clone();
    trackballControls.setActive = function(val) {
      this.enabled = val;
    };
      
    trackballControls.setActive(false);
    
    fpControls = new THREE.FirstPersonControls(camera);
    fpControls.lookSpeed = .1;
    fpControls.movementSpeed = 2;
    fpPosition = camera.position.clone();
    fpUp = camera.up.clone();
    fpControls.setActive = function(val) {
      this.freeze = !val;
      this.activeLook = val;
    };
    fpControls.setActive(false);;

    controlList = [trackballControls, fpControls];
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
    }

    switchControls(ControlModes.FIRST_PERSON);

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(new THREE.Color(0x000000, 1));

    THREEx.WindowResize(renderer, camera);
    for (var i=0; i<controlList.length; i++) {
      var c = controlList[i];
      if (c.handleResize) {
        window.addEventListener('resize', function() {c.handleResize();});
      }
    }

    scene = new THREE.Scene();
    scene.add(camera);
    
    container.appendChild(renderer.domElement);

    reset();

    animate();
  }

  var reset = function() {
    for (var i = scene.children.length - 1; i>=0; i--) {
      obj = scene.children[i];
      if (obj !== camera) {
        scene.remove(obj);
      }
    }

    scene.rotation.set(0,0,0);
    scene.scale.set(1,1,1);
    scene.position.set(0,0,0);

    playerLight = new THREE.PointLight(0xFFFFFF);
    scene.add(playerLight);
  }

  var switchControls = function(controlMode) {
    if (controls) {
      controls.setActive(false);
    }
    if (activeControlMode) {
      activeControlMode.position.copy(camera.position);
      activeControlMode.up.copy(camera.up);
    }
    activeControlMode = controlModes[controlMode];
    controls = activeControlMode.controls;
    controls.setActive(true);      
    camera.position.copy(activeControlMode.position);
    camera.up.copy(activeControlMode.up);
    camera.updateMatrix();
  }

  var animate = function() {
    playerLight.position.copy(camera.position);
    controls.update(clock.getDelta());
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }

  return {
    ControlModes: ControlModes,
    init: init,
    switchControls: switchControls,
    scene: function() {return scene},
    camera: function() {return camera},
    controls: function() {return controls},
    renderer: function() {return renderer},
    reset: reset,
    playerLight: function() {return playerLight},
    animate: animate
  }
  return World;
}());
