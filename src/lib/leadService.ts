import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy,
  where,
  Timestamp,
  serverTimestamp,
  arrayUnion
} from 'firebase/firestore';
import { db } from './firebase';
import { Lead, FollowUpEntry } from '@/types/lead';

const LEADS_COLLECTION = 'leads';

const sanitizeData = (data: any) => {
  return Object.fromEntries(
    Object.entries(data).filter(([_, v]) => v !== undefined)
  );
};

const mapDocToLead = (id: string, data: any): Lead => ({
  ...data,
  id,
  createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
  updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : data.updatedAt,
});

export async function getAllLeads(): Promise<Lead[]> {
  const q = query(collection(db, LEADS_COLLECTION), orderBy('updatedAt', 'desc'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => mapDocToLead(doc.id, doc.data()));
}

export async function getLeadsByUser(userId: string): Promise<Lead[]> {
  const q = query(
    collection(db, LEADS_COLLECTION), 
    where('createdBy', '==', userId)
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs
    .map(doc => mapDocToLead(doc.id, doc.data()))
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

export async function addLead(lead: Omit<Lead, 'id' | 'createdAt' | 'updatedAt' | 'followUpHistory'> & { followUpHistory?: FollowUpEntry[]; createdBy: string; createdByName: string }): Promise<Lead> {
  const newLeadData = {
    ...lead,
    followUpHistory: lead.followUpHistory || [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  
  const docRef = await addDoc(collection(db, LEADS_COLLECTION), sanitizeData(newLeadData));
  
  return {
    ...lead,
    id: docRef.id,
    followUpHistory: lead.followUpHistory || [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export async function updateLead(id: string, updates: Partial<Lead>): Promise<void> {
  const docRef = doc(db, LEADS_COLLECTION, id);
  await updateDoc(docRef, sanitizeData({
    ...updates,
    updatedAt: serverTimestamp(),
  }));
}

export async function deleteLead(id: string): Promise<void> {
  const docRef = doc(db, LEADS_COLLECTION, id);
  await deleteDoc(docRef);
}

export async function addFollowUp(leadId: string, entry: Omit<FollowUpEntry, 'id'>): Promise<void> {
  const docRef = doc(db, LEADS_COLLECTION, leadId);
  const followUpWithId = {
    ...entry,
    id: crypto.randomUUID(),
  };
  
  await updateDoc(docRef, sanitizeData({
    followUpHistory: arrayUnion(followUpWithId),
    updatedAt: serverTimestamp(),
  }));
}
