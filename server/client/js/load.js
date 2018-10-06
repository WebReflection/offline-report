const html = document.documentElement;

module.exports = () => {
  const img = new Image;
  img.onload = () => {
    html.setAttribute('opacity', 1);
    if ('serviceWorker' in navigator) {
      addEventListener(
        'beforeinstallprompt',
        event => {
          event.preventDefault();
          window.installPrompt = event;
        }
      );
      navigator.serviceWorker
        .register('/sw.js')
        .then(() => fetch(img.src));
    }
  };
  img.src = getComputedStyle(html, ':before')
              .getPropertyValue('background-image')
              .replace(/^url\((['"]?)(\S+?)\1\)$/, '$2');
};
