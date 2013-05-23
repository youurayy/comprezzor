

var laeh2 = require('laeh2');
var _x = laeh2._x;
var assert = require('assert');
var comprezzor = require('../lib/comprezzor');

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

        var input = 'my test input. my test input. my test input. my test input. my test input. my test input.';

        console.log('input: %s', input);
        console.log('input length: %d', input.length);

        zip.make(input, _x(cb, true, function(err, res) {

            //console.log(res);
            console.log('zipped length: %d', res.length);

            unzip.make(res, _x(cb, true, function(err, res) {

                // console.log(res);
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

    }));
});
