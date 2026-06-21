export default function Badge({ children, className = '' }) {
  return (
    <span className={`inline-flex items-center whitespace-nowrap px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide ${className}`}>
      {children}
    </span>
  );
}
