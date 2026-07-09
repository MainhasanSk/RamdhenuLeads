import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLeads } from '@/context/LeadContext';
import { useAuth } from '@/context/AuthContext';
import { SERVICE_OPTIONS, CampaignSource, ServiceType, LeadStatus } from '@/types/lead';
import { getActiveCampaigns, type Campaign } from '@/lib/campaignService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { UserPlus, Loader2, Star } from 'lucide-react';

export default function AddLead() {
  const navigate = useNavigate();
  const { addLead } = useLeads();
  const { profile, isAdmin } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeCampaigns, setActiveCampaigns] = useState<Campaign[]>([]);

  useEffect(() => {
    getActiveCampaigns().then(setActiveCampaigns).catch(console.error);
  }, []);

  // Filter campaigns: admin sees all active, telecaller sees only their allowed + active
  const campaignOptions = isAdmin
    ? activeCampaigns.map(c => c.name)
    : activeCampaigns.filter(c => profile?.allowedCampaigns?.includes(c.name)).map(c => c.name);
  const serviceOptions = isAdmin 
    ? SERVICE_OPTIONS 
    : SERVICE_OPTIONS.filter(s => profile?.allowedServices?.includes(s));
  const [form, setForm] = useState({
    inquiryDate: new Date().toISOString().split('T')[0],
    customerName: '',
    phoneNumber: '',
    campaignSource: '' as CampaignSource | '',
    serviceRequired: '' as ServiceType | '',
    customService: '',
    businessDetails: '',
    conversionChance: 3,
    nextFollowUpDate: '',
    status: 'Follow Up' as LeadStatus,
    amountReceived: '',
    cancelReason: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const isFollowUpDateRequired = form.status !== 'Convert';
    if (!form.customerName || !form.phoneNumber || !form.campaignSource || !form.serviceRequired || (isFollowUpDateRequired && !form.nextFollowUpDate)) {
      toast.error('Please fill all required fields');
      return;
    }
    
    const cleanPhone = form.phoneNumber.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      toast.error('Phone number must be exactly 10 digits');
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
        conversionChance: form.conversionChance,
        nextFollowUpDate: form.status === 'Convert' ? '' : form.nextFollowUpDate,
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
              <Input 
                type="tel" 
                placeholder="10-digit mobile number" 
                value={form.phoneNumber} 
                onChange={e => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                  setForm({ ...form, phoneNumber: val });
                }} 
                required 
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Campaign Source *</Label>
                <Select value={form.campaignSource} onValueChange={v => setForm({ ...form, campaignSource: v as CampaignSource })}>
                  <SelectTrigger><SelectValue placeholder="Select campaign" /></SelectTrigger>
                  <SelectContent>
                    {campaignOptions.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Service Required *</Label>
                <Select value={form.serviceRequired} onValueChange={v => setForm({ ...form, serviceRequired: v as ServiceType })}>
                  <SelectTrigger><SelectValue placeholder="Select service" /></SelectTrigger>
                  <SelectContent>
                    {serviceOptions.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
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
              <Label className="block mb-2">Conversion Chance</Label>
              <div className="flex items-center gap-1.5 bg-muted/30 p-3 rounded-lg border border-border/50 w-fit">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    type="button"
                    key={star}
                    onClick={() => setForm({ ...form, conversionChance: star })}
                    className="focus:outline-none group p-0.5"
                  >
                    <Star
                      className={`w-6 h-6 transition-all duration-150 ${
                        star <= form.conversionChance
                          ? 'fill-yellow-400 text-yellow-400 scale-105 filter drop-shadow-[0_0_2px_rgba(250,204,21,0.5)]'
                          : 'text-muted-foreground/30 hover:text-yellow-400/60 hover:scale-105'
                      }`}
                    />
                  </button>
                ))}
                <span className="text-xs font-medium text-muted-foreground ml-2">
                  {form.conversionChance === 1 && 'Very Low'}
                  {form.conversionChance === 2 && 'Low'}
                  {form.conversionChance === 3 && 'Medium'}
                  {form.conversionChance === 4 && 'High'}
                  {form.conversionChance === 5 && 'Very High'}
                </span>
              </div>
            </div>

            {form.status !== 'Convert' && (
              <div>
                <Label>Next Follow-up Date *</Label>
                <Input type="date" value={form.nextFollowUpDate} onChange={e => setForm({ ...form, nextFollowUpDate: e.target.value })} required />
              </div>
            )}

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
