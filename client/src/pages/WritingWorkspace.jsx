import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, Bold, Italic, Underline as UnderlineIcon, 
  List, ListOrdered, Undo, Redo, Sparkles, CheckSquare, 
  Loader2, Save, FileText, BarChart
} from 'lucide-react';
import toast from 'react-hot-toast';
import useWorkspaceStore from '../store/workspaceStore';
import Card from '../components/Card';
import Badge from '../components/Badge';
import ProgressRing from '../components/ProgressRing';
import Button from '../components/Button';

const WritingWorkspace = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const {
    task,
    status,
    workspaceState,
    aiFeedback,
    timeElapsed,
    isSaving,
    isSubmitting,
    initWorkspace,
    updateWritingContent,
    submitTask,
    incrementTime,
    cleanupWorkspace
  } = useWorkspaceStore();

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline
    ],
    content: '',
    onUpdate: ({ editor }) => {
      updateWritingContent(editor.getHTML());
    }
  });

  useEffect(() => {
    async function loadData() {
      await initWorkspace(id);
    }
    loadData();
    
    const timer = setInterval(() => {
      incrementTime();
    }, 1000);

    return () => {
      clearInterval(timer);
      cleanupWorkspace();
    };
  }, [id]);

  const [showAI, setShowAI] = useState(true);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setShowAI(false);
      } else {
        setShowAI(true);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Set editor content once loaded
  useEffect(() => {
    if (editor && workspaceState.content && !editor.isFocused) {
      editor.commands.setContent(workspaceState.content);
    }
  }, [workspaceState.content, editor]);

  const formatTime = (sec) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getWordCount = () => {
    if (!editor) return 0;
    const text = editor.getText().trim();
    return text ? text.split(/\s+/).length : 0;
  };

  const getCharCount = () => {
    if (!editor) return 0;
    return editor.getText().length;
  };

  const handleAcceptSuggestion = (e, issue) => {
    e.stopPropagation();
    if (!issue.suggestion) return;
    
    if (editor) {
      editor.commands.focus();
      // Insert suggestion directly into rich text editor content
      editor.commands.insertContent(issue.suggestion);
      toast.success('AI Writing Suggestion accepted and inserted!');
    }
  };

  const onSubmit = async () => {
    const proceed = window.confirm('Are you sure you want to finalize your submission? This locks the workspace.');
    if (!proceed) return;

    const success = await submitTask();
    if (success) {
      toast.success('Task submitted successfully!');
      navigate('/candidate/success');
    } else {
      toast.error('Failed to submit task.');
    }
  };

  return (
    <div className="h-screen w-full flex flex-col bg-zinc-950 text-zinc-100 overflow-hidden font-sans">
      
      {/* 1. Header Toolbar */}
      <header className="h-14 border-b border-zinc-800 bg-zinc-950 flex items-center justify-between px-6 shrink-0 z-10 select-none">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/candidate/home')}
            className="p-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 cursor-pointer transition-all"
          >
            <ArrowLeft size={14} />
          </button>
          <div className="flex flex-col">
            <h1 className="text-xs font-bold text-zinc-100">{task?.title || 'Loading task...'}</h1>
            <span className="text-[9px] text-zinc-500 font-mono">Assigned Assessment Workspace</span>
          </div>
        </div>

        {/* Status indicators */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-semibold jetbrains-mono">
            {isSaving ? (
              <>
                <Loader2 size={12} className="animate-spin text-purple-400" />
                <span>Autosaving...</span>
              </>
            ) : (
              <>
                <Save size={12} className="text-zinc-600" />
                <span>Saved</span>
              </>
            )}
          </div>

          <div className="px-3 py-1 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-400 jetbrains-mono font-bold">
            Time: {formatTime(timeElapsed)}
          </div>

          <Badge status={status} />

          {/* Panel Toggle button */}
          <div className="flex items-center gap-1.5 border-l border-zinc-800 pl-4 mr-2">
            <button
              onClick={() => setShowAI(!showAI)}
              className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                showAI
                  ? 'bg-purple-950/20 text-purple-400 border-purple-900/30'
                  : 'text-zinc-500 border-transparent hover:text-zinc-350'
              }`}
              title="Toggle AI Diagnostics Panel"
            >
              <Sparkles size={13} />
            </button>
          </div>

          <Button
            variant="primary"
            size="sm"
            className="h-8 py-0 px-3 text-xs"
            onClick={onSubmit}
            loading={isSubmitting}
          >
            <CheckSquare size={12} className="mr-1" />
            Submit Task
          </Button>
        </div>
      </header>

      {/* 2. Text Editor Formatting Toolbar */}
      <div className="h-11 bg-zinc-900 border-b border-zinc-800 flex items-center px-6 gap-2 shrink-0 select-none">
        <button
          onClick={() => editor?.chain().focus().toggleBold().run()}
          className={`p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 cursor-pointer ${
            editor?.isActive('bold') ? 'bg-zinc-800 text-purple-400' : ''
          }`}
        >
          <Bold size={14} />
        </button>
        <button
          onClick={() => editor?.chain().focus().toggleItalic().run()}
          className={`p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 cursor-pointer ${
            editor?.isActive('italic') ? 'bg-zinc-800 text-purple-400' : ''
          }`}
        >
          <Italic size={14} />
        </button>
        <button
          onClick={() => editor?.chain().focus().toggleUnderline().run()}
          className={`p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 cursor-pointer ${
            editor?.isActive('underline') ? 'bg-zinc-800 text-purple-400' : ''
          }`}
        >
          <UnderlineIcon size={14} />
        </button>
        <span className="w-px h-5 bg-zinc-800 mx-1" />
        <button
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
          className={`p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 cursor-pointer ${
            editor?.isActive('bulletList') ? 'bg-zinc-800 text-purple-400' : ''
          }`}
        >
          <List size={14} />
        </button>
        <button
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
          className={`p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 cursor-pointer ${
            editor?.isActive('orderedList') ? 'bg-zinc-800 text-purple-400' : ''
          }`}
        >
          <ListOrdered size={14} />
        </button>
        <span className="w-px h-5 bg-zinc-800 mx-1" />
        <button
          onClick={() => editor?.chain().focus().undo().run()}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 cursor-pointer"
        >
          <Undo size={14} />
        </button>
        <button
          onClick={() => editor?.chain().focus().redo().run()}
          className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 cursor-pointer"
        >
          <Redo size={14} />
        </button>
      </div>

      {/* 3. Editor Body & Panel Split */}
      <div className="flex-1 flex w-full overflow-hidden">
        
        {/* Left Side: TipTap Editor */}
        <main className="flex-1 overflow-y-auto bg-zinc-950 p-12 flex flex-col items-center">
          <div className="w-full max-w-2xl bg-zinc-900/10 border border-zinc-900 rounded-[24px] p-8 min-h-[500px]">
            <EditorContent editor={editor} className="outline-none text-zinc-200 leading-relaxed text-sm prose prose-invert max-w-none" />
          </div>
          
          {/* Metrics bar */}
          <div className="w-full max-w-2xl mt-4 px-4 flex items-center justify-between text-[11px] text-zinc-500 font-mono">
            <span className="flex items-center gap-1.5">
              <FileText size={12} />
              {getWordCount()} words
            </span>
            <span>{getCharCount()} characters</span>
          </div>
        </main>

        {/* Right Side: AI Panel */}
        {showAI && (
          <aside className="w-[320px] bg-zinc-950 border-l border-zinc-800 flex flex-col overflow-hidden shrink-0 select-none z-20 absolute inset-y-0 right-0 lg:static">
            <div className="px-4 py-4 border-b border-zinc-900 flex items-center gap-2">
              <Sparkles size={16} className="text-purple-400" />
              <h3 className="text-sm font-bold text-zinc-200">AI Assistant Panel</h3>
            </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin">
            {/* Score Ring */}
            <div className="flex items-center gap-4 bg-zinc-900/40 border border-zinc-850 p-4 rounded-2xl">
              <ProgressRing
                progress={aiFeedback?.score || 0}
                size={56}
                strokeWidth={5}
                color={status === 'issues-flagged' ? 'red' : 'purple'}
              />
              <div className="flex-1 space-y-1">
                <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Tone & Readability</span>
                <p className="text-xs text-zinc-300 leading-relaxed font-semibold">
                  {aiFeedback?.score ? `${aiFeedback.score}/100 points` : 'Calculating score...'}
                </p>
              </div>
            </div>

            {/* Unified AI Evaluation diagnostics panel */}
            <div className="space-y-4">
              <h4 className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">AI Evaluation Diagnostics</h4>
              
              {/* 1. Alignment Issues Section */}
              {(() => {
                const alignmentIssues = (aiFeedback?.issues || []).filter(i => i.type !== 'syntax');
                if (alignmentIssues.length > 0) {
                  return (
                    <div className="space-y-2">
                      {alignmentIssues.map((issue, idx) => (
                        <div
                          key={`align-${idx}`}
                          className="p-3.5 rounded-2xl border border-red-950/20 bg-red-950/5 flex flex-col gap-1.5"
                        >
                          <span className="text-[9px] uppercase font-extrabold tracking-wider text-red-500 font-mono">
                            Alignment Issue
                          </span>
                          <p className="text-xs font-semibold text-red-400 leading-normal">
                            {issue.message}
                          </p>
                          {issue.suggestion && (
                            <div className="mt-2.5 space-y-2 p-2.5 rounded-lg bg-zinc-950 border border-zinc-850">
                              <span className="text-[9px] uppercase font-bold text-purple-400">Suggested Correction</span>
                              <p className="text-[11px] leading-relaxed text-zinc-355 p-2 bg-zinc-900 rounded border border-zinc-850">
                                {issue.suggestion}
                              </p>
                              <Button
                                variant="primary"
                                size="sm"
                                className="w-full h-7 text-[10px] font-bold mt-1 bg-purple-600 hover:bg-purple-700"
                                onClick={(e) => handleAcceptSuggestion(e, issue)}
                              >
                                Accept Suggestion
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  );
                } else {
                  return (
                    <div className="p-3.5 rounded-2xl border border-green-950/20 bg-green-950/5 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                      <span className="text-xs font-semibold text-green-405">No alignment issues found</span>
                    </div>
                  );
                }
              })()}

              {/* 2. Syntax/Grammar Issues Section */}
              {(() => {
                const syntaxIssues = (aiFeedback?.issues || []).filter(i => i.type === 'syntax');
                if (syntaxIssues.length > 0) {
                  return (
                    <div className="space-y-2">
                      {syntaxIssues.map((issue, idx) => (
                        <div
                          key={`syntax-${idx}`}
                          className="p-3.5 rounded-2xl border border-red-950/20 bg-red-950/5 flex flex-col gap-1.5"
                        >
                          <span className="text-[9px] uppercase font-extrabold tracking-wider text-red-500 font-mono">
                            Syntax Error
                          </span>
                          <p className="text-xs font-semibold text-red-400 leading-normal">
                            {issue.message}
                          </p>
                          {issue.suggestion && (
                            <div className="mt-2.5 space-y-2 p-2.5 rounded-lg bg-zinc-950 border border-zinc-850">
                              <span className="text-[9px] uppercase font-bold text-purple-400">Suggested Correction</span>
                              <p className="text-[11px] leading-relaxed text-zinc-355 p-2 bg-zinc-900 rounded border border-zinc-850">
                                {issue.suggestion}
                              </p>
                              <Button
                                variant="primary"
                                size="sm"
                                className="w-full h-7 text-[10px] font-bold mt-1 bg-purple-600 hover:bg-purple-700"
                                onClick={(e) => handleAcceptSuggestion(e, issue)}
                              >
                                Accept Suggestion
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  );
                } else {
                  return (
                    <div className="p-3.5 rounded-2xl border border-green-950/20 bg-green-950/5 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                      <span className="text-xs font-semibold text-green-405">No syntax errors found</span>
                    </div>
                  );
                }
              })()}
            </div>

          </div>
        </aside>
      )}

      </div>
    </div>
  );
};

export default WritingWorkspace;
