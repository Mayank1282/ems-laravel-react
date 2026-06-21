import { getInitials } from '../../utils/helpers';

const sizes = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-lg',
  xl: 'w-20 h-20 text-2xl',
};

export default function Avatar({ name = '', src, size = 'md', className = '' }) {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`${sizes[size]} rounded-full object-cover flex-shrink-0 ring-2 ring-violet-500/20 ${className}`}
      />
    );
  }

  return (
    <div
      className={`${sizes[size]} rounded-full flex items-center justify-center font-bold flex-shrink-0 ${className}`}
      style={{ background: 'linear-gradient(135deg, #7C3AED, #4338CA)', color: 'white', boxShadow: '0 0 14px rgba(124,58,237,0.35)' }}
    >
      {getInitials(name)}
    </div>
  );
}
