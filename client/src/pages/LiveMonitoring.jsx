import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import { 
  ArrowLeft, Search, Filter, RefreshCw, Eye, 
  Terminal, ShieldCheck, Play, HelpCircle, Activity, Sparkles 
} from 'lucide-react';
import Card from '../components/Card';
import Badge from '../components/Badge';
import Button from '../components/Button';
import Avatar from '../components/Avatar';
import { DashboardSkeleton } from '../components/Skeleton';
import EmptyState from '../components/EmptyState';
import Sidebar from '../components/Sidebar';

const LiveMonitoring = () => {
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterState, setFilterState] = useState('all'); // 'all' | 'working' | 'idle' | 'issues'
  const [searchQuery, setSearchQuery] = useState('');

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/tasks', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      
      // Flatten all submissions from tasks
      const flat = [];
      response.data.forEach((task) => {
        task.submissions.forEach((sub) => {
          flat.push({
            ...sub,
            task,
            activityState: 'idle' // Default state
          });
        });
      });
      
      setSubmissions(flat);
    } catch (err) {
      toast.error('Failed to load live roster.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();

    // Setup Socket.io listening for updates
    const apiBase = import.meta.env.VITE_API_URL || '';
    const socketHost = apiBase || (window.location.origin.includes('5173')
      ? 'http://localhost:5000'
      : window.location.origin);
    
    const socket = io(socketHost);

    socket.on('monitorUpdate', (data) => {
      setSubmissions((prev) => 
        prev.map((sub) => {
          if (sub._id === data.submissionId) {
            return {
              ...sub,
              status: data.status || sub.status,
              aiFeedbackHistory: data.issueCount !== undefined 
                ? [{ issueCount: data.issueCount, issues: [] }] 
                : sub.aiFeedbackHistory,
              analytics: {
                ...sub.analytics,
                timeTaken: data.timeTaken !== undefined ? data.timeTaken : sub.analytics.timeTaken
              }
            };
          }
          return sub;
        })
      );
    });

    socket.on('monitorActivityState', (data) => {
      setSubmissions((prev) => 
        prev.map((sub) => {
          if (sub._id === data.submissionId) {
            return {
              ...sub,
              activityState: data.activityState
            };
          }
          return sub;
        })
      );
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const formatTime = (sec) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins}m ${secs}s`;
  };

  // Filter & Search Logic
  const filtered = submissions.filter((sub) => {
    const emailMatches = sub.candidateEmail.toLowerCase().includes(searchQuery.toLowerCase());
    const nameMatches = (sub.candidateName || '').toLowerCase().includes(searchQuery.toLowerCase());
    const taskMatches = sub.task?.title.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSearch = emailMatches || nameMatches || taskMatches;

    if (filterState === 'all') return matchesSearch;
    if (filterState === 'working') return matchesSearch && sub.activityState === 'working';
    if (filterState === 'idle') return matchesSearch && sub.activityState === 'idle';
    if (filterState === 'issues') return matchesSearch && sub.status === 'issues-flagged';

    return matchesSearch;
  });

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col lg:flex-row">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen overflow-y-auto">
        {/* Local page title header */}
        <header className="h-14 border-b border-zinc-800 bg-zinc-950 flex items-center justify-between px-6 select-none shrink-0 z-10">
          <div className="flex flex-col">
            <h1 className="text-xs font-bold text-zinc-100">Live Candidate Monitoring</h1>
            <span className="text-[9px] text-zinc-500 font-mono">Observe active workspaces in real-time</span>
          </div>
          
          <Button variant="secondary" size="sm" onClick={fetchSubmissions} className="h-8 py-0 px-3 text-xs">
            <RefreshCw size={12} className="mr-1" />
            Refresh
          </Button>
        </header>

      {/* Workspace panel */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-10 space-y-6">
        
        {/* Controls Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-900/20 border border-zinc-900 p-4 rounded-[24px]">
          <div className="relative w-full md:w-[260px]">
            <Search className="absolute left-3 top-2.5 text-zinc-500" size={13} />
            <input
              type="text"
              placeholder="Search by candidate or task..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-4 py-1.5 bg-zinc-950 border border-zinc-850 focus:border-purple-500 rounded-xl text-xs text-zinc-200 outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <button
              onClick={() => setFilterState('all')}
              className={`px-3 py-1.5 rounded-xl border text-[11px] font-bold transition-all cursor-pointer ${
                filterState === 'all' 
                  ? 'bg-purple-950/20 border-purple-500/40 text-purple-300' 
                  : 'bg-zinc-950 border-zinc-850 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              All Submissions
            </button>
            <button
              onClick={() => setFilterState('working')}
              className={`px-3 py-1.5 rounded-xl border text-[11px] font-bold transition-all cursor-pointer ${
                filterState === 'working' 
                  ? 'bg-blue-950/20 border-blue-500/40 text-blue-300' 
                  : 'bg-zinc-950 border-zinc-850 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Active Typing
            </button>
            <button
              onClick={() => setFilterState('idle')}
              className={`px-3 py-1.5 rounded-xl border text-[11px] font-bold transition-all cursor-pointer ${
                filterState === 'idle' 
                  ? 'bg-zinc-800/40 border-zinc-800 text-zinc-400 hover:text-zinc-200' 
                  : 'bg-zinc-950 border-zinc-850 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Idle
            </button>
            <button
              onClick={() => setFilterState('issues')}
              className={`px-3 py-1.5 rounded-xl border text-[11px] font-bold transition-all cursor-pointer ${
                filterState === 'issues' 
                  ? 'bg-red-950/20 border-red-500/40 text-red-300' 
                  : 'bg-zinc-950 border-zinc-850 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Drifts / Issues Flagged
            </button>
          </div>
        </div>

        {loading ? (
          <DashboardSkeleton />
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {filtered.map((sub) => {
              const latestFeedback = sub.aiFeedbackHistory?.[sub.aiFeedbackHistory.length - 1];
              const issuesCount = latestFeedback ? latestFeedback.issueCount : 0;
              const isWorking = sub.activityState === 'working';
              const name = sub.candidateName || sub.candidateEmail.split('@')[0];

              return (
                <Card
                  key={sub._id}
                  className="flex flex-col justify-between h-[250px] relative overflow-hidden"
                  onClick={() => navigate(`/admin/live/${sub._id}`)} // drill-in single monitoring split view
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar name={name} email={sub.candidateEmail} size="sm" />
                        <div>
                          <h4 className="text-xs font-bold text-zinc-200">{name}</h4>
                          <span className="text-[9px] text-zinc-500 font-mono select-all">{sub.candidateEmail}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {isWorking ? (
                          <span className="flex items-center gap-1 text-[9px] text-blue-400 font-bold tracking-wider uppercase">
                            <Activity size={10} className="animate-spin" />
                            Typing
                          </span>
                        ) : (
                          <span className="text-[9px] text-zinc-500 font-bold uppercase">Idle</span>
                        )}
                        <span className={`w-1.5 h-1.5 rounded-full ${isWorking ? 'bg-blue-400 animate-pulse' : 'bg-zinc-650'}`} />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[9px] text-purple-400 font-bold uppercase tracking-wider">Active Task</span>
                      <h3 className="text-xs font-bold text-zinc-200 line-clamp-1">{sub.task?.title}</h3>
                    </div>
                  </div>

                  {/* Stats and issues summary */}
                  <div className="border-t border-zinc-900 pt-4 mt-auto space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-500 font-semibold">Flagged Drifts</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        issuesCount > 0 
                          ? 'bg-red-950/40 text-red-400 border border-red-800/30' 
                          : 'bg-zinc-900 text-zinc-500'
                      }`}>
                        {issuesCount} Issue(s)
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-zinc-500">
                      <span>Time elapsed: <strong className="text-zinc-400 jetbrains-mono">{formatTime(sub.analytics?.timeTaken || 0)}</strong></span>
                      <Badge status={sub.status} />
                    </div>
                  </div>

                  {/* Floating Action Button */}
                  <div className="absolute right-4 top-[85px] opacity-0 hover:opacity-100 transition-opacity">
                    <Button variant="glass" size="sm" className="h-7 py-0 px-2 rounded-lg text-[10px]">
                      Spectate &gt;
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <EmptyState title="No active candidates found" description="There are currently no candidates working or matching your query selection." />
        )}
      </main>
      </div>
    </div>
  );
};

export default LiveMonitoring;
