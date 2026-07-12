import React from 'react';
import { Sparkles } from 'lucide-react';

const EmptyState = ({
  icon: Icon = Sparkles,
  title = 'No tasks found',
  description = 'Try adjusting your search filters or create a new assignment to get started.',
  action,
  className = ''
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-12 text-center rounded-[24px] bg-gradient-to-b from-zinc-900/40 to-zinc-950/80 border border-zinc-800/40 glass-panel ${className}`}>
      <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-zinc-800/40 border border-zinc-700/30 text-purple-400 mb-4 animate-pulse">
        <Icon size={24} />
      </div>
      <h3 className="text-base font-semibold text-zinc-100 mb-1">{title}</h3>
      <p className="text-sm text-zinc-400 max-w-sm mb-6 leading-relaxed">{description}</p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
};

export default EmptyState;
