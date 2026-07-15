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
    if (!date) {
      toast.error('Please select a next follow-up date');
      return;
    }
    if (!note.trim()) {
      toast.error('Please enter conversation details');
      return;
    }
    
    setIsLoading(true);
    try {
      await updateLead(lead.id, { nextFollowUpDate: date });
      await addFollowUp(lead.id, { 
        date: new Date().toISOString(), 
        note: note.trim() 
      });
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
            <Label>Next Follow-up Date *</Label>
            <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div>
            <Label>Conversation Details *</Label>
            <Textarea placeholder="Enter details of your conversation..." value={note} onChange={e => setNote(e.target.value)} />
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
