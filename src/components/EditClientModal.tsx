import React, { useState, useEffect } from 'react';
import { X, User, Building, Phone, Mail, MapPin } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { ClientDetails } from '../hooks/useClient';

interface EditClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClientUpdated: () => void;
  client: ClientDetails;
}

const EditClientModal: React.FC<EditClientModalProps> = ({ 
  isOpen, 
  onClose, 
  onClientUpdated,
  client 
}) => {
  const [formData, setFormData] = useState({
    title: '',
    first_name: '',
    middle_name: '',
    last_name: '',
    company: '',
    phone_numbers: '',
    mobile: '',
    email: '',
    bill_address: '',
    ship_address: '',
    fiscal_year_end: '',
    client_partner: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Populate form with client data when modal opens
  useEffect(() => {
    if (isOpen && client) {
      setFormData({
        title: client.title || '',
        first_name: client.first_name || '',
        middle_name: client.middle_name || '',
        last_name: client.last_name || '',
        company: client.company || '',
        phone_numbers: client.phone_numbers || '',
        mobile: client.mobile || '',
        email: client.email || '',
        bill_address: client.bill_address || '',
        ship_address: client.ship_address || '',
        fiscal_year_end: client.fiscal_year_end || '',
        client_partner: client.client_partner || '',
      });
      setError(null);
    }
  }, [isOpen, client]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Validate required fields
      if (!formData.first_name.trim() || !formData.last_name.trim()) {
        throw new Error('First name and last name are required');
      }

      if (!formData.email.trim()) {
        throw new Error('Email is required');
      }

      // Prepare data for update (remove empty strings to store as null)
      const clientData = Object.fromEntries(
        Object.entries(formData).map(([key, value]) => [
          key,
          typeof value === 'string' ? (value.trim() === '' ? null : value.trim()) : value ?? null
        ])
      );

      const { data, error: updateError } = await supabase
        .from('clients')
        .update(clientData)
        .eq('id', client.id)
        .select()
        .single();

      if (updateError) throw updateError;

      console.log('Client updated successfully:', data);
      
      // Notify parent component and close modal
      onClientUpdated();
      onClose();
    } catch (err) {
      console.error('Error updating client:', err);
      setError(err instanceof Error ? err.message : 'Failed to update client');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setError(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Edit Client</h2>
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
          {/* Personal Information Section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <User className="mr-2" size={20} />
              Personal Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Title */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  Title
                </label>
                <select
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4d9837] focus:border-transparent"
                >
                  <option value="">Select Title</option>
                  <option value="Mr.">Mr.</option>
                  <option value="Ms.">Ms.</option>
                  <option value="Mrs.">Mrs.</option>
                  <option value="Miss">Miss</option>
                </select>
              </div>

              {/* First Name */}
              <div>
                <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-2">
                  First Name *
                </label>
                <input
                  type="text"
                  id="first_name"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4d9837] focus:border-transparent"
                  placeholder="Enter first name"
                />
              </div>

              {/* Middle Name */}
              <div>
                <label htmlFor="middle_name" className="block text-sm font-medium text-gray-700 mb-2">
                  Middle Name
                </label>
                <input
                  type="text"
                  id="middle_name"
                  name="middle_name"
                  value={formData.middle_name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4d9837] focus:border-transparent"
                  placeholder="Enter middle name"
                />
              </div>

              {/* Last Name */}
              <div>
                <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name *
                </label>
                <input
                  type="text"
                  id="last_name"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4d9837] focus:border-transparent"
                  placeholder="Enter last name"
                />
              </div>
            </div>
          </div>

          {/* Company Information Section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Building className="mr-2" size={20} />
              Company Information
            </h3>
            
            <div>
              <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-2">
                Company
              </label>
              <input
                type="text"
                id="company"
                name="company"
                value={formData.company}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4d9837] focus:border-transparent"
                placeholder="Enter company name"
              />
            </div>
            <div className="mt-4">
                 <label htmlFor="fiscal_year_end" className="block text-sm font-medium text-gray-700 mb-2">
                   Fiscal Year End
                 </label>
                 <input
                   type="date"
                   id="fiscal_year_end"
                   name="fiscal_year_end"
                   value={formData.fiscal_year_end}
                   onChange={handleInputChange}
                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4d9837] focus:border-transparent"
                 />
              </div>
          </div>

          {/* Contact Information Section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Phone className="mr-2" size={20} />
              Contact Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Phone Numbers */}
              <div>
                <label htmlFor="phone_numbers" className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phone_numbers"
                  name="phone_numbers"
                  value={formData.phone_numbers}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4d9837] focus:border-transparent"
                  placeholder="(416) 555-0123"
                />
              </div>

              {/* Mobile */}
              <div>
                <label htmlFor="mobile" className="block text-sm font-medium text-gray-700 mb-2">
                  Mobile
                </label>
                <input
                  type="tel"
                  id="mobile"
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4d9837] focus:border-transparent"
                  placeholder="(647) 555-0456"
                />
              </div>

              {/* Email */}
              <div className="md:col-span-2">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4d9837] focus:border-transparent"
                    placeholder="client@example.com"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Address Information Section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <MapPin className="mr-2" size={20} />
              Address Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Billing Address */}
              <div>
                <label htmlFor="bill_address" className="block text-sm font-medium text-gray-700 mb-2">
                  Billing Address
                </label>
                <textarea
                  id="bill_address"
                  name="bill_address"
                  value={formData.bill_address}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4d9837] focus:border-transparent resize-none"
                  placeholder="123 Business Street&#10;Toronto, ON M5V 3A8&#10;Canada"
                />
              </div>

              {/* Shipping Address */}
              <div>
                <label htmlFor="ship_address" className="block text-sm font-medium text-gray-700 mb-2">
                  Shipping Address
                </label>
                <textarea
                  id="ship_address"
                  name="ship_address"
                  value={formData.ship_address}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4d9837] focus:border-transparent resize-none"
                  placeholder="123 Business Street&#10;Toronto, ON M5V 3A8&#10;Canada"
                />
              </div>
            </div>
          </div>
          {/* Client Partner Section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <User className="mr-2" size={20} />
                Client Partner
            </h3>
              <div>
                  <label htmlFor="client_partner" className="block text-sm font-medium text-gray-700 mb-2">
                    Client Partner
                  </label>
                  <select
                    id="client_partner"
                    name="client_partner"
                    value={formData.client_partner}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4d9837] focus:border-transparent"
                  >
                    <option value="">Select Client Partner</option>
                    <option value="Alfred">Alfred</option>
                    <option value="Leo">Leo</option>
                  </select>
              </div>
            </div>
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-600 text-sm font-medium">{error}</p>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 bg-[#4d9837] hover:bg-[#3d7a2a] text-white rounded-lg transition-colors disabled:opacity-50 flex items-center space-x-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Updating...</span>
                </>
              ) : (
                <span>Update</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditClientModal;