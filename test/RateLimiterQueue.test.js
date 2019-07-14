const {describe, it} = require('mocha');
const {expect} = require('chai');
const RateLimiterMemory = require('../lib/RateLimiterMemory');
const RateLimiterQueue = require('../lib/RateLimiterQueue');
const RateLimiterQueueError = require('../lib/component/RateLimiterQueueError');

describe('RateLimiterQueue with FIFO queue', function () {
  this.timeout(5000);

  it('remove 1 token works and 1 remaining', (done) => {
    const rlMemory = new RateLimiterMemory({points: 2, duration: 1});
    const rlQueue = new RateLimiterQueue(rlMemory);
    rlQueue.removeTokens(1)
      .then(remainingTokens => {
        expect(remainingTokens).to.equal(1);
        done()
      })
  });

  it('remove all tokens works and 0 remaining', (done) => {
    const rlMemory = new RateLimiterMemory({points: 2, duration: 1});
    const rlQueue = new RateLimiterQueue(rlMemory);
    rlQueue.removeTokens(2)
      .then(remainingTokens => {
        expect(remainingTokens).to.equal(0);
        done()
      })
  });

  it('return error if try to remove more tokens than allowed', (done) => {
    const rlMemory = new RateLimiterMemory({points: 2, duration: 1});
    const rlQueue = new RateLimiterQueue(rlMemory);
    rlQueue.removeTokens(3)
      .then(() => {
      })
      .catch(err => {
        expect(err instanceof RateLimiterQueueError).to.equal(true);
        done()
      })
  });

  it('queues 1 request and fire it after 1 second', (done) => {
    const rlMemory = new RateLimiterMemory({points: 1, duration: 1});
    const rlQueue = new RateLimiterQueue(rlMemory);
    const time = Date.now();
    rlQueue.removeTokens(1).then(() => {
    });
    rlQueue.removeTokens(1).then((remainingTokens) => {
      expect(remainingTokens).to.equal(0);
      expect(Date.now() - time > 1000).to.equal(true);
      done()
    })
  });

  it('respects order of queued callbacks', (done) => {
    const rlMemory = new RateLimiterMemory({points: 1, duration: 1});
    const rlQueue = new RateLimiterQueue(rlMemory);
    let index;
    rlQueue.removeTokens(1).then(() => {
      index = 0
    });
    rlQueue.removeTokens(1).then(() => {
      expect(index).to.equal(0);
      index = 1;
    });
    rlQueue.removeTokens(1).then(() => {
      expect(index).to.equal(1);
      index = 2;
    });
    rlQueue.removeTokens(1).then(() => {
      expect(index).to.equal(2);
      done()
    })
  });

  it('return error if queue length reaches maximum', (done) => {
    const rlMemory = new RateLimiterMemory({points: 1, duration: 1});
    const rlQueue = new RateLimiterQueue(rlMemory, {maxQueueSize: 1});
    rlQueue.removeTokens(1).then(() => {
    });
    rlQueue.removeTokens(1).then(() => {
      done()
    });
    rlQueue.removeTokens(1)
      .then(() => {
        done(new Error('must not allow to queue'))
      })
      .catch((err) => {
        expect(err instanceof RateLimiterQueueError).to.equal(true);
      });
  });

  it('getTokensRemaining works', (done) => {
    const rlMemory = new RateLimiterMemory({points: 2, duration: 1});
    const rlQueue = new RateLimiterQueue(rlMemory);
    rlQueue.removeTokens(1)
      .then(() => {
        rlQueue.getTokensRemaining()
          .then((tokensRemaining) => {
            expect(tokensRemaining).to.equal(1);
            done()
          })
      })
  });
});