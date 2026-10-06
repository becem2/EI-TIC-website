import axios from 'axios';
import { useCallback, useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';

const navItems = [
  { label: 'Accueil', href: '/Acceuil' },
  { label: 'Publications', href: '/Publications' },
  { label: 'Chercheurs', href: '/Chercheurs' },
  { label: 'Actualites et Événements', href: '/Actualites' },
  { label: 'Collaboration', href: '/Collaboration' },
];

export default function Navbar({ user, setUser }: { user: any; setUser: (user: any) => void }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const navigate = useNavigate();

  const avatarLabel = user?.name?.[0]?.toUpperCase() || user?.username?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U';
  const isAdmin = Number(user?.role) === 0;

  const fetchNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      return;
    }

    try {
      const response = await axios.get('/api/users/notifications');
      setNotifications(response.data || []);
    } catch {
      setNotifications([]);
    }
  }, [user]);

  useEffect(() => {
    void fetchNotifications();
    if (!user) return undefined;
    const interval = window.setInterval(() => void fetchNotifications(), 30000);
    return () => window.clearInterval(interval);
  }, [fetchNotifications, user]);

  const markNotificationRead = async (notificationId: string) => {
    try {
      await axios.patch(`/api/users/notifications/${notificationId}/read`);
      setNotifications((current) => current.map((notification) => notification._id === notificationId ? { ...notification, readAt: new Date().toISOString() } : notification));
    } catch (error) {
      console.error('Failed to mark notification as read', error);
    }
  };

  const decideAccessRequest = async (notification: any, decision: 'approved' | 'rejected') => {
    const requestId = notification.accessRequest?._id;
    if (!requestId) return;

    try {
      await axios.post(`/api/users/publication-access-requests/${requestId}/decision`, { decision });
      await fetchNotifications();
    } catch (error) {
      console.error('Failed to decide publication access request', error);
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post('/api/users/logout');
    } catch (err) {
      console.error('Logout failed', err);
    } finally {
      localStorage.removeItem('session-active');
      setUser(null);
      setProfileMenuOpen(false);
      navigate('/Acceuil');
    }
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!profileMenuOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('[data-profile-menu]')) {
        setProfileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [profileMenuOpen]);

  useEffect(() => {
    if (!notificationsOpen) return;

    const handleNotificationOutsideClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('[data-notification-menu]')) {
        setNotificationsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleNotificationOutsideClick);
    return () => document.removeEventListener('mousedown', handleNotificationOutsideClick);
  }, [notificationsOpen]);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 border-b border-outline/60 backdrop-blur-xl transition duration-300 ${scrolled ? 'bg-white/90 py-2 shadow-sm sm:py-3' : 'bg-white/80 py-3 sm:py-4'}
        `}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-3 sm:px-6 lg:px-8">
        <Link to="/Acceuil" aria-label="EI&TIC - Laboratoire de Recherche" className="flex min-w-0 items-center">
          <img
            src="/eitic-logo.svg"
            alt="EI&TIC - Laboratoire de Recherche"
            className="h-12 w-auto object-contain sm:h-16 lg:h-20"
          />
        </Link>

        <button
          type="button"
          className="ml-auto rounded-full border border-outline/70 bg-white p-2 text-slate-700 lg:hidden"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          aria-label="Ouvrir le menu de navigation"
          aria-expanded={mobileMenuOpen}
        >
          <div className="flex flex-col gap-1.5">
            <span className="h-0.5 w-6 rounded-full bg-slate-700" />
            <span className="h-0.5 w-6 rounded-full bg-slate-700" />
            <span className="h-0.5 w-6 rounded-full bg-slate-700" />
          </div>
        </button>

        <nav className="hidden items-center gap-3 lg:flex">
          {navItems.map((item) => (
            <NavLink
              key={item.label}
              to={item.href}
              className={({ isActive }) =>
                `rounded-full px-4 py-2 text-sm font-medium transition ${isActive ? 'bg-primary/10 text-primary' : 'text-slate-500 hover:text-primary'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          {user ? (
            <div className="relative" data-profile-menu>
              <div className="flex items-center gap-2">
                <div className="relative" data-notification-menu>
                  <button
                    type="button"
                    onClick={() => setNotificationsOpen((prev) => !prev)}
                    className="relative rounded-full border border-amber-200 bg-amber-50 p-2.5 text-amber-600 shadow-sm hover:bg-amber-100 hover:text-amber-700"
                    aria-label="Notifications"
                  >
                    <Bell className="h-4 w-4 fill-amber-400" />
                    {notifications.some((notification) => !notification.readAt) && (
                      <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500" />
                    )}
                  </button>
                  {notificationsOpen && (
                    <div className="absolute right-0 mt-2 w-96 rounded-2xl border border-outline/80 bg-white p-3 shadow-lg">
                      <div className="mb-2 flex items-center justify-between">
                        <h3 className="font-semibold text-slate-800">Notifications</h3>
                        <span className="text-xs text-slate-500">{notifications.filter((notification) => !notification.readAt).length} non lues</span>
                      </div>
                      <div className="max-h-96 space-y-2 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <p className="p-3 text-sm text-slate-500">Aucune notification.</p>
                        ) : notifications.map((notification) => {
                          const isAccessRequest = notification.type === 'publication_access_request';
                          return (
                            <div key={notification._id} className={`rounded-xl border p-3 text-sm ${notification.readAt ? 'border-slate-200 bg-white' : 'border-blue-200 bg-blue-50/50'}`}>
                              <p className="text-slate-700">{notification.message}</p>
                              <div className="mt-2 flex flex-wrap gap-2">
                                {isAccessRequest && notification.accessRequest?.status === 'pending' && (
                                  <>
                                    <button type="button" onClick={() => void decideAccessRequest(notification, 'approved')} className="rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white">Autoriser</button>
                                    <button type="button" onClick={() => void decideAccessRequest(notification, 'rejected')} className="rounded-lg border border-red-200 px-2.5 py-1 text-xs font-semibold text-red-700">Refuser</button>
                                  </>
                                )}
                                {!notification.readAt && (
                                  <button type="button" onClick={() => void markNotificationRead(notification._id)} className="text-xs font-medium text-primary hover:underline">Marquer comme lue</button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setProfileMenuOpen((prev) => !prev)}
                  className="flex items-center gap-2 rounded-full border border-outline/70 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-on-primary">
                    {avatarLabel}
                  </div>
                  <span className="hidden xl:inline">{user?.name || user?.username || user?.email || 'Profil'}</span>
                </button>
              </div>

              {profileMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-2xl border border-outline/80 bg-white p-2 shadow-lg" data-profile-menu>
                  <button
                    type="button"
                    onClick={() => {
                      setProfileMenuOpen(false);
                      navigate('/Profile');
                    }}
                    className="flex w-full items-center rounded-2xl px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-surface-container"
                  >
                    Profil
                  </button>
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => {
                        setProfileMenuOpen(false);
                        navigate('/AdminDashboard');
                      }}
                      className="flex w-full items-center rounded-2xl px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-surface-container"
                    >
                      Tableau de bord administrateur
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="mt-1 flex w-full items-center rounded-2xl px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-surface-container"
                  >
                    Déconnexion
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link
                to="/SignIn"
                className="rounded-full border border-outline/70 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:border-slate-400"
              >
                Se connecter
              </Link>
              <Link
                to="/SignUp"
                className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-on-primary shadow-sm transition hover:bg-primary/90"
              >
                Créer un compte
              </Link>
            </>
          )}
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="border-t border-outline/70 bg-white/95 px-4 py-4 lg:hidden">
          <div className="flex flex-col gap-2">
            {navItems.map((item) => (
              <NavLink
                key={item.label}
                to={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `rounded-2xl px-4 py-3 text-sm font-medium transition ${isActive ? 'bg-primary/10 text-primary' : 'text-slate-600 hover:text-primary'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
            <div className="mt-2 flex flex-col gap-2">
              {user ? (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setNotificationsOpen((prev) => !prev)}
                      className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-amber-200 bg-amber-50 text-amber-600 shadow-sm"
                      aria-label="Notifications"
                    >
                      <Bell className="h-4 w-4 fill-amber-400" />
                      {notifications.some((notification) => !notification.readAt) && (
                        <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-red-500" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setProfileMenuOpen((prev) => !prev)}
                      className="flex flex-1 items-center gap-3 rounded-2xl border border-outline/70 bg-white px-4 py-3 text-left text-sm font-medium text-slate-700"
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-on-primary">
                        {avatarLabel}
                      </div>
                      <span>{user?.name || user?.username || user?.email || 'Profile'}</span>
                    </button>
                  </div>
                  {notificationsOpen && (
                    <div className="rounded-2xl border border-outline/70 bg-white p-3 shadow-sm" data-notification-menu>
                      <div className="mb-2 flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-slate-800">Notifications</h3>
                        <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500">
                          {notifications.filter((notification) => !notification.readAt).length} non lues
                        </span>
                      </div>
                      <div className="max-h-64 space-y-2 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <p className="p-2 text-xs text-slate-500">Aucune notification.</p>
                        ) : notifications.map((notification) => {
                          const isAccessRequest = notification.type === 'publication_access_request';
                          return (
                            <div key={notification._id} className={`rounded-xl border p-2.5 text-xs ${notification.readAt ? 'border-slate-200 bg-white' : 'border-blue-200 bg-blue-50/50'}`}>
                              <p className="text-slate-700">{notification.message}</p>
                              <div className="mt-2 flex flex-wrap gap-2">
                                {isAccessRequest && notification.accessRequest?.status === 'pending' && (
                                  <>
                                    <button type="button" onClick={() => void decideAccessRequest(notification, 'approved')} className="rounded-lg bg-emerald-600 px-2 py-1 text-[10px] font-semibold text-white">Autoriser</button>
                                    <button type="button" onClick={() => void decideAccessRequest(notification, 'rejected')} className="rounded-lg border border-red-200 px-2 py-1 text-[10px] font-semibold text-red-700">Refuser</button>
                                  </>
                                )}
                                {!notification.readAt && (
                                  <button type="button" onClick={() => void markNotificationRead(notification._id)} className="text-[10px] font-medium text-primary hover:underline">Marquer comme lue</button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {profileMenuOpen && (
                    <div className="flex flex-col gap-2 rounded-2xl border border-outline/70 bg-white p-3">
                      <button
                        type="button"
                        onClick={() => {
                          setProfileMenuOpen(false);
                          setMobileMenuOpen(false);
                          navigate('/Profile');
                        }}
                        className="text-left text-sm font-medium text-slate-700 hover:text-primary"
                      >
                        Profil
                      </button>
                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => {
                            setProfileMenuOpen(false);
                            setMobileMenuOpen(false);
                            navigate('/AdminDashboard');
                          }}
                          className="text-left text-sm font-medium text-slate-700 hover:text-primary"
                        >
                          Tableau de bord administrateur
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="text-left text-sm font-medium text-slate-700 hover:text-primary"
                      >
                        Déconnexion
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <Link
                    to="/SignIn"
                    onClick={() => setMobileMenuOpen(false)}
                    className="rounded-2xl border border-outline/70 bg-white px-4 py-3 text-left text-sm font-medium text-slate-700"
                  >
                    Se connecter
                  </Link>
                  <Link
                    to="/SignUp"
                    onClick={() => setMobileMenuOpen(false)}
                    className="rounded-2xl bg-primary px-4 py-3 text-left text-sm font-semibold text-on-primary"
                  >
                    Créer un compte
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
