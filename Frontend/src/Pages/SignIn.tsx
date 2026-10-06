import axios from 'axios';
import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import GoogleAuthButton from '../Components/GoogleAuthButton';

export default function SignIn({ setUser }: { setUser: (user: any) => void }) {
  const [rememberSession, setRememberSession] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [canResendVerification, setCanResendVerification] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const navigate = useNavigate();

  const handleGoogleAuthenticated = async () => {
    localStorage.setItem('session-active', 'true');
    const profileRes = await axios.get('/api/users/me');
    setUser(profileRes.data);
    setSuccessMessage('ACCÈS GOOGLE AUTORISÉ. INITIALISATION DE VOTRE SESSION DE RECHERCHE SÉCURISÉE...');
    window.setTimeout(() => navigate('/'), 1600);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setErrorMessage(null);
    setCanResendVerification(false);
    setIsSubmitting(true);

    const normalizedEmail = formData.email.trim().toLowerCase();
    const normalizedPassword = formData.password.trim();

    if (!normalizedEmail || !normalizedPassword) {
      setErrorMessage('Veuillez remplir tous les champs.');
      setIsSubmitting(false);
      return;
    }

    try {
      await axios.post('/api/users/login', { email: normalizedEmail, password: normalizedPassword });
      localStorage.removeItem('token');
      localStorage.setItem('session-active', 'true');

      const profileRes = await axios.get('/api/users/me');

      setUser(profileRes.data);
      setSuccessMessage('ACCÈS AUTORISÉ. INITIALISATION DE VOTRE SESSION DE RECHERCHE...');

      setTimeout(() => {
        navigate('/');
      }, 1600);
    } catch (err: any) {
      localStorage.removeItem('session-active');
      const message = err.response?.data?.message || 'La connexion a échoué.';
      setErrorMessage(message);
      setCanResendVerification(err.response?.status === 403 && message.toLowerCase().includes('verify'));
      setIsSubmitting(false);
    }
  };

  const resendVerification = async () => {
    try {
      const response = await axios.post('/api/users/resend-verification', { email: formData.email.trim().toLowerCase() });
      setSuccessMessage(response.data.message);
      setCanResendVerification(false);
    } catch {
      setErrorMessage('Impossible de renvoyer l’e-mail de vérification.');
    }
  };

  return (
    <div className="min-h-[calc(100vh-6rem)] overflow-x-hidden bg-surface-dim px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
        <div className="min-w-0 space-y-8">
          <div className="rounded-[32px] border border-outline bg-white p-5 shadow-sm sm:p-10">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-primary">
              Portail d’accès sécurisé
            </div>
            <h1 className="mt-6 text-4xl font-semibold tracking-tight text-on-surface sm:text-5xl">Se connecter</h1>
            <p className="mt-4 max-w-2xl text-base leading-8 text-on-surface-variant">
              Saisissez vos identifiants pour accéder à l’espace EI&TIC Lab en toute simplicité et sécurité.
            </p>
          </div>

          <div className="rounded-[32px] border border-outline bg-white p-5 shadow-sm sm:p-10">
            {successMessage ? (
              <div className="space-y-6 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-primary bg-primary/10 text-primary">
                  ✓
                </div>
                <div>
                  <h3 className="text-2xl font-semibold text-on-surface">Session ouverte</h3>
                  <p className="mt-2 text-sm text-on-surface-variant">{successMessage}</p>
                </div>
                <div className="mx-auto h-1 w-full overflow-hidden rounded-full bg-surface-container-lowest">
                  <div className="h-full w-2/3 rounded-full bg-primary" />
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-3 rounded-3xl border border-outline bg-surface-container px-4 py-4">
                  <p className="text-center text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Continuer avec Google</p>
                  <GoogleAuthButton
                    disabled={isSubmitting}
                    onAuthenticated={handleGoogleAuthenticated}
                    onError={setErrorMessage}
                  />
                </div>

                <div className="space-y-3">
                  <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 sm:tracking-[0.3em]">Identifiant de chercheur</label>
                  <input
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full rounded-3xl border border-outline bg-surface-container-low px-4 py-4 text-sm text-on-surface outline-none transition focus:border-primary"
                    placeholder="ID-7742-ALPHA"
                    type="email"
                    name="email"
                  />
                </div>

                <div className="space-y-3">
                  <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 sm:tracking-[0.3em]">Clé d’accès</label>
                  <input
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full rounded-3xl border border-outline bg-surface-container-low px-4 py-4 text-sm text-on-surface outline-none transition focus:border-primary"
                    placeholder="••••••••••••"
                    type="password"
                    name="password"
                  />
                </div>

                <label className="flex items-center gap-3 rounded-3xl border border-outline bg-surface-container px-4 py-3 text-sm text-on-surface-variant">
                  <input
                    checked={rememberSession}
                    onChange={(event) => setRememberSession(event.target.checked)}
                    className="h-4 w-4 rounded border-outline bg-white text-primary focus:ring-primary"
                    type="checkbox"
                  />
                  Garder cette session active pour votre prochaine visite
                </label>

                {errorMessage && (
                  <div className="rounded-3xl border border-error bg-error-container px-4 py-3 text-sm text-error">
                    {errorMessage}
                    {canResendVerification && (
                      <button type="button" onClick={() => void resendVerification()} className="mt-2 block font-semibold underline">
                        Renvoyer l’e-mail de vérification
                      </button>
                    )}
                  </div>
                )}

                <button
                  disabled={isSubmitting}
                  type="submit"
                  className="flex w-full items-center justify-center gap-3 rounded-3xl bg-primary px-6 py-4 text-sm font-semibold text-on-primary transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? 'Autorisation en cours...' : 'Accéder à l’espace sécurisé'}
                </button>

                <div className="flex flex-col gap-2 text-center text-sm text-slate-500 sm:flex-row sm:justify-between">
                  <button type="button" onClick={() => navigate('/ForgotPassword')} className="underline underline-offset-4">Clé d’accès oubliée ?</button>
                  <button type="button" className="text-primary underline underline-offset-4">Demander un accès</button>
                </div>
              </form>
            )}
          </div>
        </div>

        <div className="min-w-0 space-y-8">
          <div className="rounded-[32px] border border-outline bg-white p-5 shadow-sm sm:p-10">
            <div className="mb-6 h-80 overflow-hidden rounded-[28px] bg-slate-100">
              <img
                className="h-full w-full object-cover"
                src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80"
                alt="Espace de recherche"
              />
            </div>
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-on-surface">Session protégée</h2>
                <p className="mt-2 text-sm leading-7 text-on-surface-variant">
                  Vos identifiants sont vérifiés par le système d’authentification sécurisé du laboratoire avant l’ouverture de l’accès.
                </p>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-on-surface">Collaboration en temps réel</h2>
                <p className="mt-2 text-sm leading-7 text-on-surface-variant">
                  Retrouvez les tableaux de recherche, les espaces de projet et les actualités du laboratoire depuis un portail intuitif.
                </p>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-on-surface">Ressources du laboratoire</h2>
                <p className="mt-2 text-sm leading-7 text-on-surface-variant">
                  Accédez aux publications, aux événements et à la documentation dans une interface claire et épurée.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
