import { useCallback, useState } from 'react';

export type PlaceholderInputMode = 'form' | 'inline';

const PLACEHOLDER_INPUT_MODE_KEY = 'smartcli.placeholderInputMode';

function readPlaceholderInputMode(): PlaceholderInputMode {
  if (typeof window === 'undefined') return 'form';
  return window.localStorage.getItem(PLACEHOLDER_INPUT_MODE_KEY) === 'inline'
    ? 'inline'
    : 'form';
}

export function useUiPrefs() {
  const [placeholderInputMode, setPlaceholderInputModeState] =
    useState<PlaceholderInputMode>(readPlaceholderInputMode);

  const setPlaceholderInputMode = useCallback((mode: PlaceholderInputMode) => {
    setPlaceholderInputModeState(mode);
    window.localStorage.setItem(PLACEHOLDER_INPUT_MODE_KEY, mode);
  }, []);

  return { placeholderInputMode, setPlaceholderInputMode };
}
