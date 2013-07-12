/**
 * agency.js
 *
 * The agency module defines the agent-based API that hopefully allows users to
 * intuitively manipulate the 3D objects.
 */

/*
   TODO:
   - Add:
     - tubeDown(numSides)/tubeUp() - like pen down, but creates a tunnel with
     numSides
         - Actually, maybe start with something that just lays a four sided 
         object. Will be much easier (but still difficult) to do this smoothly
 */

window.agency = (function(THREE, Physijs) {
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
    this.obj.useQuaternion = true;
    this.obj.agent = this;
    this.children = [];
    this.childrenUsingMyColor = [];
    this.physicalFactor = 1.0;
    //parent.addChild(this);
  }

  // Note that, translate methods only use rotation, not scaling, from matrix.
  // This is by design.
  /**
      Moves the agent forward (along the x-axis) by distance.
      @param {number} distance The distance to move
      @returns {Agent}
    */
  Agent.prototype.forward = Agent.prototype.fd = function(distance) {
    this.obj.translateX(distance);
    this.obj.__dirtyPosition = true;
    return this;
  };

  Agent.prototype.backward = Agent.prototype.bk = function(distance) {
    return this.fd(-distance);
  };

  Agent.prototype.right = Agent.prototype.rt = function(angle) {
    return this.lt(-angle);
  };

  Agent.prototype.left = Agent.prototype.lt = function(angle) {
    this.obj.rotateOnAxis(
      new THREE.Vector3(0, 1, 0), 2 * Math.PI * angle / 360);
    this.obj.__dirtyRotation = true;
    return this;
  };

  Agent.prototype.up = function(angle) {
    this.obj.rotateOnAxis(
      new THREE.Vector3(0, 0, 1), 2 * Math.PI * angle / 360);
    this.obj.__dirtyRotation = true;
    return this;
  };

  Agent.prototype.down = Agent.prototype.dn = function(angle) {
    return this.up(-angle);
  };

  Agent.prototype.rollRight = Agent.prototype.rr = function(angle) {
    this.obj.rotateOnAxis(
      new THREE.Vector3(1, 0, 0), 2 * Math.PI * angle / 360);
    this.obj.__dirtyRotation = true;
    return this;
  };

  Agent.prototype.rollLeft = Agent.prototype.rl = function(angle) {
    return this.rr(-angle);
  };

  Agent.prototype.grow = function(amount) {
    // Physijs doesn't support scaling objects except at creation time
    this.obj.scale.x += amount;
    this.obj.scale.y += amount;
    this.obj.scale.z += amount;
    this.__updatePhysical();
    return this;
  };

  Agent.prototype.growWide = Agent.prototype.gw = function(amount) {
    this.obj.scale.z += amount;
    this.__updatePhysical();
    return this;
  };

  Agent.prototype.growLong = Agent.prototype.gl = function(amount) {
    this.obj.scale.x += amount;
    this.__updatePhysical();
    return this;
  };

  Agent.prototype.growTall = Agent.prototype.gt = function(amount) {
    this.obj.scale.y += amount;
    this.__updatePhysical();
    return this;
  };

  Agent.prototype.updateChildrensColor = function() {
    for (var i=0; i < this.childrenUsingMyColor.length; i++) {
      this.childrenUsingMyColor[i].color(this.color());
    }
    return this;
  };

  Agent.prototype.color = function(color) {
    if (color) {
      this.obj.material.color.set(color);
      return this.updateChildrensColor();
    } else {
      return this.obj.material.color;
    }
  };

  // Setting via this.color() gives us a single point that colors are through.
  // This makes weird agents, such as SceneAgent, easier.
  Agent.prototype.rgb = function(red, green, blue) {
    return this.color(this.color().setRGB(red, green, blue));
  };

  Agent.prototype.hsl = function(hue, saturation, lightness) {
    return this.color(this.color().setHSL(hue, saturation, lightness));
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

  Agent.prototype.mass = function (amount) {
    if (typeof amount === 'undefined') {
      return this.obj.mass;
    } else {
      this.obj.mass = amount;
      this.__updatePhysical();
      return this;
    }
  };

  Agent.prototype.friction = function (amount) {
    if (typeof amount === 'undefined') {
      return this.obj.material._physijs.friction;
    } else {
      this.obj.material._physijs.friction = amount;
      this.__updatePhysical();
      return this;
    }
  };

  Agent.prototype.bounciness = function (amount) {
    if (typeof amount === 'undefined') {
      return this.obj.material._physijs.restitution;
    } else {
      this.obj.material._physijs.restitution = amount;
      this.__updatePhysical();
      return this;
    }
  };

  Agent.prototype.physical = function (enabled) {
    if (typeof enabled === 'undefined') {
      return this.physicalFactor >= 0;
    } else if (enabled) {
      this.physicalFactor = 1.0;
    } else {
      this.physicalFactor = -Infinity;
    }
    this.children.forEach(function(c) {c.physical(enabled);});
    this.__updatePhysical();
    return this;
  };

  Agent.prototype.addChild = function(agent, useMyColor) {
    if (agent.parent) {
      agent.parent.removeChild(agent);
    }
    this.children.push(agent);
    if (useMyColor ||
        (agent.color().equals(this.color()) && useMyColor !== false)) {
      this.childrenUsingMyColor.push(agent);
      agent.color(this.color());
    }
    agent.parent = this;
    this.obj.add(agent.obj);
    this.__updatePhysical();
    return this;
  };

  Agent.prototype.removeChild = function(agent) {
    var i = this.children.indexOf(agent),
        j = this.childrenUsingMyColor.indexOf(agent);
    if (i > -1) {
      this.children.splice(i,1);
      this.obj.remove(agent.obj);
    }
    if (j > -1) {
      this.childrenUsingMyColor.splice(j,1);
    }
    this.__updatePhysical();
    return this;
  };

  Agent.prototype.__resetDimensions = function() {
    if (this.obj._physijs) {
      var phys = this.obj._physijs;
      if (phys.type === 'box') {
        phys.width = this.physicalFactor;
        phys.height = this.physicalFactor;
        phys.depth = this.physicalFactor;
      } else if (phys.type === 'sphere') {
        phys.radius = this.physicalFactor;
      }
      // Strangely, physijs *=s the width, height, and depth of an object by
      // its scale (instead of just setting it). So, we have to reset them.
      // TODO: Make this work for ConvexMesh
    }
    this.children.forEach(function (c) { c.__resetDimensions(); });
  };

  Agent.prototype.__updatePhysical = function() {
    this.__resetDimensions();
    if (this.parent) {
      this.parent.obj.remove(this.obj);
      this.parent.obj.add(this.obj);
    }
  };

  Agent.prototype.__make = function(AgentType) {
    // arguments isn't actually an array, but is enough like one that we can
    // call slice on it
    var agent = new AgentType();
    agent.color(this.color());
    return agent;
  };

  Agent.prototype.make = function(agentType) {
    var agent = this.__make(agentType);
    this.obj.updateMatrix();
    agent.obj.applyMatrix(this.obj.matrix);
    if (this.obj instanceof THREE.Scene) {
      this.addChild(agent);
    } else if (this.parent) {
      this.parent.addChild(agent);
    }
    return agent;
  };

  Agent.prototype.makeChild = function(agentType) {
    var agent = this.__make(agentType);
    this.addChild(agent, true);
    return agent;
  };

  Agent.prototype.killChildren = function() {
    // This is algorithmically inefficient, but it's not worth fixing since
    // as it's not actually noticeable.
    while (this.children.length > 0) {
      this.children[0].die();
    }
    this.childrenUsingMyColor = [];
  };

  Agent.prototype.die = function() {
    this.killChildren();
    if (this.parent) { this.parent.removeChild(this); }
    delete this.parent;
    this.listeners = [];
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

  Agent.prototype.text = function(text) {
    return this.make(TextAgent.bind(undefined, text));
  };

  Agent.prototype.hand = function() {
    return this.make(HandAgent);
  };

  Agent.prototype.person = function() {
    return this.make(PersonAgent);
  };

  Agent.prototype.every = function(ms, callback) {
    var wrapper = function () {
      if (this.parent) {
        callback.call(this);
        setTimeout(wrapper, ms);
      }
    }.bind(this);
    setTimeout(wrapper);
  };

  Agent.prototype.onTouch = function(callback) {
    callback = callback.bind(this);
    this.obj.addEventListener('collision', function (otherObject) {
      callback(otherObject.agent);
    });
    return this;
  };

  function SceneAgent(scene, renderer) {
    Agent.call(this, scene);
    this.renderer = renderer;
  }

  SceneAgent.prototype = Object.create(Agent.prototype);

  SceneAgent.prototype.color = function(color) {
    if (color) {
      this.renderer.setClearColor(color);
      return this;
    } else {
      return this.renderer.getClearColor();
    }
  };

  // The scene should never force children to be its color.
  SceneAgent.prototype.updateChildrensColor = function () {};

  function CubeAgent() {
    var material =
      Physijs.createMaterial(new THREE.MeshPhongMaterial(), 0.5, 0.5);
    var cube = new Physijs.BoxMesh(CubeAgent.geometry, material, 0 /*mass*/);
    Agent.call(this, cube);
  }

  CubeAgent.geometry = new THREE.CubeGeometry(1, 1, 1);

  CubeAgent.prototype = Object.create(Agent.prototype);

  function SphereAgent() {
    var material =
      Physijs.createMaterial(new THREE.MeshPhongMaterial(), 0.5, 0.5);
    // Although ConvexMesh is inefficient, scaling along an axis doesn't work
    // for spheres in Physijs (as that makes them not spheres). I did change
    // Physijs so it works for ConvexMeshes though. If the ineffeciency becomes
    // noticeable, I should use SphereMesh as long as the scaling is the same
    // in each dimension (I would have to implement this in Physijs as well).
    var sphere =
      new Physijs.ConvexMesh(SphereAgent.geometry, material, 0 /*mass*/);
    Agent.call(this, sphere);
  }
  SphereAgent.geometry = new THREE.SphereGeometry(0.5, 16, 16);
  SphereAgent.prototype = Object.create(Agent.prototype);


  function TextAgent(text) {
    var text3d = new THREE.TextGeometry(text, {
      size: 1,
      height: 1,
      curveSegments: 2,
      font: 'helvetiker'
    });

    text3d.computeBoundingBox();

    var textMaterial = new THREE.MeshPhongMaterial();
    var textMesh = new THREE.Mesh( text3d, textMaterial );
    Agent.call(this, textMesh);
  }

  TextAgent.prototype = Object.create(Agent.prototype);

  function CompositeAgent() {
    // The agent must be physical so that physics checks happen for it's 
    // children, and so that it can move and have velocity. However, we don't
    // want it to actually interact with anything. It's just holding it's
    // children together.
    var fakeMesh =
      new Physijs.SphereMesh(CompositeAgent.geometry,
                             CompositeAgent.material,
                             0 /*mass*/,
                             { collision_flags: 0 });
    fakeMesh.visible = false;
    Agent.call(this, fakeMesh);
    this.physical(false);
    this.__updatePhysical();
    this.compositeColor = new THREE.Color(0xffffff);
    for (var i = 0; i < arguments.length; i++) {
      this.addChild(arguments[i], this.color().equals(arguments[i].color()));
    }
  }

  CompositeAgent.geometry = new THREE.SphereGeometry(0.0);
  CompositeAgent.material =
    Physijs.createMaterial(new THREE.LineBasicMaterial(), 0, 0);

  CompositeAgent.prototype = Object.create(Agent.prototype);

  CompositeAgent.prototype.color = function (color) {
    if (color) {
      this.compositeColor.set(color);
      return this.updateChildrensColor();
    } else {
      return this.compositeColor;
    }
  };

  function HandAgent() {
    CompositeAgent.call(this);
    var back = this.makeChild(CubeAgent).bk(0.635).gl(-0.75).gt(-0.75);
    back.transparency(0.2);

    var right = this.makeChild(CubeAgent);
    right.bk(0.135).rt(90).fd(0.625).lt(90).gw(-0.75).gt(-0.75).gl(0.25);
    right.transparency(0.2);
    var left = right.cube().lt(90).fd(1.25).lt(90);
    left.transparency(0.2);

    var backBottom = this.makeChild(CubeAgent);
    backBottom.bk(0.635).gl(-0.75).gt(-0.625).gw(-0.75).dn(90).fd(0.312).up(90);
    backBottom.transparency(0.2);

    var bottom = right.cube().dn(90).fd(0.625).up(90).lt(90).fd(0.625).rt(90);
    bottom.transparency(0.2);
  }

  HandAgent.prototype = Object.create(CompositeAgent.prototype);

  function PersonAgent() {
    CompositeAgent.call(this);
    var torso = this.cube().dn(90).fd(1).up(90).gl(-0.5);
    var rightArm = torso.cube().rt(90).fd(0.625).lt(90).gw(-0.75).gl(-0.25);
    var leftArm = torso.cube().lt(90).fd(0.625).rt(90).gw(-0.75).gl(-0.25);
    var rightLeg = torso.cube()
      .rt(90).fd(0.25).lt(90).dn(90).fd(1).up(90).gw(-0.55).gl(-0.1);
    var leftLeg = torso.cube()
      .lt(90).fd(0.25).rt(90).dn(90).fd(1).up(90).gw(-0.55).gl(-0.1);
    this.shirt = new CompositeAgent(torso, rightArm, leftArm).color('green');
    this.addChild(this.shirt, false);
    this.pants = new CompositeAgent(rightLeg, leftLeg).color('blue');
    this.addChild(this.pants, false);
    this.makeChild(SphereAgent).obj.material.side = THREE.FrontSide;
  }

  PersonAgent.prototype = Object.create(CompositeAgent.prototype);

  return {
    repeat: repeat,
    Agent: Agent,
    SceneAgent: SceneAgent,
    CubeAgent: CubeAgent,
    SphereAgent: SphereAgent,
    HandAgent: HandAgent,
    CompositeAgent: CompositeAgent,
    PersonAgent: PersonAgent
  };
})(window.THREE, window.Physijs);
