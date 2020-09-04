// CURRENTLY NOT USED AT ALL

/*
const {GH_CLIENT_ID, GH_CLIENT_SECRET} = process.env;
const GH_STATE = require('crypto').randomBytes(32).toString('base64');
const faroff = require('faroff');
const hyper = require('hypermorphic');
const bodyParser = require('body-parser');

module.exports = app => {
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({extended: true}));
  app.post('/hook', (req, res) => {
    console.log(req.headers);
    console.log(req.body);
    res.send('OK');
  });
  app.get('/oauth', (req, res) => {
    const code = req.query.code;
    res.writeHead(200, {'Content-Type': 'text/html'});
    if (code) {
      faroff({
        url: 'https://github.com/login/oauth/access_token',
        json: {
          client_id: GH_CLIENT_ID,
          client_secret: GH_CLIENT_SECRET,
          state: GH_STATE,
          code
        }
      })
      .then(
        result => res.end('OK: ' + result),
        error => res.end('Error: ' + error)
      );
    }
    else
      res.end(hyper.wire(app, ':get-oauth')`<html>
    <body>
      <p>
        Well, hello there!
      </p>
      <p>
        We're going to now talk to the GitHub API. Ready?
        <a href="${`https://github.com/login/oauth/authorize?scope=read:user&client_id=${GH_CLIENT_ID}&state=${GH_STATE}`}">
          Click here
        </a> to begin!</a>
      </p>
    </body>
  </html>`);
  });
};

*/
