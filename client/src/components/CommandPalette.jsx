import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Terminal, LayoutDashboard, Settings, User, Eye, PlusCircle, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getStoredUser } from '../utils/auth';

const CommandPalette = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const inputRef = useRef(null);

  // Toggle Command Palette on Cmd+K or Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  const items = [
    { title: 'Admin Dashboard', icon: LayoutDashboard, category: 'Navigation', shortcut: 'G D', action: () => navigate('/admin/dashboard'), role: 'admin' },
    { title: 'Create Task Wizard', icon: PlusCircle, category: 'Actions', shortcut: 'C T', action: () => navigate('/admin/create-task'), role: 'admin' },
    { title: 'Live Candidate Monitor', icon: Eye, category: 'Navigation', shortcut: 'G M', action: () => navigate('/admin/live'), role: 'admin' },
    { title: 'Team Management', icon: Users, category: 'Admin Only', shortcut: 'G T', action: () => navigate('/admin/team'), role: 'admin' },
    { title: 'System Analytics & Reports', icon: Terminal, category: 'Admin Only', shortcut: 'G A', action: () => navigate('/admin/analytics'), role: 'admin' },
    { title: 'Candidate Home Portal', icon: User, category: 'Navigation', shortcut: 'G H', action: () => navigate('/candidate/home'), role: 'candidate' },
    { title: 'Settings Console', icon: Settings, category: 'Preferences', shortcut: 'G S', action: () => navigate('/admin/settings') }
  ];

  // Resolve user role
  const user = getStoredUser();
  const role = user.role || 'candidate';

  const filteredItems = items
    .filter(item => !item.role || item.role === role)
    .filter(item => item.title.toLowerCase().includes(query.toLowerCase()));

  const handleSelect = (item) => {
    item.action();
    setIsOpen(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -10 }}
            transition={{ duration: 0.15 }}
            className="relative z-10 w-full max-w-xl glass-panel rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-zinc-950"
          >
            {/* Search Input Bar */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-800">
              <Search className="text-zinc-500" size={18} />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search commands, pages, and logs... (Esc to close)"
                className="flex-1 bg-transparent border-none text-zinc-100 placeholder-zinc-500 text-sm outline-none"
              />
              <span className="text-[10px] text-zinc-500 border border-zinc-800 px-1.5 py-0.5 rounded font-mono select-none">
                ESC
              </span>
            </div>

            {/* Results Grid */}
            <div className="max-h-[320px] overflow-y-auto p-2 space-y-1">
              {filteredItems.length > 0 ? (
                filteredItems.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={index}
                      onClick={() => handleSelect(item)}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left hover:bg-zinc-800/60 text-zinc-300 hover:text-zinc-100 transition-all select-none cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <Icon size={16} className="text-purple-400" />
                        <div>
                          <span className="text-sm font-medium">{item.title}</span>
                          <span className="text-[10px] text-zinc-500 ml-2 font-mono">{item.category}</span>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono text-zinc-600 tracking-wider">
                        {item.shortcut}
                      </span>
                    </button>
                  );
                })
              ) : (
                <div className="text-center text-zinc-500 text-xs py-8">
                  No matching shortcuts found.
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CommandPalette;
export const CommandPaletteTrigger = () => (
  <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-500 cursor-pointer select-none" onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }))}>
    <span>Command Search</span>
    <span className="font-mono text-[10px] border border-zinc-800 px-1 rounded bg-zinc-950">⌘K</span>
  </div>
);
