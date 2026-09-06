import { AlertTriangle, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const MINI_CONFETTI_COLORS = ["#1ECFB0", "#D4A843", "#F2C96B"];

const MINI_CONFETTI_PARTICLES = Array.from({ length: 6 }, (_, index) => {
  const angle = (index / 6) * Math.PI * 2;
  const distance = 14 + (index % 2) * 4;

  return {
    x: Math.cos(angle) * distance,
    y: Math.sin(angle) * distance,
    rotation: 90 + index * 45,
    color: MINI_CONFETTI_COLORS[index % MINI_CONFETTI_COLORS.length],
    size: index % 2 === 0 ? 4 : 3,
    round: index % 2 === 0
  };
});

export default function ActionStatusMessage({ tone = "idle", children, className }) {
  if (!children) {
    return null;
  }

  if (tone === "success") {
    return (
      <div
        className={cn(
          "status-message-pop flex items-center gap-2 rounded-2xl border border-teal/30 bg-teal/10 px-4 py-3 text-sm text-white/85",
          className
        )}
      >
        <span className="relative flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-teal text-dark-base">
          {MINI_CONFETTI_PARTICLES.map((particle, index) => (
            <span
              key={index}
              className="status-confetti-particle"
              style={{
                width: particle.size,
                height: particle.size,
                background: particle.color,
                borderRadius: particle.round ? "50%" : "1px",
                "--confetti-x": `${particle.x}px`,
                "--confetti-y": `${particle.y}px`,
                "--confetti-rot": `${particle.rotation}deg`
              }}
            />
          ))}
          <Check className="relative h-3.5 w-3.5" strokeWidth={3} />
        </span>
        {children}
      </div>
    );
  }

  if (tone === "error") {
    return (
      <div
        className={cn(
          "status-message-shake flex items-center gap-2 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-white/85",
          className
        )}
      >
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-500/90 text-white">
          <AlertTriangle className="h-3.5 w-3.5" strokeWidth={3} />
        </span>
        {children}
      </div>
    );
  }

  return <p className={cn("text-sm text-white/55", className)}>{children}</p>;
}
