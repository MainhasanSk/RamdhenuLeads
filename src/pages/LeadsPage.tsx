import { useState, useMemo, useEffect } from 'react';
import { useLeads } from '@/context/LeadContext';
import { useAuth } from '@/context/AuthContext';
import { SERVICE_OPTIONS, ServiceType, LeadStatus, Lead } from '@/types/lead';
import { getAllCampaigns, type Campaign } from '@/lib/campaignService';
import { StatusBadge } from '@/components/StatusBadge';
import { UpdateFollowUpDialog } from '@/components/UpdateFollowUpDialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import { Search, Trash2, Edit, Phone, Download, History, Loader2 } from 'lucide-react';
import { exportLeadsCSV } from '@/lib/leadStore';
import { FollowUpTimeline } from '@/components/FollowUpTimeline';

export default function LeadsPage() {
  const { leads, updateLead, deleteLead, isLoading } = useLeads();
  const { isAdmin } = useAuth();
  const [search, setSearch] = useState('');
  const [filterCampaign, setFilterCampaign] = useState<string>('all');
  const [filterService, setFilterService] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [dbCampaigns, setDbCampaigns] = useState<Campaign[]>([]);

  const [editLead, setEditLead] = useState<Lead | null>(null);
  const [editForm, setEditForm] = useState<Partial<Lead>>({});
  const [historyLead, setHistoryLead] = useState<Lead | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

  useEffect(() => {
    getAllCampaigns().then(setDbCampaigns).catch(console.error);
  }, []);

  const filtered = useMemo(() => {
    return leads.filter(l => {
      const nameMatch = l.customerName ? String(l.customerName).toLowerCase().includes(search.toLowerCase()) : false;
      const phoneMatch = l.phoneNumber ? String(l.phoneNumber).includes(search) : false;
      if (search && !nameMatch && !phoneMatch) return false;
      if (filterCampaign !== 'all' && l.campaignSource !== filterCampaign) return false;
      if (filterService !== 'all' && l.serviceRequired !== filterService) return false;
      if (filterStatus !== 'all' && l.status !== filterStatus) return false;
      return true;
    }).sort((a, b) => {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return timeB - timeA;
    });
  }, [leads, search, filterCampaign, filterService, filterStatus]);

  const safeFormatDate = (dateString?: string, formatStr: string = 'dd MMM') => {
    if (!dateString) return '—';
    try {
      const parsed = parseISO(dateString);
      if (isNaN(parsed.getTime())) return 'Invalid';
      return format(parsed, formatStr);
    } catch {
      return 'Invalid';
    }
  };

  const handleEdit = (lead: Lead) => {
    setEditLead(lead);
    setEditForm({ ...lead });
  };

  const handleSaveEdit = async () => {
    if (!editLead) return;
    setIsActionLoading(true);
    try {
      await updateLead(editLead.id, editForm);
      setEditLead(null);
    } catch (error) {
      // toast is handled in context
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this lead?')) {
      setIsActionLoading(true);
      try {
        await deleteLead(id);
      } catch (error) {
        // toast is handled in context
      } finally {
        setIsActionLoading(false);
      }
    }
  };

  const handleExport = () => {
    const csv = exportLeadsCSV(leads);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Leads exported');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Leads Management</h1>
          <p className="text-sm text-muted-foreground mt-1">{filtered.length} leads found</p>
        </div>
        <Button variant="outline" onClick={handleExport}>
          <Download className="w-4 h-4 mr-2" />Export CSV
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search name or phone..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={filterCampaign} onValueChange={setFilterCampaign}>
              <SelectTrigger><SelectValue placeholder="All Campaigns" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Campaigns</SelectItem>
                {dbCampaigns.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterService} onValueChange={setFilterService}>
              <SelectTrigger><SelectValue placeholder="All Services" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Services</SelectItem>
                {SERVICE_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger><SelectValue placeholder="All Statuses" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Follow Up">Follow Up</SelectItem>
                <SelectItem value="Convert">Converted</SelectItem>
                <SelectItem value="Cancel">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Campaign</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Follow-up</TableHead>
                  <TableHead>Status</TableHead>
                    <TableHead>Amount</TableHead>
                    {isAdmin && <TableHead>Created By</TableHead>}
                    <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12">
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        <p className="text-sm text-muted-foreground">Loading leads...</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">No leads found</TableCell>
                  </TableRow>
                ) : filtered.map(l => (
                  <TableRow key={l.id}>
                    <TableCell className="text-sm">{safeFormatDate(l.inquiryDate)}</TableCell>
                    <TableCell className="font-medium">{l.customerName || '—'}</TableCell>
                    <TableCell>
                      {l.phoneNumber ? (
                        <a href={`tel:${l.phoneNumber}`} className="text-primary hover:underline flex items-center gap-1">
                          <Phone className="w-3 h-3" />{l.phoneNumber}
                        </a>
                      ) : '—'}
                    </TableCell>
                    <TableCell className="text-sm">{l.campaignSource || '—'}</TableCell>
                    <TableCell className="text-sm">{l.serviceRequired === 'Other' ? (l.customService || '—') : (l.serviceRequired || '—')}</TableCell>
                    <TableCell className="text-sm">{safeFormatDate(l.nextFollowUpDate)}</TableCell>
                    <TableCell><StatusBadge status={l.status} /></TableCell>
                    <TableCell>{l.amountReceived ? `₹${Number(l.amountReceived).toLocaleString('en-IN')}` : '—'}</TableCell>
                    {isAdmin && <TableCell className="text-sm text-muted-foreground">{l.createdByName || '—'}</TableCell>}
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" onClick={() => handleEdit(l)} title="Edit">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <UpdateFollowUpDialog lead={l} />
                        <Button size="icon" variant="ghost" onClick={() => setHistoryLead(l)} title="History">
                          <History className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => handleDelete(l.id)} className="text-destructive" title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editLead} onOpenChange={o => !o && setEditLead(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Lead</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Name</Label>
                <Input value={editForm.customerName || ''} onChange={e => setEditForm({ ...editForm, customerName: e.target.value })} />
              </div>
              <div>
                <Label>Phone</Label>
                <Input value={editForm.phoneNumber || ''} onChange={e => setEditForm({ ...editForm, phoneNumber: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={editForm.status} onValueChange={v => setEditForm({ ...editForm, status: v as LeadStatus })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Follow Up">Follow Up</SelectItem>
                  <SelectItem value="Convert">Convert</SelectItem>
                  <SelectItem value="Cancel">Cancel</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {editForm.status === 'Convert' && (
              <div>
                <Label>Amount Received (₹)</Label>
                <Input type="number" value={editForm.amountReceived || ''} onChange={e => setEditForm({ ...editForm, amountReceived: Number(e.target.value) })} />
              </div>
            )}
            {editForm.status === 'Cancel' && (
              <div>
                <Label>Cancel Reason</Label>
                <Textarea value={editForm.cancelReason || ''} onChange={e => setEditForm({ ...editForm, cancelReason: e.target.value })} />
              </div>
            )}
            <div>
              <Label>Next Follow-up Date</Label>
              <Input type="date" value={editForm.nextFollowUpDate || ''} onChange={e => setEditForm({ ...editForm, nextFollowUpDate: e.target.value })} />
            </div>
            <div>
              <Label>Business Details</Label>
              <Textarea value={editForm.businessDetails || ''} onChange={e => setEditForm({ ...editForm, businessDetails: e.target.value })} />
            </div>
            <Button onClick={handleSaveEdit} className="w-full" disabled={isActionLoading}>
              {isActionLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isActionLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={!!historyLead} onOpenChange={o => !o && setHistoryLead(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Follow-up History — {historyLead?.customerName}</DialogTitle>
          </DialogHeader>
          {historyLead && <FollowUpTimeline lead={historyLead} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
