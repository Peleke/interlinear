"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Loader2, Sparkles, CheckCircle2, Circle, Clock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

// Language configuration for dynamic translation options
const LANGUAGE_CONFIG = {
  'es': { name: 'Spanish', flag: '🇪🇸', displayCode: 'ES' },
  'la': { name: 'Latin', flag: '🏛️', displayCode: 'LA' },
  'en': { name: 'English', flag: '🇺🇸', displayCode: 'EN' }
} as const;

type LanguageCode = keyof typeof LANGUAGE_CONFIG;

interface GeneratorConfig {
  enabled: boolean;
  config: {
    // Vocabulary
    cefrLevel?: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
    maxVocabItems?: number;

    // Grammar
    maxConcepts?: number;

    // Exercises
    exerciseTypes?: ("fill_blank" | "multiple_choice" | "translation")[];
    exercisesPerType?: number;
    translationDirection?: "es_to_en" | "en_to_es" | "both";

    // Dialogs
    dialogCount?: number;
    dialogComplexity?: "simple" | "intermediate" | "advanced";
  };
}

interface GeneratorStatus {
  name: string;
  status: "pending" | "processing" | "completed" | "failed";
  count?: number;
  duration?: number;
  error?: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  readingId: string;
  readingTitle: string;
  readingLevel?: string;
  lessonId: string;
  language: "es" | "la";
}

export function GenerateLessonModal({
  open,
  onOpenChange,
  readingId,
  readingTitle,
  readingLevel,
  lessonId,
  language,
}: Props) {
  const [isGenerating, setIsGenerating] = useState(false);

  // Compute dynamic translation direction options based on language
  const sourceLanguageConfig = LANGUAGE_CONFIG[language as LanguageCode] || LANGUAGE_CONFIG['es'];
  const targetLanguageConfig = LANGUAGE_CONFIG['en'];

  const getTranslationDirectionOptions = () => {
    const sourceCode = sourceLanguageConfig.displayCode;
    const targetCode = targetLanguageConfig.displayCode;
    const sourceToTarget = `${language}_to_en` as const;
    const targetToSource = `en_to_${language}` as const;

    return {
      sourceToTarget: { value: sourceToTarget, label: `${sourceCode} → ${targetCode}` },
      targetToSource: { value: targetToSource, label: `${targetCode} → ${sourceCode}` },
    };
  };

  const translationOptions = getTranslationDirectionOptions();
  const [generatorStatuses, setGeneratorStatuses] = useState<GeneratorStatus[]>([]);
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [userDismissed, setUserDismissed] = useState(false);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Generator configurations
  const [vocabularyConfig, setVocabularyConfig] = useState<GeneratorConfig>({
    enabled: true,
    config: {
      cefrLevel: (readingLevel as any) || "A1",
      maxVocabItems: 20,
    },
  });

  const [grammarConfig, setGrammarConfig] = useState<GeneratorConfig>({
    enabled: true,
    config: {
      maxConcepts: 5,
    },
  });

  const [exercisesConfig, setExercisesConfig] = useState<GeneratorConfig>({
    enabled: true,
    config: {
      exerciseTypes: ["fill_blank", "multiple_choice", "translation"],
      exercisesPerType: 3,
      translationDirection: translationOptions.sourceToTarget.value,
    },
  });

  const [dialogsConfig, setDialogsConfig] = useState<GeneratorConfig>({
    enabled: true,
    config: {
      dialogCount: 2,
      dialogComplexity: "intermediate",
    },
  });

  // Cleanup polling on unmount or modal close
  useEffect(() => {
    if (!open) {
      // If user dismissed manually, keep polling in background
      if (userDismissed) {
        console.log('[Cleanup] Modal closed by user dismiss - keeping background polling active')
        setIsGenerating(false); // Hide UI state but keep polling
        return; // Don't stop polling
      }

      // Otherwise, modal was closed normally - clean up everything
      stopPolling();
      setCurrentJobId(null);
      setGeneratorStatuses([]);
      setIsGenerating(false);
    } else {
      // Modal opened - reset dismiss flag
      setUserDismissed(false);
    }
    return () => stopPolling(); // Always cleanup on unmount
  }, [open, userDismissed]);

  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  };

  const pollJobStatus = async (jobId: string) => {
    try {
      console.log(`[Poll ENTRY] Starting poll for job ${jobId}`)
      const response = await fetch(`/api/generation-jobs/${jobId}`);
      console.log(`[Poll RESPONSE] Got response with status: ${response.status}`)

      if (!response.ok) {
        console.log(`[Poll] Failed to fetch job ${jobId}: ${response.status}`);
        return;
      }

      const job = await response.json();
      console.log(`[Poll] Job ${jobId} status: ${job.status}`, {
        progress: job.progress,
        hasResults: !!job.results,
      });

      // AGGRESSIVE DEBUG
      if (job.status === 'processing') {
        console.log(`[Poll AGGRESSIVE] Job still processing, progress:`, job.progress)
      }

      // Update statuses from progress
      const statuses: GeneratorStatus[] = [];
      const progress = job.progress || {};
      const results = job.results || {};

      if (vocabularyConfig.enabled) {
        statuses.push({
          name: "Vocabulary",
          status: progress.vocabulary?.status || "pending",
          count: progress.vocabulary?.count || results.vocabulary?.count,
          duration: results.vocabulary?.executionTime,
          error: progress.vocabulary?.error,
        });
      }

      if (grammarConfig.enabled) {
        statuses.push({
          name: "Grammar",
          status: progress.grammar?.status || "pending",
          count: progress.grammar?.count || results.grammar?.count,
          duration: results.grammar?.executionTime,
          error: progress.grammar?.error,
        });
      }

      if (exercisesConfig.enabled) {
        statuses.push({
          name: "Exercises",
          status: progress.exercises?.status || "pending",
          count: progress.exercises?.count || results.exercises?.count,
          duration: results.exercises?.executionTime,
          error: progress.exercises?.error,
        });
      }

      if (dialogsConfig.enabled) {
        statuses.push({
          name: "Dialogs",
          status: progress.dialogs?.status || "pending",
          count: progress.dialogs?.count || results.dialogs?.count,
          duration: results.dialogs?.executionTime,
          error: progress.dialogs?.error,
        });
      }

      setGeneratorStatuses(statuses);

      // If job is complete or failed, stop polling
      if (job.status === "completed" || job.status === "failed") {
        console.log(`[Poll] Job ${jobId} finished with status: ${job.status}`);
        stopPolling();

        // Check if any generators actually failed
        const anyFailed = statuses.some(s => s.status === 'failed');

        // If completed successfully AND no failed generators, wait 2 seconds then close and refresh
        if (job.status === "completed" && !anyFailed) {
          if (userDismissed) {
            console.log(`[Poll] Job completed in background - user dismissed, not refreshing page`);
            stopPolling(); // Clean up polling since job is done
          } else {
            console.log(`[Poll] All generators succeeded, will close and refresh`);
            setTimeout(() => {
              onOpenChange(false);
              setIsGenerating(false);
              setGeneratorStatuses([]);
              setCurrentJobId(null);
              // Trigger a page refresh to show new content
              window.location.reload();
            }, 2000);
          }
        } else {
          // Failed or had errors - keep modal open to show errors
          console.log(`[Poll] Job had failures, keeping modal open`, { anyFailed, jobStatus: job.status });
          setIsGenerating(false);
        }
      }
    } catch (error) {
      console.error("[Poll] Polling error:", error);
      // Continue polling on transient errors
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setGeneratorStatuses([]);

    const generators = {
      vocabulary: vocabularyConfig.enabled ? vocabularyConfig : null,
      grammar: grammarConfig.enabled ? grammarConfig : null,
      exercises: exercisesConfig.enabled ? exercisesConfig : null,
      dialogs: dialogsConfig.enabled ? dialogsConfig : null,
    };

    try {
      const response = await fetch(`/api/lessons/${lessonId}/generate-from-reading`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          readingId,
          generators,
        }),
      });

      if (!response.ok) {
        throw new Error("Generation failed");
      }

      const result = await response.json();
      console.log('[Generate] Generation response:', result);

      // Store job ID and start polling
      if (result.jobId) {
        console.log(`[Generate] Job created: ${result.jobId}, starting polling...`);
        setCurrentJobId(result.jobId);

        // Start polling every 2 seconds
        pollingIntervalRef.current = setInterval(() => {
          console.log(`[Poll Debug] Calling pollJobStatus with jobId: ${result.jobId}`);
          pollJobStatus(result.jobId);
        }, 2000);

        // Poll immediately
        pollJobStatus(result.jobId);
      } else {
        console.error("[Generate] No jobId returned from API");
        setGeneratorStatuses([
          {
            name: "Generation",
            status: "failed",
            error: "No job ID returned",
          },
        ]);
        setIsGenerating(false);
      }
    } catch (error) {
      console.error("Generation error:", error);
      setGeneratorStatuses([
        {
          name: "Generation",
          status: "failed",
          error: error instanceof Error ? error.message : "Unknown error",
        },
      ]);
      setIsGenerating(false);
    }
  };

  const renderStatusIcon = (status: GeneratorStatus["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "processing":
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case "failed":
        return <Circle className="h-4 w-4 text-red-500" />;
      default:
        return <Circle className="h-4 w-4 text-gray-300" />;
    }
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return "";
    return `${(ms / 1000).toFixed(1)}s`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-yellow-500" />
            Generate Lesson from Reading
          </DialogTitle>
          <DialogDescription>
            Reading: <span className="font-medium">{readingTitle}</span>
            {readingLevel && <span className="ml-2 text-xs">({readingLevel} Level)</span>}
          </DialogDescription>
        </DialogHeader>

        {isGenerating ? (
          // Progress View
          <div className="space-y-4 py-4">
            <div className="text-center text-sm text-muted-foreground mb-6">
              Generating lesson content... This may take a few minutes.
            </div>

            <div className="text-center mb-6">
              <Button
                variant="default"
                size="lg"
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-2.5 rounded-lg font-medium"
                onClick={() => {
                  console.log('[Dismiss] User dismissed generation modal - continuing background polling')
                  setUserDismissed(true)
                  setIsGenerating(false)
                  onOpenChange(false)
                }}
              >
                Dismiss & Continue Working
              </Button>
            </div>

            <div className="space-y-3">
              {generatorStatuses.map((status) => (
                <div
                  key={status.name}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {renderStatusIcon(status.status)}
                    <div>
                      <div className="font-medium text-sm">{status.name}</div>
                      {status.count !== undefined && (
                        <div className="text-xs text-muted-foreground">
                          {status.count} items generated
                        </div>
                      )}
                      {status.error && (
                        <div className="text-xs text-red-500">{status.error}</div>
                      )}
                    </div>
                  </div>
                  {status.duration && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {formatDuration(status.duration)}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {generatorStatuses.length > 0 &&
             generatorStatuses.every((s) => s.status === "completed") &&
             !isGenerating && (
              <div className="text-center text-sm text-green-600 font-medium pt-4">
                ✓ All content generated successfully! Closing...
              </div>
            )}

            {generatorStatuses.some((s) => s.status === "failed") && (
              <div className="text-center text-sm text-red-600 font-medium pt-4">
                ⚠ Some generators failed. Check errors above.
              </div>
            )}
          </div>
        ) : (
          // Configuration View
          <div className="space-y-6 py-4">
            {/* Vocabulary */}
            <Card className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={vocabularyConfig.enabled}
                    onCheckedChange={(checked) =>
                      setVocabularyConfig({ ...vocabularyConfig, enabled: !!checked })
                    }
                  />
                  <Label className="font-semibold">Vocabulary Extraction</Label>
                </div>
              </div>
              {vocabularyConfig.enabled && (
                <div className="space-y-3 ml-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm">CEFR Level</Label>
                      <Select
                        value={vocabularyConfig.config.cefrLevel}
                        onValueChange={(value) =>
                          setVocabularyConfig({
                            ...vocabularyConfig,
                            config: { ...vocabularyConfig.config, cefrLevel: value as any },
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="A1">A1</SelectItem>
                          <SelectItem value="A2">A2</SelectItem>
                          <SelectItem value="B1">B1</SelectItem>
                          <SelectItem value="B2">B2</SelectItem>
                          <SelectItem value="C1">C1</SelectItem>
                          <SelectItem value="C2">C2</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-sm">Max Items</Label>
                      <Input
                        type="number"
                        value={vocabularyConfig.config.maxVocabItems}
                        onChange={(e) =>
                          setVocabularyConfig({
                            ...vocabularyConfig,
                            config: {
                              ...vocabularyConfig.config,
                              maxVocabItems: parseInt(e.target.value),
                            },
                          })
                        }
                        min={1}
                        max={50}
                      />
                    </div>
                  </div>
                </div>
              )}
            </Card>

            {/* Grammar */}
            <Card className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={grammarConfig.enabled}
                    onCheckedChange={(checked) =>
                      setGrammarConfig({ ...grammarConfig, enabled: !!checked })
                    }
                  />
                  <Label className="font-semibold">Grammar Concepts</Label>
                </div>
              </div>
              {grammarConfig.enabled && (
                <div className="ml-6">
                  <Label className="text-sm">Max Concepts</Label>
                  <Input
                    type="number"
                    value={grammarConfig.config.maxConcepts}
                    onChange={(e) =>
                      setGrammarConfig({
                        ...grammarConfig,
                        config: {
                          ...grammarConfig.config,
                          maxConcepts: parseInt(e.target.value),
                        },
                      })
                    }
                    min={1}
                    max={20}
                  />
                </div>
              )}
            </Card>

            {/* Exercises */}
            <Card className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={exercisesConfig.enabled}
                    onCheckedChange={(checked) =>
                      setExercisesConfig({ ...exercisesConfig, enabled: !!checked })
                    }
                  />
                  <Label className="font-semibold">Exercise Generation</Label>
                </div>
              </div>
              {exercisesConfig.enabled && (
                <div className="space-y-3 ml-6">
                  <div>
                    <Label className="text-sm mb-2 block">Exercise Types</Label>
                    <div className="space-y-2">
                      {(["fill_blank", "multiple_choice", "translation"] as const).map((type) => (
                        <div key={type} className="flex items-center gap-2">
                          <Checkbox
                            checked={exercisesConfig.config.exerciseTypes?.includes(type)}
                            onCheckedChange={(checked) => {
                              const current = exercisesConfig.config.exerciseTypes || [];
                              const updated = checked
                                ? [...current, type]
                                : current.filter((t) => t !== type);
                              setExercisesConfig({
                                ...exercisesConfig,
                                config: { ...exercisesConfig.config, exerciseTypes: updated },
                              });
                            }}
                          />
                          <Label className="text-sm">
                            {type === "fill_blank"
                              ? "Fill in the Blank"
                              : type === "multiple_choice"
                              ? "Multiple Choice"
                              : "Translation"}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm">Per Type</Label>
                      <Input
                        type="number"
                        value={exercisesConfig.config.exercisesPerType}
                        onChange={(e) =>
                          setExercisesConfig({
                            ...exercisesConfig,
                            config: {
                              ...exercisesConfig.config,
                              exercisesPerType: parseInt(e.target.value),
                            },
                          })
                        }
                        min={1}
                        max={10}
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Translation Direction</Label>
                      <Select
                        value={exercisesConfig.config.translationDirection}
                        onValueChange={(value) =>
                          setExercisesConfig({
                            ...exercisesConfig,
                            config: {
                              ...exercisesConfig.config,
                              translationDirection: value as any,
                            },
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={translationOptions.sourceToTarget.value}>
                            {translationOptions.sourceToTarget.label}
                          </SelectItem>
                          <SelectItem value={translationOptions.targetToSource.value}>
                            {translationOptions.targetToSource.label}
                          </SelectItem>
                          <SelectItem value="both">Both</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}
            </Card>

            {/* Dialogs */}
            <Card className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={dialogsConfig.enabled}
                    onCheckedChange={(checked) =>
                      setDialogsConfig({ ...dialogsConfig, enabled: !!checked })
                    }
                  />
                  <Label className="font-semibold">Dialog Generation</Label>
                </div>
              </div>
              {dialogsConfig.enabled && (
                <div className="space-y-3 ml-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm">Dialog Count</Label>
                      <Input
                        type="number"
                        value={dialogsConfig.config.dialogCount}
                        onChange={(e) =>
                          setDialogsConfig({
                            ...dialogsConfig,
                            config: {
                              ...dialogsConfig.config,
                              dialogCount: parseInt(e.target.value),
                            },
                          })
                        }
                        min={1}
                        max={5}
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Complexity</Label>
                      <Select
                        value={dialogsConfig.config.dialogComplexity}
                        onValueChange={(value) =>
                          setDialogsConfig({
                            ...dialogsConfig,
                            config: {
                              ...dialogsConfig.config,
                              dialogComplexity: value as any,
                            },
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="simple">Simple</SelectItem>
                          <SelectItem value="intermediate">Intermediate</SelectItem>
                          <SelectItem value="advanced">Advanced</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          </div>
        )}

        <DialogFooter>
          {!isGenerating && (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleGenerate}
                disabled={
                  !vocabularyConfig.enabled &&
                  !grammarConfig.enabled &&
                  !exercisesConfig.enabled &&
                  !dialogsConfig.enabled
                }
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Lesson Content
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
