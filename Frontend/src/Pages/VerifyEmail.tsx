import axios from 'axios';
import { useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function VerifyEmail({ setUser }: { setUser: (user: any) => void }) {
  const [params] = useSearchParams();
  const email = params.get('email') || '';
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    try {
      const response = await axios.post('/api/users/verify-email-code', { email: email.trim().toLowerCase(), code: code.trim() });
      localStorage.setItem('session-active', 'true');
      setUser(response.data.user);
      navigate('/Acceuil', { replace: true });
    } catch (err: any) {
      localStorage.removeItem('session-active');
      setError(err.response?.data?.message || 'Impossible de vérifier ce code.');
    }
  };

  const resend = async () => {
    setError('');
    try {
      const response = await axios.post('/api/users/resend-verification', { email: email.trim().toLowerCase() });
      setMessage(response.data.message);
    } catch {
      setError('Impossible de renvoyer le code de vérification.');
    }
  };

  return (
    <div className="min-h-[calc(100vh-6rem)] bg-surface-dim px-4 py-10">
      <form onSubmit={submit} className="mx-auto max-w-lg space-y-6 rounded-[32px] border border-outline bg-white p-10 shadow-sm">
        <div><h1 className="text-3xl font-semibold text-on-surface">Vérifiez votre adresse e-mail</h1><p className="mt-2 text-sm leading-6 text-on-surface-variant">Saisissez le code à six chiffres envoyé à votre adresse e-mail.</p></div>
        <div className="rounded-3xl border border-outline bg-surface-container-low px-4 py-4 text-sm text-on-surface">{email || 'Aucune adresse e-mail fournie'}</div>
        <input required inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="000000" className="w-full rounded-3xl border border-outline bg-surface-container-low px-4 py-4 text-center text-2xl tracking-[0.5em] outline-none focus:border-primary" />
        {message && <div className="rounded-3xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-primary">{message}</div>}
        {error && <div className="rounded-3xl border border-error bg-error-container px-4 py-3 text-sm text-error">{error}</div>}
        <button type="submit" className="w-full rounded-3xl bg-primary px-6 py-4 text-sm font-semibold text-on-primary">Vérifier l’adresse e-mail</button>
        <div className="flex justify-between text-sm"><button type="button" onClick={() => void resend()} className="text-primary underline">Renvoyer le code</button><button type="button" onClick={() => navigate('/SignIn')} className="text-primary underline">Se connecter</button></div>
      </form>
    </div>
  );
}
