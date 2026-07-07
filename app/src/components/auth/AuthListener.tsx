'use client';

import { useEffect } from 'react';
import { initAuth } from '@/store/authStore';

/**
 * A null-rendering client island that boots the auth lifecycle exactly once per
 * tab. Mounted beside {children} in the root layout (NOT wrapping them, so the
 * server tree stays a server tree). `initAuth` is idempotent, so remounts across
 * navigation are harmless, and it is a calm no-op when Supabase is unconfigured.
 */
export function AuthListener() {
  useEffect(() => {
    initAuth();
  }, []);
  return null;
}
