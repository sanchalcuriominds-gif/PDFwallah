import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function PdfCardSkeleton() {
  return (
    <Card className="overflow-hidden h-full">
      {/* Gradient area */}
      <Skeleton className="h-32 w-full rounded-none" />

      {/* Content lines */}
      <CardContent className="p-4 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-3 w-2/3" />
      </CardContent>
    </Card>
  )
}
