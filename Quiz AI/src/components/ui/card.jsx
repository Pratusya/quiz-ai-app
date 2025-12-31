import * as React from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

const Card = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-2xl border bg-card text-card-foreground shadow-lg",
      "backdrop-blur-sm bg-white/80 dark:bg-gray-900/80",
      "border-white/20 dark:border-gray-700/50",
      "transition-all duration-300",
      "hover:shadow-xl hover:shadow-primary/5",
      className
    )}
    {...props}
  />
));
Card.displayName = "Card";

const CardHeader = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("text-2xl font-bold leading-none tracking-tight", className)}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground mt-1.5", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

// Animated Card with hover effects
const AnimatedCard = React.forwardRef(
  ({ className, children, ...props }, ref) => (
    <motion.div
      ref={ref}
      className={cn(
        "rounded-2xl border bg-card text-card-foreground shadow-lg",
        "backdrop-blur-sm bg-white/80 dark:bg-gray-900/80",
        "border-white/20 dark:border-gray-700/50",
        "overflow-hidden",
        className
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{
        y: -5,
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.15)",
      }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 20,
      }}
      {...props}
    >
      {children}
    </motion.div>
  )
);
AnimatedCard.displayName = "AnimatedCard";

// Feature Card with icon and gradient
const FeatureCard = React.forwardRef(
  (
    { className, icon, title, description, gradient = false, ...props },
    ref
  ) => (
    <motion.div
      ref={ref}
      className={cn(
        "relative rounded-2xl p-6 overflow-hidden",
        "bg-white/80 dark:bg-gray-900/80",
        "backdrop-blur-sm",
        "border border-white/20 dark:border-gray-700/50",
        "shadow-lg hover:shadow-xl",
        "transition-all duration-300",
        "group",
        className
      )}
      whileHover={{ y: -5 }}
      transition={{ type: "spring", stiffness: 300 }}
      {...props}
    >
      {/* Gradient background on hover */}
      {gradient && (
        <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 bg-gradient-to-br from-primary via-purple-500 to-pink-500" />
      )}

      {/* Icon container */}
      <div className="relative mb-4 w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-300">
        {icon}
      </div>

      {/* Content */}
      <h3 className="relative text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
        {title}
      </h3>
      <p className="relative text-muted-foreground">{description}</p>

      {/* Corner decoration */}
      <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-primary/10 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </motion.div>
  )
);
FeatureCard.displayName = "FeatureCard";

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
  AnimatedCard,
  FeatureCard,
};
