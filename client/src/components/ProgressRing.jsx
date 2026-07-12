import React from 'react';

const ProgressRing = ({
  progress = 0, // 0 to 100
  size = 64, // diameter in px
  strokeWidth = 6,
  color = 'purple', // 'purple' | 'blue' | 'green' | 'orange' | 'red'
  className = '',
  showValue = true
}) => {
  const roundedProgress = Math.min(Math.max(Math.round(progress), 0), 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (roundedProgress / 100) * circumference;

  const colors = {
    purple: 'stroke-purple-500',
    blue: 'stroke-blue-500',
    green: 'stroke-green-500',
    orange: 'stroke-orange-500',
    red: 'stroke-red-500'
  };

  const textColors = {
    purple: 'text-purple-400',
    blue: 'text-blue-400',
    green: 'text-green-400',
    orange: 'text-orange-400',
    red: 'text-red-400'
  };

  const activeColor = colors[color] || colors.purple;
  const activeTextColor = textColors[color] || textColors.purple;

  return (
    <div className={`relative flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        {/* Background track circle */}
        <circle
          className="stroke-zinc-800"
          strokeWidth={strokeWidth}
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        {/* Progress indicator circle */}
        <circle
          className={`transition-all duration-500 ease-out ${activeColor}`}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      {showValue && (
        <span className={`absolute text-xs font-bold jetbrains-mono ${activeTextColor}`}>
          {roundedProgress}%
        </span>
      )}
    </div>
  );
};

export default ProgressRing;
