import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { ArrowLeft, User, Mail, FileText, Lock, Sparkles, Check, Loader2 } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import Sidebar from '../components/Sidebar';
import { getStoredUser } from '../utils/auth';

const AVAILABLE_SKILLS = [
  'JavaScript', 'Python', 'React', 'TypeScript', 'Node.js', 
  'CSS/Tailwind', 'HTML5', 'Java', 'SQL', 'Technical Writing'
];

const ProfilePage = () => {
  const navigate = useNavigate();
  const storedUser = getStoredUser();
  const isAdmin = storedUser?.role === 'admin';

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    bio: '',
    skills: [],
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('/api/auth/me', {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        const user = res.data.user;
        setFormData({
          name: user.name || '',
          email: user.email || '',
          bio: user.bio || '',
          skills: user.skills || [],
          password: '',
          confirmPassword: ''
        });
      } catch (err) {
        toast.error('Failed to load user profile.');
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const toggleSkill = (skill) => {
    setFormData(prev => {
      const skills = prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill];
      return { ...prev, skills };
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (formData.password && formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const payload = {
        name: formData.name,
        bio: formData.bio,
        skills: formData.skills
      };
      if (formData.password) {
        payload.password = formData.password;
      }

      const res = await axios.put('/api/auth/profile', payload, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

      // Update local storage
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      
      toast.success('Profile updated successfully!');
      
      setFormData(prev => ({
        ...prev,
        password: '',
        confirmPassword: ''
      }));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center py-20">
          <Loader2 className="animate-spin text-purple-500 mb-2" size={28} />
          <span className="text-sm text-zinc-500 font-medium">Fetching profile details...</span>
        </div>
      );
    }

    return (
      <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-10">
        
        {/* Header Section */}
        <div className="flex items-center gap-4">
          {!isAdmin && (
            <button
              onClick={() => navigate('/candidate/home')}
              className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-all cursor-pointer"
            >
              <ArrowLeft size={16} />
            </button>
          )}
          <div>
            <h1 className="text-xl md:text-2xl font-extrabold text-zinc-100 flex items-center gap-2">
              <User size={20} className="text-purple-400" />
              Account Settings & Profile
            </h1>
            <p className="text-xs text-zinc-400 mt-0.5">Customize your public developer persona and security settings.</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Left Column: Visual Profile Card */}
          <div className="space-y-6">
            <Card className="p-6 border border-zinc-850 bg-zinc-900/5 text-center flex flex-col items-center gap-4" hoverable={false}>
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center font-black text-2xl text-white shadow-xl shadow-purple-500/10">
                {formData.name ? formData.name.substring(0, 2).toUpperCase() : 'US'}
              </div>
              <div>
                <h3 className="text-sm font-bold text-zinc-200">{formData.name || 'Developer'}</h3>
                <span className="text-[10px] text-zinc-500 font-mono select-all block mt-0.5">{formData.email}</span>
              </div>
              <div className="px-3 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-purple-950/30 text-purple-400 border border-purple-900/30">
                {isAdmin ? 'Administrator' : 'Verified Candidate'}
              </div>
            </Card>

            <Card className="p-6 border border-zinc-850 bg-zinc-900/5 space-y-4" hoverable={false}>
              <h4 className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Profile Status</h4>
              <div className="space-y-3 text-xs leading-relaxed text-zinc-400">
                <p>Welcome to your personal candidate hub. Keeping your skills up to date helps evaluators understand your technical specialties.</p>
                <div className="flex items-center gap-2 text-[10px] text-green-400 font-bold bg-green-950/10 border border-green-900/20 p-2 rounded-xl">
                  <Check size={12} />
                  <span>Profile Syncing Active</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Right Columns: Edit Form */}
          <div className="md:col-span-2 space-y-6">
            <Card className="p-6 border border-zinc-850 bg-zinc-900/5 space-y-6" hoverable={false}>
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 border-b border-zinc-900 pb-2.5">Personal Details</h3>
              
              <div className="space-y-4">
                {/* Full Name */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider font-bold text-zinc-500">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 text-zinc-500" size={14} />
                    <input
                      type="text"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full pl-9 pr-4 py-2.5 bg-zinc-950 border border-zinc-850 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 rounded-xl text-xs text-zinc-200 outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Email (Read Only) */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider font-bold text-zinc-500">Email Address (Read Only)</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 text-zinc-650" size={14} />
                    <input
                      type="email"
                      disabled
                      value={formData.email}
                      className="w-full pl-9 pr-4 py-2.5 bg-zinc-950/40 border border-zinc-900 text-zinc-600 rounded-xl text-xs outline-none select-none"
                    />
                  </div>
                </div>

                {/* Developer Bio */}
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider font-bold text-zinc-500">Professional Bio</label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-3.5 text-zinc-500" size={14} />
                    <textarea
                      name="bio"
                      value={formData.bio}
                      onChange={handleInputChange}
                      placeholder="Write a short summary about your background, career focus, or interests..."
                      rows={3}
                      className="w-full pl-9 pr-4 py-2.5 bg-zinc-950 border border-zinc-850 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 rounded-xl text-xs text-zinc-200 outline-none transition-all resize-none leading-relaxed"
                    />
                  </div>
                </div>
              </div>
            </Card>

            {/* Skills & Technologies */}
            <Card className="p-6 border border-zinc-850 bg-zinc-900/5 space-y-6" hoverable={false}>
              <div className="flex justify-between items-center border-b border-zinc-900 pb-2.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Skills & Focus Areas</h3>
                <Sparkles size={14} className="text-purple-400" />
              </div>

              <div className="flex flex-wrap gap-2">
                {AVAILABLE_SKILLS.map((skill, index) => {
                  const selected = formData.skills.includes(skill);
                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={() => toggleSkill(skill)}
                      className={`px-3 py-1.5 rounded-xl text-[10px] font-bold border transition-all cursor-pointer ${
                        selected
                          ? 'bg-purple-950/20 text-purple-300 border-purple-800/40'
                          : 'bg-zinc-950 text-zinc-400 border-zinc-900 hover:text-zinc-200'
                      }`}
                    >
                      {skill}
                    </button>
                  );
                })}
              </div>
            </Card>

            {/* Change Password Card */}
            <Card className="p-6 border border-zinc-850 bg-zinc-900/5 space-y-6" hoverable={false}>
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 border-b border-zinc-900 pb-2.5">Update Password (Optional)</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider font-bold text-zinc-500">New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 text-zinc-500" size={14} />
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-4 py-2.5 bg-zinc-950 border border-zinc-850 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 rounded-xl text-xs text-zinc-200 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider font-bold text-zinc-500">Confirm New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 text-zinc-500" size={14} />
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-4 py-2.5 bg-zinc-950 border border-zinc-850 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 rounded-xl text-xs text-zinc-200 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>
            </Card>

            <div className="flex justify-end gap-3">
              {!isAdmin ? (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => navigate('/candidate/home')}
                  className="h-10 px-5 text-xs font-bold"
                >
                  Cancel
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => navigate('/admin/dashboard')}
                  className="h-10 px-5 text-xs font-bold"
                >
                  Back to Dashboard
                </Button>
              )}
              <Button
                type="submit"
                variant="primary"
                loading={saving}
                className="h-10 px-6 text-xs font-bold bg-purple-600 hover:bg-purple-750"
              >
                Save Profile Changes
              </Button>
            </div>

          </div>
        </form>

      </div>
    );
  };

  if (isAdmin) {
    return (
      <div className="flex h-screen bg-zinc-950 text-zinc-100 overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-y-auto p-8 scrollbar-thin">
          {renderContent()}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      {/* Header bar */}
      <header className="border-b border-zinc-800 bg-zinc-950/80 sticky top-0 z-30 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 select-none cursor-pointer" onClick={() => navigate('/candidate/home')}>
            <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center font-bold text-white">
              T
            </div>
            <span className="font-heading font-extrabold text-white text-base">
              Task<span className="text-purple-400">Pilot</span>
            </span>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate('/candidate/home')}
            className="h-8 py-0 px-3 text-xs"
          >
            Go Dashboard
          </Button>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-10">
        {renderContent()}
      </main>
    </div>
  );
};

export default ProfilePage;
