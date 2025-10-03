import { useState, useEffect } from 'react'
import { supabase, Project, ClientContactInformation } from '../lib/supabase'

// Helper functions
const getClientFullName = (client: ClientContactInformation): string => {
  const parts = [client.title, client.first_name, client.middle_name, client.last_name].filter(Boolean)
  return parts.length > 0 ? parts.join(' ') : client.company || 'Unknown Client'
}

const calculateOutstandingAmount = (project: Project): number => {
  const invoiceAmount = project.amount || 0
  const hstAmount = project.hst_amount || 0
  const amountReceived = project.amount_received || 0
  return project.outstanding || ((invoiceAmount + hstAmount) - amountReceived)
}

export interface ProjectDetails extends Partial<Project> {
  client?: ClientContactInformation
  clientName: string
  displayStatus: 'In Progress' | 'Not Started' | 'Completed' | 'Reviewed' | 'Waiting for Client' | 'Ready for Review'
  outstandingBalance: number
  project_id?: number
  is_locked?: boolean
}

export const useProject = (projectId: string) => {
  const [project, setProject] = useState<ProjectDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProject = async () => {
    try {
      setLoading(true)
      
      // Fetch from "Projects" table
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select(`
          *,
          client:client_id (*)
        `)
        .eq('project_id', parseInt(projectId))
        .single()

      if (projectError && projectError.code !== 'PGRST116') {
        // If error is not "no rows returned", throw it
        throw projectError
      }

      if (projectData) {
        const client = projectData.client as ClientContactInformation | null
        
        // Determine status based on workflow hierarchy
        let displayStatus: ProjectDetails['displayStatus'] = 'Not Started'
        
        if (projectData.archived_at || projectData.status?.toLowerCase() === 'completed') {
          displayStatus = 'Completed'
        }
        else   

        // Priority 1: If client status is not "completed", override everything
        if (projectData.client_status?.toLowerCase() !== 'completed') {
          displayStatus = 'Waiting for Client'
        }
        // Priority 2: If preparer status is not "Sent to reviewer" or "completed"
        else if (projectData.preparer_status?.toLowerCase() !== 'sent to reviewer' && 
                 projectData.preparer_status?.toLowerCase() !== 'completed') {
          displayStatus = 'In Progress'
        }
        // Priority 3: If preparer status is "Sent to reviewer"
        else if (projectData.preparer_status?.toLowerCase() === 'sent to reviewer') {
          displayStatus = 'Ready for Review'
        }
        // Priority 4: If reviewer status is "approved"
        else if (projectData.reviewer_status?.toLowerCase() === 'approved') {
          displayStatus = 'Reviewed'
        }
        // Default: Check main status for completed
        else if (projectData.status?.toLowerCase() === 'completed') {
          displayStatus = 'Completed'
        }

        // Build client name
        const clientName = projectData.client_name || (client ? getClientFullName(client) : 'Unknown Client')

        const transformedProject: ProjectDetails = {
          ...projectData,
          client,
          clientName,
          displayStatus,
          outstandingBalance: calculateOutstandingAmount(projectData),
          project_id: projectData.project_id
        }

        setProject(transformedProject)
      } else {
        setError('Project not found')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (projectId) {
      fetchProject()
    }
  }, [projectId])

  return {
    project,
    loading,
    error,
    refetch: fetchProject
  }
}