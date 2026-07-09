import { useState } from 'react';
import { Lead } from '@/types/lead';
import { useLeads } from '@/context/LeadContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ChevronDown, TrendingUp, XCircle, Phone, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function QuickStatusUpdate({ lead }: { lead: Lead }) {
  const { updateLead } = useLeads();
  const [dialogType, setDialogType] = useState<'convert' | 'cancel' | null>(null);
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleConvert = async () => {
    if (!amount || isNaN(Number(amount))) {
      toast.error('Please enter a valid amount');
      return;
    }
    
    setIsLoading(true);
    try {
      await updateLead(lead.id, { status: 'Convert', amountReceived: Number(amount), nextFollowUpDate: '' });
      setDialogType(null);
      setAmount('');
    } catch (error) {
      // toast is handled in context
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!reason.trim()) {
      toast.error('Please enter a cancellation reason');
      return;
    }
    
    setIsLoading(true);
    try {
      await updateLead(lead.id, { status: 'Cancel', cancelReason: reason.trim() });
      setDialogType(null);
      setReason('');
    } catch (error) {
      // toast is handled in context
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" variant="outline">
            Status <ChevronDown className="w-3.5 h-3.5 ml-1" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setDialogType('convert')} className="text-success">
            <TrendingUp className="w-4 h-4 mr-2" /> Convert
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setDialogType('cancel')} className="text-destructive">
            <XCircle className="w-4 h-4 mr-2" /> Cancel
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={dialogType === 'convert'} onOpenChange={o => !o && setDialogType(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Convert Lead – {lead.customerName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label>Amount Received (₹)</Label>
              <Input type="number" placeholder="e.g. 25000" value={amount} onChange={e => setAmount(e.target.value)} />
            </div>
            <Button onClick={handleConvert} className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isLoading ? 'Converting...' : 'Mark as Converted'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogType === 'cancel'} onOpenChange={o => !o && setDialogType(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Lead – {lead.customerName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label>Cancellation Reason</Label>
              <Textarea placeholder="Why is this lead being cancelled?" value={reason} onChange={e => setReason(e.target.value)} />
            </div>
            <Button onClick={handleCancel} variant="destructive" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isLoading ? 'Cancelling...' : 'Mark as Cancelled'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
