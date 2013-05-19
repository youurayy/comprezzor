## easy and reusable way to compress and decompress text data without headers (e.g. for storage in redis)

```js
var laeh2 = require('laeh2');
var _x = laeh2._x;
var _e = laeh2._e;

function cb(err, res) {
    console.log(err ? err.stack : res);
}

var opts = {
    windowBits: 14,
    memLevel: 7,
    level: 'Z_BEST_COMPRESSION',
    strategy: 'Z_DEFAULT_STRATEGY'
};

var zip = new exports.Compressor(true, opts);
var unzip = new exports.Compressor(false, opts);

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

        zip.make(input, _x(cb, true, function(err, res) {

            //console.log(res);

            unzip.make(res, _x(cb, true, function(err, res) {

                cb(null, res === input ? 'match' : 'no match');
            }));
        }));

    }));
}));
```
