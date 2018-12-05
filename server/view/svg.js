const getStatus = status => status === 'unknown' ? 'unknown' : status;
const getBGColor = status => status === 'unknown' ?
                              '#aaa' :
                              (status === 'online' ?
                                '#4c1' :
                                '#c41');

module.exports = (render, info) => {
  const status = getStatus(info.status);
  const bgcolor = getBGColor(status);
  return info[status] || render`<svg xmlns="http://www.w3.org/2000/svg" width="90" height="20">
  <linearGradient id="a" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <rect rx="3" width="90" height="20" fill="#555"/>
  <rect rx="3" x="32" width="58" height="20" fill="${bgcolor}"/>
  <path fill="${bgcolor}" d="M32 0h4v20h-4z"/>
  <rect rx="3" width="90" height="20" fill="url(#a)"/>
  <g fill="#fff" text-anchor="middle" font-family="DejaVu Sans,Verdana,Geneva,sans-serif" font-size="11">
    <text x="15.5" y="15" fill="#010101" fill-opacity=".3">dev</text>
    <text x="15.5" y="14">dev</text>
    <text x="60.5" y="15" fill="#010101" fill-opacity=".3">${status}</text>
    <text x="60.5" y="14">${status}</text>
  </g>
</svg>`;
};
