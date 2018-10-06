'use strict';

const {parse} = require('./shared/utils.js');

const program = {
  about: '',
  add: false,
  cancel: false,
  clear: false,
  day: null,
  from: null,
  holidays: '',
  pull: false,
  to: null
};

const implicit = {
  day: false,
  from: false,
  to: false
};

for (let i = 2, length = process.argv.length; i < length;) {
  let arg = process.argv[i++].toLowerCase();
  if (/^--(?:holidays|vacations)=((?:[a-z]{2},)*(?:[a-z]{2}))?$/.test(arg)) {
    program.holidays = RegExp.$1 || 'off';
    continue;
  }
  const date = parse(arg);
  if (date) {
    if (program.day)
      exit(1);
    implicit.day = parse.reason === 'implicit';
    program.day = date;
    continue;
  }
  else {
    switch(arg) {
      case '-h':
      case '--help':
        exit(0);
        break;
      case '-v':
      case '--version':
        console.log(version());
        process.exit(0);
        break;
      case 'about':
      case 'for':
        if (i < length)
          program.about = process.argv[i++];
        else
          exit(1);
        break;
      case 'add':
      case 'book':
      case 'gone':
      case 'off':
      case 'offline':
      case 'set':
        if (program.cancel)
          exit(1);
        program.add = true;
        break;
      case 'cancel':
      case 'delete':
      case 'drop':
      case 'remove':
        if (i < length && process.argv[i] === 'everything') {
          program.clear = true;
          i++;
          break;
        }
      case 'online':
        if (program.add)
          exit(1);
        program.cancel = true;
        break;
      case 'date':
        arg = 'day';
      case 'day':
        if (process.day)
          exit(1);
        i = checkKey(i, length, program, arg);
        implicit.day = parse.reason === 'implicit';
        break;
      case 'pull':
        program.pull = true;
        if (3 < length)
          exit(1);
        break;
      case 'til':
      case 'until':
        arg = 'to';
      case 'to':
      case 'from':
        if (program[arg])
          exit(1);
        i = checkKey(i, length, program, arg);
        implicit[arg] = parse.reason === 'implicit';
        break;
      default:
        exit(1);
    }
  }
}

// adjust all cases and exit in case something ain't right
if (program.clear && (
  program.about ||
  program.day ||
  program.from ||
  program.to
))
  exit(1);
if (program.from && !program.to)
  program.to = new Date(
    program.from.getFullYear() + 1,
    program.from.getMonth() - 1,
    1
  );
else if (program.to && !program.from)
  program.from = new Date();

if (program.to) {
  if (program.day)
    exit(1);
  if (program.from > program.to) {
    if (implicit.to)
      program.to.setMonth(program.to.getMonth() + 1);
    else if (implicit.from)
      program.from.setMonth(program.from.getMonth() - 1);
  }
  if (program.to < program.from)
    exit(1);
}

module.exports = program;

function checkKey(i, length, program, arg) {
  if (i < length) {
    program[arg] = parse(process.argv[i++]);
    if (program[arg] == null)
      exit(1);
  } else
    exit(1);
  return i;
}

function exit(code) {
  help();
  process.exit(code);
}

function help() {
  [
    '',
    version(),
    '',
    'Your availability through your command line.',
    'https://offline.report',
    '',
    '  Examples:',
    '',
    '    offline-report',
    '    offline-report pull',
    '    offline-report from 2 to 9',
    '    offline-report from today to tomorrow',
    '    offline-report cancel from 4 to 7',
    '    offline-report cancel everything',
    '    offline-report add today',
    '    offline-report add day 25/12',
    '    offline-report add from 12 to 16',
    '    offline-report about user',
    '    offline-report about user from 2 to 9',
    '    offline-report --holidays=it,gb,us',
    '',
    '  Aliases:',
    '',
    '    about: for',
    '    add: book, gone, off, offline, set',
    '    cancel: delete, drop, online, remove',
    '    day: date (using a valid date would set it too)',
    '    to: until til',
    '',
    '    --holidays: --vacations',
    '',
    '  Details:',
    '',
    '    <user> is any valid GitHub user',
    '    <date> can be:',
    '         a day of the current month, or the next one',
    '         a dd/mm or dd-mm of the year',
    '         a dd/mm/yyyy or dd-mm-yyyy',
    '         a yyyy/mm/dd or yyyy-mm-dd',
    '         a yyyy/mm/dd or yyyy-mm-dd',
    '         a yyyy/mm/dd@hh:ii:ss or yyyy-mm-dd@hh:ii:ss',
    '         a valid JSON or ISO 8601 date string',
    '',
    '\x1B[7m  Please note that \x1B[1mmm/dd\x1B[0m\x1B[7m or \x1B[1mmm/dd/yyyy\x1B[0m\x1B[7m format is not (yet) recognized  \x1B[0m',
    ''
  ].forEach(line => console.log(line));
}

function version() {
  const pkg = require('./package.json');
  return `\x1B[1m${pkg.name}\x1B[0m v${pkg.version}, by ${pkg.author}`;
}
