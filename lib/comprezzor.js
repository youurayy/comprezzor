
var laeh2 = require('laeh2');
var _x = laeh2._x;
var _e = laeh2._e;

var zlib = require('zlib');
var util = require('util');
var clone = require('clone');
var fs = require('fs');
var genpool = require('generic-pool');
var _ = require('underscore');

function ZlibBuffer(engine, buffer, callback) {

    this.buffers = [];
    this.nread = 0;
    this.engine = engine;
    this.callback = callback;

    this.onError = this.onError.bind(this);
    this.onData = this.onData.bind(this);
    this.onEnd = this.onEnd.bind(this);

    engine.on('error', this.onError);
    engine.on('data', this.onData);
    engine.on('end', this.onEnd);

    engine.write(buffer);
    engine.end();
}

ZlibBuffer.prototype.onError = function(err) {
    this.engine.removeListener('end', onEnd);
    this.engine.removeListener('error', onError);
    this.callback(err);
};

ZlibBuffer.prototype.onData = function(chunk) {
    this.buffers.push(chunk);
    this.nread += chunk.length;
}

ZlibBuffer.prototype.onEnd = function() {
    var buf = Buffer.concat(this.buffers, this.nread);
    this.buffers = [];
    this.callback(null, buf);
}

module.exports = function(compress, opts) {

    var zo = clone(opts);
    var t = this;
    this.compress = compress;

    if(zo.direct) {

        [ 'level', 'strategy' ].forEach(function(opt) {
            if(typeof(zo[opt]) === 'string')
                zo[opt] = zlib[zo[opt]];
        });

        t.info = function() {
            return util.format('compression: [type: %s] [bits: %d] [mem: %d] ' +
                '[buffer: %d] [level: %s] [strategy: %s]',
                type, opts.windowBits, opts.memLevel,
                ((1 << (opts.windowBits+2)) + (1 << (opts.memLevel+9))),
                opts.level, opts.strategy);
        };

        if(compress) {
            t.make = function(string, cb) { // cb(err, res)
                var buf = new Buffer(string, 'utf8');
                new ZlibBuffer(zlib.createDeflateRaw(zo), buf, cb);
            };
        }
        else {
            t.make = function(buf, cb) { // cb(err, res)
                new ZlibBuffer(zlib.createInflateRaw(zo), buf, function(err, res) {
                    if(err)
                        cb(err);
                    else
                        cb(null, res ? res.toString('utf8') : res);
                });
            };
        }
    }
    else if(zo.pool) {

        var poolOpts = _.defaults(zo.pool, {
            create: _x(null, false, function(cb) { // cb(err, res)
                var z = new module.exports(compress, zo);
                cb(null, z);
            }),
            destroy: function(z) {
            }
        });

        delete zo.pool;

        t.pool = genpool.Pool(poolOpts);

        t.make = _x(null, false, function(str, cb) {

            t.pool.acquire(_x(cb, true, function(err, z) {

                function _cb(err, res) {
                    t.pool.release(z);
                    cb(err, res);
                };

                z.make(str, _x(_cb, true, function(err, res) {
                    _cb(null, res);
                }));
            }));
        });

    }
    else {

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

        t.onEnd = _x(cb, false, function() {
            var b = Buffer.concat(buf, size);
            cb(null, compress ? b : b.toString('utf8'));
        });

        t.init = function() {
            z = zlib['create' + type](zo);
            z.on('error', cb);
            z.on('end', t.onEnd);
        }

        t.info = function() {
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

        t.make = function(string, __cb) { // __cb(err, res)
            if(_cb)
                _e('currently in use');
            _cb = __cb;
            t.init();
            z.end(compress ? new Buffer(string, 'utf8') : string);
            step();
        };
    }
};
