import { Download, X } from 'lucide-react';
import { usePwaInstall } from '../../hooks/usePwaInstall';
import { useLanguage } from '../../context/LanguageContext';

export default function InstallBanner() {
  const { showBanner, canInstall, showIosHelp, install, dismiss } = usePwaInstall();
  const { t } = useLanguage();
  if (!showBanner) return null;

  return (
    <div className="pwa-banner glass" role="region" aria-label={t('install.region')}>
      <span className="pwa-banner-icon" aria-hidden="true">
        <Download size={18} />
      </span>
      <div className="pwa-banner-copy">
        <strong>{t('install.title')}</strong>
        <p>{showIosHelp && !canInstall ? t('install.ios') : t('install.add')}</p>
      </div>
      {canInstall && (
        <button className="btn btn-primary" type="button" onClick={install}>
          {t('install.install')}
        </button>
      )}
      <button className="btn-icon" type="button" onClick={dismiss} aria-label={t('install.dismiss')}>
        <X size={16} />
      </button>
    </div>
  );
}
