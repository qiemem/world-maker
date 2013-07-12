CodeDrop = window.CodeDrop || {};
CodeDrop.agents = (function (agency) {
  'use strict';

  agency.Agent.prototype.ramp = function () {
    return this.make(RampAgent);
  };

  function RampAgent () {
    agency.CompositeAgent.call(this);
    this.makeChild(agency.CubeAgent).growTall(-.75).rollRight(15).bounciness(0).friction(0);
    this.makeChild(agency.CubeAgent).growTall(-.75).rollLeft(15).bounciness(0).friction(0);
  }

  RampAgent.prototype = Object.create(agency.CompositeAgent.prototype);
  
  return {
    RampAgent: RampAgent
  }
})(agency)
