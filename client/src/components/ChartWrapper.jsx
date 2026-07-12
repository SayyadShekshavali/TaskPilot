import React from 'react';
import Card from './Card';

const ChartWrapper = ({
  title = '',
  description = '',
  children,
  className = '',
  action
}) => {
  return (
    <Card className={`flex flex-col h-full ${className}`}>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h4 className="text-sm font-bold text-zinc-100">{title}</h4>
          {description && <p className="text-xs text-zinc-400 mt-1">{description}</p>}
        </div>
        {action && <div>{action}</div>}
      </div>
      <div className="flex-1 w-full min-h-[220px]">
        {children}
      </div>
    </Card>
  );
};

export default ChartWrapper;
