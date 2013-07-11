
var editor, scene;

(function() {
  World.init(document.body);
  editor = new Editor(document.body, levels.freeplay.reEval.bind(levels.freeplay));
  var cm = editor.editor;
  editor.completer = new Completer(cm, [], levels.freeplay.typedefNames, levels.freeplay.getTypedef.bind(levels.freeplay));
  if (window.location.hash) {
    cm.setValue(decodeURIComponent(window.location.hash.substr(1)));
  } else {
    cm.setValue(levels.freeplay.initialContent);
  }
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
      window.location.hash = encodeURIComponent(cm.getValue());
      saveTimeout = null;
    }, 100);
  });
})();
