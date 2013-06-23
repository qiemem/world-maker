var levels = (function() {
  'use strict';
  
  /*
   * Needs:
   * - setup level
   *   - world contents
   *   - objects available to user
   * - provide initial contents of editor
   *   - Maybe not
   * - provide type definitions
   *   - in particular of objects available to user
   */
  function Level (reEval, typedefs, typedefNames) {
    this.reEval = reEval;
    this.typedefs = typedefs;
    this.typedefNames = typedefNames;
  }

  Level.prototype.getTypedef = function (name, callback) {
    if (name in this.typedefs) {
      callback(null, this.typedefs[name]);
    } else {
      d3.json(name, callback);
    }
  }

  var freeplay = new Level(function(code) {
    if (this.scene) {
      this.scene.killChildren();
    } else {
      this.scene = new agency.Agent(World.scene());
    }
    new Function('scene', 'repeat', code) (
     this.scene, agency.repeat);
  }, ({
    basic: {
      "!name": "basic",
      // I should be able to do 
      // repeat: "agency.repeat"
      repeat: {
        "!type": "fn(times: number, fn(iteration: number))",
        "!suggest": "(10, function() {\n\n});\n"
      },
      // Both
      // +agency.Agent
      // and
      // agency.Agent.prototype
      // should work, but they don't. They work when I put the declarations
      // in agency.json itself.
      scene: "+agency.Agent"
    }
  }), ['agency/agency.json', 'basic']);

  return {
    freeplay: freeplay
  }
})();
