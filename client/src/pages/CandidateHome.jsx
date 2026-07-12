import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { LogOut, Search, Settings, HelpCircle, Code, AlignLeft, Calendar, ArrowRight, Play, RefreshCw, Folder, Activity, Award, TrendingUp, Clock, Target, Sparkles, User } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart as RechartsBarChart, Bar, Cell, CartesianGrid } from 'recharts';
import Card from '../components/Card';
import Badge from '../components/Badge';
import Button from '../components/Button';
import ProgressBar from '../components/ProgressBar';
import { DashboardSkeleton } from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import { CommandPaletteTrigger } from '../components/CommandPalette';
import { getStoredUser } from '../utils/auth';
import ContributionCalendar from '../components/ContributionCalendar';

const CandidateHome = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('pending');
  const navigate = useNavigate();

  const user = getStoredUser();

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/tasks/candidate', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      setSubmissions(response.data);
    } catch (error) {
      toast.error('Failed to load candidate tasks.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    toast.success('Logged out successfully.');
    navigate('/');
  };

  // Filter tasks based on search
  const filteredSubmissions = submissions.filter((sub) => {
    const title = sub.task?.title || '';
    return title.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Derived arrays
  const pending = filteredSubmissions.filter((sub) => sub.status === 'not-started');
  const inProgress = filteredSubmissions.filter((sub) => sub.status === 'in-progress' || sub.status === 'issues-flagged');
  const completed = filteredSubmissions.filter((sub) => sub.status === 'under-review' || sub.status === 'completed');

  const completedSubs = submissions
    .filter(sub => sub.status === 'completed' || sub.status === 'under-review')
    .sort((a, b) => new Date(a.submittedAt) - new Date(b.submittedAt));

  const totalPoints = completedSubs.reduce((sum, sub) => {
    const score = sub.aiFeedbackHistory?.[sub.aiFeedbackHistory.length - 1]?.score || 80;
    return sum + score;
  }, 0);

  const avgAccuracy = completedSubs.length > 0 ? Math.round(totalPoints / completedSubs.length) : 0;

  const trendData = completedSubs.map((sub, idx) => {
    const score = sub.aiFeedbackHistory?.[sub.aiFeedbackHistory.length - 1]?.score || 80;
    return {
      name: `Task ${idx + 1}`,
      title: sub.task?.title || 'Task',
      score: score
    };
  });

  const codingSubs = completedSubs.filter(sub => sub.task?.type === 'coding');
  const writingSubs = completedSubs.filter(sub => sub.task?.type === 'writing');
  const avgCoding = codingSubs.length > 0
    ? Math.round(codingSubs.reduce((sum, sub) => sum + (sub.aiFeedbackHistory?.[sub.aiFeedbackHistory.length - 1]?.score || 80), 0) / codingSubs.length)
    : 0;
  const avgWriting = writingSubs.length > 0
    ? Math.round(writingSubs.reduce((sum, sub) => sum + (sub.aiFeedbackHistory?.[sub.aiFeedbackHistory.length - 1]?.score || 80), 0) / writingSubs.length)
    : 0;

  const categoryData = [
    { name: 'Coding Tasks', score: avgCoding, fill: '#8b5cf6' },
    { name: 'Writing Tasks', score: avgWriting, fill: '#3b82f6' }
  ];

  // Trigger task initialization
  const startTask = async (subId, token) => {
    try {
      const candidateName = user.name || user.email.split('@')[0];
      await axios.post(`/api/tasks/invite/${token}/start`, { candidateName });
      toast.success('Task started! Loading coding workspace.');
      navigate(`/candidate/workspace/${subId}`);
    } catch (err) {
      toast.error('Failed to start task.');
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      {/* Navbar header */}
      <header className="border-b border-zinc-800 bg-zinc-950/80 sticky top-0 z-30 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 select-none">
            <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center font-bold text-white">
              T
            </div>
            <span className="font-heading font-extrabold text-white text-base">
              Task<span className="text-purple-400">Pilot</span>
            </span>
          </div>

          <div className="flex items-center gap-4">
            <CommandPaletteTrigger />
            <button
              onClick={() => navigate('/candidate/profile')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-850 hover:border-zinc-700 bg-zinc-900/40 text-xs text-zinc-400 hover:text-zinc-200 transition-all cursor-pointer"
            >
              <User size={13} className="text-purple-400" />
              Profile
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-850 hover:border-zinc-700 bg-zinc-900/40 text-xs text-zinc-400 hover:text-zinc-200 transition-all cursor-pointer"
            >
              <LogOut size={13} />
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-10 space-y-10">
        
        {/* Top Header Greetings */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-heading font-extrabold text-zinc-100">
              Welcome back, {user.name || 'Developer'} 👋
            </h1>
            <p className="text-xs text-zinc-400 mt-1">
              Select an assessment card below to open your coding or writing workspace.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-3 text-zinc-500" size={14} />
              <input
                type="text"
                placeholder="Search assignments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 bg-zinc-900 border border-zinc-800 focus:border-purple-500 rounded-xl text-xs text-zinc-200 outline-none w-full sm:w-[220px]"
              />
            </div>
            <Button variant="secondary" size="sm" onClick={fetchTasks} className="h-8 py-0 px-3">
              <RefreshCw size={12} />
            </Button>
          </div>
        </div>

        {loading ? (
          <DashboardSkeleton />
        ) : (
          <>
            <div className="flex flex-col lg:flex-row gap-8">
            {/* Left Column: Sidebar Navigation & Analytics */}
            <aside className="w-full lg:w-[260px] shrink-0 space-y-6">
              
              {/* Task Navigation Filters */}
              <div className="bg-zinc-900/20 border border-zinc-850 p-4 rounded-2xl space-y-3">
                <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider px-2">Task Navigation</span>
                <div className="flex flex-col gap-1">
                  {[
                    { id: 'pending', label: 'Pending', count: pending.length },
                    { id: 'in-progress', label: 'In Progress', count: inProgress.length },
                    { id: 'completed', label: 'Completed', count: completed.length },
                    { id: 'analytics', label: 'Performance Analytics', count: null }
                  ].map(tab => {
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold w-full cursor-pointer transition-all ${
                          isActive
                            ? 'bg-purple-950/20 text-purple-300 border border-purple-900/30'
                            : 'text-zinc-400 hover:bg-zinc-900/40 hover:text-zinc-200 border border-transparent'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          {tab.id === 'analytics' && <Sparkles size={13} className="text-purple-400" />}
                          {tab.label}
                        </span>
                        {tab.count !== null && (
                          <span className={`px-1.5 py-0.5 rounded-md font-mono text-[9px] ${isActive ? 'bg-purple-900/45 text-purple-200' : 'bg-zinc-900 text-zinc-500'}`}>
                            {tab.count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Performance & Points Analysis Card */}
              <div className="bg-zinc-900/20 border border-zinc-850 p-5 rounded-2xl space-y-4">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Performance Rank</span>
                  <div className={`px-2.5 py-1.5 rounded-xl border text-xs font-extrabold text-center font-mono ${
                    (() => {
                      const completedSubs = submissions.filter(sub => sub.status === 'completed' || sub.status === 'under-review');
                      const totalPoints = completedSubs.reduce((sum, sub) => {
                        const score = sub.aiFeedbackHistory?.[sub.aiFeedbackHistory.length - 1]?.score || 80;
                        return sum + score;
                      }, 0);
                      const avgAccuracy = completedSubs.length > 0 ? Math.round(totalPoints / completedSubs.length) : 0;
                      if (avgAccuracy >= 90) return 'text-purple-400 bg-purple-950/20 border-purple-900/30';
                      if (avgAccuracy >= 75) return 'text-blue-400 bg-blue-950/20 border-blue-900/30';
                      if (avgAccuracy > 0) return 'text-orange-400 bg-orange-950/20 border-orange-900/30';
                      return 'text-zinc-400 bg-zinc-900 border-zinc-800';
                    })()
                  }`}>
                    {(() => {
                      const completedSubs = submissions.filter(sub => sub.status === 'completed' || sub.status === 'under-review');
                      const totalPoints = completedSubs.reduce((sum, sub) => {
                        const score = sub.aiFeedbackHistory?.[sub.aiFeedbackHistory.length - 1]?.score || 80;
                        return sum + score;
                      }, 0);
                      const avgAccuracy = completedSubs.length > 0 ? Math.round(totalPoints / completedSubs.length) : 0;
                      if (avgAccuracy >= 90) return 'Elite Pilot';
                      if (avgAccuracy >= 75) return 'Senior Pilot';
                      if (avgAccuracy > 0) return 'Junior Pilot';
                      return 'Novice Pilot';
                    })()}
                  </div>
                </div>

                <div className="border-t border-zinc-900 pt-4 space-y-3.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-zinc-500">Total Points:</span>
                    <span className="font-bold text-purple-400 font-mono">
                      {(() => {
                        const completedSubs = submissions.filter(sub => sub.status === 'completed' || sub.status === 'under-review');
                        return completedSubs.reduce((sum, sub) => {
                          const score = sub.aiFeedbackHistory?.[sub.aiFeedbackHistory.length - 1]?.score || 80;
                          return sum + score;
                        }, 0);
                      })()} pts
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-zinc-500">Avg Accuracy:</span>
                    <span className="font-bold text-zinc-200 font-mono">
                      {(() => {
                        const completedSubs = submissions.filter(sub => sub.status === 'completed' || sub.status === 'under-review');
                        const totalPoints = completedSubs.reduce((sum, sub) => {
                          const score = sub.aiFeedbackHistory?.[sub.aiFeedbackHistory.length - 1]?.score || 80;
                          return sum + score;
                        }, 0);
                        return completedSubs.length > 0 ? Math.round(totalPoints / completedSubs.length) : 0;
                      })()}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-zinc-500">Total Time:</span>
                    <span className="font-bold text-zinc-200 font-mono">
                      {(() => {
                        const totalTime = submissions.reduce((sum, sub) => sum + (sub.analytics?.timeTaken || 0), 0);
                        const hrs = Math.floor(totalTime / 3600);
                        const mins = Math.floor((totalTime % 3600) / 60);
                        if (hrs > 0) return `${hrs}h ${mins}m`;
                        return `${mins}m`;
                      })()}
                    </span>
                  </div>
                </div>
              </div>

            </aside>

            {/* Right Column: Filtered List Feed */}
            <div className="flex-1 space-y-6">
              
              {/* Conditional rendering based on activeTab */}
              {activeTab === 'pending' && pending.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
                    Pending Assignments ({pending.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {pending.map((sub) => (
                      <Card key={sub._id} className="flex flex-col justify-between h-[200px]">
                        <div className="space-y-3">
                          <div className="flex justify-between items-start">
                            <h4 className="text-sm font-bold text-zinc-100">{sub.task?.title}</h4>
                            <Badge status="not-started" />
                          </div>
                          <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">{sub.task?.description}</p>
                        </div>
                        <div className="flex items-center justify-between border-t border-zinc-900 pt-4 mt-auto">
                          <div className="flex items-center gap-1 text-[10px] text-zinc-500">
                            <Calendar size={12} />
                            <span>Due: {new Date(sub.task?.deadline).toLocaleDateString()}</span>
                          </div>
                          <Button
                            variant="primary"
                            size="sm"
                            className="h-8 py-0 px-4 text-xs group"
                            onClick={() => startTask(sub._id, sub.accessToken)}
                          >
                            Start Task
                            <ArrowRight size={12} className="ml-1 transition-transform group-hover:translate-x-1" />
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'in-progress' && inProgress.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-blue-400 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping" />
                    In Progress Tasks ({inProgress.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {inProgress.map((sub) => {
                      const latestFeedback = sub.aiFeedbackHistory?.[sub.aiFeedbackHistory.length - 1];
                      const score = latestFeedback ? latestFeedback.score : 0;
                      return (
                        <Card key={sub._id} className="flex flex-col justify-between h-[200px]">
                          <div className="space-y-3">
                            <div className="flex justify-between items-start">
                              <h4 className="text-sm font-bold text-zinc-100">{sub.task?.title}</h4>
                              <Badge status={sub.status} />
                            </div>
                            <ProgressBar progress={score} color={sub.status === 'issues-flagged' ? 'red' : 'blue'} showLabel={true} />
                          </div>
                          <div className="flex items-center justify-between border-t border-zinc-900 pt-4 mt-auto">
                            <span className="text-[10px] text-zinc-500 font-medium">
                              {sub.task?.type === 'coding' ? 'Monaco Coding Editor' : 'TipTap Writing Workspace'}
                            </span>
                            <Button
                              variant="glass"
                              size="sm"
                              className="h-8 py-0 px-4 text-xs"
                              onClick={() => navigate(`/candidate/workspace/${sub._id}`)}
                            >
                              Resume
                            </Button>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}

              {activeTab === 'completed' && completed.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-green-400 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                    Completed & Approved ({completed.length})
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {completed.map((sub) => {
                      const latestFeedback = sub.aiFeedbackHistory?.[sub.aiFeedbackHistory.length - 1];
                      const score = latestFeedback ? latestFeedback.score : 80;
                      return (
                        <Card key={sub._id} className="flex flex-col justify-between h-[200px]" hoverable={false}>
                          <div className="space-y-3">
                            <div className="flex justify-between items-start">
                              <h4 className="text-sm font-bold text-zinc-100">{sub.task?.title}</h4>
                              <Badge status={sub.status} />
                            </div>
                            <div className="flex items-center justify-between text-xs text-zinc-400">
                              <span>AI Accuracy Score:</span>
                              <span className="font-bold text-green-400 jetbrains-mono">{score}/100</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between border-t border-zinc-900 pt-4 mt-auto">
                            <span className="text-[10px] text-zinc-500">
                              Submitted: {sub.submittedAt ? new Date(sub.submittedAt).toLocaleDateString() : ''}
                            </span>
                            <Button
                              variant="secondary"
                              size="sm"
                              className="h-8 py-0 px-4 text-xs"
                              onClick={() => navigate(`/admin/review/${sub._id}`)}
                            >
                              View Report
                            </Button>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}

              {activeTab === 'analytics' && (
                <div className="space-y-8">
                  {/* Dashboard header */}
                  <div>
                    <h2 className="text-lg md:text-xl font-extrabold text-zinc-100 flex items-center gap-2">
                      <Activity size={18} className="text-purple-400" />
                      Interactive Performance Insights
                    </h2>
                    <p className="text-xs text-zinc-400 mt-1">
                      Deep-dive analysis of your assessment results, accuracy trends, and skills breakdown.
                    </p>
                  </div>

                  {/* 1. Score trend and Category Breakdown Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Score Trend Area Chart */}
                    <Card className="p-6 border border-zinc-850 bg-zinc-900/5" hoverable={false}>
                      <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-2">
                          <TrendingUp size={16} className="text-purple-400" />
                          <h3 className="text-sm font-bold text-zinc-200">AI Accuracy Score Trend</h3>
                        </div>
                        <span className="text-[9px] uppercase font-mono px-2 py-0.5 rounded bg-zinc-900 text-zinc-550 border border-zinc-850">Accuracy over time</span>
                      </div>
                      
                      <div className="h-56 w-full font-mono">
                        {trendData.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                              <defs>
                                <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#a855f7" stopOpacity={0.2}/>
                                  <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                                </linearGradient>
                              </defs>
                              <CartesianGrid stroke="#18181b" strokeDasharray="3 3" />
                              <XAxis dataKey="name" stroke="#52525b" fontSize={10} tickLine={false} />
                              <YAxis stroke="#52525b" fontSize={10} tickLine={false} domain={[0, 100]} />
                              <Tooltip 
                                contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '12px' }}
                                labelStyle={{ color: '#a1a1aa', fontWeight: 'bold', fontSize: '10px' }}
                                itemStyle={{ color: '#c084fc', fontSize: '11px' }}
                              />
                              <Area type="monotone" dataKey="score" stroke="#a855f7" strokeWidth={2} fillOpacity={1} fill="url(#colorScore)" />
                            </AreaChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="h-full flex flex-col items-center justify-center text-center text-zinc-500">
                            <span className="text-xs font-semibold">No performance data yet</span>
                            <span className="text-[10px] text-zinc-650 mt-1">Submit your first task to unlock trend tracking</span>
                          </div>
                        )}
                      </div>
                    </Card>

                    {/* Skill Category Bar Chart */}
                    <Card className="p-6 border border-zinc-850 bg-zinc-900/5" hoverable={false}>
                      <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-2">
                          <Target size={16} className="text-purple-400" />
                          <h3 className="text-sm font-bold text-zinc-200">Averages by Task Type</h3>
                        </div>
                        <span className="text-[9px] uppercase font-mono px-2 py-0.5 rounded bg-zinc-900 text-zinc-550 border border-zinc-850">Accuracy comparison</span>
                      </div>

                      <div className="h-56 w-full font-mono">
                        {completedSubs.length > 0 ? (
                          <ResponsiveContainer width="100%" height="100%">
                            <RechartsBarChart data={categoryData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                              <CartesianGrid stroke="#18181b" strokeDasharray="3 3" />
                              <XAxis dataKey="name" stroke="#52525b" fontSize={10} tickLine={false} />
                              <YAxis stroke="#52525b" fontSize={10} tickLine={false} domain={[0, 100]} />
                              <Tooltip 
                                contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '12px' }}
                                labelStyle={{ color: '#a1a1aa', fontWeight: 'bold', fontSize: '10px' }}
                                itemStyle={{ color: '#38bdf8', fontSize: '11px' }}
                              />
                              <Bar dataKey="score" radius={[8, 8, 0, 0]} maxBarSize={50}>
                                {categoryData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.fill} />
                                ))}
                              </Bar>
                            </RechartsBarChart>
                          </ResponsiveContainer>
                        ) : (
                          <div className="h-full flex flex-col items-center justify-center text-center text-zinc-500">
                            <span className="text-xs font-semibold">No performance data yet</span>
                            <span className="text-[10px] text-zinc-650 mt-1">Submit assignments to view comparison metrics</span>
                          </div>
                        )}
                      </div>
                    </Card>
                  </div>

                  {/* 2. Skills indicators breakdown */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                      { title: 'Instructions Alignment', icon: Target, val: avgAccuracy || 80, desc: 'Adherence to specs and evaluation guidelines.' },
                      { title: 'Syntax & Style', icon: Code, val: avgAccuracy ? Math.min(avgAccuracy + 5, 100) : 85, desc: 'Grammatical/structural error free score.' },
                      { title: 'Pacing / Efficiency', icon: Clock, val: avgAccuracy ? Math.min(avgAccuracy - 5, 95) : 75, desc: 'Task completion speed and time metrics.' }
                    ].map((skill, i) => (
                      <Card key={i} className="p-5 border border-zinc-850 bg-zinc-900/5 space-y-4" hoverable={false}>
                        <div className="flex justify-between items-start">
                          <div className="p-2.5 rounded-xl bg-purple-950/20 border border-purple-900/20 text-purple-400">
                            <skill.icon size={16} />
                          </div>
                          <span className="text-lg font-bold text-zinc-100 font-mono">{skill.val}%</span>
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-xs font-bold text-zinc-200">{skill.title}</h4>
                          <p className="text-[10px] text-zinc-500 leading-relaxed">{skill.desc}</p>
                        </div>
                        <div className="w-full bg-zinc-950 h-1.5 rounded-full overflow-hidden border border-zinc-900">
                          <div className="bg-purple-500 h-full rounded-full" style={{ width: `${skill.val}%` }} />
                        </div>
                      </Card>
                    ))}
                  </div>

                  {/* 3. Strengths & Recommendations Card */}
                  <Card className="p-6 border border-zinc-850 bg-zinc-900/10" hoverable={false}>
                    <h3 className="text-sm font-bold text-zinc-200 flex items-center gap-2 mb-4">
                      <Award size={16} className="text-purple-400" />
                      AI Development Insights & Guidance
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs leading-relaxed">
                      <div className="p-4 rounded-2xl bg-green-950/5 border border-green-950/20 space-y-2">
                        <span className="font-bold text-green-400 uppercase tracking-wider text-[9px] font-mono block">Primary Strength</span>
                        <p className="text-zinc-300 font-medium">
                          {avgAccuracy >= 85 
                            ? 'Excellent technical implementation and specifications alignment. You consistently translate complex task instructions into logical code stubs.' 
                            : 'Consistent task starts and draft structures. You successfully initialize code scaffolding and organize file contents efficiently.'}
                        </p>
                      </div>
                      <div className="p-4 rounded-2xl bg-purple-950/5 border border-purple-950/20 space-y-2">
                        <span className="font-bold text-purple-400 uppercase tracking-wider text-[9px] font-mono block">Next Growth Step</span>
                        <p className="text-zinc-300 font-medium">
                          Focus on refining syntax edge-cases and resolving compilation warnings inside your active editor environment prior to final drafts lock.
                        </p>
                      </div>
                    </div>
                  </Card>
                </div>
              )}

              {/* Fallback empty views */}
              {activeTab === 'pending' && pending.length === 0 && (
                <EmptyState title="No pending tasks" description="All assigned tasks are started or completed." />
              )}
              {activeTab === 'in-progress' && inProgress.length === 0 && (
                <EmptyState title="No tasks in progress" description="Open a pending assignment to start editing." />
              )}
              {activeTab === 'completed' && completed.length === 0 && (
                <EmptyState title="No completed tasks" description="Submit your workspace drafts to receive final feedback." />
              )}

            </div>
          </div>

          {/* Bottom: Task Contribution Calendar (Full Width) */}
          {activeTab !== 'analytics' && (
            <div className="pt-6 border-t border-zinc-900 mt-10 space-y-4">
              <span className="text-[10px] uppercase font-extrabold text-zinc-500 tracking-wider block px-1">Submission Contribution Activity</span>
              <ContributionCalendar />
            </div>
          )}
        </>
      )}
      </main>
    </div>
  );
};

export default CandidateHome;
