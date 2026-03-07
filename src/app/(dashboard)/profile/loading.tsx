import { Skeleton } from "@/components/ui/skeleton";

export default function ProfileLoading() {
  return (
    <div className="flex-1 space-y-6 p-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-[400px] rounded-xl" />
    </div>
  );
}
