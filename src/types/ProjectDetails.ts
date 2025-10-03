export interface ProjectDetails {
  id: string;
  name: string;
  client: string;
  engagementType: string;
  status: 'In Progress' | 'Not Started' | 'Completed' | 'Reviewed' | 'Waiting for Client' | 'Ready for Review';
  yearEndDate: string;
  dateIn: string;
  targetCompletionDate: string;
  estimatedFees: number;
  actualFees: number;
  outstandingBalance: number;
  is_locked: boolean;
  
  // Project Details
  clientPartners: string[];
  servicesRequired: {
    gst: boolean;
    t1135: boolean;
    uht: boolean;
    corporateTax: boolean;
    personalTax: boolean;
    bookkeeping: boolean;
  };
  
  // Invoice Information
  invoiceNumber: string;
  invoiceAmount: number;
  hst: number;
  amountReceived: number;
  
  // Workflow & Status
  preparer: string;
  reviewer: string;
  partner: string;
  preparerStatus: 'Not Started' | 'In Progress' | 'Awaiting Review' | 'Completed';
  reviewerStatus: 'Not Started' | 'In Progress' | 'Awaiting Review' | 'Completed';
  partnerReview: string;
  actualTimeUsed: number; // in hours
  dateCompleted?: string;
  dateOfEfile?: string;
  signedT183: boolean;
  
  // Client Contact Info
  clientContact: {
    name: string;
    company: string;
    email: string;
    phone: string;
    billingAddress: string;
    shippingAddress: string;
  };
}

export interface ProjectComment {
  id: string;
  author: string;
  content: string;
  timestamp: string;
  mentions: string[];
}

export interface ProjectDocument {
  id: string;
  name: string;
  category: 'Source Docs' | 'Working Papers' | 'Final Returns' | 'Client Correspondence';
  uploadDate: string;
  size: string;
  type: string;
  version: number;
}

export interface ActivityLogEntry {
  id: string;
  user: string;
  action: string;
  timestamp: string;
  details: string;
}