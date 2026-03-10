import { useMemo } from 'react';
import { useLeads } from '@/context/LeadContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { Loader2 } from 'lucide-react';

const COLORS = ['hsl(217,91%,50%)', 'hsl(142,71%,45%)', 'hsl(38,92%,50%)', 'hsl(0,72%,51%)', 'hsl(262,83%,58%)', 'hsl(199,89%,48%)', 'hsl(25,95%,53%)'];

export default function ReportsPage() {
  const { leads, isLoading } = useLeads();
  const monthStart = startOfMonth(new Date());
  const monthEnd = endOfMonth(new Date());

  const campaignData = useMemo(() => {
    const map: Record<string, number> = {};
    leads.forEach(l => { map[l.campaignSource] = (map[l.campaignSource] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [leads]);

  const conversionData = useMemo(() => {
    const total = leads.length;
    const converted = leads.filter(l => l.status === 'Convert').length;
    const followUp = leads.filter(l => l.status === 'Follow Up').length;
    const cancelled = leads.filter(l => l.status === 'Cancel').length;
    return [
      { name: 'Converted', value: converted },
      { name: 'Follow Up', value: followUp },
      { name: 'Cancelled', value: cancelled },
    ].filter(d => d.value > 0);
  }, [leads]);

  const monthlyConverted = useMemo(() =>
    leads.filter(l => {
      if (l.status !== 'Convert') return false;
      const d = parseISO(l.updatedAt);
      return d >= monthStart && d <= monthEnd;
    }), [leads, monthStart, monthEnd]);

  const weeklyRevenue = useMemo(() => {
    const weeks = [
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

  const cancelReasons = useMemo(() => {
    const cancelled = leads.filter(l => l.status === 'Cancel');
    const map: Record<string, number> = {};
    cancelled.forEach(l => { const r = l.cancelReason || 'Unknown'; map[r] = (map[r] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value, pct: Math.round((value / (cancelled.length || 1)) * 100) })).sort((a, b) => b.value - a.value);
  }, [leads]);

  const totalLeads = leads.length;
  const convertedCount = leads.filter(l => l.status === 'Convert').length;
  const conversionRate = totalLeads ? Math.round((convertedCount / totalLeads) * 100) : 0;

  if (isLoading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse">Analyzing CRM Data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Reports & Analytics</h1>
        <p className="text-sm text-muted-foreground mt-1">Insights into your lead pipeline</p>
      </div>

      {/* Stat row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card-stat">
          <p className="text-sm text-muted-foreground">Total Leads</p>
          <p className="text-3xl font-bold mt-1">{totalLeads}</p>
        </div>
        <div className="card-stat">
          <p className="text-sm text-muted-foreground">Converted</p>
          <p className="text-3xl font-bold mt-1 text-success">{convertedCount}</p>
        </div>
        <div className="card-stat">
          <p className="text-sm text-muted-foreground">Conversion Rate</p>
          <p className="text-3xl font-bold mt-1 text-primary">{conversionRate}%</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <Card>
          <CardHeader><CardTitle className="text-lg">Monthly Revenue</CardTitle></CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip formatter={(v: number) => [`₹${v.toLocaleString('en-IN')}`, 'Revenue']} />
                  <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Campaign Performance */}
        <Card>
          <CardHeader><CardTitle className="text-lg">Campaign Performance</CardTitle></CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={campaignData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={120} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Conversion Pie */}
        <Card>
          <CardHeader><CardTitle className="text-lg">Lead Status Distribution</CardTitle></CardHeader>
          <CardContent>
            <div className="h-64">
              {conversionData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={conversionData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {conversionData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Legend />
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">No data yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Cancel Reasons */}
        <Card>
          <CardHeader><CardTitle className="text-lg">Cancellation Analysis</CardTitle></CardHeader>
          <CardContent>
            {cancelReasons.length > 0 ? (
              <div className="space-y-3">
                {cancelReasons.map(r => (
                  <div key={r.name}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-foreground">{r.name}</span>
                      <span className="text-muted-foreground">{r.pct}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-destructive rounded-full transition-all" style={{ width: `${r.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No cancellations yet</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
