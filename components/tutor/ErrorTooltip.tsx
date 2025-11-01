'use client'

import { X, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog'

interface ErrorAnalysis {
  turn: number
  errorText: string
  correction: string
  explanation: string
}

interface ErrorTooltipProps {
  error: ErrorAnalysis
  onClose: () => void
  onSave: () => void
}

export function ErrorTooltip({ error, onClose, onSave }: ErrorTooltipProps) {
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-sepia-900">Error Analysis</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Your Error */}
          <div className="space-y-2">
            <h4 className="font-semibold text-red-700">Tu error:</h4>
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-900 font-medium">{error.errorText}</p>
            </div>
          </div>

          {/* Correction */}
          <div className="space-y-2">
            <h4 className="font-semibold text-green-700">Corrección:</h4>
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-green-900 font-medium">{error.correction}</p>
            </div>
          </div>

          {/* Explanation */}
          <div className="space-y-2">
            <h4 className="font-semibold text-sepia-700">Explicación:</h4>
            <div className="bg-sepia-50 border border-sepia-200 rounded-lg p-3">
              <p className="text-sepia-900 leading-relaxed">
                {error.explanation}
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            <X className="mr-2 h-4 w-4" />
            Cerrar
          </Button>
          <Button onClick={() => { onSave(); onClose(); }}>
            <Save className="mr-2 h-4 w-4" />
            Guardar como flashcard
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
