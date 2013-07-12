CodeDrop = window.CodeDrop || {};
CodeDrop.agents = (function (agency) {
  'use strict';

  agency.Agent.prototype.ramp = function () {
    return this.make(RampAgent);
  };

  function RampAgent () {
    agency.CompositeAgent.call(this);
    this.makeChild(agency.CubeAgent).growTall(-.75).rollRight(45).bounciness(0).friction(0);
    this.makeChild(agency.CubeAgent).growTall(-.75).rollLeft(45).bounciness(0).friction(0);
  }

  RampAgent.prototype = Object.create(agency.CompositeAgent.prototype);

  function Ball () {
    var sphere = new Physijs.SphereMesh(Ball.geometry, Ball.material, 1);
    agency.Agent.call(this, sphere);
    this.points = 1;
    this.physicalFactor = 0.5;
    this.__updatePhysical();
  };
  Ball.material = Physijs.createMaterial(new THREE.MeshPhongMaterial(), .5, .5);
  Ball.geometry = new THREE.SphereGeometry(0.5, 16, 16);
  Ball.prototype = Object.create(agency.Agent.prototype);

  function Generator () {
    agency.CubeAgent.call(this);
    this.transparency(0.5).physical(false);
    this.every(2000, function () {this.make(Ball);});
  }
  Generator.prototype = Object.create(agency.CubeAgent.prototype);

  function Goal() {
    agency.CubeAgent.call(this);
    this.transparency(0.5);
    this.onTouch(function(other) {
      if (other.points) {
        other.die();
      }
      console.log('You scored ' + other.points + ' points!');
    });
  }
  Goal.prototype = Object.create(agency.CubeAgent.prototype);
  
  return {
    RampAgent: RampAgent,
    Ball: Ball,
    Generator: Generator,
    Goal: Goal
  }
})(agency)
