import { useCallback, useEffect, useRef } from "react";

/**
 * Queries the set of focusable (tabbable) elements inside a container using the
 * same selector heuristic the WHATWG/WAI-ARIA Authoring Practices rely on.
 */
function getTabbable(root: HTMLElement): HTMLElement[] {
  const selector =
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';
  return Array.from(
    root.querySelectorAll<HTMLElement>(selector),
  ).filter(
    (element) =>
      !element.hasAttribute("disabled") &&
      element.getAttribute("aria-hidden") !== "true" &&
      element.offsetParent !== null,
  );
}

/**
 * Implements the four WAI-ARIA dialog requirements for an `aria-modal` dialog:
 * Escape-to-close, focus trapping (Tab/Shift+Tab wrap inside the dialog),
 * initial focus placement when the dialog opens, and focus restoration to the
 * element that had focus when it opened (the trigger) after it closes.
 *
 * @param isOpen   Whether the dialog is currently open.
 * @param onClose  Called when the user dismisses the dialog via Escape.
 * @param options  Optional `initialFocus` ref to focus on open (falls back to
 *                 the first tabbable element, then the container itself).
 */
export function useDialogAccessibility(
  isOpen: boolean,
  onClose: () => void,
  options?: { initialFocus?: React.RefObject<HTMLElement | null> },
) {
  const containerRef = useRef<HTMLElement | null>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  // Keep the latest onClose around so the keydown handler always closes against
  // the freshest state without re-binding the listener on every render.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  const setRef = useCallback(
    (node: HTMLElement | null) => {
      containerRef.current = node;
    },
    [],
  );

  useEffect(() => {
    if (!isOpen) return;

    const container = containerRef.current;
    if (!container) return;

    // Remember the opener so we can hand focus back on close. Capture it
    // synchronously (before the rAF below) so we read the element that had
    // focus at the instant the dialog opened, not whatever ends up focused
    // after the browser/react settles the mount.
    previouslyFocused.current =
      (document.activeElement as HTMLElement | null) ?? null;

    // Place initial focus: explicit target, else first tabbable, else container.
    const focusInitial = () => {
      const explicit = options?.initialFocus?.current;
      if (explicit && document.contains(explicit)) {
        explicit.focus();
        return;
      }
      const tabbable = getTabbable(container);
      const target = tabbable[0] ?? container;
      if (target === container && container.getAttribute("tabindex") == null) {
        container.setAttribute("tabindex", "-1");
      }
      target.focus();
    };

    // Defer one frame so the dialog's children are committed to the DOM before
    // we attempt to focus them.
    const frame = window.requestAnimationFrame(focusInitial);

    const handleKeyDown = (event: KeyboardEvent) => {
      // Only the dialog that currently contains focus (the topmost dialog)
      // should react. This prevents stacked dialogs from both closing on a
      // single Escape or fighting over Tab wrapping.
      const currentContainer = containerRef.current;
      if (!currentContainer || !currentContainer.contains(document.activeElement)) {
        return;
      }

      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        onCloseRef.current();
        return;
      }

      if (event.key !== "Tab") return;

      const tabbable = getTabbable(currentContainer);
      if (tabbable.length === 0) {
        // No tabbable descendants: keep focus on the container itself.
        event.preventDefault();
        currentContainer.focus();
        return;
      }

      const first = tabbable[0];
      const last = tabbable[tabbable.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (event.shiftKey) {
        if (active === first || !currentContainer.contains(active)) {
          event.preventDefault();
          last.focus();
        }
      } else if (active === last || !currentContainer.contains(active)) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener("keydown", handleKeyDown);

      // Restore focus to the opener when the dialog closes.
      const opener = previouslyFocused.current;
      previouslyFocused.current = null;
      if (opener && document.contains(opener)) {
        opener.focus();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  return { setRef, containerRef };
}
