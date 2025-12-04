import React, { useRef, useEffect } from 'react';

interface Star {
  x: number;
  y: number;
  z: number;
  prevZ: number;
}

export const WarpStarfield: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const starsRef = useRef<Star[]>([]);
  const animationRef = useRef<number>();

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

    // Initialize stars
    const numStars = 400;
    starsRef.current = [];
    
    for (let i = 0; i < numStars; i++) {
      starsRef.current.push({
        x: (Math.random() - 0.5) * canvas.width * 2,
        y: (Math.random() - 0.5) * canvas.height * 2,
        z: Math.random() * 1500 + 500,
        prevZ: 0,
      });
    }

    const animate = () => {
      if (!canvas || !ctx) return;

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const speed = 15;

      // Semi-transparent black for trail effect
      ctx.fillStyle = 'rgba(0, 0, 3, 0.15)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      starsRef.current.forEach((star) => {
        star.prevZ = star.z;
        star.z -= speed;

        // Reset star if it passes the camera
        if (star.z <= 0) {
          star.x = (Math.random() - 0.5) * canvas.width * 2;
          star.y = (Math.random() - 0.5) * canvas.height * 2;
          star.z = 1500;
          star.prevZ = star.z;
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

          // Draw the star trail
          ctx.beginPath();
          ctx.moveTo(prevSx, prevSy);
          ctx.lineTo(sx, sy);

          // Color gradient from cyan to white based on speed/proximity
          const hue = 180 + (brightness * 40); // Cyan to blue-white
          ctx.strokeStyle = `hsla(${hue}, 100%, ${50 + brightness * 50}%, ${brightness})`;
          ctx.lineWidth = size;
          ctx.lineCap = 'round';
          ctx.stroke();

          // Draw bright point at the head of the streak
          if (brightness > 0.5) {
            ctx.beginPath();
            ctx.arc(sx, sy, size * 0.8, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${brightness})`;
            ctx.fill();
          }
        }
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

    animate();

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
      className="fixed inset-0 z-0 pointer-events-none"
      style={{ background: '#000003' }}
    />
  );
};
