import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, LayoutDashboard, ArrowLeftRight, HardDrive, Settings, HelpCircle, Cloud, ListTodo, Share2, RefreshCw } from 'lucide-react';
import { Routes, Route, NavLink, useNavigate } from 'react-router-dom';

import ConnectAccount from './ConnectAccount';
import Transfers from './Transfers';
import NewTransfer from './NewTransfer';
import Shares from './Shares';
import CloudSync from './CloudSync';
import SettingsPage from './Settings';

import { insforge } from '../lib/insforge';

const DashboardHome = () => {
  const { user } = useAuth();
  const [stats, setStats] = React.useState({
    totalFiles: 0,
    storageFreed: 0,
    completedTransfers: 0,
    failedTransfers: 0
  });

  React.useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;
      const { data, error } = await insforge.database
        .from('transfers')
        .select('*')
        .eq('user_id', user.id);
        
      if (!error && data) {
        let totalFiles = 0;
        let storageFreed = 0;
        let completed = 0;
        let failed = 0;
        
        data.forEach(t => {
          if (t.status === 'COMPLETED') {
            completed++;
            totalFiles += (t.total_files || 0);
            if (t.options?.transfer_mode === 'move') {
              storageFreed += (t.total_bytes || 0);
            }
          } else if (t.status === 'FAILED') {
            failed++;
          }
        });
        
        setStats({ totalFiles, storageFreed, completedTransfers: completed, failedTransfers: failed });
      }
    };
    
    fetchStats();
  }, [user]);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-slate-900 mb-8">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-medium text-slate-500 mb-2">Total Files Transferred</h3>
          <p className="text-3xl font-bold text-slate-900">{stats.totalFiles}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-medium text-slate-500 mb-2">Storage Freed (Moved)</h3>
          <p className="text-3xl font-bold text-slate-900">{formatBytes(stats.storageFreed)}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-medium text-slate-500 mb-2">Transfers Completed</h3>
          <p className="text-3xl font-bold text-slate-900">{stats.completedTransfers}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-medium text-slate-500 mb-2">Failed Transfers</h3>
          <p className="text-3xl font-bold text-slate-900">{stats.failedTransfers}</p>
        </div>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard', end: true },
    { name: 'Task List', icon: ListTodo, path: '/dashboard/tasks' },
    { name: 'Cloud Transfer', icon: ArrowLeftRight, path: '/dashboard/transfer' },
    { name: 'Cloud Sync', icon: RefreshCw, path: '/dashboard/sync' },
    { name: 'Shares', icon: Share2, path: '/dashboard/shares' },
    { name: 'Accounts', icon: HardDrive, path: '/dashboard/accounts' },
    { name: 'Settings', icon: Settings, path: '/dashboard/settings' },
  ];

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-slate-200">
          <div className="flex items-center gap-2 text-primary font-bold text-xl">
            <Cloud className="h-6 w-6" />
            <span>CloudMove</span>
          </div>
        </div>
        
        <div className="flex-1 py-6 flex flex-col gap-2 px-4">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
                  isActive ? 'bg-primary/10 text-primary' : 'text-slate-600 hover:bg-slate-50'
                }`
              }
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </NavLink>
          ))}
        </div>

        <div className="p-4 border-t border-slate-200">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="h-10 w-10 rounded-full bg-slate-200 overflow-hidden">
              {user?.profile?.avatar_url ? (
                <img src={user.profile.avatar_url} alt="Profile" className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                  {user?.email?.[0].toUpperCase()}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">{user?.profile?.name || 'User'}</p>
              <p className="text-xs text-slate-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button onClick={handleSignOut} className="w-full mt-2 flex items-center gap-3 px-3 py-2 text-slate-600 hover:bg-slate-50 hover:text-red-600 rounded-lg transition-colors">
          <LogOut className="h-5 w-5" />
          <span className="font-medium">Sign Out</span>
        </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="h-16 flex items-center justify-end px-8 bg-white/50 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-10">
          <button className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition-colors">
            <HelpCircle className="h-5 w-5" />
            Support
          </button>
        </div>
        
        <Routes>
          <Route path="/" element={<DashboardHome />} />
          <Route path="/transfer" element={<NewTransfer />} />
          <Route path="/tasks" element={<Transfers />} />
          <Route path="/sync" element={<CloudSync />} />
          <Route path="/shares" element={<Shares />} />
          <Route path="/accounts" element={<ConnectAccount />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </main>
    </div>
  );
};

export default Dashboard;
