const RangeArray = require('../shared/range-array.js');

const ra = RangeArray.from([
  new Date(2018, 3, 9),
  {start: new Date(2018, 3, 10), end: new Date(2018, 3, 12)},
  new Date(2018, 7, 1)
]);

console.log(ra);

console.log(ra[0].dates);

console.assert(ra.contains('2018-04-10T21:00:00.000Z'));
console.log(ra.delete({start: new Date(2018, 3, 11), end: new Date(2018, 3, 12)}));

console.log(JSON.stringify(ra, null, '  '));
