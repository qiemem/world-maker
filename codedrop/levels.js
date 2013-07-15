/* global World */
/* global THREE */
/* global agency */
/* global levels */

var CodeDrop = window.CodeDrop || {};
CodeDrop.levels = (function(agency, levels) {
  'use strict';

  function Level (setup, typedefs, typeDefNames) {
    levels.Level.call(this, '', this.reEval, typedefs, typeDefNames);
    this.setup = setup;
  }

  Level.prototype = Object.create(levels.Level.prototype);

  Level.prototype.reEval = function (code)  {
    if (!this.scene) {
      this.scene = new agency.SceneAgent(World.scene(), World.renderer());
      this.scene.obj.setGravity(new THREE.Vector3(0, -10.0, 0));
    }
    this.scene.killChildren();
    this.hand = this.scene.hand().physical(false).color('white')
                          .translate(0.0, -3.0, 0.0).down(15);
    this.setup(code);
  };

  var one = new Level(
    function(code) {
      this.scene.make(CodeDrop.agents.Generator).color('blue');
      this.scene.make(CodeDrop.agents.Goal).translate(2.0, -5.0, 0.0)
                .transparency(0.5).color('green');
      new Function('hand', code) (this.hand);
    },
    {
      one: {
        '!name': 'one',
        hand: {
          cube: { '!suggest': '()' }
        }
      }
    },
    ['one']);


  return {
    one: one
  };
})(agency, levels);
