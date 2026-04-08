import { useEffect } from 'react';

export function useClampToViewport(
  ref: React.RefObject<HTMLDivElement | null>,
  trigger: unknown,
) {

  useEffect(() => {

    const el = ref.current;
    if (!el || !trigger) return;
    const rect = el.getBoundingClientRect();

    let left = rect.left;
    let top = rect.top;

    // If the menu bleeds past the right edge, flip it to open left of the click point
    if (rect.right > window.innerWidth) {

      left = Math.max(8, rect.left - rect.width);

    }

    // Ensure it doesn't go off the left edge
    if (left < 8) {

      left = 8;

    }

    if (rect.bottom > window.innerHeight) {

      top = window.innerHeight - rect.height - 8;

    }

    if (top < 8) {

      top = 8;

    }

    el.style.left = `${left}px`;
    el.style.top = `${top}px`;

  }, [trigger]);

}
