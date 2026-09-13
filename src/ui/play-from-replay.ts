import { Chess } from 'chess.js'
import { positionAtPly, type PlayedMove } from '../play'
import type { Colour } from '../model/types'

/**
 * Origin: London src/ui/play-from-replay.ts, adapted: ReplayedGame is just the moves, because this app has no course, chapter or record date; the colour parameter is the user's; and moveAtPlyLabel, requestFromReplay and playedDay are not here, because a new game is started by `start` with a prefix of SANs rather than by a request object.
 * Starting a fresh game from a position inside a game you have already played
 * (spec 18.4).
 *
 * The report names a move and the viewer shows the position, but neither lets
 * you try it. Play from here is the third thing: the same position, handed back
 * as a game.
 *
 * It is a NEW game, and this app keeps no history for it to disturb (Q20). The
 * old game is replaced on the board and in storage the moment the new one is
 * remembered, which is what the user asked for by pressing it.
 */

/** What a replayed game knows about itself, as the screen holds it. */
export interface ReplayedGame {
  moves: PlayedMove[]
}

/**
 * Whether a position in a replay can be played on from.
 *
 * Two conditions and they are both about the position rather than the game. It
 * has to be the user's move, because a game where the engine moves first would
 * open with the engine's answer to a move the user never made. And the game
 * cannot be over there: mate is not a position to practise from.
 */
export function canPlayFromPly(game: ReplayedGame, ply: number, userColour: Colour): boolean {
  const fen = positionAtPly(game.moves, ply)
  if (!fen) return false
  const chess = new Chess(fen)
  if (chess.isGameOver()) return false
  return (chess.turn() === 'w' ? 'white' : 'black') === userColour
}

/** Why the button is off, in the words a person can act on. */
export function whyNotPlayable(game: ReplayedGame, ply: number, userColour: Colour): string {
  const fen = positionAtPly(game.moves, ply)
  if (!fen) return 'There is no game to play from here.'
  if (new Chess(fen).isGameOver()) return 'The game is over here.'
  if (canPlayFromPly(game, ply, userColour)) return ''
  return "It is the engine's move here. Step one move on or back."
}
