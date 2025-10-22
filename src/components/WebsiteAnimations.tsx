import { useEffect, useRef } from 'react';

interface WebsiteAnimationsProps {
  animationType: string;
  isDarkMode?: boolean;
}

export const WebsiteAnimations = ({ animationType, isDarkMode = false }: WebsiteAnimationsProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || animationType === 'none') return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const updateCanvasSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);

    let animationFrameId: number;
    const particles: any[] = [];

    // Animation: Data Flow - Horizontal flowing data streams
    const initDataFlow = () => {
      for (let i = 0; i < 50; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 3 + 1,
          speedX: Math.random() * 2 + 1,
          speedY: (Math.random() - 0.5) * 0.5,
          opacity: Math.random() * 0.5 + 0.2,
        });
      }
    };

    const animateDataFlow = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      particles.forEach(particle => {
        ctx.fillStyle = isDarkMode 
          ? `rgba(59, 130, 246, ${particle.opacity})`  // Blue for dark mode
          : `rgba(37, 99, 235, ${particle.opacity})`;  // Darker blue for light mode
        
        ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
        
        // Draw connection lines
        particles.forEach(otherParticle => {
          const dx = particle.x - otherParticle.x;
          const dy = particle.y - otherParticle.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < 100) {
            ctx.strokeStyle = isDarkMode
              ? `rgba(59, 130, 246, ${0.1 * (1 - distance / 100)})`
              : `rgba(37, 99, 235, ${0.1 * (1 - distance / 100)})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(otherParticle.x, otherParticle.y);
            ctx.stroke();
          }
        });
        
        particle.x += particle.speedX;
        particle.y += particle.speedY;
        
        if (particle.x > canvas.width) particle.x = 0;
        if (particle.x < 0) particle.x = canvas.width;
        if (particle.y > canvas.height) particle.y = 0;
        if (particle.y < 0) particle.y = canvas.height;
      });
      
      animationFrameId = requestAnimationFrame(animateDataFlow);
    };

    // Animation: Matrix Rain - Falling data particles
    const initMatrixRain = () => {
      for (let i = 0; i < 80; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 2 + 1,
          speed: Math.random() * 3 + 2,
          opacity: Math.random() * 0.6 + 0.3,
          char: String.fromCharCode(Math.random() * 94 + 33),
        });
      }
    };

    const animateMatrixRain = () => {
      ctx.fillStyle = isDarkMode ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      particles.forEach(particle => {
        ctx.fillStyle = isDarkMode
          ? `rgba(34, 197, 94, ${particle.opacity})`  // Green for dark mode
          : `rgba(21, 128, 61, ${particle.opacity})`;  // Darker green for light mode
        ctx.font = `${particle.size * 8}px monospace`;
        ctx.fillText(particle.char, particle.x, particle.y);
        
        particle.y += particle.speed;
        
        if (particle.y > canvas.height) {
          particle.y = 0;
          particle.x = Math.random() * canvas.width;
          particle.char = String.fromCharCode(Math.random() * 94 + 33);
        }
      });
      
      animationFrameId = requestAnimationFrame(animateMatrixRain);
    };

    // Animation: Neural Network - Connected nodes
    const initNeuralNetwork = () => {
      for (let i = 0; i < 40; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 4 + 2,
          speedX: (Math.random() - 0.5) * 1,
          speedY: (Math.random() - 0.5) * 1,
          opacity: Math.random() * 0.6 + 0.3,
        });
      }
    };

    const animateNeuralNetwork = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      particles.forEach(particle => {
        // Draw connections
        particles.forEach(otherParticle => {
          const dx = particle.x - otherParticle.x;
          const dy = particle.y - otherParticle.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < 150) {
            ctx.strokeStyle = isDarkMode
              ? `rgba(168, 85, 247, ${0.2 * (1 - distance / 150)})`  // Purple
              : `rgba(126, 34, 206, ${0.2 * (1 - distance / 150)})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(otherParticle.x, otherParticle.y);
            ctx.stroke();
          }
        });
        
        // Draw node
        ctx.fillStyle = isDarkMode
          ? `rgba(168, 85, 247, ${particle.opacity})`
          : `rgba(126, 34, 206, ${particle.opacity})`;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
        
        particle.x += particle.speedX;
        particle.y += particle.speedY;
        
        if (particle.x > canvas.width) particle.x = 0;
        if (particle.x < 0) particle.x = canvas.width;
        if (particle.y > canvas.height) particle.y = 0;
        if (particle.y < 0) particle.y = canvas.height;
      });
      
      animationFrameId = requestAnimationFrame(animateNeuralNetwork);
    };

    // Animation: Particle Field - Floating particles
    const initParticleField = () => {
      for (let i = 0; i < 100; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 3 + 1,
          speedX: (Math.random() - 0.5) * 0.8,
          speedY: (Math.random() - 0.5) * 0.8,
          opacity: Math.random() * 0.4 + 0.2,
        });
      }
    };

    const animateParticleField = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      particles.forEach(particle => {
        ctx.fillStyle = isDarkMode
          ? `rgba(251, 191, 36, ${particle.opacity})`  // Yellow/amber
          : `rgba(217, 119, 6, ${particle.opacity})`;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
        
        particle.x += particle.speedX;
        particle.y += particle.speedY;
        
        if (particle.x > canvas.width) particle.x = 0;
        if (particle.x < 0) particle.x = canvas.width;
        if (particle.y > canvas.height) particle.y = 0;
        if (particle.y < 0) particle.y = canvas.height;
      });
      
      animationFrameId = requestAnimationFrame(animateParticleField);
    };

    // Animation: Cosmic Dust - Slow moving dots with twinkle
    const initCosmicDust = () => {
      for (let i = 0; i < 150; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 2 + 0.5,
          speedX: (Math.random() - 0.5) * 0.3,
          speedY: (Math.random() - 0.5) * 0.3,
          opacity: Math.random() * 0.5 + 0.2,
          twinkle: Math.random() * 0.02,
        });
      }
    };

    const animateCosmicDust = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      particles.forEach(particle => {
        particle.opacity += particle.twinkle;
        if (particle.opacity > 0.7 || particle.opacity < 0.2) {
          particle.twinkle = -particle.twinkle;
        }
        
        ctx.fillStyle = isDarkMode
          ? `rgba(147, 197, 253, ${particle.opacity})`  // Light blue
          : `rgba(59, 130, 246, ${particle.opacity})`;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
        
        particle.x += particle.speedX;
        particle.y += particle.speedY;
        
        if (particle.x > canvas.width) particle.x = 0;
        if (particle.x < 0) particle.x = canvas.width;
        if (particle.y > canvas.height) particle.y = 0;
        if (particle.y < 0) particle.y = canvas.height;
      });
      
      animationFrameId = requestAnimationFrame(animateCosmicDust);
    };

    // Animation: Binary Stream - Binary code flowing
    const initBinaryStream = () => {
      for (let i = 0; i < 60; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 2 + 1,
          speedY: Math.random() * 2 + 1,
          opacity: Math.random() * 0.5 + 0.3,
          value: Math.random() > 0.5 ? '1' : '0',
        });
      }
    };

    const animateBinaryStream = () => {
      ctx.fillStyle = isDarkMode ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      particles.forEach(particle => {
        ctx.fillStyle = isDarkMode
          ? `rgba(239, 68, 68, ${particle.opacity})`  // Red
          : `rgba(185, 28, 28, ${particle.opacity})`;
        ctx.font = `${particle.size * 10}px monospace`;
        ctx.fillText(particle.value, particle.x, particle.y);
        
        particle.y += particle.speedY;
        
        if (particle.y > canvas.height) {
          particle.y = 0;
          particle.x = Math.random() * canvas.width;
          particle.value = Math.random() > 0.5 ? '1' : '0';
        }
      });
      
      animationFrameId = requestAnimationFrame(animateBinaryStream);
    };

    // Initialize based on animation type
    switch (animationType) {
      case 'data-flow':
        initDataFlow();
        animateDataFlow();
        break;
      case 'matrix-rain':
        initMatrixRain();
        animateMatrixRain();
        break;
      case 'neural-network':
        initNeuralNetwork();
        animateNeuralNetwork();
        break;
      case 'particle-field':
        initParticleField();
        animateParticleField();
        break;
      case 'cosmic-dust':
        initCosmicDust();
        animateCosmicDust();
        break;
      case 'binary-stream':
        initBinaryStream();
        animateBinaryStream();
        break;
      default:
        break;
    }

    return () => {
      window.removeEventListener('resize', updateCanvasSize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [animationType, isDarkMode]);

  if (animationType === 'none') return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none select-none"
      style={{
        zIndex: 0,
        opacity: 0.6,
      }}
    />
  );
};