import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Terminal, Eye, BrainCircuit, Sparkles, ShieldCheck, Mail, Zap, CheckCircle2 } from 'lucide-react';
import Button from '../components/Button';
import Card from '../components/Card';

const LandingPage = () => {
  const navigate = useNavigate();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] }
    }
  };

  const steps = [
    {
      num: '01',
      title: 'Assign Task via Email',
      desc: 'Create standard coding or writing exercises in seconds. Invite candidates via a secure, single-use JWT link.',
      icon: Mail,
      color: 'text-purple-400 border-purple-500/20 bg-purple-500/5'
    },
    {
      num: '02',
      title: 'Watch Coding Live',
      desc: 'Follow keystrokes and cursors in real-time as if you were pair programming. Track active, idle, or typing states.',
      icon: Eye,
      color: 'text-blue-400 border-blue-500/20 bg-blue-500/5'
    },
    {
      num: '03',
      title: 'Continuous AI Review',
      desc: 'An AI engine audits drift from instructions immediately (<1s heuristic pass) and feeds back semantic analysis in the background.',
      icon: BrainCircuit,
      color: 'text-red-400 border-red-500/20 bg-red-500/5'
    },
    {
      num: '04',
      title: 'One-Click Decision',
      desc: 'Review chronological trends of corrected errors, compiler outputs, and AI accuracy scores. Approve or request changes.',
      icon: ShieldCheck,
      color: 'text-green-400 border-green-500/20 bg-green-500/5'
    }
  ];

  return (
    <div className="min-h-screen mesh-gradient-bg flex flex-col">
      {/* Header Navbar */}
      <header className="w-full max-w-7xl mx-auto px-6 py-5 flex items-center justify-between border-b border-white/5 bg-zinc-950/40 backdrop-blur-md sticky top-0 z-40">
        <div className="flex items-center gap-2 select-none">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-purple-500/30">
            T
          </div>
          <span className="font-heading font-extrabold text-lg text-white tracking-tight">Task<span className="text-purple-400">Pilot</span></span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400">
          <a href="#features" className="hover:text-zinc-100 transition-colors">Features</a>
          <a href="#workflow" className="hover:text-zinc-100 transition-colors">Workflow</a>
          <a href="#pricing" className="hover:text-zinc-100 transition-colors">Pricing</a>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/auth')}>
            Log In
          </Button>
          <Button variant="primary" size="sm" onClick={() => navigate('/auth')}>
            Sign Up
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex-1 w-full max-w-7xl mx-auto px-6 py-20 md:py-32 flex flex-col items-center text-center justify-center">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-6 max-w-4xl"
        >
          {/* Badge indicator */}
          <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-950/50 border border-purple-500/20 text-purple-300 text-xs font-semibold">
            <Sparkles size={12} className="animate-spin" />
            <span>Next-Gen Candidate Assessment</span>
          </motion.div>

          {/* Heading */}
          <motion.h1
            variants={itemVariants}
            className="text-4xl md:text-7xl font-heading font-extrabold text-white tracking-tight leading-[1.05]"
          >
            Assign. Monitor. Review.<br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-indigo-300 to-blue-400">
              Powered by Live AI.
            </span>
          </motion.h1>

          {/* Subheading */}
          <motion.p
            variants={itemVariants}
            className="text-zinc-400 text-base md:text-xl max-w-2xl mx-auto leading-relaxed"
          >
            Watch engineering and writing candidates solve challenges in real-time. Receive debounced, structured AI feedback instantly while they type.
          </motion.p>

          {/* Actions */}
          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button variant="primary" size="lg" className="group" onClick={() => navigate('/auth')}>
              Get Started Free
              <ArrowRight size={16} className="ml-2 transition-transform group-hover:translate-x-1" />
            </Button>
            <Button variant="glass" size="lg" onClick={() => navigate('/auth')}>
              Book Demo
            </Button>
          </motion.div>
        </motion.div>
      </section>

      {/* Steps Rail Section */}
      <section id="workflow" className="w-full max-w-7xl mx-auto px-6 py-20 border-t border-zinc-900/80">
        <div className="text-center mb-16 space-y-3">
          <h2 className="text-2xl md:text-4xl font-heading font-extrabold text-white">How TaskPilot Works</h2>
          <p className="text-zinc-400 text-sm max-w-md mx-auto">A seamless loop built to audit alignment and review submissions at Stripe scale.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <Card key={idx} className="relative flex flex-col justify-between h-[280px]">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-extrabold text-zinc-800 jetbrains-mono">{step.num}</span>
                    <div className={`p-2.5 rounded-xl border ${step.color}`}>
                      <Icon size={18} />
                    </div>
                  </div>
                  <h3 className="text-base font-bold text-zinc-100">{step.title}</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">{step.desc}</p>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Feature highlight Section */}
      <section id="features" className="w-full max-w-7xl mx-auto px-6 py-24 border-t border-zinc-900/80 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-1.5 text-xs text-purple-400 font-semibold uppercase tracking-wider">
            <Zap size={14} />
            <span>The Competitive Edge</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-heading font-extrabold text-white leading-tight">
            Stop waiting for final commits. Check alignment as they work.
          </h2>
          <p className="text-zinc-400 text-sm leading-relaxed">
            Our two-tier feedback loop ensures candidate workspaces are audited in under a second. We match required signatures locally first, and query generative AI models to score Nuance and correctness asynchronously.
          </p>
          <ul className="space-y-3 text-xs text-zinc-300">
            <li className="flex items-center gap-2">
              <CheckCircle2 size={14} className="text-purple-400" />
              <span>Monaco VS-Code inspired workspace with terminal code compilers.</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 size={14} className="text-purple-400" />
              <span>Notion-inspired writing layouts equipped with TipTap editors.</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 size={14} className="text-purple-400" />
              <span>Interactive Socket.io cursor mirroring and activity tracking.</span>
            </li>
          </ul>
        </div>
        <div className="relative rounded-[24px] overflow-hidden border border-white/10 shadow-2xl bg-zinc-950 p-6 flex flex-col justify-between h-[360px] glass-panel">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
            </div>
            <span className="text-[10px] text-zinc-500 font-mono">WORKSPACE_MONITOR.LOG</span>
          </div>
          <div className="flex-1 font-mono text-[11px] text-zinc-400 py-4 space-y-2 overflow-hidden">
            <p className="text-purple-400"># Initializing AI Evaluator...</p>
            <p className="text-zinc-500">&gt; Scaffold matches: src/App.jsx, src/components/Header.jsx</p>
            <p className="text-zinc-500">&gt; Tracking Candidate keystrokes: active typing</p>
            <p className="text-red-400 font-bold">&gt; [TIER 1 DRIFT] Missing calculateTotal exports in index.js</p>
            <p className="text-zinc-500">&gt; Streaming Gemini 3.5 Flash semantic critique...</p>
            <p className="text-green-400">&gt; [TIER 2 DONE] Code correctness verified. Score: 92/100</p>
          </div>
          <div className="border-t border-zinc-900 pt-3 flex items-center justify-between text-xs text-zinc-500">
            <span>Status: Running Diagnostics</span>
            <span className="text-purple-400 font-bold">TASKPILOT CLIENT v1.0</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full max-w-7xl mx-auto px-6 py-12 border-t border-zinc-900/80 mt-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
        <span>© 2026 TaskPilot Inc. All rights reserved.</span>
        <div className="flex gap-6">
          <a href="#" className="hover:text-zinc-300">Privacy Policy</a>
          <a href="#" className="hover:text-zinc-300">Terms of Service</a>
          <a href="#" className="hover:text-zinc-300">Contact Support</a>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
