import React from 'react';
import Avatar from './Avatar';

const AvatarStack = ({
  users = [], // Array of { name, email, src }
  max = 3,
  size = 'sm',
  className = ''
}) => {
  const visibleUsers = users.slice(0, max);
  const extraCount = users.length - max;

  return (
    <div className={`flex -space-x-2.5 overflow-hidden ${className}`}>
      {visibleUsers.map((user, idx) => (
        <Avatar
          key={user.id || user.email || idx}
          name={user.name}
          email={user.email}
          src={user.src}
          size={size}
          className="ring-2 ring-zinc-950 border-zinc-900"
        />
      ))}
      {extraCount > 0 && (
        <div
          className={`flex items-center justify-center rounded-full bg-zinc-800 text-zinc-400 font-semibold ring-2 ring-zinc-950 border border-zinc-700/50 text-[10px] select-none ${
            size === 'sm' ? 'w-8 h-8' : size === 'md' ? 'w-10 h-10' : 'w-14 h-14'
          }`}
        >
          +{extraCount}
        </div>
      )}
    </div>
  );
};

export default AvatarStack;
