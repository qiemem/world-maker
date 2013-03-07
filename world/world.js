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
    // 1.0 = Arbitrary aspect; WindowResize takes care of it for us
    camera = new THREE.PerspectiveCamera(VIEW_ANGLE, 1.0, NEAR, FAR);
    camera.position.z = 10;
    renderer.setClearColor(new THREE.Color(0x000000, 1));
    scene = new THREE.Scene();
    World.scene = scene;
    World.camera = camera;
    World.renderer = renderer;
    scene.add(camera);
    THREEx.WindowResize(renderer, camera);
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    // create a point light
    var pointLight =
      new THREE.PointLight(0xFFFFFF);
    
    pointLight.position.z = camera.position.z;
    World.pointLight = pointLight;

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
    pointLight.position.z = camera.position.z;
    World.pointLight = pointLight;

    // add to the scene
    scene.add(pointLight);
  }

  World.animate = function(dt) {
    renderer.render(scene, camera);
    requestAnimationFrame(World.animate);
  }

  World.sphere = function(color) {
    // create the sphere's material
    var sphereMaterial =
      new THREE.MeshLambertMaterial(
          {
            color: color
          });

    var sphere = new THREE.Mesh(
        new THREE.SphereGeometry(1,16,16),
        sphereMaterial);

    scene.add(sphere);
    return sphere;
  }

  var AgentProto = THREE.Object3D.prototype;

  AgentProto.forward = AgentProto.fd = function(distance) {
    this.translateZ(-distance);
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
    this.matrix.multiply(new THREE.Matrix4().makeRotationX(2*Math.PI*angle/360));
    var mat = new THREE.Matrix4().extractRotation( this.matrix );
		this.rotation.setEulerFromRotationMatrix( mat, this.eulerOrder );
    return this;
  }

  AgentProto.downward = AgentProto.dw = function(angle) {
    return this.uw(-angle);
  }

  AgentProto.sphere = function() {
    var sphere = World.sphere(this.material.color);
    sphere.applyMatrix(this.matrix);
    return sphere;
  }

  return World;
}());
