import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface ProductAnimationsProps {
  animationType: string | null;
  isDarkBackground?: boolean;
  className?: string;
}

export const ProductAnimations = ({ 
  animationType, 
  isDarkBackground = false,
  className = '' 
}: ProductAnimationsProps) => {
  if (!animationType || animationType === 'none') return null;

  const colors = isDarkBackground 
    ? {
        primary: '#60a5fa',
        secondary: '#a78bfa',
        accent: '#f472b6',
        highlight: '#fbbf24',
        glow: '#34d399',
      }
    : {
        primary: '#2563eb',
        secondary: '#7c3aed',
        accent: '#db2777',
        highlight: '#f59e0b',
        glow: '#10b981',
      };

  switch (animationType) {
    case 'galaxy':
      return <GalaxyAnimation colors={colors} className={className} />;
    case 'coding':
      return <CodingAnimation colors={colors} className={className} />;
    case 'website':
      return <WebsiteAnimation colors={colors} className={className} />;
    case 'extension':
      return <ExtensionAnimation colors={colors} className={className} />;
    case 'dataflow':
      return <DataFlowAnimation colors={colors} className={className} />;
    case 'energyline':
      return <EnergyLineAnimation colors={colors} className={className} />;
    case 'aurora':
      return <AuroraAnimation colors={colors} className={className} />;
    case 'firespark':
      return <FireSparkAnimation colors={colors} className={className} />;
    case 'neonpulse':
      return <NeonPulseAnimation colors={colors} className={className} />;
    case 'circuitboard':
      return <CircuitBoardAnimation colors={colors} className={className} />;
    case 'hologram':
      return <HologramAnimation colors={colors} className={className} />;
    case 'quantum':
      return <QuantumAnimation colors={colors} className={className} />;
    case 'stardust':
      return <StardustAnimation colors={colors} className={className} />;
    case 'liquidmetal':
      return <LiquidMetalAnimation colors={colors} className={className} />;
    case 'cybernet':
      return <CybernetAnimation colors={colors} className={className} />;
    case 'prism':
      return <PrismAnimation colors={colors} className={className} />;
    case 'vortex':
      return <VortexAnimation colors={colors} className={className} />;
    case 'glitch':
      return <GlitchAnimation colors={colors} className={className} />;
    case 'radar':
      return <RadarAnimation colors={colors} className={className} />;
    case 'portal':
      return <PortalAnimation colors={colors} className={className} />;
    case 'hexagon':
      return <HexagonAnimation colors={colors} className={className} />;
    case 'plasma':
      return <PlasmaAnimation colors={colors} className={className} />;
    case 'laser':
      return <LaserAnimation colors={colors} className={className} />;
    case 'diamond':
      return <DiamondAnimation colors={colors} className={className} />;
    default:
      return null;
  }
};

// Galaxy Animation - Ring with stars and airplane
const GalaxyAnimation = ({ colors, className }: { colors: any; className: string }) => {
  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {/* Stars */}
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={`star-${i}`}
          className="absolute w-1 h-1 rounded-full"
          style={{
            background: i % 3 === 0 ? colors.primary : i % 3 === 1 ? colors.accent : colors.glow,
            boxShadow: `0 0 4px ${i % 3 === 0 ? colors.primary : i % 3 === 1 ? colors.accent : colors.glow}`,
          }}
          initial={{
            top: '10%',
            right: '10%',
            opacity: 0,
            scale: 0,
          }}
          animate={{
            top: ['10%', '50%', '90%'],
            right: ['10%', '50%', '90%'],
            opacity: [0, 1, 0],
            scale: [0, 1, 0],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            delay: i * 0.3,
            ease: 'easeInOut',
          }}
        />
      ))}
      
      {/* Glowing Ring Path */}
      <motion.div
        className="absolute"
        style={{
          width: '120%',
          height: '120%',
          top: '-10%',
          right: '-10%',
          border: `2px solid ${colors.primary}`,
          borderRadius: '50%',
          boxShadow: `0 0 20px ${colors.primary}, inset 0 0 20px ${colors.primary}`,
        }}
        initial={{ opacity: 0.3, scale: 0.8 }}
        animate={{ 
          opacity: [0.3, 0.6, 0.3],
          scale: [0.8, 1, 0.8],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      
      {/* Airplane Icon */}
      <motion.div
        className="absolute"
        initial={{
          top: '10%',
          right: '10%',
        }}
        animate={{
          top: ['10%', '50%', '90%'],
          right: ['10%', '50%', '90%'],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'linear',
        }}
      >
        <svg 
          width="16" 
          height="16" 
          viewBox="0 0 24 24" 
          fill="none" 
          style={{
            filter: `drop-shadow(0 0 6px ${colors.accent})`,
          }}
        >
          <path 
            d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" 
            fill={colors.accent}
          />
        </svg>
      </motion.div>
    </div>
  );
};

// Coding Animation - Matrix code rain
const CodingAnimation = ({ colors, className }: { colors: any; className: string }) => {
  const codeChars = ['0', '1', '{', '}', '<', '>', '/', '*', '+', '-', '=', ';'];
  
  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={`code-${i}`}
          className="absolute font-mono text-xs font-bold"
          style={{
            left: `${(i * 12) + 5}%`,
            color: colors.glow,
            textShadow: `0 0 8px ${colors.glow}`,
          }}
          initial={{ top: '-20%', opacity: 0 }}
          animate={{
            top: '120%',
            opacity: [0, 1, 1, 0],
          }}
          transition={{
            duration: 3 + (i * 0.2),
            repeat: Infinity,
            delay: i * 0.5,
            ease: 'linear',
          }}
        >
          {[...Array(6)].map((_, j) => (
            <div key={j} style={{ marginBottom: '8px' }}>
              {codeChars[Math.floor(Math.random() * codeChars.length)]}
            </div>
          ))}
        </motion.div>
      ))}
    </div>
  );
};

// Website Animation - Shimmer scan
const WebsiteAnimation = ({ colors, className }: { colors: any; className: string }) => {
  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      <motion.div
        className="absolute h-full"
        style={{
          width: '30%',
          background: `linear-gradient(90deg, 
            transparent 0%, 
            ${colors.primary}15 25%, 
            ${colors.primary}40 50%, 
            ${colors.primary}15 75%, 
            transparent 100%)`,
          boxShadow: `0 0 30px ${colors.primary}`,
        }}
        initial={{ left: '-30%' }}
        animate={{ left: '130%' }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
          repeatDelay: 0.5,
        }}
      />
    </div>
  );
};

// Extension Animation - Pulsing border
const ExtensionAnimation = ({ colors, className }: { colors: any; className: string }) => {
  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {/* Pulsing Border */}
      <motion.div
        className="absolute inset-1 rounded-lg"
        style={{
          border: `2px solid ${colors.secondary}`,
          boxShadow: `0 0 20px ${colors.secondary}, inset 0 0 20px ${colors.secondary}`,
        }}
        animate={{
          opacity: [0.4, 1, 0.4],
          boxShadow: [
            `0 0 10px ${colors.secondary}, inset 0 0 10px ${colors.secondary}`,
            `0 0 30px ${colors.secondary}, inset 0 0 30px ${colors.secondary}`,
            `0 0 10px ${colors.secondary}, inset 0 0 10px ${colors.secondary}`,
          ],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      
      {/* Rotating Plug Icon */}
      <motion.div
        className="absolute top-2 right-2"
        animate={{ rotate: 360 }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'linear',
        }}
      >
        <svg 
          width="20" 
          height="20" 
          viewBox="0 0 24 24" 
          fill="none"
          style={{
            filter: `drop-shadow(0 0 8px ${colors.secondary})`,
          }}
        >
          <path 
            d="M7 7h4v2H7zm6 0h4v2h-4zm-6 4h10v6c0 1.1-.9 2-2 2H9c-1.1 0-2-.9-2-2v-6zm3-8c-1.1 0-2 .9-2 2h2V3zm4 0v2h2c0-1.1-.9-2-2-2z" 
            fill={colors.secondary}
          />
        </svg>
      </motion.div>
    </div>
  );
};

// Data Flow Animation - Floating cubes
const DataFlowAnimation = ({ colors, className }: { colors: any; className: string }) => {
  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={`cube-${i}`}
          className="absolute"
          style={{
            width: '12px',
            height: '12px',
            background: i % 2 === 0 ? colors.primary : colors.accent,
            boxShadow: `0 0 12px ${i % 2 === 0 ? colors.primary : colors.accent}`,
            borderRadius: '2px',
          }}
          initial={{
            left: '-10%',
            top: `${(i * 15) + 10}%`,
            opacity: 0,
            rotate: 0,
          }}
          animate={{
            left: '110%',
            top: `${(i * 15) + 10 + (i % 2 === 0 ? 10 : -10)}%`,
            opacity: [0, 1, 1, 0],
            rotate: 360,
          }}
          transition={{
            duration: 4 + (i * 0.3),
            repeat: Infinity,
            delay: i * 0.6,
            ease: 'linear',
          }}
        />
      ))}
      
      {/* Glowing particles */}
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={`particle-${i}`}
          className="absolute w-1 h-1 rounded-full"
          style={{
            background: colors.glow,
            boxShadow: `0 0 6px ${colors.glow}`,
          }}
          initial={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            opacity: 0,
          }}
          animate={{
            opacity: [0, 1, 0],
            scale: [0, 1.5, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: Math.random() * 2,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
};

// Energy Line Animation - Electric wave on edges
const EnergyLineAnimation = ({ colors, className }: { colors: any; className: string }) => {
  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {/* Top edge */}
      <motion.div
        className="absolute top-0 left-0 right-0 h-0.5"
        style={{
          background: `linear-gradient(90deg, transparent, ${colors.highlight}, transparent)`,
          boxShadow: `0 0 12px ${colors.highlight}`,
        }}
        animate={{
          opacity: [0.3, 1, 0.3],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      
      {/* Right edge */}
      <motion.div
        className="absolute top-0 right-0 bottom-0 w-0.5"
        style={{
          background: `linear-gradient(180deg, transparent, ${colors.highlight}, transparent)`,
          boxShadow: `0 0 12px ${colors.highlight}`,
        }}
        animate={{
          opacity: [0.3, 1, 0.3],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          delay: 0.375,
          ease: 'easeInOut',
        }}
      />
      
      {/* Bottom edge */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-0.5"
        style={{
          background: `linear-gradient(90deg, transparent, ${colors.highlight}, transparent)`,
          boxShadow: `0 0 12px ${colors.highlight}`,
        }}
        animate={{
          opacity: [0.3, 1, 0.3],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          delay: 0.75,
          ease: 'easeInOut',
        }}
      />
      
      {/* Left edge */}
      <motion.div
        className="absolute top-0 left-0 bottom-0 w-0.5"
        style={{
          background: `linear-gradient(180deg, transparent, ${colors.highlight}, transparent)`,
          boxShadow: `0 0 12px ${colors.highlight}`,
        }}
        animate={{
          opacity: [0.3, 1, 0.3],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          delay: 1.125,
          ease: 'easeInOut',
        }}
      />
    </div>
  );
};

// Aurora Animation - Flowing gradient
const AuroraAnimation = ({ colors, className }: { colors: any; className: string }) => {
  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      <motion.div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(45deg, 
            ${colors.primary}20, 
            ${colors.accent}20, 
            ${colors.secondary}20, 
            ${colors.primary}20)`,
          backgroundSize: '400% 400%',
        }}
        animate={{
          backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
      
      {/* Overlay waves */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(circle at 30% 50%, ${colors.secondary}30 0%, transparent 50%)`,
        }}
        animate={{
          opacity: [0.3, 0.7, 0.3],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      
      <motion.div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(circle at 70% 50%, ${colors.accent}30 0%, transparent 50%)`,
        }}
        animate={{
          opacity: [0.7, 0.3, 0.7],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </div>
  );
};

// Fire Spark Animation - Glowing orbs
const FireSparkAnimation = ({ colors, className }: { colors: any; className: string }) => {
  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={`spark-${i}`}
          className="absolute rounded-full"
          style={{
            width: `${8 + Math.random() * 8}px`,
            height: `${8 + Math.random() * 8}px`,
            background: `radial-gradient(circle, ${i % 2 === 0 ? colors.highlight : colors.accent} 0%, transparent 70%)`,
            boxShadow: `0 0 20px ${i % 2 === 0 ? colors.highlight : colors.accent}`,
          }}
          initial={{
            left: `${Math.random() * 100}%`,
            bottom: '-10%',
            opacity: 0,
            scale: 0,
          }}
          animate={{
            left: `${Math.random() * 100}%`,
            bottom: `${80 + Math.random() * 20}%`,
            opacity: [0, 1, 1, 0],
            scale: [0, 1, 1, 0],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            delay: i * 0.4,
            ease: 'easeOut',
          }}
        />
      ))}
    </div>
  );
};

// 9. Neon Pulse - Pulsing neon corners
const NeonPulseAnimation = ({ colors, className }: { colors: any; className: string }) => {
  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {/* Corner Glows */}
      {['top-0 left-0', 'top-0 right-0', 'bottom-0 left-0', 'bottom-0 right-0'].map((pos, i) => (
        <motion.div
          key={`corner-${i}`}
          className={`absolute ${pos} w-8 h-8`}
          style={{
            background: `radial-gradient(circle, ${colors.accent} 0%, transparent 70%)`,
            boxShadow: `0 0 30px ${colors.accent}`,
          }}
          animate={{
            opacity: [0.4, 1, 0.4],
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: i * 0.5,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
};

// 10. Circuit Board - Animated circuit paths
const CircuitBoardAnimation = ({ colors, className }: { colors: any; className: string }) => {
  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {/* Horizontal Lines */}
      {[20, 40, 60, 80].map((top, i) => (
        <motion.div
          key={`h-line-${i}`}
          className="absolute h-0.5"
          style={{
            top: `${top}%`,
            left: 0,
            right: 0,
            background: `linear-gradient(90deg, transparent, ${colors.glow}, transparent)`,
            boxShadow: `0 0 8px ${colors.glow}`,
          }}
          animate={{
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            delay: i * 0.5,
            ease: 'linear',
          }}
        />
      ))}
      
      {/* Vertical Lines */}
      {[25, 50, 75].map((left, i) => (
        <motion.div
          key={`v-line-${i}`}
          className="absolute w-0.5"
          style={{
            left: `${left}%`,
            top: 0,
            bottom: 0,
            background: `linear-gradient(180deg, transparent, ${colors.primary}, transparent)`,
            boxShadow: `0 0 8px ${colors.primary}`,
          }}
          animate={{
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: i * 0.4,
            ease: 'linear',
          }}
        />
      ))}
      
      {/* Circuit Nodes */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={`node-${i}`}
          className="absolute w-2 h-2 rounded-full"
          style={{
            left: `${25 + (i % 3) * 25}%`,
            top: `${20 + Math.floor(i / 3) * 40}%`,
            background: colors.highlight,
            boxShadow: `0 0 12px ${colors.highlight}`,
          }}
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            delay: i * 0.3,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
};

// 11. Hologram - Scanning lines
const HologramAnimation = ({ colors, className }: { colors: any; className: string }) => {
  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {/* Scanning Line */}
      <motion.div
        className="absolute left-0 right-0 h-1"
        style={{
          background: `linear-gradient(to bottom, transparent, ${colors.primary}80, ${colors.primary}, ${colors.primary}80, transparent)`,
          boxShadow: `0 0 20px ${colors.primary}`,
        }}
        initial={{ top: '-5%' }}
        animate={{ top: '105%' }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
      
      {/* Horizontal Glitch Lines */}
      {[...Array(10)].map((_, i) => (
        <motion.div
          key={`line-${i}`}
          className="absolute left-0 right-0 h-px"
          style={{
            top: `${i * 10}%`,
            background: colors.primary,
            opacity: 0.2,
          }}
          animate={{
            opacity: [0.2, 0.5, 0.2],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: i * 0.2,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
};

// 12. Quantum - Orbiting particles
const QuantumAnimation = ({ colors, className }: { colors: any; className: string }) => {
  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {/* Center Atom */}
      <motion.div
        className="absolute w-3 h-3 rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{
          background: colors.accent,
          boxShadow: `0 0 20px ${colors.accent}`,
        }}
        animate={{
          scale: [1, 1.3, 1],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      
      {/* Orbiting Electrons */}
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={`orbit-${i}`}
          className="absolute w-1.5 h-1.5 rounded-full"
          style={{
            background: colors.primary,
            boxShadow: `0 0 8px ${colors.primary}`,
          }}
          animate={{
            x: [
              Math.cos((i * 120 * Math.PI) / 180) * 30,
              Math.cos(((i * 120 + 360) * Math.PI) / 180) * 30,
            ],
            y: [
              Math.sin((i * 120 * Math.PI) / 180) * 30,
              Math.sin(((i * 120 + 360) * Math.PI) / 180) * 30,
            ],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'linear',
          }}
          style={{
            left: '50%',
            top: '50%',
          }}
        />
      ))}
    </div>
  );
};

// 13. Stardust - Twinkling stars
const StardustAnimation = ({ colors, className }: { colors: any; className: string }) => {
  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={`star-${i}`}
          className="absolute"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
        >
          <motion.div
            className="w-1 h-1 rounded-full"
            style={{
              background: i % 3 === 0 ? colors.primary : i % 3 === 1 ? colors.accent : colors.glow,
              boxShadow: `0 0 4px ${i % 3 === 0 ? colors.primary : i % 3 === 1 ? colors.accent : colors.glow}`,
            }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0, 1, 0],
            }}
            transition={{
              duration: 2 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
              ease: 'easeInOut',
            }}
          />
        </motion.div>
      ))}
    </div>
  );
};

// 14. Liquid Metal - Flowing blob
const LiquidMetalAnimation = ({ colors, className }: { colors: any; className: string }) => {
  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      <motion.div
        className="absolute w-20 h-20 rounded-full blur-xl"
        style={{
          background: `radial-gradient(circle, ${colors.secondary} 0%, ${colors.accent} 50%, transparent 70%)`,
        }}
        animate={{
          x: ['-50%', '150%'],
          y: ['0%', '50%', '0%'],
          scale: [1, 1.5, 1],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </div>
  );
};

// 15. Cybernet - Network nodes
const CybernetAnimation = ({ colors, className }: { colors: any; className: string }) => {
  const nodes = [
    { x: 20, y: 20 },
    { x: 80, y: 20 },
    { x: 50, y: 50 },
    { x: 20, y: 80 },
    { x: 80, y: 80 },
  ];
  
  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {/* Connection Lines */}
      {nodes.map((node, i) => 
        nodes.slice(i + 1).map((target, j) => (
          <motion.svg
            key={`line-${i}-${j}`}
            className="absolute inset-0 w-full h-full"
            style={{ opacity: 0 }}
            animate={{ opacity: [0, 0.5, 0] }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: (i + j) * 0.3,
              ease: 'easeInOut',
            }}
          >
            <line
              x1={`${node.x}%`}
              y1={`${node.y}%`}
              x2={`${target.x}%`}
              y2={`${target.y}%`}
              stroke={colors.primary}
              strokeWidth="1"
              style={{ filter: `drop-shadow(0 0 4px ${colors.primary})` }}
            />
          </motion.svg>
        ))
      )}
      
      {/* Nodes */}
      {nodes.map((node, i) => (
        <motion.div
          key={`node-${i}`}
          className="absolute w-2 h-2 rounded-full"
          style={{
            left: `${node.x}%`,
            top: `${node.y}%`,
            background: colors.glow,
            boxShadow: `0 0 12px ${colors.glow}`,
          }}
          animate={{
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: i * 0.4,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
};

// 16. Prism - Rainbow refraction
const PrismAnimation = ({ colors, className }: { colors: any; className: string }) => {
  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      <motion.div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(45deg, 
            ${colors.primary}20, 
            ${colors.glow}20, 
            ${colors.highlight}20, 
            ${colors.accent}20, 
            ${colors.secondary}20)`,
          backgroundSize: '200% 200%',
        }}
        animate={{
          backgroundPosition: ['0% 0%', '100% 100%'],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
    </div>
  );
};

// 17. Vortex - Spinning spiral
const VortexAnimation = ({ colors, className }: { colors: any; className: string }) => {
  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={`ring-${i}`}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2"
          style={{
            width: `${40 + i * 20}%`,
            height: `${40 + i * 20}%`,
            borderColor: i % 2 === 0 ? colors.primary : colors.accent,
            boxShadow: `0 0 20px ${i % 2 === 0 ? colors.primary : colors.accent}`,
          }}
          animate={{
            rotate: 360,
            opacity: [0.3, 0.7, 0.3],
          }}
          transition={{
            rotate: {
              duration: 4 + i,
              repeat: Infinity,
              ease: 'linear',
            },
            opacity: {
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            },
          }}
        />
      ))}
    </div>
  );
};

// 18. Glitch - Digital distortion
const GlitchAnimation = ({ colors, className }: { colors: any; className: string }) => {
  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={`glitch-${i}`}
          className="absolute left-0 right-0 h-px"
          style={{
            top: `${i * 20 + 10}%`,
            background: colors.accent,
            boxShadow: `0 0 8px ${colors.accent}`,
          }}
          animate={{
            x: [-5, 5, -3, 3, 0],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: 0.5,
            repeat: Infinity,
            delay: i * 0.6 + Math.random() * 2,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
};

// 19. Radar - Sweeping beam
const RadarAnimation = ({ colors, className }: { colors: any; className: string }) => {
  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {/* Radar Circles */}
      {[40, 60, 80].map((size, i) => (
        <motion.div
          key={`circle-${i}`}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border"
          style={{
            width: `${size}%`,
            height: `${size}%`,
            borderColor: colors.glow,
            opacity: 0.3,
          }}
        />
      ))}
      
      {/* Sweeping Beam */}
      <motion.div
        className="absolute top-1/2 left-1/2 origin-left h-0.5"
        style={{
          width: '50%',
          background: `linear-gradient(90deg, transparent, ${colors.glow})`,
          boxShadow: `0 0 20px ${colors.glow}`,
        }}
        animate={{
          rotate: 360,
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
      
      {/* Blips */}
      {[...Array(4)].map((_, i) => (
        <motion.div
          key={`blip-${i}`}
          className="absolute w-2 h-2 rounded-full"
          style={{
            left: `${30 + Math.random() * 40}%`,
            top: `${30 + Math.random() * 40}%`,
            background: colors.highlight,
            boxShadow: `0 0 12px ${colors.highlight}`,
          }}
          animate={{
            opacity: [0, 1, 0],
            scale: [0, 1, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: i * 0.5,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
};

// 20. Portal - Swirling gateway
const PortalAnimation = ({ colors, className }: { colors: any; className: string }) => {
  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full"
        style={{
          background: `radial-gradient(circle, ${colors.secondary} 0%, ${colors.primary} 50%, transparent 70%)`,
          boxShadow: `0 0 40px ${colors.primary}`,
        }}
        animate={{
          scale: [0.8, 1.2, 0.8],
          rotate: 360,
        }}
        transition={{
          scale: {
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut',
          },
          rotate: {
            duration: 8,
            repeat: Infinity,
            ease: 'linear',
          },
        }}
      />
      
      {/* Particles being sucked in */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={`particle-${i}`}
          className="absolute w-1 h-1 rounded-full"
          style={{
            background: colors.accent,
            boxShadow: `0 0 8px ${colors.accent}`,
          }}
          animate={{
            x: [
              Math.cos((i * 45 * Math.PI) / 180) * 80,
              0,
            ],
            y: [
              Math.sin((i * 45 * Math.PI) / 180) * 80,
              0,
            ],
            opacity: [1, 0],
            scale: [1, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: i * 0.25,
            ease: 'easeIn',
          }}
          style={{
            left: '50%',
            top: '50%',
          }}
        />
      ))}
    </div>
  );
};

// 21. Hexagon - Grid pattern
const HexagonAnimation = ({ colors, className }: { colors: any; className: string }) => {
  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {[...Array(9)].map((_, i) => (
        <motion.div
          key={`hex-${i}`}
          className="absolute"
          style={{
            left: `${(i % 3) * 33 + 16}%`,
            top: `${Math.floor(i / 3) * 33 + 16}%`,
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24">
            <motion.polygon
              points="12,2 22,8 22,16 12,22 2,16 2,8"
              fill="none"
              stroke={i % 3 === 0 ? colors.primary : i % 3 === 1 ? colors.accent : colors.glow}
              strokeWidth="1"
              style={{
                filter: `drop-shadow(0 0 6px ${i % 3 === 0 ? colors.primary : i % 3 === 1 ? colors.accent : colors.glow})`,
              }}
              animate={{
                opacity: [0.3, 1, 0.3],
                scale: [0.9, 1.1, 0.9],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                delay: i * 0.2,
                ease: 'easeInOut',
              }}
            />
          </svg>
        </motion.div>
      ))}
    </div>
  );
};

// 22. Plasma - Electric plasma ball
const PlasmaAnimation = ({ colors, className }: { colors: any; className: string }) => {
  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 rounded-full blur-md"
        style={{
          background: `radial-gradient(circle, ${colors.primary} 0%, ${colors.accent} 40%, transparent 70%)`,
        }}
        animate={{
          scale: [1, 1.3, 1],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      
      {/* Lightning Bolts */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={`bolt-${i}`}
          className="absolute w-px h-8"
          style={{
            left: '50%',
            top: '50%',
            background: colors.highlight,
            boxShadow: `0 0 8px ${colors.highlight}`,
            transformOrigin: 'top center',
          }}
          animate={{
            rotate: [i * 60, i * 60 + 360],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            delay: i * 0.25,
            ease: 'linear',
          }}
        />
      ))}
    </div>
  );
};

// 23. Laser - Scanning laser beams
const LaserAnimation = ({ colors, className }: { colors: any; className: string }) => {
  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {/* Horizontal Laser */}
      <motion.div
        className="absolute left-0 right-0 h-0.5"
        style={{
          background: `linear-gradient(90deg, transparent, ${colors.accent}, transparent)`,
          boxShadow: `0 0 16px ${colors.accent}`,
        }}
        animate={{
          top: ['0%', '100%'],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
      
      {/* Vertical Laser */}
      <motion.div
        className="absolute top-0 bottom-0 w-0.5"
        style={{
          background: `linear-gradient(180deg, transparent, ${colors.primary}, transparent)`,
          boxShadow: `0 0 16px ${colors.primary}`,
        }}
        animate={{
          left: ['0%', '100%'],
        }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          ease: 'linear',
          delay: 0.5,
        }}
      />
      
      {/* Target Points */}
      {[...Array(4)].map((_, i) => (
        <motion.div
          key={`target-${i}`}
          className="absolute w-2 h-2"
          style={{
            left: `${25 + (i % 2) * 50}%`,
            top: `${25 + Math.floor(i / 2) * 50}%`,
          }}
        >
          <motion.div
            className="w-full h-full rounded-full"
            style={{
              background: colors.highlight,
              boxShadow: `0 0 16px ${colors.highlight}`,
            }}
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: i * 0.25,
              ease: 'easeInOut',
            }}
          />
        </motion.div>
      ))}
    </div>
  );
};

// 24. Diamond - Crystalline sparkles
const DiamondAnimation = ({ colors, className }: { colors: any; className: string }) => {
  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={`diamond-${i}`}
          className="absolute"
          style={{
            left: `${20 + (i % 4) * 20}%`,
            top: `${20 + Math.floor(i / 4) * 40}%`,
          }}
        >
          <motion.svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            animate={{
              rotate: 360,
              scale: [1, 1.3, 1],
            }}
            transition={{
              rotate: {
                duration: 8,
                repeat: Infinity,
                ease: 'linear',
              },
              scale: {
                duration: 2,
                repeat: Infinity,
                delay: i * 0.25,
                ease: 'easeInOut',
              },
            }}
          >
            <motion.polygon
              points="8,1 12,8 8,15 4,8"
              fill={i % 2 === 0 ? colors.primary : colors.accent}
              style={{
                filter: `drop-shadow(0 0 8px ${i % 2 === 0 ? colors.primary : colors.accent})`,
              }}
              animate={{
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.2,
                ease: 'easeInOut',
              }}
            />
          </motion.svg>
        </motion.div>
      ))}
    </div>
  );
};

export const ANIMATION_OPTIONS = [
  { value: 'none', label: 'None', description: 'No animation' },
  { value: 'galaxy', label: 'Galaxy', description: 'Glowing ring with stars and airplane' },
  { value: 'coding', label: 'Coding', description: 'Matrix-style code rain' },
  { value: 'website', label: 'Website', description: 'Glossy shimmer light scan' },
  { value: 'extension', label: 'Extension', description: 'Pulsing neon border with rotating plug' },
  { value: 'dataflow', label: 'Data Flow', description: 'Floating cubes and particles' },
  { value: 'energyline', label: 'Energy Line', description: 'Electric wave along edges' },
  { value: 'aurora', label: 'Aurora', description: 'Flowing aurora gradient' },
  { value: 'firespark', label: 'Fire Spark', description: 'Glowing orbs drifting upward' },
  { value: 'neonpulse', label: 'Neon Pulse', description: 'Pulsing neon corners' },
  { value: 'circuitboard', label: 'Circuit Board', description: 'Animated circuit paths' },
  { value: 'hologram', label: 'Hologram', description: 'Scanning hologram lines' },
  { value: 'quantum', label: 'Quantum', description: 'Orbiting quantum particles' },
  { value: 'stardust', label: 'Stardust', description: 'Twinkling stardust field' },
  { value: 'liquidmetal', label: 'Liquid Metal', description: 'Flowing metallic blob' },
  { value: 'cybernet', label: 'Cybernet', description: 'Connected network nodes' },
  { value: 'prism', label: 'Prism', description: 'Rainbow light refraction' },
  { value: 'vortex', label: 'Vortex', description: 'Spinning spiral vortex' },
  { value: 'glitch', label: 'Glitch', description: 'Digital glitch effect' },
  { value: 'radar', label: 'Radar', description: 'Sweeping radar beam' },
  { value: 'portal', label: 'Portal', description: 'Swirling dimensional portal' },
  { value: 'hexagon', label: 'Hexagon', description: 'Hexagonal grid pattern' },
  { value: 'plasma', label: 'Plasma', description: 'Electric plasma ball' },
  { value: 'laser', label: 'Laser', description: 'Scanning laser grid' },
  { value: 'diamond', label: 'Diamond', description: 'Crystalline sparkles' },
];