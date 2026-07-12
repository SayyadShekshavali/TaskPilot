import React from 'react';
import { Calendar, CheckCircle2, ShieldAlert, FileCode2, Play } from 'lucide-react';

const Timeline = ({
  items = [] // Array of { title, description, timestamp, status }
}) => {
  const getIcon = (status) => {
    switch (status) {
      case 'completed':
      case 'approved':
        return <CheckCircle2 className="text-green-400" size={16} />;
      case 'issues-flagged':
      case 'failed':
        return <ShieldAlert className="text-red-400" size={16} />;
      case 'in-progress':
        return <Play className="text-blue-400 animate-pulse" size={16} />;
      case 'started':
      default:
        return <FileCode2 className="text-purple-400" size={16} />;
    }
  };

  const getBorderColor = (status) => {
    switch (status) {
      case 'completed':
      case 'approved':
        return 'border-green-500/30';
      case 'issues-flagged':
      case 'failed':
        return 'border-red-500/30';
      case 'in-progress':
        return 'border-blue-500/30';
      case 'started':
      default:
        return 'border-purple-500/30';
    }
  };

  return (
    <div className="relative border-l border-zinc-800 ml-3 pl-6 space-y-6">
      {items.map((item, index) => (
        <div key={index} className="relative group">
          {/* Node marker */}
          <div className={`absolute -left-[35px] top-0.5 flex items-center justify-center w-8 h-8 rounded-full bg-zinc-900 border ${getBorderColor(item.status)}`}>
            {getIcon(item.status)}
          </div>
          
          {/* Node content */}
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-4">
              <h4 className="text-sm font-semibold text-zinc-200">{item.title}</h4>
              <span className="text-[10px] text-zinc-500 jetbrains-mono">
                {item.timestamp ? new Date(item.timestamp).toLocaleString() : ''}
              </span>
            </div>
            {item.description && (
              <p className="text-xs text-zinc-400 leading-relaxed">{item.description}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default Timeline;
