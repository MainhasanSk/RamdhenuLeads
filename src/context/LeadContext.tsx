import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { Lead } from '@/types/lead';
import * as leadService from '@/lib/leadService';
import type { FollowUpEntry } from '@/types/lead';
import { toast } from 'sonner';
import { useAuth } from './AuthContext';

interface LeadContextType {
  leads: Lead[];
  isLoading: boolean;
  refresh: () => Promise<void>;
  addLead: (lead: Omit<Lead, 'id' | 'createdAt' | 'updatedAt' | 'followUpHistory'> & { followUpHistory?: FollowUpEntry[] }) => Promise<Lead>;
  updateLead: (id: string, updates: Partial<Lead>) => Promise<void>;
  deleteLead: (id: string) => Promise<void>;
  addFollowUp: (leadId: string, entry: Omit<FollowUpEntry, 'id'>) => Promise<void>;
}

const LeadContext = createContext<LeadContextType | null>(null);

export function LeadProvider({ children }: { children: React.ReactNode }) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user, profile, isAdmin } = useAuth();

  const refresh = useCallback(async () => {
    if (!user) {
      setLeads([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      let data: Lead[];
      if (isAdmin) {
        data = await leadService.getAllLeads();
      } else {
        data = await leadService.getLeadsByUser(user.uid);
      }
      setLeads(data);
    } catch (error) {
      console.error('Failed to fetch leads:', error);
      toast.error('Failed to fetch leads. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  }, [user, isAdmin]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleAdd = useCallback(async (lead: Omit<Lead, 'id' | 'createdAt' | 'updatedAt' | 'followUpHistory'> & { followUpHistory?: FollowUpEntry[] }) => {
    try {
      const result = await leadService.addLead({
        ...lead,
        createdBy: user?.uid || '',
        createdByName: profile?.displayName || user?.email || '',
      });
      await refresh();
      toast.success('Lead added successfully');
      return result;
    } catch (error: any) {
      console.error('Failed to add lead:', error);
      const message = error.code === 'permission-denied' 
        ? 'Permission denied. Please check Firestore rules.' 
        : `Failed to add lead: ${error.message || 'Unknown error'}`;
      toast.error(message);
      throw error;
    }
  }, [refresh, user, profile]);

  const handleUpdate = useCallback(async (id: string, updates: Partial<Lead>) => {
    try {
      await leadService.updateLead(id, updates);
      await refresh();
      toast.success('Lead updated successfully');
    } catch (error) {
      console.error('Failed to update lead:', error);
      toast.error('Failed to update lead');
      throw error;
    }
  }, [refresh]);

  const handleDelete = useCallback(async (id: string) => {
    try {
      await leadService.deleteLead(id);
      await refresh();
      toast.success('Lead deleted successfully');
    } catch (error) {
      console.error('Failed to delete lead:', error);
      toast.error('Failed to delete lead');
      throw error;
    }
  }, [refresh]);

  const handleFollowUp = useCallback(async (leadId: string, entry: Omit<FollowUpEntry, 'id'>) => {
    try {
      await leadService.addFollowUp(leadId, entry);
      await refresh();
      toast.success('Follow-up added successfully');
    } catch (error) {
      console.error('Failed to add follow-up:', error);
      toast.error('Failed to add follow-up');
      throw error;
    }
  }, [refresh]);

  return (
    <LeadContext.Provider value={{ 
      leads, 
      isLoading,
      refresh, 
      addLead: handleAdd, 
      updateLead: handleUpdate, 
      deleteLead: handleDelete, 
      addFollowUp: handleFollowUp 
    }}>
      {children}
    </LeadContext.Provider>
  );
}

export function useLeads() {
  const ctx = useContext(LeadContext);
  if (!ctx) throw new Error('useLeads must be used within LeadProvider');
  return ctx;
}
