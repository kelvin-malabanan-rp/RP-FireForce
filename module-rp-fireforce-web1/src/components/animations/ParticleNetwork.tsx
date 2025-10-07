import React, { useRef, useEffect } from 'react';

interface ParticleNetworkProps {
  className?: string;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  opacity: number;
}

export const ParticleNetwork: React.FC<ParticleNetworkProps> = ({ className = "" }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Initialize particles
    const initParticles = () => {
      const particleCount = Math.min(80, Math.floor((canvas.width * canvas.height) / 15000));
      particlesRef.current = [];

      for (let i = 0; i < particleCount; i++) {
        particlesRef.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          radius: Math.random() * 2 + 1.5,
          opacity: Math.random() * 0.4 + 0.3,
        });
      }
    };

    initParticles();

    // Mouse tracking
    const handleMouseMove = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current.x = event.clientX - rect.left;
      mouseRef.current.y = event.clientY - rect.top;
    };

    canvas.addEventListener('mousemove', handleMouseMove);

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const particles = particlesRef.current;
      const mouse = mouseRef.current;

      // Update and draw particles
      particles.forEach((particle, index) => {
        // Update position
        particle.x += particle.vx;
        particle.y += particle.vy;

        // Bounce off edges
        if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1;
        if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1;

        // Keep particles in bounds
        particle.x = Math.max(0, Math.min(canvas.width, particle.x));
        particle.y = Math.max(0, Math.min(canvas.height, particle.y));

        // Mouse interaction - attract particles slightly
        if (mouse.x && mouse.y) {
          const dx = mouse.x - particle.x;
          const dy = mouse.y - particle.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < 120) {
            const force = (120 - distance) / 120 * 0.003;
            particle.vx += (dx / distance) * force;
            particle.vy += (dy / distance) * force;
          }
        }

        // Apply friction for smoother movement
        particle.vx *= 0.998;
        particle.vy *= 0.998;

        // Draw connections to nearby particles
        particles.forEach((otherParticle, otherIndex) => {
          if (index >= otherIndex) return;

          const dx = particle.x - otherParticle.x;
          const dy = particle.y - otherParticle.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          // Connect particles that are close to each other
          if (distance < 120) {
            const opacity = Math.pow((120 - distance) / 120, 2) * 0.4;
            
            ctx.strokeStyle = `rgba(249, 115, 22, ${opacity})`;
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(otherParticle.x, otherParticle.y);
            ctx.stroke();
          }
        });

        // Draw particle with improved glow
        ctx.fillStyle = `rgba(249, 115, 22, ${particle.opacity})`;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.fill();

        // Add enhanced glow effect
        ctx.fillStyle = `rgba(249, 115, 22, ${particle.opacity * 0.2})`;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius * 1.8, 0, Math.PI * 2);
        ctx.fill();
        
        // Outer glow for more depth
        ctx.fillStyle = `rgba(249, 115, 22, ${particle.opacity * 0.1})`;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius * 2.5, 0, Math.PI * 2);
        ctx.fill();
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      canvas.removeEventListener('mousemove', handleMouseMove);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`fixed inset-0 pointer-events-none ${className}`}
      style={{ zIndex: 1 }}
    />
  );
};
