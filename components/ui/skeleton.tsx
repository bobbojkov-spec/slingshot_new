import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-muted/60",
        className
      )}
      {...props}
    />
  );
}

// Product card skeleton
export function ProductCardSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="aspect-square w-full rounded-lg" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-5 w-1/3" />
      </div>
    </div>
  );
}

// Product grid skeleton
export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8 md:gap-x-6 md:gap-y-12">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

// Collection card skeleton
export function CollectionCardSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="aspect-[4/3] w-full rounded-lg" />
      <Skeleton className="h-5 w-2/3 mx-auto" />
    </div>
  );
}

// Hero section skeleton
export function HeroSkeleton() {
  return (
    <div className="relative w-full min-h-[60vh] flex items-center">
      <Skeleton className="absolute inset-0" />
      <div className="relative z-10 section-container space-y-4">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-16 w-3/4 max-w-xl" />
        <Skeleton className="h-6 w-2/3 max-w-md" />
        <div className="flex gap-4 pt-4">
          <Skeleton className="h-12 w-40 rounded" />
          <Skeleton className="h-12 w-40 rounded" />
        </div>
      </div>
    </div>
  );
}

// Text content skeleton
export function TextSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className="h-4"
          style={{ width: `${100 - i * 10}%` }}
        />
      ))}
    </div>
  );
}

// Horizontal scroll card skeleton
export function HorizontalCardSkeleton() {
  return (
    <div className="flex-shrink-0 w-[280px] md:w-[320px]">
      <Skeleton className="aspect-square w-full rounded-lg" />
    </div>
  );
}

// Section with title skeleton
export function SectionSkeleton({ cardCount = 4 }: { cardCount?: number }) {
  return (
    <div className="section-padding">
      <div className="section-container">
        <div className="text-center mb-12 space-y-4">
          <Skeleton className="h-5 w-24 mx-auto" />
          <Skeleton className="h-10 w-48 mx-auto" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {Array.from({ length: cardCount }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
