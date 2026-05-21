import { useCallback } from 'react';

export type Page = 'landing' | 'register' | 'login' | 'terms' | 'dashboard' | 'screenie-detail';

export function useNavigate() {
  return useCallback((page: Page, params?: { id?: string }) => {
    const event = new CustomEvent('navigate', { detail: { page, params } });
    window.dispatchEvent(event);
  }, []);
}
