import { useEffect, useRef, useState } from 'react';
import axios from 'axios';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (options: { client_id: string; callback: (response: { credential: string }) => void }) => void;
          renderButton: (element: HTMLElement, options: Record<string, string | number>) => void;
        };
      };
    };
  }
}

interface GoogleAuthButtonProps {
  onAuthenticated?: () => Promise<void>;
  onCredential?: (credential: string) => Promise<void>;
  onError: (message: string) => void;
  disabled?: boolean;
}

export default function GoogleAuthButton({ onAuthenticated, onCredential, onError, disabled = false }: GoogleAuthButtonProps) {
  const buttonRef = useRef<HTMLDivElement>(null);
  const onAuthenticatedRef = useRef(onAuthenticated);
  const onCredentialRef = useRef(onCredential);
  const onErrorRef = useRef(onError);
  const [isLoading, setIsLoading] = useState(false);

  onAuthenticatedRef.current = onAuthenticated;
  onCredentialRef.current = onCredential;
  onErrorRef.current = onError;

  useEffect(() => {
    let attempts = 0;
    const renderGoogleButton = () => {
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      if (!clientId) {
        onErrorRef.current('L’authentification Google n’est pas configurée.');
        return;
      }
      if (!window.google?.accounts.id || !buttonRef.current) {
        attempts += 1;
        if (attempts < 30) window.setTimeout(renderGoogleButton, 200);
        else onErrorRef.current('L’authentification Google n’a pas pu être chargée.');
        return;
      }

      buttonRef.current.replaceChildren();
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async ({ credential }) => {
          setIsLoading(true);
          try {
            if (onCredentialRef.current) {
              await onCredentialRef.current(credential);
              return;
            }
            await axios.post('/api/users/google', { credential });
            if (onAuthenticatedRef.current) await onAuthenticatedRef.current();
          } catch (error: any) {
            onErrorRef.current(error.response?.data?.message || 'L’authentification Google a échoué.');
          } finally {
            setIsLoading(false);
          }
        },
      });
      window.google.accounts.id.renderButton(buttonRef.current, {
        theme: 'outline',
        size: 'large',
        width: Math.min(360, Math.max(200, buttonRef.current.parentElement?.clientWidth ?? 360)),
        text: 'continue_with',
      });
    };

    renderGoogleButton();
  }, []);

  return (
    <div className={`relative flex min-h-11 w-full min-w-0 justify-center overflow-hidden ${disabled || isLoading ? 'pointer-events-none opacity-60' : ''}`}>
      <div ref={buttonRef} className="min-w-0 max-w-full" />
      {isLoading && <span className="absolute inset-0 flex items-center justify-center bg-white/80 text-sm text-slate-600">Connexion à Google...</span>}
    </div>
  );
}
