'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'

interface LevelSelectorProps {
  selectedLevel: CEFRLevel | null
  onSelectLevel: (level: CEFRLevel) => void
}

const LEVELS: Array<{
  level: CEFRLevel
  label: string
  description: string
}> = [
  {
    level: 'A1',
    label: 'A1 - Beginner',
    description: 'Basic phrases, simple questions'
  },
  {
    level: 'A2',
    label: 'A2 - Elementary',
    description: 'Common expressions, simple conversations'
  },
  {
    level: 'B1',
    label: 'B1 - Intermediate',
    description: 'Familiar topics, personal interests'
  },
  {
    level: 'B2',
    label: 'B2 - Upper Intermediate',
    description: 'Complex topics, detailed explanations'
  },
  {
    level: 'C1',
    label: 'C1 - Advanced',
    description: 'Nuanced discussions, abstract concepts'
  },
  {
    level: 'C2',
    label: 'C2 - Proficient',
    description: 'Near-native fluency, all contexts'
  }
]

export function LevelSelector({ selectedLevel, onSelectLevel }: LevelSelectorProps) {
  return (
    <Card className="bg-sepia-50 border-sepia-200">
      <CardHeader>
        <CardTitle className="text-sepia-900">Select Your Level</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {LEVELS.map(({ level, label, description }) => (
            <Button
              key={level}
              variant={selectedLevel === level ? 'default' : 'outline'}
              className={`h-auto flex-col items-start p-4 ${
                selectedLevel === level
                  ? 'bg-sepia-700 text-white border-sepia-700'
                  : 'border-sepia-300 hover:bg-sepia-100'
              }`}
              onClick={() => onSelectLevel(level)}
            >
              <span className="font-semibold text-base mb-1">{label}</span>
              <span className="text-xs font-normal opacity-80">
                {description}
              </span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
