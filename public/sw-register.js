if ('serviceWorkerContainer' in navigator) {
  navigator.serviceWorkerContainer.register('/sw.js').then(() => {
    console.log('Service Worker registered successfully');
  }).catch((error) => {
    console.error('Service Worker registration failed:', error);
  });
}
