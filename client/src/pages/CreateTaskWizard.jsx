import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  ArrowLeft, ArrowRight, Check, Sparkles, Mail, FileText, 
  Trash, Plus, Upload, BookOpen, Clock, AlertCircle 
} from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import Badge from '../components/Badge';

const CreateTaskWizard = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [emails, setEmails] = useState([]);
  const [emailInput, setEmailInput] = useState('');
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, watch, setValue, trigger, formState: { errors } } = useForm({
    shouldUnregister: false,
    defaultValues: {
      type: 'coding',
      difficulty: 'medium',
      priority: 'medium',
      customPrompt: '',
      evaluationRules: 'Code must compile. Functions must have proper parameter names. Ensure robust exception handling.'
    }
  });

  const taskType = watch('type');
  const taskTitle = watch('title');
  const taskDesc = watch('description');
  const taskRules = watch('evaluationRules');

  // Handle email chips add
  const handleAddEmail = (e) => {
    e.preventDefault();
    const clean = emailInput.trim().toLowerCase();
    if (!clean) return;
    
    // Check basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(clean)) {
      toast.error('Invalid email address format.');
      return;
    }

    if (emails.includes(clean)) {
      toast.error('Email already added.');
      return;
    }

    setEmails([...emails, clean]);
    setEmailInput('');
  };

  const handleRemoveEmail = (index) => {
    setEmails(emails.filter((_, idx) => idx !== index));
  };

  // Bulk CSV email parsing mock
  const handleCsvUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target.result;
      const parsedEmails = text
        .split(/[\n,;]/)
        .map(mail => mail.trim().toLowerCase())
        .filter(mail => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail));
      
      if (parsedEmails.length > 0) {
        // Remove duplicates
        const unique = Array.from(new Set([...emails, ...parsedEmails]));
        setEmails(unique);
        toast.success(`Successfully parsed ${parsedEmails.length} email(s) from CSV.`);
      } else {
        toast.error('Could not extract any valid email addresses from CSV.');
      }
    };
    reader.readAsText(file);
  };

  // Submitting everything to backend
  const onSubmit = async (data) => {
    if (emails.length === 0) {
      toast.error('Please assign at least one candidate email invite.');
      setStep(2);
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/tasks', {
        ...data,
        candidates: emails
      }, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

      toast.success('Task created successfully! Invitations sent.');
      navigate('/admin/dashboard');
    } catch (error) {
      console.error('Wizard save error:', error);
      const serverError = error.response?.data?.error;
      const serverMsg = error.response?.data?.message;
      toast.error(serverError || serverMsg || 'Failed to create task wizard.');
    } finally {
      setLoading(false);
    }
  };

  const nextStep = async () => {
    let fieldsToValidate = [];
    if (step === 1) {
      fieldsToValidate = ['title', 'description', 'deadline'];
    } else if (step === 3) {
      fieldsToValidate = ['evaluationRules'];
    }

    if (fieldsToValidate.length > 0) {
      const isStepValid = await trigger(fieldsToValidate);
      if (!isStepValid) {
        toast.error('Please correct the validation errors before proceeding.');
        return;
      }
    }
    setStep((prev) => Math.min(prev + 1, 4));
  };

  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">
      {/* Top Navbar */}
      <header className="border-b border-zinc-800 bg-zinc-950/80 sticky top-0 z-30 backdrop-blur-md select-none shrink-0">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/admin/dashboard')}
              className="p-1.5 rounded-xl bg-zinc-900 border border-zinc-850 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-850 cursor-pointer"
            >
              <ArrowLeft size={14} />
            </button>
            <div className="flex flex-col">
              <h1 className="text-xs font-bold text-zinc-100">Create Assessment Wizard</h1>
              <span className="text-[9px] text-zinc-500 font-mono">Create new task & dispatch invites</span>
            </div>
          </div>

          {/* Wizard step progress rail */}
          <div className="flex items-center gap-6">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center font-mono text-[10px] font-bold border transition-all ${
                  step === s 
                    ? 'bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-500/25' 
                    : step > s 
                      ? 'bg-zinc-800 border-zinc-700 text-purple-400' 
                      : 'bg-zinc-950 border-zinc-800 text-zinc-600'
                }`}>
                  {step > s ? <Check size={11} /> : s}
                </span>
                <span className={`hidden md:inline text-[10px] font-bold uppercase tracking-wider ${
                  step === s ? 'text-purple-400' : 'text-zinc-650'
                }`}>
                  {s === 1 ? 'Task Info' : s === 2 ? 'Candidates' : s === 3 ? 'Resources' : 'Review'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content Form */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-6 py-10">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          
          {/* STEP 1: Task Info */}
          {step === 1 && (
            <Card className="space-y-6 p-8" hoverable={false}>
              <div>
                <h3 className="text-base font-bold text-zinc-100">Step 1: Task Specifications</h3>
                <p className="text-xs text-zinc-400 mt-1">Configure challenge metadata and type category.</p>
              </div>

              {/* Title */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-400">Task Title</label>
                <input
                  type="text"
                  placeholder="Build React Shopping Cart"
                  {...register('title', { required: 'Title is required' })}
                  className="w-full px-4 py-3 bg-zinc-950/60 border border-zinc-800 focus:border-purple-500 rounded-xl text-sm text-zinc-200 outline-none transition-colors"
                />
                {errors.title && <span className="text-[10px] text-red-400">{errors.title.message}</span>}
              </div>

              {/* Type toggle */}
              <div className="grid grid-cols-2 gap-4">
                <div
                  className={`p-4 rounded-2xl border cursor-pointer flex flex-col justify-between h-[100px] transition-all ${
                    taskType === 'coding' 
                      ? 'bg-purple-950/15 border-purple-500/40 text-purple-300' 
                      : 'bg-zinc-950/40 border-zinc-850 text-zinc-400 hover:border-zinc-800'
                  }`}
                  onClick={() => setValue('type', 'coding')}
                >
                  <span className="text-xs font-bold">Coding Assessment</span>
                  <p className="text-[10px] text-zinc-500 leading-normal">Monaco code workspace with syntax compiling terminals.</p>
                </div>
                <div
                  className={`p-4 rounded-2xl border cursor-pointer flex flex-col justify-between h-[100px] transition-all ${
                    taskType === 'writing' 
                      ? 'bg-purple-950/15 border-purple-500/40 text-purple-300' 
                      : 'bg-zinc-950/40 border-zinc-850 text-zinc-400 hover:border-zinc-800'
                  }`}
                  onClick={() => setValue('type', 'writing')}
                >
                  <span className="text-xs font-bold">Writing / Narrative Assessment</span>
                  <p className="text-[10px] text-zinc-500 leading-normal">TipTap Notion-styled rich text layout with content counters.</p>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-400">Detailed Description</label>
                <textarea
                  rows={6}
                  placeholder="Provide step-by-step instructions. E.g. write a function index.js that..."
                  {...register('description', { required: 'Description is required' })}
                  className="w-full px-4 py-3 bg-zinc-950/60 border border-zinc-800 focus:border-purple-500 rounded-xl text-xs text-zinc-200 outline-none transition-colors resize-none leading-relaxed"
                />
                {errors.description && <span className="text-[10px] text-red-400">{errors.description.message}</span>}
              </div>

              {/* Difficulty & Deadline */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-400">Difficulty Grade</label>
                  <select
                    {...register('difficulty')}
                    className="w-full px-4 py-3 bg-zinc-950/60 border border-zinc-800 rounded-xl text-xs text-zinc-300 outline-none cursor-pointer"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-400">Submission Deadline</label>
                  <input
                    type="date"
                    {...register('deadline', { required: 'Deadline is required' })}
                    className="w-full px-4 py-3 bg-zinc-950/60 border border-zinc-800 focus:border-purple-500 rounded-xl text-xs text-zinc-300 outline-none transition-colors"
                  />
                  {errors.deadline && <span className="text-[10px] text-red-400">{errors.deadline.message}</span>}
                </div>
              </div>
            </Card>
          )}

          {/* STEP 2: Candidates */}
          {step === 2 && (
            <Card className="space-y-6 p-8" hoverable={false}>
              <div>
                <h3 className="text-base font-bold text-zinc-100">Step 2: Candidate Invites</h3>
                <p className="text-xs text-zinc-400 mt-1">Assign emails to dispatch magic login link codes.</p>
              </div>

              {/* CSV Upload */}
              <div className="p-5 border border-dashed border-zinc-800 rounded-2xl text-center space-y-3 bg-zinc-900/10">
                <Upload className="mx-auto text-purple-400" size={20} />
                <div>
                  <h4 className="text-xs font-semibold text-zinc-300">Bulk CSV Upload</h4>
                  <p className="text-[10px] text-zinc-500 mt-0.5">Upload a raw text file containing comma or line-separated emails.</p>
                </div>
                <label className="inline-flex items-center justify-center px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-[10px] font-semibold text-zinc-400 hover:text-zinc-200 hover:border-zinc-700 cursor-pointer">
                  Choose File
                  <input type="file" accept=".csv,.txt" onChange={handleCsvUpload} className="hidden" />
                </label>
              </div>

              {/* Add email input */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-400">Add Individual Email</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="candidate@gmail.com"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    className="flex-1 px-4 py-3 bg-zinc-950/60 border border-zinc-800 focus:border-purple-500 rounded-xl text-xs text-zinc-200 outline-none"
                  />
                  <Button variant="secondary" onClick={handleAddEmail} className="px-4 py-0 rounded-xl text-xs h-11">
                    <Plus size={14} className="mr-1" />
                    Add
                  </Button>
                </div>
              </div>

              {/* Chips Roster */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-400">Assigned Recipients ({emails.length})</label>
                {emails.length > 0 ? (
                  <div className="flex flex-wrap gap-2 p-3 bg-zinc-950/60 border border-zinc-850 rounded-xl min-h-[80px]">
                    {emails.map((email, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-950/30 border border-purple-800/25 text-xs text-purple-300"
                      >
                        {email}
                        <button
                          onClick={() => handleRemoveEmail(idx)}
                          className="text-purple-400 hover:text-red-400 cursor-pointer transition-colors"
                        >
                          <Trash size={10} />
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 border border-dashed border-zinc-850 rounded-xl text-zinc-650 text-xs flex items-center justify-center gap-1">
                    <AlertCircle size={12} />
                    No emails assigned yet.
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* STEP 3: Resources */}
          {step === 3 && (
            <Card className="space-y-6 p-8" hoverable={false}>
              <div>
                <h3 className="text-base font-bold text-zinc-100">Step 3: AI Review Criteria</h3>
                <p className="text-xs text-zinc-400 mt-1">Configure parameters for continuous alignment checking.</p>
              </div>

              {/* Evaluation Criteria */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-400">Evaluation Rules & Constraints</label>
                <textarea
                  rows={4}
                  placeholder="Code must compile. Must export a calculateTotal function. Do not write mock arrays."
                  {...register('evaluationRules')}
                  className="w-full px-4 py-3 bg-zinc-950/60 border border-zinc-800 focus:border-purple-500 rounded-xl text-xs text-zinc-200 outline-none transition-colors resize-none leading-relaxed"
                />
              </div>

              {/* Custom Prompt Context */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-zinc-400">Custom System Instruction (AI Reviewer Context)</label>
                <textarea
                  rows={4}
                  placeholder="Instruct Gemini: E.g. check if code uses map instead of loops. Grade tone to be persuasive..."
                  {...register('customPrompt')}
                  className="w-full px-4 py-3 bg-zinc-950/60 border border-zinc-800 focus:border-purple-500 rounded-xl text-xs text-zinc-200 outline-none transition-colors resize-none leading-relaxed"
                />
              </div>
            </Card>
          )}

          {/* STEP 4: Review & Summary */}
          {step === 4 && (
            <Card className="space-y-6 p-8" hoverable={false}>
              <div>
                <h3 className="text-base font-bold text-zinc-100">Step 4: Summary & Dispatch</h3>
                <p className="text-xs text-zinc-400 mt-1">Verify details below before creating the invitations.</p>
              </div>

              <div className="space-y-4 bg-zinc-900/20 border border-zinc-900 p-5 rounded-2xl text-xs text-zinc-400 space-y-3">
                <div className="flex justify-between border-b border-zinc-900 pb-2">
                  <span className="font-semibold">Task Title:</span>
                  <span className="text-zinc-200 font-bold">{taskTitle || 'Untitled Task'}</span>
                </div>
                <div className="flex justify-between border-b border-zinc-900 pb-2">
                  <span className="font-semibold">Task Type:</span>
                  <span className="text-zinc-200 font-bold uppercase">{taskType}</span>
                </div>
                <div className="flex justify-between border-b border-zinc-900 pb-2">
                  <span className="font-semibold">Invited Candidates:</span>
                  <span className="text-purple-400 font-bold">{emails.length} assignee(s)</span>
                </div>
                <div className="space-y-1.5 pt-2">
                  <span className="font-semibold text-zinc-300">Rules & Instructions:</span>
                  <p className="leading-relaxed line-clamp-3">{taskRules}</p>
                </div>
              </div>

              {/* Email Invite Preview Box */}
              <div className="space-y-2">
                <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider flex items-center gap-1.5">
                  <Mail size={12} className="text-purple-400" />
                  Email Invite Template Preview
                </label>
                <div className="p-5 bg-zinc-950 border border-zinc-850 rounded-2xl text-xs leading-relaxed text-zinc-400 space-y-3">
                  <p className="text-zinc-200 font-bold">Subject: Invitation to complete task: {taskTitle || '[Task Name]'}</p>
                  <div className="border-t border-zinc-900 pt-3 space-y-2">
                    <p>You have been invited to complete a candidate task: <strong>{taskTitle || '[Task Name]'}</strong>.</p>
                    <p>This is a live-monitored task with real-time AI assistance feedback. Click the link below to begin.</p>
                    <div className="py-2.5 px-4 bg-purple-600 text-white rounded-lg font-bold text-center inline-block">
                      Start Task
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Stepper controls */}
          <div className="flex justify-between select-none">
            {step > 1 ? (
              <Button variant="secondary" size="md" onClick={prevStep}>
                <ArrowLeft size={14} className="mr-1.5" />
                Back
              </Button>
            ) : (
              <div />
            )}

            {step < 4 ? (
              <Button variant="primary" size="md" onClick={nextStep}>
                Next
                <ArrowRight size={14} className="ml-1.5" />
              </Button>
            ) : (
              <Button type="submit" variant="primary" size="md" loading={loading}>
                Dispatch Invites
                <Sparkles size={14} className="ml-1.5" />
              </Button>
            )}
          </div>

        </form>
      </main>
    </div>
  );
};

export default CreateTaskWizard;
