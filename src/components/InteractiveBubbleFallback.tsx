import React, { useEffect, useRef } from "react";

export default function InteractiveBubbleFallback() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mouseRef = useRef({ x: 0, y: 0, tx: 0, ty: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let width = canvas.width = canvas.offsetWidth || window.innerWidth;
    let height = canvas.height = canvas.offsetHeight || 600;

    // Set initial mouse position to the center of the canvas
    mouseRef.current = {
      x: width / 2,
      y: height / 2,
      tx: width / 2,
      ty: height / 2,
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
    };

    // Listen to mousemove globally to capture movements across the entire hero layout smoothly
    window.addEventListener("mousemove", handleMouseMove);

    // Bubble definitions for the smaller "lost bubbles" floating in the background
    interface Bubble {
      x: number;
      y: number;
      vx: number;
      vy: number;
      baseRadius: number;
      radius: number;
      color: string;
      speed: number;
      depth: number;
    }

    const bubbles: Bubble[] = [];
    const colors = [
      "rgba(215, 238, 228, 0.48)", // Soft mint green
      "rgba(248, 218, 225, 0.48)", // Soft pink pastel
      "rgba(255, 244, 215, 0.45)", // Soft amber gold
      "rgba(218, 232, 252, 0.48)", // Soft celestial blue
    ];

    // Instantiate 10 glassmorphic floating bubbles
    for (let i = 0; i < 10; i++) {
      const depth = Math.random() * 0.7 + 0.3; // depth multiplier for parallax feel
      bubbles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        baseRadius: Math.random() * 45 + 35,
        radius: 0,
        color: colors[i % colors.length],
        speed: Math.random() * 0.015 + 0.006,
        depth,
      });
    }

    // Iridescent central liquid blob points (simulates Spline's morphing fluid central ball)
    const numPoints = 12;
    const points: { x: number; y: number; ox: number; oy: number; angle: number; speed: number; range: number; phase: number }[] = [];
    const blobRadius = Math.min(width, height) * 0.23;
    const centerX = width / 2;
    const centerY = height / 2;

    for (let i = 0; i < numPoints; i++) {
      const angle = (i / numPoints) * Math.PI * 2;
      points.push({
        x: 0,
        y: 0,
        ox: Math.cos(angle) * blobRadius,
        oy: Math.sin(angle) * blobRadius,
        angle,
        speed: Math.random() * 0.012 + 0.008,
        range: Math.random() * 14 + 10,
        phase: Math.random() * Math.PI * 2,
      });
    }

    // Central blob coordinates with inertia
    let blobX = centerX;
    let blobY = centerY;

    let tick = 0;

    const animate = () => {
      tick++;
      ctx.clearRect(0, 0, width, height);

      // Interpolate mouse coordinates with inertia for smooth fluid movement
      const mouse = mouseRef.current;
      mouse.x += (mouse.tx - mouse.x) * 0.07;
      mouse.y += (mouse.ty - mouse.y) * 0.07;

      // Draw elegant canvas radial gradient background mimicking the presentperfect aesthetic
      const bgGlow = ctx.createRadialGradient(
        width * 0.5,
        height * 0.5,
        50,
        width * 0.5,
        height * 0.5,
        Math.max(width, height) * 0.75
      );
      bgGlow.addColorStop(0, "#FCFAF6");
      bgGlow.addColorStop(1, "#FAF7F1");
      ctx.fillStyle = bgGlow;
      ctx.fillRect(0, 0, width, height);

      // Render the floating background "lost bubbles"
      bubbles.forEach((b) => {
        // Natural gentle drift
        b.x += b.vx;
        b.y += b.vy;

        // Loop boundaries smoothly
        if (b.x < -120) b.x = width + 120;
        if (b.x > width + 120) b.x = -120;
        if (b.y < -120) b.y = height + 120;
        if (b.y > height + 120) b.y = -120;

        // Interactive mouse magnetic response (pulls bubbles gently)
        const dx = mouse.x - b.x;
        const dy = mouse.y - b.y;
        const dist = Math.hypot(dx, dy);

        if (dist < 340) {
          const force = (340 - dist) * 0.00018 * b.depth;
          b.x += dx * force; // Magnetically attract slightly for positive feedback
          b.y += dy * force;
        }

        // Apply a secondary floating drift
        b.y += Math.sin(tick * 0.002 + b.speed) * 0.12;

        // Pulse bubble radius gently
        b.radius = b.baseRadius + Math.sin(tick * b.speed) * 7;

        ctx.save();
        // Construct gorgeous glassmorphic gradient with inner glow highlights
        const radGlow = ctx.createRadialGradient(
          b.x - b.radius * 0.25,
          b.y - b.radius * 0.25,
          b.radius * 0.08,
          b.x,
          b.y,
          b.radius
        );
        radGlow.addColorStop(0, "rgba(255, 255, 255, 0.75)");
        radGlow.addColorStop(0.25, b.color);
        radGlow.addColorStop(0.75, "rgba(235, 235, 235, 0.12)");
        radGlow.addColorStop(1, "rgba(255, 255, 255, 0)");

        ctx.fillStyle = radGlow;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // Update central fluid blob position with responsive delay
      const targetBlobX = width / 2 + (mouse.x - width / 2) * 0.22;
      const targetBlobY = height / 2 + (mouse.y - height / 2) * 0.22;
      blobX += (targetBlobX - blobX) * 0.045;
      blobY += (targetBlobY - blobY) * 0.045;

      ctx.save();
      // Configure glowing ambient soft shadows for real-time depth
      ctx.shadowBlur = 45;
      ctx.shadowColor = "rgba(166, 139, 103, 0.12)";

      ctx.beginPath();
      const morphPoints = points.map((p) => {
        // Beautiful organic waveform morphing
        const offset = Math.sin(tick * p.speed + p.phase) * p.range;

        // Dynamic directional warp based on mouse cursor position
        const dx = mouse.x - blobX;
        const dy = mouse.y - blobY;
        const dist = Math.hypot(dx, dy);
        const stretchForce = Math.max(0, 1 - dist / 550) * 22; // Stretch effect range
        const angleToMouse = Math.atan2(dy, dx);
        const alignmentScore = Math.cos(p.angle - angleToMouse);

        const radiusFactor = (blobRadius + offset) + (alignmentScore > 0 ? alignmentScore * stretchForce : 0);

        return {
          x: blobX + Math.cos(p.angle) * radiusFactor,
          y: blobY + Math.sin(p.angle) * radiusFactor,
        };
      });

      // Apply quadratic bezier interpolation to connect the points into a flawless liquid blob
      ctx.moveTo(morphPoints[0].x, morphPoints[0].y);
      for (let i = 0; i < numPoints; i++) {
        const curr = morphPoints[i];
        const next = morphPoints[(i + 1) % numPoints];
        const midX = (curr.x + next.x) / 2;
        const midY = (curr.y + next.y) / 2;
        ctx.quadraticCurveTo(curr.x, curr.y, midX, midY);
      }
      ctx.closePath();

      // Create rich iridescent linear gradient reflecting the original Spline palette
      const blobGrad = ctx.createLinearGradient(
        blobX - blobRadius,
        blobY - blobRadius,
        blobX + blobRadius,
        blobY + blobRadius
      );
      blobGrad.addColorStop(0, "rgba(255, 182, 193, 0.84)"); // Beautiful pastel blush rose
      blobGrad.addColorStop(0.32, "rgba(230, 190, 235, 0.86)"); // Soft lilac velvet lavender
      blobGrad.addColorStop(0.65, "rgba(182, 218, 248, 0.84)"); // Celestially clear glassy sky blue
      blobGrad.addColorStop(0.88, "rgba(192, 238, 208, 0.82)"); // Deep sage emerald jade mint
      blobGrad.addColorStop(1, "rgba(248, 228, 182, 0.86)"); // Sunlit imperial gold leaf

      ctx.fillStyle = blobGrad;
      ctx.fill();

      // Delicate top gloss highlight layer
      const glossGrad = ctx.createRadialGradient(
        blobX - blobRadius * 0.28,
        blobY - blobRadius * 0.28,
        15,
        blobX,
        blobY,
        blobRadius
      );
      glossGrad.addColorStop(0, "rgba(255, 255, 255, 0.45)");
      glossGrad.addColorStop(0.42, "rgba(255, 255, 255, 0.06)");
      glossGrad.addColorStop(1, "rgba(255, 255, 255, 0)");
      ctx.fillStyle = glossGrad;
      ctx.beginPath();
      ctx.arc(blobX, blobY, blobRadius * 0.96, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      id="interactive-bubble-canvas"
      className="absolute inset-0 w-full h-full block z-0 transition-opacity duration-1000 ease-out pointer-events-none"
    />
  );
}
