import React, { useRef, useEffect } from 'react';

interface Star {
  x: number;
  y: number;
  z: number;
  prevZ: number;
  color: { h: number; s: number; l: number };
}

interface ShootingStar {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: { h: number; s: number; l: number };
  trail: { x: number; y: number }[];
}

interface NebulaCloud {
  x: number;
  y: number;
  radius: number;
  color: { h: number; s: number; l: number };
  phase: number;
  speed: number;
  driftX: number;
  driftY: number;
}

const STAR_COLORS = [
  { h: 200, s: 100, l: 80 },  // Cyan
  { h: 220, s: 100, l: 85 },  // Light blue
  { h: 240, s: 80, l: 90 },   // Pale blue
  { h: 0, s: 0, l: 100 },     // White
  { h: 0, s: 0, l: 95 },      // Off-white
  { h: 45, s: 100, l: 85 },   // Warm yellow
  { h: 30, s: 100, l: 80 },   // Orange-yellow
  { h: 280, s: 60, l: 85 },   // Lavender
  { h: 180, s: 80, l: 75 },   // Teal
];

const SHOOTING_STAR_COLORS = [
  { h: 45, s: 100, l: 70 },   // Golden
  { h: 180, s: 100, l: 70 },  // Cyan
  { h: 280, s: 80, l: 75 },   // Purple
  { h: 0, s: 0, l: 100 },     // White
];

const NEBULA_COLORS = [
  { h: 280, s: 70, l: 30 },   // Deep purple
  { h: 320, s: 60, l: 25 },   // Magenta
  { h: 200, s: 80, l: 25 },   // Deep blue
  { h: 180, s: 70, l: 20 },   // Teal
  { h: 340, s: 50, l: 25 },   // Rose
  { h: 260, s: 60, l: 28 },   // Violet
  { h: 220, s: 75, l: 22 },   // Royal blue
];

export const WarpStarfield: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<Star[]>([]);
  const shootingStarsRef = useRef<ShootingStar[]>([]);
  const nebulasRef = useRef<NebulaCloud[]>([]);
  const animationRef = useRef<number>();
  const lastShootingStarTime = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initializeNebulas();
    };

    const initializeNebulas = () => {
      const numNebulas = 6 + Math.floor(Math.random() * 4);
      nebulasRef.current = [];
      
      for (let i = 0; i < numNebulas; i++) {
        nebulasRef.current.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          radius: 150 + Math.random() * 300,
          color: NEBULA_COLORS[Math.floor(Math.random() * NEBULA_COLORS.length)],
          phase: Math.random() * Math.PI * 2,
          speed: 0.0005 + Math.random() * 0.001,
          driftX: (Math.random() - 0.5) * 0.2,
          driftY: (Math.random() - 0.5) * 0.15,
        });
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Initialize stars with random colors
    const numStars = 400;
    starsRef.current = [];
    
    for (let i = 0; i < numStars; i++) {
      starsRef.current.push({
        x: (Math.random() - 0.5) * canvas.width * 2,
        y: (Math.random() - 0.5) * canvas.height * 2,
        z: Math.random() * 1500 + 500,
        prevZ: 0,
        color: STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)],
      });
    }

    const createShootingStar = () => {
      const canvas = canvasRef.current;
      if (!canvas) return null;

      const side = Math.floor(Math.random() * 4);
      let x, y, vx, vy;
      
      const speed = 8 + Math.random() * 12;
      const angle = Math.random() * Math.PI * 0.5 - Math.PI * 0.25;

      switch (side) {
        case 0:
          x = Math.random() * canvas.width;
          y = -20;
          vx = Math.sin(angle) * speed;
          vy = Math.cos(angle) * speed;
          break;
        case 1:
          x = canvas.width + 20;
          y = Math.random() * canvas.height * 0.6;
          vx = -Math.cos(angle) * speed;
          vy = Math.sin(angle) * speed + speed * 0.3;
          break;
        case 2:
          x = -20;
          y = Math.random() * canvas.height * 0.6;
          vx = Math.cos(angle) * speed;
          vy = Math.sin(angle) * speed + speed * 0.3;
          break;
        default:
          x = Math.random() > 0.5 ? canvas.width * 0.1 : canvas.width * 0.9;
          y = -20;
          vx = (Math.random() - 0.5) * speed;
          vy = speed;
      }

      return {
        x,
        y,
        vx,
        vy,
        life: 0,
        maxLife: 60 + Math.random() * 60,
        size: 2 + Math.random() * 3,
        color: SHOOTING_STAR_COLORS[Math.floor(Math.random() * SHOOTING_STAR_COLORS.length)],
        trail: [],
      };
    };

    const drawNebulas = (time: number) => {
      nebulasRef.current.forEach((nebula) => {
        // Animate nebula
        nebula.phase += nebula.speed;
        nebula.x += nebula.driftX;
        nebula.y += nebula.driftY;

        // Wrap around screen
        if (nebula.x < -nebula.radius) nebula.x = canvas.width + nebula.radius;
        if (nebula.x > canvas.width + nebula.radius) nebula.x = -nebula.radius;
        if (nebula.y < -nebula.radius) nebula.y = canvas.height + nebula.radius;
        if (nebula.y > canvas.height + nebula.radius) nebula.y = -nebula.radius;

        // Pulsing opacity
        const pulseOpacity = 0.03 + Math.sin(nebula.phase) * 0.015;
        const breatheRadius = nebula.radius + Math.sin(nebula.phase * 1.5) * 20;

        // Create layered gradient for depth
        const gradient = ctx.createRadialGradient(
          nebula.x, nebula.y, 0,
          nebula.x, nebula.y, breatheRadius
        );

        const { h, s, l } = nebula.color;
        gradient.addColorStop(0, `hsla(${h}, ${s}%, ${l + 15}%, ${pulseOpacity * 1.5})`);
        gradient.addColorStop(0.3, `hsla(${h}, ${s}%, ${l}%, ${pulseOpacity})`);
        gradient.addColorStop(0.6, `hsla(${h}, ${s - 10}%, ${l - 5}%, ${pulseOpacity * 0.6})`);
        gradient.addColorStop(1, 'transparent');

        ctx.fillStyle = gradient;
        ctx.fillRect(
          nebula.x - breatheRadius,
          nebula.y - breatheRadius,
          breatheRadius * 2,
          breatheRadius * 2
        );

        // Add secondary glow layer with slight offset for depth
        const offset = Math.sin(nebula.phase * 0.7) * 15;
        const gradient2 = ctx.createRadialGradient(
          nebula.x + offset, nebula.y + offset * 0.5, 0,
          nebula.x + offset, nebula.y + offset * 0.5, breatheRadius * 0.7
        );
        
        const h2 = (h + 30) % 360;
        gradient2.addColorStop(0, `hsla(${h2}, ${s}%, ${l + 10}%, ${pulseOpacity * 0.8})`);
        gradient2.addColorStop(0.5, `hsla(${h2}, ${s}%, ${l}%, ${pulseOpacity * 0.4})`);
        gradient2.addColorStop(1, 'transparent');

        ctx.fillStyle = gradient2;
        ctx.fillRect(
          nebula.x + offset - breatheRadius,
          nebula.y + offset * 0.5 - breatheRadius,
          breatheRadius * 2,
          breatheRadius * 2
        );
      });
    };

    const animate = (time: number) => {
      if (!canvas || !ctx) return;

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const speed = 15;

      // Clear with semi-transparent for trail effect
      ctx.fillStyle = 'rgba(0, 0, 3, 0.12)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw nebula clouds first (background layer)
      drawNebulas(time);

      // Draw warp stars
      starsRef.current.forEach((star) => {
        star.prevZ = star.z;
        star.z -= speed;

        if (star.z <= 0) {
          star.x = (Math.random() - 0.5) * canvas.width * 2;
          star.y = (Math.random() - 0.5) * canvas.height * 2;
          star.z = 1500;
          star.prevZ = star.z;
          if (Math.random() < 0.3) {
            star.color = STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)];
          }
        }

        const sx = (star.x / star.z) * 500 + centerX;
        const sy = (star.y / star.z) * 500 + centerY;
        const prevSx = (star.x / star.prevZ) * 500 + centerX;
        const prevSy = (star.y / star.prevZ) * 500 + centerY;

        if (sx >= 0 && sx <= canvas.width && sy >= 0 && sy <= canvas.height) {
          const brightness = Math.min(1, (1500 - star.z) / 1000);
          const size = Math.max(0.5, (1 - star.z / 1500) * 3);

          ctx.beginPath();
          ctx.moveTo(prevSx, prevSy);
          ctx.lineTo(sx, sy);

          const { h, s, l } = star.color;
          ctx.strokeStyle = `hsla(${h}, ${s}%, ${l * brightness}%, ${brightness})`;
          ctx.lineWidth = size;
          ctx.lineCap = 'round';
          ctx.stroke();

          if (brightness > 0.5) {
            ctx.beginPath();
            ctx.arc(sx, sy, size * 0.8, 0, Math.PI * 2);
            ctx.fillStyle = `hsla(${h}, ${Math.max(0, s - 30)}%, ${Math.min(100, l + 10)}%, ${brightness})`;
            ctx.fill();
          }
        }
      });

      // Spawn shooting stars
      if (time - lastShootingStarTime.current > 2000 + Math.random() * 3000) {
        const newStar = createShootingStar();
        if (newStar) {
          shootingStarsRef.current.push(newStar);
          lastShootingStarTime.current = time;
        }
      }

      // Update and draw shooting stars
      shootingStarsRef.current = shootingStarsRef.current.filter((star) => {
        star.life++;
        star.x += star.vx;
        star.y += star.vy;
        
        star.trail.push({ x: star.x, y: star.y });
        if (star.trail.length > 25) {
          star.trail.shift();
        }

        if (star.life > star.maxLife || 
            star.x < -50 || star.x > canvas.width + 50 ||
            star.y < -50 || star.y > canvas.height + 50) {
          return false;
        }

        if (star.trail.length > 1) {
          const { h, s, l } = star.color;
          
          for (let i = 1; i < star.trail.length; i++) {
            const alpha = (i / star.trail.length) * 0.8;
            const width = (i / star.trail.length) * star.size;
            
            ctx.beginPath();
            ctx.moveTo(star.trail[i - 1].x, star.trail[i - 1].y);
            ctx.lineTo(star.trail[i].x, star.trail[i].y);
            ctx.strokeStyle = `hsla(${h}, ${s}%, ${l}%, ${alpha})`;
            ctx.lineWidth = width;
            ctx.lineCap = 'round';
            ctx.stroke();
          }

          ctx.beginPath();
          ctx.arc(star.x, star.y, star.size * 1.5, 0, Math.PI * 2);
          const gradient = ctx.createRadialGradient(
            star.x, star.y, 0,
            star.x, star.y, star.size * 2
          );
          gradient.addColorStop(0, `hsla(${h}, ${s}%, 100%, 1)`);
          gradient.addColorStop(0.3, `hsla(${h}, ${s}%, ${l}%, 0.8)`);
          gradient.addColorStop(1, `hsla(${h}, ${s}%, ${l}%, 0)`);
          ctx.fillStyle = gradient;
          ctx.fill();

          if (Math.random() < 0.3) {
            ctx.beginPath();
            ctx.arc(
              star.x + (Math.random() - 0.5) * 10,
              star.y + (Math.random() - 0.5) * 10,
              Math.random() * 2,
              0,
              Math.PI * 2
            );
            ctx.fillStyle = `hsla(${h}, 50%, 90%, ${Math.random() * 0.5 + 0.3})`;
            ctx.fill();
          }
        }

        return true;
      });

      // Subtle center glow
      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, Math.max(canvas.width, canvas.height) * 0.5);
      gradient.addColorStop(0, 'rgba(100, 200, 255, 0.02)');
      gradient.addColorStop(0.5, 'rgba(80, 150, 255, 0.01)');
      gradient.addColorStop(1, 'transparent');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      animationRef.current = requestAnimationFrame(animate);
    };

    animate(0);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none"
      style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        margin: 0,
        padding: 0,
        background: '#000003',
        zIndex: 0,
      }}
    />
  );
};
