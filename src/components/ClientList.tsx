import React, { useState, useMemo } from 'react';
import { ChevronDown, Plus, Loader2, AlertCircle, Eye, EyeOff, Download, FileText, Printer } from 'lucide-react';
import ClientTable from './ClientTable';
import Pagination from './Pagination';
import { useClients } from '../hooks/useClients';
import { useAuth } from '../hooks/useAuth';
import { supabase, Profile } from '../lib/supabase';
import CreateClientModal from './CreateClientModal';

interface ClientListProps {
  onViewClient: (clientId: string) => void;
}

const ClientList: React.FC<ClientListProps> = ({ 
  onViewClient 
}) => {
  const { user } = useAuth();
  const { clients, loading, error, refetch } = useClients();
  
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState('fullName');
  const [partnerFilter, setPartnerFilter] = useState<'All' | 'Leo' | 'Alfred'>('All');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [exportOpen, setExportOpen] = useState(false);
  const itemsPerPage = 6;

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

  // Check if user can create/edit clients (Dev, Admin, Partner)
  const canManageClients = userProfile?.role === 'Dev' || 
                          userProfile?.role === 'Admin' || 
                          userProfile?.role === 'Partner';
  const filteredAndSortedClients = useMemo(() => {
    // Filter clients based on archived status
    let filtered = Array.isArray(clients) ? [...clients] : [];
    if (!showArchived) {
      filtered = filtered.filter(client => (client.status || '').toLowerCase() !== 'archived');
    }

    if (partnerFilter !== 'All') {
      filtered = filtered.filter(client => client.client_partner === partnerFilter);
    }

    // Search by client full name or company (case-insensitive)
    const q = (searchQuery || '').toLowerCase().trim();
    if (q) {
      filtered = filtered.filter(client =>
        ((client.fullName || '').toLowerCase().includes(q)) ||
        ((client.displayCompany || '').toLowerCase().includes(q))
      );
    }


    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'fullName':
          return a.fullName.localeCompare(b.fullName);
        case 'company':
          return a.displayCompany.localeCompare(b.displayCompany);
        case 'email':
          return a.displayEmail.localeCompare(b.displayEmail);
        case 'phone':
          return a.displayPhone.localeCompare(b.displayPhone);
        default:
          return 0;
      }
    });
    
    return sorted;
  }, [clients, sortBy, showArchived, partnerFilter, searchQuery]);
  
  // Export helpers use the current filtered/sorted/searched set
  const escapeCsv = (val: any) => {
    if (val === null || typeof val === 'undefined') return '';
    const s = String(val);
    // wrap in quotes and escape existing quotes
    return `"${s.replace(/"/g, '""')}"`;
  };

  const exportToCSV = (rows: any[]) => {
    const headers = ['Name','Company','Email','Phone','Status','Partner'];
    const csv = [
      headers.join(','),
      ...rows.map(r =>
        [
          escapeCsv(r.fullName),
          escapeCsv(r.displayCompany),
          escapeCsv(r.displayEmail),
          escapeCsv(r.displayPhone),
          escapeCsv(r.status),
          escapeCsv(r.client_partner)
        ].join(',')
      )
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `clients_${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setExportOpen(false);
  };

  const openPrintWindow = (rows: any[]) => {
    const style = `
      <style>
        body { font-family: Inter, Arial, sans-serif; padding: 20px; color: #111827; }
        table { width: 100%; border-collapse: collapse; margin-top: 12px; }
        th, td { padding: 8px 10px; border: 1px solid #e5e7eb; text-align: left; }
        th { background: #f9fafb; }
      </style>
    `;
    const tableRows = rows.map(r => `
      <tr>
        <td>${r.fullName || ''}</td>
        <td>${r.displayCompany || ''}</td>
        <td>${r.displayEmail || ''}</td>
        <td>${r.displayPhone || ''}</td>
        <td>${r.status || ''}</td>
        <td>${r.client_partner || ''}</td>
      </tr>
    `).join('');

    const html = `<!doctype html><html><head><meta charset="utf-8">${style}<title>Clients</title></head><body>
      <h1>Clients - ${new Date().toLocaleString()}</h1>
      <table><thead><tr><th>Name</th><th>Company</th><th>Email</th><th>Phone</th><th>Status</th><th>Partner</th></tr></thead>
      <tbody>${tableRows}</tbody></table>
    </body></html>`;

    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(html);
    w.document.close();
    // give browser a moment to render before print
    setTimeout(() => { w.focus(); w.print(); /* user can Save as PDF from print dialog */ }, 250);
    setExportOpen(false);
  };

  const totalPages = Math.ceil(filteredAndSortedClients.length / itemsPerPage);
  const paginatedClients = filteredAndSortedClients.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Reset to page 1 when toggling archived view
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  };

  const handleCreateClient = () => {
    setIsCreateModalOpen(true);
  };

  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
  };

  const handleClientCreated = () => {
    refetch(); // Refresh the client list
    setCurrentPage(1); // Reset to first page
  };

  if (loading) {
    return (
      <div className="flex-1 p-8">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-3">
            <Loader2 className="animate-spin" size={24} />
            <span className="text-gray-600">Loading clients...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 p-8">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-3 text-red-600">
            <AlertCircle size={24} />
            <span>Error loading clients: {error}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Clients</h1>
        
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            {/* Show Archived Toggle */}
            <button
              onClick={() => {
                setShowArchived(!showArchived);
                setCurrentPage(1); // Reset to first page when toggling
              }}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors ${
                showArchived
                  ? 'bg-blue-50 border-blue-300 text-blue-700'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {showArchived ? <EyeOff size={16} /> : <Eye size={16} />}
              <span>{showArchived ? 'Hide Archived' : 'Show Archived'}</span>
            </button>

            <div>
              <select
                value={partnerFilter}
                onChange={(e) => { setPartnerFilter(e.target.value as 'All' | 'Leo' | 'Alfred'); setCurrentPage(1); }}
                className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-10 text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#4d9837] focus:border-transparent"
              >
                <option value="All">All Partners</option>
                <option value="Leo">Leo</option>
                <option value="Alfred">Alfred</option>
              </select>
            </div>

            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-10 text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#4d9837] focus:border-transparent"
              >
                <option value="fullName">Sort by Name</option>
                <option value="company">Sort by Company</option>
                <option value="email">Sort by Email</option>
                <option value="phone">Sort by Phone</option>
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>
          {canManageClients && (
            <button
              onClick={handleCreateClient}
              className="bg-[#4d9837] hover:bg-[#3d7a2a] text-white px-6 py-2 rounded-lg flex items-center space-x-2 transition-colors font-medium"
              type="button"
            >
              <Plus size={20} />
              <span>Create Client</span>
            </button>
          )}
        </div>
        {/* second row: search (left 50%) and create/export (right) */}
        <div className="flex items-start justify-between mb-6">
          <div className="w-full md:w-1/2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              placeholder="Search clients by name or company..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4d9837] focus:border-transparent"
            />
          </div>

          {canManageClients && (
            <div className="ml-4 flex items-center space-x-3">
              <div className="relative">
                <button
                  onClick={() => setExportOpen(prev => !prev)}
                  className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-gray-50"
                  type="button"
                >
                  <Download size={16} />
                  <span>Export</span>
                  <ChevronDown size={16} className="text-gray-400" />
                </button>

                {exportOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                    <button
                      type="button"
                      onClick={() => exportToCSV(filteredAndSortedClients)}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center space-x-2"
                    >
                      <FileText size={14} />
                      <span>Export CSV</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => openPrintWindow(filteredAndSortedClients)}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center space-x-2"
                    >
                      <Printer size={14} />
                      <span>Print / Save as PDF</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => openPrintWindow(filteredAndSortedClients)}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center space-x-2"
                    >
                      <Download size={14} />
                      <span>Export PDF (via Print dialog)</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      <ClientTable 
        clients={paginatedClients} 
        onViewClient={onViewClient}
        canManageClients={canManageClients}
      />

      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      )}

      <CreateClientModal
        isOpen={isCreateModalOpen}
        onClose={handleCloseCreateModal}
        onClientCreated={handleClientCreated}
      />
    </div>
  );
};

export default ClientList;