import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ProfileCenterProps {
  open: boolean;
  onClose: () => void;
  profile: {
    id: string;
    first_name?: string;
    last_name?: string;
    username?: string;
    email?: string;
  };
  onProfileUpdated?: (profile: any) => void;
}

const ProfileCenter: React.FC<ProfileCenterProps> = ({ open, onClose, profile, onProfileUpdated }) => {
  const [editMode, setEditMode] = useState(false);
  const [username, setUsername] = useState(profile.username || '');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState('');
  const [error, setError] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Reset modal state when closed or opened
  useEffect(() => {
    if (!open) {
      setEditMode(false);
      setShowPassword(false);
      setCurrentPassword('');
      setNewPassword('');
      setPasswordMsg('');
      setError('');
      setConfirmPassword('');
    } else {
      setUsername(profile.username || '');
    }
  }, [open, profile]);

  // Save only username if changed
  const handleSave = async () => {
    setLoading(true);
    setError('');
    try {
      if (username && username !== profile.username) {
        const { error: usernameError } = await supabase
          .from('profiles')
          .update({ username })
          .eq('id', profile.id);
        if (usernameError) throw usernameError;
        // Update local profile instantly
        if (onProfileUpdated) {
          onProfileUpdated({ ...profile, username });
        }
      }
      setEditMode(false);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    }
    setLoading(false);
  };

  // Change password with current password check
  const handleChangePassword = async () => {
  setPasswordMsg('');
  setLoading(true);
  if (newPassword !== confirmPassword) {
    setPasswordMsg('New password and confirm password do not match.');
    setLoading(false);
    return;
  }
  try {
    // Re-authenticate user with current password
    const { data: { user }, error: authError } = await supabase.auth.signInWithPassword({
      email: profile.email!,
      password: currentPassword,
    });
    if (authError || !user) {
      setPasswordMsg('Current password is incorrect.');
      setLoading(false);
      return;
    }
    // Update password
    const { error: pwError } = await supabase.auth.updateUser({ password: newPassword });
    if (pwError) {
      setPasswordMsg(pwError.message);
    } else {
      setPasswordMsg('Password updated!');
      setShowPassword(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
  } catch (err: any) {
    setPasswordMsg('Failed to update password.');
  }
  setLoading(false);
};

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 z-40 bg-black bg-opacity-40 backdrop-blur-sm transition-opacity duration-300 ${
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />
      {/* Profile Panel */}
      <aside
        className={`fixed top-0 right-0 h-full z-50 w-full max-w-xl bg-white shadow-xl transition-transform duration-300
          ${open ? 'translate-x-0' : 'translate-x-full'}
        `}
        style={{ width: '50vw', maxWidth: 480, minWidth: 320 }}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Profile</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="overflow-y-auto h-[calc(100vh-64px)] px-6 py-8 flex flex-col items-center">
          {!editMode ? (
            <>
              <div className="text-2xl font-semibold text-gray-900 mb-2">
                {profile.first_name} {profile.last_name}
              </div>
              <div className="text-gray-600 mb-1">
                <span className="font-medium">Username:</span> {profile.username || <span className="text-gray-400">Not set</span>}
              </div>
              <div className="text-gray-600 mb-1">
                <span className="font-medium">Email:</span> {profile.email}
              </div>
              <button
                className="mt-6 px-4 py-2 bg-[#4d9837] text-white rounded-lg hover:bg-[#3d7a2a] transition-colors"
                onClick={() => setEditMode(true)}
              >
                Edit Profile
              </button>
              <button
                className="mt-3 px-4 py-2 bg-gray-200 text-[#4d9837] rounded-lg hover:bg-gray-300 transition-colors"
                onClick={() => setShowPassword(true)}
              >
                Change Password
              </button>
            </>
          ) : (
            <form
              className="w-full max-w-xs flex flex-col items-center"
              onSubmit={e => {
                e.preventDefault();
                handleSave();
              }}
            >
              <input
                className="mb-3 w-full px-3 py-2 border border-gray-300 rounded-lg"
                placeholder="Username"
                value={username}
                onChange={e => setUsername(e.target.value)}
              />
              {error && <div className="text-red-600 mb-2">{error}</div>}
              <div className="flex space-x-2 mt-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#4d9837] text-white rounded-lg hover:bg-[#3d7a2a] transition-colors"
                  disabled={loading}
                >
                  Save
                </button>
                <button
                  type="button"
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  onClick={() => setEditMode(false)}
                  disabled={loading}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Change Password Modal */}
          {showPassword && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-xs flex flex-col items-center">
                <h3 className="text-lg font-semibold mb-4 text-gray-900">Change Password</h3>
                <input
                    className="mb-3 w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Current Password"
                    type="password"
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                    required
                />
                <input
                    className="mb-3 w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="New Password"
                    type="password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    required
                />
                <input
                    className="mb-3 w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="Confirm New Password"
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    required
                />
                {passwordMsg && (
                    <div className={`mb-2 ${passwordMsg.includes('updated') ? 'text-green-600' : 'text-red-600'}`}>
                    {passwordMsg}
                    </div>
                )}
                <div className="flex space-x-2 mt-2">
                    <button
                    className="px-4 py-2 bg-[#4d9837] text-white rounded-lg hover:bg-[#3d7a2a] transition-colors"
                    onClick={handleChangePassword}
                    disabled={loading}
                    >
                    Save
                    </button>
                    <button
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                    onClick={() => {
                        setShowPassword(false);
                        setCurrentPassword('');
                        setNewPassword('');
                        setConfirmPassword('');
                        setPasswordMsg('');
                    }}
                    disabled={loading}
                    >
                    Cancel
                    </button>
                </div>
                </div>
            </div>
            )}
        </div>
      </aside>
    </>
  );
};

export default ProfileCenter;