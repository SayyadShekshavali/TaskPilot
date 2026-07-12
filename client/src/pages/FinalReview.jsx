import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip as ChartTooltip, ResponsiveContainer 
} from 'recharts';
import { 
  ArrowLeft, Calendar, Clock, Terminal, ShieldCheck, 
  BrainCircuit, CheckCircle2, AlertTriangle, FileCode, BarChart3, History 
} from 'lucide-react';
import toast from 'react-hot-toast';
import Card from '../components/Card';
import Badge from '../components/Badge';
import ProgressRing from '../components/ProgressRing';
import Button from '../components/Button';
import Timeline from '../components/Timeline';
import ChartWrapper from '../components/ChartWrapper';
import { getStoredUser } from '../utils/auth';

const FinalReview = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'submission' | 'history' | 'tests'
  const [submission, setSubmission] = useState(null);
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeFile, setActiveFile] = useState('');

  const currentUser = getStoredUser();
  const isAdmin = currentUser.role === 'admin';

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/tasks/submissions/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      setSubmission(response.data);
      setTask(response.data.task);
      setWorkspaceState(response.data.workspaceState || {});
      setActiveFile(response.data.workspaceState?.activeFile || Object.keys(response.data.workspaceState?.files || {})[0] || 'index.js');
    } catch (err) {
      toast.error('Failed to load review workspace.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const [workspaceState, setWorkspaceState] = useState({});

  const handleDecision = async (decision) => {
    const confirmMsg = decision === 'approved' 
      ? 'Are you sure you want to approve this submission?' 
      : 'Request revisions and send back workspace?';
    if (!window.confirm(confirmMsg)) return;

    try {
      const token = localStorage.getItem('token');
      await axios.post(`/api/tasks/submissions/${id}/review`, 
        { decision }, 
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      toast.success(`Submission ${decision === 'approved' ? 'approved' : 'marked for revision'} successfully!`);
      fetchData();
    } catch (err) {
      toast.error('Failed to register review decision.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-400">
        <svg className="animate-spin h-6 w-6 text-purple-500 mb-2" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <span>Compiling final review dossier...</span>
      </div>
    );
  }

  // Compile line chart data for Issue Trend
  const trendData = (submission?.analytics?.issueTrend || []).map((t, idx) => ({
    time: `Rev ${idx + 1}`,
    issues: t.count
  }));

  // Compile timeline events
  const timelineItems = [
    { title: 'Task Invited', description: `Invite dispatched to ${submission?.candidateEmail}`, timestamp: submission?.createdAt, status: 'started' },
    { title: 'Workspace Started', description: `Candidate began working.`, timestamp: submission?.startedAt, status: 'in-progress' }
  ];

  if (submission?.submittedAt) {
    timelineItems.push({ title: 'Workspace Submitted', description: 'Lock saved and compiled.', timestamp: submission.submittedAt, status: 'completed' });
  }

  if (submission?.reviewedAt) {
    timelineItems.push({ 
      title: submission.adminDecision === 'approved' ? 'Submission Approved' : 'Revision Requested', 
      description: `Team Lead final decision registered.`, 
      timestamp: submission.reviewedAt, 
      status: submission.adminDecision === 'approved' ? 'approved' : 'issues-flagged' 
    });
  }

  const latestFeedback = submission?.aiFeedbackHistory?.[submission.aiFeedbackHistory.length - 1] || {};
  const currentIssues = latestFeedback.issues || [];
  const score = latestFeedback.score || 0;

  const formatTime = (sec) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans">
      {/* 1. Header Navbar */}
      <header className="border-b border-zinc-800 bg-zinc-950/80 sticky top-0 z-30 backdrop-blur-md shrink-0 select-none">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(isAdmin ? '/admin/dashboard' : '/candidate/home')}
              className="p-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 cursor-pointer"
            >
              <ArrowLeft size={14} />
            </button>
            <div className="flex flex-col">
              <h1 className="text-xs font-bold text-zinc-100">{task?.title}</h1>
              <span className="text-[9px] text-zinc-500 font-mono">Dossier: {submission?.candidateEmail}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Badge status={submission?.status} />
            {isAdmin && submission?.status === 'under-review' && (
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  className="h-8 py-0 px-3 text-xs border border-orange-500/20 text-orange-400 bg-orange-950/5 hover:bg-orange-950/15"
                  onClick={() => handleDecision('needs-revision')}
                >
                  Needs Revision
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  className="h-8 py-0 px-3 text-xs bg-green-600 hover:bg-green-500 border border-green-500/30 text-white"
                  onClick={() => handleDecision('approved')}
                >
                  Approve
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 2. Page Navigation Tabs */}
      <div className="border-b border-zinc-900 bg-zinc-950 shrink-0 select-none">
        <div className="max-w-7xl mx-auto px-6 flex gap-6 text-xs text-zinc-500 font-semibold h-11 items-end">
          <button 
            onClick={() => setActiveTab('overview')} 
            className={`pb-3 border-b-2 cursor-pointer transition-all ${activeTab === 'overview' ? 'border-purple-500 text-purple-400' : 'border-transparent hover:text-zinc-300'}`}
          >
            Overview
          </button>
          <button 
            onClick={() => setActiveTab('submission')} 
            className={`pb-3 border-b-2 cursor-pointer transition-all ${activeTab === 'submission' ? 'border-purple-500 text-purple-400' : 'border-transparent hover:text-zinc-300'}`}
          >
            Submission Contents
          </button>
          <button 
            onClick={() => setActiveTab('history')} 
            className={`pb-3 border-b-2 cursor-pointer transition-all ${activeTab === 'history' ? 'border-purple-500 text-purple-400' : 'border-transparent hover:text-zinc-300'}`}
          >
            AI Review History
          </button>
          {task?.type === 'coding' && (
            <button 
              onClick={() => setActiveTab('tests')} 
              className={`pb-3 border-b-2 cursor-pointer transition-all ${activeTab === 'tests' ? 'border-purple-500 text-purple-400' : 'border-transparent hover:text-zinc-300'}`}
            >
              Test Outputs
            </button>
          )}
        </div>
      </div>

      {/* 3. Tab Contents Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 overflow-y-auto">
        
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Left Col (2/3 width) */}
            <div className="md:col-span-2 space-y-6">
              <Card hoverable={false} className="space-y-4">
                <h3 className="text-sm font-bold text-zinc-200">Task Brief</h3>
                <p className="text-xs text-zinc-400 leading-relaxed whitespace-pre-wrap">{task?.description}</p>
              </Card>

              {task?.evaluationRules && (
                <Card hoverable={false} className="space-y-3 border-l-4 border-l-purple-500">
                  <h4 className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                    <BrainCircuit size={14} className="text-purple-400" />
                    Evaluation rules context
                  </h4>
                  <p className="text-xs text-zinc-400 leading-relaxed">{task.evaluationRules}</p>
                </Card>
              )}

              {/* Submitted issues list */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Unresolved Workspace Issues ({currentIssues.length})</h4>
                {currentIssues.length > 0 ? (
                  <div className="grid grid-cols-1 gap-3">
                    {currentIssues.map((issue, idx) => (
                      <div 
                        key={idx}
                        className={`p-4 rounded-2xl border text-xs flex justify-between items-start gap-4 ${
                          issue.severity === 'error' 
                            ? 'bg-red-950/15 border-red-500/20 text-red-300' 
                            : 'bg-orange-950/15 border-orange-500/20 text-orange-200'
                        }`}
                      >
                        <div className="space-y-1.5">
                          <p className="font-semibold leading-relaxed">{issue.message}</p>
                          {issue.file && (
                            <span className="text-[10px] text-zinc-500 font-mono">Location: {issue.file} · Line {issue.line}</span>
                          )}
                        </div>
                        <Badge status={issue.severity === 'error' ? 'issues-flagged' : 'under-review'} text={issue.severity} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-zinc-650 text-xs border border-dashed border-zinc-900 rounded-2xl">
                    Perfect alignment. No issues flagged in workspace.
                  </div>
                )}
              </div>
            </div>

            {/* Right Col (1/3 width) - Stats Card */}
            <div className="space-y-6">
              <Card hoverable={false} className="flex flex-col items-center text-center p-6 space-y-4">
                <ProgressRing progress={score} size={84} strokeWidth={7} color={submission?.status === 'issues-flagged' ? 'red' : 'purple'} />
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">AI Accuracy Score</span>
                  <h2 className="text-xl font-extrabold text-zinc-200 mt-1 jetbrains-mono">{score}/100</h2>
                </div>
              </Card>

              <Card hoverable={false} className="p-5 space-y-4 text-xs text-zinc-400">
                <div className="flex justify-between">
                  <span>Time Elapsed:</span>
                  <span className="text-zinc-200 font-bold jetbrains-mono">{formatTime(submission?.analytics?.timeTaken || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Lines Written:</span>
                  <span className="text-zinc-200 font-bold jetbrains-mono">{submission?.analytics?.linesWritten || 0} lines</span>
                </div>
                {submission?.submittedAt && (
                  <div className="flex justify-between">
                    <span>Submitted:</span>
                    <span className="text-zinc-200 font-bold">{new Date(submission.submittedAt).toLocaleDateString()}</span>
                  </div>
                )}
              </Card>

              <Card hoverable={false} className="p-5 space-y-4">
                <h4 className="text-xs font-bold text-zinc-300">Session Lifecycle</h4>
                <Timeline items={timelineItems} />
              </Card>
            </div>
          </div>
        )}

        {/* Tab 2: Submission Contents */}
        {activeTab === 'submission' && (
          <div className="flex rounded-2xl overflow-hidden border border-zinc-900 bg-zinc-950/20 h-[500px] glass-panel">
            {task?.type === 'coding' ? (
              <>
                {/* File list */}
                <div className="w-[180px] bg-zinc-950 border-r border-zinc-900 p-2 space-y-0.5 select-none overflow-y-auto">
                  {Object.keys(workspaceState.files || {}).map(filename => (
                    <div
                      key={filename}
                      onClick={() => setActiveFile(filename)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs cursor-pointer transition-all ${
                        filename === activeFile 
                          ? 'bg-purple-950/20 text-purple-300' 
                          : 'text-zinc-400 hover:bg-zinc-900/50 hover:text-zinc-200'
                      }`}
                    >
                      <FileCode size={13} />
                      <span className="truncate">{filename}</span>
                    </div>
                  ))}
                </div>
                
                {/* Monaco Read-Only Code Viewer */}
                <div className="flex-1 bg-[#1e1e1e] overflow-hidden">
                  <Editor
                    height="100%"
                    theme="vs-dark"
                    language="javascript"
                    value={workspaceState.files?.[activeFile] || '// Empty file'}
                    options={{
                      fontSize: 12,
                      minimap: { enabled: false },
                      readOnly: true,
                      automaticLayout: true
                    }}
                  />
                </div>
              </>
            ) : (
              <div 
                className="flex-1 p-8 text-zinc-300 font-sans text-sm leading-relaxed overflow-y-auto select-text bg-[#0c0c0e]"
                dangerouslySetInnerHTML={{ __html: workspaceState.content || '<p className="text-zinc-650 italic">No writing draft submitted.</p>' }}
              />
            )}
          </div>
        )}

        {/* Tab 3: AI Review History */}
        {activeTab === 'history' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
              <ChartWrapper
                title="AI Accuracy & Issue Trend"
                description="Analysis of total issues flagged across autosave checks."
              >
                {trendData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                      <XAxis dataKey="time" stroke="#71717a" style={{ fontSize: 10 }} />
                      <YAxis stroke="#71717a" style={{ fontSize: 10 }} />
                      <ChartTooltip
                        contentStyle={{ background: '#18181b', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px' }}
                        labelStyle={{ color: '#a855f7', fontWeight: 'bold', fontSize: 10 }}
                        itemStyle={{ color: '#e4e4e7', fontSize: 11 }}
                      />
                      <Line type="monotone" dataKey="issues" stroke="#a855f7" strokeWidth={2.5} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-[200px] items-center justify-center text-zinc-650 text-xs">
                    Insufficient timeline data to generate chart.
                  </div>
                )}
              </ChartWrapper>
            </div>

            <Card hoverable={false} className="space-y-4">
              <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <History size={13} className="text-purple-400" />
                Historical Evaluations
              </h4>
              <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
                {submission?.aiFeedbackHistory && submission.aiFeedbackHistory.length > 0 ? (
                  submission.aiFeedbackHistory.slice().reverse().map((feedback, idx) => (
                    <div key={idx} className="p-3 bg-zinc-900/30 border border-zinc-900 rounded-xl space-y-1">
                      <div className="flex justify-between text-[9px] text-zinc-500 font-mono">
                        <span>Score: <strong className="text-zinc-300">{feedback.score}</strong></span>
                        <span>{new Date(feedback.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-[11px] text-zinc-400 leading-normal">{feedback.summary}</p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-zinc-700 text-xs">No histories logged.</div>
                )}
              </div>
            </Card>
          </div>
        )}

        {/* Tab 4: Compiler Execution Outputs */}
        {activeTab === 'tests' && task?.type === 'coding' && (
          <div className="rounded-2xl border border-zinc-900 overflow-hidden bg-zinc-950">
            <Terminal
              output={submission?.testResults?.stdout}
              stderr={submission?.testResults?.stderr}
              status={submission?.testResults?.status}
              time={submission?.testResults?.time}
              memory={submission?.testResults?.memory}
              className="border-none rounded-none"
            />
          </div>
        )}

      </main>
    </div>
  );
};

export default FinalReview;
