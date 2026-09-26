import { useLayoutEffect, useRef, useState } from "react";

/**
 * Measures the fixed mobile header (room name + tab bar) so the page can
 * reserve equivalent space and keep content from hiding behind it.
 *
 * Returns a ref to attach to the header element and its measured height (0 on
 * desktop). Remeasures on resize and whenever the provided deps change (e.g.
 * the room loads or the active tab switches, changing header contents).
 *
 * @param {boolean} isMobile - Only measure on mobile; height is 0 otherwise.
 * @param {Array} deps - Extra dependencies that should trigger a remeasure.
 */
const useStickyMobileHeader = (isMobile, deps = []) => {
  const headerRef = useRef(null);
  const [headerHeight, setHeaderHeight] = useState(0);

  useLayoutEffect(() => {
    if (!isMobile) {
      setHeaderHeight(0);
      return undefined;
    }
    const measure = () => {
      if (headerRef.current) {
        setHeaderHeight(headerRef.current.offsetHeight);
      }
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobile, ...deps]);

  return { headerRef, headerHeight };
};

export default useStickyMobileHeader;
