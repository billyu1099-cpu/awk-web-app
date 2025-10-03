import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from './hooks/useAuth';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import ProjectList from './components/ProjectList';
import ProjectOverview from './components/ProjectOverview';
import EmailConfirmationPage from './components/EmailConfirmationPage';
import ClientList from './components/ClientList';
import ClientDetails from './components/ClientDetails';
import { supabase } from './lib/supabase';
import { ArrowLeft, Bell } from 'lucide-react';
import NotificationCenter from './components/NotificationCenter';
import Dashboard from './components/Dashboard';

function App() {
  const { user, loading, signIn, signUp, signOut } = useAuth();
  const [activeItem, setActiveItem] = useState('dashboard');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [authView, setAuthView] = useState<'login' | 'register' | 'confirm-email'>('login');
  const [authError, setAuthError] = useState<string | null>(null);
  const [pendingEmail, setPendingEmail] = useState<string>('');
  const [userProfile, setUserProfile] = useState<{ role?: string } | null>(null);
  const [showRegister, setShowRegister] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState<
    { id: string; title: string; message: string; is_read: boolean; created_at: string }[]
  >([]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        setUserProfile({ ...data, id: user.id, email: data?.email || user.email });
        console.log('Loaded userProfile:', data); // Debug: see what you get
      }
    };
    fetchProfile();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const fetchNotifications = async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('id, title, message, is_read, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (!error && data) {
        setNotifications(data);
      }
    };
    fetchNotifications();
  }, [user]);

  const handleLogin = async (email: string, password: string) => {
    try {
      setAuthError(null);
      await signIn(email, password);
      // User will be automatically redirected to dashboard after successful login
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Login failed');
    }
  };

  const handleRegister = async (email: string, password: string, fullName: string) => {
    try {
      setAuthError(null);
      // This function is kept for compatibility but registration is handled in RegisterPage
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Registration failed');
    }
  };

  const handleRegistrationSuccess = (email: string) => {
    setShowRegister(false); // Hide the register page
    setAuthView('login');   // Show the login page
    setAuthError(null);
  };

  const handleLogout = async () => {
    try {
      await signOut();
      setSelectedProjectId(null);
      setActiveItem('dashboard');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleItemClick = (item: string) => {
    setActiveItem(item);
    setSelectedProjectId(null); // Clear selected project when switching pages
    setSelectedClientId(null); // Clear selected client when switching pages
  };

  const handleCreateProject = () => {
    alert('Create Project functionality would be implemented here');
  };

  const handleViewProject = (projectId: string) => {
    setSelectedProjectId(projectId);
  };

  const handleBackToProjects = () => {
    setSelectedProjectId(null);
  };

  const handleViewClient = (clientId: string) => {
    setSelectedClientId(clientId);
  };

  const handleBackToClients = () => {
    setSelectedClientId(null);
  };
  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center space-x-3">
          <div className="w-6 h-6 border-2 border-[#4d9837] border-t-transparent rounded-full animate-spin"></div>
          <span className="text-gray-600">Loading...</span>
        </div>
      </div>
    );
  }

  // Show auth pages if user is not logged in
  if (!user) {
    if (authView === 'confirm-email') {
      return (
        <EmailConfirmationPage
          email={pendingEmail}
          onNavigateToLogin={() => {
            setAuthView('login');
            setAuthError(null);
            setPendingEmail('');
          }}
          onNavigateToRegister={() => {
            setAuthView('register');
            setAuthError(null);
          }}
        />
      );
    }

    if (authView === 'register') {
      return (
        <RegisterPage
          onRegister={handleRegister}
          onRegistrationSuccess={handleRegistrationSuccess}
          onNavigateToLogin={() => {
            setAuthView('login');
            setAuthError(null);
          }}
          error={authError}
        />
      );
    }

    return (
      <LoginPage
        onLogin={handleLogin}
        onNavigateToRegister={() => {
          setAuthView('register');
          setAuthError(null);
        }}
        error={authError}
      />
    );
  }

  if (
    user &&
    showRegister &&
    !!userProfile &&
    ['Partner', 'Manager', 'Dev'].includes(userProfile.role ?? '')
  ) {
    return (
      <RegisterPage
        onRegister={handleRegister}
        onRegistrationSuccess={handleRegistrationSuccess}
        error={authError}
        BackToAppButton={
          <button
            onClick={() => setShowRegister(false)}
            className="text-gray-600 hover:text-gray-800 font-medium text-sm transition-colors duration-200 hover:underline inline-flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to App
          </button>
        }
      />
    );
  }

  // Show main app if user is logged in
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar
        userName={user.user_metadata?.first_name || user.email || 'User'}
        onAddUser={() => setShowRegister(true)}
        userProfile={userProfile}
        isPrivileged={!!userProfile && ['Partner', 'Manager', 'Dev'].includes(userProfile.role)}
        notificationButton={
          <button
            type="button"
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Notifications"
            onClick={() => setNotificationOpen(true)}
          >
            <Bell className="w-6 h-6 text-gray-500" />
          </button>
        }
        unreadCount={notifications.filter(n => !n.is_read).length}
      />
            
      <div className="flex h-[calc(100vh-64px)]">
        <Sidebar 
          activeItem={activeItem} 
          onItemClick={handleItemClick} 
          onLogout={handleLogout}
        />
        
        <div className="flex-1 overflow-auto">
          {activeItem === 'dashboard' && (
            <Dashboard userProfile={userProfile} />
          )}
          
          {activeItem === 'projects' && (
            <>
              {selectedProjectId ? (
                <ProjectOverview
                  projectId={selectedProjectId}
                  onBack={handleBackToProjects}
                />
              ) : (
                <ProjectList
                  onCreateProject={handleCreateProject}
                  onViewProject={handleViewProject}
                />
              )}
            </>
          )}
          
          {activeItem === 'clients' && (
            <>
              {selectedClientId ? (
                <ClientDetails
                  clientId={selectedClientId}
                  onBack={handleBackToClients}
                />
              ) : (
                <ClientList
                  onViewClient={handleViewClient}
                />
              )}
            </>
          )}

          
        </div>
      </div>
      <NotificationCenter
        open={notificationOpen}
        onClose={() => setNotificationOpen(false)}
        notifications={notifications}
      />
    </div>
  );
}

export default App;