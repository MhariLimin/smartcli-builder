import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, Clock, Zap, Cpu, Network, Terminal } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AppContext';

type BillingState = 'waiting' | 'success' | 'timeout';

const UNLOCKED_FEATURES = [
  { icon: <Cpu className="w-4 h-4 text-violet-400" />, label: 'AI command generation' },
  { icon: <Network className="w-4 h-4 text-cyan-400" />, label: 'Kubernetes helper gallery' },
  { icon: <Terminal className="w-4 h-4 text-electric-blue-400" />, label: 'SSH workflows' },
  { icon: <Zap className="w-4 h-4 text-amber-400" />, label: 'Workspace templates' },
];

export default function BillingReturn() {
  const [params] = useSearchParams();
  const { setScenario } = useAuth();
  const isDemo = params.get('demo') === 'upgrade';

  const [state, setState] = useState<BillingState>(isDemo ? 'waiting' : 'waiting');

  useEffect(() => {
    const timer = setTimeout(() => {
      setState('success');
      if (isDemo) setScenario('pro-admin');
    }, isDemo ? 2000 : 4000);

    const timeout = setTimeout(() => {
      if (state === 'waiting') setState('timeout');
    }, isDemo ? 8000 : 15000);

    return () => { clearTimeout(timer); clearTimeout(timeout); };
  }, []);

  return (
    <div className="min-h-screen bg-navy-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {state === 'waiting' && (
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-navy-800 border border-navy-700 flex items-center justify-center mx-auto mb-6">
              <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
            </div>
            <h1 className="text-xl font-bold text-slate-100 mb-2">Confirming your upgrade</h1>
            <p className="text-sm text-slate-400 max-w-xs mx-auto">
              We're verifying your payment. This usually takes a few seconds.
            </p>
          </div>
        )}

        {state === 'success' && (
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-green-500/15 border border-green-500/30 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-violet-500/15 border border-violet-500/30 rounded-full text-violet-400 text-xs font-semibold mb-4">
              <Zap className="w-3 h-3" />
              SmartCLI Pro activated
            </div>
            <h1 className="text-xl font-bold text-slate-100 mb-2">Welcome to SmartCLI Pro</h1>
            <p className="text-sm text-slate-400 mb-8">
              Your workspace has been upgraded. All Pro features are now active.
            </p>

            <div className="bg-navy-850 border border-navy-700 rounded-2xl p-5 mb-6 text-left">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Unlocked</p>
              <ul className="space-y-2.5">
                {UNLOCKED_FEATURES.map((f) => (
                  <li key={f.label} className="flex items-center gap-3">
                    {f.icon}
                    <span className="text-sm text-slate-200">{f.label}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-col gap-2">
              <Link to="/ai">
                <Button variant="primary" className="w-full" leftIcon={<Cpu className="w-4 h-4" />}>
                  Try AI generation
                </Button>
              </Link>
              <Link to="/">
                <Button variant="ghost" className="w-full">Back to Builder</Button>
              </Link>
            </div>
          </div>
        )}

        {state === 'timeout' && (
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mx-auto mb-6">
              <Clock className="w-8 h-8 text-amber-400" />
            </div>
            <h1 className="text-xl font-bold text-slate-100 mb-2">Taking a moment longer</h1>
            <p className="text-sm text-slate-400 max-w-xs mx-auto mb-4">
              Your payment is processing. Your plan will update shortly — you don't need to wait on this page.
            </p>
            <p className="text-xs text-slate-500 mb-6">
              If your plan hasn't updated within 10 minutes, contact support.
            </p>
            <Link to="/">
              <Button variant="secondary">Return to dashboard</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
