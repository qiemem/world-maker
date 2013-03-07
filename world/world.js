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
        new THREE.SphereGeometry(.5,16,16),
        sphereMaterial);

    scene.add(sphere);
    return sphere;
  }

  World.cube = function(color) {
    var material = new THREE.MeshLambertMaterial({color: color});
    var cube = new THREE.Mesh(new THREE.CubeGeometry(1,1,1), material);
    scene.add(cube);
    return cube;
  }

  var AgentProto = THREE.Object3D.prototype;

  // TODO: Translate methods only use rotation, not scaling, from matrix
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


  // TODO: Scalar methods do not use matrix multiplication.
  AgentProto.grow = function(amount) {
    return this.gw(amount).gl(amount).gt(amount);
  }

  AgentProto.growWide = AgentProto.gw = function(amount) {
    this.scale.x += amount;
    this.updateMatrix();
    return this;
  }

  AgentProto.growLong = AgentProto.gl = function(amount) {
    this.scale.z += amount;
    this.updateMatrix();
    return this;
  }

  AgentProto.growTall = AgentProto.gt = function(amount) {
    this.scale.y += amount;
    this.updateMatrix();
    return this;
  }

  AgentProto.sphere = function() {
    var sphere = World.sphere(this.material.color);
    sphere.applyMatrix(this.matrix);
    return sphere;
  }

  AgentProto.cube = function() {
    var cube = World.cube(this.material.color);
    cube.applyMatrix(this.matrix);
    return cube;
  }

  return World;
}());
