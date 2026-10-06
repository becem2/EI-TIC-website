import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ProfileExperience from '../ProfileReference/ProfileExperience';

interface ProfileProps {
  user: any;
  setUser: (user: any) => void;
}

export default function Profile({ user, setUser }: ProfileProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const researcherId = searchParams.get('researcherId');
  const isPublicProfile = Boolean(researcherId);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [profileUser, setProfileUser] = useState<any>(null);

  useEffect(() => {
    if (researcherId) {
      const loadPublicProfile = async () => {
        try {
          const response = await fetch('/api/users/researchers');
          if (!response.ok) throw new Error('Impossible de charger les chercheurs.');
          const researchers = await response.json();
          const selectedResearcher = researchers.find((researcher: any) => String(researcher._id) === researcherId);
          setProfileUser(selectedResearcher || null);
        } catch (error) {
          console.error('Failed to load public profile', error);
          setProfileUser(null);
        } finally {
          setIsAuthReady(true);
        }
      };

      void loadPublicProfile();
      return;
    }

    if (!localStorage.getItem('session-active')) {
      navigate('/SignIn', { replace: true });
      return;
    }

    if (!user) {
      setIsAuthReady(false);
      setProfileUser(null);
      return;
    }

    setProfileUser(user);
    setIsAuthReady(true);
  }, [researcherId, user, navigate]);

  if (!isAuthReady || !profileUser) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-5xl items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-[32px] border border-outline bg-white p-10 text-center shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-surface-tint">Account</p>
          <h1 className="mt-3 text-3xl font-semibold text-on-surface">Chargement du profil…</h1>
        </div>
      </div>
    );
  }

  return <ProfileExperience user={profileUser} setUser={setUser} initialPublicView={isPublicProfile} />;
}
