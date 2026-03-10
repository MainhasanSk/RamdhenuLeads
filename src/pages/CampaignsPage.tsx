import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getAllCampaigns, addCampaign, toggleCampaignActive, deleteCampaign, type Campaign } from '@/lib/campaignService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Trash2, Loader2, Megaphone, ToggleLeft, ToggleRight } from 'lucide-react';
import { Navigate } from 'react-router-dom';

export default function CampaignsPage() {
  const { isAdmin } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [newName, setNewName] = useState('');

  const fetchCampaigns = async () => {
    setIsLoading(true);
    try {
      const data = await getAllCampaigns();
      setCampaigns(data);
    } catch (error) {
      console.error('Failed to fetch campaigns:', error);
      toast.error('Failed to fetch campaigns');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      toast.error('Please enter a campaign name');
      return;
    }
    const exists = campaigns.some(c => c.name.toLowerCase() === newName.trim().toLowerCase());
    if (exists) {
      toast.error('Campaign already exists');
      return;
    }

    setIsCreating(true);
    try {
      await addCampaign(newName.trim());
      toast.success('Campaign added successfully');
      setNewName('');
      setShowDialog(false);
      await fetchCampaigns();
    } catch (error) {
      toast.error('Failed to add campaign');
    } finally {
      setIsCreating(false);
    }
  };

  const handleToggle = async (campaign: Campaign) => {
    try {
      await toggleCampaignActive(campaign.id, !campaign.isActive);
      toast.success(`${campaign.name} ${campaign.isActive ? 'stopped' : 'started'}`);
      await fetchCampaigns();
    } catch (error) {
      toast.error('Failed to update campaign');
    }
  };

  const handleDelete = async (campaign: Campaign) => {
    if (!confirm(`Are you sure you want to delete "${campaign.name}"?`)) return;
    try {
      await deleteCampaign(campaign.id);
      toast.success('Campaign deleted');
      await fetchCampaigns();
    } catch (error) {
      toast.error('Failed to delete campaign');
    }
  };

  const activeCampaigns = campaigns.filter(c => c.isActive);
  const stoppedCampaigns = campaigns.filter(c => !c.isActive);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Campaign Management</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {activeCampaigns.length} running, {stoppedCampaigns.length} stopped
          </p>
        </div>
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" /> Add Campaign
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Campaign</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 mt-2">
              <div>
                <Label>Campaign Name *</Label>
                <Input
                  placeholder="e.g. UGC Social Media"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isCreating}>
                {isCreating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {isCreating ? 'Adding...' : 'Add Campaign'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Megaphone className="w-5 h-5 text-primary" /> All Campaigns
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campaign Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-12">
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        <p className="text-sm text-muted-foreground">Loading campaigns...</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : campaigns.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      No campaigns yet. Add your first campaign to get started.
                    </TableCell>
                  </TableRow>
                ) : campaigns.map(c => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell>
                      <Badge variant={c.isActive ? 'default' : 'secondary'} className="text-xs">
                        {c.isActive ? '🟢 Running' : '🔴 Stopped'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleToggle(c)}
                          title={c.isActive ? 'Stop Campaign' : 'Start Campaign'}
                        >
                          {c.isActive 
                            ? <ToggleRight className="w-4 h-4 text-green-600" /> 
                            : <ToggleLeft className="w-4 h-4 text-muted-foreground" />
                          }
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDelete(c)}
                          className="text-destructive"
                          title="Delete"
                        >
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
    </div>
  );
}
