import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Calendar, Clock, Terminal, AlertTriangle, Play, Sparkles } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import Badge from '../components/Badge';

const CandidateLanding = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [candidateEmail, setCandidateEmail] = useState('');
  const [submissionId, setSubmissionId] = useState('');
  const [task, setTask] = useState(null);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    async function fetchInviteDetails() {
      try {
        const response = await axios.get(`/api/tasks/invite/${token}`);
        setTask(response.data.task);
        setCandidateEmail(response.data.candidateEmail);
        setSubmissionId(response.data.submissionId);
        
        // If already in progress, auto log in and navigate
        if (response.data.status !== 'not-started') {
          loginAndRedirect(response.data.submissionId, response.data.candidateEmail);
        }
      } catch (error) {
        toast.error('Invitation token is invalid or has expired.');
        navigate('/');
      } finally {
        setLoading(false);
      }
    }
    fetchInviteDetails();
  }, [token]);

  const getResolvedName = (email) => {
    if (!email) return 'Developer';
    return email
      .split('@')[0]
      .split(/[._\-]/)
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  };

  // Helper to log candidate in with token-credentials
  const loginAndRedirect = (subId, email, candName) => {
    const resolvedName = candName || getResolvedName(email);
    const tempUser = {
      id: subId,
      name: resolvedName,
      email: email,
      role: 'candidate'
    };
    
    // Save token as invite-access
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(tempUser));
    
    navigate(`/candidate/workspace/${subId}`);
  };

  const handleStart = async (e) => {
    if (e) e.preventDefault();
    setStarting(true);
    try {
      const resolvedName = getResolvedName(candidateEmail);
      await axios.post(`/api/tasks/invite/${token}/start`, { candidateName: resolvedName });
      toast.success('Task started! Redirecting to editor.');
      loginAndRedirect(submissionId, candidateEmail, resolvedName);
    } catch (err) {
      toast.error('Failed to start task.');
    } finally {
      setStarting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6 text-zinc-400">
        <div className="flex flex-col items-center gap-4">
          <svg className="animate-spin h-8 w-8 text-purple-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-xs font-semibold font-mono tracking-wider text-zinc-500">Resolving secure invitation...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-6 relative overflow-hidden">
      
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-12 gap-8 relative z-10">
        
        {/* Left Side: Interactive Portal Welcome Info (5 cols) */}
        <div className="md:col-span-5 flex flex-col justify-center space-y-6">
          <div className="flex items-center gap-2 select-none">
            <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center font-bold text-white shadow-lg shadow-purple-500/20">
              T
            </div>
            <span className="font-heading font-extrabold text-white text-base">
              Task<span className="text-purple-400">Pilot</span>
            </span>
          </div>

          <div className="space-y-4">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white leading-tight">
              Secure Assessment <br />
              <span className="text-purple-400">Workspace Portal</span>
            </h1>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Welcome to your dedicated developer testing sandbox. Please review the details on the right. Once you hit start, your customized editor boilerplate files will be compiled.
            </p>
          </div>

          {/* Interactive Feature List */}
          <div className="space-y-3.5 pt-4 border-t border-zinc-900">
            {[
              { title: 'Interactive Code Stubs', desc: 'Pre-scaffolded boilerplate code configured for this task.' },
              { title: 'AI Assistive Feedback', desc: 'Real-time diagnostic checks tracking alignment and formatting.' },
              { title: 'Live Sandbox Compiler', desc: 'Run, compile, and preview code outputs directly in your browser.' }
            ].map((feat, i) => (
              <div key={i} className="flex gap-3 items-start">
                <div className="w-5 h-5 rounded-full bg-purple-950/40 border border-purple-900/30 flex items-center justify-center text-[10px] text-purple-400 shrink-0 font-bold font-mono">
                  {i + 1}
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-zinc-200">{feat.title}</h4>
                  <p className="text-[10px] text-zinc-500 leading-normal">{feat.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Task Invitation details card (7 cols) */}
        <div className="md:col-span-7">
          <Card className="p-8 border border-zinc-850 bg-zinc-900/10 backdrop-blur-md rounded-3xl flex flex-col justify-between h-full" hoverable={false}>
            <div className="space-y-6">
              
              {/* Header metadata */}
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[9px] uppercase font-bold text-zinc-500 tracking-widest font-mono">Assigned Assessment</span>
                  <h2 className="text-lg md:text-xl font-extrabold text-zinc-100 mt-1">{task?.title}</h2>
                </div>
                <Badge status="not-started" />
              </div>

              {/* Specs Grid */}
              <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-zinc-950 border border-zinc-850/50">
                <div className="space-y-1">
                  <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider block">Estimated Duration</span>
                  <span className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                    <Clock size={13} className="text-purple-400" />
                    {task?.type === 'coding' ? '60 mins' : '45 mins'}
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider block">Language Env</span>
                  <span className="text-xs font-semibold text-zinc-200 flex items-center gap-1.5">
                    <Terminal size={13} className="text-purple-400" />
                    {task?.type === 'coding' ? 'Sandbox Editor' : 'Rich Text Tiptap'}
                  </span>
                </div>
              </div>

              {/* Task Details */}
              <div className="space-y-2 border-t border-zinc-900 pt-5">
                <h4 className="text-xs font-bold text-zinc-300">Task Overview</h4>
                <p className="text-xs text-zinc-400 leading-relaxed max-h-[140px] overflow-y-auto pr-2 scrollbar-thin">
                  {task?.description}
                </p>
              </div>

              {/* Rules criteria */}
              {task?.evaluationRules && (
                <div className="p-3.5 rounded-2xl border border-yellow-500/10 bg-yellow-500/5 space-y-1">
                  <div className="flex items-center gap-1.5 text-yellow-400 font-bold text-[10px] uppercase tracking-wider">
                    <AlertTriangle size={12} />
                    <span>Evaluation Criteria</span>
                  </div>
                  <p className="text-[10px] text-zinc-400 leading-relaxed font-medium">{task.evaluationRules}</p>
                </div>
              )}

            </div>

            {/* Launch Button Action */}
            <div className="pt-6 border-t border-zinc-900 mt-6 space-y-4">
              <Button
                variant="primary"
                className="w-full py-4 text-xs group bg-purple-600 hover:bg-purple-700 font-extrabold tracking-wide"
                onClick={handleStart}
                loading={starting}
              >
                Launch Assessment Workspace
                <Play size={12} className="ml-1.5 transition-transform group-hover:scale-110" />
              </Button>

              <div className="text-[9px] text-center text-zinc-500 leading-relaxed max-w-[90%] mx-auto font-medium">
                By entering the workspace, you confirm you are logged in as <span className="text-zinc-400 font-bold">{candidateEmail}</span>. Keystroke analytics and code review outputs will start tracking.
              </div>
            </div>

          </Card>
        </div>

      </div>
    </div>
  );
};

export default CandidateLanding;
