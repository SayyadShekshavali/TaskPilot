import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as ChartTooltip, 
  ResponsiveContainer, PieChart, Pie, Cell, Legend, BarChart, Bar 
} from 'recharts';
import { 
  ArrowLeft, RefreshCw, BarChart3, TrendingUp, Sparkles, 
  CheckCircle2, AlertTriangle, Users, Trophy 
} from 'lucide-react';
import toast from 'react-hot-toast';
import Card from '../components/Card';
import Button from '../components/Button';
import ChartWrapper from '../components/ChartWrapper';
import { DashboardSkeleton } from '../components/Skeleton';
import Sidebar from '../components/Sidebar';

const ReportsAnalytics = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/analytics', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      setData(response.data);
    } catch (err) {
      toast.error('Failed to retrieve analytics reports.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col lg:flex-row font-sans">
        <Sidebar />
        <div className="flex-1 flex flex-col h-screen overflow-y-auto">
          <header className="h-14 border-b border-zinc-800 bg-zinc-950 flex items-center px-6 shrink-0 select-none">
            <span className="text-xs font-bold">System Analytics</span>
          </header>
          <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-10">
            <DashboardSkeleton />
          </main>
        </div>
      </div>
    );
  }

  const { counters, dailyStats, errorCategories, averageAiScore, candidateRanking, activityHeatmap } = data;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col lg:flex-row font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col h-screen overflow-y-auto">
        {/* Local page title header */}
        <header className="h-14 border-b border-zinc-800 bg-zinc-950 flex items-center justify-between px-6 select-none shrink-0 z-10">
          <div className="flex flex-col">
            <h1 className="text-xs font-bold text-zinc-100">Analytics & Insights</h1>
            <span className="text-[9px] text-zinc-500 font-mono">System-wide performance logs</span>
          </div>

          <Button variant="secondary" size="sm" onClick={fetchAnalytics} className="h-8 py-0 px-3 text-xs">
            <RefreshCw size={12} className="mr-1" />
            Refresh
          </Button>
        </header>

      {/* Analytics Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-10 space-y-8 overflow-y-auto">
        
        {/* KPI Counter Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card hoverable={false} className="p-5 flex flex-col justify-between h-[110px] border-l-4 border-l-purple-500">
            <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Avg AI Score</span>
            <div className="flex items-baseline gap-2 mt-2">
              <h2 className="text-2xl font-extrabold text-zinc-200 jetbrains-mono">{averageAiScore}%</h2>
              <span className="text-[10px] text-purple-400 font-bold flex items-center gap-0.5">
                <TrendingUp size={10} /> +1.2%
              </span>
            </div>
          </Card>

          <Card hoverable={false} className="p-5 flex flex-col justify-between h-[110px] border-l-4 border-l-blue-500">
            <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Assessments Run</span>
            <div className="flex items-baseline gap-2 mt-2">
              <h2 className="text-2xl font-extrabold text-zinc-200 jetbrains-mono">{counters.activeTasks}</h2>
              <span className="text-[10px] text-zinc-500">active campaigns</span>
            </div>
          </Card>

          <Card hoverable={false} className="p-5 flex flex-col justify-between h-[110px] border-l-4 border-l-red-500">
            <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Drifts Captured</span>
            <div className="flex items-baseline gap-2 mt-2">
              <h2 className="text-2xl font-extrabold text-red-400 jetbrains-mono">{counters.issuesFlagged}</h2>
              <span className="text-[10px] text-red-500/80">needs revision</span>
            </div>
          </Card>

          <Card hoverable={false} className="p-5 flex flex-col justify-between h-[110px] border-l-4 border-l-green-500">
            <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Approved Hires</span>
            <div className="flex items-baseline gap-2 mt-2">
              <h2 className="text-2xl font-extrabold text-green-400 jetbrains-mono">{counters.completed}</h2>
              <span className="text-[10px] text-green-500/80">approved</span>
            </div>
          </Card>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Main Area Chart - Volume (Col-span 2) */}
          <div className="md:col-span-2">
            <ChartWrapper
              title="Daily Assessment Volume"
              description="Chronological log of active campaigns vs completed submissions."
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyStats} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="date" stroke="#71717a" style={{ fontSize: 10 }} />
                  <YAxis stroke="#71717a" style={{ fontSize: 10 }} />
                  <ChartTooltip
                    contentStyle={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px' }}
                    labelStyle={{ color: '#a855f7', fontWeight: 'bold', fontSize: 10 }}
                    itemStyle={{ fontSize: 11 }}
                  />
                  <Area type="monotone" dataKey="active" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorActive)" />
                  <Area type="monotone" dataKey="completed" stroke="#22c55e" strokeWidth={2} fillOpacity={1} fill="url(#colorCompleted)" />
                </AreaChart>
              </ResponsiveContainer>
            </ChartWrapper>
          </div>

          {/* Pie Chart - Common Errors */}
          <div>
            <ChartWrapper
              title="Common Error Categories"
              description="Distributions of issues flagged by the AI engine."
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={errorCategories}
                    cx="50%"
                    cy="45%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {errorCategories.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip
                    contentStyle={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px' }}
                    itemStyle={{ fontSize: 11 }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    iconSize={8}
                    wrapperStyle={{ fontSize: 10, color: '#a1a1aa' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </ChartWrapper>
          </div>

        </div>

        {/* Lower Row Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Candidate Leaderboard */}
          <Card hoverable={false} className="p-6 flex flex-col justify-between h-[300px]">
            <div className="space-y-1 mb-4">
              <h4 className="text-sm font-bold text-zinc-100 flex items-center gap-1.5">
                <Trophy size={14} className="text-yellow-400" />
                Top Performers
              </h4>
              <p className="text-[10px] text-zinc-500">Candidates with the highest AI accuracy ratings.</p>
            </div>
            <div className="flex-1 space-y-3.5 overflow-y-auto pr-1">
              {candidateRanking.map((cand, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs border-b border-zinc-900 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-zinc-500 w-4">#{idx + 1}</span>
                    <div>
                      <h5 className="font-bold text-zinc-200 leading-normal">{cand.name}</h5>
                      <span className="text-[9px] text-zinc-500 font-mono leading-none">{cand.email}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-green-400 jetbrains-mono">{cand.score}%</span>
                    <span className="block text-[9px] text-zinc-500">{cand.timeSpent} mins</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Activity Heatmap Graph (Col-span 2) */}
          <div className="md:col-span-2">
            <ChartWrapper
              title="Workload / Activity Heatmap"
              description="Volume of autosaves and compiler executions by hour."
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={activityHeatmap} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                  <XAxis dataKey="hour" stroke="#71717a" style={{ fontSize: 10 }} />
                  <YAxis stroke="#71717a" style={{ fontSize: 10 }} />
                  <ChartTooltip
                    contentStyle={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px' }}
                    itemStyle={{ fontSize: 11 }}
                  />
                  <Bar dataKey="count" fill="#a855f7" radius={[6, 6, 0, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </ChartWrapper>
          </div>

        </div>

      </main>
      </div>
    </div>
  );
};

export default ReportsAnalytics;
