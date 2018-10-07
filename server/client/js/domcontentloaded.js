const {hyper} = require('hypermorphic');
const {
  CONNECTION_ERROR,
  SEARCH_PLACEHOLDER
} = require('../../shared/constants.js');
const {$} = require('./utils.js');
const statusHTML = require('../../shared/status.js');
const view = {input: require('../../view/input.js')};

const wire = {input: hyper.wire()};
const render = (what, how) => view[what](wire[what], how);

const createUser = status => {
  switch(status) {
    case 'online':
      return {
        gray: '25%',
        opacity: 1,
        status: statusHTML(status)
      };
    case 'offline':
      return {
        gray: '0%',
        opacity: 1,
        status: statusHTML(status)
      };
    default:
      return {
        gray: '50%',
        opacity: .7,
        status: statusHTML(status)
      };
  }
};

const cache = Object.create(null);
const html = document.documentElement;

module.exports = () => {
  const output = $('output');
  const form = $('main > form');
  const setOutput = info => {
    output.innerHTML = info.status;
    output.style.opacity = info.opacity;
  };
  const update = info => {
    clearTimeout(opacityTimer);
    if (output.style.opacity != 0) {
      output.style.opacity = 0;
      opacityTimer = setTimeout(setOutput, 600, info);
    }
    else
      setOutput(info);
    try { html.style.setProperty('--grayscale', info.gray); }
    catch(o_O) {}
  };
  const onkeydown = e => {
    if (e.key === ' ')
      e.preventDefault();
  };
  const onkeyup = e => {
    const user = e.currentTarget.value.replace(/\s+/, '');
    const find = user.length && user !== text.replace(/\s+/, '');
    text = user;
    if (find) {
      if (user in cache)
        update(cache[user]);
      else {
        update({
          gray: '25%',
          status: '&nbsp;',
          opacity: 0
        });
        if (xhr) {
          xhr.abort();
          xhr = null;
        }
        clearTimeout(userTimer);
        userTimer = setTimeout(() => {
          xhr = new XMLHttpRequest;
          xhr.open('get', `/status/${user}.txt`, true);
          xhr.onreadystatechange = () => {
            if (xhr.readyState === 4) {
              if (199 < xhr.status && xhr.status < 400) {
                cache[user] = createUser(xhr.responseText);
                if (user === text) {
                  // setup an automatic refresh for the same user
                  // or clean the cache for old one in a minute
                  setTimeout(
                    () => {
                      delete cache[user];
                      if (user === text) {
                        text = '';
                        onkeyup({currentTarget:{value: user}});
                      }
                    },
                    60000
                  );
                  update(cache[user]);
                }
              }
              else {
                update({
                  gray: '75%',
                  status: CONNECTION_ERROR,
                  opacity: 1
                });
              }
            }
          };
          xhr.send(null);
        }, 250);
      }
    }
    else if (text.length < 1)
      update({
        gray: '25%',
        status: '&nbsp;',
        opacity: 0
      });
  };

  // mutable variables
  let text = $('input').value;
  let xhr = null;
  let userTimer = 0;
  let opacityTimer = 0;

  const autofocus = text.length < 1;
  // basic setup
  if (autofocus)
    output.style.opacity = 0;

  form.addEventListener('submit', e => {
    e.preventDefault();
    const user = text;
    text = '';
    onkeyup({currentTarget:{value: user}});
    try { history.replaceState({user}, document.title, `/?user=${user}`); }
    catch(o_O) {}
  });

  hyper(form)`
    <label for="user">${SEARCH_PLACEHOLDER}</label>
    ${render('input', {
      autofocus,
      onkeydown,
      onkeyup,
      value: text,
      placeholder: SEARCH_PLACEHOLDER
    })}
    ${output}`;
};
