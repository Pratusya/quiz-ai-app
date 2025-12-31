// src/components/ui/GlassCard.jsx
import React, { useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";

// 3D Tilt Card with Glassmorphism
export const GlassCard = React.forwardRef(
  (
    {
      className,
      children,
      glowColor = "primary",
      tiltEnabled = true,
      glowEnabled = true,
      intensity = 15,
      ...props
    },
    ref
  ) => {
    const cardRef = useRef(null);
    const [isHovered, setIsHovered] = useState(false);

    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const mouseXSpring = useSpring(x, { stiffness: 150, damping: 15 });
    const mouseYSpring = useSpring(y, { stiffness: 150, damping: 15 });

    const rotateX = useTransform(
      mouseYSpring,
      [-0.5, 0.5],
      [`${intensity}deg`, `-${intensity}deg`]
    );
    const rotateY = useTransform(
      mouseXSpring,
      [-0.5, 0.5],
      [`-${intensity}deg`, `${intensity}deg`]
    );

    const handleMouseMove = (e) => {
      if (!tiltEnabled || !cardRef.current) return;

      const rect = cardRef.current.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const xPct = mouseX / width - 0.5;
      const yPct = mouseY / height - 0.5;
      x.set(xPct);
      y.set(yPct);
    };

    const handleMouseLeave = () => {
      setIsHovered(false);
      x.set(0);
      y.set(0);
    };

    return (
      <motion.div
        ref={cardRef}
        className={cn(
          "relative rounded-2xl overflow-hidden",
          "bg-white/70 dark:bg-gray-900/70",
          "backdrop-blur-xl backdrop-saturate-150",
          "border border-white/20 dark:border-white/10",
          "shadow-xl shadow-black/5 dark:shadow-black/20",
          "transition-shadow duration-300",
          isHovered && glowEnabled && "shadow-2xl shadow-primary/20",
          className
        )}
        style={{
          rotateX: tiltEnabled ? rotateX : 0,
          rotateY: tiltEnabled ? rotateY : 0,
          transformStyle: "preserve-3d",
        }}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={handleMouseLeave}
        {...props}
      >
        {/* Gradient border effect */}
        {glowEnabled && isHovered && (
          <motion.div
            className="absolute inset-0 rounded-2xl opacity-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            style={{
              background: `linear-gradient(135deg, hsl(var(--gradient-start) / 0.3), transparent, hsl(var(--gradient-end) / 0.3))`,
              filter: "blur(20px)",
              zIndex: -1,
            }}
          />
        )}

        {/* Content */}
        <div className="relative z-10">{children}</div>

        {/* Shine effect on hover */}
        {isHovered && (
          <motion.div
            className="absolute inset-0 pointer-events-none"
            initial={{ opacity: 0, x: "-100%" }}
            animate={{ opacity: 1, x: "100%" }}
            transition={{ duration: 0.6 }}
            style={{
              background:
                "linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)",
            }}
          />
        )}
      </motion.div>
    );
  }
);

GlassCard.displayName = "GlassCard";

// Gradient Border Card
export const GradientBorderCard = React.forwardRef(
  ({ className, children, animated = true, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "relative p-[2px] rounded-2xl overflow-hidden group",
          className
        )}
        {...props}
      >
        {/* Animated gradient border */}
        <div
          className={cn(
            "absolute inset-0 rounded-2xl",
            "bg-gradient-to-r from-primary via-purple-500 to-pink-500",
            animated && "animate-[gradient-shift_3s_ease_infinite]",
            "bg-[length:200%_200%]"
          )}
        />

        {/* Inner card */}
        <div className="relative bg-background dark:bg-gray-900 rounded-[14px] p-6">
          {children}
        </div>
      </div>
    );
  }
);

GradientBorderCard.displayName = "GradientBorderCard";

// Neon Card
export const NeonCard = React.forwardRef(
  ({ className, children, color = "primary", ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        className={cn(
          "relative rounded-2xl p-6",
          "bg-gray-900/90 dark:bg-gray-950/90",
          "border border-gray-700",
          "overflow-hidden",
          className
        )}
        whileHover={{ scale: 1.02 }}
        transition={{ type: "spring", stiffness: 300 }}
        {...props}
      >
        {/* Neon glow effect */}
        <div
          className="absolute -inset-1 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl"
          style={{
            background: `linear-gradient(135deg, hsl(var(--${color})), hsl(var(--accent)))`,
          }}
        />

        {/* Corner accents */}
        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-primary rounded-tl-2xl" />
        <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-primary rounded-tr-2xl" />
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-primary rounded-bl-2xl" />
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-primary rounded-br-2xl" />

        <div className="relative z-10">{children}</div>
      </motion.div>
    );
  }
);

NeonCard.displayName = "NeonCard";

// Hover Lift Card
export const HoverLiftCard = React.forwardRef(
  ({ className, children, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        className={cn(
          "relative rounded-2xl p-6",
          "bg-card text-card-foreground",
          "border border-border",
          "shadow-lg",
          className
        )}
        whileHover={{
          y: -8,
          boxShadow: "0 20px 40px -15px rgba(0, 0, 0, 0.2)",
        }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

HoverLiftCard.displayName = "HoverLiftCard";

// Stats Card with Animated Counter
export const StatsCard = ({
  icon,
  label,
  value,
  suffix = "",
  trend,
  trendUp = true,
}) => {
  return (
    <GlassCard className="p-6" tiltEnabled={false}>
      <div className="flex items-center justify-between">
        <div className="p-3 rounded-xl bg-primary/10 text-primary">{icon}</div>
        {trend && (
          <span
            className={cn(
              "text-sm font-medium px-2 py-1 rounded-full",
              trendUp
                ? "text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30"
                : "text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30"
            )}
          >
            {trendUp ? "↑" : "↓"} {trend}
          </span>
        )}
      </div>
      <div className="mt-4">
        <motion.p
          className="text-3xl font-bold gradient-text"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {value}
          {suffix}
        </motion.p>
        <p className="text-sm text-muted-foreground mt-1">{label}</p>
      </div>
    </GlassCard>
  );
};

export default GlassCard;
