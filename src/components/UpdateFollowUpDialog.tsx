import { useState } from 'react';
import { Lead } from '@/types/lead';
import { useLeads } from '@/context/LeadContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CalendarClock } from 'lucide-react';
import { toast } from 'sonner';

export function UpdateFollowUpDialog({ lead }: { lead: Lead }) {
  const { updateLead, addFollowUp } = useLeads();
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(lead.nextFollowUpDate);
  const [note, setNote] = useState('');

  const handleSave = () => {
    if (!date) return;
    updateLead(lead.id, { nextFollowUpDate: date });
    if (note.trim()) {
      addFollowUp(lead.id, { date: new Date().toISOString().split('T')[0], note: note.trim() });
    }
    toast.success('Follow-up updated');
    setOpen(false);
    setNote('');
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
          <Button onClick={handleSave} className="w-full">Save</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
