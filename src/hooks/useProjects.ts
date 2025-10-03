import { useState, useEffect } from 'react'
import { supabase, Project, ClientContactInformation } from '../lib/supabase'



export interface ProjectWithClient extends Project {
  client?: ClientContactInformation
  clientName: string
  displayStatus: 'In Progress' | 'Not Started' | 'Completed' | 'Reviewed' | 'Waiting for Client' | 'Ready for Review'
  dueDate: string
  assignedStaff: number
}

// Helper function to get full client name
const getClientFullName = (client: ClientContactInformation): string => {
  const parts = [client.title, client.first_name, client.middle_name, client.last_name].filter(Boolean)
  return parts.length > 0 ? parts.join(' ') : client.company || 'Unknown Client'
}

export const useProjects = () => {
  const [projects, setProjects] = useState<ProjectWithClient[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProjects = async () => {
    try {
      setLoading(true)
      setError(null)
      

      // Get current user and their profile
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        setProjects([]);
        setLoading(false);
        return;
      }
      
      // Fetch the user's profile to get their role
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      let projectsQuery = supabase
        .from('projects')
        .select(`
          *,
          client:clients(*)
        `);
      // Only filter for non-Dev/Partner
      if (!['Dev', 'Partner','Admin'].includes(profileData?.role)) {
        projectsQuery = projectsQuery.contains('preparer', [user.id]);
      }

      const { data: projectsData, error: projectsError } = await projectsQuery;

      if (projectsError) throw projectsError;
      // Transform projects data
      const transformedProjects: ProjectWithClient[] = (projectsData || []).map(project => {
        const client = project.client as ClientContactInformation | null
        
        // Determine status based on workflow hierarchy (frontend logic)
        let displayStatus: ProjectWithClient['displayStatus'] = 'Not Started'
        if (project.archived_at || project.status?.toLowerCase() === 'completed') {
         displayStatus = 'Completed'
        }
        else
        // Priority 1: If client status is not "completed", override everything
        if (project.client_status?.toLowerCase() !== 'completed') {
          displayStatus = 'Waiting for Client'
        }
        // Priority 2: If preparer status is not "Sent to reviewer" or "completed"
        else if (project.preparer_status?.toLowerCase() !== 'sent to reviewer' && 
                 project.preparer_status?.toLowerCase() !== 'completed') {
          displayStatus = 'In Progress'
        }
        // Priority 3: If preparer status is "Sent to reviewer"
        else if (project.preparer_status?.toLowerCase() === 'sent to reviewer') {
          displayStatus = 'Ready for Review'
        }
        // Priority 4: If reviewer status is "approved"
        else if (project.reviewer_status?.toLowerCase() === 'approved') {
          displayStatus = 'Reviewed'
        }
        // Default: Check main status for completed
        else if (project.status?.toLowerCase() === 'completed') {
          displayStatus = 'Completed'
        }
        
        // Build client name
        const clientName = project.client_name || (client ? getClientFullName(client) : 'Unknown Client')
        
        // Count assigned staff (preparer array length)
        const assignedStaff = project.preparer ? project.preparer.length : 0

        return {
          ...project,
          client,
          clientName,
          displayStatus,
          dueDate: project.due_date || 'No date set',
          assignedStaff,
          // Legacy compatibility
          id: project.project_id.toString(),
          name: project.project_name
        }
      })

      setProjects(transformedProjects)
    } catch (err) {
      console.error('Error fetching projects:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProjects()
  }, [])

  return {
    projects,
    loading,
    error,
    refetch: fetchProjects
  }
}