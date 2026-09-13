import { Chess } from 'chess.js'
import { chooseCandidate, splitMove, type Engine, type StrengthProfile } from '../engine'
import { outcomeOf } from './outcome'
import type { Colour } from '../model/types'

/**
 * Origin: London src/play/session.ts, adapted: the engine plays every reply, with no length cap; the user's colour is an option; setProfile is new; replayed moves are not a floor; PlayedMove and fullMove come from London src/play/report.ts, and scanGame has gone to scan.ts.
 * A game of chess against the engine.
 *
 * The user's colour is an option, White unless told otherwise. When the user
 * plays Black the engine opens the game: the session simply starts with the
 * engine to move, and playEngine is the first thing called.
 *
 * The engine is injected rather than built here, so the tests drive a fake and
 * never start a worker.
 *
 * Undo works in PAIRS, not plies. Taking back one ply would leave the engine
 * to move with nothing to make it move, so the game would sit there. So undo
 * goes back to the last position where the user was to move, which is the
 * engine's reply and the move before it in the ordinary case, and one move
 * when the game has just ended on the user's own move.
 *
 * It goes all the way back to the first move, including through the moves the
 * game was given when it started. The trainer treats those as a floor, because
 * there they are an authored line the game was set up on and unplaying them
 * would leave a different exercise. Here they are the game itself: the one
 * arriving from storage or from a PGN file (spec 9.2, spec 10). A floor would
 * mean Undo did nothing at all on a game that had been reopened, which is the
 * same game it was before it was closed.
 *
 * The strength profile is a FIELD rather than a reading of the options,
 * because the level can change in the middle of a game (spec S6). `setProfile`
 * replaces it, and the engine's next search reads it at the moment it runs.
 */

/** One move of the game, as the session played it. */
export interface PlayedMove {
  /** Half-move number from the start of the game, 0 for White's first. */
  ply: number
  san: string
  colour: Colour
  /** The position the move was played from. */
  fen: string
  /** The position after it. */
  after: string
}

/** The full move number a ply belongs to: plies 0 and 1 are both move 1. */
export function fullMove(ply: number): number {
  return Math.floor(ply / 2) + 1
}

export interface SessionOptions {
  engine: Engine
  profile: StrengthProfile
  /** The user's colour. Defaults to White. */
  side?: Colour
  /** Moves already played, replayed before the game goes on. */
  startMoves?: string[]
  /** Injected so the tests are not a coin toss. */
  random?: () => number
}

export type SessionStatus = 'playing' | 'finished'

export class PlaySession {
  readonly chess: Chess
  readonly moves: PlayedMove[] = []
  private readonly engine: Engine
  private readonly random: () => number
  private readonly side: Colour
  /** The strength the engine plays at, read at each search. */
  private profile: StrengthProfile
  /** What undo took off, latest removed at the top, for redo to put back. */
  private readonly undone: PlayedMove[] = []
  /**
   * How many hints were asked for. Counted on the game rather than the screen
   * because it is a fact about how the game was played, and the report says
   * it: a game played with the answers on is a different game.
   */
  hints = 0
  /** Set when the game ends by itself: checkmate, stalemate, a draw. */
  outcome?: string

  constructor(options: SessionOptions) {
    this.engine = options.engine
    this.profile = options.profile
    this.side = options.side ?? 'white'
    this.random = options.random ?? Math.random
    this.chess = new Chess()
    // Replaying the moves that led here keeps the ply numbers honest.
    for (const san of options.startMoves ?? []) {
      const before = this.chess.fen()
      const move = this.chess.move(san)
      this.moves.push({
        ply: this.moves.length,
        san: move.san,
        colour: move.color === 'w' ? 'white' : 'black',
        fen: before,
        after: this.chess.fen(),
      })
    }
    // A game started from a list of moves may already be over, and a checkmate
    // replayed here is still a checkmate. Without this, a replayed mate would
    // read as a game in progress with a board that could not move.
    this.noteOutcome()
  }

  get fen(): string {
    return this.chess.fen()
  }

  get sideToMove(): Colour {
    return this.chess.turn() === 'w' ? 'white' : 'black'
  }

  /** The colour the user is playing. */
  get userColour(): Colour {
    return this.side
  }

  /** The colour the engine is playing. */
  get engineColour(): Colour {
    return this.userColour === 'white' ? 'black' : 'white'
  }

  /** True when it is the user's turn. */
  get userToMove(): boolean {
    return this.sideToMove === this.userColour
  }

  get status(): SessionStatus {
    if (this.outcome) return 'finished'
    if (this.chess.isGameOver()) return 'finished'
    return 'playing'
  }

  /**
   * True when the game is over. A method rather than a comparison on `status`,
   * because callers check it either side of a move that can change it.
   */
  isFinished(): boolean {
    return this.status === 'finished'
  }

  /** The strength the engine's next move is played at (spec S6). */
  setProfile(profile: StrengthProfile): void {
    this.profile = profile
  }

  /** Plays the user's move. Returns false when it is not legal. */
  playUser(san: string): boolean {
    if (!this.userToMove) return false
    const before = this.chess.fen()
    let move
    try {
      move = this.chess.move(san)
    } catch {
      return false
    }
    this.moves.push({
      ply: this.moves.length,
      san: move.san,
      colour: this.userColour,
      fen: before,
      after: this.chess.fen(),
    })
    // A new move is a new game from here on, so there is nothing to redo.
    this.undone.length = 0
    this.noteOutcome()
    return true
  }

  /** True when there is a move of the user's own to take back. */
  canUndo(): boolean {
    return this.undoTarget() !== null
  }

  /** True when undo has taken something off that has not been put back. */
  canRedo(): boolean {
    return this.undone.length > 0
  }

  /**
   * Takes the game back to the last position where the user was to move.
   *
   * Returns false when there is nothing to take back, which includes the case
   * where every move so far belongs to the engine: a game with the user on
   * Black, before the user has answered White's first move, has nothing of the
   * user's in it.
   */
  undo(): boolean {
    const target = this.undoTarget()
    if (target === null) return false
    while (this.moves.length > target) {
      const removed = this.moves.pop()
      if (!removed) break
      this.chess.undo()
      this.undone.push(removed)
    }
    this.reoutcome()
    return true
  }

  /** Puts back what undo took off, up to the user's next turn. */
  redo(): boolean {
    if (this.undone.length === 0) return false
    do {
      const move = this.undone.pop()
      if (!move) break
      this.chess.move(move.san)
      this.moves.push(move)
    } while (this.undone.length > 0 && !this.userToMove && !this.chess.isGameOver())
    this.reoutcome()
    return true
  }

  /**
   * How many plies to fall back to, or null when there is nothing to undo.
   *
   * `moves[count].colour` is the side that moved from that position, so it is
   * also the side to move there. The search walks back one ply at a time and
   * stops at the first position that belongs to the user, which makes the
   * pairing fall out rather than having to be counted.
   */
  private undoTarget(): number | null {
    for (let count = this.moves.length - 1; count >= 0; count -= 1) {
      if (this.moves[count].colour === this.userColour) return count
    }
    return null
  }

  /**
   * Works the outcome out again after the move list changed.
   *
   * Clearing it first is the whole point: a game undone out of a checkmate
   * would otherwise still be finished, with a board that says otherwise.
   */
  private reoutcome(): void {
    this.outcome = undefined
    this.noteOutcome()
  }

  /**
   * Plays the engine's move. Returns its SAN, or null when it is not the
   * engine's turn, the game is over, or the engine had nothing to play.
   */
  async playEngine(): Promise<string | null> {
    if (this.userToMove || this.status === 'finished') return null
    const before = this.chess.fen()
    const engineMove = await this.engineMove(before)
    if (!engineMove) return null
    const san = this.chess.move(splitMove(engineMove)).san
    this.moves.push({
      ply: this.moves.length,
      san,
      colour: this.engineColour,
      fen: before,
      after: this.chess.fen(),
    })
    this.noteOutcome()
    return san
  }

  /** Asks the engine for a move, applying the strength profile's randomness. */
  private async engineMove(fen: string): Promise<string | null> {
    const profile = this.profile
    const result = await this.engine.search(fen, profile.movetime)
    const candidate = chooseCandidate(result.candidates, profile, this.random())
    return candidate?.move ?? result.bestMove
  }

  /** The sentences live in `outcome.ts`, so every outcome is worded once. */
  private noteOutcome(): void {
    this.outcome = outcomeOf(this.chess, this.userColour)
  }
}
