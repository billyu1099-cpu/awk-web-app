import { useState, useEffect } from 'react'
import { supabase, ClientContactInformation } from '../lib/supabase'

export interface ClientWithDetails extends ClientContactInformation {
  fullName: string
  displayPhone: string
  displayEmail: string
  displayCompany: string
  status?: string
  client_partner?: string | null
}

// Helper function to get full client name
const getClientFullName = (client: ClientContactInformation): string => {
  const parts = [client.first_name, client.last_name].filter(Boolean)
  return parts.length > 0 ? parts.join(' ') : 'Unknown Client'
}

export const useClients = () => {
  const [clients, setClients] = useState<ClientWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchClients = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('*')
        .order('first_name', { ascending: true })
      
      if (clientsError) throw clientsError

      // Transform clients data
      const transformedClients: ClientWithDetails[] = (clientsData || []).map(client => {
        const fullName = getClientFullName(client)
        
        return {
          ...client,
          fullName,
          displayPhone: client.mobile ||client.phone_numbers|| 'No phone',
          displayEmail: client.email || 'No email',
          displayCompany: client.company || 'No company',
          status: client.status || 'Active',
          client_partner: client.client_partner ?? null
        }
      })

      setClients(transformedClients)
    } catch (err) {
      console.error('Error fetching clients:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchClients()
  }, [])

  return {
    clients,
    loading,
    error,
    refetch: fetchClients
  }
}