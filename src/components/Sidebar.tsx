import React, { useEffect, useState } from 'react';
import { Home, Folder, Users, LogOut, UserPlus } from 'lucide-react';
import { supabase } from '../lib/supabase';



interface SidebarProps {
  activeItem: string;
  onItemClick: (item: string) => void;
  onLogout?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeItem, onItemClick, onLogout }) => {
  const [userProfile, setUserProfile] = useState<{ role?: string } | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const user = supabase.auth.getUser
        ? (await supabase.auth.getUser()).data.user
        : supabase.auth.user();
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        setUserProfile(data);
      }
    };
    fetchProfile();
  }, []);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'projects', label: 'Projects', icon: Folder },
    { id: 'clients', label: 'Clients', icon: Users },
  ];

  return (
    <div className="w-64 bg-white shadow-sm border-r border-gray-200 h-full flex flex-col">
      <div className="flex-1 py-6">
        <nav className="space-y-2 px-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeItem === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => onItemClick(item.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                  isActive
                    ? 'bg-[#4d9837] text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon size={20} />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
          
        </nav>
      </div>
      
      <div className="px-4 pb-6">
        <button 
          onClick={onLogout}
          className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
        >
          <LogOut size={20} />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;