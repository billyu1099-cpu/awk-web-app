import React ,{useState, useEffect}from 'react';
import { User,UserPlus,Bell } from 'lucide-react';
import ProfileCenter from './ProfileCenter'; // Make sure the path is correct
import { supabase } from '../lib/supabase';

interface NavbarProps {
  userName: string;
  onAddUser?: () => void; 
  isPrivileged?: boolean; 
  notificationButton?: React.ReactNode;
  unreadCount?: number;
  userProfile?: any; // Replace 'any' with the correct type if available
}

const Navbar: React.FC<NavbarProps> =  ({ userName, onAddUser, isPrivileged, notificationButton, unreadCount = 0,userProfile }) => {
  const [showProfile, setShowProfile] = useState(false);
  const [localUserProfile, setLocalUserProfile] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, username, email')
          .eq('id', user.id)
          .single();
        if (!error && data) setLocalUserProfile({ ...data, email: user.email });
      }
    };
    fetchProfile();
  }, []);

  console.log('userProfile:', userProfile, 'showProfile:', showProfile);
  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 h-16 flex items-center justify-between px-6">
      <div className="flex items-center space-x-3">
        <img 
          src="/awk3.webp" 
          alt="AWK LLP" 
          className="h-10 w-auto"
        />
      </div>
      <div className="flex items-center space-x-4">
        {/* Add User button for privileged users */}
        {isPrivileged && onAddUser && (
          <button
            onClick={onAddUser}
            type="button"
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <UserPlus className="w-6 h-6 text-gray-500" />
          </button>
        )}
        {/* Bell icon */}
        <div className="relative flex items-center">
          <button
            type="button"
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Notifications"
            onClick={notificationButton && typeof notificationButton === 'object' && 'props' in notificationButton
              ? notificationButton.props.onClick
              : undefined}
          >
            <Bell className="w-6 h-6 text-gray-500" />
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 -mt-1 -mr-1 bg-red-500 text-white text-xs font-bold rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
                {unreadCount}
              </span>
            )}
          </button>
        </div>
        <span className="text-lg  text-gray-900">
          Welcome, {userName}
        </span>
        <button
          className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center"
          onClick={() => setShowProfile(true)}
          aria-label="Profile"
        >
          <User size={16} className="text-gray-600" />
        </button>
        {/* ProfileCenter Drawer */}
        {userProfile && (
          <ProfileCenter
            open={showProfile}
            onClose={() => setShowProfile(false)}
            profile={localUserProfile || { first_name: '', last_name: '', email: '', id: '' }}
          />
        )}
      </div>
    </nav>
  );
};

export default Navbar;