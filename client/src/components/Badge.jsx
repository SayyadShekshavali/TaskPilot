import React from 'react';

const Badge = ({
  status = 'not-started', // 'not-started' | 'in-progress' | 'issues-flagged' | 'under-review' | 'completed' | 'approved' | 'needs-revision'
  text = '',
  className = ''
}) => {
  const statusMap = {
    'not-started': {
      label: 'Not Started',
      style: 'bg-zinc-800/80 text-zinc-400 border-zinc-700/50'
    },
    'in-progress': {
      label: 'In Progress',
      style: 'bg-blue-950/40 text-blue-400 border-blue-800/30'
    },
    'issues-flagged': {
      label: 'Issues Flagged',
      style: 'bg-red-950/40 text-red-400 border-red-800/30 font-semibold'
    },
    'under-review': {
      label: 'Under Review',
      style: 'bg-orange-950/40 text-orange-400 border-orange-800/30'
    },
    'completed': {
      label: 'Completed',
      style: 'bg-green-950/40 text-green-400 border-green-800/30 font-semibold'
    },
    'approved': {
      label: 'Approved',
      style: 'bg-green-950/40 text-green-400 border-green-800/30 font-semibold'
    },
    'needs-revision': {
      label: 'Needs Revision',
      style: 'bg-orange-950/40 text-orange-400 border-orange-800/30'
    }
  };

  const current = statusMap[status] || statusMap['not-started'];
  const label = text || current.label;

  return (
    <span className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded-full border ${current.style} ${className}`}>
      {/* Dynamic blinking pulse dot for working states */}
      {(status === 'in-progress' || status === 'issues-flagged') && (
        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 animate-pulse ${status === 'in-progress' ? 'bg-blue-400' : 'bg-red-400'}`} />
      )}
      {label}
    </span>
  );
};

export default Badge;
