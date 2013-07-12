CodeDrop = window.CodeDrop || {};
CodeDrop.levels = (function(agency, levels) {
  'use strict';

  function Level (setup, typedefs, typeDefNames) {
    levels.Level.call(this, '', this.reEval, typedefs, typeDefNames);
    this.setup = setup;
  }

  Level.prototype.reEval = function (code)  {
    if (!this.scene) {
      this.scene = new agency.SceneAgent(World.scene(), World.renderer());
      this.scene.obj.setGravity(new THREE.Vector3(0, -10.0, 0));
    }
    this.scene.killChildren();
    this.setup();
  };


})(agency, levels);
