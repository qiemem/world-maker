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
    this.points = 1;
    this.__updatePhysical();
  }
  Ball.material = Physijs.createMaterial(
      new THREE.MeshPhongMaterial(), 0.5, 0.5);
  Ball.geometry = new THREE.SphereGeometry(0.5, 32, 32);
  Ball.prototype = Object.create(agency.Agent.prototype);

  function Generator () {
    agency.CubeAgent.call(this);
    this.transparency(0.5).physical(false);
    this.every(2000, function () {this.make(Ball);});
  }
  Generator.prototype = Object.create(agency.CubeAgent.prototype);

  function Goal() {
    agency.CubeAgent.call(this);
    this.scored = 0;
    this.transparency(0.5);
    this.onTouch(function(other) {
      this.score(other.points);
      if (other.points) {
        other.die();
      }
    });
  }

  Goal.prototype = Object.create(agency.CubeAgent.prototype);

  Goal.prototype.score = function (points) {
    this.scored += points;
    this.transparency(0.5 - 0.5 * this.scored / 10);
  };

  return {
    RampAgent: RampAgent,
    Ball: Ball,
    Generator: Generator,
    Goal: Goal
  };
})(window.agency, window.Physijs, window.THREE);
