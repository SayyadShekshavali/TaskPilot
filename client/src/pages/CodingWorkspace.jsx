import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { motion } from 'framer-motion';
import { 
  Play, CheckSquare, FolderOpen, FileText, ChevronRight, 
  Sparkles, FileCode, Plus, Trash2, ArrowLeft, Loader2, Save 
} from 'lucide-react';
import toast from 'react-hot-toast';
import useWorkspaceStore from '../store/workspaceStore';
import Terminal from '../components/Terminal';
import Card from '../components/Card';
import Badge from '../components/Badge';
import ProgressRing from '../components/ProgressRing';
import Button from '../components/Button';

const CodingWorkspace = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const {
    task,
    status,
    workspaceState,
    aiFeedback,
    testResults,
    timeElapsed,
    isSaving,
    isRunningCode,
    isSubmitting,
    initWorkspace,
    updateFile,
    setActiveFile,
    runCode,
    submitTask,
    incrementTime,
    cleanupWorkspace
  } = useWorkspaceStore();

  const [newFileName, setNewFileName] = useState('');
  const [showAddFile, setShowAddFile] = useState(false);
  const [editorLine, setEditorLine] = useState(1);

  useEffect(() => {
    initWorkspace(id);
    
    // Timer interval
    const timer = setInterval(() => {
      incrementTime();
    }, 1000);

    return () => {
      clearInterval(timer);
      cleanupWorkspace();
    };
  }, [id]);

  const activeFile = workspaceState.activeFile || 'index.js';
  const files = workspaceState.files || {};
  const currentCode = files[activeFile] || '';

  const [showExplorer, setShowExplorer] = useState(true);
  const [showAI, setShowAI] = useState(true);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setShowExplorer(false);
        setShowAI(false);
      } else {
        setShowExplorer(true);
        setShowAI(true);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const formatTime = (sec) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAddFile = (e) => {
    e.preventDefault();
    if (!newFileName.trim()) return;
    
    // Add file with default template
    updateFile(newFileName, `// File: ${newFileName}\n`);
    setActiveFile(newFileName);
    setNewFileName('');
    setShowAddFile(false);
    toast.success(`Created: ${newFileName}`);
  };

  const handleDeleteFile = (filename) => {
    if (Object.keys(files).length <= 1) {
      toast.error('Workspace must contain at least one file.');
      return;
    }
    
    // Delete file
    const newFiles = { ...files };
    delete newFiles[filename];
    
    const remaining = Object.keys(newFiles);
    workspaceState.files = newFiles;
    workspaceState.activeFile = remaining[0];
    setActiveFile(remaining[0]);
    toast.success(`Deleted: ${filename}`);
  };

  const replaceFunctionBlock = (fileContent, signatureLine, suggestion) => {
    const lines = fileContent.split('\n');
    const startIndex = lines.findIndex(l => l.trim() === signatureLine.trim());
    if (startIndex === -1) return null;

    let endIndex = startIndex;
    const startLine = lines[startIndex];
    const startIndent = startLine.length - startLine.trimStart().length;

    // Determine syntax structure (Python vs JS/Java/C)
    const isPython = signatureLine.includes(':') || signatureLine.includes('def ');
    if (isPython) {
      for (let i = startIndex + 1; i < lines.length; i++) {
        const line = lines[i];
        if (line.trim() === '') continue;
        const lineIndent = line.length - line.trimStart().length;
        if (lineIndent <= startIndent) {
          break;
        }
        endIndex = i;
      }
    } else {
      let braceCount = 0;
      let foundBrace = false;
      for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i];
        braceCount += (line.match(/\{/g) || []).length;
        braceCount -= (line.match(/\}/g) || []).length;
        if (braceCount > 0) foundBrace = true;
        endIndex = i;
        if (foundBrace && braceCount <= 0) {
          break;
        }
      }
    }

    const before = lines.slice(0, startIndex);
    const after = lines.slice(endIndex + 1);
    return [...before, suggestion, ...after].join('\n');
  };

  const handleAcceptSuggestion = (e, issue) => {
    e.stopPropagation();
    if (!issue.suggestion) return;
    
    const filename = issue.file || activeFile;
    const fileContent = files[filename];
    if (fileContent === undefined) {
      toast.error(`File "${filename}" not found in workspace.`);
      return;
    }
    
    const lines = fileContent.split('\n');
    let newContent = '';
    let replaced = false;
    
    // 1. If wrong code target exists in editor, replace it directly
    const normalizeNewlines = (str) => str.replace(/\r\n/g, '\n');
    
    if (issue.target) {
      const normFile = normalizeNewlines(fileContent);
      const normTarget = normalizeNewlines(issue.target);
      const normSug = normalizeNewlines(issue.suggestion);
      
      if (normFile.includes(normTarget)) {
        newContent = normFile.replace(normTarget, normSug);
        replaced = true;
      }
    }
    
    if (!replaced) {
      // 2. Check if the suggestion is a whole file replacement
      const sugTrim = issue.suggestion.trim();
      const isWholeFile = 
        sugTrim.startsWith('import ') || 
        sugTrim.startsWith('package ') || 
        sugTrim.startsWith('import React') ||
        sugTrim.includes('if __name__ == "__main__":') || 
        sugTrim.includes('public static void main') ||
        sugTrim.includes('func main()') ||
        issue.suggestion.split('\n').length > 8;

      if (isWholeFile) {
        newContent = issue.suggestion;
        replaced = true;
      } else {
        // 3. Try to match function signature to replace the block
        const suggestionLines = issue.suggestion.split('\n');
        const firstSugLine = suggestionLines[0].trim();
        const signatureMatch = lines.find(l => l.trim() === firstSugLine);
        
        if (signatureMatch) {
          const blockReplaced = replaceFunctionBlock(fileContent, signatureMatch, issue.suggestion);
          if (blockReplaced) {
            newContent = blockReplaced;
            replaced = true;
          }
        }
        
        if (!replaced && issue.line && issue.line > 0 && issue.line <= lines.length) {
          // Replace specific line (1-indexed)
          lines[issue.line - 1] = issue.suggestion;
          newContent = lines.join('\n');
          replaced = true;
        } else if (!replaced) {
          // 4. Try to find if there is a TODO or pass/placeholder statement to replace (Add required code)
          const todoIndex = lines.findIndex(l => 
            l.includes('TODO') || 
            l.trim() === 'pass' || 
            l.trim() === 'return null;' || 
            l.trim() === 'return;'
          );
          
          if (todoIndex !== -1) {
            lines[todoIndex] = issue.suggestion;
            newContent = lines.join('\n');
            replaced = true;
          }
        }
      }
    }
    
    if (!replaced) {
      // 5. Replace entire file if it's mostly empty or placeholder
      const isBoilerplate = fileContent.includes('TODO') || fileContent.length < 150;
      if (isBoilerplate) {
        newContent = issue.suggestion;
      } else {
        // 6. Append as last resort (Add new code)
        newContent = fileContent + '\n' + issue.suggestion;
      }
    }
    
    updateFile(filename, newContent);
    toast.success('AI Code Suggestion accepted and applied!');
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

  // Helper to highlight line in monaco editor
  const handleIssueClick = (issue) => {
    // If Monaco ref exists, we can focus it, but for standard Monaco we can notify editor
    toast(`Jumping to line ${issue.line} in ${issue.file}`);
  };

  return (
    <div className="h-screen w-full flex flex-col bg-zinc-950 text-zinc-100 overflow-hidden font-sans">
      
      {/* 1. Header Toolbar */}
      <header className="h-14 border-b border-zinc-800 bg-zinc-950 flex items-center justify-between px-6 select-none shrink-0 z-10">
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
          {/* Autosaving badge */}
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

          {/* Time Counter */}
          <div className="px-3 py-1 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-400 jetbrains-mono font-bold">
            Time: {formatTime(timeElapsed)}
          </div>

          <Badge status={status} />

          {/* Panel Toggle buttons */}
          <div className="flex items-center gap-1.5 border-l border-zinc-800 pl-4 mr-2">
            <button
              onClick={() => setShowExplorer(!showExplorer)}
              className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                showExplorer
                  ? 'bg-purple-950/20 text-purple-400 border-purple-900/30'
                  : 'text-zinc-500 border-transparent hover:text-zinc-350'
              }`}
              title="Toggle File Explorer"
            >
              <FolderOpen size={13} />
            </button>
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

          <div className="flex items-center gap-2">
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
        </div>
      </header>

      {/* 2. Three-Panel Layout */}
      <div className="flex-1 flex w-full overflow-hidden relative">
        
        {/* Left Explorer (Width 220px) */}
        {showExplorer && (
          <aside className="w-[220px] bg-zinc-950 border-r border-zinc-800 flex flex-col overflow-y-auto shrink-0 select-none z-20 absolute inset-y-0 left-0 lg:static">
            <div className="px-4 py-3 border-b border-zinc-900 flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider flex items-center gap-1.5">
                <FolderOpen size={12} className="text-purple-400" />
                Files Scaffold
              </span>
              <button
                onClick={() => setShowAddFile(!showAddFile)}
                className="p-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 cursor-pointer"
              >
                <Plus size={12} />
              </button>
            </div>

            {showAddFile && (
              <form onSubmit={handleAddFile} className="p-3 border-b border-zinc-900">
                <input
                  type="text"
                  placeholder="filename.js"
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  className="w-full px-2 py-1 bg-zinc-950 border border-zinc-800 rounded text-xs outline-none text-zinc-200"
                  autoFocus
                />
              </form>
            )}

            {/* File Lists */}
            <div className="p-2 space-y-0.5">
              {Object.keys(files).map((filename) => {
                const isActive = filename === activeFile;
                return (
                  <div
                    key={filename}
                    className={`group flex items-center justify-between px-3 py-2 rounded-xl text-xs cursor-pointer transition-all ${
                      isActive
                        ? 'bg-purple-950/20 text-purple-300 border border-purple-900/30'
                        : 'text-zinc-400 hover:bg-zinc-900/50 hover:text-zinc-200 border border-transparent'
                    }`}
                    onClick={() => setActiveFile(filename)}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FileCode size={13} className={isActive ? 'text-purple-400' : 'text-zinc-500'} />
                      <span className="truncate">{filename}</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteFile(filename);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-0.5 text-zinc-500 hover:text-red-400 transition-opacity cursor-pointer"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                );
              })}
            </div>
          </aside>
        )}

        {/* Center Panel (Monaco Editor + Console) */}
        <main className="flex-1 flex flex-col overflow-hidden bg-zinc-900">
          {/* Active File Tab Title Bar */}
          <div className="h-9 bg-zinc-950 border-b border-zinc-800 flex items-center px-4 select-none shrink-0">
            <span className="text-[10px] text-zinc-400 font-mono flex items-center gap-1.5">
              <ChevronRight size={10} className="text-zinc-500" />
              {activeFile}
            </span>
          </div>

          {/* Monaco Editor Container */}
          <div className="flex-1 w-full bg-[#1e1e1e] relative">
            <Editor
              height="100%"
              theme="vs-dark"
              language="javascript"
              value={currentCode}
              onChange={(value) => updateFile(activeFile, value || '')}
              options={{
                fontSize: 13,
                fontFamily: 'JetBrains Mono',
                minimap: { enabled: false },
                lineNumbersMinChars: 3,
                padding: { top: 12 },
                scrollbar: { vertical: 'visible', horizontal: 'visible' },
                automaticLayout: true
              }}
            />

            {/* Floating Run Code button at the bottom-right of the code editor */}
            <div className="absolute right-4 bottom-4 z-10">
              <Button
                variant="primary"
                size="sm"
                className="h-8 px-4 rounded-xl text-xs font-bold shadow-lg shadow-purple-600/35 border border-purple-500/30"
                onClick={runCode}
                loading={isRunningCode}
              >
                <Play size={12} className="mr-1.5 fill-current" />
                Run Code
              </Button>
            </div>
          </div>

          {/* Resizable bottom terminal console */}
          <div className="h-[220px] shrink-0 border-t border-zinc-800">
            <Terminal
              output={testResults?.stdout}
              stderr={testResults?.stderr}
              status={testResults?.status}
              time={testResults?.time}
              memory={testResults?.memory}
              className="h-full border-none rounded-none"
            />
          </div>
        </main>

        {/* Right Panel (AI Assistant - Width 320px) */}
        {showAI && (
          <aside className="w-[320px] bg-zinc-950 border-l border-zinc-800 flex flex-col overflow-hidden shrink-0 select-none z-20 absolute inset-y-0 right-0 lg:static">
            <div className="px-4 py-4 border-b border-zinc-900 flex items-center gap-2">
              <Sparkles size={16} className="text-purple-400" />
            <h3 className="text-sm font-bold text-zinc-200">AI Assistant Panel</h3>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin">
            {/* Score circle */}
            <div className="flex items-center gap-4 bg-zinc-900/40 border border-zinc-850 p-4 rounded-2xl">
              <ProgressRing
                progress={aiFeedback?.score || 0}
                size={56}
                strokeWidth={5}
                color={status === 'issues-flagged' ? 'red' : 'purple'}
              />
              <div className="flex-1 space-y-1">
                <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">AI Accuracy Score</span>
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
                          onClick={() => handleIssueClick(issue)}
                          className="p-3.5 rounded-2xl border border-red-950/20 bg-red-950/5 flex flex-col gap-1.5 cursor-pointer hover:bg-red-950/10 transition-all"
                        >
                          <span className="text-[9px] uppercase font-extrabold tracking-wider text-red-500 font-mono">
                            Alignment Issue
                          </span>
                          <p className="text-xs font-semibold text-red-400 leading-normal">
                            {issue.message}
                          </p>
                          {issue.file && (
                            <div className="flex items-center justify-between mt-1 pt-1.5 border-t border-red-900/10 text-[9px] text-zinc-550 font-mono">
                              <span>File: {issue.file}</span>
                              {issue.line && <span>Line {issue.line}</span>}
                            </div>
                          )}
                          {issue.suggestion && (
                            <div 
                              className="mt-2.5 space-y-2 p-2.5 rounded-lg bg-zinc-950 border border-zinc-850"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <span className="text-[9px] uppercase font-bold text-purple-400">Suggested Correction</span>
                              <pre className="text-[10px] leading-relaxed text-zinc-300 font-mono overflow-x-auto max-w-full p-2 bg-zinc-900 rounded border border-zinc-850">
                                {issue.suggestion}
                              </pre>
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

              {/* 2. Syntax Issues Section */}
              {(() => {
                const syntaxIssues = (aiFeedback?.issues || []).filter(i => i.type === 'syntax');
                if (syntaxIssues.length > 0) {
                  return (
                    <div className="space-y-2">
                      {syntaxIssues.map((issue, idx) => (
                        <div
                          key={`syntax-${idx}`}
                          onClick={() => handleIssueClick(issue)}
                          className="p-3.5 rounded-2xl border border-red-950/20 bg-red-950/5 flex flex-col gap-1.5 cursor-pointer hover:bg-red-950/10 transition-all"
                        >
                          <span className="text-[9px] uppercase font-extrabold tracking-wider text-red-500 font-mono">
                            Syntax Error
                          </span>
                          <p className="text-xs font-semibold text-red-400 leading-normal">
                            {issue.message}
                          </p>
                          {issue.file && (
                            <div className="flex items-center justify-between mt-1 pt-1.5 border-t border-red-900/10 text-[9px] text-zinc-550 font-mono">
                              <span>File: {issue.file}</span>
                              {issue.line && <span>Line {issue.line}</span>}
                            </div>
                          )}
                          {issue.suggestion && (
                            <div 
                              className="mt-2.5 space-y-2 p-2.5 rounded-lg bg-zinc-950 border border-zinc-850"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <span className="text-[9px] uppercase font-bold text-purple-400">Suggested Correction</span>
                              <pre className="text-[10px] leading-relaxed text-zinc-300 font-mono overflow-x-auto max-w-full p-2 bg-zinc-900 rounded border border-zinc-850">
                                {issue.suggestion}
                              </pre>
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

export default CodingWorkspace;
