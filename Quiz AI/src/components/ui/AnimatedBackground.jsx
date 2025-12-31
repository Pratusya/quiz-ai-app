// src/components/ui/AnimatedBackground.jsx
import React, { useEffect, useRef, useMemo, useCallback } from "react";
import { motion } from "framer-motion";

// Floating 3D Orbs Component
export const FloatingOrbs = () => {
  const orbs = useMemo(
    () => [
      { size: 300, x: "10%", y: "20%", delay: 0, duration: 20 },
      { size: 200, x: "80%", y: "10%", delay: 2, duration: 25 },
      { size: 250, x: "70%", y: "70%", delay: 4, duration: 22 },
      { size: 180, x: "20%", y: "80%", delay: 1, duration: 28 },
      { size: 150, x: "50%", y: "50%", delay: 3, duration: 24 },
    ],
    []
  );

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {orbs.map((orb, index) => (
        <motion.div
          key={index}
          className="absolute rounded-full blur-3xl opacity-30 dark:opacity-20"
          style={{
            width: orb.size,
            height: orb.size,
            left: orb.x,
            top: orb.y,
            background: `radial-gradient(circle, hsl(var(--gradient-start)) 0%, hsl(var(--gradient-mid)) 50%, transparent 70%)`,
          }}
          animate={{
            x: [0, 50, -30, 20, 0],
            y: [0, -40, 30, -20, 0],
            scale: [1, 1.1, 0.9, 1.05, 1],
          }}
          transition={{
            duration: orb.duration,
            delay: orb.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
};

// Interactive Particle System
export const ParticleField = ({ count = 50 }) => {
  const canvasRef = useRef(null);
  const particlesRef = useRef([]);
  const mouseRef = useRef({ x: 0, y: 0 });
  const animationRef = useRef(null);

  // Reduce particle count on mobile for better performance
  const getParticleCount = useCallback(() => {
    if (typeof window === "undefined") return count;
    const width = window.innerWidth;
    if (width < 640) return Math.min(count, 20); // Mobile
    if (width < 1024) return Math.min(count, 35); // Tablet
    return count; // Desktop
  }, [count]);

  const initParticles = useCallback(
    (width, height) => {
      const particleCount = getParticleCount();
      particlesRef.current = Array.from({ length: particleCount }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 3 + 1,
        opacity: Math.random() * 0.5 + 0.2,
      }));
    },
    [getParticleCount]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      if (particlesRef.current.length === 0) {
        initParticles(canvas.width, canvas.height);
      }
    };

    const handleMouseMove = (e) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", handleMouseMove);

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const isDark = document.documentElement.classList.contains("dark");
      const particleColor = isDark ? "147, 112, 219" : "139, 92, 246";

      particlesRef.current.forEach((particle, i) => {
        // Update position
        particle.x += particle.vx;
        particle.y += particle.vy;

        // Mouse interaction
        const dx = mouseRef.current.x - particle.x;
        const dy = mouseRef.current.y - particle.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 150) {
          const force = (150 - distance) / 150;
          particle.vx -= (dx / distance) * force * 0.02;
          particle.vy -= (dy / distance) * force * 0.02;
        }

        // Boundary check
        if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1;
        if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1;

        // Keep velocity in check
        particle.vx = Math.max(-2, Math.min(2, particle.vx));
        particle.vy = Math.max(-2, Math.min(2, particle.vy));

        // Draw particle
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${particleColor}, ${particle.opacity})`;
        ctx.fill();

        // Draw connections
        particlesRef.current.slice(i + 1).forEach((other) => {
          const dx = other.x - particle.x;
          const dy = other.y - particle.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(other.x, other.y);
            ctx.strokeStyle = `rgba(${particleColor}, ${
              0.15 * (1 - dist / 120)
            })`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        });
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouseMove);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [initParticles]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.6 }}
    />
  );
};

// Geometric 3D Shapes
export const Geometric3D = () => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0 scene-3d">
      {/* Rotating Cube */}
      <motion.div
        className="absolute w-20 h-20 preserve-3d"
        style={{ left: "15%", top: "25%" }}
        animate={{ rotateX: 360, rotateY: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      >
        <div
          className="absolute w-full h-full border-2 border-primary/20 bg-primary/5 transform-gpu"
          style={{ transform: "translateZ(40px)" }}
        />
        <div
          className="absolute w-full h-full border-2 border-primary/20 bg-primary/5 transform-gpu"
          style={{ transform: "rotateY(180deg) translateZ(40px)" }}
        />
        <div
          className="absolute w-full h-full border-2 border-primary/20 bg-primary/5 transform-gpu"
          style={{ transform: "rotateY(-90deg) translateZ(40px)" }}
        />
        <div
          className="absolute w-full h-full border-2 border-primary/20 bg-primary/5 transform-gpu"
          style={{ transform: "rotateY(90deg) translateZ(40px)" }}
        />
        <div
          className="absolute w-full h-full border-2 border-primary/20 bg-primary/5 transform-gpu"
          style={{ transform: "rotateX(90deg) translateZ(40px)" }}
        />
        <div
          className="absolute w-full h-full border-2 border-primary/20 bg-primary/5 transform-gpu"
          style={{ transform: "rotateX(-90deg) translateZ(40px)" }}
        />
      </motion.div>

      {/* Rotating Ring */}
      <motion.div
        className="absolute w-32 h-32 rounded-full border-4 border-dashed border-primary/20"
        style={{ right: "20%", top: "15%" }}
        animate={{ rotate: 360 }}
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
      />

      {/* Floating Triangles */}
      <motion.div
        className="absolute"
        style={{ left: "75%", bottom: "30%" }}
        animate={{ y: [-20, 20, -20], rotate: [0, 180, 360] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      >
        <svg
          width="60"
          height="60"
          viewBox="0 0 60 60"
          className="fill-primary/10 stroke-primary/30 stroke-2"
        >
          <polygon points="30,5 55,55 5,55" />
        </svg>
      </motion.div>

      {/* Hexagon */}
      <motion.div
        className="absolute"
        style={{ left: "10%", bottom: "20%" }}
        animate={{ rotate: 360, scale: [1, 1.1, 1] }}
        transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
      >
        <svg
          width="80"
          height="80"
          viewBox="0 0 80 80"
          className="fill-primary/5 stroke-primary/20 stroke-2"
        >
          <polygon points="40,5 70,20 70,55 40,75 10,55 10,20" />
        </svg>
      </motion.div>
    </div>
  );
};

// Neural Network Background
export const NeuralNetwork = () => {
  const nodes = useMemo(
    () =>
      Array.from({ length: 20 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
      })),
    []
  );

  const connections = useMemo(() => {
    const conns = [];
    nodes.forEach((node, i) => {
      nodes.slice(i + 1).forEach((other) => {
        const distance = Math.sqrt(
          Math.pow(node.x - other.x, 2) + Math.pow(node.y - other.y, 2)
        );
        if (distance < 30) {
          conns.push({ from: node, to: other, distance });
        }
      });
    });
    return conns;
  }, [nodes]);

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      <svg className="w-full h-full">
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop
              offset="0%"
              stopColor="hsl(var(--gradient-start))"
              stopOpacity="0.3"
            />
            <stop
              offset="100%"
              stopColor="hsl(var(--gradient-end))"
              stopOpacity="0.1"
            />
          </linearGradient>
        </defs>

        {connections.map((conn, i) => (
          <motion.line
            key={i}
            x1={`${conn.from.x}%`}
            y1={`${conn.from.y}%`}
            x2={`${conn.to.x}%`}
            y2={`${conn.to.y}%`}
            stroke="url(#lineGradient)"
            strokeWidth="1"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.5 }}
            transition={{ duration: 2, delay: i * 0.1 }}
          />
        ))}

        {nodes.map((node) => (
          <motion.circle
            key={node.id}
            cx={`${node.x}%`}
            cy={`${node.y}%`}
            r="4"
            fill="hsl(var(--primary))"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.6 }}
            transition={{ duration: 0.5, delay: node.id * 0.05 }}
          >
            <animate
              attributeName="r"
              values="3;5;3"
              dur="3s"
              repeatCount="indefinite"
            />
          </motion.circle>
        ))}
      </svg>
    </div>
  );
};

// Main Animated Background Component
const AnimatedBackground = ({ variant = "orbs" }) => {
  switch (variant) {
    case "particles":
      return <ParticleField count={60} />;
    case "geometric":
      return <Geometric3D />;
    case "neural":
      return <NeuralNetwork />;
    case "orbs":
    default:
      return <FloatingOrbs />;
  }
};

export default AnimatedBackground;
