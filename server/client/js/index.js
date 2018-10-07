require('./serviceWorker.js');

const DOMContentLoaded = require('./domcontentloaded.js');
const load = require('./load.js');
const online = require('./online.js');
const options = {once: true};

document.addEventListener('DOMContentLoaded', DOMContentLoaded, options);
addEventListener('load', load, options);
addEventListener('online', online, false);
