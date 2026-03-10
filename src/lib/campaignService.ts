import { 
  collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy, serverTimestamp, Timestamp 
} from 'firebase/firestore';
import { db } from './firebase';

const CAMPAIGNS_COLLECTION = 'campaigns';

export interface Campaign {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
}

export async function getAllCampaigns(): Promise<Campaign[]> {
  const q = query(collection(db, CAMPAIGNS_COLLECTION), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map(d => {
    const data = d.data();
    return {
      id: d.id,
      name: data.name,
      isActive: data.isActive ?? true,
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
    };
  });
}

export async function getActiveCampaigns(): Promise<Campaign[]> {
  const all = await getAllCampaigns();
  return all.filter(c => c.isActive);
}

export async function addCampaign(name: string): Promise<Campaign> {
  const docRef = await addDoc(collection(db, CAMPAIGNS_COLLECTION), {
    name,
    isActive: true,
    createdAt: serverTimestamp(),
  });
  return { id: docRef.id, name, isActive: true, createdAt: new Date().toISOString() };
}

export async function toggleCampaignActive(id: string, isActive: boolean): Promise<void> {
  await updateDoc(doc(db, CAMPAIGNS_COLLECTION, id), { isActive });
}

export async function deleteCampaign(id: string): Promise<void> {
  await deleteDoc(doc(db, CAMPAIGNS_COLLECTION, id));
}
