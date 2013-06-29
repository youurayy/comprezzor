

var laeh2 = require('laeh2');
var _x = laeh2._x;
var assert = require('assert');
var comprezzor = require('../lib/comprezzor');
var async = require('async-mini');
var utilz = require('utilz');

describe('comprezzor', function() {

    it('zip-unzip', _x(null, false, function(cb) {

        var opts = {
            windowBits: 14,
            memLevel: 7,
            level: 'Z_BEST_COMPRESSION',
            strategy: 'Z_DEFAULT_STRATEGY'
        };

        var zip = new comprezzor(true, opts);
        var unzip = new comprezzor(false, opts);

        console.log('zip: ' + zip.info());
        console.log('unzip: ' + unzip.info());

        testSub(zip, unzip, true, cb);
    }));

    it('parallel zip-unzip', _x(null, false, function(cb) {

        var opts = {
            windowBits: 14,
            memLevel: 7,
            level: 'Z_BEST_COMPRESSION',
            strategy: 'Z_DEFAULT_STRATEGY',
            pool: {
                min: 1,
                max: 5
            }
        };

        var zip = new comprezzor(true, opts);
        var unzip = new comprezzor(false, opts);

        var ff = [];

        for(var i = 0; i < 100; i++) {
            (function(i) {
                ff.push(_x(null, false, function(cb) {
                    console.log('thread #%d begin', i);

                    testSub(zip, unzip, i, _x(cb, true, function(err) {
                        console.log('thread #%d end', i);
                        cb();
                    }));

                }));
            })(i);
        }

        var start = Date.now();

        async.parallel(ff, _x(cb, true, function(err, res) {

            console.log('took %s', utilz.timeSpan(Date.now() - start));

            // zip.pool.destroyAllNow();
            // unzip.pool.destroyAllNow();
            cb();
        }));
    }));
});

function testSub(zip, unzip, debug, cb) {

    var input = 'my test input. my test input. my test input. my test input. my test input. my test input.';

    var n;
    if(typeof(debug) === 'number') {
        n = debug;
        debug = false;
    }

    if(debug) {
        console.log('input: %s', input);
        console.log('input length: %d', input.length);
    }

    if(n) console.log('#%d make 1.', n);
    zip.make(input, _x(cb, true, function(err, res) {

        return cb(); // temporary

        //console.log(res);
        if(debug)
            console.log('zipped length: %d', res.length);

        unzip.make(res, _x(cb, true, function(err, res) {

            // console.log(res);
            if(debug)
                console.log('unzipped length: %d', res.length);

            zip.make(res, _x(cb, true, function(err, res) {

                //console.log(res);

                unzip.make(res, _x(cb, true, function(err, res) {

                    assert(res === input);

                    cb();
                }));
            }));

        }));
    }));
}
