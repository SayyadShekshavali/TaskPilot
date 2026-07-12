import React from 'react';

const Avatar = ({
  name = '',
  email = '',
  src = '',
  size = 'md', // 'sm' | 'md' | 'lg'
  className = ''
}) => {
  // Extract initials
  const getInitials = () => {
    if (name) {
      const parts = name.split(/\s+/);
      if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
      }
      return name.slice(0, 2).toUpperCase();
    }
    if (email) {
      return email.slice(0, 2).toUpperCase();
    }
    return 'TP';
  };

  // Generate color hash based on name/email
  const getColorHashClass = () => {
    const str = name || email || 'TP';
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % 5;
    const gradients = [
      'from-purple-600 to-indigo-700 text-purple-100 border-purple-500/30',
      'from-blue-600 to-cyan-700 text-blue-100 border-blue-500/30',
      'from-emerald-600 to-teal-700 text-emerald-100 border-emerald-500/30',
      'from-orange-600 to-amber-700 text-orange-100 border-orange-500/30',
      'from-red-600 to-rose-700 text-red-100 border-red-500/30'
    ];
    return gradients[index];
  };

  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-lg font-bold'
  };

  const initials = getInitials();
  const gradient = getColorHashClass();

  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-full overflow-hidden border bg-gradient-to-br font-semibold shadow-inner ${sizes[size]} ${gradient} ${className}`}
    >
      {src ? (
        <img className="w-full h-full object-cover" src={src} alt={name || email} />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
};

export default Avatar;
