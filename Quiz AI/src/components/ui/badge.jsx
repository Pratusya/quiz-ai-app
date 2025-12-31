import * as React from "react";
import { cva } from "class-variance-authority";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow-sm shadow-primary/25 hover:shadow-md hover:shadow-primary/30",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow-sm shadow-destructive/25 hover:shadow-md",
        outline: "text-foreground border-border hover:bg-muted",
        success:
          "border-transparent bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-sm shadow-green-500/25",
        warning:
          "border-transparent bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm shadow-amber-500/25",
        info: "border-transparent bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-sm shadow-blue-500/25",
        gradient:
          "border-transparent bg-gradient-to-r from-primary via-purple-500 to-pink-500 text-white shadow-sm shadow-primary/25",
        glass:
          "bg-white/20 dark:bg-white/10 backdrop-blur-md border-white/30 dark:border-white/20 text-foreground",
        neon: "border-primary bg-transparent text-primary shadow-[0_0_10px_hsl(var(--primary)/0.3)]",
      },
      size: {
        default: "px-3 py-1 text-xs",
        sm: "px-2 py-0.5 text-[10px]",
        lg: "px-4 py-1.5 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

function Badge({ className, variant, size, icon, pulse, ...props }) {
  return (
    <div
      className={cn(badgeVariants({ variant, size }), "relative", className)}
      {...props}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {props.children}
      {pulse && (
        <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-current" />
        </span>
      )}
    </div>
  );
}

// Animated Badge with motion
function AnimatedBadge({ className, variant, size, icon, ...props }) {
  return (
    <motion.div
      className={cn(badgeVariants({ variant, size }), className)}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      {...props}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {props.children}
    </motion.div>
  );
}

// Status Badge with live indicator
function StatusBadge({ status = "online", label, className }) {
  const statusConfig = {
    online: { color: "bg-green-500", label: label || "Online" },
    offline: { color: "bg-gray-400", label: label || "Offline" },
    busy: { color: "bg-red-500", label: label || "Busy" },
    away: { color: "bg-amber-500", label: label || "Away" },
    live: { color: "bg-red-500", label: label || "Live", animate: true },
  };

  const config = statusConfig[status] || statusConfig.offline;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 px-3 py-1 rounded-full",
        "bg-muted/50 text-foreground text-xs font-medium",
        className
      )}
    >
      <span className="relative flex h-2 w-2">
        {config.animate && (
          <span
            className={cn(
              "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
              config.color
            )}
          />
        )}
        <span
          className={cn(
            "relative inline-flex rounded-full h-2 w-2",
            config.color
          )}
        />
      </span>
      {config.label}
    </div>
  );
}

// Count Badge (for notifications, etc.)
function CountBadge({ count, max = 99, className }) {
  const displayCount = count > max ? `${max}+` : count;

  return (
    <motion.div
      className={cn(
        "inline-flex items-center justify-center min-w-[20px] h-5 px-1.5",
        "rounded-full bg-destructive text-destructive-foreground text-xs font-bold",
        className
      )}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: "spring", stiffness: 500, damping: 15 }}
    >
      {displayCount}
    </motion.div>
  );
}

export { Badge, AnimatedBadge, StatusBadge, CountBadge, badgeVariants };
