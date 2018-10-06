"use strict";

const LIMIT = 5;
const year = (new Date).getFullYear();

module.exports = {
  isDay,
  parse,
  parseVacations,
  reset
};

function exit(message) {
  console.log('\n' + message + '\n');
  process.exit(0);
}

function exitIfOutOfRange(date) {
  if (isNaN(date.getTime()))
    exit('Unable to handle this date.');
  const fullYear = date.getFullYear();
  if (fullYear < (year - LIMIT) || (year + LIMIT) < fullYear)
      exit('Unable to handle ' + fullYear + ' data.');
  return date;
}

function isDay(date) {
  return date.getHours() === 0 &&
          date.getMinutes() === 0 &&
          date.getSeconds() === 0 &&
          date.getMilliseconds() === 0;
}

function parse(value) {
  parse.reason = 'explicit';
  if (value === 'now')
    return new Date;
  if (value === 'today')
    return reset(new Date);
  if (value === 'tomorrow') {
    const date = reset(new Date());
    date.setDate(date.getDate() + 1);
    return date;
  }
  if (value === 'sunday' || value === 'sun')
    return getNextDayOfTheWeek(0);
  if (value === 'monday' || value === 'mon')
    return getNextDayOfTheWeek(1);
  if (value === 'tuesday' || value === 'tue')
    return getNextDayOfTheWeek(2);
  if (value === 'wednesday' || value === 'wed')
    return getNextDayOfTheWeek(3);
  if (value === 'thursday' || value === 'thu')
    return getNextDayOfTheWeek(4);
  if (value === 'friday' || value === 'fri')
    return getNextDayOfTheWeek(5);
  if (value === 'saturday' || value === 'sat')
    return getNextDayOfTheWeek(6);
  if (/^[0-9]{1,2}$/.test(value)) {
    parse.reason = 'implicit';
    const day = parseInt(value, 10);
    const date = new Date();
    const after = day < date.getDate();
    date.setDate(day);
    reset(date);
    if (after)
      date.setMonth(date.getMonth() + 1);
    return exitIfOutOfRange(date);
  }
  if (/^(2[0-9]{3})([/-]([0-9]{1,2}))?$/.test(value)) {
    const {$1, $2, $3} = RegExp;
    const date = new Date(parseInt($1, 10), 0, 1);
    reset(date);
    if ($2)
      date.setMonth(parseInt($3, 10) - 1);
    return exitIfOutOfRange(date);
  }
  if (/^([0-9]{1,2})[/-]([0-9]{1,2})([/-]([0-9]{2,4}))?$/.test(value)) {
    const {$1, $2, $4} = RegExp;
    const fullYear = parseInt($4 || year, 10);
    const date = new Date(
      fullYear + (fullYear < 100 ? 2000 : 0),
      parseInt($2, 10) - 1,
      parseInt($1, 10)
    );
    if (!$4)
      parse.reason = 'implicit';
    return exitIfOutOfRange(reset(date));
  }
  if (/^([0-9]{4})[/-]([0-9]{1,2})[/-]([0-9]{1,2})(@([0-9]{1,2})(:([0-9]{1,2})(:([0-9]{1,2}))?)?)?$/.test(value)) {
    const {$1, $2, $3, $4, $5, $6, $7, $8, $9} = RegExp;
    const date = new Date(
      parseInt($1, 10),
      parseInt($2, 10) - 1,
      parseInt($3, 10)
    );
    reset(date);
    if ($4) {
      date.setHours(parseInt($5, 10));
      if ($6) {
        date.setMinutes(parseInt($7, 10));
        if ($8)
          date.setSeconds(parseInt($9, 10));
      }
    }
    return exitIfOutOfRange(date);
  }
  if (/^[2-9][0-9]{3}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(\.[0-9]{3})?Z?$/i.test(value))
    return exitIfOutOfRange(new Date(value));
  return null;
}

function getNextDayOfTheWeek(dow) {
  const date = reset(new Date());
  do {
    date.setDate(date.getDate() + 1);
  } while(date.getDay() !== dow);
  return date;
}

function parseVacations(result) {
  return JSON.parse(
    Buffer.from(
      result.json.content,
      result.json.encoding
    )
  );
}

function reset(date) {
  date.setHours(0);
  date.setMinutes(0);
  date.setSeconds(0);
  date.setMilliseconds(0);
  return date;
}
