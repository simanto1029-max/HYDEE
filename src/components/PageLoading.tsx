import React from 'react';

// Thin maroon bar at the very top of the screen, shown while real data is coming from the database
export const TopLoadingBar: React.FC = () => (
  <div
    className="fixed top-0 left-0 right-0 z-[100] h-[3px] bg-[#800000]/10 overflow-hidden"
    role="progressbar"
    aria-label="Loading"
  >
    <style>{`@keyframes hydee-load { 0% { transform: translateX(-100%); } 100% { transform: translateX(350%); } }`}</style>
    <div className="h-full w-1/3 bg-[#800000]" style={{ animation: 'hydee-load 1.1s ease-in-out infinite' }} />
  </div>
);

const Block: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`bg-neutral-200/80 animate-pulse rounded-xl ${className}`} />
);

interface PageSkeletonProps {
  variant: 'product' | 'grid';
}

// Placeholder shown instead of products until the database answers (no stale or jumping data)
export const PageSkeleton: React.FC<PageSkeletonProps> = ({ variant }) => {
  if (variant === 'product') {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12" aria-busy="true">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-14">
          <div className="space-y-3">
            <Block className="aspect-[4/5] w-full rounded-3xl" />
            <div className="flex gap-3">
              <Block className="w-20 h-24" />
              <Block className="w-20 h-24" />
              <Block className="w-20 h-24" />
            </div>
          </div>
          <div className="space-y-4">
            <Block className="h-4 w-24" />
            <Block className="h-8 w-4/5" />
            <Block className="h-6 w-32" />
            <div className="grid grid-cols-4 gap-3 pt-4">
              {[0, 1, 2, 3].map((i) => (
                <Block key={i} className="h-12" />
              ))}
            </div>
            <Block className="h-24 w-full" />
            <Block className="h-24 w-full" />
            <Block className="h-14 w-full rounded-full" />
          </div>
        </div>
        <p className="text-center text-xs text-neutral-400 mt-8">Loading product details…</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12" aria-busy="true">
      <Block className="h-40 sm:h-64 w-full rounded-3xl mb-10" />
      <Block className="h-7 w-56 mb-6" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <div key={i} className="space-y-3">
            <Block className="aspect-[3/4] w-full" />
            <Block className="h-4 w-4/5" />
            <Block className="h-4 w-1/3" />
          </div>
        ))}
      </div>
      <p className="text-center text-xs text-neutral-400 mt-8">Loading collection…</p>
    </div>
  );
};
