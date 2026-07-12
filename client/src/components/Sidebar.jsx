import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Folder, Eye, BarChart3, Users, Settings, LogOut, 
  Terminal, Sparkles, LayoutDashboard 
} from 'lucide-react';
import Avatar from './Avatar';
import toast from 'react-hot-toast';
import { getStoredUser } from '../utils/auth';
import { CommandPaletteTrigger } from './CommandPalette';

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const user = getStoredUser();
  const activePath = location.pathname;

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    toast.success('Logged out successfully.');
    navigate('/');
  };

  const navItems = [
    { name: 'Tasks', path: '/admin/dashboard', icon: Folder },
    { name: 'Live Monitor', path: '/admin/live', icon: Eye },
    { name: 'Analytics', path: '/admin/analytics', icon: BarChart3 },
    { name: 'Team', path: '/admin/team', icon: Users }
  ];

  return (
    <>
      {/* Desktop Sidebar Layout */}
      <aside className="hidden lg:flex w-[240px] bg-zinc-950 border-r border-zinc-900 flex-col h-screen shrink-0 select-none justify-between p-4">
        {/* Top Section: Logo & Search */}
        <div className="space-y-6">
          <div className="flex items-center gap-2.5 px-2 py-1.5 cursor-pointer" onClick={() => navigate('/admin/dashboard')}>
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-purple-500/20">
              T
            </div>
            <span className="font-heading font-extrabold text-white text-base tracking-tight">
              Task<span className="text-purple-400">Pilot</span>
            </span>
          </div>

          {/* Command Search Bar Trigger */}
          <div className="px-1">
            <CommandPaletteTrigger />
          </div>

          {/* Navigation Rail */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activePath === item.path || (item.path === '/admin/dashboard' && activePath.startsWith('/admin/review'));
              return (
                <button
                  key={item.name}
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    isActive
                      ? 'bg-purple-950/20 text-purple-300 border-purple-900/30 shadow-md'
                      : 'text-zinc-400 border-transparent hover:bg-zinc-900/50 hover:text-zinc-200'
                  }`}
                >
                  <Icon size={14} className={isActive ? 'text-purple-400' : 'text-zinc-500'} />
                  {item.name}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section: Account Panel */}
        <div className="border-t border-zinc-900 pt-4 space-y-3">
          <div 
            onClick={() => navigate('/admin/profile')}
            className={`flex items-center gap-3 p-2 rounded-xl border border-transparent cursor-pointer transition-all hover:bg-zinc-900/50 hover:border-zinc-850 ${
              activePath === '/admin/profile' ? 'bg-zinc-900/60 border-zinc-800' : ''
            }`}
          >
            <Avatar name={user.name} email={user.email} size="sm" />
            <div className="flex-1 min-w-0 select-text">
              <h4 className="text-xs font-bold text-zinc-200 truncate">{user.name || 'Admin'}</h4>
              <span className="text-[9px] text-zinc-500 truncate block font-mono select-all">{user.email}</span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider text-zinc-500 hover:text-red-400 hover:bg-red-950/10 transition-all cursor-pointer"
          >
            <span>Sign Out</span>
            <LogOut size={12} />
          </button>
        </div>
      </aside>

      {/* Mobile/Tablet Top Navbar Layout */}
      <header className="lg:hidden w-full h-14 bg-zinc-950 border-b border-zinc-900 flex items-center justify-between px-4 select-none shrink-0 z-45 sticky top-0">
        <div className="flex items-center gap-2" onClick={() => navigate('/admin/dashboard')}>
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center font-bold text-white text-xs">
            T
          </div>
          <span className="font-heading font-extrabold text-white text-xs tracking-tight">
            Task<span className="text-purple-400">Pilot</span>
          </span>
        </div>

        <nav className="flex items-center gap-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePath === item.path || (item.path === '/admin/dashboard' && activePath.startsWith('/admin/review'));
            return (
              <button
                key={item.name}
                onClick={() => navigate(item.path)}
                className={`p-2 rounded-xl transition-all cursor-pointer ${
                  isActive
                    ? 'bg-purple-950/20 text-purple-400'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
                title={item.name}
              >
                <Icon size={14} />
              </button>
            );
          })}
          
          <button
            onClick={handleLogout}
            className="p-2 rounded-xl text-zinc-500 hover:text-red-400 transition-all cursor-pointer"
            title="Sign Out"
          >
            <LogOut size={14} />
          </button>
        </nav>

        <div className="flex items-center gap-2.5">
          <CommandPaletteTrigger />
          <div 
            onClick={() => navigate('/admin/settings')}
            className={`w-7 h-7 rounded-full overflow-hidden border cursor-pointer ${
              activePath === '/admin/settings' ? 'border-purple-500' : 'border-zinc-800'
            }`}
          >
            <Avatar name={user.name} email={user.email} size="sm" />
          </div>
        </div>
      </header>
    </>
  );
};

export default Sidebar;
