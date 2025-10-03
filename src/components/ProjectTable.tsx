import React from 'react';
import { ProjectWithClient } from '../hooks/useProjects';

interface ProjectTableProps {
  projects: ProjectWithClient[];
  onViewProject: (projectId: string) => void;
  profiles: { id: string; first_name: string; last_name: string }[];
}

const ProjectTable: React.FC<ProjectTableProps> = ({ projects, onViewProject,profiles }) => {
  const getStatusBadgeColor = (status: string) => {
    const s = (status || '').toLowerCase();
    if (s.includes('completed')) return 'bg-green-600 text-white';
    if (s.includes('wip') || s.includes('work in progress')) return 'bg-blue-600 text-white';
    if (s.includes('to do') || s.includes('not start')) return 'bg-indigo-600 text-white';
    if (s.includes('reviewer') || s.includes('ready for reviewer') || s.includes('ready for final review')) return 'bg-purple-600 text-white';
    if (s.includes('reviewed')) return 'bg-orange-500 text-white';
    if (s.includes('client review') || s.includes('for client') || s.includes('for client review')) return 'bg-yellow-500 text-white';
    if (s.includes('to efile') || s.includes('efile')) return 'bg-teal-600 text-white';
    if (s.includes('staff to update')) return 'bg-gray-600 text-white';
    return 'bg-gray-400 text-white';
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                Project Name
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                Client
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                Due Date
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                Status
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                Assigned Staff
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {projects.map((project, index) => (
              <tr 
                key={project.id} 
                className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-gray-100 transition-colors`}
              >
                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                  {project.project_name || project.name || 'Untitled Project'}
                </td>
                <td className="px-6 py-4 text-sm text-gray-700">
                  {[
    project.client?.title,
    project.client?.first_name,
    project.client?.middle_name,
    project.client?.last_name
  ]
    .filter(Boolean) // removes undefined or null values
    .join(' ')}
                </td>
                <td className="px-6 py-4 text-sm text-gray-700">
                  {project.due_date || project.dueDate || 'No date set'}
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(project.status)}`}>
                    {project.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-700">
                  {project.preparer && project.preparer.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {project.preparer.slice(0, 2).map((staffId, index) => {
                        const staffProfile = profiles.find(p => p.id === staffId);
                        return (
                          <span
                            key={index}
                            className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                          >
                            {staffProfile
                              ? `${staffProfile.first_name} ${staffProfile.last_name}`
                              : staffId}
                          </span>
                        );
                      })}
                      {project.preparer.length > 2 && (
                        <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                          +{project.preparer.length - 2} more
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-gray-400 text-sm">No staff assigned</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => onViewProject(project.project_id.toString())}
                    className="text-[#4d9837] hover:text-[#3d7a2a] font-medium text-sm transition-colors"
                  >
                    View Project
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProjectTable;