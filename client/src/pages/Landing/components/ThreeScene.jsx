import { Canvas, useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import { useRef, useState } from 'react'
import { Box } from '@mui/material'

const cardStyle = {
  fontFamily: "'Inter', 'Helvetica Neue', sans-serif",
  userSelect: 'none',
  pointerEvents: 'none',
}

function MainCardFace() {
  return (
    <div style={{
      ...cardStyle,
      width: '210px',
      height: '125px',
      background: 'linear-gradient(135deg, #0A1628 0%, #0D1E35 100%)',
      borderRadius: '10px',
      border: '1.5px solid rgba(59,130,246,0.5)',
      padding: '14px 16px',
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      boxShadow: '0 0 24px rgba(59,130,246,0.3)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ color: 'rgba(148,163,184,0.85)', fontSize: '9px', fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '3px' }}>Total Spending</div>
          <div style={{ color: '#F8FAFC', fontSize: '22px', fontWeight: 700, lineHeight: 1, letterSpacing: '-0.5px' }}>$3,240</div>
          <div style={{ color: '#10B981', fontSize: '9px', fontWeight: 600, marginTop: '3px' }}>▲ 12% vs last month</div>
        </div>
        <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(59,130,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px' }}>💳</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '32px' }}>
        {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
          <div key={i} style={{
            flex: 1,
            height: `${h}%`,
            borderRadius: '2px 2px 0 0',
            background: i === 5 ? 'rgba(59,130,246,0.9)' : 'rgba(59,130,246,0.35)',
            transition: 'height 0.3s',
          }} />
        ))}
      </div>
    </div>
  )
}

function OrbCardFace({ type }) {
  if (type === 'dining') return (
    <div style={{
      ...cardStyle,
      width: '120px',
      height: '72px',
      background: 'linear-gradient(135deg, #0D1E35 0%, #111827 100%)',
      borderRadius: '8px',
      border: '1.5px solid rgba(245,158,11,0.45)',
      padding: '10px 12px',
      boxSizing: 'border-box',
      boxShadow: '0 0 16px rgba(245,158,11,0.25)',
    }}>
      <div style={{ color: 'rgba(148,163,184,0.8)', fontSize: '8px', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '4px' }}>🍽 Dining</div>
      <div style={{ color: '#F8FAFC', fontSize: '17px', fontWeight: 700, letterSpacing: '-0.5px' }}>$486</div>
      <div style={{ marginTop: '5px', height: '4px', background: 'rgba(245,158,11,0.2)', borderRadius: '2px' }}>
        <div style={{ width: '62%', height: '100%', background: 'rgba(245,158,11,0.8)', borderRadius: '2px' }} />
      </div>
    </div>
  )

  if (type === 'travel') return (
    <div style={{
      ...cardStyle,
      width: '112px',
      height: '68px',
      background: 'linear-gradient(135deg, #0D1E35 0%, #111827 100%)',
      borderRadius: '8px',
      border: '1.5px solid rgba(124,58,237,0.45)',
      padding: '10px 12px',
      boxSizing: 'border-box',
      boxShadow: '0 0 16px rgba(124,58,237,0.25)',
    }}>
      <div style={{ color: 'rgba(148,163,184,0.8)', fontSize: '8px', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '4px' }}>✈️ Travel</div>
      <div style={{ color: '#F8FAFC', fontSize: '17px', fontWeight: 700, letterSpacing: '-0.5px' }}>$1,200</div>
      <div style={{ color: 'rgba(124,58,237,0.9)', fontSize: '8px', marginTop: '3px', fontWeight: 500 }}>Budget: $1,500</div>
    </div>
  )

  if (type === 'ai') return (
    <div style={{
      ...cardStyle,
      width: '104px',
      height: '64px',
      background: 'linear-gradient(135deg, #0D1E35 0%, #111827 100%)',
      borderRadius: '8px',
      border: '1.5px solid rgba(16,185,129,0.45)',
      padding: '10px 12px',
      boxSizing: 'border-box',
      boxShadow: '0 0 16px rgba(16,185,129,0.25)',
    }}>
      <div style={{ color: '#10B981', fontSize: '8px', fontWeight: 600, marginBottom: '4px' }}>✨ AI Insight</div>
      <div style={{ color: 'rgba(248,250,252,0.9)', fontSize: '9px', lineHeight: 1.35 }}>You saved $240 on dining this week!</div>
    </div>
  )

  return (
    <div style={{
      ...cardStyle,
      width: '96px',
      height: '60px',
      background: 'linear-gradient(135deg, #0D1E35 0%, #111827 100%)',
      borderRadius: '8px',
      border: '1.5px solid rgba(59,130,246,0.4)',
      padding: '10px 12px',
      boxSizing: 'border-box',
      boxShadow: '0 0 14px rgba(59,130,246,0.2)',
    }}>
      <div style={{ color: 'rgba(148,163,184,0.8)', fontSize: '8px', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '4px' }}>📊 Budget</div>
      <div style={{ color: '#F8FAFC', fontSize: '16px', fontWeight: 700 }}>78%</div>
      <div style={{ color: 'rgba(148,163,184,0.7)', fontSize: '8px', marginTop: '2px' }}>on track</div>
    </div>
  )
}

function OrbCard({ width, height, orbitRadius, orbitSpeed, orbitOffset, vertPhase, color, cardType }) {
  const group = useRef()
  const faceRef = useRef()

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    const x = Math.cos(t * orbitSpeed + orbitOffset) * orbitRadius
    const y = Math.sin(t * orbitSpeed * 0.65 + vertPhase) * 0.6
    const z = Math.sin(t * orbitSpeed + orbitOffset) * 0.5 - 0.4
    group.current.position.set(x, y, z)
    group.current.rotation.y = Math.sin(t * 0.5 + orbitOffset) * 0.25
    group.current.rotation.x = Math.cos(t * 0.35 + vertPhase) * 0.12
    // Fade out HTML only when card is very close to center (actual overlap zone)
    if (faceRef.current) {
      const d = Math.abs(x)
      faceRef.current.style.opacity = d < 0.7 ? 0 : d < 1.2 ? (d - 0.7) / 0.5 : 1
    }
  })

  return (
    <group ref={group}>
      <mesh>
        <boxGeometry args={[width, height, 0.06]} />
        <meshStandardMaterial color={0x0D1E35} emissive={color} emissiveIntensity={0.3} metalness={0.6} roughness={0.3} transparent opacity={0.15} />
      </mesh>
      <Html
        transform
        occlude={false}
        position={[0, 0, 0.04]}
        style={{ pointerEvents: 'none' }}
      >
        <div ref={faceRef}>
          <OrbCardFace type={cardType} />
        </div>
      </Html>
    </group>
  )
}

function MainCard() {
  const group = useRef()
  const glow = useRef()

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    group.current.rotation.y = Math.sin(t * 0.35) * 0.06
    group.current.rotation.x = Math.cos(t * 0.28) * 0.04
    glow.current.material.opacity = 0.45 + Math.sin(t * 2.2) * 0.2
  })

  return (
    <group ref={group}>
      <mesh>
        <boxGeometry args={[2.6, 1.55, 0.08]} />
        <meshStandardMaterial color={0x0A1628} emissive={0x1E4080} emissiveIntensity={0.5} metalness={0.7} roughness={0.25} transparent opacity={0.2} />
      </mesh>
      <mesh ref={glow}>
        <boxGeometry args={[2.68, 1.63, 0.07]} />
        <meshBasicMaterial color={0x3B82F6} transparent opacity={0.55} />
      </mesh>
      <mesh>
        <boxGeometry args={[2.78, 1.73, 0.04]} />
        <meshBasicMaterial color={0x1D4ED8} transparent opacity={0.12} />
      </mesh>
      <Html
        transform
        occlude={false}
        position={[0, 0, 0.05]}
        style={{ pointerEvents: 'none' }}
      >
        <MainCardFace />
      </Html>
    </group>
  )
}

function Particles() {
  const ref = useRef()
  const positions = new Float32Array(
    Array.from({ length: 160 }, () => [
      (Math.random() - 0.5) * 12,
      (Math.random() - 0.5) * 8,
      (Math.random() - 0.5) * 5,
    ]).flat()
  )

  useFrame(({ clock }) => {
    ref.current.material.opacity = 0.4 + Math.sin(clock.getElapsedTime() * 0.6) * 0.15
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={160} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial color={0x60A5FA} size={0.05} transparent opacity={0.5} sizeAttenuation />
    </points>
  )
}

function Scene({ mouseX, mouseY }) {
  const group = useRef()

  useFrame(() => {
    group.current.rotation.y += (mouseX * 0.3 - group.current.rotation.y) * 0.06
    group.current.rotation.x += (-mouseY * 0.2 - group.current.rotation.x) * 0.06
  })

  return (
    <group ref={group}>
      <MainCard />
      <OrbCard width={1.5} height={0.9}  orbitRadius={2.4} orbitSpeed={0.42} orbitOffset={0}       vertPhase={0}   color={0x3B82F6} cardType="dining" />
      <OrbCard width={1.4} height={0.85} orbitRadius={2.3} orbitSpeed={0.42} orbitOffset={Math.PI} vertPhase={1.2} color={0xF59E0B} cardType="travel" />
      <OrbCard width={1.3} height={0.80} orbitRadius={2.0} orbitSpeed={0.55} orbitOffset={2.1}     vertPhase={2.4} color={0x7C3AED} cardType="ai" />
      <OrbCard width={1.2} height={0.75} orbitRadius={2.1} orbitSpeed={0.48} orbitOffset={4.2}     vertPhase={3.6} color={0x10B981} cardType="budget" />
    </group>
  )
}

export default function ThreeScene() {
  const [mouse, setMouse] = useState({ x: 0, y: 0 })

  return (
    <Box
      sx={{ width: '100%', height: { xs: 300, md: 420 }, mt: 4, cursor: 'none' }}
      onMouseMove={e => {
        const r = e.currentTarget.getBoundingClientRect()
        setMouse({
          x: ((e.clientX - r.left) / r.width) * 2 - 1,
          y: ((e.clientY - r.top) / r.height) * 2 - 1,
        })
      }}
      onMouseLeave={() => setMouse({ x: 0, y: 0 })}
    >
      <Canvas
        camera={{ position: [0, 0, 7], fov: 48 }}
        gl={{ alpha: true, antialias: true }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.8} color={0x2244AA} />
        <pointLight position={[4, 3, 5]} intensity={12} color={0x3B82F6} />
        <pointLight position={[-4, -2, 4]} intensity={8} color={0xF59E0B} />
        <pointLight position={[0, 0, -3]} intensity={5} color={0x7C3AED} />
        <pointLight position={[0, -4, 6]} intensity={4} color={0x1E40AF} />
        <Scene mouseX={mouse.x} mouseY={mouse.y} />
        <Particles />
      </Canvas>
    </Box>
  )
}
