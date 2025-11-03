'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'

interface RoleSelectorProps {
  speakers: string[]
  selectedRole: string | null
  onSelectRole: (role: string) => void
}

export function RoleSelector({ speakers, selectedRole, onSelectRole }: RoleSelectorProps) {
  return (
    <Card className="bg-sepia-50 border-sepia-200">
      <CardHeader>
        <CardTitle className="text-sepia-900">Choose Your Character</CardTitle>
      </CardHeader>
      <CardContent>
        <RadioGroup value={selectedRole || ''} onValueChange={onSelectRole}>
          <div className="space-y-3">
            {speakers.map((speaker) => (
              <div key={speaker} className="flex items-center space-x-3">
                <RadioGroupItem
                  value={speaker}
                  id={`role-${speaker}`}
                  className="border-sepia-400 text-sepia-700"
                />
                <Label
                  htmlFor={`role-${speaker}`}
                  className="text-base font-medium text-sepia-900 cursor-pointer flex-1 py-2"
                >
                  {speaker}
                </Label>
              </div>
            ))}
          </div>
        </RadioGroup>
      </CardContent>
    </Card>
  )
}
