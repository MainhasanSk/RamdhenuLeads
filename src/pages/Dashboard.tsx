import { useMemo } from 'react';
import { useLeads } from '@/context/LeadContext';
import { format, isToday, isBefore, startOfDay, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { Phone, CalendarClock, TrendingUp, Users, IndianRupee, XCircle, AlertTriangle } from 'lucide-react';
import { StatusBadge } from '@/components/StatusBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { UpdateFollowUpDialog } from '@/components/UpdateFollowUpDialog';

export default function Dashboard() {
  const { leads } = useLeads();
  const today = startOfDay(new Date());
  const monthStart = startOfMonth(new Date());
  const monthEnd = endOfMonth(new Date());

  const todaysFollowUps = useMemo(() =>
    leads.filter(l => l.status === 'Follow Up' && isToday(parseISO(l.nextFollowUpDate))),
    [leads]
  );

  const missedFollowUps = useMemo(() =>
    leads.filter(l => l.status === 'Follow Up' && isBefore(parseISO(l.nextFollowUpDate), today)),
    [leads, today]
  );

  const monthlyConverted = useMemo(() =>
    leads.filter(l => {
      if (l.status !== 'Convert') return false;
      const d = parseISO(l.updatedAt);
      return d >= monthStart && d <= monthEnd;
    }),
    [leads, monthStart, monthEnd]
  );

  const totalRevenue = useMemo(() =>
    monthlyConverted.reduce((s, l) => s + (l.amountReceived || 0), 0),
    [monthlyConverted]
  );

  const cancelledLeads = useMemo(() =>
    leads.filter(l => l.status === 'Cancel'),
    [leads]
  );

  const cancelReasons = useMemo(() => {
    const map: Record<string, number> = {};
    cancelledLeads.forEach(l => {
      const r = l.cancelReason || 'Unknown';
      map[r] = (map[r] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [cancelledLeads]);

  // Weekly revenue chart
  const weeklyRevenue = useMemo(() => {
    const weeks: { name: string; revenue: number }[] = [
      { name: 'Week 1', revenue: 0 },
      { name: 'Week 2', revenue: 0 },
      { name: 'Week 3', revenue: 0 },
      { name: 'Week 4', revenue: 0 },
    ];
    monthlyConverted.forEach(l => {
      const day = parseISO(l.updatedAt).getDate();
      const wi = Math.min(Math.floor((day - 1) / 7), 3);
      weeks[wi].revenue += l.amountReceived || 0;
    });
    return weeks;
  }, [monthlyConverted]);

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Welcome back! Here's your lead overview.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card-stat">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Today's Follow-ups</p>
            <CalendarClock className="w-5 h-5 text-warning" />
          </div>
          <p className="text-3xl font-bold mt-2">{todaysFollowUps.length}</p>
        </div>
        <div className="card-stat">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Missed Follow-ups</p>
            <AlertTriangle className="w-5 h-5 text-destructive" />
          </div>
          <p className="text-3xl font-bold mt-2">{missedFollowUps.length}</p>
        </div>
        <div className="card-stat">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Conversions (Month)</p>
            <TrendingUp className="w-5 h-5 text-success" />
          </div>
          <p className="text-3xl font-bold mt-2">{monthlyConverted.length}</p>
        </div>
        <div className="card-stat">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Revenue (Month)</p>
            <IndianRupee className="w-5 h-5 text-primary" />
          </div>
          <p className="text-3xl font-bold mt-2">₹{totalRevenue.toLocaleString('en-IN')}</p>
        </div>
      </div>

      {/* Today's Follow Ups */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <CalendarClock className="w-5 h-5 text-warning" /> Today's Follow-ups
          </CardTitle>
        </CardHeader>
        <CardContent>
          {todaysFollowUps.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No follow-ups scheduled for today 🎉</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Campaign</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {todaysFollowUps.map(l => (
                    <TableRow key={l.id}>
                      <TableCell className="font-medium">{l.customerName}</TableCell>
                      <TableCell>{l.phoneNumber}</TableCell>
                      <TableCell>{l.campaignSource}</TableCell>
                      <TableCell>{l.serviceRequired === 'Other' ? l.customService : l.serviceRequired}</TableCell>
                      <TableCell><StatusBadge status={l.status} /></TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" asChild>
                            <a href={`tel:${l.phoneNumber}`}><Phone className="w-3.5 h-3.5 mr-1" />Call</a>
                          </Button>
                          <UpdateFollowUpDialog lead={l} />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Missed Follow Ups */}
      {missedFollowUps.length > 0 && (
        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg text-destructive">
              <AlertTriangle className="w-5 h-5" /> Missed Follow-ups
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Campaign</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Missed Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {missedFollowUps.map(l => (
                    <TableRow key={l.id} className="missed-row">
                      <TableCell className="font-medium">{l.customerName}</TableCell>
                      <TableCell>{l.phoneNumber}</TableCell>
                      <TableCell>{l.campaignSource}</TableCell>
                      <TableCell>{l.serviceRequired === 'Other' ? l.customService : l.serviceRequired}</TableCell>
                      <TableCell className="text-destructive font-medium">{format(parseISO(l.nextFollowUpDate), 'dd MMM yyyy')}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" asChild>
                            <a href={`tel:${l.phoneNumber}`}><Phone className="w-3.5 h-3.5 mr-1" />Call</a>
                          </Button>
                          <UpdateFollowUpDialog lead={l} />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Monthly Revenue Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Monthly Revenue</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyRevenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                  formatter={(value: number) => [`₹${value.toLocaleString('en-IN')}`, 'Revenue']}
                />
                <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Cancelled Leads */}
      {cancelledLeads.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <XCircle className="w-5 h-5 text-destructive" /> Cancelled Leads
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Service</TableHead>
                      <TableHead>Reason</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cancelledLeads.slice(0, 5).map(l => (
                      <TableRow key={l.id}>
                        <TableCell className="font-medium">{l.customerName}</TableCell>
                        <TableCell>{l.serviceRequired === 'Other' ? l.customService : l.serviceRequired}</TableCell>
                        <TableCell className="text-muted-foreground text-sm">{l.cancelReason || 'N/A'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Top Cancel Reasons</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {cancelReasons.map(([reason, count]) => {
                  const pct = Math.round((count / cancelledLeads.length) * 100);
                  return (
                    <div key={reason}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-foreground">{reason}</span>
                        <span className="text-muted-foreground">{pct}%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-destructive rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
                {cancelReasons.length === 0 && <p className="text-sm text-muted-foreground">No data yet</p>}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
