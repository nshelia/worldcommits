import { motion } from 'motion/react'

interface Icon3DProps {
  type: 'users' | 'lightning' | 'circle'
  size?: number
  active?: boolean
}

export function Icon3D({ type, size = 36, active = false }: Icon3DProps) {
  const containerStyle = {
    width: size,
    height: size,
    perspective: '600px',
  }

  return (
    <div style={containerStyle} className="flex items-center justify-center">
      {type === 'circle' && <CircleIcon size={size} active={active} />}
      {type === 'users' && <UsersIcon size={size} active={active} />}
      {type === 'lightning' && <LightningIcon size={size} active={active} />}
    </div>
  )
}

function CircleIcon({ size, active }: { size: number; active: boolean }) {
  return (
    <motion.div
      className="relative"
      style={{
        width: size,
        height: size,
        transformStyle: 'preserve-3d',
      }}
      animate={active ? { rotateY: 8, rotateX: -5 } : { rotateY: 0, rotateX: 0 }}
      whileHover={{ rotateY: 8, rotateX: -5 }}
      transition={{ type: 'spring', stiffness: 300 }}
    >
      <div
        className="absolute"
        style={{
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          background: 'linear-gradient(145deg, #34d399, #10b981)',
          transform: 'translateZ(3px)',
          boxShadow: `
            0 4px 12px rgba(16, 185, 129, 0.35),
            inset 0 -3px 6px rgba(0, 0, 0, 0.15),
            inset 0 3px 6px rgba(255, 255, 255, 0.2)
          `,
        }}
      />

      <motion.div
        className="absolute"
        style={{
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          border: '1.5px solid rgba(52, 211, 153, 0.5)',
          transform: 'translateZ(1px)',
        }}
        animate={{
          scale: [1, 1.15],
          opacity: [0.5, 0],
        }}
        transition={{
          duration: 1.8,
          repeat: Infinity,
          ease: 'easeOut',
        }}
      />

      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{
          transform: 'translateZ(6px)',
          color: 'white',
        }}
      >
        <svg
          width={size * 0.5}
          height={size * 0.5}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.2))' }}
        >
          <path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2" />
        </svg>
      </div>
    </motion.div>
  )
}

function UsersIcon({ size, active }: { size: number; active: boolean }) {
  return (
    <motion.div
      className="relative"
      style={{
        width: size,
        height: size,
        transformStyle: 'preserve-3d',
      }}
      animate={active ? { rotateY: 8, rotateX: -5 } : { rotateY: 0, rotateX: 0 }}
      whileHover={{ rotateY: 8, rotateX: -5 }}
      transition={{ type: 'spring', stiffness: 300 }}
    >
      <div
        className="absolute"
        style={{
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          background: 'linear-gradient(145deg, #60a5fa, #3b82f6)',
          transform: 'translateZ(3px)',
          boxShadow: `
            0 4px 12px rgba(59, 130, 246, 0.35),
            inset 0 -3px 6px rgba(0, 0, 0, 0.15),
            inset 0 3px 6px rgba(255, 255, 255, 0.2)
          `,
        }}
      />

      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{ transform: 'translateZ(6px)' }}
      >
        <svg
          width={size * 0.5}
          height={size * 0.5}
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.2))' }}
        >
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      </div>
    </motion.div>
  )
}

function LightningIcon({ size, active }: { size: number; active: boolean }) {
  return (
    <motion.div
      className="relative"
      style={{
        width: size,
        height: size,
        transformStyle: 'preserve-3d',
      }}
      animate={active ? { rotateY: 8, rotateX: -5 } : { rotateY: 0, rotateX: 0 }}
      whileHover={{ rotateY: 8, rotateX: -5 }}
      transition={{ type: 'spring', stiffness: 300 }}
    >
      <motion.div
        className="absolute"
        style={{
          width: '130%',
          height: '130%',
          left: '-15%',
          top: '-15%',
          background: 'radial-gradient(circle, rgba(251, 191, 36, 0.2), transparent 70%)',
          transform: 'translateZ(-5px)',
        }}
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.4, 0.6, 0.4],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      <div
        className="absolute"
        style={{
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          background: 'linear-gradient(145deg, #fbbf24, #f59e0b)',
          transform: 'translateZ(3px)',
          boxShadow: `
            0 4px 12px rgba(251, 191, 36, 0.35),
            inset 0 -3px 6px rgba(0, 0, 0, 0.15),
            inset 0 3px 6px rgba(255, 255, 255, 0.25)
          `,
        }}
      />

      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{
          transform: 'translateZ(6px)',
          color: 'white',
        }}
      >
        <svg
          width={size * 0.45}
          height={size * 0.45}
          viewBox="0 0 24 24"
          fill="white"
          stroke="white"
          strokeWidth={1}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.2))' }}
        >
          <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />
        </svg>
      </div>
    </motion.div>
  )
}
