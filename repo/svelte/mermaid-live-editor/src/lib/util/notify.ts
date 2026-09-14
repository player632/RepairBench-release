import { toast } from 'svelte-sonner';

// Instrumentation probe: svelte-sonner renders toast nodes asynchronously and
// exposes no testid of its own; tag freshly rendered toasts so checkpoints can
// locate them. Purely additive DOM attribute writes - no behavior change.
const tagRenderToasts = (): void => {
  if (typeof document === 'undefined') return;
  for (const el of document.querySelectorAll('[data-sonner-toast]')) {
    if (!el.hasAttribute('data-testid')) {
      el.setAttribute('data-testid', 'history-toast');
    }
  }
};

export const notify = (message: string): void => {
  toast(message);
  if (typeof window !== 'undefined') {
    window.setTimeout(tagRenderToasts, 150);
    window.setTimeout(tagRenderToasts, 500);
  }
};

export const prompt = (message: string): boolean => {
  return confirm(message);
};
