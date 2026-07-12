import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, User, Lock, Bell, Link2, 
  Sparkles, Save, ShieldAlert, Key, Server 
} from 'lucide-react';
import toast from 'react-hot-toast';
import Card from '../components/Card';
import Button from '../components/Button';
import Badge from '../components/Badge';
import { getStoredUser } from '../utils/auth';
import Sidebar from '../components/Sidebar';

const SettingsPage = () => {
  const navigate = useNavigate();
  const [activeSubTab, setActiveSubTab] = useState('profile'); // 'profile' | 'password' | 'notifications' | 'integrations'
  const [isSaving, setIsSaving] = useState(false);

  const currentUser = getStoredUser();
  const isAdmin = currentUser.role === 'admin';

  // State forms
  const [name, setName] = useState(currentUser.name || '');
  const [email, setEmail] = useState(currentUser.email || '');

  // Mock API integration keys
  const [geminiKey, setGeminiKey] = useState('••••••••••••••••••••••••••••••••');
  const [judgeKey, setJudgeKey] = useState('••••••••••••••••••••••••••••••••');
  const [smtpHost, setSmtpHost] = useState('sandbox.smtp.mailtrap.io');

  const handleSave = (e) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      toast.success('Preferences updated successfully!');
    }, 800);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col lg:flex-row">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen overflow-y-auto">
        {/* Local page title header */}
        <header className="h-14 border-b border-zinc-800 bg-zinc-950 flex items-center justify-between px-6 select-none shrink-0 z-10">
          <div className="flex flex-col">
            <h1 className="text-xs font-bold text-zinc-100">Settings Console</h1>
            <span className="text-[9px] text-zinc-500 font-mono">Manage credentials & integrations</span>
          </div>
          <Badge status={isAdmin ? 'approved' : 'not-started'} text={currentUser.role} />
        </header>

      {/* Main split dashboard panel */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-10 flex flex-col md:flex-row gap-8 overflow-y-auto">
        
        {/* Left Side: Navigation subtabs (width 220px) */}
        <aside className="w-full md:w-[220px] shrink-0 select-none space-y-1">
          <button
            onClick={() => setActiveSubTab('profile')}
            className={`w-full flex items-center gap-2.5 px-4 py-3 rounded-xl text-left text-xs font-semibold border transition-all cursor-pointer ${
              activeSubTab === 'profile' 
                ? 'bg-purple-950/20 text-purple-300 border-purple-900/30' 
                : 'text-zinc-400 hover:bg-zinc-900/50 hover:text-zinc-200 border-transparent'
            }`}
          >
            <User size={14} />
            Profile Settings
          </button>
          <button
            onClick={() => setActiveSubTab('password')}
            className={`w-full flex items-center gap-2.5 px-4 py-3 rounded-xl text-left text-xs font-semibold border transition-all cursor-pointer ${
              activeSubTab === 'password' 
                ? 'bg-purple-950/20 text-purple-300 border-purple-900/30' 
                : 'text-zinc-400 hover:bg-zinc-900/50 hover:text-zinc-200 border-transparent'
            }`}
          >
            <Lock size={14} />
            Password Security
          </button>
          <button
            onClick={() => setActiveSubTab('notifications')}
            className={`w-full flex items-center gap-2.5 px-4 py-3 rounded-xl text-left text-xs font-semibold border transition-all cursor-pointer ${
              activeSubTab === 'notifications' 
                ? 'bg-purple-950/20 text-purple-300 border-purple-900/30' 
                : 'text-zinc-400 hover:bg-zinc-900/50 hover:text-zinc-200 border-transparent'
            }`}
          >
            <Bell size={14} />
            Notification Toggles
          </button>

          {/* Admin integrations sub-tab */}
          {isAdmin && (
            <button
              onClick={() => setActiveSubTab('integrations')}
              className={`w-full flex items-center gap-2.5 px-4 py-3 rounded-xl text-left text-xs font-semibold border transition-all cursor-pointer ${
                activeSubTab === 'integrations' 
                  ? 'bg-purple-950/20 text-purple-300 border-purple-900/30' 
                  : 'text-zinc-400 hover:bg-zinc-900/50 hover:text-zinc-200 border-transparent'
              }`}
            >
              <Link2 size={14} />
              API & SMTP integrations
            </button>
          )}
        </aside>

        {/* Right Side: Form details Card */}
        <div className="flex-1 max-w-xl">
          <form onSubmit={handleSave}>
            
            {activeSubTab === 'profile' && (
              <Card className="space-y-5 p-8" hoverable={false}>
                <div>
                  <h3 className="text-sm font-bold text-zinc-100">General Profile</h3>
                  <p className="text-[10px] text-zinc-500 mt-0.5">Manage user identification metrics.</p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-400">Display Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 bg-zinc-950/60 border border-zinc-800 focus:border-purple-500 rounded-xl text-sm text-zinc-200 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-400">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    disabled
                    className="w-full px-4 py-3 bg-zinc-950/60 border border-zinc-850 rounded-xl text-sm text-zinc-500 outline-none cursor-not-allowed"
                  />
                </div>
                <Button type="submit" variant="primary" className="py-3 px-6 text-xs" loading={isSaving}>
                  <Save size={13} className="mr-1" />
                  Save Changes
                </Button>
              </Card>
            )}

            {activeSubTab === 'password' && (
              <Card className="space-y-5 p-8" hoverable={false}>
                <div>
                  <h3 className="text-sm font-bold text-zinc-100">Update Password</h3>
                  <p className="text-[10px] text-zinc-500 mt-0.5">Ensure your account uses a secure passphrase.</p>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-400">Current Password</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    className="w-full px-4 py-3 bg-zinc-950/60 border border-zinc-800 focus:border-purple-500 rounded-xl text-sm text-zinc-200 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-400">New Password</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    className="w-full px-4 py-3 bg-zinc-950/60 border border-zinc-800 focus:border-purple-500 rounded-xl text-sm text-zinc-200 outline-none"
                  />
                </div>
                <Button type="submit" variant="primary" className="py-3 px-6 text-xs" loading={isSaving}>
                  Update Security Password
                </Button>
              </Card>
            )}

            {activeSubTab === 'notifications' && (
              <Card className="space-y-5 p-8" hoverable={false}>
                <div>
                  <h3 className="text-sm font-bold text-zinc-100">Notification Channels</h3>
                  <p className="text-[10px] text-zinc-500 mt-0.5">Configure when you want to receive alert updates.</p>
                </div>
                <div className="space-y-3.5 pt-2">
                  <label className="flex items-center gap-3 cursor-pointer text-xs text-zinc-300">
                    <input type="checkbox" defaultChecked className="accent-purple-500 rounded border-zinc-850" />
                    <span>Email updates when candidates accept/start an invite link.</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer text-xs text-zinc-300">
                    <input type="checkbox" defaultChecked className="accent-purple-500 rounded border-zinc-850" />
                    <span>In-app alert flags when compiler failures or drifts exceed thresholds.</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer text-xs text-zinc-300">
                    <input type="checkbox" className="accent-purple-500 rounded border-zinc-850" />
                    <span>Daily summary digests of candidate completion statistics.</span>
                  </label>
                </div>
                <Button type="submit" variant="primary" className="py-3 px-6 text-xs mt-2" loading={isSaving}>
                  Update Toggles
                </Button>
              </Card>
            )}

            {/* Admin integrations subtab */}
            {activeSubTab === 'integrations' && isAdmin && (
              <Card className="space-y-6 p-8" hoverable={false}>
                <div>
                  <h3 className="text-sm font-bold text-zinc-100">API Configurations</h3>
                  <p className="text-[10px] text-zinc-500 mt-0.5">Configure engine keys and secure servers.</p>
                </div>

                <div className="space-y-4">
                  {/* Gemini Key */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5">
                      <Key size={12} className="text-purple-400" />
                      Gemini AI API Key
                    </label>
                    <input
                      type="password"
                      value={geminiKey}
                      onChange={(e) => setGeminiKey(e.target.value)}
                      className="w-full px-4 py-3 bg-zinc-950/60 border border-zinc-800 focus:border-purple-500 rounded-xl text-xs text-zinc-200 outline-none"
                    />
                  </div>

                  {/* Judge0 Key */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5">
                      <Server size={12} className="text-blue-400" />
                      Judge0 API Key
                    </label>
                    <input
                      type="password"
                      value={judgeKey}
                      onChange={(e) => setJudgeKey(e.target.value)}
                      className="w-full px-4 py-3 bg-zinc-950/60 border border-zinc-800 focus:border-purple-500 rounded-xl text-xs text-zinc-200 outline-none"
                    />
                  </div>

                  {/* SMTP Server */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5">
                      <User size={12} />
                      SMTP Relaying Host
                    </label>
                    <input
                      type="text"
                      value={smtpHost}
                      onChange={(e) => setSmtpHost(e.target.value)}
                      className="w-full px-4 py-3 bg-zinc-950/60 border border-zinc-800 focus:border-purple-500 rounded-xl text-xs text-zinc-200 outline-none"
                    />
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-red-500/10 bg-red-500/5 text-xs text-zinc-400 space-y-2">
                  <div className="flex items-center gap-2 text-red-400 font-semibold">
                    <ShieldAlert size={14} />
                    <span>Danger Zone</span>
                  </div>
                  <p className="leading-relaxed">These parameters direct AI review checks and code sandboxes. Aligns directly with parameters stored inside server side .env files.</p>
                </div>

                <Button type="submit" variant="primary" className="py-3 px-6 text-xs" loading={isSaving}>
                  <Save size={13} className="mr-1" />
                  Save Keys
                </Button>
              </Card>
            )}

          </form>
        </div>

      </main>
      </div>
    </div>
  );
};

export default SettingsPage;
