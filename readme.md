## easy and reusable way to compress and decompress text data without headers (e.g. for storage in redis)

### new in 0.0.6 - [pooling](https://github.com/coopernurse/node-pool#documentation):

```js

var opts = {
    // ...
    pool: {
        max: 100
        // see for more: https://github.com/coopernurse/node-pool#documentation
    }
    // ...
};

var zip = new comprezzor(true, opts);
var unzip = new comprezzor(false, opts);

// use from multiple threads

zip.pool.destroyAllNow();
unzip.pool.destroyAllNow();

```


### usage:

```js
var laeh2 = require('laeh2');
var _x = laeh2._x;
var _e = laeh2._e;

var comprezzor = require('comprezzor');

function cb(err, res) {
    console.log(err ? err.stack : res);
}

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

    // res is a buffer now

    //console.log(res);
    console.log('zipped length: %d', res.length);

    unzip.make(res, _x(cb, true, function(err, res) {

        // res is a string now

        // console.log(res);
        console.log('unzipped length: %d', res.length);

        zip.make(res, _x(cb, true, function(err, res) {

            // res is a buffer now

            //console.log(res);

            unzip.make(res, _x(cb, true, function(err, res) {

                // res is a string now

                cb(null, res === input ? 'match' : 'no match');
            }));
        }));

    }));
}));
```
