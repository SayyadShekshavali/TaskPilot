import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Confetti from 'react-confetti';
import { CheckCircle2, Clock, BrainCircuit, ArrowRight, Sparkles } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';

const SubmissionSuccess = () => {
  const navigate = useNavigate();
  const [windowDimension, setWindowDimension] = useState({ width: window.innerWidth, height: window.innerHeight });

  const handleRedirect = () => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    if (token && user) {
      navigate('/candidate/home');
    } else {
      navigate('/auth');
    }
  };

  const detectSize = () => {
    setWindowDimension({ width: window.innerWidth, height: window.innerHeight });
  };

  useEffect(() => {
    window.addEventListener('resize', detectSize);
    return () => {
      window.removeEventListener('resize', detectSize);
    };
  }, []);

  return (
    <div className="min-h-screen mesh-gradient-bg flex items-center justify-center p-6 relative overflow-hidden">
      {/* Confetti Explosion */}
      <Confetti
        width={windowDimension.width}
        height={windowDimension.height}
        recycle={false}
        numberOfPieces={200}
        gravity={0.12}
      />

      <Card className="w-full max-w-xl p-8 md:p-10 text-center relative z-10 flex flex-col items-center" hoverable={false}>
        {/* Large green pulse checkmark */}
        <div className="w-16 h-16 rounded-3xl bg-green-950/40 border border-green-500/20 text-green-400 flex items-center justify-center mb-6 animate-bounce">
          <CheckCircle2 size={32} />
        </div>

        <div className="space-y-6">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-zinc-100">Submission Received!</h1>
            <p className="text-zinc-400 text-xs mt-1.5 leading-relaxed">
              Your assessment workspace is locked and has been submitted to the team leads for final review.
            </p>
          </div>

          {/* Stats Summary Panel */}
          <div className="grid grid-cols-2 gap-4 border-t border-b border-zinc-900 py-6 my-2">
            <div className="text-center space-y-1">
              <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider flex items-center justify-center gap-1.5">
                <Clock size={12} />
                Assessment Session
              </span>
              <p className="text-sm font-bold text-zinc-200 jetbrains-mono">Completed</p>
            </div>
            <div className="text-center space-y-1">
              <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider flex items-center justify-center gap-1.5">
                <BrainCircuit size={12} className="text-purple-400" />
                Live AI review
              </span>
              <p className="text-sm font-bold text-purple-400 jetbrains-mono">Logged</p>
            </div>
          </div>

          {/* Steps Next */}
          <div className="text-left space-y-3 bg-zinc-900/30 border border-zinc-850 p-5 rounded-2xl">
            <h4 className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
              <Sparkles size={12} className="text-purple-400" />
              What Happens Next?
            </h4>
            <ol className="text-[11px] text-zinc-400 space-y-2 list-decimal pl-4 leading-relaxed">
              <li>Admins receive a real-time notification of your completed workspace.</li>
              <li>They inspect your code commits, compiler stderr logs, and AI feedback timeline.</li>
              <li>You will receive an email notice once they approve your submission or request revisions.</li>
            </ol>
          </div>

          <Button
            variant="primary"
            className="w-full py-4 text-xs group"
            onClick={handleRedirect}
          >
            Return to Dashboard
            <ArrowRight size={13} className="ml-1.5 transition-transform group-hover:translate-x-1" />
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default SubmissionSuccess;
