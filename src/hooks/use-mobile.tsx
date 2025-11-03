import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const getIsMobile = () =>
    typeof window !== "undefined"
      ? window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`).matches
      : false

  // Initialize synchronously to avoid post-mount layout shift
  const [isMobile, setIsMobile] = React.useState<boolean>(getIsMobile)

  React.useLayoutEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = (e: MediaQueryListEvent) => {
      setIsMobile(e.matches)
    }
    // Ensure state is correct on mount before paint
    setIsMobile(mql.matches)
    mql.addEventListener("change", onChange)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return isMobile
}
