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

export const WarpStarfield: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<Star[]>([]);
  const shootingStarsRef = useRef<ShootingStar[]>([]);
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

      // Random starting position from edges
      const side = Math.floor(Math.random() * 4);
      let x, y, vx, vy;
      
      const speed = 8 + Math.random() * 12;
      const angle = Math.random() * Math.PI * 0.5 - Math.PI * 0.25; // -45 to +45 degrees variation

      switch (side) {
        case 0: // Top
          x = Math.random() * canvas.width;
          y = -20;
          vx = Math.sin(angle) * speed;
          vy = Math.cos(angle) * speed;
          break;
        case 1: // Right
          x = canvas.width + 20;
          y = Math.random() * canvas.height * 0.6;
          vx = -Math.cos(angle) * speed;
          vy = Math.sin(angle) * speed + speed * 0.3;
          break;
        case 2: // Left
          x = -20;
          y = Math.random() * canvas.height * 0.6;
          vx = Math.cos(angle) * speed;
          vy = Math.sin(angle) * speed + speed * 0.3;
          break;
        default: // Top corners
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

    const animate = (time: number) => {
      if (!canvas || !ctx) return;

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const speed = 15;

      // Semi-transparent black for trail effect
      ctx.fillStyle = 'rgba(0, 0, 3, 0.15)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw warp stars
      starsRef.current.forEach((star) => {
        star.prevZ = star.z;
        star.z -= speed;

        // Reset star if it passes the camera
        if (star.z <= 0) {
          star.x = (Math.random() - 0.5) * canvas.width * 2;
          star.y = (Math.random() - 0.5) * canvas.height * 2;
          star.z = 1500;
          star.prevZ = star.z;
          // Occasionally change color on reset
          if (Math.random() < 0.3) {
            star.color = STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)];
          }
        }

        // Project 3D to 2D
        const sx = (star.x / star.z) * 500 + centerX;
        const sy = (star.y / star.z) * 500 + centerY;
        const prevSx = (star.x / star.prevZ) * 500 + centerX;
        const prevSy = (star.y / star.prevZ) * 500 + centerY;

        // Only draw if on screen
        if (sx >= 0 && sx <= canvas.width && sy >= 0 && sy <= canvas.height) {
          // Calculate brightness and size based on z-depth
          const brightness = Math.min(1, (1500 - star.z) / 1000);
          const size = Math.max(0.5, (1 - star.z / 1500) * 3);

          // Draw the star trail with custom color
          ctx.beginPath();
          ctx.moveTo(prevSx, prevSy);
          ctx.lineTo(sx, sy);

          // Use the star's color with brightness adjustment
          const { h, s, l } = star.color;
          ctx.strokeStyle = `hsla(${h}, ${s}%, ${l * brightness}%, ${brightness})`;
          ctx.lineWidth = size;
          ctx.lineCap = 'round';
          ctx.stroke();

          // Draw bright point at the head of the streak
          if (brightness > 0.5) {
            ctx.beginPath();
            ctx.arc(sx, sy, size * 0.8, 0, Math.PI * 2);
            ctx.fillStyle = `hsla(${h}, ${Math.max(0, s - 30)}%, ${Math.min(100, l + 10)}%, ${brightness})`;
            ctx.fill();
          }
        }
      });

      // Spawn shooting stars occasionally (every 2-5 seconds)
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
        
        // Add current position to trail
        star.trail.push({ x: star.x, y: star.y });
        if (star.trail.length > 25) {
          star.trail.shift();
        }

        // Check if still alive and on screen
        if (star.life > star.maxLife || 
            star.x < -50 || star.x > canvas.width + 50 ||
            star.y < -50 || star.y > canvas.height + 50) {
          return false;
        }

        // Draw shooting star trail
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

          // Draw bright head
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

          // Add sparkle effect
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

      // Add subtle radial glow from center
      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, Math.max(canvas.width, canvas.height) * 0.5);
      gradient.addColorStop(0, 'rgba(100, 200, 255, 0.03)');
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
      className="fixed z-0 pointer-events-none"
      style={{ 
        background: '#000003',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
      }}
    />
  );
};
