import React from 'react';
import { Terminal as TerminalIcon, ShieldAlert, Sparkles } from 'lucide-react';

const Terminal = ({
  output = '',
  status = 'Completed',
  time = '0.00',
  memory = '0',
  stderr = '',
  className = ''
}) => {
  return (
    <div className={`flex flex-col bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden font-mono text-xs ${className}`}>
      {/* Terminal Title Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-900 border-b border-zinc-800 select-none">
        <div className="flex items-center gap-2 text-zinc-400">
          <TerminalIcon size={14} className="text-purple-400" />
          <span className="font-semibold text-zinc-300">Console / Execution Output</span>
        </div>
        <div className="flex items-center gap-3 text-[10px] text-zinc-500">
          {time && <span>Time: <span className="text-zinc-300">{time}s</span></span>}
          {memory && <span>Mem: <span className="text-zinc-300">{memory} KB</span></span>}
        </div>
      </div>

      {/* Terminal Output Body */}
      <div className="flex-1 p-4 overflow-y-auto min-h-[140px] max-h-[220px] space-y-1 select-text scrollbar-thin">
        {status && (
          <div className="flex items-center gap-1.5 mb-2 font-semibold">
            <span className="text-zinc-500">Status:</span>
            <span className={status === 'Accepted' || status === 'Completed' ? 'text-green-400' : 'text-red-400'}>
              {status}
            </span>
          </div>
        )}
        
        {output ? (
          <pre className="text-zinc-300 whitespace-pre-wrap leading-relaxed">{output}</pre>
        ) : stderr ? (
          <pre className="text-red-400 whitespace-pre-wrap leading-relaxed">{stderr}</pre>
        ) : (
          <div className="text-zinc-600 italic py-2 flex items-center gap-1.5">
            <Sparkles size={12} className="text-zinc-500 animate-pulse" />
            No output yet. Click 'Run Code' to execute.
          </div>
        )}
      </div>
    </div>
  );
};

export default Terminal;
