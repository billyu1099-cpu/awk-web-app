import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Pie, Bar } from 'react-chartjs-2';
import { Chart, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from 'chart.js';
Chart.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

const STATUS_COLORS: Record<string, string> = {
  'client to sign engagement and pay deposit': '#fbbf24', // amber-400
  'not start—info to come': '#a3a3a3', // gray-400
  'to do': '#6366f1', // indigo-500
  'work in progress (wip)': '#2563eb', // blue-600
  'ready for reviewer/partner to review': '#7c3aed', // purple-600
  'reviewed': '#f59e42', // orange-400
  'staff to update': '#52525b', // gray-600
  'ready for final review': '#7c3aed', // purple-600
  'for client review & approval': '#eab308', // yellow-500
  'for client signature': '#eab308', // yellow-500
  'to efile & prepare invoice (client signed)': '#0d9488', // teal-600
  'completed': '#16a34a', // green-600
  default: '#a3a3a3',
};

const STATUS_LABELS: Record<string, string> = {
  'client to sign engagement and pay deposit': 'Client to sign engagement and pay deposit',
  'not start—info to come': 'Not start—info to come',
  'to do': 'To Do',
  'work in progress (wip)': 'Work in progress (WIP)',
  'ready for reviewer/partner to review': 'Ready for reviewer/partner to review',
  'reviewed': 'Reviewed',
  'staff to update': 'staff to update',
  'ready for final review': 'Ready for final review',
  'for client review & approval': 'For client review & approval',
  'for client signature': 'For client signature',
  'to efile & prepare invoice (client signed)': 'To efile & prepare invoice (client signed)',
  'completed': 'Completed',
  default: 'Other',
};

function getStatusKey(status: string) {
  const s = (status || '').toLowerCase();
  for (const key of Object.keys(STATUS_COLORS)) {
    if (key !== 'default' && s.includes(key)) return key;
  }
  return 'default';
}
interface DashboardProps {
  userProfile: {
    id: string;
    role?: string;
  } | null;
}

const Dashboard: React.FC<DashboardProps> = ({ userProfile }) => {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [staffProfiles, setStaffProfiles] = useState<any[]>([]);

  // Fetch assigned projects for the logged-in staff
  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true);
      if (!userProfile) {
        setProjects([]);
        setLoading(false);
        return;
      }
      if (['Partner', 'Manager'].includes(userProfile.role ?? '')) {
        // Partner/Manager: see all projects
        const { data } = await supabase.from('projects').select('*');
        setProjects(data || []);
      } else {
        // Staff: only assigned projects
        const { data } = await supabase
          .from('projects')
          .select('*')
          .contains('preparer', [userProfile.id]);
        setProjects(data || []);
      }
      setLoading(false);
    };
    fetchProjects();
  }, [userProfile]);

  // Fetch all staff profiles for Partner/Manager
  useEffect(() => {
    const fetchStaff = async () => {
      if (!userProfile || !['Partner', 'Manager'].includes(userProfile.role ?? '')) {
        setStaffProfiles([]);
        return;
      }
      const { data } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, role')
        .eq('role', 'Staff');
      setStaffProfiles(data || []);
    };
    fetchStaff();
  }, [userProfile]);

  // Count statuses
  const statusCounts: Record<string, number> = {};
  projects.forEach((proj) => {
    const key = getStatusKey(proj.status);
    statusCounts[key] = (statusCounts[key] || 0) + 1;
  });

  // Prepare staff project counts for bar chart
  let staffBarLabels: string[] = [];
  let staffBarData: number[] = [];
  if (['Partner', 'Manager'].includes(userProfile?.role ?? '')) {
    // Map staff id to name
    const staffIdToName: Record<string, string> = {};
    staffProfiles.forEach(
      (s) => (staffIdToName[s.id] = [s.first_name, s.last_name].filter(Boolean).join(' '))
    );
    // Count projects per staff
    const staffProjectCounts: Record<string, number> = {};
    projects.forEach((proj) => {
      const statusKey = getStatusKey(proj.status);
      if (statusKey === 'completed') return;
      if (Array.isArray(proj.preparer)) {
        proj.preparer.forEach((staffId: string) => {
          if (staffIdToName[staffId]) {
            staffProjectCounts[staffId] = (staffProjectCounts[staffId] || 0) + 1;
          }
        });
      }
    });
    staffBarLabels = staffProfiles.map((s) => staffIdToName[s.id] || s.id);
    staffBarData = staffProfiles.map((s) => staffProjectCounts[s.id] || 0);
  }

  const pieLabels = Object.keys(statusCounts).map(key => STATUS_LABELS[key] || STATUS_LABELS.default);
  const pieData = Object.keys(statusCounts).map(key => statusCounts[key]);
  const pieColors = Object.keys(statusCounts).map(key => STATUS_COLORS[key] || STATUS_COLORS.default);

  const chartData = {
    labels: pieLabels,
    datasets: [
      {
        data: pieData,
        backgroundColor: pieColors,
        borderWidth: 1,
      },
    ],
  };

  const staffBarChartData = {
    labels: staffBarLabels,
    datasets: [
      {
        label: 'Assigned Projects',
        data: staffBarData,
        backgroundColor: '#4d9837',
        borderRadius: 6,
        barThickness: 24,
      },
    ],
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* Card 1: Pie Chart of Project Statuses */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex flex-col">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {['Partner', 'Manager'].includes(userProfile?.role ?? '')
              ? 'All Projects by Status'
              : 'Your Projects by Status'}
          </h2>
          {loading ? (
            <div className="flex-1 flex items-center justify-center text-gray-500">Loading...</div>
          ) : projects.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              {['Partner', 'Manager'].includes(userProfile?.role ?? '')
                ? 'No projects'
                : 'No assigned projects'}
            </div>
          ) : (
            <>
              <div className="w-full flex justify-center mb-4">
                <div className="w-60 h-60">
                  <Pie data={chartData} options={{
                    plugins: {
                      legend: { display: false }
                    }
                  }} />
                </div>
              </div>
              <div className="flex flex-wrap gap-3 justify-center mt-2">
                {Object.keys(statusCounts).map((key) => (
                  <div key={key} className="flex items-center space-x-2">
                    <span className="inline-block w-4 h-4 rounded-full" style={{ background: STATUS_COLORS[key] || STATUS_COLORS.default }}></span>
                    <span className="text-sm text-gray-700">{STATUS_LABELS[key] || STATUS_LABELS.default}</span>
                    <span className="text-xs text-gray-500">({statusCounts[key]})</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
        {/* Card 2: Staff Project Count Bar Chart (Partner/Manager only) */}
        {['Partner', 'Manager'].includes(userProfile?.role ?? '') && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex flex-col col-span-1 md:col-span-2 lg:col-span-2 min-h-[420px]">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Staff Project Assignment
                </h2>
                {staffProfiles.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-gray-400">
                    No staff found
                </div>
                ) : (
                <div className="w-full flex justify-center mb-4">
                    <div className="w-full" style={{ minHeight: 350, height: 420 }}>
                    <Bar
                        data={staffBarChartData}
                        options={{
                        indexAxis: 'y',
                        plugins: {
                            legend: { display: false },
                            tooltip: { enabled: true },
                        },
                        maintainAspectRatio: false,
                        responsive: true,
                        scales: {
                            x: {
                            beginAtZero: true,
                            ticks: { color: '#4d9837', font: { weight: 'bold' }, stepSize: 1 },
                            grid: { color: '#e5e7eb' },
                            
                            },
                            y: {
                            ticks: { color: '#4d9837', font: { weight: 'bold' } },
                            grid: { color: '#e5e7eb' },
                            },
                        },
                        }}
                        height={400}
                    />
                    </div>
                </div>
                )}
            </div>
        )}
        {userProfile?.role === 'Staff' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex flex-col col-span-1 md:col-span-2 lg:col-span-2 min-h-[420px]">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">To Do Note</h2>
            {projects.filter(
              proj =>
                ['to do', 'staff to update'].includes(getStatusKey(proj.status))
            ).length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-gray-400">
                No "To Do" or "Staff to update" projects assigned to you.
              </div>
            ) : (
              <ul className="space-y-4">
                {projects
                  .filter(
                    proj =>
                      ['to do', 'staff to update'].includes(getStatusKey(proj.status))
                  )
                  .map(proj => (
                    <li key={proj.id} className="border-b pb-2 flex flex-row items-start gap-6">
                      <div className="font-semibold text-gray-800 min-w-[180px]">{proj.name || proj.project_name}</div>
                      <div className="text-sm text-gray-700 flex-1">
                        Status: {STATUS_LABELS[getStatusKey(proj.status)]}
                      </div>
                      <div className="text-sm text-gray-700 flex-1">
                        <span className="font-medium">Note:</span>{' '}
                        {proj.to_do_or_update ? proj.to_do_or_update : <span className="text-gray-400">No note</span>}
                      </div>
                    </li>
                  ))}
              </ul>
            )}
          </div>
        )}
                

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex flex-col col-span-1 md:col-span-2 lg:col-span-3 min-h-[420px]">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Overdue & Upcoming Project Deadlines
          </h2>
          {projects.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              No projects found
            </div>
          ) : (
            <div className="flex flex-col md:flex-row gap-8">
              {/* Overdue Projects */}
              <div className="flex-1">
                <h3 className="text-md font-semibold text-red-600 mb-2">Overdue Projects</h3>
                <ul className="space-y-2">
                  {projects
                    .filter((proj) => {
                      // Only show assigned projects for Staff
                      if (userProfile?.role === 'Staff') {
                        if (!Array.isArray(proj.preparer) || !proj.preparer.includes(userProfile.id)) return false;
                      }
                      return (
                        proj.due_date &&
                        new Date(proj.due_date) < new Date() &&
                        getStatusKey(proj.status) !== 'completed'
                      );
                    })
                    .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
                    .map((proj) => (
                      <li key={proj.id} className="flex justify-between items-center">
                        <span className="text-gray-800">{proj.name || proj.project_name}</span>
                        <span className="text-xs text-red-600 font-mono">
                          {proj.due_date ? new Date(proj.due_date).toLocaleDateString() : 'No due date'}
                        </span>
                      </li>
                    ))}
                  {projects.filter((proj) => {
                    if (userProfile?.role === 'Staff') {
                      if (!Array.isArray(proj.preparer) || !proj.preparer.includes(userProfile.id)) return false;
                    }
                    return (
                      proj.due_date &&
                      new Date(proj.due_date) < new Date() &&
                      getStatusKey(proj.status) !== 'completed'
                    );
                  }).length === 0 && (
                    <li className="text-gray-400 text-sm">No overdue projects</li>
                  )}
                </ul>
              </div>
              {/* Upcoming Due Dates */}
              <div className="flex-1">
                <h3 className="text-md font-semibold text-[#4d9837] mb-2">Upcoming Due Dates</h3>
                <ul className="space-y-2">
                  {projects
                    .filter((proj) => {
                      if (userProfile?.role === 'Staff') {
                        if (!Array.isArray(proj.preparer) || !proj.preparer.includes(userProfile.id)) return false;
                      }
                      return (
                        proj.due_date &&
                        new Date(proj.due_date) >= new Date() &&
                        getStatusKey(proj.status) !== 'completed'
                      );
                    })
                    .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
                    .slice(0, 10)
                    .map((proj) => (
                      <li key={proj.id} className="flex justify-between items-center">
                        <span className="text-gray-800">{proj.name || proj.project_name}</span>
                        <span className="text-xs text-[#4d9837] font-mono">
                          {proj.due_date ? new Date(proj.due_date).toLocaleDateString() : 'No due date'}
                        </span>
                      </li>
                    ))}
                  {projects.filter((proj) => {
                    if (userProfile?.role === 'Staff') {
                      if (!Array.isArray(proj.preparer) || !proj.preparer.includes(userProfile.id)) return false;
                    }
                    return (
                      proj.due_date &&
                      new Date(proj.due_date) >= new Date() &&
                      getStatusKey(proj.status) !== 'completed'
                    );
                  }).length === 0 && (
                    <li className="text-gray-400 text-sm">No upcoming due dates</li>
                  )}
                </ul>
              </div>
            </div>
          )}
        </div>
        {['Partner', 'Manager'].includes(userProfile?.role ?? '') && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex flex-col col-span-1 md:col-span-2 lg:col-span-3 min-h-[420px]">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Top 10 Clients by Project Count
            </h2>
            {projects.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-gray-400">
                No projects found
            </div>
            ) : (
            <div className="w-full flex justify-center mb-4">
                <div className="w-full" style={{ minHeight: 350, height: 420 }}>
                <Bar
                    data={{
                    labels: (() => {
                        // Count projects per client
                        const clientCounts: Record<string, number> = {};
                        projects.forEach((proj) => {
                        if (proj.client_name) {
                            clientCounts[proj.client_name] = (clientCounts[proj.client_name] || 0) + 1;
                        }
                        });
                        // Sort and take top 10
                        return Object.entries(clientCounts)
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 10)
                        .map(([client]) => client);
                    })(),
                    datasets: [
                        {
                        label: 'Projects',
                        data: (() => {
                            const clientCounts: Record<string, number> = {};
                            projects.forEach((proj) => {
                            if (proj.client_name) {
                                clientCounts[proj.client_name] = (clientCounts[proj.client_name] || 0) + 1;
                            }
                            });
                            return Object.entries(clientCounts)
                            .sort((a, b) => b[1] - a[1])
                            .slice(0, 10)
                            .map(([, count]) => count);
                        })(),
                        backgroundColor: '#4d9837',
                        borderRadius: 6,
                        barThickness: 32,
                        },
                    ],
                    }}
                    options={{
                    indexAxis: 'x',
                    plugins: {
                        legend: { display: false },
                        tooltip: { enabled: true },
                    },
                    maintainAspectRatio: false,
                    responsive: true,
                    scales: {
                        x: {
                        ticks: {
                            color: '#4d9837',
                            font: { weight: 'bold' },
                            autoSkip: false,
                            maxRotation: 45,
                            minRotation: 0,
                        },
                        grid: { color: '#e5e7eb' },
                        },
                        y: {
                        beginAtZero: true,
                        ticks: {
                            color: '#4d9837',
                            font: { weight: 'bold' },
                            stepSize: 1,
                            precision: 0,
                            callback: function(value) { return Number(value).toFixed(0); }
                        },
                        grid: { color: '#e5e7eb' },
                        },
                    },
                    }}
                    height={400}
                />
                </div>
            </div>
            )}
            
        </div>
        )}
      </div>
      
    </div>
  );
};

export default Dashboard;