'use client'

import { useEffect, useRef, useCallback } from 'react'
import { gsap } from 'gsap'

// ═══════════════════════════════════════════════════
// VECTOR UTILITY CLASSES
// ═══════════════════════════════════════════════════

class Vector2D {
  constructor(public x: number, public y: number) { }
  static random(min: number, max: number): number {
    return min + Math.random() * (max - min)
  }
}

class Vector3D {
  constructor(public x: number, public y: number, public z: number) { }
  static random(min: number, max: number): number {
    return min + Math.random() * (max - min)
  }
}

// ═══════════════════════════════════════════════════
// STAR CLASS — verbatim from spiral-animation
// ═══════════════════════════════════════════════════

class Star {
  private dx: number
  private dy: number
  private spiralLocation: number
  private strokeWeightFactor: number
  private z: number
  private angle: number
  private distance: number
  private rotationDirection: number
  private expansionRate: number
  private finalScale: number

  constructor(cameraZ: number, cameraTravelDistance: number) {
    this.angle = Math.random() * Math.PI * 2
    this.distance = 30 * Math.random() + 15
    this.rotationDirection = Math.random() > 0.5 ? 1 : -1
    this.expansionRate = 1.2 + Math.random() * 0.8
    this.finalScale = 0.7 + Math.random() * 0.6

    this.dx = this.distance * Math.cos(this.angle)
    this.dy = this.distance * Math.sin(this.angle)

    this.spiralLocation = (1 - Math.pow(1 - Math.random(), 3.0)) / 1.3
    this.z = Vector2D.random(0.5 * cameraZ, cameraTravelDistance + cameraZ)

    const lerp = (start: number, end: number, t: number) =>
      start * (1 - t) + end * t
    this.z = lerp(this.z, cameraTravelDistance / 2, 0.3 * this.spiralLocation)
    this.strokeWeightFactor = Math.pow(Math.random(), 2.0)
  }

  render(p: number, controller: AnimationController) {
    const spiralPos = controller.spiralPath(this.spiralLocation)
    const q = p - this.spiralLocation

    if (q > 0) {
      const displacementProgress = controller.constrain(4 * q, 0, 1)

      const linearEasing = displacementProgress
      const elasticEasing = controller.easeOutElastic(displacementProgress)
      const powerEasing = Math.pow(displacementProgress, 2)

      let easing: number
      if (displacementProgress < 0.3) {
        easing = controller.lerp(
          linearEasing,
          powerEasing,
          displacementProgress / 0.3
        )
      } else if (displacementProgress < 0.7) {
        const t = (displacementProgress - 0.3) / 0.4
        easing = controller.lerp(powerEasing, elasticEasing, t)
      } else {
        easing = elasticEasing
      }

      let screenX: number, screenY: number

      if (displacementProgress < 0.3) {
        screenX = controller.lerp(
          spiralPos.x,
          spiralPos.x + this.dx * 0.3,
          easing / 0.3
        )
        screenY = controller.lerp(
          spiralPos.y,
          spiralPos.y + this.dy * 0.3,
          easing / 0.3
        )
      } else if (displacementProgress < 0.7) {
        const midProgress = (displacementProgress - 0.3) / 0.4
        const curveStrength =
          Math.sin(midProgress * Math.PI) * this.rotationDirection * 1.5
        const baseX = spiralPos.x + this.dx * 0.3
        const baseY = spiralPos.y + this.dy * 0.3
        const targetX = spiralPos.x + this.dx * 0.7
        const targetY = spiralPos.y + this.dy * 0.7
        const perpX = -this.dy * 0.4 * curveStrength
        const perpY = this.dx * 0.4 * curveStrength
        screenX = controller.lerp(baseX, targetX, midProgress) + perpX * midProgress
        screenY = controller.lerp(baseY, targetY, midProgress) + perpY * midProgress
      } else {
        const finalProgress = (displacementProgress - 0.7) / 0.3
        const baseX = spiralPos.x + this.dx * 0.7
        const baseY = spiralPos.y + this.dy * 0.7
        const targetDistance = this.distance * this.expansionRate * 1.5
        const spiralTurns = 1.2 * this.rotationDirection
        const spiralAngle =
          this.angle + spiralTurns * finalProgress * Math.PI
        const targetX = spiralPos.x + targetDistance * Math.cos(spiralAngle)
        const targetY = spiralPos.y + targetDistance * Math.sin(spiralAngle)
        screenX = controller.lerp(baseX, targetX, finalProgress)
        screenY = controller.lerp(baseY, targetY, finalProgress)
      }

      const vx =
        ((this.z - (controller as any).cameraZ) * screenX) /
        (controller as any).viewZoom
      const vy =
        ((this.z - (controller as any).cameraZ) * screenY) /
        (controller as any).viewZoom
      const position = new Vector3D(vx, vy, this.z)

      let sizeMultiplier = 1.0
      if (displacementProgress < 0.6) {
        sizeMultiplier = 1.0 + displacementProgress * 0.2
      } else {
        const t = (displacementProgress - 0.6) / 0.4
        sizeMultiplier = 1.2 * (1.0 - t) + this.finalScale * t
      }

      const dotSize = 8.5 * this.strokeWeightFactor * sizeMultiplier
      controller.showProjectedDot(position, dotSize)
    }
  }
}

// ═══════════════════════════════════════════════════
// ANIMATION CONTROLLER — GSAP-driven spiral
// ═══════════════════════════════════════════════════

class AnimationController {
  private timeline: gsap.core.Timeline
  private time = 0
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private dpr: number
  private size: number
  private stars: Star[] = []

  private readonly changeEventTime = 0.32
  public readonly cameraZ = -400
  private readonly cameraTravelDistance = 3400
  private readonly startDotYOffset = 28
  public readonly viewZoom = 100
  private readonly numberOfStars = 5000
  private readonly trailLength = 80

  // Graph overlay callback — set externally
  public onAfterRender: (() => void) | null = null

  constructor(
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    dpr: number,
    size: number
  ) {
    this.canvas = canvas
    this.ctx = ctx
    this.dpr = dpr
    this.size = size
    this.timeline = gsap.timeline({ repeat: -1 })

    this.setupRandomGenerator()
    this.createStars()
    this.setupTimeline()
  }

  private setupRandomGenerator() {
    const originalRandom = Math.random
    const customRandom = () => {
      let seed = 1234
      return () => {
        seed = (seed * 9301 + 49297) % 233280
        return seed / 233280
      }
    }
    Math.random = customRandom()
    this.createStars()
    Math.random = originalRandom
  }

  private createStars() {
    for (let i = 0; i < this.numberOfStars; i++) {
      this.stars.push(new Star(this.cameraZ, this.cameraTravelDistance))
    }
  }

  private setupTimeline() {
    this.timeline.to(this, {
      time: 1,
      duration: 15,
      repeat: -1,
      ease: 'none',
      onUpdate: () => {
        this.render()
        // After spiral renders, draw graph overlay
        if (this.onAfterRender) this.onAfterRender()
      },
    })
  }

  public ease(p: number, g: number): number {
    if (p < 0.5) return 0.5 * Math.pow(2 * p, g)
    else return 1 - 0.5 * Math.pow(2 * (1 - p), g)
  }

  public easeOutElastic(x: number): number {
    const c4 = (2 * Math.PI) / 4.5
    if (x <= 0) return 0
    if (x >= 1) return 1
    return Math.pow(2, -8 * x) * Math.sin((x * 8 - 0.75) * c4) + 1
  }

  public map(
    value: number,
    start1: number,
    stop1: number,
    start2: number,
    stop2: number
  ): number {
    return start2 + (stop2 - start2) * ((value - start1) / (stop1 - start1))
  }

  public constrain(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max)
  }

  public lerp(start: number, end: number, t: number): number {
    return start * (1 - t) + end * t
  }

  public spiralPath(p: number): Vector2D {
    p = this.constrain(1.2 * p, 0, 1)
    p = this.ease(p, 1.8)
    const numberOfSpiralTurns = 6
    const theta = 2 * Math.PI * numberOfSpiralTurns * Math.sqrt(p)
    const r = 170 * Math.sqrt(p)
    return new Vector2D(
      r * Math.cos(theta),
      r * Math.sin(theta) + this.startDotYOffset
    )
  }

  public rotate(
    v1: Vector2D,
    v2: Vector2D,
    p: number,
    orientation: boolean
  ): Vector2D {
    const middle = new Vector2D((v1.x + v2.x) / 2, (v1.y + v2.y) / 2)
    const dx = v1.x - middle.x
    const dy = v1.y - middle.y
    const angle = Math.atan2(dy, dx)
    const o = orientation ? -1 : 1
    const r = Math.sqrt(dx * dx + dy * dy)
    const bounce = Math.sin(p * Math.PI) * 0.05 * (1 - p)
    return new Vector2D(
      middle.x +
      r * (1 + bounce) * Math.cos(angle + o * Math.PI * this.easeOutElastic(p)),
      middle.y +
      r * (1 + bounce) * Math.sin(angle + o * Math.PI * this.easeOutElastic(p))
    )
  }

  public showProjectedDot(position: Vector3D, sizeFactor: number) {
    const t2 = this.constrain(
      this.map(this.time, this.changeEventTime, 1, 0, 1),
      0,
      1
    )
    const newCameraZ =
      this.cameraZ + this.ease(Math.pow(t2, 1.2), 1.8) * this.cameraTravelDistance

    if (position.z > newCameraZ) {
      const dotDepthFromCamera = position.z - newCameraZ
      const x = (this.viewZoom * position.x) / dotDepthFromCamera
      const y = (this.viewZoom * position.y) / dotDepthFromCamera
      const sw = (400 * sizeFactor) / dotDepthFromCamera
      this.ctx.lineWidth = sw
      this.ctx.beginPath()
      this.ctx.arc(x, y, 0.5, 0, Math.PI * 2)
      this.ctx.fill()
    }
  }

  private drawStartDot() {
    if (this.time > this.changeEventTime) {
      const dy = (this.cameraZ * this.startDotYOffset) / this.viewZoom
      const position = new Vector3D(0, dy, this.cameraTravelDistance)
      this.showProjectedDot(position, 2.5)
    }
  }

  public render() {
    const ctx = this.ctx
    if (!ctx) return

    ctx.fillStyle = 'black'
    ctx.fillRect(0, 0, this.size, this.size)

    ctx.save()
    ctx.translate(this.size / 2, this.size / 2)

    const t1 = this.constrain(
      this.map(this.time, 0, this.changeEventTime + 0.25, 0, 1),
      0,
      1
    )
    const t2 = this.constrain(
      this.map(this.time, this.changeEventTime, 1, 0, 1),
      0,
      1
    )

    ctx.rotate(-Math.PI * this.ease(t2, 2.7))

    this.drawTrail(t1)

    ctx.fillStyle = 'white'
    for (const star of this.stars) {
      star.render(t1, this)
    }

    this.drawStartDot()
    ctx.restore()
  }

  private drawTrail(t1: number) {
    for (let i = 0; i < this.trailLength; i++) {
      const f = this.map(i, 0, this.trailLength, 1.1, 0.1)
      const sw = (1.3 * (1 - t1) + 3.0 * Math.sin(Math.PI * t1)) * f

      this.ctx.fillStyle = 'white'
      this.ctx.lineWidth = sw

      const pathTime = t1 - 0.00015 * i
      const position = this.spiralPath(pathTime)

      const basePos = position
      const offset = new Vector2D(position.x + 5, position.y + 5)
      const rotated = this.rotate(
        basePos,
        offset,
        Math.sin(this.time * Math.PI * 2) * 0.5 + 0.5,
        i % 2 === 0
      )

      this.ctx.beginPath()
      this.ctx.arc(rotated.x, rotated.y, sw / 2, 0, Math.PI * 2)
      this.ctx.fill()
    }
  }

  public pause() {
    this.timeline.pause()
  }

  public resume() {
    this.timeline.play()
  }

  public destroy() {
    this.timeline.kill()
  }
}

// ═══════════════════════════════════════════════════
// GRAPH NODE — for Obsidian-style overlay
// ═══════════════════════════════════════════════════

interface GraphNode {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  opacity: number
}

function createGraphNodes(w: number, h: number, count: number): GraphNode[] {
  const nodes: GraphNode[] = []
  for (let i = 0; i < count; i++) {
    nodes.push({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      radius: 2 + Math.random() * 2,
      opacity: 0.4 + Math.random() * 0.5,
    })
  }
  return nodes
}

// ═══════════════════════════════════════════════════
// HERO COMPONENT
// ═══════════════════════════════════════════════════

export function EagleClawHero() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<AnimationController | null>(null)
  const nodesRef = useRef<GraphNode[]>([])
  const mouseRef = useRef<{ x: number; y: number; active: boolean }>({
    x: 0,
    y: 0,
    active: false,
  })

  // ── Graph overlay draw function ──
  const drawGraphOverlay = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    const w = canvas.width / dpr
    const h = canvas.height / dpr

    const nodes = nodesRef.current
    const mouse = mouseRef.current

    // Save state and set global alpha for overlay transparency
    ctx.save()
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0) // reset to screen coords
    ctx.globalAlpha = 0.7

    const CONNECTION_DIST = 180
    const CURSOR_DIST = 220

    // Update node positions
    for (const node of nodes) {
      // Cursor repulsion
      if (mouse.active) {
        const dx = node.x - mouse.x
        const dy = node.y - mouse.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < CURSOR_DIST && dist > 1) {
          const force = Math.min(2, 1 / dist * 80)
          node.vx += (dx / dist) * force * 0.05
          node.vy += (dy / dist) * force * 0.05
        }
      }

      // Dampen velocity
      node.vx *= 0.998
      node.vy *= 0.998

      node.x += node.vx
      node.y += node.vy

      // Bounce off edges
      if (node.x < 0) {
        node.x = 0
        node.vx *= -1
      }
      if (node.x > w) {
        node.x = w
        node.vx *= -1
      }
      if (node.y < 0) {
        node.y = 0
        node.vy *= -1
      }
      if (node.y > h) {
        node.y = h
        node.vy *= -1
      }
    }

    // Draw connections between nodes
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x
        const dy = nodes[i].y - nodes[j].y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < CONNECTION_DIST) {
          const lineOpacity = (1 - dist / CONNECTION_DIST) * 0.35
          ctx.strokeStyle = `rgba(139, 92, 246, ${lineOpacity})`
          ctx.lineWidth = 0.6
          ctx.beginPath()
          ctx.moveTo(nodes[i].x, nodes[i].y)
          ctx.lineTo(nodes[j].x, nodes[j].y)
          ctx.stroke()
        }
      }
    }

    // Draw cursor connections
    if (mouse.active) {
      const pulseRadius = 4 + 4 * Math.sin(Date.now() / 400)
      for (const node of nodes) {
        const dx = node.x - mouse.x
        const dy = node.y - mouse.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < CURSOR_DIST) {
          ctx.strokeStyle = `rgba(139, 92, 246, 0.6)`
          ctx.lineWidth = 0.8
          ctx.beginPath()
          ctx.moveTo(mouse.x, mouse.y)
          ctx.lineTo(node.x, node.y)
          ctx.stroke()
        }
      }
      // Draw cursor node (pulsing)
      ctx.fillStyle = `rgba(139, 92, 246, 0.9)`
      ctx.beginPath()
      ctx.arc(mouse.x, mouse.y, pulseRadius, 0, Math.PI * 2)
      ctx.fill()
    }

    // Draw nodes
    for (const node of nodes) {
      ctx.fillStyle = `rgba(139, 92, 246, ${node.opacity})`
      ctx.beginPath()
      ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2)
      ctx.fill()
    }

    ctx.restore()
  }, [])

  // ── Canvas setup + animation ──
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const handleResize = () => {
      const dpr = window.devicePixelRatio || 1
      const w = window.innerWidth
      const h = window.innerHeight
      const size = Math.max(w, h)

      canvas.width = size * dpr
      canvas.height = size * dpr
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      ctx.scale(dpr, dpr)

      // Reinitialize
      if (animationRef.current) {
        animationRef.current.destroy()
      }

      nodesRef.current = createGraphNodes(w, h, 60)

      const controller = new AnimationController(canvas, ctx, dpr, size)
      controller.onAfterRender = drawGraphOverlay
      animationRef.current = controller
    }

    handleResize()
    window.addEventListener('resize', handleResize)

    // Mouse tracking
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY, active: true }
    }
    const handleMouseLeave = () => {
      mouseRef.current = { ...mouseRef.current, active: false }
    }
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseleave', handleMouseLeave)
      if (animationRef.current) {
        animationRef.current.destroy()
        animationRef.current = null
      }
    }
  }, [drawGraphOverlay])

  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden bg-[#0a0a0b]">
      {/* ── CANVAS BACKGROUND ── */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        id="hero-canvas"
      />

      {/* ── HERO TEXT OVERLAY ── */}
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none">
        {/* Top Label */}
        <p
          className="font-mono-body text-xs tracking-[0.35em] uppercase mb-6 animate-entrance delay-800"
          style={{ color: 'rgba(139, 92, 246, 0.7)' }}
          id="hero-label"
        >
          SOLANA &middot; IPFS &middot; DECENTRALIZED
        </p>

        {/* Headline */}
        <h1 className="font-display text-center leading-[0.95] headline-glow pointer-events-auto select-none">
          <span
            className="block text-[56px] md:text-[96px] text-white animate-entrance delay-1000"
            id="headline-line-1"
          >
            YOUR SILENCE
          </span>
          <span
            className="block text-[56px] md:text-[96px] text-white animate-entrance delay-1150"
            id="headline-line-2"
          >
            CANNOT BE
          </span>
          <span
            className="block text-[56px] md:text-[96px] text-white animate-entrance delay-1300"
            id="headline-line-3"
          >
            FORCED.
          </span>
        </h1>

        {/* Subheadline */}
        <p
          className="font-mono-body text-sm max-w-[480px] text-center mt-6 px-4 animate-entrance delay-1500"
          style={{ color: 'rgba(248, 248, 248, 0.65)' }}
          id="hero-subheadline"
        >
          A cryptographic dead-man&apos;s switch for journalists and activists.
          <br />
          If you disappear, the truth doesn&apos;t.
        </p>

        {/* CTA Buttons */}
        <div
          className="flex flex-col sm:flex-row items-center gap-4 mt-10 pointer-events-auto animate-entrance delay-1700"
          id="hero-cta-row"
        >
          <button className="cta-primary" id="cta-arm-vault">
            ARM YOUR VAULT &rarr;
          </button>
          <button className="cta-secondary" id="cta-read-spec">
            READ THE SPEC
          </button>
        </div>
      </div>

      {/* ── STATUS BAR ── */}
      <div className="status-bar animate-entrance delay-2000" id="hero-status-bar">
        <span>
          72H TIMELOCK &middot; 6-OF-10 KEEPER QUORUM &middot; ARWEAVE PINNED
        </span>
      </div>
    </div>
  )
}
