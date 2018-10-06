module.exports = (render, details) => render`<!DOCTYPE html>
<html class=${details.unsplash.class} lang="en" opacity="0">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="theme-color" content="#000000">
    <meta name="apple-mobile-web-app-status-bar-style" content="#000000">
    <meta name="description" content="Where developers share their availability.">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>Offline Report</title>
    <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
    <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
    <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
    <link rel="manifest" href="/site.webmanifest">
    <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#5bbad5">
    <link rel="stylesheet" href="css/min.css">
    <link rel="stylesheet" href="css/unsplash.css">
    <script defer src="js/min.js"></script>
  </head>
  <body>
    <main>
      <form method="get">
        <label for="user">${details.placeholder}</label>
        ${details.input}
      </form>
      <output>${{html: details.status}}</output>
    </main>
    ${details.unsplash.link}
    <noscript><style>html:before{opacity:1;}label{position:static;}</style></noscript>
  </body>
</html>`;
