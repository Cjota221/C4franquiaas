"use client";

import React from 'react';
import ClientErrorLogger from './ClientErrorLogger';

// Simple client wrapper to be imported from server components
export default function ClientErrorLoggerWrapper(): React.ReactElement {
  return <ClientErrorLogger />;
}
