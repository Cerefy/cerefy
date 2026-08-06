// src/lib/browser.ts
// Safe browser-only storage and window helpers for shared frontend modules.

export const isBrowser = typeof window !== 'undefined' && typeof localStorage !== 'undefined';

export function readStorage(key: string): string | null {
  if (!isBrowser) return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeStorage(key: string, value: string): void {
  if (!isBrowser) return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Ignore storage failures in privacy-restricted or server contexts.
  }
}

export function removeStorage(key: string): void {
  if (!isBrowser) return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Ignore storage failures in privacy-restricted or server contexts.
  }
}

export function getBrowserOrigin(fallback = ''): string {
  if (!isBrowser) return fallback;
  return window.location.origin || fallback;
}

export function dispatchBrowserEvent(name: string): void {
  if (!isBrowser) return;
  window.dispatchEvent(new CustomEvent(name));
}
