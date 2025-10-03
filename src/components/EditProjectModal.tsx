import React, { useState, useEffect } from 'react';
import { X, Folder, User, Calendar, Users, ChevronDown, ChevronRight, Trash2 } from 'lucide-react';
import { supabase, Profile } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { ProjectDetails } from '../hooks/useProject';

interface Client {
  id: number;
  first_name?: string;
  last_name?: string;
  company?: string;
}

interface EditProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectUpdated: () => void;
  project: ProjectDetails;
}

const EditProjectModal: React.FC<EditProjectModalProps> = ({ 
  isOpen, 
  onClose, 
  onProjectUpdated,
  project 
}) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    project_name: '',
    client_id: '',
    due_date: '',
    preparer: [] as string[],
    services_required: {} as Record<string, string[]>,
    engagement_type: '',
    client_partners: '',
    year_end: '',
    reviewer: '',
    comments: '',
    estimated_fees: ''
    
  });
  
  const [clients, setClients] = useState<Client[]>([]);
  const [staff, setStaff] = useState<Profile[]>([]);
  const [clientSearch, setClientSearch] = useState('');
  const [staffSearch, setStaffSearch] = useState('');
  const [reviewerSearch, setReviewerSearch] = useState('');
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [showStaffDropdown, setShowStaffDropdown] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<Profile[]>([]);
  const [selectedReviewer, setSelectedReviewer] = useState<Profile | null>(null);
  const [showReviewerDropdown, setShowReviewerDropdown] = useState(false);
  
  // Services state
  const [expandedServices, setExpandedServices] = useState<Record<string, boolean>>({});
  const [otherServicesInput, setOtherServicesInput] = useState('');
  const [otherServicesList, setOtherServicesList] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Services configuration
  const servicesConfig = {
    'Personal tax return (Cdn)': [
      'GST',
      'T2125',
      'Rental',
      'T1135',
      'T1134',
      'Final deceased return'
    ],
    'Non-resident return S.216': [
      'UHT',
      'GST rental rebate',
      'NR4',
      'NR6'
    ],
    'Corporation': [
      'Bookkeeping',
      'T4/T4A/T5 etc.',
      'Compilation',
      'Review engagement',
      'Audit engagement',
      'Corporation tax return',
      'Financial forecast'
    ],
    'Trust/Partnership': [
      'Trust return',
      'T5013 partnership return'
    ],
    'Consultation': [
      'Tax/Business consultation',
      'Set up corporation',
      'CRA inquiry, review, audit, notice of objection etc.',
      'Tax estate planning or reorganization',
      'Business plan for financing',
      'Valuation',
      'Buy/Sell',
      'Others'
    ],
    'Others': []
  };

  // Populate form with project data when modal opens
  useEffect(() => {
    if (isOpen && project) {
      setFormData({
        project_name: project.project_name || '',
        client_id: project.client_id?.toString() || '',
        due_date: project.due_date || '',
        preparer: project.preparer || [],
        services_required: (project.services_required as Record<string, string[]>) || {},
        engagement_type: project.engagement_type || '',
        client_partners: project.client_partners || '',
        year_end: project.year_end || '',
        reviewer: project.reviewer || '',
        comments: project.comments || '',
        estimated_fees: project.estimated_fees?.toString() || ''
      });

      // Set selected client
      if (project.client) {
        setSelectedClient(project.client);
        setClientSearch(getClientDisplayName(project.client));
      }

      // Set selected staff based on preparer array
      if (project.preparer && project.preparer.length > 0) {
        // We'll need to match the preparer names to staff members
        // For now, we'll clear this and let user re-select
        setSelectedStaff([]);
      }

      setError(null);
      fetchClients();
      fetchStaff();
    }
  }, [isOpen, project]);

  useEffect(() => {
  if (isOpen && project) {
    setOtherServicesList(
      Array.isArray(project.services_required?.Others)
        ? project.services_required.Others
        : []
    );
    setOtherServicesInput('');
  }
}, [isOpen, project]);

useEffect(() => {
  setFormData(prev => ({
    ...prev,
    services_required: {
      ...prev.services_required,
      Others: otherServicesList
    }
  }));
  // eslint-disable-next-line
}, [otherServicesList]);

  // Fetch user profile to check role
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (error) throw error;
        setUserProfile(data);
      } catch (err) {
        console.error('Error fetching user profile:', err);
      }
    };

    fetchUserProfile();
  }, [user]);

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('id, first_name, last_name, company')
        .eq('status', 'Active')
        .order('first_name', { ascending: true });

      if (error) throw error;
      setClients(data || []);
    } catch (err) {
      console.error('Error fetching clients:', err);
    }
  };

  const fetchStaff = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email, role')
        .order('first_name', { ascending: true });
      
      if (error) throw error;
      
      setStaff(data || []);
    } catch (err) {
      console.error('Error fetching staff:', err);
      setStaff([]);
    }
  };

  const getClientDisplayName = (client: Client): string => {
    const name = [client.first_name, client.last_name].filter(Boolean).join(' ');
    return client.company ? `${name} (${client.company})` : name || 'Unknown Client';
  };

  const getStaffDisplayName = (staffMember: Profile): string => {
    return [staffMember.first_name, staffMember.last_name].filter(Boolean).join(' ') || staffMember.email;
  };

  const filteredClients = clients.filter(client => {
    const searchTerm = clientSearch.toLowerCase();
    const name = [client.first_name, client.last_name].filter(Boolean).join(' ').toLowerCase();
    const company = client.company?.toLowerCase() || '';
    return name.includes(searchTerm) || company.includes(searchTerm);
  });

  const filteredStaff = staff.filter(staffMember => {
    const searchTerm = staffSearch.toLowerCase();
    const name = [staffMember.first_name, staffMember.last_name].filter(Boolean).join(' ').toLowerCase();
    const email = staffMember.email.toLowerCase();
    return name.includes(searchTerm) || email.includes(searchTerm);
  }).filter(staffMember => !selectedStaff.find(s => s.id === staffMember.id));

  const filteredReviewerStaff = staff.filter(s =>
  s.role === 'Partner' && (
    (s.first_name?.toLowerCase().includes(reviewerSearch.toLowerCase()) ||
    s.last_name?.toLowerCase().includes(reviewerSearch.toLowerCase()) ||
    s.email?.toLowerCase().includes(reviewerSearch.toLowerCase())) &&
    (!selectedReviewer || selectedReviewer.id !== s.id) // only exclude if already selected
  )
);
  const handleClientSelect = (client: Client) => {
    setSelectedClient(client);
    setFormData(prev => ({ ...prev, client_id: client.id.toString() }));
    setClientSearch(getClientDisplayName(client));
    setShowClientDropdown(false);
  };

  const handleStaffSelect = (staffMember: Profile) => {
    const newSelectedStaff = [...selectedStaff, staffMember];
    setSelectedStaff(newSelectedStaff);
    setFormData(prev => ({ 
      ...prev, 
      preparer: newSelectedStaff.map(s => getStaffDisplayName(s))
    }));
    setStaffSearch('');
    setShowStaffDropdown(false);
  };

  const handleStaffRemove = (staffId: string) => {
    const newSelectedStaff = selectedStaff.filter(s => s.id !== staffId);
    setSelectedStaff(newSelectedStaff);
    setFormData(prev => ({ 
      ...prev, 
      preparer: newSelectedStaff.map(s => getStaffDisplayName(s))
    }));
  };

  const toggleServiceCategory = (category: string) => {
    setExpandedServices(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const handleServiceChange = (category: string, service: string, checked: boolean) => {
    setFormData(prev => {
      const newServicesRequired = { ...prev.services_required };
      
      if (checked) {
        if (!newServicesRequired[category]) {
          newServicesRequired[category] = [];
        }
        if (!newServicesRequired[category].includes(service)) {
          newServicesRequired[category].push(service);
        }
      } else {
        if (newServicesRequired[category]) {
          newServicesRequired[category] = newServicesRequired[category].filter(s => s !== service);
          if (newServicesRequired[category].length === 0) {
            delete newServicesRequired[category];
          }
        }
      }
      
      return {
        ...prev,
        services_required: newServicesRequired
      };
    });
  };

  const isServiceSelected = (category: string, service: string): boolean => {
    return formData.services_required[category]?.includes(service) || false;
  };

  const hasSelectedServices = (category: string): boolean => {
    return formData.services_required[category]?.length > 0 || false;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Validate required fields
      if (!formData.project_name.trim()) {
        throw new Error('Project name is required');
      }
      if (!formData.client_id) {
        throw new Error('Please select a client');
      }
      if (!formData.due_date) {
        throw new Error('Due date is required');
      }

      // Prepare project data for update
      const projectData = {
        project_name: formData.project_name.trim(),
        client_id: parseInt(formData.client_id),
        client_name: selectedClient ? getClientDisplayName(selectedClient) : null,
        due_date: formData.due_date,
        preparer: formData.preparer,
        services_required: formData.services_required,
        engagement_type: formData.engagement_type.trim() || null,
        client_partners: formData.client_partners.trim() || null,
        year_end: formData.year_end || null,
        reviewer: formData.reviewer.trim() || null,
        comments: formData.comments.trim() || null,
        last_modified_by: user?.email || 'Unknown User',
        updated_at: new Date().toISOString(),
        estimated_fees: formData.estimated_fees || null
      };

      const { data, error: updateError } = await supabase
        .from('projects')
        .update(projectData)
        .eq('project_id', project.project_id)
        .select()
        .single();

      if (updateError) throw updateError;

      console.log('Project updated successfully:', data);
      
      // Notify parent component and close modal
      onProjectUpdated();
      onClose();
    } catch (err) {
      console.error('Error updating project:', err);
      setError(err instanceof Error ? err.message : 'Failed to update project');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteProject = async () => {
    setIsDeleting(true);
    setError(null);

    try {
      const { error: deleteError } = await supabase
        .from('projects')
        .delete()
        .eq('project_id', project.project_id);

      if (deleteError) throw deleteError;

      console.log('Project deleted successfully');
      
      // Notify parent component and close modal
      onProjectUpdated();
      onClose();
    } catch (err) {
      console.error('Error deleting project:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete project');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirmation(false);
    }
  };

  const handleClose = () => {
  setOtherServicesInput('');
  setOtherServicesList(
    Array.isArray(project.services_required?.Others)
      ? project.services_required.Others
      : []
  );
  onClose();
};

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Edit Project</h2>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Project Name */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Folder className="mr-2" size={20} />
              Project Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="project_name" className="block text-sm font-medium text-gray-700 mb-2">
                  Project Name *
                </label>
                <input
                  type="text"
                  id="project_name"
                  value={formData.project_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, project_name: e.target.value }))}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4d9837] focus:border-transparent"
                  placeholder="Enter project name"
                />
              </div>

              <div>
                <label htmlFor="engagement_type" className="block text-sm font-medium text-gray-700 mb-2">
                  Engagement Type
                </label>
                <input
                  type="text"
                  id="engagement_type"
                  value={formData.engagement_type}
                  onChange={(e) => setFormData(prev => ({ ...prev, engagement_type: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4d9837] focus:border-transparent"
                  placeholder="Enter engagement type"
                />
              </div>

              <div>
                <label htmlFor="client_partners" className="block text-sm font-medium text-gray-700 mb-2">
                  Client Partners
                </label>
                <input
                  type="text"
                  id="client_partners"
                  value={formData.client_partners}
                  onChange={(e) => setFormData(prev => ({ ...prev, client_partners: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4d9837] focus:border-transparent"
                  placeholder="Enter client partners"
                />
              </div>

              <div>
                <label htmlFor="year_end" className="block text-sm font-medium text-gray-700 mb-2">
                  Year End
                </label>
                <input
                  type="date"
                  id="year_end"
                  value={formData.year_end}
                  onChange={(e) => setFormData(prev => ({ ...prev, year_end: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4d9837] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Estimated Fees</label>
                  <input
                    type="number"
                    value={formData.estimated_fees}
                    onChange={(e) => setFormData({...formData,estimated_fees:e.target.value})}
                    className="w-full mt-1 p-2 border rounded-lg"
                    placeholder="Enter estimated fees"
                  />
              </div>
            </div>
          </div>

          {/* Client Selection */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <User className="mr-2" size={20} />
              Client Selection
            </h3>
            
            <div className="relative">
              <label htmlFor="client_search" className="block text-sm font-medium text-gray-700 mb-2">
                Search and Select Client *
              </label>
              <input
                type="text"
                id="client_search"
                value={selectedClient ? getClientDisplayName(selectedClient) : clientSearch}
                onChange={(e) => {
                  // If user starts typing and a client was selected, clear the selection
                  if (selectedClient) {
                    setSelectedClient(null);
                    setFormData(prev => ({ ...prev, client_id: '' }));
                  }
                  setClientSearch(e.target.value);
                  setShowClientDropdown(true);
                }}
                onFocus={() => setShowClientDropdown(true)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4d9837] focus:border-transparent"
                placeholder="Type client name or company..."
              />
              
              {showClientDropdown && filteredClients.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {filteredClients.map((client) => (
                    <button
                      key={client.id}
                      type="button"
                      onClick={() => handleClientSelect(client)}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                    >
                      <div className="font-medium text-gray-900">
                        {[client.first_name, client.last_name].filter(Boolean).join(' ')}
                      </div>
                      {client.company && (
                        <div className="text-sm text-gray-600">{client.company}</div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Timeline and Team */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Calendar className="mr-2" size={20} />
              Timeline & Team
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="due_date" className="block text-sm font-medium text-gray-700 mb-2">
                  Due Date *
                </label>
                <input
                  type="date"
                  id="due_date"
                  value={formData.due_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4d9837] focus:border-transparent"
                />
              </div>

              <div className="mb-4 relative">
                <label htmlFor="reviewer_search" className="block text-sm font-medium text-gray-700 mb-2">
                  Reviewer
                </label>
                <input
                  type="text"
                  id="reviewer_search"
                  value={selectedReviewer ? `${selectedReviewer.first_name} ${selectedReviewer.last_name}` : reviewerSearch}
                  onChange={e => {
                    setReviewerSearch(e.target.value);
                    setShowReviewerDropdown(true);
                    setSelectedReviewer(null);
                    setFormData(prev => ({ ...prev, reviewer: '' }));
                  }}
                  onFocus={() => setShowReviewerDropdown(true)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4d9837] focus:border-transparent"
                  placeholder="Type reviewer name..."
                  autoComplete="off"
                />

                {showReviewerDropdown && filteredReviewerStaff.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {filteredReviewerStaff.map((reviewer) => (
                      <button
                        key={reviewer.id}
                        type="button"
                        onClick={() => {
                          setSelectedReviewer(reviewer);
                          setFormData(prev => ({ ...prev, reviewer: reviewer.id }));
                          setReviewerSearch('');
                          setShowReviewerDropdown(false);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                      >
                        <div className="font-medium text-gray-900">
                          {getStaffDisplayName(reviewer)}
                        </div>
                        <div className="text-sm text-gray-600">{reviewer.email}</div>
                      </button>
                    ))}
                  </div>
                )}

                {selectedReviewer && (
                  <div className="mt-2">
                    <span className="bg-gray-100 px-2 py-1 rounded">
                      {getStaffDisplayName(selectedReviewer)}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedReviewer(null);
                        setFormData(prev => ({ ...prev, reviewer: '' }));
                      }}
                      className="ml-2 text-gray-500 hover:text-red-600"
                      aria-label="Remove reviewer"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Staff Assignment */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Users className="mr-2" size={20} />
              Staff Assignment
            </h3>
            
            {/* Selected Staff */}
            {selectedStaff.length > 0 && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assigned Staff
                </label>
                <div className="flex flex-wrap gap-2">
                  {selectedStaff.map((staffMember) => (
                    <span
                      key={staffMember.id}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-[#4d9837] text-white"
                    >
                      {getStaffDisplayName(staffMember)}
                      <button
                        type="button"
                        onClick={() => handleStaffRemove(staffMember.id)}
                        className="ml-2 text-white hover:text-gray-200"
                      >
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            <div className="relative">
              <label htmlFor="staff_search" className="block text-sm font-medium text-gray-700 mb-2">
                Search and Add Staff
              </label>
              <input
                type="text"
                id="staff_search"
                value={staffSearch}
                onChange={(e) => {
                  setStaffSearch(e.target.value);
                  setShowStaffDropdown(true);
                }}
                onFocus={() => setShowStaffDropdown(true)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4d9837] focus:border-transparent"
                placeholder="Type staff name..."
              />
              
              {showStaffDropdown && filteredStaff.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {filteredStaff.map((staffMember) => (
                    <button
                      key={staffMember.id}
                      type="button"
                      onClick={() => handleStaffSelect(staffMember)}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                    >
                      <div className="font-medium text-gray-900">
                        {getStaffDisplayName(staffMember)}
                      </div>
                      <div className="text-sm text-gray-600">{staffMember.email}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Services Required */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Folder className="mr-2" size={20} />
              Services Required
            </h3>
            
            <div className="space-y-3">
              {Object.entries(servicesConfig).map(([category, subServices]) => (
    <div key={category} className="border border-gray-200 rounded-lg">
      <button
        type="button"
        onClick={() => toggleServiceCategory(category)}
        className={`w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors ${
          hasSelectedServices(category) ? 'bg-green-50 border-green-200' : ''
        }`}
      >
        <div className="flex items-center space-x-3">
          {expandedServices[category] ? (
            <ChevronDown size={16} className="text-gray-400" />
          ) : (
            <ChevronRight size={16} className="text-gray-400" />
          )}
          <span className={`font-medium ${
            hasSelectedServices(category) ? 'text-green-700' : 'text-gray-900'
          }`}>
            {category}
          </span>
          {hasSelectedServices(category) && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              {formData.services_required[category]?.length} selected
            </span>
          )}
        </div>
        {/* Show + button for Others category */}
        
      </button>
      {expandedServices[category] && (
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          {/* For Others, show dynamic input and list */}
          {category === 'Others' ? (
            <div>
              {/* List of added other services, with delete button */}
              {otherServicesList.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-2">
                  {otherServicesList.map((service, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"
                    >
                      {service}
                      <button
                        type="button"
                        onClick={() => {
                          setOtherServicesList(otherServicesList.filter((_, i) => i !== idx));
                        }}
                        className="ml-1 text-green-800 hover:text-red-600"
                        aria-label="Delete"
                        tabIndex={-1}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
              {/* Input for new service */}
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="text"
                  value={otherServicesInput}
                  onChange={e => setOtherServicesInput(e.target.value)}
                  placeholder="Type a service..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4d9837] focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (otherServicesInput.trim() && !otherServicesList.includes(otherServicesInput.trim())) {
                      setOtherServicesList([...otherServicesList, otherServicesInput.trim()]);
                      setOtherServicesInput('');
                    }
                  }}
                  className="bg-[#4d9837] hover:bg-[#3d7a2a] text-white rounded-full p-2 flex items-center"
                >
                  <span className="text-lg font-bold leading-none">+</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {subServices.map((service) => (
                <label
                  key={service}
                  className="flex items-center space-x-3 cursor-pointer hover:bg-white p-2 rounded transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={isServiceSelected(category, service)}
                    onChange={(e) => handleServiceChange(category, service, e.target.checked)}
                    className="w-4 h-4 text-[#4d9837] border-gray-300 rounded focus:ring-[#4d9837] focus:ring-2"
                  />
                  <span className="text-sm text-gray-700">{service}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  ))}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-600 text-sm font-medium">{error}</p>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200">
            {/* Delete Button - Left side, only visible to Partner, Manager, and Dev */}
            <div>
              {userProfile && ['Partner', 'Manager', 'Dev'].includes(userProfile.role || '') && (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirmation(true)}
                  disabled={isLoading || isDeleting}
                  className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center space-x-2"
                >
                  <Trash2 size={16} />
                  <span>Delete Project</span>
                </button>
              )}
            </div>

            {/* Cancel and Update Buttons - Right side */}
            <div className="flex items-center space-x-4">
              <button
                type="button"
                onClick={handleClose}
                disabled={isLoading || isDeleting}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || isDeleting}
                className="px-6 py-2 bg-[#4d9837] hover:bg-[#3d7a2a] text-white rounded-lg transition-colors disabled:opacity-50 flex items-center space-x-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Updating...</span>
                  </>
                ) : (
                  <span>Update Project</span>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmation && (
        <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Delete Project</h3>
                <p className="text-sm text-gray-500">This action cannot be undone.</p>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-700">
                Are you sure you want to delete "<strong>{project.project_name}</strong>"? 
                This will permanently remove the project and all associated data from the database.
              </p>
            </div>

            <div className="flex items-center justify-end space-x-4">
              <button
                type="button"
                onClick={() => setShowDeleteConfirmation(false)}
                disabled={isDeleting}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteProject}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center space-x-2"
              >
                {isDeleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    <span>Delete Project</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditProjectModal;