'use client'

import { useEffect, useRef } from 'react'
import { useTheme } from 'next-themes'

const CARD_COUNT = 30
const CONNECTION_DISTANCE = 220
const MOUSE_REPEL_DISTANCE = 140
const MOUSE_REPEL_FORCE = 0.6

// 카드 크기 범위 (z 기반 스케일)
const CARD_BASE_W = 56
const CARD_BASE_H = 38
const LINE_COUNT_OPTIONS = [2, 3, 4] // 카드 내 텍스트 라인 수

// Idle drift: 마우스 없이도 자연스럽게 떠다니는 효과
const IDLE_DRIFT_STRENGTH = 0.15
const IDLE_DRIFT_SPEED = 0.0004 // 낮을수록 느리고 부드러움

interface CardNode {
  x: number
  y: number
  z: number       // 0.2~1.0 pseudo-depth
  vx: number
  vy: number
  rotation: number // 미세 기울기 (라디안)
  rotSpeed: number
  colorIndex: number
  lineWidths: number[] // 텍스트 라인 너비 비율 (0~1)
  hasCheckbox: boolean
  hasBadge: boolean
  driftPhaseX: number  // idle drift 위상 오프셋
  driftPhaseY: number
}

const ACCENT_COLORS_LIGHT = [
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#10b981', // emerald
  '#f59e0b', // amber
  '#f43f5e', // rose
]

const ACCENT_COLORS_DARK = [
  '#60a5fa', // blue
  '#a78bfa', // violet
  '#34d399', // emerald
  '#fbbf24', // amber
  '#fb7185', // rose
]

function createCards(width: number, height: number): CardNode[] {
  return Array.from({ length: CARD_COUNT }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    z: Math.random() * 0.8 + 0.2,
    vx: (Math.random() - 0.5) * 0.3,
    vy: (Math.random() - 0.5) * 0.3,
    rotation: (Math.random() - 0.5) * 0.15,
    rotSpeed: (Math.random() - 0.5) * 0.001,
    colorIndex: Math.floor(Math.random() * ACCENT_COLORS_LIGHT.length),
    lineWidths: Array.from(
      { length: LINE_COUNT_OPTIONS[Math.floor(Math.random() * LINE_COUNT_OPTIONS.length)] },
      (_, i) => i === 0 ? 0.75 : 0.4 + Math.random() * 0.35,
    ),
    hasCheckbox: Math.random() > 0.5,
    hasBadge: Math.random() > 0.6,
    driftPhaseX: Math.random() * Math.PI * 2,
    driftPhaseY: Math.random() * Math.PI * 2,
  }))
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

export function NetworkCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const cardsRef = useRef<CardNode[]>([])
  const mouseRef = useRef({ x: -9999, y: -9999 })
  const { resolvedTheme } = useTheme()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const isDark = resolvedTheme === 'dark'
    let animId = 0
    const startTime = performance.now()

    const handleResize = () => {
      const dpr = window.devicePixelRatio || 1
      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      ctx.scale(dpr, dpr)

      if (cardsRef.current.length === 0) {
        cardsRef.current = createCards(rect.width, rect.height)
      }
    }

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top }
    }

    const handleMouseLeave = () => {
      mouseRef.current = { x: -9999, y: -9999 }
    }

    const animate = () => {
      const rect = canvas.getBoundingClientRect()
      const width = rect.width
      const height = rect.height
      const cards = cardsRef.current
      const accentColors = isDark ? ACCENT_COLORS_DARK : ACCENT_COLORS_LIGHT
      const mouse = mouseRef.current

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Update positions
      const elapsed = performance.now() - startTime
      for (const card of cards) {
        // Idle drift: 사인파 기반 부드러운 자율 움직임
        const t = elapsed * IDLE_DRIFT_SPEED * (card.z * 0.5 + 0.5)
        card.vx += Math.sin(t + card.driftPhaseX) * IDLE_DRIFT_STRENGTH * 0.01
        card.vy += Math.cos(t + card.driftPhaseY) * IDLE_DRIFT_STRENGTH * 0.01

        const dx = card.x - mouse.x
        const dy = card.y - mouse.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < MOUSE_REPEL_DISTANCE && dist > 0) {
          const force = (1 - dist / MOUSE_REPEL_DISTANCE) * MOUSE_REPEL_FORCE
          card.vx += (dx / dist) * force
          card.vy += (dy / dist) * force
        }

        const speed = card.z * 0.6 + 0.2
        card.x += card.vx * speed
        card.y += card.vy * speed
        card.rotation += card.rotSpeed

        card.vx *= 0.99
        card.vy *= 0.99

        if (card.x < 0 || card.x > width) {
          card.vx *= -1
          card.x = Math.max(0, Math.min(width, card.x))
        }
        if (card.y < 0 || card.y > height) {
          card.vy *= -1
          card.y = Math.max(0, Math.min(height, card.y))
        }
      }

      // Draw connections
      for (let i = 0; i < cards.length; i++) {
        for (let j = i + 1; j < cards.length; j++) {
          const a = cards[i]
          const b = cards[j]
          const edx = a.x - b.x
          const edy = a.y - b.y
          const edist = Math.sqrt(edx * edx + edy * edy)
          const maxDist = CONNECTION_DISTANCE * ((a.z + b.z) / 2)

          if (edist < maxDist) {
            const opacity = (1 - edist / maxDist) * 0.35 * ((a.z + b.z) / 2)
            ctx.beginPath()
            ctx.moveTo(a.x, a.y)
            ctx.lineTo(b.x, b.y)
            ctx.strokeStyle = isDark
              ? `rgba(148, 163, 184, ${opacity})`
              : `rgba(100, 116, 139, ${opacity})`
            ctx.lineWidth = 1
            ctx.stroke()
          }
        }
      }

      // Draw cards (sorted by z for depth ordering)
      const sorted = [...cards].sort((a, b) => a.z - b.z)

      for (const card of sorted) {
        const scale = card.z * 0.85 + 0.15
        const cw = CARD_BASE_W * scale
        const ch = CARD_BASE_H * scale
        const opacity = card.z * 0.45 + 0.1
        const accent = accentColors[card.colorIndex]

        ctx.save()
        ctx.translate(card.x, card.y)
        ctx.rotate(card.rotation)

        // Shadow
        ctx.shadowColor = isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.08)'
        ctx.shadowBlur = 8 * scale
        ctx.shadowOffsetY = 2 * scale

        // Card body
        roundRect(ctx, -cw / 2, -ch / 2, cw, ch, 4 * scale)
        ctx.fillStyle = isDark
          ? `rgba(30, 41, 59, ${opacity})`   // slate-800
          : `rgba(255, 255, 255, ${opacity})`
        ctx.fill()

        // Card border
        ctx.shadowColor = 'transparent'
        ctx.shadowBlur = 0
        ctx.shadowOffsetY = 0
        roundRect(ctx, -cw / 2, -ch / 2, cw, ch, 4 * scale)
        ctx.strokeStyle = isDark
          ? `rgba(71, 85, 105, ${opacity * 0.6})`
          : `rgba(203, 213, 225, ${opacity * 0.8})`
        ctx.lineWidth = 1
        ctx.stroke()

        // Top color accent bar
        const barH = 3 * scale
        ctx.beginPath()
        ctx.moveTo(-cw / 2 + 4 * scale, -ch / 2)
        ctx.lineTo(cw / 2 - 4 * scale, -ch / 2)
        ctx.quadraticCurveTo(cw / 2, -ch / 2, cw / 2, -ch / 2 + 4 * scale)
        ctx.lineTo(cw / 2, -ch / 2 + barH)
        ctx.lineTo(-cw / 2, -ch / 2 + barH)
        ctx.lineTo(-cw / 2, -ch / 2 + 4 * scale)
        ctx.quadraticCurveTo(-cw / 2, -ch / 2, -cw / 2 + 4 * scale, -ch / 2)
        ctx.closePath()
        ctx.fillStyle = accent.replace(')', `, ${opacity})`)
          .replace('rgb', 'rgba')
          .replace('rgba(', 'rgba(')
        // simpler: just use hex with opacity
        ctx.globalAlpha = opacity
        ctx.fillStyle = accent
        ctx.fill()
        ctx.globalAlpha = 1

        // Inner content: text lines
        const contentTop = -ch / 2 + barH + 4 * scale
        const lineH = 3 * scale
        const lineGap = 3 * scale
        const contentLeft = -cw / 2 + 5 * scale
        const maxLineW = cw - 10 * scale

        for (let li = 0; li < card.lineWidths.length; li++) {
          const y = contentTop + li * (lineH + lineGap)
          if (y + lineH > ch / 2 - 3 * scale) break
          const lineW = maxLineW * card.lineWidths[li]

          ctx.beginPath()
          roundRect(ctx, contentLeft, y, lineW, lineH, 1.5 * scale)
          ctx.fillStyle = isDark
            ? `rgba(148, 163, 184, ${opacity * 0.4})`
            : `rgba(148, 163, 184, ${opacity * 0.5})`
          ctx.fill()
        }

        // Optional: checkbox indicator (small square)
        if (card.hasCheckbox) {
          const cbSize = 4 * scale
          const cbX = cw / 2 - 5 * scale - cbSize
          const cbY = -ch / 2 + barH + 4 * scale
          roundRect(ctx, cbX, cbY, cbSize, cbSize, 1 * scale)
          ctx.strokeStyle = isDark
            ? `rgba(148, 163, 184, ${opacity * 0.5})`
            : `rgba(148, 163, 184, ${opacity * 0.6})`
          ctx.lineWidth = 1
          ctx.stroke()
        }

        // Optional: small badge dot (bottom-right)
        if (card.hasBadge) {
          const dotR = 2 * scale
          ctx.beginPath()
          ctx.arc(cw / 2 - 6 * scale, ch / 2 - 6 * scale, dotR, 0, Math.PI * 2)
          ctx.fillStyle = accent
          ctx.globalAlpha = opacity * 0.7
          ctx.fill()
          ctx.globalAlpha = 1
        }

        ctx.restore()
      }

      animId = requestAnimationFrame(animate)
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    canvas.addEventListener('mousemove', handleMouseMove)
    canvas.addEventListener('mouseleave', handleMouseLeave)

    animId = requestAnimationFrame(animate)

    return () => {
      window.removeEventListener('resize', handleResize)
      canvas.removeEventListener('mousemove', handleMouseMove)
      canvas.removeEventListener('mouseleave', handleMouseLeave)
      cancelAnimationFrame(animId)
    }
  }, [resolvedTheme])

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-auto absolute inset-0 h-full w-full"
      aria-hidden="true"
    />
  )
}
