import axios from 'axios';
import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    try {
      const response = await axios.post('/api/users/forgot-password', { email: email.trim().toLowerCase() });
      setMessage(response.data.message);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Impossible de traiter la demande.');
    }
  };

  return (
    <div className="min-h-[calc(100vh-6rem)] bg-surface-dim px-4 py-10">
      <form onSubmit={submit} className="mx-auto max-w-lg space-y-6 rounded-[32px] border border-outline bg-white p-10 shadow-sm">
        <div><h1 className="text-3xl font-semibold text-on-surface">Mot de passe oublié</h1><p className="mt-2 text-sm leading-6 text-on-surface-variant">Saisissez votre adresse e-mail pour recevoir un lien sécurisé de réinitialisation.</p></div>
        <input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" className="w-full rounded-3xl border border-outline bg-surface-container-low px-4 py-4 text-sm outline-none focus:border-primary" />
        {message && <div className="rounded-3xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-primary">{message}</div>}
        {error && <div className="rounded-3xl border border-error bg-error-container px-4 py-3 text-sm text-error">{error}</div>}
        <button type="submit" className="w-full rounded-3xl bg-primary px-6 py-4 text-sm font-semibold text-on-primary">Envoyer le lien</button>
        <button type="button" onClick={() => navigate('/SignIn')} className="w-full text-sm text-primary underline">Retour à la connexion</button>
      </form>
    </div>
  );
}
