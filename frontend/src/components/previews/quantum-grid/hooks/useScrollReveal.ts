"use client";

import { useEffect, useRef } from "react";

interface UseScrollRevealOptions {
  threshold?: number;
  rootMargin?: string;
  repeat?: boolean;
}

/**
 * Find the nearest scrollable ancestor of an element.
 * The app uses <main class="overflow-y-auto"> as the scroll container
 * (not the viewport), so IntersectionObserver needs the correct root.
 */
function findScrollParent(el: HTMLElement): HTMLElement | null {
  let parent = el.parentElement;
  while (parent) {
    const style = getComputedStyle(parent);
    if (
      style.overflowY === "auto" ||
      style.overflowY === "scroll"
    ) {
      return parent;
    }
    parent = parent.parentElement;
  }
  return null;
}

export function useScrollReveal<T extends HTMLElement = HTMLDivElement>(
  options: UseScrollRevealOptions = {}
) {
  const { threshold = 0.15, rootMargin = "0px 0px -50px 0px", repeat = false } = options;
  const ref = useRef<T>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Delay observer so the browser paints the invisible state first,
    // making the entrance animation perceptible to the user.
    const timer = setTimeout(() => {
      const scrollRoot = findScrollParent(el);

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("qg-revealed");
              if (!repeat) {
                observer.unobserve(entry.target);
              }
            } else if (repeat) {
              entry.target.classList.remove("qg-revealed");
            }
          });
        },
        { threshold, rootMargin, root: scrollRoot }
      );

      observer.observe(el);
      observerRef.current = observer;
    }, 100);

    return () => {
      clearTimeout(timer);
      observerRef.current?.disconnect();
      observerRef.current = null;
    };
  }, [threshold, rootMargin, repeat]);

  return ref;
}
