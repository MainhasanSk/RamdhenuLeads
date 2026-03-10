import { Lead, FollowUpEntry } from '@/types/lead';

const STORAGE_KEY = 'junak_leads';

function getLeads(): Lead[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveLeads(leads: Lead[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(leads));
}

export function getAllLeads(): Lead[] {
  return getLeads();
}

export function addLead(lead: Omit<Lead, 'id' | 'createdAt' | 'updatedAt' | 'followUpHistory'>): Lead {
  const leads = getLeads();
  const newLead: Lead = {
    ...lead,
    id: crypto.randomUUID(),
    followUpHistory: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  leads.push(newLead);
  saveLeads(leads);
  return newLead;
}

export function updateLead(id: string, updates: Partial<Lead>): Lead | null {
  const leads = getLeads();
  const idx = leads.findIndex(l => l.id === id);
  if (idx === -1) return null;
  leads[idx] = { ...leads[idx], ...updates, updatedAt: new Date().toISOString() };
  saveLeads(leads);
  return leads[idx];
}

export function deleteLead(id: string): boolean {
  const leads = getLeads();
  const filtered = leads.filter(l => l.id !== id);
  if (filtered.length === leads.length) return false;
  saveLeads(filtered);
  return true;
}

export function addFollowUp(leadId: string, entry: Omit<FollowUpEntry, 'id'>): Lead | null {
  const leads = getLeads();
  const idx = leads.findIndex(l => l.id === leadId);
  if (idx === -1) return null;
  leads[idx].followUpHistory.push({ ...entry, id: crypto.randomUUID() });
  leads[idx].updatedAt = new Date().toISOString();
  saveLeads(leads);
  return leads[idx];
}

export function exportLeadsCSV(leads: Lead[]): string {
  const headers = ['Inquiry Date', 'Customer Name', 'Phone', 'Campaign', 'Service', 'Follow-up Date', 'Status', 'Amount', 'Cancel Reason'];
  const rows = leads.map(l => [
    l.inquiryDate, l.customerName, l.phoneNumber, l.campaignSource,
    l.serviceRequired === 'Other' ? l.customService || 'Other' : l.serviceRequired,
    l.nextFollowUpDate, l.status, l.amountReceived || '', l.cancelReason || '',
  ]);
  return [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n');
}
