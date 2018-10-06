"use strict";

const Range = require('./range.js');

const setRange = (any, i, rangeArray) => {
  rangeArray[i] = Range.from(any);
};

const sortRanges = (a, b) => {
  if (a.start < b.start)
    return -1;
  if (b.start < a.start)
    return 1;
  return 0;
};

module.exports = class RangeArray extends Array {

  static from(array) {
    return new RangeArray(...array);
  }

  constructor(...args) {
    super(...args).forEach(setRange);
  }

  get dates() {
    return [].concat.apply([], this.map(range => range.dates));
  }

  contains(any) {
    return this.some(range => range.contains(any));
  }

  delete(any) {
    let modified = 0;
    const tmp = Range.from(any);
    for (let i = 0; i < this.length; i++) {
      const range = this[i];
      if (tmp.contains(range))
        this.splice(i--, modified = 1);
      else if (range.contains(tmp)) {
        const args = [i--, modified = 1];
        if (range.start < tmp.start)
          args.push(new Range(range.start, tmp.start));
        if (tmp.end < range.end)
          args.push(new Range(tmp.end, range.end));
        this.splice(...args);
      }
      else {
        if (range.intersectsEnd(tmp)) {
          range.end = tmp.start;
          modified = 1;
        }
        if (range.intersectsStart(tmp)) {
          range.start = tmp.end;
          modified = 1;
        }
        if (range.start.toISOString() === range.end.toISOString())
          this.splice(i--, modified = 1);
      }
    }
    return modified === 1;
  }

  intersects(any) {
    return this.some(range => range.intersects(any));
  }

  // returns ordered dates with merged intersections
  toJSON() {
    const length = this.length;
    if (length < 1)
      return [];
    const sorted = this.sort(sortRanges);
    let last = sorted[0];
    const list = [last];
    for (let i = 1; i < length; i++) {
      const current = sorted[i];
      if (last.contains(current))
        continue;
      if (current.start <= last.end)
        last.end = current.end;
      else
        list.push(last = current);
    }
    return list;
  }

};
