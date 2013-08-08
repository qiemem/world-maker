/* global World */
/* global THREE */
/* global agency */
/* global levels */

var CodeDrop = window.CodeDrop || {};
CodeDrop.levels = (function(agency, levels) {
  'use strict';
  
  var typedefs = {
    cube: {
      '!name': 'cube',
      hand: {
        cube: {
          '!suggest': '()',
          '!type': 'fn() -> hand'
        }
      }
    },
    move: {
      '!name': 'move',
      hand: {
        forward: {
          '!suggest': '(1.0)',
          '!type': 'fn(distance: number) -> !this'
        },
        backward: {
          '!suggest': '(1.0)',
          '!type': 'fn(distance: number) -> !this'
        }
      }
    },
    turn: {
      '!name': 'turn',
      hand: {
        left: {
          '!suggest': '(90)',
          '!type': 'fn(angle: name) -> !this'
        },
        right: {
          '!suggest': '(90)',
          '!type': 'fn(angle: name) -> !this'
        },
        up: {
          '!suggest': '(90)',
          '!type': 'fn(angle: name) -> !this'
        },
        down: {
          '!suggest': '(90)',
          '!type': 'fn(angle: name) -> !this'
        },
        rollLeft: {
          '!suggest': '(90)',
          '!type': 'fn(angle: name) -> !this'
        },
        rollRight: {
          '!suggest': '(90)',
          '!type': 'fn(angle: name) -> !this'
        }
      }
    }
  };

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
    this.hand = this.scene.hand().physical(false).color('white');
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
      console.log('You win!');
    }
  };

  Level.prototype.addGoal = function() {
    var level = this;
    var goal = this.scene.make(CodeDrop.agents.Goal)
                         .color('green')
                         .transparency(0.1);
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

  Level.prototype.addGenerator = function() {
    return this.scene.make(CodeDrop.agents.Generator).color('blue');
  };

  Level.prototype.addWall = function() {
    return this.addWall();
  };

  Level.prototype.addContainer = function() {
    var container = this.scene.make(agency.CompositeAgent).color('grey'),
        transparency = 0.5;
    container.makeChild(agency.CubeAgent)
             .translate(0.55, 0.0, 0.0).gl(-0.9).transparency(transparency);
    container.makeChild(agency.CubeAgent)
             .translate(-0.55, 0.0, 0.0).gl(-0.9).transparency(transparency);
    container.makeChild(agency.CubeAgent)
             .translate(0.0, 0.55, 0.0).gt(-0.9).transparency(transparency);
    container.makeChild(agency.CubeAgent)
             .translate(0.0, -0.55, 0.0).gt(-0.9).transparency(transparency);
    container.makeChild(agency.CubeAgent)
             .translate(0.0, 0.0, 0.55).gw(-0.9).transparency(transparency);
    container.makeChild(agency.CubeAgent)
             .translate(0.0, 0.0, -0.55).gw(-0.9).transparency(transparency);
    return container;
  };

  var one = new Level(
    function(code) {
      this.addGenerator();
      this.addGoal().translate(2.0, -5.0, 0.0);
      this.hand.translate(0.0, -3.0, 0.0).down(15);
      new Function('hand', code) (this.hand);
    }, typedefs ,
    ['cube']);

  var two = new Level(
    function(code) {
      this.addGenerator();
      this.addGoal().translate(5.0, -5.0, 0.0);
      this.addWall().translate(0.0, -4.0, 0.0).down(15);
      this.hand.translate(0.0, -5.0, 0.0);
      new Function('hand', code)(this.hand);
    }, typedefs,
    ['cube', 'move']);

  var three = new Level(
    function(code) {
      this.addGenerator();
      this.addGoal().translate(0.0, -10.0, 0.0);
      this.addWall().translate(0.0, -5.0, 0.0).gw(2.0).gt(2.0);
      this.hand.translate(0.0, -2.0, 0.0);
      new Function('hand', code)(this.hand);

    }, typedefs,
    ['cube', 'move', 'turn']);

  var four = new Level(
    function(code) {
      this.addGenerator().backward(12.5);
      this.addGoal().translate(0.0, -50.0, 0.0);
      this.addContainer().gw(50.0).gl(50.0).gt(200.0);
      new Function('hand', code)(this.hand);
    }, typedefs,
    ['cube', 'move', 'turn']
    );

  return {
    one: one,
    two: two,
    three: three,
    four: four
  };
})(agency, levels);
