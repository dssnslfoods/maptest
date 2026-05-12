import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface State {
  error: Error | null;
}

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error) {
    // eslint-disable-next-line no-console
    console.error('Unhandled error:', error);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
          <div className="w-full max-w-md rounded-lg border bg-background p-6 shadow-sm">
            <AlertTriangle className="mb-3 h-8 w-8 text-amber-500" />
            <h1 className="text-lg font-semibold">Something went wrong</h1>
            <p className="mt-1 text-sm text-muted-foreground">{this.state.error.message}</p>
            <Button className="mt-4" onClick={() => window.location.assign('/')}>
              Reload
            </Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
