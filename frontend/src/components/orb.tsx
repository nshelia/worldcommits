import { useMemo } from 'react'
import { motion } from 'motion/react'

type OrbColor = 'emerald' | 'amber' | 'blue' | 'red'

const colorMap: Record<OrbColor, { core: string; mid: string; glow: string }> = {
  emerald: {
    core: '#34d399',
    mid: '#10b981',
    glow: 'rgba(16, 185, 129, 0.4)',
  },
  amber: {
    core: '#fbbf24',
    mid: '#f59e0b',
    glow: 'rgba(251, 191, 36, 0.4)',
  },
  blue: {
    core: '#60a5fa',
    mid: '#3b82f6',
    glow: 'rgba(59, 130, 246, 0.4)',
  },
  red: {
    core: '#f87171',
    mid: '#ef4444',
    glow: 'rgba(239, 68, 68, 0.4)',
  },
}

type ParticleDef = {
  dotSize: number
  radius: number
  duration: number
  delay: number
  angle: number
  useCore: boolean
}

function buildParticles(count: number, size: number, speedFactor: number): ParticleDef[] {
  const particles: ParticleDef[] = []
  for (let i = 0; i < count; i++) {
    const t = i / Math.max(count, 1)
    const angle = t * 360
    const radiusJitter = 0.3 + Math.random() * 0.2
    particles.push({
      dotSize: size * (0.08 + Math.random() * 0.07),
      radius: size * radiusJitter,
      duration: (2.2 + Math.random() * 1.4) / speedFactor,
      delay: t * 1.2,
      angle,
      useCore: i % 2 === 0,
    })
  }
  return particles
}

interface OrbProps {
  color?: OrbColor
  size?: number
  value?: number
}

export function Orb({ color = 'emerald', size = 32, value = 0 }: OrbProps) {
  const c = colorMap[color]

  const intensity = Math.min(value, 200)
  const particleCount = Math.min(Math.max(Math.ceil(intensity / 10), 1), 8)
  const speedFactor = 0.7 + Math.min(intensity / 100, 1) * 0.8
  const glowScale = 1 + Math.min(intensity / 100, 1) * 0.6
  const coreScale = 0.32 + Math.min(intensity / 200, 1) * 0.1

  const particles = useMemo(
    () => buildParticles(particleCount, size, speedFactor),
    [particleCount, size, speedFactor],
  )

  return (
    <div
      className="relative flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
    >
      {/* Outer glow pulse — intensity-driven */}
      <motion.div
        className="absolute"
        style={{
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${c.glow}, transparent 70%)`,
        }}
        animate={{
          scale: [1, glowScale, 1],
          opacity: [0.2, 0.2 + Math.min(intensity / 200, 0.4), 0.2],
        }}
        transition={{
          duration: 2.5 / speedFactor,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Orbiting particles — count driven by value */}
      {particles.map((p, i) => {
        const angleRad = (p.angle * Math.PI) / 180
        const cos = Math.cos(angleRad)
        const sin = Math.sin(angleRad)
        const r = p.radius

        return (
          <motion.div
            key={i}
            className="absolute"
            style={{
              width: p.dotSize,
              height: p.dotSize,
              borderRadius: '50%',
              background: p.useCore ? c.core : c.mid,
              boxShadow: `0 0 ${p.dotSize * 2}px ${c.glow}`,
            }}
            animate={{
              x: [
                r * cos,
                r * -sin,
                r * -cos,
                r * sin,
                r * cos,
              ],
              y: [
                r * sin,
                r * cos,
                r * -sin,
                r * -cos,
                r * sin,
              ],
              opacity: [0.5, 0.9, 0.5, 0.9, 0.5],
              scale: [0.8, 1.15, 0.8, 1.15, 0.8],
            }}
            transition={{
              duration: p.duration,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: p.delay,
            }}
          />
        )
      })}

      {/* Core sphere */}
      <motion.div
        className="relative"
        style={{
          width: size * coreScale,
          height: size * coreScale,
          borderRadius: '50%',
          background: `radial-gradient(circle at 35% 35%, ${c.core}, ${c.mid})`,
          boxShadow: `0 0 ${size * 0.25}px ${c.glow}, inset 0 -2px 4px rgba(0,0,0,0.2), inset 0 2px 4px rgba(255,255,255,0.3)`,
        }}
        animate={{
          scale: [1, 1 + Math.min(intensity / 500, 0.12), 1],
        }}
        transition={{
          duration: 2 / speedFactor,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </div>
  )
}
