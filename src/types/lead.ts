export type LeadStatus = 'Follow Up' | 'Convert' | 'Cancel';

export type CampaignSource =
  | 'UGC Social Media'
  | 'UGC QR'
  | 'UGC Brand Building'
  | 'Podcast'
  | 'Voice Over Magazine'
  | 'Website'
  | 'Other';

export type ServiceType =
  | 'Social Media Marketing'
  | 'Digital Marketing'
  | 'Website Development'
  | 'App Development'
  | 'GMB'
  | 'SEO'
  | 'UGC Video'
  | 'Magazine'
  | 'Podcast'
  | 'Other';

export interface FollowUpEntry {
  id: string;
  date: string;
  note: string;
}

export interface Lead {
  id: string;
  inquiryDate: string;
  customerName: string;
  phoneNumber: string;
  campaignSource: CampaignSource;
  serviceRequired: ServiceType;
  customService?: string;
  businessDetails: string;
  nextFollowUpDate: string;
  status: LeadStatus;
  amountReceived?: number;
  cancelReason?: string;
  followUpHistory: FollowUpEntry[];
  createdBy?: string;
  createdByName?: string;
  createdAt: string;
  updatedAt: string;
}

export const CAMPAIGN_OPTIONS: CampaignSource[] = [
  'UGC Social Media', 'UGC QR', 'UGC Brand Building',
  'Podcast', 'Voice Over Magazine', 'Website', 'Other',
];

export const SERVICE_OPTIONS: ServiceType[] = [
  'Social Media Marketing', 'Digital Marketing', 'Website Development',
  'App Development', 'GMB', 'SEO', 'UGC Video', 'Magazine', 'Podcast', 'Other',
];
