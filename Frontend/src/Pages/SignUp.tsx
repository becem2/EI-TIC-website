import axios from 'axios';
import { useState, type ChangeEvent, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import GoogleAuthButton from '../Components/GoogleAuthButton';

interface CountryOption {
  value: string;
  label: string;
  code: string;
  dialCode: string;
  placeholder: string;
  example: string;
}

const countryOptions: CountryOption[] = [
  { value: 'Tunisia', label: '🇹🇳 Tunisie (+216)', code: 'TN', dialCode: '+216', placeholder: '98 765 432', example: 'XX XXX XXX' },
  { value: 'Algeria', label: '🇩🇿 Algérie (+213)', code: 'DZ', dialCode: '+213', placeholder: '55 123 4567', example: 'XX XXX XXXX' },
  { value: 'Morocco', label: '🇲🇦 Maroc (+212)', code: 'MA', dialCode: '+212', placeholder: '61 234 5678', example: 'XX XXX XXXX' },
  { value: 'France', label: '🇫🇷 France (+33)', code: 'FR', dialCode: '+33', placeholder: '6 12 34 56 78', example: 'X XX XX XX XX' },
  { value: 'United Kingdom', label: '🇬🇧 Royaume-Uni (+44)', code: 'GB', dialCode: '+44', placeholder: '7911 123456', example: 'XXXX XXXXXX' },
  { value: 'United States', label: '🇺🇸 États-Unis (+1)', code: 'US', dialCode: '+1', placeholder: '(555) 019-2834', example: '(XXX) XXX-XXXX' },
  { value: 'Germany', label: '🇩🇪 Allemagne (+49)', code: 'DE', dialCode: '+49', placeholder: '151 1234567', example: 'XXX XXXXXXX' },
];

export default function SignUp({ setUser }: { setUser: (user: any) => void }) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    country: 'Tunisia',
    password: '',
    confirmPassword: '',
  });

  const selectedCountry = countryOptions.find((option) => option.value === formData.country) || countryOptions[0];
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [googleCredential, setGoogleCredential] = useState('');
  const navigate = useNavigate();

  const handleGoogleCredential = async (credential: string) => {
    const response = await axios.post('/api/users/google/profile', { credential });
    setGoogleCredential(credential);
    setFormData((current) => ({
      ...current,
      email: response.data.email,
      firstName: current.firstName || response.data.firstName,
      lastName: current.lastName || response.data.lastName,
    }));
    setErrorMessage(null);
  };

  const getPasswordStrength = () => {
    const password = formData.password;
    if (!password) {
      return { label: 'En attente du mot de passe', color: 'text-outline-variant', width: 'w-0', score: 0 };
    }

    const len = password.length;
    const hasLetters = /[a-zA-Z]/.test(password);
    const hasNumbers = /[0-9]/.test(password);
    const hasSpecial = /[^a-zA-Z0-9]/.test(password);
    const hasMixedCase = /[a-z]/.test(password) && /[A-Z]/.test(password);

    let score = 0;
    if (len >= 6) score += 1;
    if (len >= 10) score += 1;
    if (hasLetters) score += 1;
    if (hasNumbers) score += 1;
    if (hasSpecial || hasMixedCase) score += 1;

    if (score <= 2) {
      return { label: 'FAIBLE', color: 'text-error', width: 'w-1/4 bg-error', score };
    }
    if (score <= 4) {
      return { label: 'SÉCURISÉ', color: 'text-tertiary', width: 'w-2/3 bg-tertiary', score };
    }
    return { label: 'PROTECTION RENFORCÉE', color: 'text-primary', width: 'w-full bg-primary', score };
  };

  const strength = getPasswordStrength();
  const passwordMatches = formData.confirmPassword.length > 0 && formData.password === formData.confirmPassword;

  const formatPhone = (value: string, countryValue: string) => {
    const digits = value.replace(/\D/g, '');
    switch (countryValue) {
      case 'United States':
      case 'Canada': {
        const clean = digits.slice(0, 10);
        if (clean.length === 0) return '';
        if (clean.length <= 3) return `(${clean}`;
        if (clean.length <= 6) return `(${clean.slice(0, 3)}) ${clean.slice(3)}`;
        return `(${clean.slice(0, 3)}) ${clean.slice(3, 6)}-${clean.slice(6)}`;
      }
      case 'United Kingdom': {
        const clean = digits.slice(0, 10);
        if (clean.length <= 4) return clean;
        return `${clean.slice(0, 4)} ${clean.slice(4)}`;
      }
      case 'France': {
        const clean = digits.slice(0, 9);
        const parts = [] as string[];
        if (clean.length > 0) parts.push(clean.slice(0, 1));
        if (clean.length > 1) parts.push(clean.slice(1, 3));
        if (clean.length > 3) parts.push(clean.slice(3, 5));
        if (clean.length > 5) parts.push(clean.slice(5, 7));
        if (clean.length > 7) parts.push(clean.slice(7, 9));
        return parts.join(' ');
      }
      case 'Germany': {
        const clean = digits.slice(0, 11);
        if (clean.length <= 3) return clean;
        return `${clean.slice(0, 3)} ${clean.slice(3)}`;
      }
      case 'Tunisia':
      case 'Algeria':
      case 'Morocco': {
        const clean = digits.slice(0, 8);
        if (clean.length === 0) return '';
        if (clean.length <= 2) return clean;
        if (clean.length <= 5) return `${clean.slice(0, 2)} ${clean.slice(2)}`;
        return `${clean.slice(0, 2)} ${clean.slice(2, 5)} ${clean.slice(5)}`;
      }
      default: {
        if (digits.length === 0) return '';
        if (digits.length <= 3) return digits;
        if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
        if (digits.length <= 10) return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
        return `${digits.slice(0, 4)} ${digits.slice(4, 8)} ${digits.slice(8, 12)}`;
      }
    }
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCountryChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    setFormData((prev) => ({ ...prev, country: value, phone: formatPhone(prev.phone, value) }));
  };

  const handlePhoneChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setFormData((prev) => ({ ...prev, phone: formatPhone(value, prev.country) }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    const normalizedFirstName = formData.firstName.trim();
    const normalizedLastName = formData.lastName.trim();
    const normalizedEmail = formData.email.trim().toLowerCase();
    const normalizedPhone = formData.phone.trim();
    const normalizedPassword = formData.password.trim();
    const normalizedConfirmPassword = formData.confirmPassword.trim();

    if (!normalizedFirstName || !normalizedLastName || !normalizedEmail || !normalizedPhone || (!googleCredential && (!normalizedPassword || !normalizedConfirmPassword))) {
      setErrorMessage('Veuillez remplir tous les champs.');
      setIsSubmitting(false);
      return;
    }
    if (!googleCredential && normalizedPassword !== normalizedConfirmPassword) {
      setErrorMessage('Les mots de passe ne correspondent pas.');
      setIsSubmitting(false);
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const res = await axios.post('/api/users/register', {
        username: `${formData.firstName} ${formData.lastName}`.trim(),
        firstName: normalizedFirstName,
        lastName: normalizedLastName,
        email: normalizedEmail,
        phoneNumber: normalizedPhone,
        country: formData.country,
        password: normalizedPassword,
        ...(googleCredential ? { googleCredential } : {}),
      });
      setUser(null);
      setSuccessMessage(res.data.message || 'Compte créé. Vérifiez votre adresse e-mail avant de vous connecter.');
      window.setTimeout(() => navigate(`/VerifyEmail?email=${encodeURIComponent(normalizedEmail)}`), 1200);
    } catch (err: any) {
      const message = err.response?.data?.message || 'La création du compte a échoué.';
      setErrorMessage(message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-6rem)] overflow-x-hidden bg-surface-dim px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
        <div className="min-w-0 space-y-8">
          <div className="rounded-[32px] border border-outline bg-white p-5 shadow-sm sm:p-10">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-primary">
              Initialisation du système
            </div>
            <h1 className="mt-6 text-4xl font-semibold tracking-tight text-on-surface sm:text-5xl">Créer un compte</h1>
            <p className="mt-4 max-w-2xl text-base leading-8 text-on-surface-variant">
              Enregistrez vos identifiants pour accéder à l’espace EI&TIC Lab grâce à un parcours d’inscription simple et soigné.
            </p>
          </div>

          <div className="rounded-[32px] border border-outline bg-white p-5 shadow-sm sm:p-10">
            {successMessage ? (
              <div className="space-y-6 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-primary bg-primary/10 text-primary">
                  ✓
                </div>
                <div>
                  <h3 className="text-2xl font-semibold text-on-surface">Initialisation en cours...</h3>
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
                    onCredential={handleGoogleCredential}
                    onError={setErrorMessage}
                  />
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-3">
                    <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 sm:tracking-[0.3em]">Prénom</label>
                    <input
                      required
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      className="w-full rounded-3xl border border-outline bg-surface-container-low px-4 py-4 text-sm text-on-surface outline-none transition focus:border-primary"
                      placeholder="Alan"
                      type="text"
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 sm:tracking-[0.3em]">Nom</label>
                    <input
                      required
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      className="w-full rounded-3xl border border-outline bg-surface-container-low px-4 py-4 text-sm text-on-surface outline-none transition focus:border-primary"
                      placeholder="Turing"
                      type="text"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 sm:tracking-[0.3em]">E-mail professionnel</label>
                  <input
                    required
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full rounded-3xl border border-outline bg-surface-container-low px-4 py-4 text-sm text-on-surface outline-none transition focus:border-primary"
                    placeholder="chercheur@laboratoire.fr"
                    type="email"
                    disabled={Boolean(googleCredential)}
                  />
                </div>

                <div className="space-y-3">
                  <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 sm:tracking-[0.3em]">Téléphone professionnel</label>
                  <div className="flex min-w-0 overflow-hidden rounded-[28px] border border-outline bg-white shadow-sm focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20">
                    <div className="relative flex w-[42%] shrink-0 items-center border-r border-outline/70 bg-surface-container px-2 py-3 sm:w-auto sm:min-w-36 sm:px-3">
                      <select
                        required
                        name="country"
                        value={formData.country}
                        onChange={handleCountryChange}
                        className="w-full appearance-none bg-transparent pr-5 text-xs text-on-surface outline-none sm:text-sm"
                      >
                        {countryOptions.map((option) => (
                          <option key={option.value} value={option.value} className="bg-white text-on-surface">
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                    <div className="flex min-w-0 flex-1 items-center px-2 sm:px-4">
                      <span className="mr-2 shrink-0 text-sm text-slate-500 sm:mr-3">{selectedCountry.dialCode}</span>
                      <input
                        required
                        name="phone"
                        value={formData.phone}
                        onChange={handlePhoneChange}
                        className="w-full bg-transparent py-3 text-sm text-on-surface outline-none placeholder:text-slate-400"
                        placeholder={selectedCountry.placeholder}
                        type="tel"
                      />
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-1 text-[11px] text-slate-500">
                    <span>Format : <span className="text-primary">{selectedCountry.example}</span></span>
                    {formData.phone && (
                      <span className={formData.phone.length === selectedCountry.placeholder.length ? 'text-primary' : 'text-slate-500'}>
                        {formData.phone.length === selectedCountry.placeholder.length ? '✓ FORMAT VALIDE' : 'INCOMPLET'}
                      </span>
                    )}
                  </div>
                </div>

                {!googleCredential && <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-3">
                    <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 sm:tracking-[0.3em]">Mot de passe</label>
                    <input
                      required
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full rounded-3xl border border-outline bg-surface-container-low px-4 py-4 text-sm text-on-surface outline-none transition focus:border-primary"
                      placeholder="••••••••••••"
                      type="password"
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 sm:tracking-[0.3em]">Confirmer le mot de passe</label>
                    <input
                      required
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className={`w-full rounded-3xl border px-4 py-4 text-sm text-on-surface outline-none transition ${formData.confirmPassword && !passwordMatches
                          ? 'border-error bg-error-container/50'
                          : 'border-outline bg-surface-container-low focus:border-primary'
                        }`}
                      placeholder="••••••••••••"
                      type="password"
                    />
                  </div>
                </div>}

                {!googleCredential && <div className="rounded-[28px] border border-outline bg-surface-container-low p-4 text-sm text-slate-600">
                  <div className="flex items-center justify-between">
                    <span>{formData.confirmPassword && !passwordMatches ? '⚠️ Les mots de passe ne correspondent pas' : 'Contrôle : un chiffrement robuste est requis.'}</span>
                    <span className={`font-semibold ${strength.color}`}>{strength.label}</span>
                  </div>
                  <div className="mt-3 flex h-2 gap-1.5">
                    {[1, 2, 3, 4, 5].map((index) => {
                      const isActive = strength.score >= index;
                      let segmentClass = 'bg-surface-container-low border border-outline/70';
                      if (isActive) {
                        if (strength.score <= 2) segmentClass = 'bg-error';
                        else if (strength.score === 3) segmentClass = 'bg-amber-500';
                        else if (strength.score === 4) segmentClass = 'bg-lime-500';
                        else segmentClass = 'bg-primary';
                      }
                      return <div key={index} className={`flex-1 rounded-full ${segmentClass}`} />;
                    })}
                  </div>
                </div>}

                {googleCredential && (
                  <div className="rounded-[28px] border border-primary/30 bg-primary/10 p-4 text-sm text-primary">
                    Google a vérifié votre adresse e-mail. Complétez les champs restants, puis créez votre compte.
                  </div>
                )}

                {errorMessage && (
                  <div className="rounded-3xl border border-error bg-error-container px-4 py-3 text-sm text-error">
                    {errorMessage}
                  </div>
                )}

                <button
                  disabled={isSubmitting || (!!formData.confirmPassword && !passwordMatches)}
                  type="submit"
                  className="flex w-full items-center justify-center gap-3 rounded-3xl bg-primary px-6 py-4 text-sm font-semibold text-on-primary transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? 'Création du compte...' : 'Créer mon compte'}
                </button>

                <p className="text-center text-sm text-slate-500">
                  Vous avez déjà un compte ?{' '}
                  <button type="button" onClick={() => navigate('/SignIn')} className="font-semibold text-primary hover:underline">
                    Se connecter
                  </button>
                </p>
              </form>
            )}
          </div>
        </div>

        <div className="min-w-0 space-y-8">
          <div className="rounded-[32px] border border-outline bg-white p-5 shadow-sm sm:p-10">
            <div className="mb-6 h-80 overflow-hidden rounded-[28px] bg-slate-100">
              <img
                className="h-full w-full object-cover"
                src="https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80"
                alt="Modern research environment"
              />
            </div>
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold text-on-surface">Télémétrie en temps réel</h2>
                <p className="mt-2 text-sm leading-7 text-on-surface-variant">
                  Connectez-vous aux capteurs et aux flux de données expérimentales dès que votre compte est actif.
                </p>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-on-surface">Collaboration fluide</h2>
                <p className="mt-2 text-sm leading-7 text-on-surface-variant">
                  Accédez aux publications, aux événements et à la documentation dans une interface claire et sans distraction.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
