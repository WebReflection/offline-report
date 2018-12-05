'use strict';

const EXPIRATION = 600000;

const path = require('path');

const broadcast = require('broadcast').new();
const express = require('express');
const faroff = require('faroff');
const hyper = require('hypermorphic');
const mime = require('mime');

const {
  API,
  DATABASE,
  REPOSITORY,
  SEARCH_PLACEHOLDER
} = require('./shared/constants.js');
const Range = require('./shared/range.js');
const RangeArray = require('./shared/range-array.js');
const {parseVacations} = require('./shared/utils.js');
const statusHTML = require('./shared/status.js');
const unsplashList = require('./shared/unsplash.js');

const types = {
  '.svg': {
    'Content-Type': mime.getType('svg'),
    'Cache-Control': 'no-cache',
    'Access-Control-Allow-Origin': '*'
  },
  '.txt': {
    'Content-Type': mime.getType('txt'),
    'Cache-Control': 'no-cache',
    'Access-Control-Allow-Origin': '*'
  },
};

const app = express();
const cache = new Map;
const loading = new Set;
const render = (what, how) => view[what](wire[what], how);
const view = {
  index: require('./view/index.js'),
  input: require('./view/input.js'),
  '.svg': require('./view/svg.js'),
  '.txt': require('./view/txt.js')
};
const wire = {
  index: hyper.wire(app, ':index'),
  input: hyper.wire(app, ':input'),
  '.svg': hyper.wire(app, ':svg'),
  '.txt': hyper.wire(app, ':txt')
};

// pretty much all assets are statics
app.use(express.static('static'));

// status/:user(.txt|.svg) returns a textual
// or svg representation of the developer status
app.get('/status/:search', (req, res) => {
  const {search} = req.params;
  const ext = path.extname(search);
  const user = search.slice(0, -ext.length).toLowerCase();
  const status = types.hasOwnProperty(ext) ? 200 : 404;
  if (status === 200) {
    getStatus(user);
    broadcast.when(user, info => {
      res.writeHead(status, types[ext]);
      res.end(render(ext, info));
    });
  } else {
    res.writeHead(status, types['.txt']);
    res.end('Not Found');
  }
});

// when the cli performs an update
// it also hits this server to free the cache
app.delete('/cached/:user', (req, res) => {
  const {user} = req.params;
  cache.delete(user.toLowerCase());
  res.writeHead(200, types['.txt']);
  res.end('OK');
});

// the root always returns the same page
app.get('/', (req, res) => {
  const {user} = req.query;
  const unsplash = unsplashList[Math.floor(Math.random() * unsplashList.length)];
  res.writeHead(200, {'Content-Type': 'text/html'});
  if (user) {
    getStatus(user);
    broadcast.when(user, info => {
      res.end(render('index', {
        user,
        unsplash,
        status: statusHTML(info.status),
        placeholder: SEARCH_PLACEHOLDER,
        input: render('input', {
          autofocus: false,
          value: user,
          placeholder: SEARCH_PLACEHOLDER
        })
      }));
    });
  }
  else
    res.end(render('index', {
      user: '',
      unsplash,
      status: '&nbsp;',
      placeholder: SEARCH_PLACEHOLDER,
      input: render('input', {
        autofocus: true,
        value: '',
        placeholder: SEARCH_PLACEHOLDER
      })
    }));
});

// start https://offline.report
app.listen(process.env.PORT || 8080);

function getStatus(user) {
  const info = cache.get(user);
  if ((!info || info.expired) && !loading.has(user)) {
    broadcast.drop(user);
    loading.add(user);
    faroff
      .get(`${API}/repos/${user}/${REPOSITORY}/contents/${DATABASE}`)
      .then(result => {
        const now = Date.now();
        const details = {
          status: 'unknown',
          get expired() {
            return EXPIRATION <= (Date.now() - now);
          }
        };
        loading.delete(user);
        cache.set(user, details);
        setTimeout(() => cache.delete(user), EXPIRATION);
        if (result.status == 200) {
          const now = new Date;
          details.status = RangeArray
                            .from(parseVacations(result))
                            .contains(new Range(now, now)) ?
                              'offline' :
                              'online';
        }
        Promise.all([
          faroff.get(`https://img.shields.io/badge/${user}-online-green.svg`),
          faroff.get(`https://img.shields.io/badge/${user}-offline-red.svg`)
        ]).then(results => {
          const [online, offline] = results;
          details.online = online.status == 200 ? online.body : '';
          details.offline = offline.status == 200 ? offline.body : '';
          broadcast.that(user, details);
        });
      })
      .catch(() => {
        loading.delete(user);
        broadcast.that(user, {status: 'unknown', expired: false});
        setTimeout(() => broadcast.drop(user), EXPIRATION);
      });
  }
}
