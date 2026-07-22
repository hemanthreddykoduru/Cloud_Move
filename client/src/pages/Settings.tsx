import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, Bell, CreditCard, Shield, Key, Laptop, Settings as SettingsIcon, Cloud } from 'lucide-react';
import { insforge } from '../lib/insforge';

const Settings = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [name, setName] = useState(user?.profile?.name || '');

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const { error } = await insforge.auth.setProfile({
        name: name
      });
      if (error) throw error;
      // Show success toast here in a real app
      alert('Profile updated successfully!');
      window.location.reload(); // Force reload to fetch the new user object
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto flex flex-col h-full font-sans">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Settings</h1>
        <p className="text-slate-500 mt-2">Manage your account preferences and configurations.</p>
      </div>

      <div className="flex gap-10 flex-1 min-h-0">
        
        {/* Sidebar Tabs */}
        <div className="w-64 flex flex-col gap-1">
          {[
            { id: 'profile', label: 'My Profile', icon: User },
            { id: 'billing', label: 'Billing & Plans', icon: CreditCard },
            { id: 'security', label: 'Security', icon: Shield },
            { id: 'api', label: 'API Keys', icon: Key },
            { id: 'notifications', label: 'Notifications', icon: Bell },
            { id: 'appearance', label: 'Appearance', icon: Laptop },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                activeTab === tab.id 
                  ? 'bg-slate-900 text-white shadow-md' 
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <tab.icon className="h-5 w-5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-white rounded-3xl border border-slate-200 shadow-sm p-10 overflow-y-auto">
          
          {activeTab === 'profile' && (
            <div className="max-w-2xl animate-in fade-in duration-300">
              <h2 className="text-2xl font-bold text-slate-900 mb-6 tracking-tight">Profile Details</h2>
              
              <div className="flex items-center gap-6 mb-10 pb-10 border-b border-slate-100">
                <div className="h-24 w-24 rounded-full bg-slate-100 overflow-hidden shadow-inner border border-slate-200">
                  {user?.profile?.avatar_url ? (
                    <img src={user.profile.avatar_url} alt="Profile" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-tr from-slate-200 to-slate-100 flex items-center justify-center text-slate-500 font-bold text-3xl">
                      {user?.email?.[0].toUpperCase()}
                    </div>
                  )}
                </div>
                <div>
                  <button className="px-5 py-2.5 bg-slate-900 text-white font-medium text-sm rounded-full hover:bg-black transition-colors shadow-sm">
                    Upload new picture
                  </button>
                  <p className="text-xs text-slate-400 mt-3">JPG, GIF or PNG. Max size of 800K.</p>
                </div>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Full Name</label>
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Email Address</label>
                  <input 
                    type="email" 
                    value={user?.email || ''}
                    disabled
                    className="w-full px-5 py-3.5 bg-slate-100 border border-slate-200 rounded-2xl text-slate-500 cursor-not-allowed"
                  />
                  <p className="text-xs text-slate-500 mt-2">Your email address is managed through your connected OAuth providers.</p>
                </div>

                <div className="pt-6">
                  <button 
                    type="submit"
                    disabled={isSaving}
                    className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-full shadow-sm transition-all disabled:opacity-50"
                  >
                    {isSaving ? 'Saving Changes...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'billing' && (
            <div className="max-w-2xl animate-in fade-in duration-300">
              <h2 className="text-2xl font-bold text-slate-900 mb-2 tracking-tight">Billing & Plans</h2>
              <p className="text-slate-500 mb-8">Manage your subscription and usage limits.</p>

              <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-8 rounded-3xl text-white shadow-xl mb-10 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                  <Cloud className="w-48 h-48 -mr-10 -mt-10" />
                </div>
                <div className="relative z-10">
                  <span className="inline-block px-3 py-1 bg-emerald-500/20 text-emerald-400 font-semibold text-xs rounded-full uppercase tracking-wider mb-4 border border-emerald-500/30">Current Plan</span>
                  <div className="flex items-baseline gap-2 mb-2">
                    <h3 className="text-4xl font-bold">Pro</h3>
                    <span className="text-slate-400 font-medium">/ $12 per month</span>
                  </div>
                  <p className="text-slate-400 mb-8 max-w-md">You have access to 1TB of monthly transfer bandwidth and advanced sync scheduling.</p>
                  
                  <button className="px-6 py-3 bg-white text-slate-900 font-semibold rounded-full shadow-sm hover:bg-slate-50 transition-all">
                    Manage Subscription
                  </button>
                </div>
              </div>

              <h3 className="text-lg font-bold text-slate-900 mb-4">Transfer Bandwidth</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm font-medium">
                  <span className="text-slate-700">234 GB Used</span>
                  <span className="text-slate-500">1000 GB Total</span>
                </div>
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: '23.4%' }}></div>
                </div>
              </div>
            </div>
          )}

          {activeTab !== 'profile' && activeTab !== 'billing' && (
            <div className="h-full flex flex-col items-center justify-center text-center animate-in fade-in duration-300 pt-16">
              <SettingsIcon className="h-16 w-16 text-slate-200 mb-6" />
              <h3 className="text-xl font-bold text-slate-900 mb-2">Under Construction</h3>
              <p className="text-slate-500 max-w-sm">This section is currently being built. Check back soon for new features!</p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default Settings;
