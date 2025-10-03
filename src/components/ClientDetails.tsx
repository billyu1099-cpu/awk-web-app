import React, { useState } from 'react';
import { ArrowLeft, User, Building, Phone, Mail, MapPin, Archive, Edit, Loader2, AlertCircle, X } from 'lucide-react';
import { useClient } from '../hooks/useClient';
import { useAuth } from '../hooks/useAuth';
import { supabase, Profile } from '../lib/supabase';
import EditClientModal from './EditClientModal';

interface ClientDetailsProps {
  clientId: string;
  onBack: () => void;
}

const ClientDetails: React.FC<ClientDetailsProps> = ({ clientId, onBack }) => {
  const { user } = useAuth();
  const { client, loading, error, refetch } = useClient(clientId);
  const [isArchiving, setIsArchiving] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [archiveError, setArchiveError] = useState<string | null>(null);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  // Fetch user profile to check role
  React.useEffect(() => {
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
      } finally {
        setProfileLoading(false);
      }
    };

    fetchUserProfile();
  }, [user]);

  // Check if user can manage clients (Dev, Admin, Partner)
  const canManageClients = userProfile?.role === 'Dev' || 
                          userProfile?.role === 'Admin' || 
                          userProfile?.role === 'Partner';

  const handleArchiveClient = async () => {
    if (!client) return;

    setIsArchiving(true);
    setArchiveError(null);

    const newStatus = (client.status || '').toLowerCase() === 'archived' ? 'Active' : 'Archived';
    
    try {
      const { error: updateError } = await supabase
        .from('clients')
        .update({ status: newStatus })
        .eq('id', client.id);

      if (updateError) throw updateError;

      // Close modal and go back to client list after successful archive
      setShowArchiveModal(false);
      await refetch();
    } catch (err) {
      console.error('Error updating client status:', err);
      setArchiveError(err instanceof Error ? err.message : 'Failed to update client status');
    } finally {
      setIsArchiving(false);
    }
  };

  const handleEditClient = () => {
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
  };

  const handleClientUpdated = () => {
    refetch(); // Refresh the client data
  };

  if (loading) {
    return (
      <div className="flex-1 p-8 bg-gray-50">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-3">
            <Loader2 className="animate-spin" size={24} />
            <span className="text-gray-600">Loading client details...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="flex-1 p-8 bg-gray-50">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 mb-4 transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Back to Clients</span>
        </button>
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-3 text-red-600">
            <AlertCircle size={24} />
            <span>Error loading client: {error || 'Client not found'}</span>
          </div>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'bg-green-600 text-white';
      case 'inactive':
        return 'bg-red-600 text-white';
      case 'archived':
        return 'bg-blue-600 text-white';
      default:
        return 'bg-gray-400 text-white';
    }
  };

  return (
    <div className="flex-1 p-8 bg-gray-50">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 mb-4 transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Back to Clients</span>
        </button>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{client.fullName}</h1>
              <p className="text-xl text-gray-600">{client.displayCompany}</p>
            </div>
            <div className="flex items-center space-x-3">
              {canManageClients && (
                <button
                  onClick={handleEditClient}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Edit size={16} />
                  <span>Edit</span>
                </button>
              )}
              <span className={`inline-flex px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(client.status || 'Active')}`}>
                {client.status || 'Active'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Client Information */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <div className="space-y-8">
          {/* Personal Information Section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <User className="mr-2" size={20} />
              Personal Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {client.title && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <p className="text-gray-900">{client.title}</p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                <p className="text-gray-900">{client.first_name || 'Not provided'}</p>
              </div>
              {client.middle_name && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Middle Name</label>
                  <p className="text-gray-900">{client.middle_name}</p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                <p className="text-gray-900">{client.last_name || 'Not provided'}</p>
              </div>
            </div>
          </div>

          {/* Company Information Section */}
          {client.company && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Building className="mr-2" size={20} />
                Company Information
              </h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                <p className="text-gray-900">{client.company}</p>
              </div>
            </div>
          )}

          {/* Contact Information Section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Phone className="mr-2" size={20} />
              Contact Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {client.phone_numbers && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <p className="text-gray-900">{client.phone_numbers}</p>
                </div>
              )}
              {client.mobile && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mobile</label>
                  <p className="text-gray-900">{client.mobile}</p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <p className="text-gray-900">{client.email || 'Not provided'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Address Information Section */}
          {(client.bill_address || client.ship_address) && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <MapPin className="mr-2" size={20} />
                Address Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {client.bill_address && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Billing Address</label>
                    <p className="text-gray-900 whitespace-pre-line">{client.bill_address}</p>
                  </div>
                )}
                {client.ship_address && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Shipping Address</label>
                    <p className="text-gray-900 whitespace-pre-line">{client.ship_address}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Archive Client Section */}
      {canManageClients && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Archive Client</h3>
              <p className="text-gray-600 text-sm">
                Archiving this client will hide them from the default client list. They can still be accessed through the "Show archived clients" option.
              </p>
            </div>
            <button
              type='button'
              onClick={() => setShowArchiveModal(true)}
              
              className={`flex items-center space-x-2 px-4 py-2 text-white rounded-lg transition-colors ${
                    (client.status || '').toLowerCase() === 'archived'
                      ? 'bg-green-600 hover:bg-green-700' // unarchive action
                      : 'bg-red-600 hover:bg-red-700' // archive action
                  }`}
            >
              <Archive size={16} />
              <span>{client.status === 'Archived' ? 'Already Archived' : 'Archive Client'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Edit Client Modal */}
      {client && canManageClients && (
        <EditClientModal
          isOpen={isEditModalOpen}
          onClose={handleCloseEditModal}
          onClientUpdated={handleClientUpdated}
          client={client}
        />
      )}

      {/* Archive Confirmation Modal */}
      {showArchiveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {(client.status || '').toLowerCase() === 'archived' ? 'Unarchive Client' : 'Archive Client'}
              </h3>
              <button
                onClick={() => setShowArchiveModal(false)}
                disabled={isArchiving}
                className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
                type='button'
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className={`w-12 h-12 bg-red-100 rounded-full flex items-center justify-center ${
                  (client.status || '').toLowerCase() === 'archived' ? 'bg-green-100' : 'bg-red-100'
                }`}>
                  <Archive className={`h-6 w-6 ${(client.status || '').toLowerCase() === 'archived' ? 'text-green-600' : 'text-red-600'}`} />
                </div>
                <div>
                  <h4 className="text-lg font-medium text-gray-900">{(client.status || '').toLowerCase() === 'archived' ? 'Unarchive this client?' : 'Archive this client?'}</h4>
                  <p className="text-sm text-gray-600">{(client.status || '').toLowerCase() === 'archived'
                      ? 'Unarchiving will restore the client to active status and show them in the default client list.'
                      : 'Archiving will hide the client from the default list. You can view archived clients via the "Show archived clients" option.'}</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Client:</span> {client.fullName}
                </p>
                {client.company && (
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">Company:</span> {client.company}
                  </p>
                )}
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Email:</span> {client.email || 'Not provided'}
                </p>
              </div>

              <p className="text-sm text-gray-600 mb-4">
                {(client.status || '').toLowerCase() === 'archived'
                  ? 'This will set the client status back to Active and show them in the default client list.'
                  : 'The client will be archived and hidden from the default client list. You can still access them by using the "Show Archived" option in the clients page.'}
              </p>

              {archiveError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                  <p className="text-red-600 text-sm font-medium">{archiveError}</p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
              <button
                onClick={() => setShowArchiveModal(false)}
                disabled={isArchiving}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleArchiveClient}
                disabled={isArchiving}
                className={`px-4 py-2 text-white rounded-lg transition-colors flex items-center space-x-2 ${
                  (client.status || '').toLowerCase() === 'archived'
                    ? 'bg-green-600 hover:bg-green-700' // unarchive
                    : 'bg-red-600 hover:bg-red-700' // archive
                }`}
                type='button'
              >
                {isArchiving ? (
                  <>
                    <Loader2 className="animate-spin" size={16} />
                    <span>{(client.status || '').toLowerCase() === 'archived' ? 'Unarchiving...' : 'Archiving...'}</span>
                  </>
                ) : (
                  <>
                    <Archive size={16} />
                    <span>{(client.status || '').toLowerCase() === 'archived' ? 'Unarchive Client' : 'Archive Client'}</span>
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

export default ClientDetails;