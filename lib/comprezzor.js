
var laeh2 = require('laeh2');
var _x = laeh2._x;
var _e = laeh2._e;

var zlib = require('zlib');
var util = require('util');
var clone = require('clone');
var fs = require('fs');

module.exports = function(compress, opts) {

    var zo = clone(opts);

    [ 'level', 'strategy' ].forEach(function(opt) {
        if(typeof(zo[opt]) === 'string')
            zo[opt] = zlib[zo[opt]];
    });

    var type = compress ? 'DeflateRaw' : 'InflateRaw';
    var z, _cb, buf = [], size = 0;

    function cb(err, res) {
        if(!_cb)
            return;
        size = 0;
        buf = [];
        if(z) {
            //z.reset();
            z.removeListener('readable', step);
            z = null;
        }
        var __cb = _cb;
        _cb = null;
        __cb(err, res);
    }

    this.onEnd = _x(cb, false, function() {
        var b = Buffer.concat(buf, size);
        cb(null, compress ? b : b.toString('utf8'));
    });

    this.init = function() {
        z = zlib['create' + type](zo);
        z.on('error', cb);
        z.on('end', this.onEnd);
    }

    this.info = function() {
        return util.format('compression: [type: %s] [bits: %d] [mem: %d] ' +
            '[buffer: %d] [level: %s] [strategy: %s]',
            type, opts.windowBits, opts.memLevel,
            ((1 << (opts.windowBits+2)) +  (1 << (opts.memLevel+9))),
            opts.level, opts.strategy);
    };

    function step() {
        var chunk;
        while(null !== (chunk = z.read())) {
          buf.push(chunk);
          size += chunk.length;
        }
        z.once('readable', step);
    }

    this.make = function(string, __cb) {
        if(_cb)
            _e('currently in use');
        _cb = __cb;
        this.init();
        z.end(compress ? new Buffer(string, 'utf8') : string);
        step();
    };
};
