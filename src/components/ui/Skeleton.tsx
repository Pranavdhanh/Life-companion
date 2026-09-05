import React from 'react';

export function SkeletonCard() {
  return (
    <div className="border rounded-lg p-4 shadow-sm w-full animate-pulse bg-white">
      <div className="w-2/3 h-6 bg-gray-200 rounded mb-4"></div>
      <div className="w-full h-4 bg-gray-200 rounded mb-2"></div>
      <div className="w-4/5 h-4 bg-gray-200 rounded"></div>
    </div>
  );
}

export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-3 w-full">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="w-full h-12 bg-gray-200 rounded animate-pulse"></div>
      ))}
    </div>
  );
}

export function SkeletonText({ lines = 1 }: { lines?: number }) {
  return (
    <div className="flex flex-col gap-2 w-full">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="w-full h-4 bg-gray-200 rounded animate-pulse"></div>
      ))}
    </div>
  );
}
