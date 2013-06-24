var Completer = (function (tern, d3) {
  'use strict';

  // The name that the editor's contents will go by
  var EDITOR_NAME = 'editor';

  function loadEnvironment (files, getTypedef, callback) {
    var loaded = [];
    files.forEach(function(f){
      getTypedef(f, function (e, d) {
        loaded.push(d);
        if (loaded.length === files.length) {
          callback(loaded);
        }
      });
    });
    if (files.length === 0) {
      callback([]);
    }
  }

  function buildRequest(text, type, end) {
    return {
      query: {
        file: EDITOR_NAME,
        end:  end,
        type: type,
        sort: false
      },
      // The editor won't get very big, so just reload it every time
      files: [{
        name: EDITOR_NAME,
        text: text,
        type: 'full'
      }]
    };
  }

  /**
      Calls each each function in asyncFuncs and collects their results in an
      array. Then calls callback with the resulting array. Each async function
      should take exactly one argument: a callback function which takes an
      error and a result.
    */
  function collectAsync(asyncFuncs, callback) {
    var results = [],
        n = asyncFuncs.length,
        returned = 0;
    asyncFuncs.forEach(function(async, i) {
      async(function (err, res) {
        results[i] = [err, res];
        if (++returned === n) {
          callback(results);
        }
      });
    });
  }

  function Completer(cm, jsLibs, jsonLibs, getTypedef) {
    this.getTypedef = getTypedef;
    this.cm = cm;
    this.jsLibs = jsLibs;
    this.jsonLibs = jsonLibs;
    this.env = {};
  }

  Completer.prototype.getFile = function (name, callback) {
    if (name === EDITOR_NAME) {
      callback(null, this.cm.getValue());
    } else {
      d3.text(name).get(callback);
    }
  };

  Completer.prototype.getMetadata = function (name) {
    var env = this.env,
        path = name.split('.');
    for (var i = 0; i < path.length; i++) {
      if (env[path[i]]) {
        env = env[path[i]];
      }
    }
    return env;
  };

  Completer.prototype.getSuggestion = function (name) {
    return this.getMetadata(name)['!suggest'];
  };

  Completer.prototype.startServer = function(environment) {
    this.server = new tern.Server({
      getFile: this.getFile.bind(this),
      defs: environment,
      async: true
    });
    for (var i = 0; i < this.jsLibs.length; i++) {
      this.server.addFile(this.jsLibs[i]);
    }
    this.server.addFile(EDITOR_NAME);
  };

  /**
      Requests completions from the server whether or not the server is ready.
    */
  Completer.prototype.unsafeComplete = function (pos, callback) {
    var start = this.cm.indexFromPos(this.cm.getCursor('start')),
        end = this.cm.indexFromPos(this.cm.getCursor('end')),
        // We want to replace the currently selected text. Hence, we pretend
        // it's not there. This removes it:
        startText = this.cm.getValue().substr(0, start),
        // The '\n' is to prevent 0 byte code from getting sent. The parser
        // freaks out when that happens
        endText = this.cm.getValue().substr(end)+'\n',
        text = startText + endText,
        // complete at start since we cut out the selected text
        req = buildRequest(text, 'completions', start),
        dotText = startText + '.' + endText,
        dotReq = buildRequest(dotText, 'completions', start + 1);
    // Request valid completion strings.
    collectAsync([
      this.server.request.bind(this.server, req),
      this.server.request.bind(this.server, dotReq)
    ], function (results) {
      // FIXME: Check for errors in the results.
      var start = results[0][1].start,
          end = results[0][1].end,
          expressions = results[0][1].completions,
          methods = results[1][1].completions.map(function (method) {
            return '.' + method;
          }),
          comps = methods.concat(expressions),
          compTypeReqs = comps.map(function (comp) {
            var compTypeReq = buildRequest(
              startText + comp.substr(end-start) + endText,
              'type',
              start + comp.length);
            return this.server.request.bind(this.server, compTypeReq);
          }.bind(this));
      // Insert those completion strings into the text and request the resulting
      // type. Then, use that type to get argument suggestions.
      collectAsync(compTypeReqs, function (typeResults) {
        var filledCompletions = typeResults.map(function (typeRes, i) {
          var comp = comps[i];
          if (typeRes[1] && typeRes[1].name) {
            var suggest = this.getSuggestion(typeRes[1].name);
            if (suggest) {
              return comp + suggest;
            }
          }
          return comp;
        }.bind(this));
        callback(filledCompletions, start, end);
      }.bind(this));
    }.bind(this));
  };

  Completer.prototype.complete = function (pos, callback) {
    if (this.server) {
      this.unsafeComplete(pos, callback);
    } else {
      loadEnvironment(this.jsonLibs, this.getTypedef, function (env) {
        // TODO: Make this recursive
        for (var i=0; i<env.length; i++) {
          for (var key in env[i]) {
            this.env[key] = env[i][key];
          }
        }
        this.startServer(env);
        this.unsafeComplete(pos, callback);
      }.bind(this));
    }
  };

  return Completer;
})(tern, d3);
