var CodeDrop = window.CodeDrop || {};
CodeDrop.agents = (function (agency, Physijs, THREE) {
  'use strict';
  
  agency.Agent.prototype.ramp = function () {
    return this.make(RampAgent);
  };

  function RampAgent () {
    agency.CompositeAgent.call(this);
    this.makeChild(agency.CubeAgent)
      .growTall(-0.9).rollRight(45).bounciness(0).friction(0);
    this.makeChild(agency.CubeAgent)
      .growTall(-0.9).rollLeft(45).bounciness(0).friction(0);
  }

  RampAgent.prototype = Object.create(agency.CompositeAgent.prototype);

  function Ball () {
    // SphereMesh seems to be buggy in ammo.js
    var sphere = new Physijs.ConvexMesh(Ball.geometry, Ball.material, 1);
    agency.Agent.call(this, sphere);
    this.bounciness(0.1);
    this.points = 1;
    this.__updatePhysical();
  }
  Ball.material = Physijs.createMaterial(
      new THREE.MeshPhongMaterial(), 0.5, 0.5);
  Ball.geometry = new THREE.SphereGeometry(0.5, 32, 32);
  Ball.prototype = Object.create(agency.Agent.prototype);

  function Generator () {
    agency.CubeAgent.call(this);
    this.physical(false);
    this.every(5000, function () {this.make(Ball);});
  }
  Generator.prototype = Object.create(agency.CubeAgent.prototype);

  function Goal() {
    agency.CubeAgent.call(this);
    this.scored = 0;
    this.transparency(0.5);
    this.score(0);
  }

  Goal.prototype = Object.create(agency.CubeAgent.prototype);

  Goal.prototype.score = function (points) {
    this.scored += points;
    this.transparency(0.4 * (1 - this.scored / 3));
  };

  function Container() {
    agency.CompositeAgent.call(this);
    var transparency = 0.5;
    this.makeChild(agency.CubeAgent)
        .translate(0.55, 0.0, 0.0).gl(-0.901).transparency(transparency);
    this.makeChild(agency.CubeAgent)
        .translate(-0.55, 0.0, 0.0).gl(-0.901).transparency(transparency);
    this.makeChild(agency.CubeAgent)
        .translate(0.0, 0.55, 0.0).gt(-0.901).transparency(transparency);
    this.makeChild(agency.CubeAgent)
        .translate(0.0, -0.55, 0.0).gt(-0.901).transparency(transparency);
    this.makeChild(agency.CubeAgent)
        .translate(0.0, 0.0, 0.55).gw(-0.901).transparency(transparency);
    this.makeChild(agency.CubeAgent)
        .translate(0.0, 0.0, -0.55).gw(-0.901).transparency(transparency);
  }
  Container.prototype = Object.create(agency.CompositeAgent.prototype);

  return {
    RampAgent: RampAgent,
    Ball: Ball,
    Generator: Generator,
    Goal: Goal,
    Container: Container
  };
})(window.agency, window.Physijs, window.THREE);
