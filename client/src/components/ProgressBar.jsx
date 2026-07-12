import React from 'react';

const ProgressBar = ({
  progress = 0, // 0 to 100
  color = 'purple', // 'purple' | 'blue' | 'green' | 'orange' | 'red'
  className = '',
  showLabel = false
}) => {
  const roundedProgress = Math.min(Math.max(Math.round(progress), 0), 100);

  const colors = {
    purple: 'bg-purple-600 shadow-[0_0_10px_rgba(168,85,247,0.4)]',
    blue: 'bg-blue-600 shadow-[0_0_10px_rgba(59,130,246,0.4)]',
    green: 'bg-green-600 shadow-[0_0_10px_rgba(34,197,94,0.4)]',
    orange: 'bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.4)]',
    red: 'bg-red-600 shadow-[0_0_10px_rgba(239,68,68,0.4)]'
  };

  const activeColor = colors[color] || colors.purple;

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex justify-between items-center mb-1 text-xs text-zinc-400 font-semibold jetbrains-mono">
          <span>Progress</span>
          <span>{roundedProgress}%</span>
        </div>
      )}
      <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden border border-zinc-700/30">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${activeColor}`}
          style={{ width: `${roundedProgress}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
