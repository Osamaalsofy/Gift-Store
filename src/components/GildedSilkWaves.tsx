import React, { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  speed: number;
  noiseOffset: number;
  color: string;
}

interface Wave {
  points: number;
  amplitude: number;
  speed: number;
  color: string;
  lineWidth: number;
  offsetY: number;
  phase: number;
  bounceOffset: number;
}

export default function GildedSilkWaves() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouseRef = useRef({ x: 0, y: 0, tx: 0, ty: 0, active: false });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let width = (canvas.width = canvas.offsetWidth || window.innerWidth);
    let height = (canvas.height = canvas.offsetHeight || 600);

    mouseRef.current = {
      x: width / 2,
      y: height / 2,
      tx: width / 2,
      ty: height / 2,
      active: false,
    };

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth || window.innerWidth;
      height = canvas.height = canvas.offsetHeight || 600;
    };

    window.addEventListener("resize", handleResize);

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current.tx = e.clientX - rect.left;
      mouseRef.current.ty = e.clientY - rect.top;
      mouseRef.current.active = true;
    };

    const handleMouseLeave = () => {
      mouseRef.current.active = false;
    };

    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseleave", handleMouseLeave);

    // Warm, luxury color palette (matches PresentPerfect branding)
    const goldColors = [
      "rgba(166, 139, 103, 0.45)", // Bronze/gold
      "rgba(226, 216, 194, 0.5)",  // Linen/gold highlight
      "rgba(74, 93, 78, 0.25)",    // Elegant Sage green
      "rgba(250, 247, 241, 0.6)",  // Silk cream
    ];

    // Instantiate premium sparkling dust particles
    const particles: Particle[] = [];
    const maxParticles = 45;

    for (let i = 0; i < maxParticles; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: -Math.random() * 0.6 - 0.2, // slowly rising
        size: Math.random() * 2 + 1,
        alpha: Math.random() * 0.5 + 0.3,
        speed: Math.random() * 0.02 + 0.005,
        noiseOffset: Math.random() * 1000,
        color: i % 4 === 0 ? "#A68B67" : i % 4 === 1 ? "#E2D8C2" : i % 4 === 2 ? "#D0C3AA" : "#FAF7F1",
      });
    }

    // Instantiate elegant layered silk waves
    const waves: Wave[] = [
      {
        points: 8,
        amplitude: 35,
        speed: 0.004,
        color: "rgba(74, 93, 78, 0.07)", // Sage background wave
        lineWidth: 6,
        offsetY: height * 0.45,
        phase: 0,
        bounceOffset: 1.2,
      },
      {
        points: 9,
        amplitude: 45,
        speed: 0.006,
        color: "rgba(166, 139, 103, 0.12)", // Golden secondary wave
        lineWidth: 1.5,
        offsetY: height * 0.5,
        phase: Math.PI / 4,
        bounceOffset: 0.8,
      },
      {
        points: 10,
        amplitude: 55,
        speed: 0.008,
        color: "rgba(166, 139, 103, 0.24)", // Sharp golden thread
        lineWidth: 2.2,
        offsetY: height * 0.55,
        phase: Math.PI / 2,
        bounceOffset: 1.5,
      },
      {
        points: 8,
        amplitude: 28,
        speed: 0.005,
        color: "rgba(226, 216, 194, 0.35)", // Linen foreground silk highlight
        lineWidth: 4.5,
        offsetY: height * 0.6,
        phase: Math.PI * 0.75,
        bounceOffset: 0.5,
      },
    ];

    let tick = 0;

    const animate = () => {
      tick++;
      ctx.clearRect(0, 0, width, height);

      // Smooth mouse interpolation
      const mouse = mouseRef.current;
      if (mouse.active) {
        mouse.x += (mouse.tx - mouse.x) * 0.08;
        mouse.y += (mouse.ty - mouse.y) * 0.08;
      } else {
        // Return to a soft floating default coordinate
        const targetX = width * 0.5 + Math.cos(tick * 0.004) * (width * 0.15);
        const targetY = height * 0.5 + Math.sin(tick * 0.006) * (height * 0.1);
        mouse.x += (targetX - mouse.x) * 0.03;
        mouse.y += (targetY - mouse.y) * 0.03;
      }

      // Draw luxurious ambient soft glow background
      const ambientGlow = ctx.createRadialGradient(
        mouse.x,
        mouse.y,
        10,
        width * 0.5,
        height * 0.5,
        Math.max(width, height) * 0.8
      );
      ambientGlow.addColorStop(0, "#FCFAF7");
      ambientGlow.addColorStop(0.5, "#FAF7F1");
      ambientGlow.addColorStop(1, "#F4EFE6");
      ctx.fillStyle = ambientGlow;
      ctx.fillRect(0, 0, width, height);

      // Draw subtle warm grid-like soft vertical bands
      ctx.save();
      ctx.strokeStyle = "rgba(166, 139, 103, 0.02)";
      ctx.lineWidth = 1;
      const numLines = 12;
      for (let i = 0; i <= numLines; i++) {
        const xPos = (width / numLines) * i;
        ctx.beginPath();
        ctx.moveTo(xPos, 0);
        ctx.lineTo(xPos, height);
        ctx.stroke();
      }
      ctx.restore();

      // Render flowing, ribbon-like silk waves
      waves.forEach((w, wIdx) => {
        ctx.save();
        ctx.beginPath();

        w.phase += w.speed;
        const segmentWidth = width / (w.points - 1);

        const curvePoints: { x: number; y: number }[] = [];

        for (let i = 0; i < w.points; i++) {
          const ptX = i * segmentWidth;
          
          // Pure harmonic wave formula
          const angle = w.phase + (i * 0.65);
          let ptY = w.offsetY + Math.sin(angle) * w.amplitude;

          // Parallax movement with mouse
          const dx = mouse.x - ptX;
          const dy = mouse.y - ptY;
          const distance = Math.hypot(dx, dy);

          // Interactive ripple effect when mouse is near the wave segment
          const influenceRange = 260;
          if (distance < influenceRange) {
            const ratio = 1 - distance / influenceRange;
            // Push or pull the wave gently for high tactile responsiveness
            ptY += (dy * ratio * 0.28 * Math.cos(tick * 0.01 + wIdx));
          }

          // Ambient secondary slow harmonic drift
          ptY += Math.sin(tick * 0.001 * w.bounceOffset + i) * 6;

          curvePoints.push({ x: ptX, y: ptY });
        }

        // Draw bezier smoothed curves
        ctx.moveTo(curvePoints[0].x, curvePoints[0].y);
        for (let i = 0; i < curvePoints.length - 1; i++) {
          const xc = (curvePoints[i].x + curvePoints[i + 1].x) / 2;
          const yc = (curvePoints[i].y + curvePoints[i + 1].y) / 2;
          ctx.quadraticCurveTo(curvePoints[i].x, curvePoints[i].y, xc, yc);
        }
        ctx.lineTo(width, curvePoints[curvePoints.length - 1].y);

        // Styling: Create rich ribbon shadows or glowing brush strokes
        ctx.strokeStyle = w.color;
        ctx.lineWidth = w.lineWidth;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        // Add soft golden glow for the sharp thread
        if (wIdx === 2) {
          ctx.shadowColor = "rgba(166, 139, 103, 0.4)";
          ctx.shadowBlur = 12;
        }

        ctx.stroke();
        ctx.restore();
      });

      // Render sparkling dust particles with subtle tail drift
      particles.forEach((p) => {
        p.x += p.vx + Math.sin(tick * p.speed + p.noiseOffset) * 0.2;
        p.y += p.vy;

        // Reset particle when it floats off-screen
        if (p.y < -10) {
          p.y = height + 10;
          p.x = Math.random() * width;
          p.alpha = Math.random() * 0.5 + 0.3;
        }
        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;

        // Interactive mouse gravity (slight pull/glowing swirl)
        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 200) {
          const pull = (1 - dist / 200) * 0.28;
          p.x += dx * pull * 0.06;
          p.y += dy * pull * 0.06;
          p.alpha = Math.min(1.0, p.alpha + 0.03);
        } else {
          // Slowly decay alpha back to normal
          p.alpha += (Math.max(0.2, Math.min(0.8, p.alpha)) - p.alpha) * 0.05;
        }

        // Pulse the size slightly
        const pulseSize = p.size + Math.sin(tick * p.speed * 2) * 0.4;

        ctx.save();
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = pulseSize * 3;
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(0.5, pulseSize), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // Add elegant blurred decorative ambient background spots representing handcrafted silk lanterns
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      const spotX = width * 0.75 + Math.cos(tick * 0.001) * 50;
      const spotY = height * 0.3 + Math.sin(tick * 0.001) * 30;
      const spotGlow = ctx.createRadialGradient(spotX, spotY, 0, spotX, spotY, 180);
      spotGlow.addColorStop(0, "rgba(226, 216, 194, 0.15)");
      spotGlow.addColorStop(1, "rgba(226, 216, 194, 0)");
      ctx.fillStyle = spotGlow;
      ctx.beginPath();
      ctx.arc(spotX, spotY, 180, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", handleResize);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      id="gilded-silk-waves-canvas"
      className="absolute inset-0 w-full h-full block z-0 pointer-events-auto"
    />
  );
}
