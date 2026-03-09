import React, { createContext, useContext, useState, useCallback } from 'react';
import { Lead } from '@/types/lead';
import { getAllLeads, addLead as storageAddLead, updateLead as storageUpdateLead, deleteLead as storageDeleteLead, addFollowUp as storageAddFollowUp } from '@/lib/leadStore';
import type { FollowUpEntry } from '@/types/lead';

interface LeadContextType {
  leads: Lead[];
  refresh: () => void;
  addLead: (lead: Omit<Lead, 'id' | 'createdAt' | 'updatedAt' | 'followUpHistory'>) => Lead;
  updateLead: (id: string, updates: Partial<Lead>) => Lead | null;
  deleteLead: (id: string) => boolean;
  addFollowUp: (leadId: string, entry: Omit<FollowUpEntry, 'id'>) => Lead | null;
}

const LeadContext = createContext<LeadContextType | null>(null);

export function LeadProvider({ children }: { children: React.ReactNode }) {
  const [leads, setLeads] = useState<Lead[]>(() => getAllLeads());

  const refresh = useCallback(() => setLeads(getAllLeads()), []);

  const handleAdd = useCallback((lead: Omit<Lead, 'id' | 'createdAt' | 'updatedAt' | 'followUpHistory'>) => {
    const result = storageAddLead(lead);
    refresh();
    return result;
  }, [refresh]);

  const handleUpdate = useCallback((id: string, updates: Partial<Lead>) => {
    const result = storageUpdateLead(id, updates);
    refresh();
    return result;
  }, [refresh]);

  const handleDelete = useCallback((id: string) => {
    const result = storageDeleteLead(id);
    refresh();
    return result;
  }, [refresh]);

  const handleFollowUp = useCallback((leadId: string, entry: Omit<FollowUpEntry, 'id'>) => {
    const result = storageAddFollowUp(leadId, entry);
    refresh();
    return result;
  }, [refresh]);

  return (
    <LeadContext.Provider value={{ leads, refresh, addLead: handleAdd, updateLead: handleUpdate, deleteLead: handleDelete, addFollowUp: handleFollowUp }}>
      {children}
    </LeadContext.Provider>
  );
}

export function useLeads() {
  const ctx = useContext(LeadContext);
  if (!ctx) throw new Error('useLeads must be used within LeadProvider');
  return ctx;
}
