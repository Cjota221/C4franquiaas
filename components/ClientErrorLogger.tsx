"use client";

import { useEffect } from 'react';

export default function ClientErrorLogger(): null {
  useEffect(() => {
    function onError(event: ErrorEvent) {
      try {
        // prefer structured logging to help remote inspection
        console.error('ClientErrorLogger: window.onerror', {
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          error: event.error && event.error.stack ? String(event.error.stack).slice(0, 2000) : String(event.error),
        });
      } catch {}
    }

    function onRejection(ev: PromiseRejectionEvent) {
      try {
        console.error('ClientErrorLogger: unhandledrejection', {
          reason: ev.reason && ev.reason.stack ? String(ev.reason.stack).slice(0, 2000) : String(ev.reason),
        });
      } catch {}
    }

    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onRejection as EventListener);

    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onRejection as EventListener);
    };
  }, []);

  return null;
}
