import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface FeatureCardProps {
  icon: React.ReactNode
  title: string
  description: string
}

export function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <Card className="border-sepia-200 bg-white hover:shadow-lg transition-shadow duration-300">
      <CardHeader>
        <div className="mb-4 text-4xl">{icon}</div>
        <CardTitle className="text-xl font-serif text-ink">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sepia-600 leading-relaxed">{description}</p>
      </CardContent>
    </Card>
  )
}
