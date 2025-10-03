const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    // Create Supabase admin client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const { createClient } = await import('npm:@supabase/supabase-js@2');
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Calculate the cutoff time (10 minutes ago)
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    
    console.log(`Looking for unconfirmed users created before: ${tenMinutesAgo}`);

    // Get unconfirmed users older than 10 minutes
    const { data: users, error: fetchError } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1000
    });

    if (fetchError) {
      console.error('Error fetching users:', fetchError);
      throw fetchError;
    }

    const unconfirmedUsers = users.users.filter(user => 
      !user.email_confirmed_at && 
      new Date(user.created_at) < new Date(tenMinutesAgo)
    );

    console.log(`Found ${unconfirmedUsers.length} unconfirmed users to delete`);

    let deletedCount = 0;
    const errors = [];

    // Delete each unconfirmed user
    for (const user of unconfirmedUsers) {
      try {
        const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);
        
        if (deleteError) {
          console.error(`Error deleting user ${user.id}:`, deleteError);
          errors.push({ userId: user.id, error: deleteError.message });
        } else {
          console.log(`Successfully deleted unconfirmed user: ${user.email} (${user.id})`);
          deletedCount++;
        }
      } catch (error) {
        console.error(`Exception deleting user ${user.id}:`, error);
        errors.push({ userId: user.id, error: error.message });
      }
    }

    const result = {
      success: true,
      message: `Cleanup completed. Deleted ${deletedCount} unconfirmed users.`,
      deletedCount,
      totalFound: unconfirmedUsers.length,
      errors: errors.length > 0 ? errors : undefined,
      timestamp: new Date().toISOString()
    };

    console.log('Cleanup result:', result);

    return new Response(
      JSON.stringify(result),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );

  } catch (error) {
    console.error('Cleanup function error:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }
});