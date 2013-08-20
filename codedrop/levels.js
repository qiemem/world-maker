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
    ramp: {
      '!name': 'ramp',
      hand: {
        ramp: {
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
    pitch: {
      '!name': 'pitch',
      hand: {
        up: {
          '!suggest': '(90)',
          '!type': 'fn(angle: name) -> !this'
        },
        down: {
          '!suggest': '(90)',
          '!type': 'fn(angle: name) -> !this'
        }
      }
    },
    yaw: {
      '!name': 'yaw',
      hand: {
        left: {
          '!suggest': '(90)',
          '!type': 'fn(angle: name) -> !this'
        },
        right: {
          '!suggest': '(90)',
          '!type': 'fn(angle: name) -> !this'
        }
      }
    },
    roll: {
      hand: {
        rollLeft: {
          '!suggest': '(90)',
          '!type': 'fn(angle: name) -> !this'
        },
        rollRight: {
          '!suggest': '(90)',
          '!type': 'fn(angle: name) -> !this'
        }
      }
    },
    grow: {
      '!name': 'grow',
      hand: {
        grow: {
          '!type': 'fn(amount: number) -> !this',
          '!suggest': '(1.0)'
        },
        growWide: {
          '!type': 'fn(amount: number) -> !this',
          '!suggest': '(1.0)'
        },
        growLong: {
          '!type': 'fn(amount: number) -> !this',
          '!suggest': '(1.0)'
        },
        growTall: {
          '!type': 'fn(amount: number) -> !this',
          '!suggest': '(1.0)'
        },
      }
    },
    repeat: {
      '!name': 'repeat',
      repeat: {
        '!type': 'fn(times: number, fn(iteration: number))',
        '!suggest': '(10, function() {\n\n});\n'
      }
    }
  };

  function Level (setup, typedefs, typeDefNames, helpPages) {
    levels.Level.call(this, '', this.reEval, typedefs, typeDefNames);
    this.setup = setup;
    this.helpPages = helpPages;
    this.canWin = true;
  }

  Level.prototype = Object.create(levels.Level.prototype);

  Level.prototype.reEval = function (code)  {
    if (!this.scene) {
      this.scene = new agency.SceneAgent(World.scene(), World.renderer());
      this.scene.obj.setGravity(new THREE.Vector3(0, -15.0, 0));
    }
    this.scene.killChildren();
    this.goals = [];
    this.hand = this.scene.hand().physical(false).color('white');
    this.setup(code);
  };

  Level.prototype.hasWon = function() {
    if (!this.canWin) { return false; }
    for (var i=0; i < this.goals.length; i++) {
       if (this.goals[i].scored < 3) {
        return false;
      }
    }
    return true;
  };

  Level.prototype.checkWin = function() {
    if (this.hasWon()) {
      $.colorbox({
        html: '<h1>You win!</h1>' +
              '<a href="index.html">Play another level</a>',
        overlayClose: false,
        trapFocus: false
      });
    }
  };

  Level.prototype.addGoal = function() {
    var level = this;
    var goal = this.scene.make(CodeDrop.agents.Goal)
                         .color('green');
    goal.onTouch(function(other) {
      if (other.points) {
        this.score(other.points);
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
    return this.scene.make(agency.CubeAgent).color('white');
  };

  Level.prototype.addContainer = function() {
    return this.scene.make(CodeDrop.agents.Container).color('grey');
  };

  var one = new Level(
    function(code) {
      this.addGenerator();
      this.addGoal().translate(2.0, -5.0, 0.0);
      this.hand.translate(0.0, -3.0, 0.0).down(15);
      new Function('hand', code) (this.hand);
    }, typedefs ,
    ['cube'],
    ['intro.html', 'open.html', 'suggestions.html']
  );

  var two = new Level(
    function(code) {
      this.addGenerator();
      this.addGoal().translate(5.0, -5.0, 0.0);
      this.addWall().translate(0.0, -4.0, 0.0).down(15);
      this.hand.translate(0.0, -5.0, 0.0);
      new Function('hand', code)(this.hand);
    }, typedefs,
    ['cube', 'move'],
    ['forwardbackward.html', 'multiplelines.html', 'chaining.html', 'numbers.html', 'goodluck.html']
  );

  var three = new Level(
    function(code) {
      this.addGenerator();
      this.addGoal().translate(0.0, -10.0, 0.0);
      this.addWall().translate(0.0, -5.0, 0.0).gw(2.0).gt(2.0);
      this.hand.translate(0.0, -2.0, 0.0);
      new Function('hand', code)(this.hand);

    }, typedefs,
    ['cube', 'move', 'pitch']);

  var four = new Level(
    function(code) {
      this.addGenerator().translate(0.0, 10.0, 0.0);
      this.addGoal().translate(0.0, -10.0, 0.0);
      this.addWall().translate(-3.0, 3.0, 0.0).gl(20).gw(1)
          .cube().translate(6.0, -6.0, 0.0);
      this.addWall().translate(-13, 6.0, 0.0).gt(6).gw(1)
          .cube().translate(26, -6.0, 0.0);
      this.hand.translate(0.0, 7.0, 0.0);
      new Function('hand', code)(this.hand);
    }, typedefs,
    ['cube', 'move', 'pitch', 'grow', 'ramp']);

  var five = new Level(
    function(code) {
      var size = 15,
          fullTurns = 1,
          heightPerTurn = 10,
          levelMaker = this.scene.hand().color('white');
      this.addContainer()
          .gw(2*size).gl(2*size).gt(16 * heightPerTurn * fullTurns);
      this.addGenerator().translate(0.0, 3.0, -5);
      this.hand.translate(0.0, 0.0, -5);
      this.addGoal().translate(0.0, -4*fullTurns*heightPerTurn, 0.0)
                    .gw(2*size).gl(2*size);
      levelMaker.translate(0.0, -heightPerTurn / 2, 0.0);
      agency.repeat(4*fullTurns, function() {
        levelMaker.cube().bk(size/2 - 1).gl(size + 2).gw(2*size);
        levelMaker.translate(0.0, -heightPerTurn, 0.0).right(90);
      });
      levelMaker.die();
      new Function('hand', code)(this.hand);
    }, typedefs,
    ['cube', 'move', 'pitch', 'yaw', 'roll', 'grow', 'ramp']);

  var six = new Level(
    function(code) {
      var size = 15,
      fullTurns = 4,
      heightPerTurn = 10,
      levelMaker = this.scene.hand().color('white');
      this.addContainer()
      .gw(2*size).gl(2*size).gt(16 * heightPerTurn * fullTurns);
      this.addGenerator().translate(0.0, 3.0, -5);
      this.hand.translate(0.0, 0.0, -5);
      this.addGoal().translate(0.0, -4*fullTurns*heightPerTurn, 0.0)
      .gw(2*size).gl(2*size);
      levelMaker.translate(0.0, -heightPerTurn / 2, 0.0);
      agency.repeat(4*fullTurns, function() {
        levelMaker.cube().bk(size/2 - 1).gl(size + 2).gw(2*size);
        levelMaker.translate(0.0, -heightPerTurn, 0.0).right(90);
      });
      levelMaker.die();
      new Function('hand', code)(this.hand);
    }, typedefs,
    ['cube', 'move', 'pitch', 'yaw', 'roll', 'grow', 'ramp', 'repeat']);

  return {
    one: one,
    two: two,
    three: three,
    four: four,
    five: five,
    six: six,
    levels: ['one', 'two', 'three', 'four', 'five', 'six']
  };
})(agency, levels);
