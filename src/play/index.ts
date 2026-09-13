// Origin: London src/play/index.ts, adapted: only what this app has so far.

export {
  ANALYSIS_MOVETIME,
  HINT_MOVETIME,
  analysisProfile,
  atAnalysisProfile,
  isAnalysisProfile,
} from './analysis'
export {
  evalBarLayout,
  evalShare,
  evalText,
  evaluationOf,
  numberPlacement,
  shownEvaluation,
  type EvalBarLayout,
  type Evaluation,
  type NumberPlacement,
} from './evalbar'
export { gameToPgn, pgnDate, pgnResult, saveFileName, type GameForPgn } from './game-pgn'
export { engineHint, type Hint } from './hint'
export { levelOrNull } from './level'
export { loadPgn, type LoadResult, type LoadedGame } from './load-pgn'
export { endingFromMoves, isCheckmateOutcome, outcomeOf } from './outcome'
export {
  canReplayMoves,
  clampPly,
  moveAtPly,
  plyAfterMove,
  plyBeforeMove,
  positionAtPly,
} from './replay'
export {
  SLIP_THRESHOLDS,
  buildReport,
  describeSlip,
  numberedMove,
  scanForSlips,
  stoppedAt,
  verdictBand,
  verdictInWords,
  type BestMoves,
  type Evaluations,
  type GameReport,
  type MoveReview,
  type MoveTag,
} from './report'
export { scanGame } from './scan'
export {
  PlaySession,
  fullMove,
  type PlayedMove,
  type SessionOptions,
  type SessionStatus,
} from './session'
