import { useState } from 'react';
import { Lead } from '@/types/lead';
import { useLeads } from '@/context/LeadContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CalendarClock, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function UpdateFollowUpDialog({ lead }: { lead: Lead }) {
  const { updateLead, addFollowUp } = useLeads();
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(lead.nextFollowUpDate);
  const [note, setNote] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (!date) return;
    
    setIsLoading(true);
    try {
      await updateLead(lead.id, { nextFollowUpDate: date });
      if (note.trim()) {
        await addFollowUp(lead.id, { date: new Date().toISOString().split('T')[0], note: note.trim() });
      }
      setOpen(false);
      setNote('');
    } catch (error) {
      // toast is handled in context
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <CalendarClock className="w-3.5 h-3.5 mr-1" />Update
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Follow-up for {lead.customerName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div>
            <Label>Next Follow-up Date</Label>
            <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div>
            <Label>Note (optional)</Label>
            <Textarea placeholder="Add a note about this follow-up..." value={note} onChange={e => setNote(e.target.value)} />
          </div>
          <Button onClick={handleSave} className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isLoading ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
