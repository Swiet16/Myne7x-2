import { User, Mail, MessageCircle, Phone, Calendar, Award, Shield, Crown } from 'lucide-react';
import { useEffect, useRef } from 'react';

interface ProfileCardProps {
  fullName: string;
  email: string;
  whatsappNumber: string;
  telegramId: string;
  profilePictureUrl: string | null;
  memberSince: string;
}

export const ProfileCard = ({ 
  fullName, 
  email, 
  whatsappNumber, 
  telegramId, 
  profilePictureUrl,
  memberSince 
}: ProfileCardProps) => {
  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8">
      <div className="relative bg-[#e8e4db] rounded-[40px] overflow-hidden shadow-2xl min-h-[1400px]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Ctext x='5' y='15' font-family='serif' font-size='8' fill='%23000' opacity='0.03'%3ENEWS%3C/text%3E%3Ctext x='5' y='30' font-family='serif' font-size='6' fill='%23000' opacity='0.03'%3EArticle headline%3C/text%3E%3Ctext x='5' y='40' font-family='serif' font-size='5' fill='%23000' opacity='0.03'%3ELorem ipsum dolor%3C/text%3E%3C/svg%3E")`,
        backgroundSize: '200px 200px'
      }}>
        
        {/* Newspaper texture overlay */}
        <div className="absolute inset-0 opacity-10 mix-blend-multiply" style={{
          backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)`
        }}></div>

        {/* Top corner accent - curved shape */}
        <div className="absolute top-0 left-0 w-40 h-40">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <path d="M 0 0 L 100 0 Q 50 50 0 100 Z" fill="#4a3f35" />
          </svg>
        </div>

        {/* Top right circular accents */}
        <div className="absolute top-0 right-0 w-56 h-56">
          <svg viewBox="0 0 200 200" className="w-full h-full">
            <circle cx="150" cy="50" r="60" fill="none" stroke="#4a3f35" strokeWidth="20" />
            <circle cx="150" cy="50" r="40" fill="none" stroke="#6b5d4f" strokeWidth="15" />
            <circle cx="150" cy="50" r="20" fill="none" stroke="#8a7766" strokeWidth="10" />
          </svg>
        </div>

        {/* Logo badge - top left */}
        <div className="absolute top-6 left-6 z-20 bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg border-2 border-[#4a3f35]/30">
          <div className="flex items-center gap-2">
            <Crown className="h-4 w-4 text-[#4a3f35]" />
            <span className="text-xs font-bold text-[#4a3f35]">Myne7x Platform</span>
          </div>
        </div>

        <div className="relative z-10 pt-24 pb-20 px-6">
          
          {/* Myne7x Logo */}
          <div className="mb-10 flex justify-center" style={{ marginTop: '-3px' }}>
            <div className="relative">
              <img 
                src="https://uqkirciomqdagbnrwcfq.supabase.co/storage/v1/object/public/images/myne7x_logo.png"
                alt="Myne7x Logo"
                className="h-24 w-auto object-contain"
                style={{ 
                  imageRendering: 'crisp-edges',
                  filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.25))',
                  WebkitFontSmoothing: 'antialiased'
                }}
                loading="eager"
              />
            </div>
          </div>

          {/* Profile Picture with circular background */}
          <div className="relative mb-10 flex justify-center">
            {/* Large circular accent behind photo */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[380px] h-[380px] pointer-events-none">
              <svg viewBox="0 0 400 400" className="w-full h-full">
                <circle cx="200" cy="200" r="180" fill="none" stroke="#4a3f35" strokeWidth="30" opacity="0.7" />
                <circle cx="200" cy="200" r="140" fill="none" stroke="#6b5d4f" strokeWidth="20" opacity="0.5" />
                <circle cx="200" cy="200" r="100" fill="none" stroke="#8a7766" strokeWidth="12" opacity="0.3" />
              </svg>
            </div>

            {/* Profile Photo - Perfect Circle that fills completely */}
            <div className="relative w-80 h-80 rounded-full overflow-hidden shadow-2xl border-8 border-white bg-gradient-to-br from-[#6b5d4f] to-[#4a3f35] flex items-center justify-center shrink-0">
              {profilePictureUrl ? (
                <img
                  src={profilePictureUrl}
                  alt={fullName}
                  className="w-full h-full object-cover object-center"
                  style={{ 
                    imageRendering: 'high-quality',
                    filter: 'contrast(1.05) saturate(1.05)',
                    WebkitFontSmoothing: 'antialiased'
                  }}
                  loading="eager"
                  decoding="sync"
                  crossOrigin="anonymous"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <User className="h-32 w-32 text-white/50" />
                </div>
              )}
            </div>
          </div>

          {/* Name Label - with proper margins */}
          <div className="relative mt-10 mb-10 mx-6">
            <div className="bg-[#4a3f35] px-8 py-6 transform -rotate-1 shadow-xl">
              <h2 className="text-4xl font-black text-white tracking-tight text-center leading-tight" style={{
                textShadow: '3px 3px 0px rgba(0,0,0,0.3)'
              }}>
                {fullName?.toUpperCase() || 'WINNER 💖'}
              </h2>
            </div>
            {/* Newspaper texture on name bar */}
            <div className="absolute inset-0 opacity-20 mix-blend-overlay pointer-events-none" style={{
              backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 1px, rgba(255,255,255,0.1) 1px, rgba(255,255,255,0.1) 2px)`
            }}></div>
          </div>

          {/* Info Cards Grid - with proper spacing */}
          <div className="grid grid-cols-1 gap-4 mt-10 px-4">
            
            {/* Email Card */}
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-5 border-2 border-[#4a3f35]/20 shadow-lg">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-[#4a3f35] flex items-center justify-center shrink-0">
                  <Mail className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-sm font-bold text-[#4a3f35] uppercase tracking-wider">Email</h3>
              </div>
              <p className="text-sm font-semibold text-[#6b5d4f] break-all pl-1">{email || 'email@example.com'}</p>
            </div>

            {/* WhatsApp Card */}
            {whatsappNumber && (
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-5 border-2 border-[#4a3f35]/20 shadow-lg">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-lg bg-[#25D366] flex items-center justify-center shrink-0">
                    <Phone className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-sm font-bold text-[#4a3f35] uppercase tracking-wider">WhatsApp</h3>
                </div>
                <p className="text-sm font-semibold text-[#6b5d4f] pl-1">{whatsappNumber}</p>
              </div>
            )}

            {/* Telegram Card */}
            {telegramId && (
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-5 border-2 border-[#4a3f35]/20 shadow-lg">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-lg bg-[#0088cc] flex items-center justify-center shrink-0">
                    <MessageCircle className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-sm font-bold text-[#4a3f35] uppercase tracking-wider">Telegram</h3>
                </div>
                <p className="text-sm font-semibold text-[#6b5d4f] pl-1">{telegramId}</p>
              </div>
            )}
          </div>

          {/* Status Badge - with proper margin from bottom */}
          <div className="mt-10 mb-6 flex justify-center">
            <div className="bg-[#4a3f35] px-6 py-3 rounded-full shadow-lg border-2 border-[#6b5d4f]">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-white" />
                <span className="text-sm font-bold text-white uppercase tracking-wider">Verified Member</span>
                <Award className="h-5 w-5 text-white" />
              </div>
            </div>
          </div>

        </div>

        {/* Bottom decorative strip */}
        <div className="relative h-16 bg-[#4a3f35] overflow-hidden mt-auto">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-[#e8e4db] text-xs font-mono opacity-30 tracking-widest">
              PREMIUM MEMBER • MYNE7X PLATFORM • {new Date().getFullYear()}
            </div>
          </div>
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: `repeating-linear-gradient(90deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 11px)`
          }}></div>
        </div>

      </div>
    </div>
  );
};