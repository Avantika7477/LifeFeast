import { DEFAULT_LANG, LANGUAGES } from '../../i18n';
import { useLanguage } from '../../context/LanguageContext';

export default function LanguageSelect({ compact = false, id = 'language-select' }) {
  const { language, setLanguage, t } = useLanguage();

  return (
    <label className={`lang-select-wrap ${compact ? 'compact' : ''}`}>
      {!compact && <span className="lang-select-label">{t('common.language')}</span>}
      <select
        id={id}
        className={`form-control select-control lang-select ${compact ? 'compact' : ''}`}
        value={language}
        onChange={(e) => setLanguage(e.target.value)}
        aria-label={t('common.language')}
        title={t('common.language')}
      >
        {LANGUAGES.map((l) => (
          <option key={l.code} value={l.code}>
            {compact
              ? l.native
              : l.code === DEFAULT_LANG
                ? `${l.native} (${t('settings.defaultLang')})`
                : `${l.native} · ${l.name}`}
          </option>
        ))}
      </select>
    </label>
  );
}
