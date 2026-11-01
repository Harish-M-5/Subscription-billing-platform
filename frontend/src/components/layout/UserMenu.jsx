import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { UserCog, LogOut, Building2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function UserMenu() {
  const { user, business, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const profilePath = user?.role === 'customer' ? '/portal/profile' : '/app/profile';

  const goToProfile = () => {
    setOpen(false);
    navigate(profilePath);
  };

  const handleLogout = () => {
    setOpen(false);
    logout();
    navigate('/');
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 pl-2 rounded-xl transition hover:bg-slate-100 dark:hover:bg-slate-800 py-1 pr-2"
      >
        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-brand-400 to-accent-500 flex items-center justify-center text-white text-sm font-bold overflow-hidden shrink-0">
          {user?.profilePhotoUrl ? (
            <img src={user.profilePhotoUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            user?.fullName?.charAt(0).toUpperCase()
          )}
        </div>
        <div className="hidden sm:block text-left">
          <p className="text-sm font-semibold leading-tight">{user?.fullName}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 capitalize leading-tight">{user?.role}</p>
        </div>
      </button>

      <AnimatePresence>
      {open && (
        <motion.div
          className="absolute right-0 mt-2 w-64 card p-2 z-50 origin-top-right"
          initial={{ opacity: 0, scale: 0.95, y: -6 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -6 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        >
          <div className="flex items-center gap-3 p-3 border-b border-slate-100 dark:border-slate-800">
            <div className="h-11 w-11 rounded-full bg-gradient-to-br from-brand-400 to-accent-500 flex items-center justify-center text-white font-bold overflow-hidden shrink-0">
              {user?.profilePhotoUrl ? (
                <img src={user.profilePhotoUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                user?.fullName?.charAt(0).toUpperCase()
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">{user?.fullName}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
              <p className="text-xs text-brand-600 dark:text-brand-400 capitalize font-medium">{user?.role}</p>
            </div>
          </div>

          {business && (
            <div className="flex items-center gap-2 px-3 py-2.5 text-xs text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
              <Building2 size={14} className="shrink-0" />
              <span className="truncate">{business.name} · {business.type}</span>
            </div>
          )}

          <button
            onClick={goToProfile}
            className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2.5 mt-1 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <UserCog size={16} /> View My Profile
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950 transition"
          >
            <LogOut size={16} /> Log out
          </button>
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
}
