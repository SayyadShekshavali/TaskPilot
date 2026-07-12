import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import axios from 'axios';
import { ShieldCheck, Mail, Lock, User, Github, Chrome, Sparkles } from 'lucide-react';
import Button from '../components/Button';
import Card from '../components/Card';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    setIsLoading(true);
    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/signup';
    
    try {
      const response = await axios.post(endpoint, {
        name: data.name,
        email: data.email,
        password: data.password
      });

      const { token, user } = response.data;
      
      // Save details locally
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      toast.success(`Welcome back, ${user.name}!`);

      // Post-Login redirection based on resolved role
      if (user.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/candidate/home');
      }
    } catch (error) {
      console.error('Authentication failure:', error);
      const errMsg = error.response?.data?.message || 'Authentication failed. Please try again.';
      toast.error(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen mesh-gradient-bg flex items-center justify-center p-6">
      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        
        {/* Left Side: Auth Card */}
        <Card className="p-8 md:p-10" hoverable={false}>
          <div className="flex items-center gap-2 mb-6 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center font-bold text-white">
              T
            </div>
            <span className="font-heading font-extrabold text-white">TaskPilot</span>
          </div>

          <div className="mb-6">
            <h2 className="text-xl md:text-2xl font-bold text-zinc-100">
              {isLogin ? 'Sign in to TaskPilot' : 'Create your account'}
            </h2>
            <p className="text-zinc-400 text-xs mt-1 leading-relaxed">
              {isLogin 
                ? 'Enter your credentials or use an admin password to inspect team lead privileges.'
                : 'Register to start tracking your assigned candidate assessments.'}
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {!isLogin && (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-400">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-3.5 text-zinc-500" size={16} />
                  <input
                    type="text"
                    placeholder="Jane Doe"
                    {...register('name', { required: !isLogin })}
                    className="w-full pl-10 pr-4 py-3 bg-zinc-950/60 border border-zinc-800 focus:border-purple-500 rounded-xl text-sm text-zinc-200 placeholder-zinc-600 outline-none transition-colors"
                  />
                </div>
                {errors.name && <span className="text-[10px] text-red-400">Name is required</span>}
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-semibold text-zinc-400">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 text-zinc-500" size={16} />
                <input
                  type="email"
                  placeholder="name@company.com"
                  {...register('email', { required: true })}
                  className="w-full pl-10 pr-4 py-3 bg-zinc-950/60 border border-zinc-800 focus:border-purple-500 rounded-xl text-sm text-zinc-200 placeholder-zinc-600 outline-none transition-colors"
                />
              </div>
              {errors.email && <span className="text-[10px] text-red-400">Valid email is required</span>}
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-zinc-400">Password</label>
                {isLogin && (
                  <a href="#" className="text-[10px] text-purple-400 hover:underline">Forgot password?</a>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 text-zinc-500" size={16} />
                <input
                  type="password"
                  placeholder="••••••••"
                  {...register('password', { required: true })}
                  className="w-full pl-10 pr-4 py-3 bg-zinc-950/60 border border-zinc-800 focus:border-purple-500 rounded-xl text-sm text-zinc-200 placeholder-zinc-600 outline-none transition-colors"
                />
              </div>
              {errors.password && <span className="text-[10px] text-red-400">Password is required</span>}
            </div>

            <Button type="submit" variant="primary" className="w-full py-3.5" loading={isLoading}>
              {isLogin ? 'Sign In' : 'Sign Up'}
            </Button>
          </form>

          {/* Social Sign In */}
          <div className="relative my-6 text-center">
            <span className="absolute inset-x-0 top-1/2 border-t border-zinc-800 -z-10" />
            <span className="bg-zinc-950 px-3 text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">
              Or continue with
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-zinc-850 hover:border-zinc-700 bg-zinc-900/40 text-zinc-300 text-xs font-semibold transition-all cursor-pointer">
              <Chrome size={14} />
              Google
            </button>
            <button className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-zinc-850 hover:border-zinc-700 bg-zinc-900/40 text-zinc-300 text-xs font-semibold transition-all cursor-pointer">
              <Github size={14} />
              GitHub
            </button>
          </div>

          <p className="text-center text-xs text-zinc-500 mt-6 select-none">
            {isLogin ? "Don't have an account?" : 'Already have an account?'}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-purple-400 font-semibold hover:underline ml-1.5 cursor-pointer"
            >
              {isLogin ? 'Create one' : 'Log in'}
            </button>
          </p>
        </Card>

        {/* Right Side: Animated Code Panel */}
        <div className="hidden md:block space-y-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1 bg-purple-950/40 border border-purple-500/20 text-purple-400 px-3 py-1 rounded-full text-[10px] font-bold">
              <Sparkles size={10} />
              <span>ROLE BYPASS TRIGGER</span>
            </div>
            <h2 className="text-2xl font-bold text-zinc-200">Prototype Demo Credentials</h2>
            <p className="text-zinc-400 text-xs leading-relaxed">
              Use one of the whitelisted admin passwords to login as a Team Lead, or any other password to login as a Candidate.
            </p>
          </div>

          <div className="p-5 rounded-2xl border border-white/5 bg-zinc-900/30 glass-panel space-y-4">
            <div className="flex items-center gap-3">
              <ShieldCheck className="text-purple-400" size={20} />
              <div>
                <h4 className="text-xs font-bold text-zinc-200">Admin Passwords Whitelist</h4>
                <p className="text-[10px] text-zinc-500 mt-0.5">Password matches resolve user to Admin role</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 font-mono text-[10px]">
              <div className="p-2 rounded bg-zinc-950 border border-zinc-800 text-center text-zinc-300">admin123</div>
              <div className="p-2 rounded bg-zinc-950 border border-zinc-800 text-center text-zinc-300">123admin</div>
              <div className="p-2 rounded bg-zinc-950 border border-zinc-800 text-center text-zinc-300">ad123min</div>
            </div>
            <div className="border-t border-zinc-850 pt-3">
              <p className="text-[10px] text-zinc-400 italic">
                Any other password automatically registers the account with the <strong>Candidate</strong> role.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AuthPage;
