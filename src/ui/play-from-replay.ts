import { Chess } from 'chess.js'
import { positionAtPly, type PlayedMove } from '../play'
import type { Colour } from '../model/types'

/**
 * Origin: London src/ui/play-from-replay.ts, adapted: ReplayedGame is just the moves, because this app has no course, chapter or record date; the colour parameter is the user's; the start of the game is refused, which the trainer has no rule for; and moveAtPlyLabel, requestFromReplay and playedDay are not here, because a new game is started by `start` with a prefix of SANs rather than by a request object.
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
 * Three conditions, and all of them are about the position rather than the
 * game. The game cannot be over there: mate is not a position to practise from.
 * It has to be the user's move, because a game where the engine moves first
 * would open with the engine's answer to a move the user never made. And it
 * cannot be the START of the game (spec 18.4).
 *
 * The start is this app's own rule. The trainer has none, because a trainer
 * game can begin from a Study position, where ply 0 is a real position worth
 * practising. Here every game begins at the opening position, so Play from here
 * at ply 0 is New game under another name, and one that also throws the
 * reviewed game away.
 */
export function canPlayFromPly(game: ReplayedGame, ply: number, userColour: Colour): boolean {
  const fen = positionAtPly(game.moves, ply)
  if (!fen) return false
  if (ply <= 0) return false
  const chess = new Chess(fen)
  if (chess.isGameOver()) return false
  return (chess.turn() === 'w' ? 'white' : 'black') === userColour
}

/**
 * Why the button is off, in the words a person can act on.
 *
 * The start is asked BEFORE the colour. At ply 0 a user playing Black is also
 * facing the engine's move, and "Step one move on or back" is half wrong there,
 * because back is disabled at ply 0. The start's own sentence is true for both
 * colours, so it goes first.
 */
export function whyNotPlayable(game: ReplayedGame, ply: number, userColour: Colour): string {
  const fen = positionAtPly(game.moves, ply)
  if (!fen) return 'There is no game to play from here.'
  if (new Chess(fen).isGameOver()) return 'The game is over here.'
  if (ply <= 0) return 'This is the start of the game. Use New game.'
  if (canPlayFromPly(game, ply, userColour)) return ''
  return "It is the engine's move here. Step one move on or back."
}
