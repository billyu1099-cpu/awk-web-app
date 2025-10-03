import { supabase } from '../lib/supabase';

export const insertDummyData = async () => {
  try {
    console.log('Starting dummy data insertion...');
    
    // Check Supabase configuration
    console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
    console.log('Supabase Anon Key exists:', !!import.meta.env.VITE_SUPABASE_ANON_KEY);

    // Test basic database connection
    const { data: testData, error: testError } = await supabase
      .from('Client Contact Information')
      .select('count', { count: 'exact', head: true });

    console.log('Database connection test:', { testData, testError });

    if (testError) {
      console.error('Database connection failed:', testError);
      return { success: false, error: `Database connection error: ${testError.message}. This might be due to Row Level Security (RLS) policies or missing environment variables.` };
    }

    // First, insert a dummy client
    const { data: clientData, error: clientError } = await supabase
      .from('Client Contact Information')
      .insert([
        {
          title: 'Mr.',
          first_name: 'John',
          middle_name: 'Michael',
          last_name: 'Anderson',
          company: 'Tech Solutions Inc.',
          phone_numbers: '(416) 555-0123',
          mobile: '(647) 555-0456',
          email: 'john.anderson@techsolutions.com',
          bill_address: '123 Business Street\nToronto, ON M5V 3A8\nCanada',
          ship_address: '123 Business Street\nToronto, ON M5V 3A8\nCanada'
        }
      ])
      .select()
      .single();

    if (clientError) {
      console.error('Error inserting client:', clientError);
      return { success: false, error: `Client insertion failed: ${clientError.message}. This is likely due to Row Level Security (RLS) policies blocking inserts.` };
    }

    console.log('Client inserted:', clientData);

    // Then insert a dummy project
    const { data: projectData, error: projectError } = await supabase
      .from('Projects')
      .insert([
        {
          client_id: clientData.id,
          project_name: 'Tech Solutions Inc. - 2023 Corporate Tax Return',
          engagement_type: 'Corporate Tax Return',
          main_client_folder: 'TechSolutions_2023',
          referred_by: 'Existing Client',
          year_end: '2023-12-31',
          date_in: '2024-01-15',
          target_completion_date: '2024-03-15',
          client_partners: 'David Brown, Jennifer Lee',
          preparer: 'Sarah Johnson',
          reviewer: 'Mike Chen',
          services_required: {
            corporateTax: true,
            gst: true,
            t1135: true,
            personalTax: false,
            bookkeeping: false,
            uht: false
          },
          number_of_returns: 1,
          t183_form_status: 'Pending',
          gst_status: true,
          uht_status: false,
          preparer_status: 'In Progress',
          reviewer_status: 'Not Started',
          partner_performance_review: 'Initial review shows good progress. Client is cooperative and documents are well organized.',
          approx_actual_time: 25.5,
          comments: 'Client provided all necessary documents on time. GST reconciliation in progress.',
          estimated_fees: 15000,
          invoice_number: 'INV-2024-001',
          invoice_amount: 15000,
          hst_amount: 1950,
          amount_received: 10000,
          outstanding_amount: 6950,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          created_by: 'System Admin',
          last_modified_by: 'System Admin'
        }
      ])
      .select();

    if (projectError) {
      console.error('Error inserting project:', projectError);
      return { success: false, error: `Project insertion failed: ${projectError.message}. This is likely due to Row Level Security (RLS) policies blocking inserts.` };
    }

    console.log('Project inserted:', projectData);
    console.log('Dummy data insertion completed successfully!');
    
    return { success: true, client: clientData, project: projectData };
  } catch (error) {
    console.error('Error in insertDummyData:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};