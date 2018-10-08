"use strict";

module.exports = status => {
  switch (status) {
    case 'online': return '🤖 online&nbsp; 💻';
    case 'offline': return '🌴 offline&nbsp; ☀️';
    default: return 'no report found';
  }
};
