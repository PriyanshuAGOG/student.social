import React from 'react';

export default function PWAInstallPrompt() {
  const [installPrompt, setInstallPrompt] = React.useState<any>(null);
  const [isInstalled, setIsInstalled] = React.useState(false);
  const [showPrompt, setShowPrompt] = React.useState(false);

  React.useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;

    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;

    if (outcome === 'accepted') {
      setIsInstalled(true);
      setShowPrompt(false);
    }

    setInstallPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
  };

  if (isInstalled || !showPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 max-w-sm bg-white dark:bg-slate-900 rounded-lg shadow-lg p-4 border border-slate-200 dark:border-slate-800 animate-in slide-in-from-bottom-2">
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <h3 className="font-semibold text-sm text-slate-900 dark:text-white">
            Install PeerSpark
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            Download PeerSpark as an app for quick access and offline support.
          </p>
        </div>
        <button
          onClick={handleDismiss}
          className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300"
        >
          ✕
        </button>
      </div>
      <div className="flex gap-2 mt-3">
        <button
          onClick={handleDismiss}
          className="flex-1 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
        >
          Not now
        </button>
        <button
          onClick={handleInstall}
          className="flex-1 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded px-3 py-2"
        >
          Install
        </button>
      </div>
    </div>
  );
}
