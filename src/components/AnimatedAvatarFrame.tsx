import { motion } from "framer-motion";
import { ReactNode } from "react";

interface AnimatedAvatarFrameProps {
  children: ReactNode;
  userId?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

// Generate unique animation based on user ID
const getUniqueAnimation = (userId?: string) => {
  if (!userId) return 0;
  
  // Create a hash from userId
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = ((hash << 5) - hash) + userId.charCodeAt(i);
    hash = hash & hash;
  }
  
  // Return a value between 0-5 for different animation styles
  return Math.abs(hash % 6);
};

// Generate unique colors based on user ID
const getUniqueColors = (userId?: string) => {
  if (!userId) {
    return {
      gradient: "from-blue-400 via-purple-500 to-pink-500",
      glow: "rgba(147, 51, 234, 0.4)",
      border: "#8b5cf6"
    };
  }
  
  const hash = Math.abs(userId.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0));
  
  const colorSchemes = [
    {
      gradient: "from-blue-400 via-cyan-500 to-teal-500",
      glow: "rgba(6, 182, 212, 0.4)",
      border: "#06b6d4"
    },
    {
      gradient: "from-purple-400 via-pink-500 to-rose-500",
      glow: "rgba(236, 72, 153, 0.4)",
      border: "#ec4899"
    },
    {
      gradient: "from-orange-400 via-red-500 to-pink-500",
      glow: "rgba(239, 68, 68, 0.4)",
      border: "#ef4444"
    },
    {
      gradient: "from-green-400 via-emerald-500 to-teal-500",
      glow: "rgba(16, 185, 129, 0.4)",
      border: "#10b981"
    },
    {
      gradient: "from-indigo-400 via-blue-500 to-cyan-500",
      glow: "rgba(59, 130, 246, 0.4)",
      border: "#3b82f6"
    },
    {
      gradient: "from-yellow-400 via-orange-500 to-red-500",
      glow: "rgba(249, 115, 22, 0.4)",
      border: "#f97316"
    },
    {
      gradient: "from-fuchsia-400 via-purple-500 to-indigo-500",
      glow: "rgba(168, 85, 247, 0.4)",
      border: "#a855f7"
    },
    {
      gradient: "from-lime-400 via-green-500 to-emerald-500",
      glow: "rgba(34, 197, 94, 0.4)",
      border: "#22c55e"
    }
  ];
  
  return colorSchemes[hash % colorSchemes.length];
};

export const AnimatedAvatarFrame = ({ children, userId, size = "md", className = "" }: AnimatedAvatarFrameProps) => {
  const animationType = getUniqueAnimation(userId);
  const colors = getUniqueColors(userId);
  
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-16 h-16"
  };
  
  const paddingClasses = {
    sm: "p-0.5",
    md: "p-[3px]",
    lg: "p-1"
  };
  
  // Different animation patterns
  const animations = [
    // Rotating gradient
    {
      animate: { rotate: 360 },
      transition: { duration: 4, repeat: Infinity, ease: "linear" }
    },
    // Pulsing scale
    {
      animate: { scale: [1, 1.1, 1] },
      transition: { duration: 2, repeat: Infinity, ease: "easeInOut" }
    },
    // Rotating with pulse
    {
      animate: { rotate: 360, scale: [1, 1.05, 1] },
      transition: { duration: 5, repeat: Infinity, ease: "easeInOut" }
    },
    // Reverse rotation
    {
      animate: { rotate: -360 },
      transition: { duration: 6, repeat: Infinity, ease: "linear" }
    },
    // Wave effect
    {
      animate: { rotate: [0, 10, -10, 0] },
      transition: { duration: 3, repeat: Infinity, ease: "easeInOut" }
    },
    // Breathing glow
    {
      animate: { scale: [1, 1.08, 1], opacity: [1, 0.8, 1] },
      transition: { duration: 2.5, repeat: Infinity, ease: "easeInOut" }
    }
  ];
  
  const selectedAnimation = animations[animationType];
  
  return (
    <div className={`relative ${className}`}>
      {/* Outer rotating glow */}
      <motion.div
        className="absolute -inset-1.5"
        {...selectedAnimation}
      >
        <div 
          className={`w-full h-full rounded-full bg-gradient-to-r ${colors.gradient} opacity-60 blur-md`}
        />
      </motion.div>
      
      {/* Middle animated ring */}
      <motion.div
        className="absolute -inset-1 rounded-full"
        animate={{ 
          rotate: animationType % 2 === 0 ? 360 : -360,
          scale: [1, 1.05, 1]
        }}
        transition={{ 
          rotate: { duration: 8, repeat: Infinity, ease: "linear" },
          scale: { duration: 3, repeat: Infinity, ease: "easeInOut" }
        }}
      >
        <div 
          className={`w-full h-full rounded-full border-2 opacity-50`}
          style={{ 
            borderColor: colors.border,
            background: `linear-gradient(45deg, transparent 40%, ${colors.glow} 50%, transparent 60%)`
          }}
        />
      </motion.div>
      
      {/* Decorative sparkles */}
      <motion.div
        className="absolute -top-1 -right-1 text-xs z-20"
        animate={{ 
          scale: [1, 1.3, 1],
          rotate: [0, 180, 360]
        }}
        transition={{ duration: 2.5, repeat: Infinity }}
        style={{ filter: `drop-shadow(0 0 6px ${colors.glow})` }}
      >
        ✨
      </motion.div>
      
      {/* Inner gradient border */}
      <div className={`relative ${paddingClasses[size]} rounded-full z-10`}
           style={{ 
             background: `linear-gradient(135deg, ${colors.border}, ${colors.glow})`,
             boxShadow: `0 0 20px ${colors.glow}`
           }}>
        <div className="rounded-full bg-gradient-to-br from-white via-gray-50 to-white p-[2px]">
          <div className={`${sizeClasses[size]} rounded-full overflow-hidden relative`}>
            <motion.div
              whileHover={{ scale: 1.1 }}
              transition={{ duration: 0.2 }}
              className="w-full h-full"
            >
              {children}
            </motion.div>
          </div>
        </div>
      </div>
      
      {/* Bottom sparkle */}
      <motion.div
        className="absolute -bottom-1 -left-1 text-xs z-20"
        animate={{ 
          scale: [1, 1.3, 1],
          rotate: [360, 180, 0]
        }}
        transition={{ duration: 3, repeat: Infinity, delay: 1 }}
        style={{ filter: `drop-shadow(0 0 6px ${colors.glow})` }}
      >
        💫
      </motion.div>
    </div>
  );
};