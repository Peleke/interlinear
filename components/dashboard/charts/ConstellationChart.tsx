'use client'

import React, { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'
import { motion } from 'framer-motion'

interface StatsData {
  xp: number
  streak: number
  level: number
  completedLessons: number
}

interface ParticleData {
  id: string
  x: number
  y: number
  radius: number
  color: string
  type: 'sand' | 'spark'
  velocity: { x: number; y: number }
  life: number
  maxLife: number
}

interface TooltipData {
  visible: boolean
  x: number
  y: number
  content: string
  title: string
}

export default function ConstellationChart({ xp, streak, level, completedLessons }: StatsData) {
  const svgRef = useRef<SVGSVGElement>(null)
  const animationFrameRef = useRef<number>()
  const particlesRef = useRef<ParticleData[]>([])
  const [tooltip, setTooltip] = useState<TooltipData>({
    visible: false,
    x: 0,
    y: 0,
    content: '',
    title: ''
  })

  // Calculate level progress - MUST match API thresholds
  const LEVEL_THRESHOLDS = [0, 200, 500, 1000, 2000, 5000]
  const currentLevelXp = LEVEL_THRESHOLDS[level - 1] || 0
  const nextLevelXp = LEVEL_THRESHOLDS[level] || currentLevelXp + 1000
  const rawLevelProgress = ((xp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100
  const levelProgress = Math.max(0, Math.min(100, rawLevelProgress)) // Clamp between 0-100


  useEffect(() => {
    if (!svgRef.current) return

    const svg = d3.select(svgRef.current)
    const container = svg.node()?.parentElement
    if (!container) return

    // Setup dimensions
    const width = container.clientWidth
    const height = container.clientHeight
    const centerX = width / 2
    const centerY = height / 2
    const maxRadius = Math.min(width, height) * 0.35

    svg.attr('width', width).attr('height', height)

    // Clear previous content
    svg.selectAll('*').remove()

    // Create gradient definitions
    const defs = svg.append('defs')

    // XP Sun gradient
    const sunGradient = defs.append('radialGradient')
      .attr('id', 'sunGradient')
      .attr('cx', '50%')
      .attr('cy', '50%')
      .attr('r', '50%')

    sunGradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#E6A853')
      .attr('stop-opacity', '1')

    sunGradient.append('stop')
      .attr('offset', '70%')
      .attr('stop-color', '#CC8A47')
      .attr('stop-opacity', '0.8')

    sunGradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#8B2635')
      .attr('stop-opacity', '0.3')

    // Level ring gradient
    const ringGradient = defs.append('linearGradient')
      .attr('id', 'ringGradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '100%')
      .attr('y2', '100%')

    ringGradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#6B4E7D')
      .attr('stop-opacity', '0.8')

    ringGradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#4A2C54')
      .attr('stop-opacity', '1')

    // Create main group
    const mainGroup = svg.append('g')

    // Level ring (background)
    const ringRadius = maxRadius * 0.9
    const ringWidth = 8

    const levelRingBg = mainGroup.append('circle')
      .attr('cx', centerX)
      .attr('cy', centerY)
      .attr('r', ringRadius)
      .attr('fill', 'none')
      .attr('stroke', '#D4C4A8')
      .attr('stroke-width', ringWidth)
      .attr('stroke-opacity', 0.2)

    // Level ring (progress)
    const circumference = 2 * Math.PI * ringRadius
    const progressLength = (levelProgress / 100) * circumference


    const levelRingProgress = mainGroup.append('circle')
      .attr('cx', centerX)
      .attr('cy', centerY)
      .attr('r', ringRadius)
      .attr('fill', 'none')
      .attr('stroke', 'url(#ringGradient)')
      .attr('stroke-width', ringWidth)
      .attr('stroke-dasharray', `${progressLength} ${circumference}`)
      .attr('transform', `rotate(-90 ${centerX} ${centerY})`)
      .attr('filter', 'drop-shadow(0 0 8px rgba(107, 78, 125, 0.6))')

    // Animate level ring
    levelRingProgress
      .attr('stroke-dasharray', `0 ${circumference}`)
      .transition()
      .duration(2000)
      .ease(d3.easeElasticOut.amplitude(1).period(0.5))
      .attr('stroke-dasharray', `${progressLength} ${circumference}`)

    // Central XP Sun
    const sunRadius = maxRadius * 0.35
    const xpSun = mainGroup.append('circle')
      .attr('cx', centerX)
      .attr('cy', centerY)
      .attr('r', 0)
      .attr('fill', 'url(#sunGradient)')
      .attr('filter', 'drop-shadow(0 0 15px rgba(230, 168, 83, 0.8))')

    // Animate XP sun
    xpSun
      .transition()
      .duration(1500)
      .ease(d3.easeElasticOut)
      .attr('r', sunRadius)

    // XP text
    const xpText = mainGroup.append('text')
      .attr('x', centerX)
      .attr('y', centerY - 5)
      .attr('text-anchor', 'middle')
      .attr('font-size', '28')
      .attr('font-weight', 'bold')
      .attr('fill', '#2B221B')
      .text('0')

    // XP label
    const xpLabel = mainGroup.append('text')
      .attr('x', centerX)
      .attr('y', centerY + 15)
      .attr('text-anchor', 'middle')
      .attr('font-size', '12')
      .attr('font-weight', '600')
      .attr('fill', '#F5F1E8')
      .text('XP')

    // Animate XP counter
    xpText
      .transition()
      .duration(2000)
      .ease(d3.easeExpOut)
      .tween('text', () => {
        const interpolate = d3.interpolateNumber(0, xp)
        return (t) => {
          xpText.text(Math.round(interpolate(t)).toLocaleString())
        }
      })

    // Animate XP label
    xpLabel
      .attr('opacity', 0)
      .transition()
      .duration(500)
      .delay(1500)
      .attr('opacity', 1)


    // Streak fire trail calculation - REMOVED (looked like shit on screen)
    /*
    const streakAngle = (streak / 365) * 2 * Math.PI // Full circle for 365 days
    const streakTrailRadius = maxRadius * 0.7

    // Generate streak trail points
    const streakPoints = []
    const streakSegments = Math.min(streak, 50) // Max 50 segments for performance
    for (let i = 0; i < streakSegments; i++) {
      const angle = (i / streakSegments) * streakAngle - Math.PI / 2
      const radius = streakTrailRadius + Math.sin(i * 0.5) * 5 // Slight wave effect
      const x = centerX + Math.cos(angle) * radius
      const y = centerY + Math.sin(angle) * radius
      streakPoints.push([x, y])
    }

    // Streak fire trail
    let streakPath: d3.Selection<SVGPathElement, any, any, any> | null = null
    if (streak > 0 && streakPoints.length > 1) {
      const streakLine = d3.line()
        .x(d => d[0])
        .y(d => d[1])
        .curve(d3.curveCatmullRom)

      streakPath = mainGroup.append('path')
        .datum(streakPoints)
        .attr('d', streakLine)
        .attr('fill', 'none')
        .attr('stroke', '#B85450')
        .attr('stroke-width', 4)
        .attr('stroke-linecap', 'round')
        .attr('filter', 'drop-shadow(0 0 6px rgba(184, 84, 80, 0.8))')
        .attr('class', 'streak-trail')

      // Animate streak trail
      const pathLength = streakPath.node()?.getTotalLength() || 0
      streakPath
        .attr('stroke-dasharray', `0 ${pathLength}`)
        .transition()
        .duration(1500)
        .delay(500)
        .ease(d3.easeExpOut)
        .attr('stroke-dasharray', `${pathLength} ${pathLength}`)
    }
    */
    let streakPath: d3.Selection<SVGPathElement, any, any, any> | null = null

    // Lesson completion stars
    const starPositions = []
    const starRadius = maxRadius * 1.1
    for (let i = 0; i < completedLessons; i++) {
      // Distribute stars in a spiral pattern
      const angle = i * 2.4 // Golden angle for natural distribution
      const radiusVariation = 0.8 + (i % 3) * 0.1 // Vary radius slightly
      const x = centerX + Math.cos(angle) * starRadius * radiusVariation
      const y = centerY + Math.sin(angle) * starRadius * radiusVariation
      starPositions.push({ x, y, delay: i * 50 })
    }

    // Create lesson stars with sparkle effect
    const stars = mainGroup.selectAll('.lesson-star')
      .data(starPositions.slice(0, Math.min(completedLessons, 20))) // Limit to 20 stars for performance
      .enter()
      .append('g')
      .attr('class', 'lesson-star')
      .attr('transform', d => `translate(${d.x}, ${d.y})`)

    // Star shape path (smaller and less prominent)
    const starPath = 'M0,-4 L1.2,-1.2 L4,0 L1.2,1.2 L0,4 L-1.2,1.2 L-4,0 L-1.2,-1.2 Z'

    stars.append('path')
      .attr('d', starPath)
      .attr('fill', '#7A8471')
      .attr('opacity', 0.3) // Much less prominent
      .attr('filter', 'drop-shadow(0 0 2px rgba(122, 132, 113, 0.3))')
      .attr('transform', 'scale(0)')
      .transition()
      .delay(d => 1000 + d.delay)
      .duration(500)
      .ease(d3.easeBackOut.overshoot(1.5))
      .attr('transform', 'scale(1)')

    // Add sparkle animation to stars
    stars.selectAll('path')
      .transition()
      .delay(d => 2000 + d.delay)
      .duration(2000)
      .ease(d3.easeLinear)
      .attr('transform', 'scale(1) rotate(360deg)')
      .on('end', function() {
        // Continuous gentle sparkle
        d3.select(this)
          .transition()
          .duration(4000)
          .ease(d3.easeLinear)
          .attr('opacity', 0.1)
          .transition()
          .duration(4000)
          .ease(d3.easeLinear)
          .attr('opacity', 0.3)
          .on('end', function repeat() {
            d3.select(this)
              .transition()
              .duration(4000 + Math.random() * 2000)
              .ease(d3.easeLinear)
              .attr('opacity', 0.1)
              .transition()
              .duration(4000 + Math.random() * 2000)
              .ease(d3.easeLinear)
              .attr('opacity', 0.3)
              .on('end', repeat)
          })
      })

    // Add interactivity
    const addTooltipEvents = (element: d3.Selection<any, any, any, any>, title: string, content: string) => {
      element
        .style('cursor', 'pointer')
        .on('mouseenter touchstart', (event) => {
          const [x, y] = d3.pointer(event, svg.node())
          setTooltip({
            visible: true,
            x: x + 10,
            y: y - 10,
            title,
            content
          })
        })
        .on('mouseleave touchend', () => {
          setTooltip(prev => ({ ...prev, visible: false }))
        })
    }

    // Add tooltips to chart elements
    const remainingXp = nextLevelXp - xp
    addTooltipEvents(xpSun, 'Experience Points', `${xp.toLocaleString()} XP • ${remainingXp.toLocaleString()} XP to Level ${level + 1}`)
    addTooltipEvents(levelRingProgress, 'Level Progress', `Level ${level} • ${Math.round(levelProgress)}% to next`)
    addTooltipEvents(stars, 'Completed Lessons', `${completedLessons} lesson${completedLessons > 1 ? 's' : ''} completed`)

    // Initialize particles
    particlesRef.current = []

    // Start particle animation loop
    const animateParticles = () => {
      // Generate new particles occasionally
      if (Math.random() < 0.1) {
        const particle: ParticleData = {
          id: Math.random().toString(),
          x: Math.random() * width,
          y: height + 10,
          radius: 1 + Math.random() * 2,
          color: Math.random() < 0.7 ? '#F5F1E8' : '#E6A853',
          type: Math.random() < 0.8 ? 'sand' : 'spark',
          velocity: { x: (Math.random() - 0.5) * 0.5, y: -0.5 - Math.random() * 0.5 },
          life: 0,
          maxLife: 300 + Math.random() * 200
        }
        particlesRef.current.push(particle)
      }

      // Update particles
      particlesRef.current = particlesRef.current.filter(particle => {
        particle.x += particle.velocity.x
        particle.y += particle.velocity.y
        particle.life++

        // Remove particles that are too old or off screen
        return particle.life < particle.maxLife && particle.y > -10
      })

      // Render particles
      const particleSelection = svg.selectAll('.particle')
        .data(particlesRef.current, (d: any) => d.id)

      particleSelection.enter()
        .append('circle')
        .attr('class', 'particle')
        .attr('r', (d: any) => d.radius)
        .attr('fill', (d: any) => d.color)
        .attr('opacity', 0.6)

      particleSelection
        .attr('cx', (d: any) => d.x)
        .attr('cy', (d: any) => d.y)
        .attr('opacity', (d: any) => Math.max(0, 0.6 * (1 - d.life / d.maxLife)))

      particleSelection.exit().remove()

      animationFrameRef.current = requestAnimationFrame(animateParticles)
    }

    // Start particle animation
    setTimeout(animateParticles, 2000) // Start after main animations

    // Cleanup function
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [xp, streak, level, completedLessons])

  return (
    <div className="relative h-full w-full">
      <svg
        ref={svgRef}
        className="w-full h-full"
        style={{ background: 'transparent' }}
      />

      {/* Tooltip */}
      {tooltip.visible && (
        <motion.div
          className="absolute z-10 bg-sepia-800 text-white px-3 py-2 rounded-lg text-sm shadow-lg pointer-events-none"
          style={{
            left: tooltip.x,
            top: tooltip.y,
            transform: 'translate(-50%, -100%)'
          }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.2 }}
        >
          <div className="font-medium text-sunset-gold">{tooltip.title}</div>
          <div className="text-sepia-200">{tooltip.content}</div>
        </motion.div>
      )}
    </div>
  )
}