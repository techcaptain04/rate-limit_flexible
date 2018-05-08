[![Build Status](https://travis-ci.org/animir/node-rate-limiter-flexible.png)](https://travis-ci.org/animir/node-rate-limiter-flexible)
[![Coverage Status](https://coveralls.io/repos/animir/node-rate-limiter-flexible/badge.svg?branch=master)](https://coveralls.io/r/animir/node-rate-limiter-flexible?branch=master)

## node-rate-limiter-flexible

Flexible rate limiter with Redis as broker allows to control requests rate in cluster or distributed environment.
Backed on native Promises. It uses fixed window to limit requests.

## Installation

`npm i rate-limiter-flexible`

## Usage

Redis client must be created with offline queue switched off

```javascript
const redis = require('redis');
const { RateLimiter } = require('rate-limiter-flexible');

const redisClient = redis.createClient({ enable_offline_queue: false });

// It is recommended to process Redis errors and setup some reconnection strategy
redisClient.on('error', (err) => {
  
});

const opts = {
  points: 5, // Number of points
  duration: 5, // Per second(s)
};

const rateLimiter = new RateLimiter(redisClient, opts);

rateLimiter.consume(remoteAddress)
    .then(() => {
      // ... Some app logic here ...
      
      // Depending on results it allows to fine
      rateLimiter.penalty(remoteAddress, 3);
      // or rise number of points for current duration
      rateLimiter.reward(remoteAddress, 2);
    })
    .catch((err) => {
      if (err instanceof Error) {
        // Some Redis error
        // Decide what to do with it on your own
      } else {
        const msBeforeReset = err;
        // Can't consume
        // If there is no error, rateLimiter promise rejected with number of ms before next request allowed
        const secs = Math.round(msBeforeReset / 1000) || 1;
        res.set('Retry-After', String(secs));
        res.status(429).send('Too Many Requests');
      }
    });
```

## API

### rateLimiter.consume(key, points = 1)

Returns Promise, which: 
* resolved when point(s) is consumed, so action can be done
* rejected when some Redis error happened. Callback is `(err)`
* rejected when there is no points to be consumed. 
Callback is `(err, msBeforeReset)`, where `err` is `null` and `msBeforeReset` is number of ms before next allowed action

Arguments:
* `key` is usually IP address or some unique client id
* `points` number of points consumed. `default: 1`

### rateLimiter.penalty(key, points = 1)

Fine `key` by `points` number of points.

Doesn't return anything

### rateLimiter.reward(key, points = 1)

Reward `key` by `points` number of points.

Doesn't return anything
