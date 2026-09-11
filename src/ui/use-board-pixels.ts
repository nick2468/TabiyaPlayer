import { useEffect, useState } from 'react'
import type { BoardSizeName } from '../storage/prefs'
import { BOARD_SIZE, BOARD_SIZE_LARGE, NARROW_BELOW, fitBoardSize } from './board-size'

/**
 * How many pixels the board is drawn at right now (spec S2).
 *
 * The viewport is state rather than a reading taken during a render, because a
 * component that measured the window while rendering would render differently
 * for a reason React cannot see, and would not re-render when the window
 * changed. `orientationchange` is listened for as well as `resize` because an
 * iPad turned on its side fires both, and older Safari fires the orientation
 * one first with the old size still reported.
 *
 * The arithmetic itself is `fitBoardSize`, which is pure and tested without a
 * window. This hook is only the measuring.
 */
export function useBoardPixels(size: BoardSizeName): number {
  const [viewport, setViewport] = useState(() => ({
    width: window.innerWidth,
    height: window.innerHeight,
  }))

  useEffect(() => {
    const measure = () =>
      setViewport((old) =>
        old.width === window.innerWidth && old.height === window.innerHeight
          ? // The same object, so a resize that changed nothing costs no render.
            old
          : { width: window.innerWidth, height: window.innerHeight },
      )
    // The window can have changed between the first render and this effect.
    measure()
    window.addEventListener('resize', measure)
    window.addEventListener('orientationchange', measure)
    return () => {
      window.removeEventListener('resize', measure)
      window.removeEventListener('orientationchange', measure)
    }
  }, [])

  return fitBoardSize(
    size === 'large' ? BOARD_SIZE_LARGE : BOARD_SIZE,
    viewport.width,
    viewport.height,
    viewport.width < NARROW_BELOW,
  )
}
