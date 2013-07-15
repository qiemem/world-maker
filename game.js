var editor, scene;

(function() {
  var cm,
      level,
      levelName='',
      code = '';
  World.init(document.body);
  if (window.location.hash) {
    var hash = decodeURIComponent(window.location.hash.substr(1)),
        codeIndex = hash.indexOf('#'),
        levelName = '';
    if (codeIndex >= 0) {
      levelName = hash.substr(0, codeIndex);
      code = hash.substr(codeIndex + 1);
    } else {
      levelName = hash;
    }
    if (CodeDrop.levels[levelName]) {
      level = CodeDrop.levels[levelName];
    }
  } else {
    level = levels.freeplay;
  }
  if (!code) {
    code = level.initialContent;
  }
  window.editor = 
    new Editor(document.body, level.reEval.bind(level));
  cm = editor.editor;
  editor.completer = new Completer(
    cm, [], level.typedefNames,
    level.getTypedef.bind(level));
  cm.setValue(code);
  cm.setCursor(cm.posFromIndex(cm.getValue().length));
  document.body.addEventListener('keypress', function(e) {
    if (e.charCode === '`'.charCodeAt(0)) {
      editor.toggleSlide();
      if (editor.visible) {
        // Need setTimeout; otherwise the key actually registers in the
        // editor, typing `
        setTimeout(function(){editor.editor.focus();});
      } else {
        editor.editor.getInputField().blur();
      }
    }
    return false;
  });

  var saveTimeout;
  editor.addPostEvalListener(function() {
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }
    saveTimeout = setTimeout(function() {
      window.location.hash = encodeURIComponent(levelName + '#' + cm.getValue());
      saveTimeout = null;
    }, 100);
  });
})();
