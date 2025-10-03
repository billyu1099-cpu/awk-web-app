import React from 'react';
import { ClientWithDetails } from '../hooks/useClients';

const getStatusBadgeColor = (status: string) => {
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

interface ClientTableProps {
  clients: ClientWithDetails[];
  onViewClient: (clientId: string) => void;
  canManageClients: boolean;
}

const ClientTable: React.FC<ClientTableProps> = ({ clients, onViewClient, canManageClients }) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                Name
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                Company
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                Mobile Number
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                Email
              </th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                Status
              </th>
              {canManageClients && (
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">
                  Action
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {clients.map((client, index) => (
              <tr 
                key={client.id} 
                className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-gray-100 transition-colors`}
              >
                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                  {client.fullName}
                </td>
                <td className="px-6 py-4 text-sm text-gray-700">
                  {client.displayCompany}
                </td>
                <td className="px-6 py-4 text-sm text-gray-700">
                  {client.displayPhone}
                </td>
                <td className="px-6 py-4 text-sm text-gray-700">
                  {client.displayEmail}
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(client.status || 'Active')}`}>
                    {client.status || 'Active'}
                  </span>
                </td>
                {canManageClients && (
                  <td className="px-6 py-4">
                    <button
                      onClick={() => onViewClient(client.id.toString())}
                      className="text-[#4d9837] hover:text-[#3d7a2a] font-medium text-sm transition-colors"
                    >
                      View Details
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ClientTable;