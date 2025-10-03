import { ProjectDetails } from '../types/ProjectDetails';

export const mockProjectDetails: { [key: string]: ProjectDetails } = {
  '1': {
    id: '1',
    name: 'Project Alpha',
    client: 'Client A',
    engagementType: 'Corporate Tax Return',
    status: 'In Progress',
    yearEndDate: 'Dec 31, 2023',
    dateIn: 'Jan 15, 2024',
    targetCompletionDate: 'Mar 15, 2024',
    estimatedFees: 15000,
    actualFees: 12500,
    outstandingBalance: 2500,
    
    clientPartners: ['John Smith', 'Sarah Wilson'],
    servicesRequired: {
      gst: true,
      t1135: true,
      uht: false,
      corporateTax: true,
      personalTax: false,
      bookkeeping: true
    },
    
    invoiceNumber: 'INV-2024-001',
    invoiceAmount: 15000,
    hst: 1950,
    amountReceived: 12500,
    
    preparer: 'Sarah Johnson',
    reviewer: 'Mike Chen',
    partner: 'David Brown',
    preparerStatus: 'In Progress',
    reviewerStatus: 'Not Started',
    partnerReview: 'Initial review looks good. Need to verify GST calculations before final approval.',
    actualTimeUsed: 45.5,
    dateCompleted: undefined,
    dateOfEfile: undefined,
    signedT183: false,
    
    clientContact: {
      name: 'Robert Anderson',
      company: 'Anderson Manufacturing Ltd.',
      email: 'robert@andersonmfg.com',
      phone: '(416) 555-0123',
      billingAddress: '123 Business St\nToronto, ON M5V 3A8\nCanada',
      shippingAddress: '123 Business St\nToronto, ON M5V 3A8\nCanada'
    }
  },
  '2': {
    id: '2',
    name: 'Project Beta',
    client: 'Client B',
    engagementType: 'Personal Tax Return',
    status: 'Reviewed',
    yearEndDate: 'Dec 31, 2023',
    dateIn: 'Feb 1, 2024',
    targetCompletionDate: 'Apr 30, 2024',
    estimatedFees: 2500,
    actualFees: 2200,
    outstandingBalance: 0,
    
    clientPartners: ['Jennifer Lee'],
    servicesRequired: {
      gst: false,
      t1135: false,
      uht: true,
      corporateTax: false,
      personalTax: true,
      bookkeeping: false
    },
    
    invoiceNumber: 'INV-2024-002',
    invoiceAmount: 2500,
    hst: 325,
    amountReceived: 2825,
    
    preparer: 'Emily Davis',
    reviewer: 'Sarah Johnson',
    partner: 'David Brown',
    preparerStatus: 'Completed',
    reviewerStatus: 'Completed',
    partnerReview: 'Excellent work. All documentation is complete and accurate.',
    actualTimeUsed: 8.5,
    dateCompleted: 'Mar 15, 2024',
    dateOfEfile: 'Mar 18, 2024',
    signedT183: true,
    
    clientContact: {
      name: 'Maria Rodriguez',
      company: 'Self-Employed',
      email: 'maria.rodriguez@email.com',
      phone: '(647) 555-0456',
      billingAddress: '456 Residential Ave\nMississauga, ON L5B 2K9\nCanada',
      shippingAddress: '456 Residential Ave\nMississauga, ON L5B 2K9\nCanada'
    }
  }
};