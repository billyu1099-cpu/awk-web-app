import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronRight, Plus, Loader2, AlertCircle, Eye, EyeOff, Filter, Download, FileText, Printer } from 'lucide-react';
import ProjectTable from './ProjectTable';
import Pagination from './Pagination';
import { useProjects } from '../hooks/useProjects';
import { useAuth } from '../hooks/useAuth';
import { supabase, Profile } from '../lib/supabase';
import CreateProjectModal from './CreateProjectModal';

interface ProjectListProps {
  onCreateProject: () => void;
  onViewProject: (projectId: string) => void;
}

const ProjectList: React.FC<ProjectListProps> = ({ 
  onCreateProject, 
  onViewProject 
}) => {
  const { user } = useAuth();
  const { projects, loading, error, refetch } = useProjects();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('all');
  const [staffFilter, setStaffFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [expandedFilterSections, setExpandedFilterSections] = useState<Record<string, boolean>>({});
  const [userProfile, setUserProfile] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [exportOpen, setExportOpen] = useState(false);
   const itemsPerPage = 6;

  // Get unique staff members who are assigned to projects
  const assignedStaff = useMemo(() => {
    const staffSet = new Set<string>();
    projects.forEach(project => {
      if (project.preparer && project.preparer.length > 0) {
        project.preparer.forEach(staff => staffSet.add(staff));
      }
      let preparers: string[] = [];
      if (Array.isArray(project.preparer)) {
        preparers = project.preparer;
      } else if (typeof project.preparer === 'string') {
        preparers = project.preparer.split(',').map(s => s.trim()).filter(Boolean);
      }
      preparers.forEach(staff => staffSet.add(staff));
    });
    return Array.from(staffSet).sort();
  }, [projects]);

  React.useEffect(() => {
    const fetchProfiles = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email, role');
      if (!error && data) setProfiles(data);
    };
    fetchProfiles();
  }, []);
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

  // Check if user can create projects (Dev, Manager, Partner)
  const canCreateProjects = userProfile?.role === 'Dev' || 
                           userProfile?.role === 'Manager' || 
                           userProfile?.role === 'Partner';

  // Get user's display name for filtering staff projects
  const getUserDisplayName = () => {
    if (!userProfile) return '';
    return [userProfile.first_name, userProfile.last_name].filter(Boolean).join(' ') || userProfile.email || '';
  };

  const filteredAndSortedProjects = useMemo(() => {
    if (!userProfile) return [];

    const userDisplayName = getUserDisplayName().toLowerCase().trim();

    let filtered = projects;

    // Staff: only projects assigned to them
    if (userProfile.role === 'Staff') {
      filtered = filtered.filter(project => {
        if (!project.preparer) return false;
        const preparers: string[] = Array.isArray(project.preparer)
          ? project.preparer.map(s => s.toLowerCase().trim())
          : typeof project.preparer === 'string'
            ? project.preparer.split(',').map(s => s.toLowerCase().trim())
            : [];
        return preparers.includes(userProfile.id);
      });
    }

    // Filter archived projects (if not showing archived)
    if (!showArchived) {
      filtered = filtered.filter(project => project.status?.toLowerCase() !== 'completed');
    }

    // Search by project name or client name (case-insensitive)
    const q = (searchQuery || '').toLowerCase().trim();
    if (q) {
      filtered = filtered.filter(p =>
        ((p.project_name || p.name || '') as string).toLowerCase().includes(q) ||
        ((p.client_name || p.clientName || '') as string).toLowerCase().includes(q)
      );
    }

    // Status filter (normalize to match new enum)
    if (statusFilter !== 'all') {
      const normalize = (s: any) => String(s || '').toLowerCase().replace(/[\s&\/()]+/g, '-').replace(/[^a-z0-9\-]/g, '');
      filtered = filtered.filter(project => normalize(project.status || project.displayStatus) === statusFilter);
    }

    // Staff dropdown filter
    if (staffFilter !== 'all') {
      filtered = filtered.filter(project => {
        if (!project.preparer) return false;
        const preparers: string[] = Array.isArray(project.preparer)
          ? project.preparer.map(s => s.trim())
          : typeof project.preparer === 'string'
            ? project.preparer.split(',').map(s => s.trim())
            : [];
        return preparers.includes(staffFilter);
      });
    }

    // comparator for sorting
    const comparator = (a: any, b: any) => {
      switch (sortBy) {
        case 'name': return (a.name || '').localeCompare(b.name || '');
        case 'client': return (a.clientName || '').localeCompare(b.clientName || '');
        case 'dueDate': return new Date(a.dueDate || 0).getTime() - new Date(b.dueDate || 0).getTime();
        case 'status': return (a.displayStatus || '').localeCompare(b.displayStatus || '');
        default: return 0;
      }
    };

    // Treat a project as completed if its status or computed displayStatus is 'completed'
    const isCompletedProject = (p: any) =>
      (p.status && p.status.toLowerCase() === 'completed') ||
      (p.displayStatus && p.displayStatus.toLowerCase() === 'completed');

    // Partition into active (non-completed) and completed, sort each group and then concat
    const active = filtered.filter(p => !isCompletedProject(p));
    const completed = filtered.filter(p => isCompletedProject(p));

    const sortedActive = [...active].sort(comparator);
    const sortedCompleted = [...completed].sort(comparator);

    return [...sortedActive, ...sortedCompleted];
  }, [projects, userProfile, showArchived, statusFilter, staffFilter, sortBy, searchQuery]);

  const totalPages = Math.ceil(filteredAndSortedProjects.length / itemsPerPage);
  const paginatedProjects = filteredAndSortedProjects.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleCreateProject = () => {
    setIsCreateModalOpen(true);
  };

  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
  };

  const handleProjectCreated = () => {
    refetch(); // Refresh the project list
    setCurrentPage(1); // Reset to first page
  };

  const toggleFilterSection = (section: string) => {
    setExpandedFilterSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleStatusFilterChange = (status: string) => {
    setStatusFilter(status);
    setCurrentPage(1);
    setShowFilterDropdown(false);
  };

  const handleStaffFilterChange = (staff: string) => {
    setStaffFilter(staff);
    setCurrentPage(1);
    setShowFilterDropdown(false);
  };

  const escapeCsv = (val: any) => {
    if (val === null || typeof val === 'undefined') return '';
    const s = String(val);
    return `"${s.replace(/"/g, '""')}"`;
  };

  const exportToCSV = (rows: any[]) => {
    const headers = ['Project','Client','Due Date','Status','Preparer'];
    const csv = [
      headers.join(','),
      ...rows.map(r =>
        [
          escapeCsv(r.project_name || r.name),
          escapeCsv(r.client_name || r.clientName),
          escapeCsv(r.due_date || r.dueDate),
          escapeCsv(r.displayStatus || r.status),
          escapeCsv(Array.isArray(r.preparer) ? r.preparer.join('; ') : (r.preparer || ''))
        ].join(',')
      )
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `projects_${new Date().toISOString().slice(0,10)}.csv`;
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
        <td>${r.project_name || r.name || ''}</td>
        <td>${r.client_name || r.clientName || ''}</td>
        <td>${r.due_date || r.dueDate || ''}</td>
        <td>${r.displayStatus || r.status || ''}</td>
        <td>${Array.isArray(r.preparer) ? r.preparer.join('; ') : (r.preparer || '')}</td>
      </tr>
    `).join('');

    const html = `<!doctype html><html><head><meta charset="utf-8">${style}<title>Projects</title></head><body>
      <h1>Projects - ${new Date().toLocaleString()}</h1>
      <table><thead><tr><th>Project</th><th>Client</th><th>Due Date</th><th>Status</th><th>Preparer</th></tr></thead>
      <tbody>${tableRows}</tbody></table>
    </body></html>`;

    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(html);
    w.document.close();
    setTimeout(() => { w.focus(); w.print(); }, 250);
    setExportOpen(false);
  };

  if (loading) {
    return (
      <div className="flex-1 p-8">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-3">
            <Loader2 className="animate-spin" size={24} />
            <span className="text-gray-600">Loading projects...</span>
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
            <span>Error loading projects: {error}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Projects</h1>
        
        {/* First row: filters and Create button */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            {/* Show Archived Toggle */}
            <button
              onClick={() => {
                setShowArchived(!showArchived);
                setCurrentPage(1);
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
            
            {/* Filter Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#4d9837] focus:border-transparent transition-colors"
              >
                <Filter size={16} />
                <span>Filter</span>
                <ChevronDown size={16} className={`transform transition-transform ${showFilterDropdown ? 'rotate-180' : ''}`} />
              </button>
              
              {showFilterDropdown && (
                <div className="absolute z-10 w-80 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
                  {/* By Status Section */}
                  <div className="border-b border-gray-200">
                    <button
                      onClick={() => toggleFilterSection('status')}
                      className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        {expandedFilterSections.status ? (
                          <ChevronDown size={16} className="text-gray-400" />
                        ) : (
                          <ChevronRight size={16} className="text-gray-400" />
                        )}
                        <span className="font-medium text-gray-900">By Status</span>
                      </div>
                    </button>
                    
                    {expandedFilterSections.status && (
                      <div className="px-4 pb-4">
                        <div className="space-y-2">
                          {[
                            { key: 'all', label: 'All Statuses' },
                            { key: 'client-to-sign-engagement-and-pay-deposit', label: 'Client to sign engagement and pay deposit' },
                            { key: 'not-start-info-to-come', label: 'Not start—info to come' },
                            { key: 'to-do', label: 'To Do' },
                            { key: 'work-in-progress-wip', label: 'Work in progress (WIP)' },
                            { key: 'ready-for-reviewer-partner-to-review', label: 'Ready for reviewer/partner to review' },
                            { key: 'reviewed', label: 'Reviewed' },
                            { key: 'staff-to-update', label: 'staff to update' },
                            { key: 'ready-for-final-review', label: 'Ready for final review' },
                            { key: 'for-client-review-approval', label: 'For client review & approval' },
                            { key: 'for-client-signature', label: 'For client signature' },
                            { key: 'to-efile-prepare-invoice-client-signed', label: 'To efile & prepare invoice (client signed)' },
                            { key: 'completed', label: 'Completed' }
                          ].map(({ key, label }) => (
                            <button
                              key={key}
                              onClick={() => handleStatusFilterChange(key)}
                              className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                                statusFilter === key ? 'bg-[#4d9837] text-white' : 'hover:bg-gray-100 text-gray-700'
                              }`}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* By Staff Section */}
                  <div>
                    <button
                      onClick={() => toggleFilterSection('staff')}
                      className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        {expandedFilterSections.staff ? (
                          <ChevronDown size={16} className="text-gray-400" />
                        ) : (
                          <ChevronRight size={16} className="text-gray-400" />
                        )}
                        <span className="font-medium text-gray-900">By Staff</span>
                      </div>
                    </button>
                    
                    {expandedFilterSections.staff && (
                      <div className="px-4 pb-4">
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          <button
                            onClick={() => handleStaffFilterChange('all')}
                            className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                              staffFilter === 'all' ? 'bg-[#4d9837] text-white' : 'hover:bg-gray-100 text-gray-700'
                            }`}
                          >
                            All Staff
                          </button>
                          {assignedStaff.map((staffId) => {
                            const staffProfile = profiles.find(p => p.id === staffId);
                            const staffName = staffProfile
                              ? [staffProfile.first_name, staffProfile.last_name].filter(Boolean).join(' ')
                              : staffId;
                            return (
                              <button
                                key={staffId}
                                onClick={() => handleStaffFilterChange(staffId)}
                                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                                  staffFilter === staffId ? 'bg-[#4d9837] text-white' : 'hover:bg-gray-100 text-gray-700'
                                }`}
                              >
                                {staffName}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-10 text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#4d9837] focus:border-transparent"
              >
                <option value="name">Sort by Name</option>
                <option value="client">Sort by Client</option>
                <option value="dueDate">Sort by Due Date</option>
                <option value="status">Sort by Status</option>
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>
          {/* Create button on the right of first row */}
          {canCreateProjects && (
            <button
              onClick={handleCreateProject}
              className="bg-[#4d9837] hover:bg-[#3d7a2a] text-white px-6 py-2 rounded-lg flex items-center space-x-2 transition-colors font-medium"
              type="button"
            >
              <Plus size={20} />
              <span>Create Project</span>
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
              placeholder="Search projects by name or client..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4d9837] focus:border-transparent"
            />
          </div>

          {canCreateProjects && (
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
                      onClick={() => exportToCSV(filteredAndSortedProjects)}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center space-x-2"
                    >
                      <FileText size={14} />
                      <span>Export CSV</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => openPrintWindow(filteredAndSortedProjects)}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center space-x-2"
                    >
                      <Printer size={14} />
                      <span>Print / Save as PDF</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <ProjectTable 
        projects={paginatedProjects} 
        onViewProject={onViewProject}
        profiles={(profiles || []).map(p => ({
          id: p.id,
          first_name: p.first_name ?? '',
          last_name: p.last_name ?? ''
        }))}
      />

      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      )}

      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={handleCloseCreateModal}
        onProjectCreated={handleProjectCreated}
      />
    </div>
  );
};

export default ProjectList;