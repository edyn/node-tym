
var assert = require('assert');

var statdCli = null;
exports.useStatsd = function(statsd){
  statdCli = statsd;
}

function Tym(prefix){
  this.prefix = prefix + '.';
  if (!this.prefix) {
    this.prefix = 'tym.';
  }
}

Tym.prototype.begin = function (name){
  assert.ok(name, 'tym.begin : name need to be not nil');
  if (!statdCli) {
    return func;
  }

  var stats = statdCli;
  var prefix = this.prefix;

  var hrstart = process.hrtime();

  return {
    end: function(){
      var hrend = process.hrtime(hrstart);
      var milisecs = hrend[0]*1000 + hrend[1]/1000000;

      stats.timing(prefix + name, milisecs);
    }
  }
}

Tym.prototype.e = function timeFunction(func){
  if (!statdCli) {
    return func;
  }

  var stats = statdCli;
  var prefix = this.prefix;

  assert.ok(func, 'tym.e : function need to be not nil');
  assert.equal(typeof func, 'function', "The parameter need to be a function");

  var hrstart = process.hrtime();

  // Match:
  // - the beginning of the string
  // - the word 'function'
  // - at least some whitespace
  // - capture one or more valid javascript identifier characters
  // - optionally followed by whitespace
  // - followed by an opening brace
  //
  var match = /^function\s+([\w\$]+)\s*\(/.exec(func.toString());

  var funcName = "anonymous";

  if (match) {
    funcName = match[1];
  }

  return function(){
    var hrend = process.hrtime(hrstart);
    var milisecs = hrend[0]*1000 + hrend[1]/1000000;

    // How long did it take before the callback is called
    stats.timing(prefix + funcName, milisecs);

    //console.log(arguments)
    func.apply(this, arguments);

    var hrend2 = process.hrtime(hrstart);
    milisecs = hrend2[0]*1000 + hrend2[1]/1000000;

    // How long did it take between the start and the end of the callback
    stats.timing(prefix + funcName + '.done', milisecs);
  };
}

exports.create = function(prefix){
  return new Tym(prefix);
}