import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Github, Youtube, Facebook, Instagram, Twitter, Loader2, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

interface SocialLinks {
  github?: string;
  youtube?: string;
  facebook?: string;
  instagram?: string;
  x?: string;
}

interface TeamMember {
  id: string;
  name: string;
  bio: string | null;
  picture: string | null;
  years_of_working: number;
  is_founder: boolean;
  verification_badge: 'gold' | 'blue' | 'instagram' | null;
  social_links: SocialLinks;
  display_order: number;
}

// Add Ornate Frame Component with Wings - MOBILE RESPONSIVE
const OrnateFrame = ({ children, size = "large", isFounder = false }: { children: React.ReactNode; size?: "large" | "small"; isFounder?: boolean }) => {
  const isLarge = size === "large";
  
  // Responsive wing sizes - MUCH smaller on mobile, normal on desktop
  const wingSize = isLarge 
    ? "w-16 h-20 sm:w-20 sm:h-28 md:w-28 md:h-36 lg:w-32 lg:h-40" 
    : "w-10 h-14 sm:w-14 sm:h-20 md:w-20 md:h-28";
  
  // Responsive wing positioning - closer on mobile, further on desktop
  const leftWingPosition = isLarge
    ? "-left-12 sm:-left-14 md:-left-20 lg:-left-24"
    : "-left-8 sm:-left-10 md:-left-16";
  
  const rightWingPosition = isLarge
    ? "-right-12 sm:-right-14 md:-right-20 lg:-right-24"
    : "-right-8 sm:-right-10 md:-right-16";
  
  // Color schemes - founders get rainbow gradient, team members get blue
  const wingGradient = isFounder 
    ? "from-pink-400 via-purple-500 to-blue-500"
    : "from-blue-400 via-blue-500 to-cyan-400";
  
  const borderGradient = isFounder
    ? "linear-gradient(135deg, #ec4899 0%, #a855f7 25%, #6366f1 50%, #3b82f6 75%, #06b6d4 100%)"
    : "linear-gradient(135deg, #3b82f6 0%, #60a5fa 50%, #06b6d4 100%)";
    
  const glowColor = isFounder ? "rgba(168,85,247,0.4)" : "rgba(59,130,246,0.4)";
  
  return (
    <div className="relative inline-block">
      {/* LEFT WING - RESPONSIVE */}
      <motion.div
        className={`absolute ${leftWingPosition} top-1/2 -translate-y-1/2 ${wingSize} z-20`}
        animate={{ 
          x: [-2, 2, -2],
          rotate: [-8, 8, -8]
        }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        <svg viewBox="0 0 120 160" className="w-full h-full drop-shadow-2xl">
          <defs>
            <linearGradient id={`wingGradientLeft${isFounder ? 'Founder' : 'Member'}`} x1="0%" y1="0%" x2="100%" y2="100%">
              {isFounder ? (
                <>
                  <stop offset="0%" stopColor="#ec4899" stopOpacity="0.9" />
                  <stop offset="50%" stopColor="#a855f7" stopOpacity="1" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.9" />
                </>
              ) : (
                <>
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.9" />
                  <stop offset="50%" stopColor="#60a5fa" stopOpacity="1" />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.9" />
                </>
              )}
            </linearGradient>
            <filter id="wingGlow">
              <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          <path
            d="M110,80 Q100,45 88,28 Q80,18 72,12 Q65,8 58,6 Q52,5 48,5 Q45,5 43,7 Q42,9 42,12 L42,80 Q42,92 45,102 Q48,110 54,118 Q60,124 68,128 Q76,132 85,135 Q100,138 110,80 Z"
            fill={`url(#wingGradientLeft${isFounder ? 'Founder' : 'Member'})`}
            stroke={isFounder ? "#fbbf24" : "#60a5fa"}
            strokeWidth="2"
            filter="url(#wingGlow)"
            opacity="0.95"
          />
          <path
            d="M100,78 Q92,50 82,36 Q75,28 68,24 Q62,22 58,24 L58,76 Q62,86 68,93 Q75,98 82,102 Q92,106 100,78 Z"
            fill="rgba(255,255,255,0.4)"
            stroke={isFounder ? "#fbbf24" : "#93c5fd"}
            strokeWidth="1.5"
            opacity="0.7"
          />
          <path d="M48,20 Q54,28 50,40" stroke={isFounder ? "#fbbf24" : "#60a5fa"} strokeWidth="1.5" fill="none" opacity="0.8"/>
          <path d="M48,45 Q54,53 50,65" stroke={isFounder ? "#fbbf24" : "#60a5fa"} strokeWidth="1.5" fill="none" opacity="0.8"/>
          <path d="M48,70 Q54,78 50,90" stroke={isFounder ? "#fbbf24" : "#60a5fa"} strokeWidth="1.5" fill="none" opacity="0.8"/>
          <path d="M48,95 Q54,103 50,115" stroke={isFounder ? "#fbbf24" : "#60a5fa"} strokeWidth="1.5" fill="none" opacity="0.8"/>
        </svg>
      </motion.div>

      {/* RIGHT WING - RESPONSIVE */}
      <motion.div
        className={`absolute ${rightWingPosition} top-1/2 -translate-y-1/2 ${wingSize} z-20`}
        animate={{ 
          x: [2, -2, 2],
          rotate: [8, -8, 8]
        }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        <svg viewBox="0 0 120 160" className="w-full h-full drop-shadow-2xl scale-x-[-1]">
          <defs>
            <linearGradient id={`wingGradientRight${isFounder ? 'Founder' : 'Member'}`} x1="0%" y1="0%" x2="100%" y2="100%">
              {isFounder ? (
                <>
                  <stop offset="0%" stopColor="#ec4899" stopOpacity="0.9" />
                  <stop offset="50%" stopColor="#a855f7" stopOpacity="1" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.9" />
                </>
              ) : (
                <>
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.9" />
                  <stop offset="50%" stopColor="#60a5fa" stopOpacity="1" />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.9" />
                </>
              )}
            </linearGradient>
          </defs>
          <path
            d="M110,80 Q100,45 88,28 Q80,18 72,12 Q65,8 58,6 Q52,5 48,5 Q45,5 43,7 Q42,9 42,12 L42,80 Q42,92 45,102 Q48,110 54,118 Q60,124 68,128 Q76,132 85,135 Q100,138 110,80 Z"
            fill={`url(#wingGradientRight${isFounder ? 'Founder' : 'Member'})`}
            stroke={isFounder ? "#fbbf24" : "#60a5fa"}
            strokeWidth="2"
            filter="url(#wingGlow)"
            opacity="0.95"
          />
          <path
            d="M100,78 Q92,50 82,36 Q75,28 68,24 Q62,22 58,24 L58,76 Q62,86 68,93 Q75,98 82,102 Q92,106 100,78 Z"
            fill="rgba(255,255,255,0.4)"
            stroke={isFounder ? "#fbbf24" : "#93c5fd"}
            strokeWidth="1.5"
            opacity="0.7"
          />
          <path d="M48,20 Q54,28 50,40" stroke={isFounder ? "#fbbf24" : "#60a5fa"} strokeWidth="1.5" fill="none" opacity="0.8"/>
          <path d="M48,45 Q54,53 50,65" stroke={isFounder ? "#fbbf24" : "#60a5fa"} strokeWidth="1.5" fill="none" opacity="0.8"/>
          <path d="M48,70 Q54,78 50,90" stroke={isFounder ? "#fbbf24" : "#60a5fa"} strokeWidth="1.5" fill="none" opacity="0.8"/>
          <path d="M48,95 Q54,103 50,115" stroke={isFounder ? "#fbbf24" : "#60a5fa"} strokeWidth="1.5" fill="none" opacity="0.8"/>
        </svg>
      </motion.div>

      {/* Middle decorative ring */}
      <motion.div
        className={`absolute ${isLarge ? '-inset-3' : '-inset-1.5'} z-10`}
        animate={{ rotate: -360 }}
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
      >
        <div 
          className={`w-full h-full rounded-full border-2 ${isFounder ? 'border-yellow-400/40' : 'border-blue-400/40'}`}
          style={{
            background: isFounder 
              ? 'linear-gradient(45deg, transparent 40%, rgba(251, 191, 36, 0.3) 50%, transparent 60%)'
              : 'linear-gradient(45deg, transparent 40%, rgba(59, 130, 246, 0.3) 50%, transparent 60%)',
          }}
        />
      </motion.div>
      
      {/* Inner ornate border with gradient - different for founders */}
      <div className={`relative ${isLarge ? 'p-2' : 'p-1'} z-10`}>
        <div className="rounded-full"
             style={{
               background: borderGradient,
               padding: isLarge ? '4px' : '3px',
             }}
        >
          <div className={`rounded-full ${isFounder ? 'bg-gradient-to-br from-white via-purple-50 to-pink-50' : 'bg-gradient-to-br from-white via-blue-50 to-cyan-50'} ${isLarge ? 'p-2' : 'p-1'}`}>
            {children}
          </div>
        </div>
      </div>
      
      {/* Corner sparkles - responsive sizing */}
      {isLarge && (
        <>
          <motion.div
            className={`absolute -top-2 sm:-top-3 -right-2 sm:-right-3 ${isFounder ? 'text-2xl sm:text-3xl md:text-4xl' : 'text-xl sm:text-2xl md:text-3xl'} z-30`}
            style={{ 
              filter: isFounder 
                ? 'drop-shadow(0 0 10px rgba(251,191,36,1))' 
                : 'drop-shadow(0 0 8px rgba(59,130,246,0.8))'
            }}
            animate={{ 
              scale: [1, isFounder ? 1.4 : 1.3, 1],
              rotate: [0, 180, 360]
            }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            ✨
          </motion.div>
          <motion.div
            className={`absolute -bottom-2 sm:-bottom-3 -left-2 sm:-left-3 ${isFounder ? 'text-2xl sm:text-3xl md:text-4xl' : 'text-xl sm:text-2xl md:text-3xl'} z-30`}
            style={{ 
              filter: isFounder 
                ? 'drop-shadow(0 0 10px rgba(168,85,247,1))' 
                : 'drop-shadow(0 0 8px rgba(59,130,246,0.8))'
            }}
            animate={{ 
              scale: [1, isFounder ? 1.4 : 1.3, 1],
              rotate: [360, 180, 0]
            }}
            transition={{ duration: 3, repeat: Infinity, delay: 1.5 }}
          >
            ✨
          </motion.div>
          {isFounder && (
            <>
              <motion.div
                className="absolute -top-2 sm:-top-3 -left-2 sm:-left-3 text-xl sm:text-2xl md:text-3xl z-30"
                style={{ filter: 'drop-shadow(0 0 10px rgba(236,72,153,1))' }}
                animate={{ 
                  scale: [1, 1.3, 1],
                  rotate: [0, -180, -360]
                }}
                transition={{ duration: 4, repeat: Infinity, delay: 0.5 }}
              >
                💫
              </motion.div>
              <motion.div
                className="absolute -bottom-2 sm:-bottom-3 -right-2 sm:-right-3 text-xl sm:text-2xl md:text-3xl z-30"
                style={{ filter: 'drop-shadow(0 0 10px rgba(251,191,36,1))' }}
                animate={{ 
                  scale: [1, 1.3, 1],
                  rotate: [-360, -180, 0]
                }}
                transition={{ duration: 4, repeat: Infinity, delay: 2 }}
              >
                💫
              </motion.div>
            </>
          )}
        </>
      )}
    </div>
  );
};

// Stylish Badge Components with SVG - REALISTIC DESIGN
const GoldBadge = () => (
  <motion.div 
    className="inline-flex items-center"
    whileHover={{ scale: 1.1 }}
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ type: "spring", stiffness: 300 }}
  >
    <svg width="48" height="60" viewBox="0 0 48 60" className="drop-shadow-2xl">
      <defs>
        <filter id="goldGlow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
        <radialGradient id="goldShine" cx="50%" cy="30%">
          <stop offset="0%" stopColor="#fef3c7" />
          <stop offset="30%" stopColor="#fbbf24" />
          <stop offset="60%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#d97706" />
        </radialGradient>
        <linearGradient id="ribbonGold" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#b45309" />
        </linearGradient>
      </defs>
      
      <g filter="url(#goldGlow)">
        {/* Main circular badge */}
        <circle cx="24" cy="20" r="18" fill="url(#goldShine)" stroke="#d97706" strokeWidth="1.5"/>
        
        {/* Inner ring */}
        <circle cx="24" cy="20" r="14" fill="none" stroke="#d97706" strokeWidth="1" opacity="0.5"/>
        
        {/* Center circle */}
        <circle cx="24" cy="20" r="11" fill="#1e293b"/>
        
        {/* Star/checkmark */}
        <path d="M24,14 L25.5,17.5 L29,18 L26.5,20.5 L27,24 L24,22 L21,24 L21.5,20.5 L19,18 L22.5,17.5 Z" 
              fill="#fbbf24" 
              stroke="#fef3c7" 
              strokeWidth="0.5"/>
        
        {/* Left ribbon */}
        <path d="M18,35 L18,55 L15,50 L18,51 Z" 
              fill="url(#ribbonGold)" 
              stroke="#b45309" 
              strokeWidth="1"/>
        
        {/* Right ribbon */}
        <path d="M30,35 L30,55 L33,50 L30,51 Z" 
              fill="url(#ribbonGold)" 
              stroke="#b45309" 
              strokeWidth="1"/>
        
        {/* Ribbon attachment */}
        <ellipse cx="24" cy="35" rx="8" ry="3" fill="url(#ribbonGold)" stroke="#b45309" strokeWidth="1"/>
      </g>
    </svg>
  </motion.div>
);

const BlueBadge = () => (
  <motion.div 
    className="inline-flex items-center"
    whileHover={{ scale: 1.1 }}
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ type: "spring", stiffness: 300 }}
  >
    <svg width="48" height="60" viewBox="0 0 48 60" className="drop-shadow-2xl">
      <defs>
        <filter id="blueGlow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
        <radialGradient id="blueShine" cx="50%" cy="30%">
          <stop offset="0%" stopColor="#dbeafe" />
          <stop offset="30%" stopColor="#60a5fa" />
          <stop offset="60%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#1e40af" />
        </radialGradient>
        <linearGradient id="ribbonBlue" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#60a5fa" />
          <stop offset="100%" stopColor="#1e40af" />
        </linearGradient>
      </defs>
      
      <g filter="url(#blueGlow)">
        {/* Main circular badge */}
        <circle cx="24" cy="20" r="18" fill="url(#blueShine)" stroke="#1e40af" strokeWidth="1.5"/>
        
        {/* Inner ring */}
        <circle cx="24" cy="20" r="14" fill="none" stroke="#1e40af" strokeWidth="1" opacity="0.5"/>
        
        {/* Center circle */}
        <circle cx="24" cy="20" r="11" fill="#1e293b"/>
        
        {/* Checkmark */}
        <path d="M19,20 L22,23 L29,16" 
              stroke="#60a5fa" 
              strokeWidth="2.5" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              fill="none"/>
        
        {/* Left ribbon */}
        <path d="M18,35 L18,55 L15,50 L18,51 Z" 
              fill="url(#ribbonBlue)" 
              stroke="#1e40af" 
              strokeWidth="1"/>
        
        {/* Right ribbon */}
        <path d="M30,35 L30,55 L33,50 L30,51 Z" 
              fill="url(#ribbonBlue)" 
              stroke="#1e40af" 
              strokeWidth="1"/>
        
        {/* Ribbon attachment */}
        <ellipse cx="24" cy="35" rx="8" ry="3" fill="url(#ribbonBlue)" stroke="#1e40af" strokeWidth="1"/>
      </g>
    </svg>
  </motion.div>
);

const InstagramBadge = () => (
  <motion.div 
    className="inline-flex items-center"
    whileHover={{ scale: 1.1 }}
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ type: "spring", stiffness: 300 }}
  >
    <svg width="44" height="44" viewBox="0 0 44 44" className="drop-shadow-2xl">
      <defs>
        <filter id="instaGlow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
        <radialGradient id="instaShine" cx="50%" cy="30%">
          <stop offset="0%" stopColor="#fce7f3" />
          <stop offset="40%" stopColor="#ec4899" />
          <stop offset="70%" stopColor="#a855f7" />
          <stop offset="100%" stopColor="#7c3aed" />
        </radialGradient>
      </defs>
      
      <g filter="url(#instaGlow)">
        {/* Outer star/gear shape */}
        <path d="M22,2 L24,8 L30,8 L25,12 L27,18 L22,14 L17,18 L19,12 L14,8 L20,8 Z
                 M22,26 L20,32 L14,32 L19,28 L17,22 L22,26 L27,22 L25,28 L30,32 L24,32 Z
                 M8,14 L12,16 L12,22 L8,20 L2,22 L6,18 L2,14 L6,16 Z
                 M32,14 L36,16 L32,18 L36,22 L32,20 L32,16 L36,14 Z"
              fill="url(#instaShine)" 
              stroke="#a855f7" 
              strokeWidth="1.5"/>
        
        {/* Main circle */}
        <circle cx="22" cy="17" r="13" fill="url(#instaShine)" stroke="#7c3aed" strokeWidth="1.5"/>
        
        {/* Inner ring */}
        <circle cx="22" cy="17" r="10" fill="none" stroke="#7c3aed" strokeWidth="1" opacity="0.5"/>
        
        {/* Center */}
        <circle cx="22" cy="17" r="8" fill="#1e293b"/>
        
        {/* Checkmark */}
        <path d="M18,17 L20.5,19.5 L26,14" 
              stroke="#ec4899" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              fill="none"/>
      </g>
    </svg>
  </motion.div>
);

const FounderBadge = () => (
  <motion.div 
    className="inline-flex items-center"
    whileHover={{ scale: 1.1 }}
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ type: "spring", stiffness: 300 }}
  >
    <svg width="44" height="44" viewBox="0 0 44 44" className="drop-shadow-2xl">
      <defs>
        <filter id="founderGlow">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
        <radialGradient id="founderShine" cx="50%" cy="30%">
          <stop offset="0%" stopColor="#fef3c7" />
          <stop offset="40%" stopColor="#f97316" />
          <stop offset="70%" stopColor="#ef4444" />
          <stop offset="100%" stopColor="#dc2626" />
        </radialGradient>
      </defs>
      
      <g filter="url(#founderGlow)">
        {/* Crown points */}
        <path d="M22,2 L24,10 L30,6 L28,14 L36,12 L32,18 L38,20 L32,22 L36,28 L28,26 L30,34 L24,30 L22,38 L20,30 L14,34 L16,26 L8,28 L12,22 L6,20 L12,18 L8,12 L16,14 L14,6 L20,10 Z"
              fill="url(#founderShine)" 
              stroke="#dc2626" 
              strokeWidth="1.5"/>
        
        {/* Main circle */}
        <circle cx="22" cy="20" r="13" fill="url(#founderShine)" stroke="#dc2626" strokeWidth="1.5"/>
        
        {/* Inner ring */}
        <circle cx="22" cy="20" r="10" fill="none" stroke="#dc2626" strokeWidth="1" opacity="0.5"/>
        
        {/* Center */}
        <circle cx="22" cy="20" r="8" fill="#1e293b"/>
        
        {/* Crown symbol */}
        <path d="M22,15 L23.5,18 L26.5,18 L24,20 L25,23 L22,21 L19,23 L20,20 L17.5,18 L20.5,18 Z" 
              fill="#fbbf24" 
              stroke="#fef3c7" 
              strokeWidth="0.5"/>
      </g>
    </svg>
  </motion.div>
);

const SocialIcon = ({ type, url }: { type: string; url: string }) => {
  if (!url) return null;
  
  const icons = {
    github: <Github className="w-5 h-5" />,
    youtube: <Youtube className="w-5 h-5" />,
    facebook: <Facebook className="w-5 h-5" />,
    instagram: <Instagram className="w-5 h-5" />,
    x: <Twitter className="w-5 h-5" />
  };
  
  return (
    <motion.a
      href={url.startsWith('http') ? url : `https://${type === 'x' ? 'twitter' : type}.com/${url}`}
      target="_blank"
      rel="noopener noreferrer"
      className="p-2 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-colors"
      whileHover={{ scale: 1.1, rotate: 5 }}
      whileTap={{ scale: 0.95 }}
    >
      {icons[type as keyof typeof icons]}
    </motion.a>
  );
};

export const Team = () => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  const fetchTeamMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select('*')
        .order('is_founder', { ascending: false })
        .order('display_order', { ascending: true });

      if (error) throw error;
      setTeamMembers(data || []);
    } catch (error) {
      console.error('Error fetching team members:', error);
    } finally {
      setLoading(false);
    }
  };

  const founders = teamMembers.filter(m => m.is_founder);
  const members = teamMembers.filter(m => !m.is_founder);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5 overflow-x-hidden">
      {/* Hero Header - MOBILE RESPONSIVE */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-secondary/10 to-primary/10 animate-pulse" />
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative text-center py-12 sm:py-16 md:py-20 px-4"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="inline-block mb-3 sm:mb-4"
          >
            <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-primary animate-pulse" />
          </motion.div>
          <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-orbitron font-bold text-foreground mb-4 sm:mb-6">
            Meet Our <span className="bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent animate-gradient">Dream Team</span>
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed px-4">
            Passionate innovators building the future, one line of code at a time
          </p>
        </motion.div>
      </div>

      <div className="max-w-7xl mx-auto px-4 pb-12 sm:pb-16 md:pb-20 overflow-x-hidden">
        {/* Founders Section - STYLISH NAMES WITH LOVE ANIMATION */}
        {founders.length > 0 && (
          <div className="mb-16 sm:mb-24 md:mb-32">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center mb-8 sm:mb-12 md:mb-16"
            >
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-orbitron font-bold text-foreground mb-2 sm:mb-3">
                <span className="text-primary">★</span> Our Founders <span className="text-primary">★</span>
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground">The visionaries who started it all</p>
            </motion.div>

            {/* Founders Grid with Love Animation - IMPROVED MOBILE LAYOUT */}
            <div className="relative grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 md:gap-10 lg:gap-12 max-w-6xl mx-auto">
              {/* Animated Hearts Between Two Founders - More visible on mobile */}
              {founders.length === 2 && (
                <div className="absolute top-1/2 left-0 right-0 h-0 pointer-events-none z-10">
                  {/* Left to Right Hearts */}
                  {[...Array(3)].map((_, i) => (
                    <motion.div
                      key={`heart-lr-${i}`}
                      className="absolute text-2xl sm:text-3xl md:text-4xl"
                      style={{ left: '50%', top: '50%' }}
                      initial={{ x: '-300%', y: '-50%', opacity: 0, scale: 0.5 }}
                      animate={{
                        x: ['calc(-200% - 20px)', 'calc(100% + 20px)'],
                        y: ['-50%', 'calc(-50% - 25px)', 'calc(-50% + 20px)', '-50%'],
                        opacity: [0, 1, 1, 1, 0],
                        scale: [0.5, 1.2, 1.1, 1.2, 0.5],
                        rotate: [0, 10, -10, 5, 0]
                      }}
                      transition={{
                        duration: 4,
                        delay: i * 1.3,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    >
                      ❤️
                    </motion.div>
                  ))}
                  
                  {/* Right to Left Hearts */}
                  {[...Array(3)].map((_, i) => (
                    <motion.div
                      key={`heart-rl-${i}`}
                      className="absolute text-2xl sm:text-3xl md:text-4xl"
                      style={{ left: '50%', top: '50%' }}
                      initial={{ x: '300%', y: '-50%', opacity: 0, scale: 0.5 }}
                      animate={{
                        x: ['calc(200% + 20px)', 'calc(-100% - 20px)'],
                        y: ['-50%', 'calc(-50% + 25px)', 'calc(-50% - 20px)', '-50%'],
                        opacity: [0, 1, 1, 1, 0],
                        scale: [0.5, 1.2, 1.1, 1.2, 0.5],
                        rotate: [0, -10, 10, -5, 0]
                      }}
                      transition={{
                        duration: 4,
                        delay: i * 1.3 + 0.6,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    >
                      💕
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Founder Cards */}
              {founders.map((founder, index) => (
                <motion.div
                  key={founder.id}
                  initial={{ opacity: 0, scale: 0.9, y: 30 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ delay: index * 0.2, type: "spring" }}
                  className="relative group overflow-hidden rounded-2xl lg:rounded-3xl"
                >
                  {/* FIXED: Contained glow effect that doesn't bleed outside */}
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-secondary/20 to-primary/20 opacity-50 group-hover:opacity-70 transition duration-500" />
                  
                  <motion.div
                    className="relative bg-card rounded-2xl lg:rounded-3xl p-6 lg:p-8 shadow-2xl border border-primary/20"
                    whileHover={{ y: -5 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="flex flex-col items-center text-center">
                      {/* Large Profile Picture with Ornate Frame - BETTER MOBILE SIZE */}
                      <div className="relative mb-4 lg:mb-6">
                        <OrnateFrame size="large" isFounder={true}>
                          <motion.div
                            className="relative w-32 h-32 sm:w-36 sm:h-36 md:w-40 md:h-40 lg:w-48 lg:h-48 rounded-full overflow-hidden"
                            whileHover={{ scale: 1.05 }}
                            transition={{ duration: 0.3 }}
                          >
                            <img
                              src={founder.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(founder.name)}&size=400&background=00B4D8&color=fff&bold=true`}
                              alt={founder.name}
                              className="w-full h-full object-cover"
                            />
                          </motion.div>
                        </OrnateFrame>
                      </div>

                      {/* STYLISH Name with Gradient & Glow Effect - BETTER MOBILE SIZE */}
                      <motion.h3 
                        className="text-xl sm:text-2xl md:text-2xl lg:text-3xl font-orbitron font-bold mb-2 lg:mb-3 relative"
                        animate={{ 
                          textShadow: [
                            "0 0 20px rgba(236,72,153,0.5), 0 0 40px rgba(168,85,247,0.3)",
                            "0 0 30px rgba(168,85,247,0.5), 0 0 50px rgba(59,130,246,0.3)",
                            "0 0 20px rgba(236,72,153,0.5), 0 0 40px rgba(168,85,247,0.3)"
                          ]
                        }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                      >
                        <span className="bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent animate-gradient">
                          {founder.name}
                        </span>
                      </motion.h3>

                      {/* Founder / CEO Title - BETTER MOBILE SIZE */}
                      <motion.div
                        className="inline-flex items-center gap-2 px-4 md:px-6 py-2 lg:py-2.5 rounded-full bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-red-500/20 border-2 border-amber-400/40 mb-4 shadow-lg"
                        animate={{ 
                          boxShadow: [
                            "0 0 20px rgba(251,191,36,0.3)",
                            "0 0 30px rgba(251,191,36,0.5)",
                            "0 0 20px rgba(251,191,36,0.3)"
                          ]
                        }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        whileHover={{ scale: 1.05 }}
                      >
                        <span className="text-sm md:text-base lg:text-lg font-bold bg-gradient-to-r from-amber-400 via-orange-400 to-amber-300 bg-clip-text text-transparent">
                          👑 Founder
                        </span>
                      </motion.div>

                      {/* Badges */}
                      <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
                        <FounderBadge />
                        {founder.verification_badge === 'gold' && <GoldBadge />}
                        {founder.verification_badge === 'blue' && <BlueBadge />}
                        {founder.verification_badge === 'instagram' && <InstagramBadge />}
                      </div>

                      {/* Experience Badge - BETTER MOBILE SIZE */}
                      {founder.years_of_working > 0 && (
                        <motion.div
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-accent/20 to-accent/30 border border-accent/30 mb-4 lg:mb-5"
                          whileHover={{ scale: 1.05 }}
                        >
                          <Sparkles className="w-4 h-4 text-accent" />
                          <span className="text-sm font-semibold text-accent-foreground">
                            {founder.years_of_working}+ Years
                          </span>
                        </motion.div>
                      )}

                      {/* Bio - BETTER MOBILE SIZE */}
                      {founder.bio && (
                        <p className="text-sm md:text-base text-muted-foreground leading-relaxed mb-4 lg:mb-6 max-w-md">
                          {founder.bio}
                        </p>
                      )}

                      {/* Social Links */}
                      {Object.values(founder.social_links || {}).some(v => v) && (
                        <div className="flex gap-2 md:gap-3 justify-center pt-4 lg:pt-6 border-t border-border/50 w-full">
                          {Object.entries(founder.social_links || {}).map(([key, value]) => (
                            <SocialIcon key={key} type={key} url={value as string} />
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Team Members Section - STYLISH NAMES */}
        {members.length > 0 && (
          <div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center mb-8 sm:mb-10 md:mb-12"
            >
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-orbitron font-bold text-foreground mb-2 sm:mb-3">
                Our Amazing Team
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground">Talented professionals bringing ideas to life</p>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {members.map((member, index) => (
                <motion.div
                  key={member.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="group"
                >
                  <motion.div
                    className="relative bg-card rounded-xl sm:rounded-2xl p-5 sm:p-6 h-full border border-border/50 shadow-lg hover:shadow-2xl transition-all duration-300"
                    whileHover={{ y: -8, scale: 1.02 }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-secondary/0 rounded-xl sm:rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    
                    <div className="relative flex flex-col items-center text-center">
                      {/* Profile Picture with Ornate Frame - RESPONSIVE */}
                      <div className="relative mb-3 sm:mb-4">
                        <OrnateFrame size="small">
                          <motion.div
                            className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full overflow-hidden"
                            whileHover={{ scale: 1.1 }}
                          >
                            <img
                              src={member.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&size=200&background=00B4D8&color=fff`}
                              alt={member.name}
                              className="w-full h-full object-cover"
                            />
                          </motion.div>
                        </OrnateFrame>
                      </div>

                      {/* STYLISH Name with Gradient & Glow Effect */}
                      <motion.h3 
                        className="text-base sm:text-lg md:text-xl font-orbitron font-bold mb-2 relative"
                        animate={{ 
                          textShadow: [
                            "0 0 15px rgba(59,130,246,0.4), 0 0 30px rgba(96,165,250,0.2)",
                            "0 0 20px rgba(96,165,250,0.5), 0 0 35px rgba(59,130,246,0.3)",
                            "0 0 15px rgba(59,130,246,0.4), 0 0 30px rgba(96,165,250,0.2)"
                          ]
                        }}
                        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                      >
                        <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent animate-gradient">
                          {member.name}
                        </span>
                      </motion.h3>

                      {/* Team Member Title */}
                      <motion.div
                        className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-gradient-to-r from-blue-500/20 via-cyan-500/20 to-blue-500/20 border-2 border-blue-400/40 mb-3 shadow-lg"
                        animate={{ 
                          boxShadow: [
                            "0 0 15px rgba(59,130,246,0.3)",
                            "0 0 25px rgba(59,130,246,0.5)",
                            "0 0 15px rgba(59,130,246,0.3)"
                          ]
                        }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        whileHover={{ scale: 1.05 }}
                      >
                        <span className="text-xs sm:text-sm md:text-base font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-300 bg-clip-text text-transparent">
                          👥 Team Member
                        </span>
                      </motion.div>

                      {/* Badges */}
                      {member.verification_badge && (
                        <div className="flex flex-wrap items-center justify-center gap-2 mb-3">
                          {member.verification_badge === 'gold' && <GoldBadge />}
                          {member.verification_badge === 'blue' && <BlueBadge />}
                          {member.verification_badge === 'instagram' && <InstagramBadge />}
                        </div>
                      )}

                      {/* Experience */}
                      {member.years_of_working > 0 && (
                        <div className="px-2 sm:px-3 py-1 rounded-full bg-accent/20 text-accent-foreground text-xs font-semibold mb-3">
                          {member.years_of_working} years experience
                        </div>
                      )}

                      {/* Bio */}
                      {member.bio && (
                        <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4 whitespace-pre-wrap break-words">
                          {member.bio}
                        </p>
                      )}

                      {/* Social Links */}
                      {Object.values(member.social_links || {}).some(v => v) && (
                        <div className="flex gap-2 justify-center pt-3 sm:pt-4 border-t border-border/30 w-full mt-auto">
                          {Object.entries(member.social_links || {}).map(([key, value]) => (
                            <SocialIcon key={key} type={key} url={value as string} />
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {teamMembers.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20 sm:py-32"
          >
            <div className="inline-block p-6 sm:p-8 rounded-full bg-muted/30 mb-4 sm:mb-6">
              <Sparkles className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground text-lg sm:text-xl">No team members yet. Check back soon!</p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Team;
