import { Link } from 'react-router-dom';
import { Terminal, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/Button';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-navy-950 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl bg-navy-850 border border-navy-700 flex items-center justify-center mx-auto mb-6">
          <Terminal className="w-8 h-8 text-slate-500" />
        </div>
        <div className="font-mono text-6xl font-bold text-navy-700 mb-4">404</div>
        <h1 className="text-lg font-semibold text-slate-200 mb-2">Page not found</h1>
        <p className="text-sm text-slate-400 mb-6">The route you're looking for doesn't exist.</p>
        <Link to="/">
          <Button variant="secondary" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Back to Builder
          </Button>
        </Link>
      </div>
    </div>
  );
}
