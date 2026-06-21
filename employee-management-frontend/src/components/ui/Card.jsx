export default function Card({ children, className = '', lift = false, ...props }) {
  return (
    <div
      className={`glass-card rounded-2xl ${lift ? 'card-lift' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
