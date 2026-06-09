import { useState } from 'react';
import { DataModeToggle, type DataMode } from '../components/features/DataModeToggle';
import BuilderPrototype from '../prototype-pages/BuilderPrototype';
import { BuilderPage as BuilderLive } from './BuilderLive';

const STORAGE_KEY = 'smartcli.builder.dataMode';

function initialMode(): DataMode {
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === 'live' ? 'live' : 'prototype';
}

export function BuilderPage() {
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
      {mode === 'prototype' ? <BuilderPrototype /> : <BuilderLive />}
    </div>
  );
}
