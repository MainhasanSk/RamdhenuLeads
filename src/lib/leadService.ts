import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy,
  Timestamp,
  serverTimestamp,
  arrayUnion
} from 'firebase/firestore';
import { db } from './firebase';
import { Lead, FollowUpEntry } from '@/types/lead';

const LEADS_COLLECTION = 'leads';

// Firestore version 9+ doesn't allow 'undefined' fields.
// This helper removes any undefined fields from an object.
const sanitizeData = (data: any) => {
  return Object.fromEntries(
    Object.entries(data).filter(([_, v]) => v !== undefined)
  );
};

// Helper to convert Firestore data to Lead type
const mapDocToLead = (id: string, data: any): Lead => ({
  ...data,
  id,
  // Convert Firestore Timestamp to ISO string if needed
  createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
  updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : data.updatedAt,
});

export async function getAllLeads(): Promise<Lead[]> {
  const q = query(collection(db, LEADS_COLLECTION), orderBy('updatedAt', 'desc'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => mapDocToLead(doc.id, doc.data()));
}

export async function addLead(lead: Omit<Lead, 'id' | 'createdAt' | 'updatedAt' | 'followUpHistory'>): Promise<Lead> {
  const newLeadData = {
    ...lead,
    followUpHistory: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  
  const docRef = await addDoc(collection(db, LEADS_COLLECTION), sanitizeData(newLeadData));
  
  return {
    ...lead,
    id: docRef.id,
    followUpHistory: [],
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
