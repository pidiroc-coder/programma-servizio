// Configurazione dell'app (va anche nel service worker: per questo "self" e non "window")
// API_URL: Apps Script → Distribuisci → App web → URL che finisce con /exec
// FIREBASE e VAPID: console Firebase, progetto pds-arpa-molise (dati pubblici, non segreti)
self.PDS_CONFIG = {
  API_URL: 'https://script.google.com/macros/s/AKfycbxf-VST7AV5wWNaWxHBTxpGBDbp-3qHTPnkaB-VJL5YFXEFUZL5afmMIGJDY5l_8x5P/exec',
  FIREBASE: {
    apiKey: 'AIzaSyA5BSF_Xj2cL0sDgHML8FPLxsrXZB5A2zA',
    authDomain: 'pds-arpa-molise.firebaseapp.com',
    projectId: 'pds-arpa-molise',
    storageBucket: 'pds-arpa-molise.firebasestorage.app',
    messagingSenderId: '915594718323',
    appId: '1:915594718323:web:54b4e0beedcdd976ce8e06'
  },
  VAPID: 'BJyb4tYw8hu9l23stxot0y_5Wqvd85szO8zNLVTvfCRwSYOaU2XYMdQks3oI9Q6kJm2eO_bMr3foOosOf0DWf18'
};
