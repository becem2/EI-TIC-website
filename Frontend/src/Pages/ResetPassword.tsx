import axios from 'axios';
import { useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    if (password.length < 10 || password !== confirmation) {
      setError('Utilisez au moins 10 caractères et vérifiez que les deux mots de passe correspondent.');
      return;
    }
    try {
      const response = await axios.post('/api/users/reset-password', { token: params.get('token'), password });
      setMessage(response.data.message);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Impossible de réinitialiser le mot de passe.');
    }
  };

  return (
    <div className="min-h-[calc(100vh-6rem)] bg-surface-dim px-4 py-10">
      <form onSubmit={submit} className="mx-auto max-w-lg space-y-6 rounded-[32px] border border-outline bg-white p-10 shadow-sm">
        <div><h1 className="text-3xl font-semibold text-on-surface">Réinitialiser le mot de passe</h1><p className="mt-2 text-sm leading-6 text-on-surface-variant">Choisissez un nouveau mot de passe pour votre compte.</p></div>
        <input required minLength={10} type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Nouveau mot de passe" className="w-full rounded-3xl border border-outline bg-surface-container-low px-4 py-4 text-sm outline-none focus:border-primary" />
        <input required minLength={10} type="password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} placeholder="Confirmer le nouveau mot de passe" className="w-full rounded-3xl border border-outline bg-surface-container-low px-4 py-4 text-sm outline-none focus:border-primary" />
        {message && <div className="rounded-3xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm text-primary">{message}</div>}
        {error && <div className="rounded-3xl border border-error bg-error-container px-4 py-3 text-sm text-error">{error}</div>}
        <button type="submit" className="w-full rounded-3xl bg-primary px-6 py-4 text-sm font-semibold text-on-primary">Définir le mot de passe</button>
        <button type="button" onClick={() => navigate('/SignIn')} className="w-full text-sm text-primary underline">Retour à la connexion</button>
      </form>
    </div>
  );
}
