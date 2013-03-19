/**
 * agency.js
 *
 * The agency module defines the agent-based API that hopefully allows users to
 * intuitively manipulate the 3D objects.
 */

var agency = (function(THREE) {
  'use strict';

  /**
   * Calls `func` `times` times, passing in the iteration number. This enables
   * users to play around with loops without having to worry about infinite
   * loops or loop variables conflicting. Note that if the user does not want
   * the iteration variable, they can simply pass in a function that takes no
   * arguments.
   */
  function repeat(times, func) {
    for (var i=0; i < times; i++) {
      func(i);
    }
  }

  /**
      Agent's move in a very Logo-like way. However, Agent objects themselves
      are just thin wrapper's around THREE.js's Object3Ds, which have
      customizable definable geometry and material properties. Hence, if a user
      wishes to invoke advanced features from THREE.js, while still using the
      agent-based API, she can.
      @constructor
   */
  function Agent(obj) {
    this.obj = obj;
  }

  // TODO: Translate methods only use rotation, not scaling, from matrix
  /**
      Moves the agent forward (along the x-axis) by distance.
      @param {number} distance The distance to move
      @returns {Agent}
    */
  Agent.prototype.forward = Agent.prototype.fd = function(distance) {
    this.obj.translateX(distance);
    this.obj.updateMatrix();
    return this;
  };

  Agent.prototype.backward = Agent.prototype.bk = function(distance) {
    return this.fd(-distance);
  };

  Agent.prototype.right = Agent.prototype.rt = function(angle) {
    return this.lt(-angle);
  };

  Agent.prototype.left = Agent.prototype.lt = function(angle) {
    this.obj.matrix.multiply(
      new THREE.Matrix4().makeRotationY(2 * Math.PI * angle / 360));
    var mat = new THREE.Matrix4().extractRotation(this.obj.matrix);
    this.obj.rotation.setEulerFromRotationMatrix(mat, this.obj.eulerOrder);
    return this;
  };

  Agent.prototype.up = function(angle) {
    this.obj.matrix.multiply(
      new THREE.Matrix4().makeRotationZ(2 * Math.PI * angle / 360));
    var mat = new THREE.Matrix4().extractRotation(this.obj.matrix);
    this.obj.rotation.setEulerFromRotationMatrix(mat, this.obj.eulerOrder);
    return this;
  };

  Agent.prototype.down = Agent.prototype.dn = function(angle) {
    return this.up(-angle);
  };

  Agent.prototype.rollRight = Agent.prototype.rr = function(angle) {
    this.obj.matrix.multiply(
      new THREE.Matrix4().makeRotationX(2 * Math.PI * angle / 360));
    var mat = new THREE.Matrix4().extractRotation(this.obj.matrix);
    this.obj.rotation.setEulerFromRotationMatrix(mat, this.obj.eulerOrder);
    return this;
  };

  Agent.prototype.rollLeft = Agent.prototype.rl = function(angle) {
    return this.rr(-angle);
  };

  // TODO: Scalar methods do not use matrix multiplication.
  Agent.prototype.grow = function(amount) {
    return this.gw(amount).gl(amount).gt(amount);
  };

  Agent.prototype.growWide = Agent.prototype.gw = function(amount) {
    this.obj.scale.z += amount;
    this.obj.updateMatrix();
    return this;
  };

  Agent.prototype.growLong = Agent.prototype.gl = function(amount) {
    this.obj.scale.x += amount;
    this.obj.updateMatrix();
    return this;
  };

  Agent.prototype.growTall = Agent.prototype.gt = function(amount) {
    this.obj.scale.y += amount;
    this.obj.updateMatrix();
    return this;
  };

  Agent.prototype.color = function(color) {
    this.obj.material.color.set(color);
    return this;
  };

  Agent.prototype.rgb = function(red, green, blue) {
    this.obj.material.color.setRGB(red, green, blue);
    return this;
  };

  Agent.prototype.hsl = function(hue, saturation, lightness) {
    this.obj.material.color.setHSL(hue, saturation, lightness);
    return this;
  };

  Agent.prototype.transparency = function(amount) {
    if (amount > 0 && amount <= 1) {
      this.obj.material.transparent = true;
      this.obj.material.opacity = 1 - amount;
    } else {
      this.obj.material.transparent = false;
      this.obj.material.opacity = 1;
    }
    return this;
  };

  Agent.prototype.__make = function(AgentType) {
    // arguments isn't actually an array, but is enough like one that we can
    // call slice on it
    var agent = new AgentType(Array.prototype.slice.call(arguments, 1));
    agent.obj.applyMatrix(this.obj.matrix);
    if (this.obj.material) {
      agent.obj.material.color.copy(this.obj.material.color);
    }
    return agent;
  };

  Agent.prototype.make = function(agentType) {
    var agent = this.__make(agentType);
    if (this.obj instanceof THREE.Scene) {
      this.obj.add(agent.obj);
    } else {
      this.obj.parent.add(agent.obj);
    }
    return agent;
  };

  Agent.prototype.makeChild = function(agentType) {
    var agent = this.__make(agentType);
    this.obj.add(agent.obj);
    return agent;
  };

  /**
      @returns {Agent}
   */
  Agent.prototype.cube = function() {
    return this.make(CubeAgent);
  };

  Agent.prototype.sphere = function() {
    return this.make(SphereAgent);
  };

  Agent.prototype.cursor = function() {
    return this.make(CursorAgent);
  };

  /**
      @constructor
      @extends {Agent}
    */
  function CubeAgent() {
    var material = new THREE.MeshPhongMaterial();
    material.side = THREE.DoubleSide;
    var cube = new THREE.Mesh(CubeAgent.geometry, material);
    Agent.call(this, cube);
  }

  CubeAgent.geometry = new THREE.CubeGeometry(1, 1, 1);

  CubeAgent.prototype = Object.create(Agent.prototype);

  function SphereAgent() {
    var material = new THREE.MeshPhongMaterial();
    material.side = THREE.DoubleSide;
    var sphere = new THREE.Mesh(SphereAgent.geometry, material);
    Agent.call(this, sphere);
  }

  SphereAgent.geometry = new THREE.SphereGeometry(0.5, 16, 16);

  SphereAgent.prototype = Object.create(Agent.prototype);

  function CompositeAgent() {
    var obj = new THREE.Object3D();
    for (var i = 0; i < arguments.length; i++) {
      obj.add(arguments[i]);
    }
    Agent.call(this, obj);
  }

  CompositeAgent.prototype = Object.create(Agent.prototype);

  function CursorAgent() {
    CompositeAgent.call(this);
    var back = this.makeChild(CubeAgent).bk(0.635).gl(-0.75).gt(-0.75);
    back.transparency(0.2);

    var right = this.makeChild(CubeAgent);
    right.bk(0.135).rt(90).fd(0.625).lt(90).gw(-0.75).gt(-0.75).gl(0.25);
    right.transparency(0.2);
    var left = right.cube().lt(90).fd(1.25).lt(90);
    left.transparency(0.2);

    var backBottom = this.makeChild(CubeAgent);
    backBottom.bk(0.635).gl(-0.75).gt(-0.5).gw(-0.75).dn(90).fd(0.25).up(90);
    backBottom.transparency(0.2);

    var bottom = right.cube().dn(90).fd(0.625).up(90).lt(90).fd(0.625).rt(90);
    bottom.transparency(0.2);
  }

  CursorAgent.prototype = Object.create(CompositeAgent.prototype);

  return {
    repeat: repeat,
    Agent: Agent,
    CubeAgent: CubeAgent,
    SphereAgent: SphereAgent,
    CompositeAgent: CompositeAgent
  };
})(THREE);
