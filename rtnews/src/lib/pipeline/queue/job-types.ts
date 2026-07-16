// ─── Pipeline Job Types V36 ────────────────────────────────
// V36: Updated stage descriptions to reflect new architecture.
// 'content_loaded' is now a no-op (no more URL content loading).
// The Translator agent WRITES content from scratch using AI.

// V244: Added 'skipped' and 'rejected' to ProcessingStage type.
// 'skipped' and 'rejected' are terminal states — articles in these stages
// need to be reset back to 'fetched' for reprocessing. They are NOT part
// of the sequential STAGE_ORDER but are recognized stages for reset logic.
export type ProcessingStage = 'fetched' | 'content_loaded' | 'translated' | 'analyzed' | 'imaged' | 'skipped' | 'rejected';

export const STAGE_ORDER: ProcessingStage[] = [
  'fetched',
  'content_loaded',
  'translated',
  'analyzed',
  'imaged',
];

// V244: Terminal stages that can be reset back to 'fetched' for reprocessing.
// Articles in these stages are stuck and will never advance on their own.
export const RESETTABLE_STAGES: ProcessingStage[] = [
  'skipped',
  'rejected',
];

export type JobType = 'advance' | 'write_content' | 'analyze' | 'image' | 'publish';

export interface StageAction {
  stage: ProcessingStage;
  jobType: JobType;
  description: string;
}

// Maps each stage to the action needed to advance to the next stage
export const STAGE_ACTIONS: StageAction[] = [
  { stage: 'fetched', jobType: 'advance', description: 'Advance to content_loaded (no URL loading in V36)' },
  { stage: 'content_loaded', jobType: 'write_content', description: 'AI-writes Arabic article from title+summary' },
  { stage: 'translated', jobType: 'analyze', description: 'Generate mandatory AI financial analysis in Arabic' },
  { stage: 'analyzed', jobType: 'image', description: 'Generate AI illustrative image' },
  { stage: 'imaged', jobType: 'publish', description: 'Final validation and set isReady=true (irreversible)' },
];

// Determine the next action for an article based on its current processing stage
export function determineNextAction(currentStage: ProcessingStage | null): StageAction | null {
  const stage = currentStage || 'fetched';
  const action = STAGE_ACTIONS.find(a => a.stage === stage);
  return action || null;
}

// Get the next stage after the current one
export function getNextStage(currentStage: ProcessingStage): ProcessingStage | null {
  const idx = STAGE_ORDER.indexOf(currentStage);
  if (idx < 0 || idx >= STAGE_ORDER.length - 1) return null;
  return STAGE_ORDER[idx + 1];
}
