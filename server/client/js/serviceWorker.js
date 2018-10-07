if ('serviceWorker' in navigator) {
  addEventListener(
    'beforeinstallprompt',
    event => {
      event.preventDefault();
      window.installPrompt = event;
    }
  );
  navigator.serviceWorker
    .register('/sw.js?' + encodeURIComponent(
      location.pathname + location.search
    ));
}
