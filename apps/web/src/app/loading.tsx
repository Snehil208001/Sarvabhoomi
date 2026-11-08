import React from 'react';

export default function Loading() {
  return (
    <div
      className="fixed top-0 left-0 right-0 h-[3px] bg-gold/20 z-50 overflow-hidden pointer-events-none"
      role="status"
      aria-label="Loading page content"
    >
      <div className="h-full bg-gold animate-pulse w-full" />
    </div>
  );
}
