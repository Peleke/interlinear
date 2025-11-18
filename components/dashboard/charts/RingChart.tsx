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

interface TooltipData {
  visible: boolean
  x: number
  y: number
  content: string
  title: string
}

export default function RingChart({ xp, streak, level, completedLessons }: StatsData) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [tooltip, setTooltip] = useState<TooltipData>({
    visible: false,
    x: 0,
    y: 0,
    content: '',
    title: ''
  })

  // Calculate level progress and ring data
  const LEVEL_THRESHOLDS = [0, 100, 250, 500, 1000, 2000, 3500, 5500, 8000, 11000]
  const currentLevelXp = LEVEL_THRESHOLDS[level - 1] || 0
  const nextLevelXp = LEVEL_THRESHOLDS[level] || currentLevelXp + 1000
  const levelProgress = ((xp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100


  // Define ring segments for different stats
  const ringData = [
    {
      label: 'XP Progress',
      value: Math.min(levelProgress, 100), // Cap at 100% for now
      max: 100,
      color: '#E6A853',
      startAngle: 0,
      endAngle: 120,
      radius: 0.85,
      width: 18,
      icon: '⭐'
    },
    {
      label: 'Streak',
      value: Math.min((streak / 30) * 100, 100), // Max 30 days for full ring
      max: 30,
      color: '#B85450',
      startAngle: 120,
      endAngle: 240,
      radius: 0.85,
      width: 18,
      icon: '🔥'
    },
    {
      label: 'Level',
      value: (level / 10) * 100, // Max level 10
      max: 10,
      color: '#6B4E7D',
      startAngle: 240,
      endAngle: 360,
      radius: 0.85,
      width: 18,
      icon: '👑'
    }
  ]

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
    const maxRadius = Math.min(width, height) * 0.4

    svg.attr('width', width).attr('height', height)
    svg.selectAll('*').remove()

    // Create gradient definitions
    const defs = svg.append('defs')

    ringData.forEach((ring, index) => {
      const gradient = defs.append('linearGradient')
        .attr('id', `ringGradient${index}`)
        .attr('x1', '0%')
        .attr('y1', '0%')
        .attr('x2', '100%')
        .attr('y2', '100%')

      gradient.append('stop')
        .attr('offset', '0%')
        .attr('stop-color', ring.color)
        .attr('stop-opacity', '1')

      gradient.append('stop')
        .attr('offset', '100%')
        .attr('stop-color', ring.color)
        .attr('stop-opacity', '0.6')
    })

    const mainGroup = svg.append('g')

    // Create arc generator
    const arc = d3.arc()
      .innerRadius((d: any) => maxRadius * d.radius - d.width / 2)
      .outerRadius((d: any) => maxRadius * d.radius + d.width / 2)
      .startAngle((d: any) => (d.startAngle * Math.PI) / 180)
      .endAngle((d: any) => {
        const progressAngle = d.startAngle + ((d.endAngle - d.startAngle) * d.value) / 100
        return (progressAngle * Math.PI) / 180
      })

    // Background rings
    ringData.forEach((ring, index) => {
      const bgArc = d3.arc()
        .innerRadius(maxRadius * ring.radius - ring.width / 2)
        .outerRadius(maxRadius * ring.radius + ring.width / 2)
        .startAngle((ring.startAngle * Math.PI) / 180)
        .endAngle((ring.endAngle * Math.PI) / 180)

      mainGroup.append('path')
        .datum(ring)
        .attr('d', bgArc)
        .attr('fill', '#D4C4A8')
        .attr('opacity', 0.2)
        .attr('transform', `translate(${centerX}, ${centerY})`)
    })

    // Progress rings
    ringData.forEach((ring, index) => {
      const progressRing = mainGroup.append('path')
        .datum(ring)
        .attr('d', arc)
        .attr('fill', `url(#ringGradient${index})`)
        .attr('filter', `drop-shadow(0 0 8px ${ring.color}80)`)
        .attr('transform', `translate(${centerX}, ${centerY})`)
        .style('cursor', 'pointer')

      // Animate rings
      const fullArc = d3.arc()
        .innerRadius(maxRadius * ring.radius - ring.width / 2)
        .outerRadius(maxRadius * ring.radius + ring.width / 2)
        .startAngle((ring.startAngle * Math.PI) / 180)
        .endAngle((ring.startAngle * Math.PI) / 180)

      progressRing
        .attr('d', fullArc)
        .transition()
        .duration(1500)
        .delay(index * 200)
        .ease(d3.easeExpOut)
        .attr('d', arc)

      // Add interactivity
      progressRing
        .on('mouseenter touchstart', (event) => {
          const [x, y] = d3.pointer(event, svg.node())
          setTooltip({
            visible: true,
            x: x + 10,
            y: y - 10,
            title: ring.label,
            content: `${Math.round(ring.value)}%`
          })
        })
        .on('mouseleave touchend', () => {
          setTooltip(prev => ({ ...prev, visible: false }))
        })

      // Add ring labels
      const labelAngle = (ring.startAngle + ring.endAngle) / 2
      const labelRadius = maxRadius * ring.radius * 1.15
      const labelX = centerX + Math.cos((labelAngle * Math.PI) / 180) * labelRadius
      const labelY = centerY + Math.sin((labelAngle * Math.PI) / 180) * labelRadius

      const label = mainGroup.append('g')
        .attr('transform', `translate(${labelX}, ${labelY})`)

      // Icon
      label.append('text')
        .attr('text-anchor', 'middle')
        .attr('font-size', '16')
        .attr('y', -8)
        .text(ring.icon)

      // Label text
      label.append('text')
        .attr('text-anchor', 'middle')
        .attr('font-size', '10')
        .attr('font-weight', 'bold')
        .attr('fill', '#574634')
        .attr('y', 12)
        .text(ring.label)

      // Animate labels
      label
        .attr('opacity', 0)
        .transition()
        .duration(500)
        .delay(1000 + index * 100)
        .attr('opacity', 1)
    })

    // Center circle with level
    const centerCircle = mainGroup.append('circle')
      .attr('cx', centerX)
      .attr('cy', centerY)
      .attr('r', 0)
      .attr('fill', '#E6A853')
      .attr('filter', 'drop-shadow(0 0 10px rgba(230, 168, 83, 0.6))')

    centerCircle
      .transition()
      .duration(1000)
      .delay(800)
      .ease(d3.easeElasticOut)
      .attr('r', maxRadius * 0.2)

    // XP text (primary)
    const xpText = mainGroup.append('text')
      .attr('x', centerX)
      .attr('y', centerY - 8)
      .attr('text-anchor', 'middle')
      .attr('font-size', '20')
      .attr('font-weight', 'bold')
      .attr('fill', '#2B221B')
      .text('0')

    // XP label
    const xpLabel = mainGroup.append('text')
      .attr('x', centerX)
      .attr('y', centerY + 12)
      .attr('text-anchor', 'middle')
      .attr('font-size', '11')
      .attr('font-weight', '600')
      .attr('fill', '#F5F1E8')
      .text('XP')

    // Level text (secondary)
    const levelText = mainGroup.append('text')
      .attr('x', centerX)
      .attr('y', centerY + 20)
      .attr('text-anchor', 'middle')
      .attr('font-size', '12')
      .attr('font-weight', '600')
      .attr('fill', '#8B7355')
      .text(`LVL ${level}`)

    // Animate XP counter with counting effect
    xpText
      .attr('opacity', 0)
      .transition()
      .duration(2000)
      .delay(1200)
      .ease(d3.easeExpOut)
      .attr('opacity', 1)
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
      .delay(1300)
      .attr('opacity', 1)

    // Animate level text
    levelText
      .attr('opacity', 0)
      .transition()
      .duration(500)
      .delay(1400)
      .attr('opacity', 1)

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