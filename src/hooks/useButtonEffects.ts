import { useEffect } from 'react';

/**
 * Global "click juice" for every button in the app.
 *
 * A single document-level listener watches pointer/keyboard activation and
 * paints a Material-style ripple inside whichever button was pressed, so new
 * buttons pick the effect up automatically without any per-component wiring.
 *
 * - Pointer activation ripples outwards from the exact click position.
 * - Keyboard activation (Enter / Space, `event.detail === 0`) ripples from
 *   the centre of the button, so keyboard users get the same feedback.
 * - `data-dm-effect="off"` opts a button out of the effect.
 * - `data-dm-ripple="danger"` (or any other variant) tints the ripple.
 */

const HOST_CLASS = 'dm-btn';
const RIPPLE_CLASS = 'dm-ripple';
const RIPPLE_DURATION_MS = 640;

/** True when the user asked the OS to minimise non-essential motion. */
export const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const spawnRipple = (button: HTMLElement, clientX?: number, clientY?: number): void => {
  const rect = button.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return;

  // The circle has to be big enough to reach the farthest corner of the
  // button from the press position.
  const size = Math.max(rect.width, rect.height) * 2.2;
  const x = clientX === undefined ? rect.width / 2 : clientX - rect.left;
  const y = clientY === undefined ? rect.height / 2 : clientY - rect.top;

  const ripple = document.createElement('span');
  ripple.className = RIPPLE_CLASS;
  ripple.setAttribute('aria-hidden', 'true');
  ripple.style.width = `${size}px`;
  ripple.style.height = `${size}px`;
  ripple.style.left = `${x - size / 2}px`;
  ripple.style.top = `${y - size / 2}px`;

  const variant = button.dataset.dmRipple;
  if (variant) ripple.dataset.variant = variant;

  button.appendChild(ripple);

  const remove = () => ripple.remove();
  ripple.addEventListener('animationend', remove, { once: true });
  // Safety net: if the animation is suppressed (reduced motion) the element
  // would otherwise linger inside the button.
  window.setTimeout(remove, RIPPLE_DURATION_MS + 600);
};

/** Resolve the pressed button from an event target, if any. */
const findButton = (target: EventTarget | null): HTMLElement | null => {
  const element = target as Element | null;
  if (!element || typeof element.closest !== 'function') return null;
  const button = element.closest('button');
  if (!button) return null;
  if ((button as HTMLButtonElement).disabled) return null;
  if (button.dataset.dmEffect === 'off') return null;
  return button;
};

export function useButtonEffects(): void {
  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      const button = findButton(e.target);
      if (!button) return;
      button.classList.add(HOST_CLASS);
      spawnRipple(button, e.clientX, e.clientY);
    };

    const onClick = (e: MouseEvent) => {
      // `detail === 0` means the click came from the keyboard, not a pointer.
      if (e.detail !== 0) return;
      const button = findButton(e.target);
      if (!button) return;
      button.classList.add(HOST_CLASS);
      spawnRipple(button);
    };

    document.addEventListener('pointerdown', onPointerDown, true);
    document.addEventListener('click', onClick, true);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true);
      document.removeEventListener('click', onClick, true);
    };
  }, []);
}
