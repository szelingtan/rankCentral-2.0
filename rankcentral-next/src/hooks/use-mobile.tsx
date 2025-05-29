/**
 * @fileoverview Custom React hook for detecting mobile viewport breakpoints.
 * Provides responsive behavior based on screen width.
 */

import * as React from "react"

/** @type {number} Mobile breakpoint width in pixels */
const MOBILE_BREAKPOINT = 768

/**
 * Custom hook to detect if the current viewport is mobile-sized.
 * Uses window.matchMedia to efficiently track viewport changes.
 *
 * @hook
 * @returns {boolean} True if viewport width is below mobile breakpoint, false otherwise
 */
export function useIsMobile() {
  /** @type {[boolean | undefined, React.Dispatch<React.SetStateAction<boolean | undefined>>]} */
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}
