import { Download, X } from 'lucide-react';
import { usePwaInstall } from '../../hooks/usePwaInstall';

export default function InstallBanner() {
  const { showBanner, canInstall, showIosHelp, install, dismiss } = usePwaInstall();
  if (!showBanner) return null;

  return (
    <div className="pwa-banner glass" role="region" aria-label="Install LifeQuest">
      <span className="pwa-banner-icon" aria-hidden="true">
        <Download size={18} />
      </span>
      <div className="pwa-banner-copy">
        <strong>Install LifeQuest</strong>
        <p>
          {showIosHelp && !canInstall
            ? 'On iPhone, tap Share, then Add to Home Screen.'
            : 'Add it to your home screen and play it like an app.'}
        </p>
      </div>
      {canInstall && (
        <button className="btn btn-primary" type="button" onClick={install}>
          Install
        </button>
      )}
      <button className="btn-icon" type="button" onClick={dismiss} aria-label="Dismiss install prompt">
        <X size={16} />
      </button>
    </div>
  );
}
