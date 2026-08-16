import { useState } from 'react';
import { FlaskConical, ChevronDown } from 'lucide-react';
import { cn } from '../../lib/boltUtils';
import { useAuth } from '../../context/AppContext';
import { SCENARIOS, type ScenarioId } from '../../mock/scenarios';
import { supabaseConnectionMode } from '../../lib/supabase';

export function DevScenarioSwitcher() {
  const { scenarioId, setScenario } = useAuth();
  const [open, setOpen] = useState(false);

  const current = SCENARIOS.find((s) => s.id === scenarioId) ?? SCENARIOS[0];

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <div className="relative">
        <button
          onClick={() => setOpen((v) => !v)}
          className={cn(
            'flex items-center gap-2 px-3 py-2 rounded-xl',
            'bg-violet-500/20 border border-violet-500/40 text-violet-300',
            'text-xs font-medium hover:bg-violet-500/30 transition-colors shadow-lg',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500'
          )}
          aria-expanded={open}
          aria-label="Dev scenario switcher"
        >
          <FlaskConical className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Scenario: </span>
          <span>{current.label}</span>
          <ChevronDown className={cn('w-3 h-3 transition-transform', open && 'rotate-180')} />
        </button>

        {open && (
          <div className="absolute bottom-full mb-2 left-0 w-72 bg-navy-850 border border-navy-700 rounded-xl shadow-xl overflow-hidden animate-slide-up">
            <div className="px-3 py-2 border-b border-navy-800">
              <p className="text-xs font-semibold text-violet-400">Dev Mode — Scenario Switcher</p>
              <p className="text-2xs text-slate-500 mt-0.5">
                Supabase {supabaseConnectionMode}. Switch mock persona and entitlement state.
              </p>
            </div>
            <div className="py-1">
              {SCENARIOS.map((scenario) => (
                <button
                  key={scenario.id}
                  onClick={() => { setScenario(scenario.id as ScenarioId); setOpen(false); }}
                  className={cn(
                    'w-full flex flex-col px-3 py-2 text-left hover:bg-navy-800 transition-colors',
                    scenarioId === scenario.id && 'bg-violet-500/10'
                  )}
                >
                  <span className={cn(
                    'text-sm font-medium',
                    scenarioId === scenario.id ? 'text-violet-300' : 'text-slate-200'
                  )}>
                    {scenario.label}
                  </span>
                  <span className="text-2xs text-slate-500 mt-0.5">{scenario.description}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
