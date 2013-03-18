var Completer = (function (tern, d3) {
  'use strict';

  // The name that the editor's contents will go by
  var EDITOR_NAME = 'editor';

  function loadEnvironment (files, callback) {
    var loaded = [];
    files.forEach(function(f){
      d3.json(f, function (e, d) {
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

  function Completer(cm, jsLibs, jsonLibs) {
    this.cm = cm;
    this.jsLibs = jsLibs;
    this.jsonLibs = jsonLibs;
  }

  Completer.prototype.getFile = function (name, callback) {
    if (name === EDITOR_NAME) {
      callback(null, this.cm.getValue());
    } else {
      d3.text(name).get(callback);
    }
  };

  Completer.prototype.startServer = function(environment) {
    this.server = new tern.Server({
      getFile: this.getFile.bind(this),
      environment: environment
    });
    for (var i = 0; i < this.jsLibs.length; i++) {
      this.server.addFile(this.jsLibs[i]);
    }
    this.server.addFile(EDITOR_NAME);
  };

  Completer.prototype.complete = function (pos, callback) {
    var complete = function (pos, callback) {
      var start = this.cm.indexFromPos(this.cm.getCursor('start')),
          end = this.cm.indexFromPos(this.cm.getCursor('end')),
          doc = {
            query: {
              file: EDITOR_NAME,
              start: start,
              end:  end,
              type: 'completions'
            },
            // The editor won't get very big, so just reload it every time
            files: [{
              name: EDITOR_NAME,
              text: this.cm.getValue(),
              type: 'full'
            }]
          };
      this.server.request(doc, function (err, results) {
        console.log(err, results);
        callback(results.completions.map(function (compObj) {
          return compObj.name;
        }));
      });
    }.bind(this);

    loadEnvironment(this.jsonLibs, function (env) {
      this.startServer(env);
      complete(pos, callback);
    }.bind(this));
  };

  return Completer;
})(tern, d3);