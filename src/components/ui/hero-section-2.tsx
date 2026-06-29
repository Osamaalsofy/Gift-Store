import React from "react";
import { cn } from "@/src/lib/utils";
import { motion } from "framer-motion";
import GildedSilkWaves from "../GildedSilkWaves";

// Icon component for contact details using elegant simple layout
const InfoIcon = ({ type }: { type: "website" | "phone" | "address" }) => {
  const icons = {
    website: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-4.5 w-4.5 text-[#4A5D4E]"
      >
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="2" x2="22" y1="12" y2="12"></line>
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
      </svg>
    ),
    phone: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-4.5 w-4.5 text-[#4A5D4E]"
      >
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 a2 2 0 0 1 2.2 1.72z"></path>
      </svg>
    ),
    address: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-4.5 w-4.5 text-[#4A5D4E]"
      >
        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path>
        <circle cx="12" cy="10" r="3"></circle>
      </svg>
    ),
  };
  return <div className="mr-2 flex-shrink-0">{icons[type]}</div>;
};

// Prop types for the HeroSection component
interface HeroSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  logo?: {
    url: string;
    alt: string;
    text?: string;
  };
  slogan?: string;
  title: React.ReactNode;
  subtitle: string;
  callToAction: {
    text: string;
    href: string;
  };
  backgroundImage: string;
  contactInfo?: {
    website: string;
    phone: string;
    address: string;
  };
  onExploreClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}

const HeroSection = React.forwardRef<HTMLDivElement, HeroSectionProps>(
  (
    {
      className,
      logo,
      slogan,
      title,
      subtitle,
      callToAction,
      backgroundImage,
      contactInfo,
      onExploreClick,
      ...props
    },
    ref
  ) => {
    // Animation variants for the container to orchestrate children animations
    const containerVariants = {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: {
          staggerChildren: 0.15,
          delayChildren: 0.2,
        },
      },
    };

    // Animation variants for individual text/UI elements
    const itemVariants = {
      hidden: { y: 20, opacity: 0 },
      visible: {
        y: 0,
        opacity: 1,
        transition: {
          duration: 0.5,
          ease: "easeOut",
        },
      },
    };

    return (
      <motion.section
        ref={ref}
        className={cn(
          "relative flex w-full flex-col overflow-hidden bg-[#FAF7F1] text-[#1C1814] md:flex-row min-h-[500px] border-b border-[#E2D8C2]",
          className
        )}
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        {...props}
      >
        {/* Elegant Gilded Silk Waves canvas simulation blending beautifully */}
        <div id="hero-waves-container" className="absolute inset-0 w-full h-full z-0 mix-blend-multiply opacity-85 pointer-events-none md:pointer-events-auto">
          <GildedSilkWaves />
        </div>

        {/* Left Side: Content */}
        <div className="flex w-full flex-col justify-between p-8 md:w-1/2 md:p-12 lg:w-3/5 lg:p-16 z-10 bg-[#FAF7F1]/95 md:bg-transparent backdrop-blur-xs md:backdrop-blur-none">
          {/* Top Section: Logo & Main Content */}
          <div>
            <motion.header className="mb-10" variants={itemVariants}>
              {logo && (
                <div className="flex items-center">
                  <img
                    src={logo.url}
                    alt={logo.alt}
                    referrerPolicy="no-referrer"
                    className="mr-3 h-9 w-9 object-contain rounded-full border border-[#E2D8C2] bg-white p-1 shadow-xs"
                  />
                  <div>
                    {logo.text && (
                      <p className="text-xs font-bold text-[#1C1814] uppercase tracking-widest">
                        {logo.text}
                      </p>
                    )}
                    {slogan && (
                      <p className="text-[9px] tracking-[0.25em] text-[#A68B67] font-extrabold uppercase">
                        {slogan}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </motion.header>

            <motion.main variants={containerVariants} className="space-y-4">
              <motion.h1
                className="text-3xl sm:text-4xl md:text-5xl font-serif font-semibold leading-tight text-[#1C1814]"
                variants={itemVariants}
              >
                {title}
              </motion.h1>
              <motion.div
                className="my-4 h-1.5 w-16 bg-[#4A5D4E]"
                variants={itemVariants}
              ></motion.div>
              <motion.p
                className="mb-8 max-w-md text-xs sm:text-sm text-gray-700 leading-relaxed font-medium"
                variants={itemVariants}
              >
                {subtitle}
              </motion.p>
              <motion.div variants={itemVariants} className="pt-2">
                <a
                  href={callToAction.href}
                  onClick={onExploreClick}
                  className="inline-block px-5 py-3 bg-[#4A5D4E] hover:bg-[#3d4d40] text-white text-[9px] md:text-[10px] uppercase tracking-[0.25em] transition-all font-bold shadow-md cursor-pointer hover:scale-[1.03] active:scale-[0.97]"
                >
                  {callToAction.text}
                </a>
              </motion.div>
            </motion.main>
          </div>

          {/* Bottom Section: Footer Info */}
          {contactInfo && (
            <motion.footer className="mt-12 w-full" variants={itemVariants}>
              <div className="flex flex-wrap gap-x-6 gap-y-3 text-[11px] text-gray-600 font-semibold tracking-wide uppercase">
                <div className="flex items-center min-w-max">
                  <InfoIcon type="website" />
                  <span>{contactInfo.website}</span>
                </div>
                <div className="flex items-center min-w-max">
                  <InfoIcon type="phone" />
                  <span>{contactInfo.phone}</span>
                </div>
                <div className="flex items-center min-w-max">
                  <InfoIcon type="address" />
                  <span>{contactInfo.address}</span>
                </div>
              </div>
            </motion.footer>
          )}
        </div>

        {/* Right Side: Image with Clip Path Animation */}
        <motion.div
          className="w-full min-h-[300px] bg-cover bg-center md:w-1/2 md:min-h-full lg:w-2/5 relative z-0"
          style={{
            backgroundImage: `url(${backgroundImage})`,
          }}
          initial={{
            clipPath: "polygon(100% 0, 100% 0, 100% 100%, 100% 100%)",
          }}
          animate={{ clipPath: "polygon(15% 0, 100% 0, 100% 100%, 0% 100%)" }}
          transition={{ duration: 1.2, ease: "circOut" }}
        ></motion.div>
      </motion.section>
    );
  }
);

HeroSection.displayName = "HeroSection";

export { HeroSection };
