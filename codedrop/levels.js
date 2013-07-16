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
    this.goals = [];
    this.hand = this.scene.hand().physical(false).color('white')
                          .translate(0.0, -3.0, 0.0).down(15);
    this.setup(code);
  };

  Level.prototype.hasWon = function() {
    for (var i=0; i < this.goals.length; i++) {
      if (this.goals[i].score < 10) {
        return false;
      }
    }
    return true;
  };

  Level.prototype.checkWin = function() {
    if (this.hasWon()) {
      alert('You win!');
    }
  };

  Level.prototype.addGoal = function() {
    var level = this;
    var goal = this.scene.make(CodeDrop.agents.Goal).color('blue');
    goal.onTouch(function(other) {
      if (other.points) {
        this.score += other.points;
        other.die();
        level.checkWin();
      }
    });
    this.goals.push(goal);
    return goal;
  };

  var one = new Level(
    function(code) {
      this.scene.make(CodeDrop.agents.Generator).color('blue');
      this.addGoal().translate(2.0, -5.0, 0.0).transparency(0.5).color('green');
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
