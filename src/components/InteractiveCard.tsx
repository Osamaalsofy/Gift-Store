import React, { useRef, useState } from "react";

interface InteractiveCardProps {
  key?: any;
  children: React.ReactNode;
  className?: string;
  id?: string;
  glowColor?: string; // RGB values like "74, 93, 78" (Sage) or "166, 139, 103" (Gold)
  enableTilt?: boolean;
  enableSpotlight?: boolean;
  enableBorderGlow?: boolean;
  onClick?: () => void;
  as?: "div" | "form" | "section";
  onSubmit?: (e: React.FormEvent) => void;
}

export default function InteractiveCard({
  children,
  className = "",
  id,
  glowColor = "74, 93, 78", // Sage Green accent by default
  enableTilt = true,
  enableSpotlight = true,
  enableBorderGlow = true,
  onClick,
  as = "div",
  onSubmit,
}: InteractiveCardProps) {
  const cardRef = useRef<any>(null);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<any>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setCoords({ x, y });

    if (enableTilt) {
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      // Elegant, subtle rotation angles (max 4.5 degrees)
      const rotateX = ((y - centerY) / centerY) * -3.5;
      const rotateY = ((x - centerX) / centerX) * 3.5;
      setTilt({ x: rotateX, y: rotateY });
    }
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (enableTilt) {
      setTilt({ x: 0, y: 0 });
    }
  };

  const Tag = as;

  return (
    <Tag
      ref={cardRef}
      id={id}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      onSubmit={onSubmit}
      className={`w-full relative overflow-hidden transition-all duration-300 ease-out ${className}`}
      style={{
        transform: enableTilt
          ? `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) translateY(${isHovered ? -3 : 0}px)`
          : undefined,
        transformStyle: "preserve-3d",
        boxShadow: isHovered
          ? `0 14px 35px rgba(${glowColor}, 0.12), 0 2px 5px rgba(0,0,0,0.03)`
          : undefined,
        cursor: onClick ? "pointer" : "default"
      }}
    >
      {/* Spotlight Canvas Glow */}
      {enableSpotlight && isHovered && (
        <div
          className="absolute pointer-events-none transition-opacity duration-300"
          style={{
            width: "350px",
            height: "350px",
            borderRadius: "50%",
            background: `radial-gradient(circle, rgba(${glowColor}, 0.15) 0%, rgba(${glowColor}, 0.04) 45%, transparent 75%)`,
            left: `${coords.x - 175}px`,
            top: `${coords.y - 175}px`,
            zIndex: 0,
            mixBlendMode: "multiply",
          }}
        />
      )}

      {/* Dynamic Border Glow Trail */}
      {enableBorderGlow && isHovered && (
        <div
          className="absolute inset-0 pointer-events-none rounded-[inherit]"
          style={{
            border: "1.5px solid transparent",
            background: `radial-gradient(150px circle at ${coords.x}px ${coords.y}px, rgba(${glowColor}, 0.55) 0%, transparent 80%)`,
            WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
            WebkitMaskComposite: "xor",
            maskComposite: "exclude",
            zIndex: 10,
          }}
        />
      )}

      {/* Internal Content Frame */}
      <div className="relative z-10 w-full h-full">
        {children}
      </div>
    </Tag>
  );
}
