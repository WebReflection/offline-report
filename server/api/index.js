const hyper = require('hypermorphic');

const {SEARCH_PLACEHOLDER} = require('../shared/constants.js');

const getStatus = require('../shared/get-status.js');
const statusHTML = require('../shared/status.js');
const unsplashList = require('../shared/unsplash.js');

const render = (what, how) => view[what](wire[what], how);
const view = {
  index: require('../view/index.js'),
  input: require('../view/input.js')
};
const wire = {
  index: hyper.wire(view, ':index'),
  input: hyper.wire(view, ':input')
};

module.exports = async (req, res) => {
  const {user} = req.query;
  const unsplash = unsplashList[Math.floor(Math.random() * unsplashList.length)];
  res.writeHead(200, {'Content-Type': 'text/html'});
  if (user) {
    const info = await getStatus(user.toLowerCase(), false);
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
};
