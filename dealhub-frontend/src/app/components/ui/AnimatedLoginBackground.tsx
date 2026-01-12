export function AnimatedLoginBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Animated gradient base */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0B1F3B] via-[#102A52] to-[#1E40AF] animate-[gradMove_10s_ease-in-out_infinite]" />

      {/* Soft glow overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.35),transparent_50%),radial-gradient(circle_at_80%_70%,rgba(14,165,233,0.28),transparent_50%)]" />

      {/* Floating blobs */}
      <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-sky-400/20 blur-3xl animate-[float1_12s_ease-in-out_infinite]" />
      <div className="absolute top-40 -right-24 h-80 w-80 rounded-full bg-blue-600/20 blur-3xl animate-[float2_14s_ease-in-out_infinite]" />
      <div className="absolute -bottom-24 left-1/3 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl animate-[float3_16s_ease-in-out_infinite]" />

      {/* Subtle grid */}
      <div className="absolute inset-0 opacity-[0.08] [background-image:linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] [background-size:64px_64px]" />

      {/* Keyframes */}
      <style>{`
        @keyframes gradMove {
          0%   { filter: hue-rotate(0deg); transform: scale(1); }
          50%  { filter: hue-rotate(14deg); transform: scale(1.02); }
          100% { filter: hue-rotate(0deg); transform: scale(1); }
        }
        @keyframes float1 {
          0%,100% { transform: translate(0,0); }
          50%     { transform: translate(40px, 30px); }
        }
        @keyframes float2 {
          0%,100% { transform: translate(0,0); }
          50%     { transform: translate(-50px, 20px); }
        }
        @keyframes float3 {
          0%,100% { transform: translate(0,0); }
          50%     { transform: translate(30px, -40px); }
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-\\[gradMove_10s_ease-in-out_infinite\\],
          .animate-\\[float1_12s_ease-in-out_infinite\\],
          .animate-\\[float2_14s_ease-in-out_infinite\\],
          .animate-\\[float3_16s_ease-in-out_infinite\\] {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}
