"use strict";

const {reset} = require('./utils.js');

const asRange = any => any instanceof Range ? any : Range.from(any);

const intersection = (a, b) => a.start <= b.start && b.start <= a.end;

class Range {

  static from(any) {
    return typeof any === 'string' || any instanceof Date ?
      new Range(new Date(any)) :
      new Range(
        new Date(any.start),
        new Date(any.end),
        any.timezone
      );
  }

  constructor(
    start = new Date,
    end = new Date(
      start.getFullYear(),
      start.getMonth(),
      start.getDate() + 1,
      start.getHours(),
      start.getMinutes(),
      start.getSeconds(),
      start.getMilliseconds()
    ),
    timezone = start.getTimezoneOffset()
  ) {
    this.start = start;
    this.end = end;
    this.timezone = timezone;
  }

  get dates() {
    const dates = [];
    let start = new Date(this.start);
    reset(start);
    while (start < this.end) {
      dates.push(new Date(start));
      start.setDate(start.getDate() + 1);
    }
    return dates;
  }

  contains(any) {
    const range = asRange(any);
    return this.start <= range.start && range.end <= this.end;
  }

  intersects(any) {
    const range = asRange(any);
    return intersection(this, range) || intersection(range, this);
  }

  intersectsEnd(any) {
    return intersection(this, asRange(any));
  }

  intersectsStart(any) {
    return intersection(asRange(any), this);
  }

}

module.exports = Range;
