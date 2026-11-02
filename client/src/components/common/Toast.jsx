import { useAuth } from '../../context/AuthContext';

export default function Toast() {
  const { toast } = useAuth();
  if (!toast) return null;
  return <div className={`toast glass ${toast.type}`}>{toast.message}</div>;
}
