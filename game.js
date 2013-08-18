var editor, scene;

(function(World, Editor, CodeDrop, levels, Completer, $) {
  'use strict';

  function queryObj() {
    var queryString = location.search,
        result = {},
        keyValuePairs;
    if (queryString[queryString.length - 1] === '/') {
      queryString = queryString.substr(0, queryString.length - 1);
    }
    keyValuePairs = queryString.slice(1).split('&');

    keyValuePairs.forEach(function(keyValuePair) {
      keyValuePair = keyValuePair.split('=');
      result[keyValuePair[0]] = keyValuePair[1] || '';
    });

    return result;
  }

  function encodeQuery(params) {
    var queryList = [];
    for (var key in params) {
      if (params.hasOwnProperty(params)) {
        queryList.push(encodeURIComponent(key + '=' + params[key]));
      }
    }
    return queryList.join('&');
  }

  var cm,
      level,
      code = '',
      query = queryObj();
  World.init(document.body);

  if (query.level) {
    level = CodeDrop.levels[query.level];
    code = decodeURIComponent(window.location.hash.substr(1)) ||
           level.initialContent;

    window.editor = new Editor(document.body, level.reEval.bind(level));
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
        window.location.hash = encodeURIComponent(cm.getValue());
        saveTimeout = null;
      }, 100);
    });
  } else {
    $('canvas').remove();
    $(document.body).append('<div class="menu"></div>')
    $('.menu').append('<h1>Code Drop</h1>');
    $('.menu').append('<h2>Select Level</h2>');
    $('.menu').append('<ol class="levels"></ol>');
    CodeDrop.levels.levels.forEach(function (level) {
      var query = '?level=' + level;
      $('.levels').append('<li class="levelbutton"><a href="index.html'+query+'">'+level+'</a></li>');
    });
  }


})(World, Editor, CodeDrop, levels, Completer, $);
