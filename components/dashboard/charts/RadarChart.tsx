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

export default function RadarChart({ xp, streak, level, completedLessons }: StatsData) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [tooltip, setTooltip] = useState<TooltipData>({
    visible: false,
    x: 0,
    y: 0,
    content: '',
    title: ''
  })

  // Calculate normalized values (0-100 scale)
  const LEVEL_THRESHOLDS = [0, 100, 250, 500, 1000, 2000, 3500, 5500, 8000, 11000]
  const currentLevelXp = LEVEL_THRESHOLDS[level - 1] || 0
  const nextLevelXp = LEVEL_THRESHOLDS[level] || currentLevelXp + 1000
  const xpProgress = Math.min(((xp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100, 100)

  const radarData = [
    {
      axis: 'XP Progress',
      value: xpProgress,
      max: 100,
      color: '#E6A853',
      icon: '⭐'
    },
    {
      axis: 'Streak',
      value: Math.min((streak / 30) * 100, 100), // Max 30 days
      max: 30,
      color: '#B85450',
      icon: '🔥'
    },
    {
      axis: 'Level',
      value: (level / 10) * 100, // Max level 10
      max: 10,
      color: '#6B4E7D',
      icon: '👑'
    },
    {
      axis: 'Lessons',
      value: Math.min((completedLessons / 20) * 100, 100), // Max 20 lessons
      max: 20,
      color: '#7A8471',
      icon: '📚'
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
    const radius = Math.min(width, height) * 0.35

    svg.attr('width', width).attr('height', height)
    svg.selectAll('*').remove()

    // Create gradient definitions
    const defs = svg.append('defs')

    radarData.forEach((d, i) => {
      const gradient = defs.append('radialGradient')
        .attr('id', `radarGradient${i}`)
        .attr('cx', '50%')
        .attr('cy', '50%')
        .attr('r', '50%')

      gradient.append('stop')
        .attr('offset', '0%')
        .attr('stop-color', d.color)
        .attr('stop-opacity', '0.6')

      gradient.append('stop')
        .attr('offset', '100%')
        .attr('stop-color', d.color)
        .attr('stop-opacity', '0.1')
    })

    const mainGroup = svg.append('g')
      .attr('transform', `translate(${centerX}, ${centerY})`)

    // Number of levels (rings)
    const levels = 5
    const angleSlice = Math.PI * 2 / radarData.length

    // Draw the circular grid lines (levels)
    for (let level = 1; level <= levels; level++) {
      const levelRadius = (radius / levels) * level

      mainGroup.append('circle')
        .attr('r', levelRadius)
        .attr('fill', 'none')
        .attr('stroke', '#D4C4A8')
        .attr('stroke-width', 1)
        .attr('stroke-opacity', 0.3)
    }

    // Draw the axis lines
    radarData.forEach((d, i) => {
      const angle = angleSlice * i - Math.PI / 2
      const lineCoords = {
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius
      }

      mainGroup.append('line')
        .attr('x1', 0)
        .attr('y1', 0)
        .attr('x2', lineCoords.x)
        .attr('y2', lineCoords.y)
        .attr('stroke', '#D4C4A8')
        .attr('stroke-width', 1)
        .attr('stroke-opacity', 0.5)
    })

    // Calculate data points for the radar shape
    const dataPoints = radarData.map((d, i) => {
      const angle = angleSlice * i - Math.PI / 2
      const value = (d.value / 100) * radius
      return {
        x: Math.cos(angle) * value,
        y: Math.sin(angle) * value,
        ...d
      }
    })

    // Create the radar area path
    const radarLine = d3.line()
      .x((d: any) => d.x)
      .y((d: any) => d.y)
      .curve(d3.curveLinearClosed)

    // Background area (full radar)
    const backgroundPoints = radarData.map((d, i) => {
      const angle = angleSlice * i - Math.PI / 2
      return {
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius
      }
    })

    mainGroup.append('path')
      .datum(backgroundPoints)
      .attr('d', radarLine)
      .attr('fill', '#F5F1E8')
      .attr('fill-opacity', 0.1)
      .attr('stroke', 'none')

    // Radar area (actual data)
    const radarArea = mainGroup.append('path')
      .datum(dataPoints)
      .attr('fill', 'url(#radarGradient0)')
      .attr('fill-opacity', 0.4)
      .attr('stroke', '#E6A853')
      .attr('stroke-width', 2)
      .attr('stroke-opacity', 0.8)
      .style('cursor', 'pointer')

    // Animate the radar area
    radarArea
      .attr('d', radarLine(dataPoints.map(d => ({ ...d, x: 0, y: 0 }))))
      .transition()
      .duration(1500)
      .ease(d3.easeElasticOut.amplitude(1).period(0.3))
      .attr('d', radarLine)

    // Add data point circles
    const circles = mainGroup.selectAll('.data-circle')
      .data(dataPoints)
      .enter()
      .append('circle')
      .attr('class', 'data-circle')
      .attr('r', 0)
      .attr('cx', 0)
      .attr('cy', 0)
      .attr('fill', d => d.color)
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')

    // Animate data points
    circles
      .transition()
      .delay(1000)
      .duration(800)
      .ease(d3.easeElasticOut)
      .attr('r', 6)
      .attr('cx', d => d.x)
      .attr('cy', d => d.y)

    // Add axis labels
    radarData.forEach((d, i) => {
      const angle = angleSlice * i - Math.PI / 2
      const labelRadius = radius * 1.15
      const labelCoords = {
        x: Math.cos(angle) * labelRadius,
        y: Math.sin(angle) * labelRadius
      }

      const labelGroup = mainGroup.append('g')
        .attr('transform', `translate(${labelCoords.x}, ${labelCoords.y})`)

      // Icon
      labelGroup.append('text')
        .attr('text-anchor', 'middle')
        .attr('font-size', '14')
        .attr('y', -8)
        .text(d.icon)

      // Label text
      labelGroup.append('text')
        .attr('text-anchor', 'middle')
        .attr('font-size', '10')
        .attr('font-weight', 'bold')
        .attr('fill', '#574634')
        .attr('y', 12)
        .text(d.axis)

      // Animate labels
      labelGroup
        .attr('opacity', 0)
        .transition()
        .delay(1500 + i * 100)
        .duration(500)
        .attr('opacity', 1)
    })

    // Add interactivity
    const addTooltipEvents = (element: d3.Selection<any, any, any, any>, data: any) => {
      element
        .on('mouseenter touchstart', (event) => {
          const [x, y] = d3.pointer(event, svg.node())
          setTooltip({
            visible: true,
            x: x + 10,
            y: y - 10,
            title: data.axis,
            content: `${Math.round(data.value)}%`
          })
        })
        .on('mouseleave touchend', () => {
          setTooltip(prev => ({ ...prev, visible: false }))
        })
    }

    // Add tooltips to circles
    circles.each(function(d) {
      addTooltipEvents(d3.select(this), d)
    })

    // Add tooltip to radar area
    addTooltipEvents(radarArea, { axis: 'Overall Progress', value: dataPoints.reduce((sum, d) => sum + d.value, 0) / dataPoints.length })

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