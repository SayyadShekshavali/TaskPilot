import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  Plus, Search, SlidersHorizontal, RefreshCw, LogOut, 
  Terminal, ShieldCheck, Play, HelpCircle, Eye, Calendar, Sparkles, Folder 
} from 'lucide-react';
import Card from '../components/Card';
import Badge from '../components/Badge';
import Button from '../components/Button';
import AvatarStack from '../components/AvatarStack';
import ProgressBar from '../components/ProgressBar';
import { DashboardSkeleton } from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import { CommandPaletteTrigger } from '../components/CommandPalette';
import { getStoredUser } from '../utils/auth';
import Sidebar from '../components/Sidebar';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState({ activeTasks: 0, peopleWorking: 0, issuesFlagged: 0, completed: 0 });
  const [loading, setLoading] = useState(true);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  
  const user = getStoredUser();

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      // 1. Fetch tasks list
      const tasksRes = await axios.get('/api/tasks', { headers });
      setTasks(tasksRes.data);

      // 2. Fetch analytics counters
      const statsRes = await axios.get('/api/analytics', { headers });
      setStats(statsRes.data.counters);
    } catch (error) {
      toast.error('Failed to load dashboard data.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    toast.success('Logged out successfully.');
    navigate('/');
  };

  // Filter Logic
  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          task.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Check if any submission matches the status filter
    const matchesStatus = statusFilter === 'all' || 
      task.submissions.some(sub => sub.status === statusFilter) ||
      (statusFilter === 'not-started' && task.submissions.length === 0);

    const matchesType = typeFilter === 'all' || task.type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col lg:flex-row">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen overflow-y-auto">

      {/* Workspace Panel */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-10 space-y-8">
        
        {/* Greetings Section */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-heading font-extrabold text-zinc-100">
              Good morning, {user.name || 'Admin'} 👋
            </h1>
            <p className="text-xs text-zinc-400 mt-1">
              Here is an overview of your active tasks and candidate submissions.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={fetchData} className="h-10 py-0 px-3">
              <RefreshCw size={13} />
            </Button>
            <Button variant="primary" size="sm" className="h-10 text-xs" onClick={() => navigate('/admin/create-task')}>
              <Plus size={14} className="mr-1" />
              Create Task
            </Button>
          </div>
        </div>

        {loading ? (
          <DashboardSkeleton />
        ) : (
          <>
            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card hoverable={false} className="flex items-center justify-between border-l-4 border-l-purple-500 py-5">
                <div>
                  <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Active Tasks</span>
                  <h2 className="text-2xl font-extrabold mt-1 text-zinc-200 jetbrains-mono">{stats.activeTasks}</h2>
                </div>
                <div className="p-3 bg-purple-950/20 border border-purple-900/30 rounded-2xl text-purple-400">
                  <Folder size={18} />
                </div>
              </Card>

              <Card hoverable={false} className="flex items-center justify-between border-l-4 border-l-blue-500 py-5">
                <div>
                  <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">People Working</span>
                  <div className="flex items-center gap-2 mt-1">
                    <h2 className="text-2xl font-extrabold text-blue-400 jetbrains-mono">{stats.peopleWorking}</h2>
                    <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
                  </div>
                </div>
                <div className="p-3 bg-blue-950/20 border border-blue-900/30 rounded-2xl text-blue-400">
                  <Eye size={18} />
                </div>
              </Card>

              <Card hoverable={false} className="flex items-center justify-between border-l-4 border-l-red-500 py-5">
                <div>
                  <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Issues Flagged</span>
                  <h2 className="text-2xl font-extrabold mt-1 text-red-400 jetbrains-mono">{stats.issuesFlagged}</h2>
                </div>
                <div className="p-3 bg-red-950/20 border border-red-900/30 rounded-2xl text-red-400">
                  <Terminal size={18} />
                </div>
              </Card>

              <Card hoverable={false} className="flex items-center justify-between border-l-4 border-l-green-500 py-5">
                <div>
                  <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Completed</span>
                  <h2 className="text-2xl font-extrabold mt-1 text-green-400 jetbrains-mono">{stats.completed}</h2>
                </div>
                <div className="p-3 bg-green-950/20 border border-green-900/30 rounded-2xl text-green-400">
                  <ShieldCheck size={18} />
                </div>
              </Card>
            </div>

            {/* Filter Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-900/20 border border-zinc-900 p-4 rounded-[24px]">
              <div className="flex items-center gap-3">
                <SlidersHorizontal size={14} className="text-zinc-500" />
                <span className="text-xs font-semibold text-zinc-400">Filters</span>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 text-zinc-500" size={13} />
                  <input
                    type="text"
                    placeholder="Search by title..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 pr-4 py-1.5 bg-zinc-950 border border-zinc-800 focus:border-purple-500 rounded-xl text-xs text-zinc-200 outline-none w-[180px]"
                  />
                </div>

                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-300 outline-none cursor-pointer"
                >
                  <option value="all">All Statuses</option>
                  <option value="not-started">Not Started</option>
                  <option value="in-progress">In Progress</option>
                  <option value="issues-flagged">Issues Flagged</option>
                  <option value="under-review">Under Review</option>
                  <option value="completed">Completed</option>
                </select>

                {/* Type Filter */}
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-300 outline-none cursor-pointer"
                >
                  <option value="all">All Types</option>
                  <option value="coding">Coding</option>
                  <option value="writing">Writing</option>
                </select>
              </div>
            </div>

            {/* Task Card Grid */}
            {filteredTasks.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {filteredTasks.map((task) => {
                  const avatarList = task.submissions.map(sub => ({
                    email: sub.candidateEmail,
                    name: sub.candidateName || sub.candidateEmail.split('@')[0]
                  }));

                  // Compute average score of submissions
                  let totalScore = 0;
                  let scoredCount = 0;
                  task.submissions.forEach(sub => {
                    const latest = sub.aiFeedbackHistory?.[sub.aiFeedbackHistory.length - 1];
                    if (latest) {
                      totalScore += latest.score;
                      scoredCount++;
                    }
                  });
                  const avgScore = scoredCount > 0 ? Math.round(totalScore / scoredCount) : 0;

                  return (
                    <Card
                      key={task._id}
                      className="flex flex-col justify-between h-[280px]"
                      onClick={() => navigate(`/admin/live`)} // redirects to candidate monitoring / reviewer
                    >
                      <div className="space-y-4">
                        <div className="flex justify-between items-start">
                          <span className="text-[10px] text-purple-400 font-bold uppercase tracking-wider flex items-center gap-1">
                            <Sparkles size={11} />
                            {task.type}
                          </span>
                          <span className="text-[10px] text-zinc-500 font-mono flex items-center gap-1">
                            <Calendar size={10} />
                            {new Date(task.deadline).toLocaleDateString()}
                          </span>
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-zinc-100 group-hover:text-purple-400 transition-colors line-clamp-1">{task.title}</h4>
                          <p className="text-xs text-zinc-400 leading-relaxed line-clamp-2 mt-1">{task.description}</p>
                        </div>
                      </div>

                      {/* Middle: assignee stack & progress */}
                      <div className="space-y-3 py-2 border-t border-zinc-900 pt-4 mt-auto">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-zinc-500 font-bold">Candidates</span>
                          <AvatarStack users={avatarList} size="sm" max={3} />
                        </div>
                        <ProgressBar progress={avgScore} color="purple" showLabel={true} />
                      </div>

                      {/* Footer Actions */}
                      <div className="flex items-center justify-between border-t border-zinc-900 pt-3 mt-auto text-[10px] text-zinc-500">
                        <span>{task.submissions.length} Assigned Invite(s)</span>
                        <span className="font-bold text-zinc-400 hover:text-purple-400 transition-colors flex items-center gap-0.5 cursor-pointer" onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/admin/live`);
                        }}>
                          Monitor Live &gt;
                        </span>
                      </div>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <EmptyState title="No tasks found matching query" description="Alter filters or click '+ Create Task' to spin up a new candidate assessment." />
            )}
          </>
        )}
      </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
