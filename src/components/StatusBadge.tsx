import { LeadStatus } from '@/types/lead';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export function StatusBadge({ status }: { status: LeadStatus }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        'font-medium text-xs px-2.5 py-0.5',
        status === 'Follow Up' && 'status-followup',
        status === 'Convert' && 'status-converted',
        status === 'Cancel' && 'status-cancelled',
      )}
    >
      {status === 'Convert' ? 'Converted' : status === 'Cancel' ? 'Cancelled' : status}
    </Badge>
  );
}
