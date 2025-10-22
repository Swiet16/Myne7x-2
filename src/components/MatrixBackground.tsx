export const MatrixBackground = () => {
  return (
    <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-blue-950 to-black">
      {/* Static Grid - No animation */}
      <svg className="absolute inset-0 w-full h-full opacity-5">
        <defs>
          <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
            <path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(34, 211, 238, 0.2)" strokeWidth="0.5"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
      
      {/* Simple gradient overlay - No animation */}
      <div 
        className="absolute inset-0 opacity-5"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(34, 211, 238, 0.1), transparent)',
        }}
      />
    </div>
  );
};