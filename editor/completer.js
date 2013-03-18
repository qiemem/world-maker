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
          // We want to replace the currently selected text. Hence, we pretend
          // it's not there. This removes it:
          startText = this.cm.getValue().substr(0, start),
          endText = this.cm.getValue().substr(end),
          text = startText + endText,
          req = {
            query: {
              file: EDITOR_NAME,
              end:  start,  // since we cut out the selected text
              type: 'completions'
            },
            // The editor won't get very big, so just reload it every time
            files: [{
              name: EDITOR_NAME,
              text: text,
              type: 'full'
            }]
          },
          dotText = startText + '.' + endText,
          dotReq = {
            query: {
              file: EDITOR_NAME,
              end: start + 1, // since we added the '.'
              type: 'completions'
            },
            files: [{
              name: EDITOR_NAME,
              text: dotText,
              type: 'full'
            }]
          };

      this.server.request(req, function (err, results) {
        console.log(err, results);
        this.server.request(dotReq, function (dotErr, dotResults) {
          var comps = results.completions.map(function (compObj) {
            return compObj.name;
          });
          var dotComps = dotResults.completions.map(function (compObj) {
            return '.' + compObj.name;
          });
          callback(dotComps.concat(comps));
        });
      }.bind(this));
    }.bind(this);

    loadEnvironment(this.jsonLibs, function (env) {
      this.startServer(env);
      complete(pos, callback);
    }.bind(this));
  };

  return Completer;
})(tern, d3);