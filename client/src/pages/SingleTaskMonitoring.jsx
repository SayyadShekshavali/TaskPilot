import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';
import Editor from '@monaco-editor/react';
import { 
  ArrowLeft, Terminal, ShieldAlert, Sparkles, Clock, 
  FileCode, Play, AlertCircle, RefreshCw 
} from 'lucide-react';
import toast from 'react-hot-toast';
import Card from '../components/Card';
import Badge from '../components/Badge';
import ProgressRing from '../components/ProgressRing';
import Button from '../components/Button';

const SingleTaskMonitoring = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [submission, setSubmission] = useState(null);
  const [task, setTask] = useState(null);
  const [workspaceState, setWorkspaceState] = useState({});
  const [activeFile, setActiveFile] = useState('');
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [status, setStatus] = useState('not-started');
  
  // AI Feedback streams
  const [aiFeedbackHistory, setAiFeedbackHistory] = useState([]);
  const [currentIssues, setCurrentIssues] = useState([]);
  const [aiScore, setAiScore] = useState(0);
  
  const [loading, setLoading] = useState(true);
  const [cursorPosition, setCursorPosition] = useState({ line: 1, column: 1 });

  const fetchDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/tasks/submissions/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const data = response.data;
      setSubmission(data);
      setTask(data.task);
      setWorkspaceState(data.workspaceState || {});
      setActiveFile(data.workspaceState?.activeFile || 'index.js');
      setTimeElapsed(data.analytics?.timeTaken || 0);
      setStatus(data.status);
      setAiScore(data.aiFeedbackHistory?.[data.aiFeedbackHistory.length - 1]?.score || 0);
      setCurrentIssues(data.aiFeedbackHistory?.[data.aiFeedbackHistory.length - 1]?.issues || []);
      setAiFeedbackHistory(data.aiFeedbackHistory || []);
    } catch (err) {
      toast.error('Failed to retrieve task monitoring data.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();

    // Establish Socket.io connection for workspace mirroring
    const apiBase = import.meta.env.VITE_API_URL || '';
    const socketHost = apiBase || (window.location.origin.includes('5173')
      ? 'http://localhost:5000'
      : window.location.origin);

    const socket = io(socketHost);

    socket.on('connect', () => {
      socket.emit('joinSubmissionRoom', id);
    });

    // Mirror workspace changes
    socket.on('workspaceStateUpdate', (data) => {
      if (data.workspaceState) {
        setWorkspaceState(data.workspaceState);
        if (data.workspaceState.activeFile) {
          setActiveFile(data.workspaceState.activeFile);
        }
      }
      if (data.cursor) {
        setCursorPosition(data.cursor);
      }
      if (data.status) {
        setStatus(data.status);
      }
      if (data.timeTaken) {
        setTimeElapsed(data.timeTaken);
      }
    });

    // Hear background AI feedback reviews
    socket.on('aiFeedbackUpdate', (feedback) => {
      setAiScore(feedback.score);
      setCurrentIssues(feedback.issues);
      setAiFeedbackHistory(prev => [...prev, feedback]);
    });

    socket.on('submitted', () => {
      toast.success('Candidate has submitted this task!');
      fetchDetails();
    });

    return () => {
      socket.disconnect();
    };
  }, [id]);

  const formatTime = (sec) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const files = workspaceState.files || {};
  const currentCode = files[activeFile] || '// Code mirror empty...';

  if (loading) {
    return (
      <div className="h-screen w-full bg-zinc-950 flex flex-col items-center justify-center text-zinc-400">
        <svg className="animate-spin h-6 w-6 text-purple-500 mb-2" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <span>Loading live spectate dashboard...</span>
      </div>
    );
  }

  return (
    <div className="h-screen w-full flex flex-col bg-zinc-950 text-zinc-100 overflow-hidden font-sans">
      
      {/* 1. Header Metadata Panel */}
      <header className="h-14 border-b border-zinc-800 bg-zinc-950 flex items-center justify-between px-6 shrink-0 z-10 select-none">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/admin/live')}
            className="p-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 cursor-pointer transition-all"
          >
            <ArrowLeft size={14} />
          </button>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <h1 className="text-xs font-bold text-zinc-100">{task?.title}</h1>
              <Badge status={status} />
            </div>
            <span className="text-[9px] text-zinc-500 font-mono">Spectating: {submission?.candidateEmail}</span>
          </div>
        </div>

        {/* Action controls */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 text-[10px] text-zinc-400 jetbrains-mono font-bold">
            <Clock size={12} className="text-blue-400" />
            <span>Time Taken: {formatTime(timeElapsed)}</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              className="h-8 py-0 px-3 text-xs"
              onClick={() => navigate(`/admin/review/${submission?._id}`)}
            >
              Go to Final Review
            </Button>
          </div>
        </div>
      </header>

      {/* 2. Split Workspace Layout */}
      <div className="flex-1 flex w-full overflow-hidden">
        
        {/* Left Side: Monaco Read Only Mirror (70% width) */}
        <main className="flex-1 flex flex-col overflow-hidden bg-zinc-900 border-r border-zinc-800">
          <div className="h-9 bg-zinc-950 border-b border-zinc-900 flex items-center justify-between px-4 select-none shrink-0">
            <span className="text-[10px] text-zinc-400 font-mono flex items-center gap-1.5">
              <FileCode size={11} className="text-purple-400" />
              {activeFile} (Read Only Mirror)
            </span>
            <span className="text-[8px] text-zinc-600 font-mono">
              Live Cursor: Line {cursorPosition.line}, Char {cursorPosition.column}
            </span>
          </div>

          <div className="flex-1 w-full bg-[#1e1e1e]">
            {task?.type === 'coding' ? (
              <Editor
                height="100%"
                theme="vs-dark"
                language="javascript"
                value={currentCode}
                options={{
                  fontSize: 13,
                  fontFamily: 'JetBrains Mono',
                  minimap: { enabled: false },
                  readOnly: true,
                  lineNumbersMinChars: 3,
                  padding: { top: 12 },
                  automaticLayout: true
                }}
              />
            ) : (
              <div 
                className="p-8 text-zinc-300 font-sans text-sm leading-relaxed overflow-y-auto h-full select-all"
                dangerouslySetInnerHTML={{ __html: workspaceState.content || '<p className="text-zinc-650 italic">Empty writing content...</p>' }}
              />
            )}
          </div>
        </main>

        {/* Right Side: Live AI Feed Panel (30% width / 340px) */}
        <aside className="w-[340px] bg-zinc-950 flex flex-col overflow-hidden shrink-0 select-none">
          <div className="px-4 py-4 border-b border-zinc-900 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-purple-400" />
              <h3 className="text-sm font-bold text-zinc-200">Live AI Auditor</h3>
            </div>
            <ProgressRing
              progress={aiScore}
              size={36}
              strokeWidth={3}
              color={status === 'issues-flagged' ? 'red' : 'purple'}
            />
          </div>

          {/* AI Feed logs list */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
            
            <div className="space-y-2">
              <span className="text-[9px] uppercase font-bold text-zinc-500 tracking-wider">AI Insight Timeline</span>
              {aiFeedbackHistory.length > 0 ? (
                <div className="space-y-3">
                  {aiFeedbackHistory.slice(-4).reverse().map((record, index) => (
                    <Card key={index} className="p-4" hoverable={false}>
                      <div className="flex justify-between items-start mb-1 text-[10px] text-zinc-500 font-mono">
                        <span>Score: <strong className="text-purple-400">{record.score}</strong></span>
                        <span>{new Date(record.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-xs text-zinc-300 leading-relaxed font-semibold">{record.summary}</p>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-zinc-650 text-xs border border-dashed border-zinc-900 rounded-2xl">
                  Waiting for candidate edits to trigger reviews...
                </div>
              )}
            </div>

            <div className="space-y-2.5">
              <span className="text-[9px] uppercase font-bold text-zinc-500 tracking-wider">Active Workspace Issues ({currentIssues.length})</span>
              {currentIssues.length > 0 ? (
                <div className="space-y-2">
                  {currentIssues.map((issue, idx) => {
                    const isError = issue.severity === 'error';
                    return (
                      <div 
                        key={idx}
                        className={`p-3 rounded-2xl border ${
                          isError 
                            ? 'bg-red-950/15 border-red-500/20 text-red-200' 
                            : 'bg-orange-950/15 border-orange-500/20 text-orange-200'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-1">
                          <p className="text-xs leading-normal">{issue.message}</p>
                          <span className={`px-1 rounded text-[8px] font-mono select-none ${
                            isError ? 'bg-red-950/40 text-red-400' : 'bg-orange-950/40 text-orange-400'
                          }`}>
                            {issue.severity}
                          </span>
                        </div>
                        {issue.file && (
                          <div className="mt-2 text-[9px] text-zinc-500 font-mono flex justify-between border-t border-zinc-900 pt-2">
                            <span>File: {issue.file}</span>
                            <span>Line: {issue.line}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-zinc-650 text-xs border border-dashed border-zinc-900 rounded-2xl">
                  Workspace is aligned and compile healthy.
                </div>
              )}
            </div>

          </div>
        </aside>

      </div>
    </div>
  );
};

export default SingleTaskMonitoring;
