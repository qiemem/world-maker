
var editor, scene;

(function() {
  World.init(document.body);
  /*
     scene = new agency.Agent(World.scene());
     scene.onTick(function() {
     requestAnimationFrame(this.notify.bind(this, 'tick'));
     });
     scene.notify('tick');
     */
  editor = new Editor(document.body, levels.freeplay.reEval.bind(levels.freeplay));
  var cm = editor.editor;
  editor.completer = new Completer(cm, [], levels.freeplay.typedefNames, levels.freeplay.getTypedef.bind(levels.freeplay));
  if (window.location.hash) {
    cm.setValue(decodeURIComponent(window.location.hash.substr(1)));
  } else {
    /*
    cm.setValue([
        "// This code sets things up for you to make exploring a little easier",
        "var repeat = agency.repeat,",
        "    scene  = new agency.Agent(World.scene()),",
        "    cursor = scene.cursor();",
        "    //cursor = new agency.CursorAgent();",
        "//scene.addChild(cursor);",
        "// Use the cursor to create your world!",
        "",
        "// These lines create the introductory text you saw",
        "cursor.forward(30).right(90).backward(15).text('Walk around with the WASD keys and the mouse.');",
        "cursor.down(90).forward(2).up(90).text('Press ~ to go into edit mode.');",
        "",
        "// These lines put the cursor back in front of the camera",
        "cursor.up(90).forward(2).down(90).forward(15).left(90).backward(30);",
        "cursor.down(90).forward(1).up(90);",
        ""].join('\n'));
        */
  }
  cm.setCursor(cm.posFromIndex(cm.getValue().length));
  document.body.addEventListener('keypress', function(e) {
    if (e.charCode === '`'.charCodeAt(0)) {
      editor.toggleSlide();
      World.controls.freeze = editor.visible;
      if (editor.visible) {
        // Need setTimeout; otherwise the key actually registers in the
        // editor, typing `
        setTimeout(function(){editor.editor.focus();});
        World.switchControls(World.ControlModes.TRACKBALL);
      } else {
        editor.editor.getInputField().blur();
        World.switchControls(World.ControlModes.FIRST_PERSON);
      }
    }
    return false;
  });
  //editor.addPreEvalListener(scene.killChildren.bind(scene));
  editor.addPreEvalListener(World.reset);

  var saveTimeout;
  editor.addPostEvalListener(function() {
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }
    saveTimeout = setTimeout(function() {
      window.location.hash = encodeURIComponent(cm.getValue());
      saveTimeout = null;
    }, 100);
  });
})();
