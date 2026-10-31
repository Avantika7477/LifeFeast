import { tStored } from '../../i18n';

export default function Loader({ text }) {
  const label = text || tStored('common.loading');
  return (
    <div className="loader-wrap">
      <div className="spinner" />
      <p>{label}</p>
    </div>
  );
}
