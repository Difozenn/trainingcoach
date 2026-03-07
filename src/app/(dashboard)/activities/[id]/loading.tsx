import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export default function ActivityDetailLoading() {
  return (
    <div className="flex-1 space-y-6 p-4 sm:p-6">
      {/* Back button */}
      <Skeleton className="h-8 w-20" />

      {/* Title */}
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-lg" />
        <div className="space-y-2">
          <Skeleton className="h-6 w-64" />
          <Skeleton className="h-4 w-40" />
        </div>
      </div>

      {/* Grid */}
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Left: charts */}
        <div className="space-y-6">
          <Skeleton className="h-[300px] rounded-xl" />
          <Skeleton className="h-[200px] rounded-xl" />
        </div>
        {/* Right: stats */}
        <Card className="p-4">
          <CardContent className="space-y-4 p-0">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
