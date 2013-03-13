World = (function () {
  World = {};

  var VIEW_ANGLE = 45,
      NEAR = 0.1,
      FAR = 1000;

  var renderer,
      camera,
      scene,
      controlModes,
      controls;

  World.ControlModes = {
    FIRST_PERSON: "firstPerson",
    TRACKBALL:    "trackball"
  }

  var clock = new THREE.Clock();

  World.init = function(container) {
    renderer = new THREE.WebGLRenderer();
    
    var aspect = window.innerWidth/window.innerHeight;
    camera = new THREE.PerspectiveCamera(VIEW_ANGLE, aspect, NEAR, FAR);

    trackballControls = new THREE.TrackballControls(camera, renderer.domElement);
    World.trackballControls = trackballControls
    trackballControls.rotateSpeed = 1.5;
    trackballControls.zoomSpeed = 12.0;
    trackballControls.panSpeed = 1.0;
    trackballControls.staticMoving = true;
    trackballPosition = camera.position.clone().setZ(20);
    trackballRotation = camera.rotation.clone();
    trackballControls.setActive = function(val) {
      console.log(this.noRotate);
      this.noRotate = val;
      this.noZoom = val;
      this.noPan = val;
    };
      
    trackballControls.setActive(false);
    
    fpControls = new THREE.FirstPersonControls(camera);
    fpControls.lookSpeed = .1;
    fpControls.movementSpeed = 2;
    fpPosition = camera.position.clone();
    fpRotation = camera.rotation.clone();
    fpControls.setActive = function(val) {
      this.freeze = !val;
    };
    fpControls.setActive(false);;

    controlModes = {
      trackball: {
        controls: trackballControls,
        position: trackballPosition,
        rotation: trackballRotation
      }, 
      firstPerson: {
        controls: fpControls,
        position: fpPosition,
        rotation: fpRotation
      }
    }

    controls = controlModes.firstPerson.controls;
    controls.setActive(true);
    camera.position.copy(controlModes.firstPerson.position);
    camera.rotation.copy(controlModes.firstPerson.rotation);

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

  World.switchControls = function(controlMode) {
    controls.setActive(false);
    var cm = controlModes[controlMode];
    controls = cm.controls
    camera.position.copy(cm.position);
    camera.rotation.copy(cm.rotation);
  }

  World.animate = function() {
    World.playerLight.position.copy(World.camera.position);
    controls.update(clock.getDelta());
    renderer.render(scene, camera);
    requestAnimationFrame(World.animate);
  }

  return World;
}());
