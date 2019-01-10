#!/usr/bin/env node

'use strict';

const program = require('./program.js');

const {API, DATABASE, REPOSITORY} = require('./shared/constants.js');
const {isDay, parseVacations} = require('./shared/utils.js');
const RangeArray = require('./shared/range-array.js');
const Range = require('./shared/range.js');
const be = require('./backend.js');

const faroff = require('faroff');
const holidays = require('monthly/cli/holidays.js');
const monthly = require('monthly');
const ora = require('ora');


const today = new Date;
const tzo = today.getTimezoneOffset();
const day = today.getDate();
const month = today.getMonth();
const year = today.getFullYear();
const date = new Date(year, 0, 1);
const options = {
  date: date,
  startDay: 1,
  highlight: [],
  year: true
};

if (program.updateStatus) {
  be.user(program)
    .then(be.getVacations)
    .then(updateStatus)
    .catch(exit);
} else if (program.about) {
  const spinner = ora({
    text: `grabbing ${program.about} vacations`,
    spinner: process.platform === 'darwin' ? 'dots' : 'triangle'
  }).start();
  be.user(program)
    .then(user => {
      faroff
        .get(`${API}/repos/${program.about}/${REPOSITORY}/contents/${DATABASE}`)
        .then(result => {
          spinner.stop();
          if (result.status == 200) {
            const vacations = RangeArray.from(parseVacations(result));
            if (vacations.length) {
              return showVacations({
                holidays: user.holidays,
                name: /api\.github\.com\/repos\/([^/]+?)\//.test(result.json.url) ?
                        RegExp.$1 : program.about,
                vacations
              });
            }
            exit(`\x1B[1m${program.about}\x1B[0m is always online.`);
          }
          exit(`\x1B[1m${program.about}\x1B[0m is not on this system.`);
        })
        .catch(() => {
          spinner.stop();
          exit(`\x1B[1mConnection error\x1B[0m`);
        });
    })
    .catch(error => {
      spinner.stop();
      exit(error);
    });
} else if (program.add || program.cancel || program.clear) {
  be.user(program)
    .then(be.getVacations)
    .then(user => {
      const {day, from, to} = program;
      let changes = 0;
      if (program.clear) {
        changes = user.vacations.splice(0).length;
      } else {
        if (day) {
          const range = new Range(day);
          if (program.cancel) {
            if (user.vacations.delete(range))
              changes++;
          }
          else if (!user.vacations.contains(range)) {
            changes++;
            user.vacations.push(range);
          }
        }
        else {
          const start = new Date(from);
          const end = new Date(to);
          // end dates are inclusive
          end.setDate(end.getDate() + 1);
          const range = new Range(start, end);
          if (program.cancel) {
            if (user.vacations.delete(range))
              changes++;
          }
          else if (!user.vacations.contains(range)) {
            changes++;
            user.vacations.push(range);
          }
        }
      }
      if (changes)
        be.setVacations(user)
          .then(() => {
            console.log(
              `\nApplied \x1B[1m${changes}\x1B[0m ${changes === 1 ? 'change' : 'changes'}`
            );
            showVacations(user);
          })
          .catch(exit);
      else
        console.log('\nNothing changed.\n');
    })
    .catch(exit);
} else {
  be.user(program)
    .then(be.getVacations)
    .then(showVacations)
    .catch(exit);
}

function addMonth(line, i, arr) {
  arr[i] = line + '  ' + this[i];
}

function exit(message) {
  console.log(`\n${message}\n`);
  process.exit(0);
}

function newLine(lines) {
  return lines.join('\n');
}

function setHighlight(now) {
  options.bold =
    now.getMonth() === month &&
    now.getFullYear() === year ?
      day : 0;
}

function showVacations(user) {
  const {day, from, to} = program;
  const start = from || day;
  if (start) {
    date.setFullYear(start.getFullYear());
    date.setMonth(start.getMonth());
  }
  setHighlight(date);
  const year = date.getFullYear();
  const vacations = holidays(user.holidays, year);
  options.underline = vacations.national.concat(options.bold);
  options.dim = vacations.national.concat(vacations.regional);
  options.highlight = user.vacations.dates;
  const output = [monthly(options)];
  if (day) {
    if (isDay(day)) {
      const range = new Range(day);
      let i = user.vacations.findIndex(contained, range);
      if (-1 < i)
        i = user.vacations.findIndex(intersected, range);
      if (-1 < i) {
        const details = user.vacations[i];
        output[0].push(
          '\n\x1B[1moffline\x1B[0m',
          ' from: ' + details.start,
          '   to: ' + details.end,
          ' diff: ' + ((tzo - details.timezone) / 60) + 'h'
        );
      }
      else
        output[0].push('\n\x1B[1monline\x1B[0m');
    }
    else
      output[0].push(`\n\x1B[1m${
        user.vacations.contains(new Range(day, day)) ? 'offline' : 'online'
      }\x1B[0m`);
  }
  else {
    const end = to || new Date(
      date.getFullYear() + 1,
      date.getMonth() - 1,
      1
    );
    for (let cols = 1, i; date < end; i++) {
      i = (cols++ / 3) >>> 0;
      date.setMonth(date.getMonth() + 1);
      if (date <= end) {
        options.underline.pop();
        setHighlight(date);
        options.underline.push(options.bold);
        if (i === output.length)
          output[i] = monthly(options);
        else
          output[i].forEach(addMonth, monthly(options));
      }
    }
  }
  exit(
    userHeader(user.name, output[0][1].replace(/\x1B\[\dm/g, '').length + 1) +
    output.map(newLine).join('\n')
  );
}

function updateStatus(user) {
  be.updateStatus(
    user,
    user.vacations.contains(new Range(today, today)),
    exit
  );
}

function userHeader(name, pad) {
  const prefix = '🌴 ';
  const suffix = ' ☀️';
  const length = prefix.length + name.length + suffix.length;
  const left = Math.floor((pad / 2) - (length / 2));
  return `${
    ' '.repeat(Math.max(0, left))
  }${prefix}\x1B[1m${name}\x1B[0m${suffix}\n\n`;
}

function contained(range) {
  return range.contains(this);
}

function intersected(range) {
  return range.intersects(this);
}
