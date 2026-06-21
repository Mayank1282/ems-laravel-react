export default function Spinner({ size = 'md', className = '' }) {
  const sizes = { sm: 'h-4 w-4 border-2', md: 'h-8 w-8 border-2', lg: 'h-12 w-12 border-[3px]' };
  return (
    <div
      className={`${sizes[size]} animate-spin rounded-full border-violet-500/20 border-t-violet-500 ${className}`}
      style={{ borderStyle: 'solid' }}
    />
  );
}

export function PageLoader() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen app-bg gap-4">
      <div className="relative">
        <div className="h-16 w-16 rounded-full border-[3px] border-violet-500/15 border-t-violet-500 animate-spin" style={{ borderStyle: 'solid' }} />
        <div className="absolute inset-2 rounded-full border-[2px] border-cyan-400/15 border-b-cyan-400 animate-spin" style={{ borderStyle: 'solid', animationDirection: 'reverse', animationDuration: '0.8s' }} />
      </div>
      <p className="text-sm text-slate-500 tracking-widest uppercase">Loading</p>
    </div>
  );
}
