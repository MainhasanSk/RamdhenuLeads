import { Lead } from '@/types/lead';
import { format, parseISO } from 'date-fns';
import { CheckCircle2, MessageSquare } from 'lucide-react';

export function FollowUpTimeline({ lead }: { lead: Lead }) {
  return (
    <div className="space-y-6 py-2">
      {/* Business Details Section */}
      <div className="bg-muted/40 rounded-lg p-4 border border-border/50">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Business Details</h4>
        <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
          {lead.businessDetails || 'No business details provided.'}
        </p>
      </div>

      {/* Conversation History Section */}
      <div className="space-y-4">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Conversation History</h4>
        
        {lead.followUpHistory.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center animate-pulse">No follow-up history yet</p>
        ) : (
          <div className="relative pl-6 space-y-4">
            <div className="absolute left-2.5 top-3 bottom-3 w-px bg-border" />
            {lead.followUpHistory.map((entry, i) => (
              <div key={entry.id} className="relative flex gap-3 items-start">
                <div className="absolute -left-3.5 w-5 h-5 rounded-full bg-card border-2 border-primary flex items-center justify-center">
                  {i === lead.followUpHistory.length - 1 && lead.status === 'Convert' ? (
                    <CheckCircle2 className="w-3 h-3 text-success" />
                  ) : (
                    <MessageSquare className="w-2.5 h-2.5 text-primary" />
                  )}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground font-medium">
                    {format(parseISO(entry.date), 'dd MMMM yyyy')}
                  </p>
                  <p className="text-sm text-foreground mt-0.5 whitespace-pre-wrap">
                    {entry.note}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
