import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLeads } from '@/context/LeadContext';
import { useAuth } from '@/context/AuthContext';
import { CAMPAIGN_OPTIONS, SERVICE_OPTIONS, CampaignSource, ServiceType, LeadStatus } from '@/types/lead';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { UserPlus, Loader2 } from 'lucide-react';

export default function AddLead() {
  const navigate = useNavigate();
  const { addLead } = useLeads();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    inquiryDate: new Date().toISOString().split('T')[0],
    customerName: '',
    phoneNumber: '',
    campaignSource: '' as CampaignSource | '',
    serviceRequired: '' as ServiceType | '',
    customService: '',
    businessDetails: '',
    nextFollowUpDate: '',
    status: 'Follow Up' as LeadStatus,
    amountReceived: '',
    cancelReason: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customerName || !form.phoneNumber || !form.campaignSource || !form.serviceRequired || !form.nextFollowUpDate) {
      toast.error('Please fill all required fields');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const leadData: any = {
        inquiryDate: form.inquiryDate,
        customerName: form.customerName,
        phoneNumber: form.phoneNumber,
        campaignSource: form.campaignSource as CampaignSource,
        serviceRequired: form.serviceRequired as ServiceType,
        customService: form.customService,
        businessDetails: form.businessDetails,
        nextFollowUpDate: form.nextFollowUpDate,
        status: form.status,
      };

      if (form.status === 'Convert') {
        leadData.amountReceived = Number(form.amountReceived) || 0;
      } else if (form.status === 'Cancel') {
        leadData.cancelReason = form.cancelReason;
      }

      await addLead(leadData);
      // toast success is handled in context
      navigate('/leads');
    } catch (error) {
      // toast error is handled in context
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Add New Lead</h1>
        <p className="text-sm text-muted-foreground mt-1">Add a new inquiry to the system</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-primary" /> Lead Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Inquiry Date *</Label>
                <Input type="date" value={form.inquiryDate} onChange={e => setForm({ ...form, inquiryDate: e.target.value })} required />
              </div>
              <div>
                <Label>Customer Name *</Label>
                <Input placeholder="Full name" value={form.customerName} onChange={e => setForm({ ...form, customerName: e.target.value })} required />
              </div>
            </div>

            <div>
              <Label>Phone Number *</Label>
              <Input type="tel" placeholder="+91 XXXXX XXXXX" value={form.phoneNumber} onChange={e => setForm({ ...form, phoneNumber: e.target.value })} required />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Campaign Source *</Label>
                <Select value={form.campaignSource} onValueChange={v => setForm({ ...form, campaignSource: v as CampaignSource })}>
                  <SelectTrigger><SelectValue placeholder="Select campaign" /></SelectTrigger>
                  <SelectContent>
                    {CAMPAIGN_OPTIONS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Service Required *</Label>
                <Select value={form.serviceRequired} onValueChange={v => setForm({ ...form, serviceRequired: v as ServiceType })}>
                  <SelectTrigger><SelectValue placeholder="Select service" /></SelectTrigger>
                  <SelectContent>
                    {SERVICE_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {form.serviceRequired === 'Other' && (
              <div>
                <Label>Custom Service Name</Label>
                <Input placeholder="Enter service name" value={form.customService} onChange={e => setForm({ ...form, customService: e.target.value })} />
              </div>
            )}

            <div>
              <Label>Business Details</Label>
              <Textarea placeholder="e.g. Restaurant business wants Instagram marketing" value={form.businessDetails} onChange={e => setForm({ ...form, businessDetails: e.target.value })} />
            </div>

            <div>
              <Label>Next Follow-up Date *</Label>
              <Input type="date" value={form.nextFollowUpDate} onChange={e => setForm({ ...form, nextFollowUpDate: e.target.value })} required />
            </div>

            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={v => setForm({ ...form, status: v as LeadStatus })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Follow Up">Follow Up</SelectItem>
                  <SelectItem value="Convert">Convert</SelectItem>
                  <SelectItem value="Cancel">Cancel</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {form.status === 'Convert' && (
              <div>
                <Label>Amount Received (₹)</Label>
                <Input type="number" placeholder="Enter amount" value={form.amountReceived} onChange={e => setForm({ ...form, amountReceived: e.target.value })} />
              </div>
            )}

            {form.status === 'Cancel' && (
              <div>
                <Label>Cancellation Reason</Label>
                <Textarea placeholder="Reason for cancellation" value={form.cancelReason} onChange={e => setForm({ ...form, cancelReason: e.target.value })} />
              </div>
            )}

            <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="w-5 h-5 mr-2 animate-spin" />}
              {isSubmitting ? 'Adding...' : 'Add Lead'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
