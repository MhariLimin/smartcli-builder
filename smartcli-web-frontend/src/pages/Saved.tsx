import { useState } from 'react';
import { DataModeToggle, type DataMode } from '../components/features/DataModeToggle';
import SavedPrototype from '../prototype-pages/SavedPrototype';
import { SavedPage as SavedLive } from './SavedLive';

const STORAGE_KEY = 'smartcli.saved.dataMode';

function initialMode(): DataMode {
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === 'live' ? 'live' : 'prototype';
}

export function SavedPage() {
  const [mode, setMode] = useState<DataMode>(initialMode);

  const changeMode = (next: DataMode) => {
    setMode(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <DataModeToggle mode={mode} onChange={changeMode} />
      </div>
      {mode === 'prototype' ? <SavedPrototype /> : <SavedLive />}
    </div>
  );
}
