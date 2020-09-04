'use strict';

const {API, APP, DATABASE, REPOSITORY} = require('./shared/constants.js');
const RangeArray = require('./shared/range-array.js');
const {parseVacations} = require('./shared/utils.js');

const Secret = require('secretly');
const faroff = require('faroff');
const ora = require('ora');
const read = require('read');
const storage = require('perseverant').createInstance(APP);
const uuid = require('uuid');

const passwords = new WeakMap;

const headers = {
  basic: user => ({
    Authorization: 'Basic ' + Buffer.from(
      `${user.name}:${passwords.get(user)}`
    ).toString('base64')
  }),
  token: user => ({
    Authorization: `token ${
      new Secret(passwords.get(user)).decrypt(user.token)
    }`
  })
};

module.exports = {
  getVacations,
  setVacations,
  updateStatus,
  user
};

function createCommit(user) {
  return spin('creating a "vacations updated" commit', (resolve, reject) => {
    faroff.post({
      headers: headers.token(user),
      url: `${API}/repos/${user.name}/${REPOSITORY}/git/commits`,
      json: {
        parents: [user.head],
        tree: user.tree,
        message: 'vacations updated'
      }
    })
    .then(result => {
      if (result.status == 201) {
        user.sha = result.json.sha;
        resolve(user);
      }
      else
        reject(result.message);
    })
    .catch(reject);
  });
}

function createTree(user) {
  return spin('creating the related tree object', (resolve, reject) => {
    faroff.post({
      headers: headers.token(user),
      url: `${API}/repos/${user.name}/${REPOSITORY}/git/trees`,
      json: {
        base_tree: user.commit,
        tree: [{
          path: DATABASE,
          content: JSON.stringify(user.vacations),
          mode: '100644'
        }]
      }
    })
    .then(result => {
      if (result.status == 201) {
        user.tree = result.json.sha;
        resolve(user);
      }
      else
        reject(result.message);
    })
    .catch(reject);
  });
}

function get2FA(user) {
  return new Promise((resolve, reject) => {
    const basicHeaders = headers.basic(user);
    faroff.put({
      headers: basicHeaders,
      url: API + '/authorizations'
    })
    .then(
      result => {
        if (is2FA(result)) {
          spin.ner.stop();
          read(
            {prompt: '2FA authentication code: '},
            (error, code) => {
              process.stdout.write('\x1B[1A');
              if (error || !(code || '').trim().length)
                reject('unauthorized request');
              else {
                basicHeaders['X-GitHub-OTP'] = code.trim();
                faroff.post({
                  headers: basicHeaders,
                  url: API + '/authorizations',
                  json: getRequestJSON()
                })
                .then(
                  result => {
                    if (result.json.token)
                      storeToken(user, result.json.token, resolve, reject);
                    else
                      rejectTrying(result, reject);
                  }
                )
                .catch(reject);
              }
            }
          );
        }
        else
          rejectTrying(result, reject);
      }
    )
    .catch(reject);
  });
}

function getCredentials(user) {
  return spin('checking your credentials', (resolve, reject) => {
    (function gotcha(user) {
      if (user.name) {
        if (passwords.has(user))
          resolve(user);
        else
          getPassword(user)
            .then(resolve)
            .catch(reject);
      }
      else
        getName(user)
          .then(gotcha)
          .catch(reject);
    }(user));
  });
}

function getVacations(user) {
  return spin('reaching the database', (resolve, reject) => {
    if (user.vacations)
      resolve(user);
    else if (user.token && passwords.has(user)) {
      faroff.get({
        headers: headers.token(user),
        url: `${API}/repos/${user.name}/${REPOSITORY}/contents/${DATABASE}`
      })
      .then(result => {
        if (result.status == 200) {
          storage.setItem(
            'vacations',
            user.vacations = RangeArray.from(parseVacations(result))
          )
            .then(() => resolve(user))
            .catch(reject);
        }
        else {
          user.vacations = new RangeArray;
          setVacations(user)
            .then(() => resolve(user))
            .catch(reject);
        }
      })
      .catch(reject);
    }
    else
      getToken(user)
        .then(getVacations)
        .then(resolve)
        .catch(reject);
  });
}

function getCommit(user) {
  return spin('getting the commit sha', (resolve, reject) => {
    faroff.get({
      headers: headers.token(user),
      url: `${API}/repos/${user.name}/${REPOSITORY}/git/commits/${user.head}`
    })
    .then(result => {
      if (result.status == 200) {
        user.commit = result.json.tree.sha;
        resolve(user);
      }
      else
        reject(result.message);
    })
    .catch(reject);
  });
}

function getHead(user) {
  return spin('getting the master head', (resolve, reject) => {
    faroff.get({
      headers: headers.token(user),
      url: `${API}/repos/${user.name}/${REPOSITORY}/git/refs/heads/master`
    })
    .then(result => {
      if (result.status == 200) {
        user.head = result.json.object.sha;
        resolve(user);
      }
      else
        reject(result.message);
    })
    .catch(reject);
  });
}

function getName(user) {
  return new Promise((resolve, reject) => {
    spin.ner.stop();
    read(
      {prompt: 'GitHub \x1B[1muser\x1B[0m/email: '},
      (error, name) => {
        process.stdout.write('\x1B[1A');
        if (error || !(name || '').trim().length)
          reject('invalid user ' + name);
        else {
          user.name = name.trim();
          resolve(user);
        }
      }
    );
  });
}

function getPassword(user) {
  return new Promise((resolve, reject) => {
    spin.ner.stop();
    read(
      {
        prompt: 'GitHub \x1B[1mpassword\x1B[0m: ',
        silent: true,
        replace: '•'
      },
      (error, password) => {
        process.stdout.write('\x1B[1A\x1B[1A');
        if (error || !password.length)
          reject('invalid password');
        else {
          try {
            if (user.token)
              new Secret(password).decrypt(user.token);
            passwords.set(user, password);
            resolve(user);
          } catch(error) {
            reject('invalid password');
          }
        }
      }
    );
  });
}

function getRepo(user) {
  return spin('checking your ' + REPOSITORY + ' repository', (resolve, reject) => {
    faroff.get({
      headers: headers.token(user),
      url: `${API}/repos/${user.name}/${REPOSITORY}`
    })
    .then(
      result => {
        if (result.status == 404) {
          faroff.post({
            headers: headers.token(user),
            url: API + '/user/repos',
            json: {
              name: REPOSITORY,
              description: `${user.name} vacations, handled via ${APP}.`,
              homepage: 'https://offline.report',
              auto_init: true,
              has_issues: false,
              has_projects: false,
              has_wiki: false
            }
          })
          .then(result => {
            if (result.status == 422 || result.status == 201)
              resolve(user);
            else
              reject(`unable to reach ${REPOSITORY} repository`);
          })
          .catch(reject);
        }
        else
          resolve(user);
      }
    )
    .catch(reject);
  });
}

function getRequestJSON() {
  return {
    fingerprint: uuid.v4(),
    note: APP + ' vacations',
    scopes: ['public_repo']
  };
}

function getToken(user) {
  return spin('checking token validity', (resolve, reject) => {
    if (user.token)
      getCredentials(user)
        .then(validateToken)
        .then(resolve)
        .catch(reject);
    else {
      getCredentials(user)
        .then(
          user => {
            faroff.post({
              headers: headers.basic(user),
              url: API + '/authorizations',
              json: getRequestJSON()
            })
            .then(
              result => {
                if (is2FA(result))
                  get2FA(user).then(resolve).catch(reject);
                else if (result.json.token)
                  storeToken(user, result.json.token, resolve, reject);
                else
                  rejectTrying(result, reject);
              }
            )
            .catch(reject);
          }
        )
        .catch(reject);
    }
  });
}

function is2FA(result) {
  return result.status == 401 &&
          /\brequired\b/.test(result.headers['x-github-otp']);
}

function patchCommit(user) {
  return spin('patching the submitted commit', (resolve, reject) => {
    faroff.patch({
      headers: headers.token(user),
      url: `${API}/repos/${user.name}/${REPOSITORY}/git/refs/heads/master`,
      json: {sha: user.sha}
    })
    .then(result => {
      if (result.status == 200) {
        user.object = result.json.object;
        resolve(user);
      }
      else
        reject(result.message);
    })
    .catch(reject);
  });
}

function rejectTrying(result, reject) {
  try {
    reject(result.json.message);
  } catch(e) {
    reject('unauthorized request');
  }
}

function spin(text, callback) {
  if (!spin.ner)
    spin.ner = ora({
      text,
      spinner: process.platform === 'darwin' ? 'dots' : 'triangle'
    });
  else
    spin.ner.text = text;
  spin.ner.start();
  return new Promise((resolve, reject) => {
    callback(
      value => {
        if (spin.ner.isSpinning)
          spin.ner.stop();
        resolve(value);
      },
      error => {
        if (spin.ner.isSpinning)
          spin.ner.stop();
        reject(error);
      }
    );
  });
}

function storeToken(user, token, resolve, reject) {
  storage
    .setItem('secret', new Secret(passwords.get(user)).encrypt(token))
    .then(
      token => {
        user.token = token;
        validateToken(user)
          .then(resolve)
          .catch(reject);
      }
    )
    .catch(reject);
}

function user(program) {
  const {holidays} = program;
  return new Promise((resolve, reject) => {
    Promise.all([
      storage.getItem('name'),
      storage.getItem('secret'),
      storage.getItem('vacations'),
      holidays ?
        storage.setItem(
          'holidays',
          holidays === 'off' ? '' : holidays
        ) :
        storage.getItem('holidays')
    ])
    .then(
      ([name, token, vacations, holidays]) =>
        resolve({
          name,
          token,
          vacations: vacations == null || program.pull ?
                      null :
                      RangeArray.from(vacations),
          holidays: holidays || ''
        })
    )
    .catch(reject);
  });
}

function setVacations(user) {
  return getToken(user)
          .then(getRepo)
          .then(getHead)
          .then(getCommit)
          .then(createTree)
          .then(createCommit)
          .then(patchCommit)
          .then(user => storage.setItem('vacations', user.vacations).then(() => user));
}

function updateStatus(user, offline, exit) {
  return getToken(user)
          .then(user => faroff.post({
            headers: headers.token(user),
            url: `${API}/users/${user.name}/status`,
            json: {
              emoji: offline ? ':palm_tree:' : ':robot:',
              message: offline ? 'On vacation' : 'Online'
            }
          }, exit)
          .then(result => {
            if (400 <= result.status)
              exit('unable to update the status');
            return user;
          }, exit)
          .catch(exit));
}

function validateToken(user) {
  return spin('validating the received token', (resolve, reject) => {
    faroff.get({
      headers: headers.token(user),
      url: API + '/user'
    })
    .then(
      result => {
        if (result.json.login)
          storage
            .setItem('name', result.json.login)
            .then(
              name => {
                user.name = name;
                resolve(user);
              }
            )
            .catch(reject);
        else {
          delete user.name;
          delete user.token;
          Promise.all([
            storage.removeItem('name'),
            storage.removeItem('secret')
          ])
          .then(() => getToken(user).then(resolve).catch(reject))
          .catch(reject);
        }
      },
      reject
    );
  });
}
