'use strict';

const crypto = require('crypto');

const algorithm = 'aes-256-cbc';

const salt = process.env.ENCRYPTION_SALT || algorithm;

const wm = new WeakMap;

module.exports = class Secret {

  constructor(secret) {
    wm.set(this, {key: crypto.scryptSync(secret, salt, 32)});
  }

  decrypt(text) {
    const {key} = wm.get(this);
    const parts = text.split(':');
    const iv = Buffer.from(parts.shift(), 'hex');
    const encrypted = Buffer.from(parts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    return '' + Buffer.concat([decipher.update(encrypted), decipher.final()]);
  }

  encrypt(text) {
    const {key} = wm.get(this);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
  }

};
