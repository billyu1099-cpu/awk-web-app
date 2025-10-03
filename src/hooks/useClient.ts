import { useState, useEffect } from 'react'
import { supabase, ClientContactInformation } from '../lib/supabase'

export interface ClientDetails extends ClientContactInformation {
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

export const useClient = (clientId: string) => {
  const [client, setClient] = useState<ClientDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchClient = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('id', parseInt(clientId))
        .single()
      
      if (clientError) throw clientError

      if (clientData) {
        const fullName = getClientFullName(clientData)
        
        const transformedClient: ClientDetails = {
          ...clientData,
          fullName,
          displayPhone: clientData.phone_numbers || clientData.mobile || 'No phone',
          displayEmail: clientData.email || 'No email',
          displayCompany: clientData.company || 'No company',
          status: clientData.status || 'Active',
          client_partner: clientData.client_partner ?? null
        }

        setClient(transformedClient)
      } else {
        setError('Client not found')
      }
    } catch (err) {
      console.error('Error fetching client:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (clientId) {
      fetchClient()
    }
  }, [clientId])

  return {
    client,
    loading,
    error,
    refetch: fetchClient
  }
}