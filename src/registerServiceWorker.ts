export function registerServiceWorker() {
  if (typeof window === 'undefined') return;
  if (!('serviceWorker' in navigator)) return;

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('service-worker.js')
      .then((registration) => {
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) return;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                console.info('Une nouvelle version de OMEX est disponible.');
                // TODO: Afficher une bannière/toast et proposer le rafraîchissement
              } else {
                console.info('OMEX est prêt à être utilisé hors-ligne.');
              }
            }
          });
        });
      })
      .catch((err) => {
        console.error('SW registration failed:', err);
      });
  });
}
