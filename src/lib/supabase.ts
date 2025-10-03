import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types based on your schema
export type RoleType = 'Partner' | 'Manager' | 'Senior' | 'Staff' | 'Admin' | 'Dev';

export interface Profile {
  id: string
  first_name?: string
  last_name?: string
  email: string
  role?: RoleType
  created_at?: string
  updated_at?: string
}

export interface ClientContactInformation {
  id: number
  title?: string
  first_name?: string
  middle_name?: string
  last_name?: string
  company?: string
  phone_numbers?: string
  mobile?: string
  email?: string
  bill_address?: string
  ship_address?: string
  status?: string
}

export interface Project {
  project_id?: number
  project_name: string
  client_id?: number
  client_name?: string
  referred_by?: string
  main_client_folder?: string
  engagement_type?: string
  client_partners?: string
  year_end?: string
  services_required?: any
  number_of_returns?: number
  date_in?: string
  date_completed?: string
  due_date?: string
  preparer?: string[]
  reviewer?: string
  status?: string
  client_status?: string
  preparer_status?: string
  reviewer_status?: string
  comments?: string
  estimated_fees?: number
  approximated_actual_time_used?: number
  partner_performance_review?: string
  date_of_efile_mail?: string
  invoice_number?: string
  amount?: number
  hst_amount?: number
  amount_received?: number
  outstanding?: number
  notes?: string
  created_at?: string
  updated_at?: string
  created_by?: string
  last_modified_by?: string
}

export interface T1Project {
  id: number
  client_name?: string
  main_client_folder?: string
  engagement_type?: string
  client_partners?: string
  year_end?: string
  services_required?: any
  date_in?: string
  preparer?: string
  reviewer?: string
  status?: string
  comments?: string
  created_at?: string
  updated_at?: string
  created_by: string
  last_modified_by?: string
}