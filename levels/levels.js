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
  function Level (initialContent, reEval, typedefs, typedefNames) {
    this.initialContent = initialContent;
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

  Level.prototype.createAvatar = function() {
    var avatar = new agency.PersonAgent().onTick(function() {
      this.obj.position = World.playerPosition();
      var lookAt = World.playerDirection();
      lookAt.set(-lookAt.z, 0, lookAt.x);
      this.obj.lookAt(lookAt);
    });
    avatar.notify('tick');
    return avatar;
  }


  var freeplay = new Level( [
      "var hand = new agency.HandAgent();",
      "scene.addChild(hand);",
      "// The above code gives you the hand to play with.\n\n"
      ].join('\n'),
      function(code) {
        if (!this.scene) {
          this.scene = new agency.SceneAgent(World.scene(), World.renderer());
          this.scene.onTick(function() {
            requestAnimationFrame(this.notify.bind(this, 'tick'));
          });
          this.scene.notify('tick');
        }
        this.scene.killChildren();
        window.player = this.createAvatar();
        this.scene.addChild(player);
        new Function('scene', 'repeat', 'player', code) (this.scene, agency.repeat, player);
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
          scene: "+agency.Agent",
          player: "+agency.PersonAgent"
        }
      }), ['agency/agency.json', 'basic']);

  return {
    freeplay: freeplay
  }
})();
