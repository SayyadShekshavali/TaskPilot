import React from 'react';

const Skeleton = ({
  variant = 'text', // 'text' | 'card' | 'circle' | 'rect'
  className = '',
  count = 1
}) => {
  const baseClass = 'bg-zinc-800/80 animate-pulse rounded-md border border-zinc-700/20';

  const variants = {
    text: 'h-4 w-full my-2',
    card: 'h-[160px] rounded-[24px]',
    circle: 'rounded-full h-10 w-10',
    rect: 'h-8 w-full'
  };

  const currentClass = variants[variant] || variants.text;

  const renderSingle = (index) => (
    <div key={index} className={`${baseClass} ${currentClass} ${className}`} />
  );

  return (
    <>
      {Array.from({ length: count }).map((_, idx) => renderSingle(idx))}
    </>
  );
};

export default Skeleton;
export const DashboardSkeleton = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <Skeleton variant="card" count={4} className="h-[120px]" />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Skeleton variant="card" className="h-[300px] md:col-span-2" />
      <Skeleton variant="card" className="h-[300px]" />
    </div>
  </div>
);

export const WorkspaceSkeleton = () => (
  <div className="h-screen w-full flex flex-col bg-zinc-950 p-4 space-y-4">
    <Skeleton variant="rect" className="h-14 rounded-2xl" />
    <div className="flex-1 flex gap-4">
      <Skeleton variant="rect" className="w-[240px] h-full rounded-2xl" />
      <Skeleton variant="rect" className="flex-1 h-full rounded-2xl" />
      <Skeleton variant="rect" className="w-[340px] h-full rounded-2xl" />
    </div>
  </div>
);
