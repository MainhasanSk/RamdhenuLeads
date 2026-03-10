import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLeads } from '@/context/LeadContext';
import { getAllUsers, createTelecallerAccount, toggleUserActive, deleteUserProfile, updateUserFields, type AppUser } from '@/lib/userService';
import { SERVICE_OPTIONS } from '@/types/lead';
import { getAllCampaigns, type Campaign } from '@/lib/campaignService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { StatusBadge } from '@/components/StatusBadge';
import { toast } from 'sonner';
import { UserPlus, Trash2, Loader2, Users, ShieldCheck, ToggleLeft, ToggleRight, Pencil, Eye, IndianRupee, TrendingUp } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { startOfMonth, endOfMonth, parseISO, format } from 'date-fns';

export default function StaffPage() {
  const { isAdmin } = useAuth();
  const { leads } = useLeads();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', displayName: '' });
  const [selectedCampaigns, setSelectedCampaigns] = useState<string[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [dbCampaigns, setDbCampaigns] = useState<Campaign[]>([]);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [editName, setEditName] = useState('');
  const [editCampaigns, setEditCampaigns] = useState<string[]>([]);
  const [editServices, setEditServices] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [viewingUser, setViewingUser] = useState<AppUser | null>(null);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const data = await getAllUsers();
      setUsers(data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast.error('Failed to fetch staff');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    getAllCampaigns().then(setDbCampaigns).catch(console.error);
  }, []);

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.password || !form.displayName) {
      toast.error('Please fill all fields');
      return;
    }
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (selectedCampaigns.length === 0) {
      toast.error('Please select at least one campaign source');
      return;
    }
    if (selectedServices.length === 0) {
      toast.error('Please select at least one service');
      return;
    }

    setIsCreating(true);
    try {
      await createTelecallerAccount(form.email, form.password, form.displayName, selectedCampaigns, selectedServices);
      toast.success('Telecaller account created successfully');
      setForm({ email: '', password: '', displayName: '' });
      setSelectedCampaigns([]);
      setSelectedServices([]);
      setShowDialog(false);
      await fetchUsers();
    } catch (error: any) {
      console.error('Failed to create telecaller:', error);
      if (error.code === 'auth/email-already-in-use') {
        toast.error('This email is already in use');
      } else {
        toast.error(`Failed to create account: ${error.message}`);
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleToggleActive = async (user: AppUser) => {
    try {
      await toggleUserActive(user.uid, !user.isActive);
      toast.success(`${user.displayName} ${user.isActive ? 'deactivated' : 'activated'}`);
      await fetchUsers();
    } catch (error) {
      toast.error('Failed to update user');
    }
  };

  const handleDelete = async (user: AppUser) => {
    if (user.role === 'admin') {
      toast.error('Cannot delete admin account');
      return;
    }
    if (!confirm(`Are you sure you want to delete ${user.displayName}?`)) return;
    try {
      await deleteUserProfile(user.uid);
      toast.success('User profile deleted');
      await fetchUsers();
    } catch (error) {
      toast.error('Failed to delete user');
    }
  };

  const toggleCampaign = (campaign: string) => {
    setSelectedCampaigns(prev =>
      prev.includes(campaign) ? prev.filter(c => c !== campaign) : [...prev, campaign]
    );
  };

  const toggleService = (service: string) => {
    setSelectedServices(prev =>
      prev.includes(service) ? prev.filter(s => s !== service) : [...prev, service]
    );
  };

  const openEdit = (user: AppUser) => {
    setEditingUser(user);
    setEditName(user.displayName);
    setEditCampaigns(user.allowedCampaigns || []);
    setEditServices(user.allowedServices || []);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    if (editCampaigns.length === 0) { toast.error('Select at least one campaign'); return; }
    if (editServices.length === 0) { toast.error('Select at least one service'); return; }
    setIsSaving(true);
    try {
      await updateUserFields(editingUser.uid, {
        displayName: editName,
        allowedCampaigns: editCampaigns,
        allowedServices: editServices,
      });
      toast.success('Staff updated successfully');
      setEditingUser(null);
      await fetchUsers();
    } catch (error) {
      toast.error('Failed to update staff');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleEditCampaign = (c: string) => setEditCampaigns(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]);
  const toggleEditService = (s: string) => setEditServices(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);

  const admins = users.filter(u => u.role === 'admin');
  const telecallers = users.filter(u => u.role === 'telecaller');

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Staff Management</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage telecaller accounts ({telecallers.length} telecallers, {admins.length} admins)
          </p>
        </div>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="w-4 h-4 mr-2" /> Add Telecaller
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Create Telecaller Account</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 mt-2">
              <div>
                <Label>Display Name *</Label>
                <Input 
                  placeholder="e.g. Rahul Sharma" 
                  value={form.displayName} 
                  onChange={e => setForm({ ...form, displayName: e.target.value })}
                  required 
                />
              </div>
              <div>
                <Label>Email *</Label>
                <Input 
                  type="email" 
                  placeholder="telecaller@junak.com" 
                  value={form.email} 
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  required 
                />
              </div>
              <div>
                <Label>Password *</Label>
                <Input 
                  type="password" 
                  placeholder="Min 6 characters" 
                  value={form.password} 
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  required 
                  minLength={6}
                />
              </div>

              <div>
                <Label className="mb-2 block">Allowed Campaign Sources *</Label>
                <div className="grid grid-cols-2 gap-2 border rounded-md p-3 bg-muted/30">
                  {dbCampaigns.map(campaign => (
                    <label key={campaign.id} className="flex items-center gap-2 text-sm cursor-pointer">
                      <Checkbox
                        checked={selectedCampaigns.includes(campaign.name)}
                        onCheckedChange={() => toggleCampaign(campaign.name)}
                      />
                      <span className={!campaign.isActive ? 'line-through text-muted-foreground' : ''}>
                        {campaign.name} {!campaign.isActive && '(stopped)'}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <Label className="mb-2 block">Allowed Services *</Label>
                <div className="grid grid-cols-2 gap-2 border rounded-md p-3 bg-muted/30">
                  {SERVICE_OPTIONS.map(service => (
                    <label key={service} className="flex items-center gap-2 text-sm cursor-pointer">
                      <Checkbox
                        checked={selectedServices.includes(service)}
                        onCheckedChange={() => toggleService(service)}
                      />
                      {service}
                    </label>
                  ))}
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isCreating}>
                {isCreating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {isCreating ? 'Creating...' : 'Create Account'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Users className="w-5 h-5 text-primary" /> All Staff
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Campaigns</TableHead>
                  <TableHead>Services</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12">
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        <p className="text-sm text-muted-foreground">Loading staff...</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No staff found</TableCell>
                  </TableRow>
                ) : users.map(u => (
                  <TableRow key={u.uid}>
                    <TableCell className="font-medium">{u.displayName}</TableCell>
                    <TableCell className="text-sm">{u.email}</TableCell>
                    <TableCell>
                      <Badge variant={u.role === 'admin' ? 'default' : 'secondary'} className="capitalize">
                        {u.role === 'admin' && <ShieldCheck className="w-3 h-3 mr-1" />}
                        {u.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {u.role === 'admin' ? (
                          <span className="text-xs text-muted-foreground">All</span>
                        ) : (u.allowedCampaigns || []).length > 0 ? (
                          (u.allowedCampaigns || []).map(c => (
                            <Badge key={c} variant="outline" className="text-[10px] px-1.5 py-0">{c}</Badge>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground">None</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {u.role === 'admin' ? (
                          <span className="text-xs text-muted-foreground">All</span>
                        ) : (u.allowedServices || []).length > 0 ? (
                          (u.allowedServices || []).map(s => (
                            <Badge key={s} variant="outline" className="text-[10px] px-1.5 py-0">{s}</Badge>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground">None</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={u.isActive ? 'outline' : 'destructive'} className="text-xs">
                        {u.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                    {u.role !== 'admin' && (
                        <div className="flex gap-1">
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            onClick={() => openEdit(u)} 
                            title="Edit"
                          >
                            <Pencil className="w-4 h-4 text-primary" />
                          </Button>
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            onClick={() => handleToggleActive(u)} 
                            title={u.isActive ? 'Deactivate' : 'Activate'}
                          >
                            {u.isActive ? <ToggleRight className="w-4 h-4 text-success" /> : <ToggleLeft className="w-4 h-4 text-muted-foreground" />}
                          </Button>
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            onClick={() => handleDelete(u)} 
                            className="text-destructive"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingUser} onOpenChange={open => !open && setEditingUser(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Staff: {editingUser?.displayName}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveEdit} className="space-y-4 mt-2">
            <div>
              <Label>Display Name *</Label>
              <Input value={editName} onChange={e => setEditName(e.target.value)} required />
            </div>
            <div>
              <Label className="mb-2 block">Allowed Campaign Sources *</Label>
              <div className="grid grid-cols-2 gap-2 border rounded-md p-3 bg-muted/30">
                {dbCampaigns.map(campaign => (
                  <label key={campaign.id} className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox
                      checked={editCampaigns.includes(campaign.name)}
                      onCheckedChange={() => toggleEditCampaign(campaign.name)}
                    />
                    <span className={!campaign.isActive ? 'line-through text-muted-foreground' : ''}>
                      {campaign.name} {!campaign.isActive && '(stopped)'}
                    </span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <Label className="mb-2 block">Allowed Services *</Label>
              <div className="grid grid-cols-2 gap-2 border rounded-md p-3 bg-muted/30">
                {SERVICE_OPTIONS.map(service => (
                  <label key={service} className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox
                      checked={editServices.includes(service)}
                      onCheckedChange={() => toggleEditService(service)}
                    />
                    {service}
                  </label>
                ))}
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={isSaving}>
              {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Telecaller Leads Dialog */}
      <TelecallerLeadsDialog 
        user={viewingUser} 
        leads={leads} 
        onClose={() => setViewingUser(null)} 
      />
    </div>
  );
}

function TelecallerLeadsDialog({ user, leads, onClose }: { user: AppUser | null; leads: any[]; onClose: () => void }) {
  const monthStart = startOfMonth(new Date());
  const monthEnd = endOfMonth(new Date());

  const userLeads = useMemo(() => {
    if (!user) return [];
    return leads.filter(l => l.createdBy === user.uid);
  }, [leads, user]);

  const stats = useMemo(() => {
    const total = userLeads.length;
    const converted = userLeads.filter(l => l.status === 'Convert').length;
    const followUp = userLeads.filter(l => l.status === 'Follow Up').length;
    const cancelled = userLeads.filter(l => l.status === 'Cancel').length;
    const totalRevenue = userLeads.reduce((sum, l) => sum + (l.amountReceived || 0), 0);
    const monthlyLeads = userLeads.filter(l => {
      const d = parseISO(l.updatedAt);
      return d >= monthStart && d <= monthEnd;
    });
    const monthlyRevenue = monthlyLeads
      .filter(l => l.status === 'Convert')
      .reduce((sum, l) => sum + (l.amountReceived || 0), 0);
    const monthlyConverted = monthlyLeads.filter(l => l.status === 'Convert').length;
    return { total, converted, followUp, cancelled, totalRevenue, monthlyRevenue, monthlyConverted, monthlyLeadsCount: monthlyLeads.length };
  }, [userLeads, monthStart, monthEnd]);

  if (!user) return null;

  return (
    <Dialog open={!!user} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-primary" />
            {user.displayName}'s Performance
          </DialogTitle>
        </DialogHeader>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2">
          <div className="rounded-lg border bg-card p-3 text-center">
            <p className="text-xs text-muted-foreground">Total Leads</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>
          <div className="rounded-lg border bg-card p-3 text-center">
            <p className="text-xs text-muted-foreground">Converted</p>
            <p className="text-2xl font-bold text-success">{stats.converted}</p>
          </div>
          <div className="rounded-lg border bg-card p-3 text-center">
            <p className="text-xs text-muted-foreground">Follow Up</p>
            <p className="text-2xl font-bold text-warning">{stats.followUp}</p>
          </div>
          <div className="rounded-lg border bg-card p-3 text-center">
            <p className="text-xs text-muted-foreground">Cancelled</p>
            <p className="text-2xl font-bold text-destructive">{stats.cancelled}</p>
          </div>
        </div>

        {/* Monthly Revenue */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-lg border bg-card p-4 flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/10">
              <IndianRupee className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Revenue</p>
              <p className="text-xl font-bold">₹{stats.totalRevenue.toLocaleString('en-IN')}</p>
            </div>
          </div>
          <div className="rounded-lg border bg-card p-4 flex items-center gap-3">
            <div className="p-2 rounded-full bg-success/10">
              <TrendingUp className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{format(new Date(), 'MMMM yyyy')} Revenue</p>
              <p className="text-xl font-bold text-success">₹{stats.monthlyRevenue.toLocaleString('en-IN')}</p>
              <p className="text-[10px] text-muted-foreground">{stats.monthlyConverted} converted / {stats.monthlyLeadsCount} leads</p>
            </div>
          </div>
        </div>

        {/* Leads Table */}
        <div className="mt-2">
          <h3 className="text-sm font-semibold mb-2">All Leads ({userLeads.length})</h3>
          <div className="overflow-x-auto border rounded-lg max-h-[300px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Customer</TableHead>
                  <TableHead className="text-xs">Phone</TableHead>
                  <TableHead className="text-xs">Service</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-xs">Amount</TableHead>
                  <TableHead className="text-xs">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {userLeads.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-8">No leads found</TableCell>
                  </TableRow>
                ) : userLeads.map(lead => (
                  <TableRow key={lead.id}>
                    <TableCell className="text-xs font-medium">{lead.customerName}</TableCell>
                    <TableCell className="text-xs">{lead.phoneNumber}</TableCell>
                    <TableCell className="text-xs">{lead.serviceRequired}</TableCell>
                    <TableCell><StatusBadge status={lead.status} /></TableCell>
                    <TableCell className="text-xs">
                      {lead.status === 'Convert' ? `₹${(lead.amountReceived || 0).toLocaleString('en-IN')}` : '-'}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {format(parseISO(lead.inquiryDate), 'dd MMM yyyy')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
