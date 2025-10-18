"use client";
import React from 'react';

interface PageWrapperProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  actionButton?: React.ReactNode;
}

export default function PageWrapper({ title, description, children, actionButton }: PageWrapperProps) {
  return (
    <div className="font-sans">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">{title}</h1>
          {description && <p className="text-gray-500 mt-1">{description}</p>}
        </div>
        {actionButton && <div className="flex items-center gap-3">{actionButton}</div>}
      </header>
      {children}
    </div>
  );
}
