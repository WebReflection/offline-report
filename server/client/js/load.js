const html = document.documentElement;

module.exports = () => {
  const img = new Image;
  img.onload = () => {
    html.setAttribute('opacity', 1);
    if ('serviceWorker' in navigator)
      navigator.serviceWorker.ready.then(() => fetch(img.src));
  };
  img.src = getComputedStyle(html, ':before')
              .getPropertyValue('background-image')
              .replace(/^url\((['"]?)(\S+?)\1\)$/, '$2');
};
