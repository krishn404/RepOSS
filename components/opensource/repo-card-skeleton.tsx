import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function RepoCardSkeleton() {
  return (
    <Card className="border-white/10 bg-gradient-to-br from-white/[0.03] to-white/[0.01]">
      <CardContent className="p-5 space-y-4">
        {/* Header skeleton */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 flex-1">
            <Skeleton className="w-10 h-10 rounded-lg bg-white/10" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-4 w-32 bg-white/10" />
              <Skeleton className="h-3 w-20 bg-white/10" />
            </div>
          </div>
          <Skeleton className="w-16 h-6 rounded-full bg-white/10 flex-shrink-0" />
        </div>

        {/* Description skeleton */}
        <div className="space-y-1">
          <Skeleton className="h-4 w-full bg-white/10" />
          <Skeleton className="h-4 w-3/4 bg-white/10" />
        </div>

        {/* Meta row skeleton */}
        <div className="flex gap-4">
          <Skeleton className="h-3 w-16 bg-white/10" />
          <Skeleton className="h-3 w-16 bg-white/10" />
          <Skeleton className="h-3 w-24 ml-auto bg-white/10" />
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-white/10 to-transparent" />

        {/* Bottom section skeleton */}
        <div className="space-y-3">
          <div className="flex gap-2">
            <Skeleton className="h-5 w-16 rounded bg-white/10" />
            <Skeleton className="h-5 w-16 rounded bg-white/10 ml-auto" />
          </div>
          <Skeleton className="h-4 w-full bg-white/10" />
          <Skeleton className="h-8 w-full rounded-md bg-white/10" />
        </div>
      </CardContent>
    </Card>
  )
}
