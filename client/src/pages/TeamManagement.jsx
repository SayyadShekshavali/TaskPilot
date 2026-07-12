import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  ArrowLeft, Search, Plus, UserPlus, Users, 
  ShieldCheck, RefreshCw, Mail, Calendar 
} from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import Avatar from '../components/Avatar';
import Dialog from '../components/Dialog';
import { DashboardSkeleton } from '../components/Skeleton';
import Sidebar from '../components/Sidebar';

const TeamManagement = () => {
  const navigate = useNavigate();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Invite states
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('admin');
  const [inviting, setInviting] = useState(false);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/team', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      setMembers(response.data);
    } catch (err) {
      toast.error('Failed to load team roster.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteName || !inviteEmail) return;

    setInviting(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/team/invite', {
        name: inviteName,
        email: inviteEmail,
        targetRole: inviteRole
      }, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

      toast.success(`Invite dispatched successfully to ${inviteEmail}!`);
      setShowInviteModal(false);
      setInviteName('');
      setInviteEmail('');
      fetchMembers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to dispatch invite.');
    } finally {
      setInviting(false);
    }
  };

  const filteredMembers = members.filter(m => 
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col lg:flex-row">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen overflow-y-auto">
        {/* Local page title header */}
        <header className="h-14 border-b border-zinc-800 bg-zinc-950 flex items-center justify-between px-6 select-none shrink-0 z-10">
          <div className="flex flex-col">
            <h1 className="text-xs font-bold text-zinc-100">Team Management</h1>
            <span className="text-[9px] text-zinc-500 font-mono">Manage administrators & permissions</span>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={fetchMembers} className="h-8 py-0 px-3">
              <RefreshCw size={12} />
            </Button>
            <Button variant="primary" size="sm" className="h-8 py-0 px-3 text-xs" onClick={() => setShowInviteModal(true)}>
              <Plus size={13} className="mr-1" />
              Invite Member
            </Button>
          </div>
        </header>

      {/* Main console content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-10 space-y-6 overflow-y-auto">
        
        {/* Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-900/20 border border-zinc-900 p-4 rounded-[24px]">
          <div className="relative w-full md:w-[260px]">
            <Search className="absolute left-3 top-2.5 text-zinc-500" size={13} />
            <input
              type="text"
              placeholder="Search by team member name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-4 py-1.5 bg-zinc-950 border border-zinc-850 focus:border-purple-500 rounded-xl text-xs text-zinc-200 outline-none"
            />
          </div>
          <div className="text-[10px] text-zinc-500 flex items-center gap-1">
            <Users size={12} className="text-purple-400" />
            <span>Roster includes all members with admin dashboard permissions.</span>
          </div>
        </div>

        {loading ? (
          <DashboardSkeleton />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {filteredMembers.map((member) => (
              <Card key={member._id} className="p-5 flex flex-col justify-between h-[180px]" hoverable={false}>
                <div className="flex items-center gap-3">
                  <Avatar name={member.name} email={member.email} size="sm" />
                  <div>
                    <h4 className="text-xs font-bold text-zinc-200">{member.name}</h4>
                    <span className="text-[9px] text-zinc-500 font-mono select-all">{member.email}</span>
                  </div>
                </div>

                <div className="border-t border-zinc-900 pt-4 mt-auto space-y-2 text-[10px] text-zinc-500">
                  <div className="flex justify-between items-center">
                    <span>Role:</span>
                    <span className="flex items-center gap-1 text-purple-400 font-bold uppercase tracking-wider text-[9px]">
                      <ShieldCheck size={10} />
                      {member.role || 'Admin'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Joined:</span>
                    <span className="font-mono text-zinc-400">{new Date(member.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

      </main>

      {/* Invite Member dialog modal */}
      <Dialog isOpen={showInviteModal} onClose={() => setShowInviteModal(false)} title="Invite Team Member">
        <form onSubmit={handleInvite} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-400">Full Name</label>
            <input
              type="text"
              placeholder="Jane Doe"
              value={inviteName}
              onChange={(e) => setInviteName(e.target.value)}
              required
              className="w-full px-4 py-3 bg-zinc-950/60 border border-zinc-800 focus:border-purple-500 rounded-xl text-sm text-zinc-200 outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-400">Email Address</label>
            <input
              type="email"
              placeholder="jane@company.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              required
              className="w-full px-4 py-3 bg-zinc-950/60 border border-zinc-800 focus:border-purple-500 rounded-xl text-sm text-zinc-200 outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-zinc-400">Permission Level</label>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
              className="w-full px-4 py-3 bg-zinc-950/60 border border-zinc-800 rounded-xl text-xs text-zinc-300 outline-none cursor-pointer"
            >
              <option value="admin">Admin / Team Lead (Full Read & Write)</option>
              <option value="interviewer">Interviewer (Read Only Mirroring)</option>
            </select>
          </div>

          <Button type="submit" variant="primary" className="w-full py-3.5 mt-2 text-xs" loading={inviting}>
            Send Roster Invitation
            <UserPlus size={14} className="ml-1.5" />
          </Button>
        </form>
      </Dialog>
      </div>
    </div>
  );
};

export default TeamManagement;
