'use strict';

const crypto = require('crypto');

const ciphers = crypto
                  .getCiphers()
                  .filter(algorithm => /^aes\d+$/i.test(algorithm))
                  .sort();

const cipher = ciphers.indexOf('aes256') < 0 ? ciphers.pop() : 'aes256';

const wm = new WeakMap;

module.exports = class Secret {

  constructor(secret, algorithm = cipher) {
    wm.set(this, {algorithm, secret});
  }

  decrypt(text) {
    const {algorithm, secret} = wm.get(this);
    const decipher = crypto.createDecipher(algorithm, secret);
    return (decipher.update(String(text), 'hex', 'utf8') +
            decipher.final('utf8'));
  }

  encrypt(text) {
    const {algorithm, secret} = wm.get(this);
    const cipher = crypto.createCipher(algorithm, secret);
    return (cipher.update(String(text), 'utf8', 'hex') +
            cipher.final('hex'));
  }

};
