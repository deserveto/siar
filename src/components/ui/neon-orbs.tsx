"use client"

import { useEffect, useState, useRef } from "react"
import { motion, useScroll, useTransform, useSpring } from "framer-motion"

interface NeonOrbsProps {
  /** Main title text - defaults to "SIAR" */
  title?: string
  /** Subtitle text - defaults to "SISTEM INFORMASI ASURANSI RAMAYANA" */
  subtitle?: string
  /** Show center text content */
  showText?: boolean
  /** Reduced opacity for dashboard background */
  subtle?: boolean
}

export function NeonOrbs({
  title = "SIAR",
  subtitle = "SISTEM INFORMASI ASURANSI RAMAYANA",
  showText = true,
  subtle = false,
}: NeonOrbsProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  // Scroll Parallax Effects
  const { scrollY } = useScroll()
  const y1 = useTransform(scrollY, [0, 1000], [0, 200])
  const y2 = useTransform(scrollY, [0, 1000], [0, -150])
  const y3 = useTransform(scrollY, [0, 1000], [0, 100])
  const y4 = useTransform(scrollY, [0, 1000], [0, -200])
  const opacity = useTransform(scrollY, [0, 500], [subtle ? 0.3 : 1, subtle ? 0.1 : 0.5])

  // Smooth spring for orb movement
  const springConfig = { stiffness: 50, damping: 20 }
  const y1Spring = useSpring(y1, springConfig)
  const y2Spring = useSpring(y2, springConfig)
  const y3Spring = useSpring(y3, springConfig)
  const y4Spring = useSpring(y4, springConfig)

  const orbVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: (i: number) => ({
      opacity: subtle ? 0.3 : 1,
      scale: 1,
      transition: {
        delay: i * 0.2,
        duration: 1.5,
        ease: "easeOut" as const,
      },
    }),
  }

  const beamVariants = {
    animate: (custom: { duration: number, reverse?: boolean }) => ({
      rotate: custom.reverse ? -360 : 360,
      transition: {
        duration: custom.duration,
        ease: "linear" as const,
        repeat: Infinity,
      },
    }),
  }

  const textVariants = {
    hidden: { opacity: 0, y: 20, filter: "blur(10px)" },
    visible: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: {
        duration: 0.8,
        ease: "easeOut" as const,
      },
    },
  }

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-screen overflow-hidden flex items-center justify-center bg-slate-100 dark:bg-[#050a18] transition-colors duration-500 ${subtle ? 'pointer-events-none' : ''}`}
    >
      {/* Top-left orb */}
      <motion.div
        custom={0}
        variants={orbVariants}
        initial="hidden"
        animate="visible"
        style={{
          position: "absolute",
          top: "-40%",
          left: "-20%",
          width: "80vw",
          height: "80vw",
          maxWidth: "800px",
          maxHeight: "800px",
          y: y1Spring,
          opacity: typeof window !== 'undefined' && subtle ? 0.3 : undefined // static fallback
        }}
        className="z-0"
      >
        <div className="w-full h-full rounded-full relative siar-orb-light">
          <motion.div
            className="siar-beam-container"
            custom={{ duration: 15 }}
            variants={beamVariants}
            animate="animate"
          >
            <div className="siar-beam-light" />
          </motion.div>
        </div>
      </motion.div>

      {/* Bottom-center orb */}
      <motion.div
        custom={1}
        variants={orbVariants}
        initial="hidden"
        animate="visible"
        style={{
          position: "absolute",
          bottom: "-50%",
          left: "50%",
          x: "-50%", // Center it
          width: "100vw",
          height: "100vw",
          maxWidth: "1000px",
          maxHeight: "1000px",
          y: y2Spring,
        }}
        className="z-0"
      >
        <div className="w-full h-full rounded-full relative siar-orb-light">
          <motion.div
            className="siar-beam-container"
            custom={{ duration: 20, reverse: true }}
            variants={beamVariants}
            animate="animate"
          >
            <div className="siar-beam-light" />
          </motion.div>
        </div>
      </motion.div>

      {/* Top-right orb */}
      <motion.div
        custom={2}
        variants={orbVariants}
        initial="hidden"
        animate="visible"
        style={{
          position: "absolute",
          top: "-30%",
          right: "-25%",
          width: "70vw",
          height: "70vw",
          maxWidth: "700px",
          maxHeight: "700px",
          y: y3Spring,
        }}
        className="z-0"
      >
        <div className="w-full h-full rounded-full relative siar-orb-light">
          <motion.div
            className="siar-beam-container"
            custom={{ duration: 12 }}
            variants={beamVariants}
            animate="animate"
          >
            <div className="siar-beam-light" />
          </motion.div>
        </div>
      </motion.div>

      {/* Bottom-right orb */}
      <motion.div
        custom={3}
        variants={orbVariants}
        initial="hidden"
        animate="visible"
        style={{
          position: "absolute",
          bottom: "-35%",
          right: "-15%",
          width: "75vw",
          height: "75vw",
          maxWidth: "750px",
          maxHeight: "750px",
          y: y4Spring,
        }}
        className="z-0"
      >
        <div className="w-full h-full rounded-full relative siar-orb-light">
          <motion.div
            className="siar-beam-container"
            custom={{ duration: 18, reverse: true }}
            variants={beamVariants}
            animate="animate"
          >
            <div className="siar-beam-light" />
          </motion.div>
        </div>
      </motion.div>

      {/* Center text */}
      {showText && (
        <div className="relative z-10 text-center text-cyan-900 dark:text-white">
          <motion.h1
            initial="hidden"
            animate="visible"
            variants={textVariants}
            className="text-5xl md:text-8xl font-bold tracking-[0.15em] mb-4 bg-gradient-to-r from-cyan-400 via-blue-500 to-cyan-400 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(0,198,255,0.5)]"
          >
            {title.split("").map((char, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + i * 0.1, duration: 0.5 }}
                className="inline-block hover:scale-110 hover:text-cyan-300 transition-colors"
              >
                {char === " " ? "\u00A0" : char}
              </motion.span>
            ))}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10, filter: "blur(5px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ delay: 1.2, duration: 1 }}
            className="text-sm md:text-lg font-light tracking-[0.3em] text-cyan-600/80 dark:text-cyan-300/60"
          >
            {subtitle}
          </motion.p>
        </div>
      )}

      <style jsx global>{`
        .siar-beam-container {
          position: absolute;
          inset: -2px;
          border-radius: 50%;
          will-change: transform;
        }
       
        .siar-beam-light {
          position: absolute;
          top: 0;
          left: 50%;
          width: 60px;
          height: 4px;
          margin-left: -30px;
          border-radius: 2px;
          transform: translateY(-50%);
          /* SIAR Blue gradient - #00c6ff to #0072ff */
          background: linear-gradient(90deg, transparent 0%, rgba(0, 198, 255, 0.5) 30%, rgba(0, 150, 255, 0.9) 70%, rgba(0, 114, 255, 1) 100%);
          box-shadow: 0 0 20px 4px rgba(0, 198, 255, 0.6), 0 0 40px 8px rgba(0, 114, 255, 0.3);
        }
       
        .dark .siar-beam-light {
          background: linear-gradient(90deg, transparent 0%, rgba(0, 198, 255, 0.5) 30%, rgba(100, 200, 255, 0.9) 70%, white 100%);
          box-shadow: 0 0 20px 4px rgba(0, 198, 255, 0.8), 0 0 40px 8px rgba(0, 114, 255, 0.4);
        }
       
        .siar-orb-light {
          /* Light mode - soft blue */
          background: radial-gradient(circle at 50% 50%, #f0f8ff 0%, #f0f8ff 90%, transparent 100%);
          box-shadow:
            0 0 60px 2px rgba(0, 198, 255, 0.3),
            0 0 100px 5px rgba(0, 114, 255, 0.15),
            inset 0 0 60px 2px rgba(0, 198, 255, 0.08);
          border: 1px solid rgba(0, 198, 255, 0.4);
        }
       
        .dark .siar-orb-light {
          background: radial-gradient(circle at 50% 50%, #050a18 0%, #050a18 90%, transparent 100%);
          box-shadow:
            0 0 60px 2px rgba(0, 198, 255, 0.4),
            0 0 100px 5px rgba(0, 114, 255, 0.2),
            inset 0 0 60px 2px rgba(0, 198, 255, 0.1);
          border: 1px solid rgba(0, 198, 255, 0.3);
        }
      `}</style>
    </div>
  )
}