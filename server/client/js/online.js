const {$} = require('./utils.js');
const {CONNECTION_ERROR} = require('../../shared/constants.js');

module.exports = () => {
  const output = $('output');
  if (output.textContent === CONNECTION_ERROR)
    $('form').dispatchEvent(new CustomEvent('submit'));
};
