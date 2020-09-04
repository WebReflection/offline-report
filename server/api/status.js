const hyper = require('hypermorphic');
const mime = require('mime');

const getStatus = require('../shared/get-status.js');

const types = {
  'svg': {
    'Content-Type': mime.getType('svg')
  },
  'txt': {
    'Content-Type': mime.getType('txt')
  },
};

const render = (what, how) => view[what](wire[what], how);
const view = {
  'svg': require('../view/svg.js'),
  'txt': require('../view/txt.js')
};
const wire = {
  'svg': hyper.wire(types, ':svg'),
  'txt': hyper.wire(types, ':txt')
};

module.exports = async (req, res) => {
  const {user, ext} = req.query;
  if (types.hasOwnProperty(ext)) {
    const info = await getStatus(user.toLowerCase(), ext === 'svg');
    res.writeHead(200, types[ext]);
    res.end(render(ext, info));
  }
  else {
    res.writeHead(404, types['txt']);
    res.end('Not Found');
  }
};
