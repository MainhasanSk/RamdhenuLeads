import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getAllUsers, createTelecallerAccount, toggleUserActive, deleteUserProfile, type AppUser } from '@/lib/userService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { UserPlus, Trash2, Loader2, Users, ShieldCheck, Phone as PhoneIcon, ToggleLeft, ToggleRight } from 'lucide-react';
import { Navigate } from 'react-router-dom';

export default function StaffPage() {
  const { isAdmin } = useAuth();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', displayName: '' });

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

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
  }, []);

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

    setIsCreating(true);
    try {
      await createTelecallerAccount(form.email, form.password, form.displayName);
      toast.success('Telecaller account created successfully');
      setForm({ email: '', password: '', displayName: '' });
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
          <DialogContent>
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
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12">
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        <p className="text-sm text-muted-foreground">Loading staff...</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No staff found</TableCell>
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
                      <Badge variant={u.isActive ? 'outline' : 'destructive'} className="text-xs">
                        {u.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {u.role !== 'admin' && (
                        <div className="flex gap-1">
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
    </div>
  );
}
