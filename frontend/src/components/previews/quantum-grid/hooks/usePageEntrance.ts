"use client";

import { useEffect, useState } from "react";

export function usePageEntrance() {
  const [entered, setEntered] = useState(false);
  useEffect(() => {
    // Double rAF guarantees the browser has painted the initial hidden state
    // before triggering the transition to visible
    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setEntered(true);
      });
    });
    return () => cancelAnimationFrame(raf);
  }, []);
  return entered;
}
