import React from "react";

interface DiamondGraphicProps {
  type: string;
  size?: "sm" | "md" | "lg";
}

export default function DiamondGraphic({ type, size = "md" }: DiamondGraphicProps) {
  const getColorsAndPaths = () => {
    switch (type) {
      case "ruby":
        return {
          glow: "rgba(239, 68, 68, 0.4)",
          primary: "#ef4444",
          secondary: "#f87171",
          dark: "#b91c1c",
          bg: "from-red-950 to-red-900",
          icon: (
            <svg viewBox="0 0 24 24" fill="none" className="w-full h-full text-red-400 drop-shadow-[0_0_8px_#ef4444]">
              <path d="M12 2L2 9L12 22L22 9L12 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="rgba(239, 68, 68, 0.2)" />
              <path d="M12 2L7 9L12 22L17 9L12 2" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" />
              <path d="M2 9H22" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" />
            </svg>
          )
        };
      case "sapphire":
        return {
          glow: "rgba(0, 242, 255, 0.4)",
          primary: "#00f2ff",
          secondary: "#38bdf8",
          dark: "#0369a1",
          bg: "from-sky-950 to-sky-900",
          icon: (
            <svg viewBox="0 0 24 24" fill="none" className="w-full h-full text-sky-400 drop-shadow-[0_0_8px_#00f2ff]">
              <polygon points="6 2, 18 2, 22 8, 12 22, 2 8" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" fill="rgba(0, 242, 255, 0.2)" />
              <polyline points="2 8, 6 2, 12 8, 18 2, 22 8" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" />
              <line x1="12" y1="8" x2="12" y2="22" stroke="currentColor" strokeWidth="1" />
              <line x1="2" y1="8" x2="22" y2="8" stroke="currentColor" strokeWidth="1" />
            </svg>
          )
        };
      case "emerald":
        return {
          glow: "rgba(16, 185, 129, 0.4)",
          primary: "#10b981",
          secondary: "#34d399",
          dark: "#047857",
          bg: "from-emerald-950 to-emerald-900",
          icon: (
            <svg viewBox="0 0 24 24" fill="none" className="w-full h-full text-emerald-400 drop-shadow-[0_0_8px_#10b981]">
              <path d="M12 2L4 7L12 22L20 7L12 2" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" fill="rgba(16, 185, 129, 0.2)" />
              <path d="M12 2V22" stroke="currentColor" strokeWidth="1" />
              <path d="M4 7H20" stroke="currentColor" strokeWidth="1" />
            </svg>
          )
        };
      case "diamond":
        return {
          glow: "rgba(168, 85, 247, 0.4)",
          primary: "#a855f7",
          secondary: "#c084fc",
          dark: "#6b21a8",
          bg: "from-purple-950 to-purple-900",
          icon: (
            <svg viewBox="0 0 24 24" fill="none" className="w-full h-full text-purple-400 drop-shadow-[0_0_8px_#a855f7]">
              <polygon points="12 2, 22 12, 12 22, 2 12" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" fill="rgba(168, 85, 247, 0.2)" />
              <line x1="12" y1="2" x2="12" y2="22" stroke="currentColor" strokeWidth="1" />
              <line x1="2" y1="12" x2="22" y2="12" stroke="currentColor" strokeWidth="1" />
              <polygon points="12 7, 17 12, 12 17, 7 12" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" />
            </svg>
          )
        };
      case "crown":
        return {
          glow: "rgba(249, 115, 22, 0.4)",
          primary: "#f97316",
          secondary: "#fb923c",
          dark: "#c2410c",
          bg: "from-orange-950 to-orange-900",
          icon: (
            <svg viewBox="0 0 24 24" fill="none" className="w-full h-full text-orange-400 drop-shadow-[0_0_8px_#f97316]">
              <path d="M2 4L5 12L12 6L19 12L22 4L18 19H6L2 4Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" fill="rgba(249, 115, 22, 0.2)" />
              <circle cx="2" cy="3" r="1.5" fill="currentColor" />
              <circle cx="12" cy="4" r="1.5" fill="currentColor" />
              <circle cx="22" cy="3" r="1.5" fill="currentColor" />
            </svg>
          )
        };
      case "cosmos":
      default:
        return {
          glow: "rgba(236, 72, 153, 0.4)",
          primary: "#ec4899",
          secondary: "#f472b6",
          dark: "#be185d",
          bg: "from-pink-950 to-pink-900",
          icon: (
            <svg viewBox="0 0 24 24" fill="none" className="w-full h-full text-pink-400 drop-shadow-[0_0_8px_#ec4899]">
              <polygon points="12 2, 15 9, 22 9, 17 14, 19 21, 12 17, 5 21, 7 14, 2 9, 9 9" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" fill="rgba(236, 72, 153, 0.2)" />
              <polygon points="12 6, 13.5 10.5, 18 10.5, 14.5 13, 15.5 17.5, 12 15, 8.5 17.5, 9.5 13, 6 10.5, 10.5 10.5" stroke="currentColor" strokeWidth="1" strokeLinejoin="round" />
            </svg>
          )
        };
    }
  };

  const info = getColorsAndPaths();
  const pxSize = size === "sm" ? "w-12 h-12" : size === "md" ? "w-20 h-20" : "w-32 h-32";

  return (
    <div className="relative flex items-center justify-center">
      {/* Floating Light Flare Glow */}
      <div
        className="absolute rounded-full filter blur-xl animate-pulse"
        style={{
          width: size === "sm" ? "2.5rem" : size === "md" ? "4.5rem" : "8rem",
          height: size === "sm" ? "2.5rem" : size === "md" ? "4.5rem" : "8rem",
          backgroundColor: info.glow,
        }}
      />
      {/* Gem Housing */}
      <div className={`relative ${pxSize} p-3 rounded-2xl bg-gradient-to-tr ${info.bg} border-2 border-slate-800 flex items-center justify-center overflow-visible shadow-2xl`}>
        {info.icon}
      </div>
    </div>
  );
}
