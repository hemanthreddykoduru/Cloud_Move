import React, { useState, useEffect } from 'react';
import { insforge } from '../lib/insforge';
import { useAuth } from '../contexts/AuthContext';
import { HardDrive, Trash2, CheckCircle2, Server, Cloud, FolderGit2, Mail, Image as ImageIcon } from 'lucide-react';

type ConnectedAccount = {
  id: string;
  provider: string;
  email: string;
  storage_used: number;
  storage_limit: number;
};

const ConnectAccount = () => {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    const { data, error } = await insforge.database
      .from('connected_accounts')
      .select('*')
      .eq('user_id', user?.id);

    if (error) {
      console.error('Error fetching accounts:', error);
    } else {
      setAccounts(data || []);
    }
    setIsLoading(false);
  };

  const handleConnect = async (providerId: string, providerName: string) => {
    if (providerId === 'GOOGLE_DRIVE') {
      window.location.href = `http://localhost:3001/api/auth/google/connect?userId=${user?.id}`;
      return;
    }

    // Mock flow for other providers for now
    const mockEmail = `user-${Math.floor(Math.random() * 1000)}@${providerId.toLowerCase()}.com`;
    
    const { error } = await insforge.database.from('connected_accounts').insert([{
      user_id: user?.id,
      provider: providerId,
      provider_user_id: `mock-id-${Date.now()}`,
      email: mockEmail,
      token_vault_ref: 'mock-vault-ref',
      scopes_granted: ['all'],
      storage_used: Math.floor(Math.random() * 50) * 1024 * 1024 * 1024,
      storage_limit: 100 * 1024 * 1024 * 1024
    }]);

    if (!error) {
      fetchAccounts();
    }
  };

  const handleDisconnect = async (id: string) => {
    const { error } = await insforge.database
      .from('connected_accounts')
      .delete()
      .eq('id', id);

    if (!error) {
      fetchAccounts();
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  type CloudService = {
    id: string;
    name: string;
    iconUrl?: string;
    icon?: React.ReactNode;
    color?: string;
  };

  const personalServices: CloudService[] = [
    { id: 'GOOGLE_DRIVE', name: 'Google Drive', iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/1/12/Google_Drive_icon_%282020%29.svg' },
    { id: 'SHARED_WITH_ME', name: 'Shared with me', iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/1/12/Google_Drive_icon_%282020%29.svg' },
    { id: 'GMAIL', name: 'Gmail', iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/7/7e/Gmail_icon_%282020%29.svg' },
    { id: 'ONEDRIVE', name: 'OneDrive', iconUrl: "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%230078D4'%3E%3Cpath d='M19.453 9.95q.961.058 1.787.468.826.41 1.442 1.066.615.657.966 1.512.352.856.352 1.816 0 1.008-.387 1.893-.386.885-1.049 1.547-.662.662-1.546 1.049-.885.387-1.893.387H6q-1.242 0-2.332-.475-1.09-.475-1.904-1.29-.815-.814-1.29-1.903Q0 14.93 0 13.688q0-.985.31-1.887.311-.903.862-1.658.55-.756 1.324-1.325.774-.568 1.711-.861.434-.129.85-.187.416-.06.861-.082h.012q.515-.786 1.207-1.413.691-.627 1.5-1.066.808-.44 1.705-.668.896-.229 1.845-.229 1.278 0 2.456.417 1.177.416 2.144 1.16.967.744 1.658 1.78.692 1.038 1.008 2.28zm-7.265-4.137q-1.325 0-2.52.544-1.195.545-2.04 1.565.446.117.85.299.405.181.792.416l4.78 2.86 2.731-1.15q.27-.117.545-.204.276-.088.58-.147-.293-.937-.855-1.705-.563-.768-1.319-1.318-.755-.551-1.658-.856-.902-.304-1.886-.304zM2.414 16.395l9.914-4.184-3.832-2.297q-.586-.351-1.23-.539-.645-.188-1.325-.188-.914 0-1.722.364-.809.363-1.412.978-.604.616-.955 1.436-.352.82-.352 1.723 0 .703.234 1.423.235.721.68 1.284zm16.711 1.793q.563 0 1.078-.176.516-.176.961-.516l-7.23-4.324-10.301 4.336q.527.328 1.13.504.604.175 1.237.175zm3.012-1.852q.363-.727.363-1.523 0-.774-.293-1.407t-.791-1.072q-.498-.44-1.166-.68-.668-.24-1.406-.24-.422 0-.838.1t-.815.252q-.398.152-.785.334-.386.181-.761.345Z'/%3E%3C/svg%3E" },
    { id: 'DROPBOX', name: 'Dropbox', iconUrl: 'https://cdn.simpleicons.org/dropbox/0061FF' },
    { id: 'ICLOUD', name: 'iCloud Photos', iconUrl: 'https://cdn.simpleicons.org/icloud/3693F3' },
    { id: 'MEGA', name: 'MEGA', iconUrl: 'https://cdn.simpleicons.org/mega/D9272E' },
    { id: 'FTP', name: 'FTP', icon: <Server className="h-8 w-8 text-slate-700" />, color: 'bg-slate-100' },
  ];

  const businessServices: CloudService[] = [
    { id: 'WORKSPACE', name: 'Google Workspace', iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/1/12/Google_Drive_icon_%282020%29.svg' },
    { id: 'SHARED_DRIVE', name: 'Shared Drive', iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/1/12/Google_Drive_icon_%282020%29.svg' },
    { id: 'ONEDRIVE_BIZ', name: 'OneDrive for Business', iconUrl: "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%230078D4'%3E%3Cpath d='M19.453 9.95q.961.058 1.787.468.826.41 1.442 1.066.615.657.966 1.512.352.856.352 1.816 0 1.008-.387 1.893-.386.885-1.049 1.547-.662.662-1.546 1.049-.885.387-1.893.387H6q-1.242 0-2.332-.475-1.09-.475-1.904-1.29-.815-.814-1.29-1.903Q0 14.93 0 13.688q0-.985.31-1.887.311-.903.862-1.658.55-.756 1.324-1.325.774-.568 1.711-.861.434-.129.85-.187.416-.06.861-.082h.012q.515-.786 1.207-1.413.691-.627 1.5-1.066.808-.44 1.705-.668.896-.229 1.845-.229 1.278 0 2.456.417 1.177.416 2.144 1.16.967.744 1.658 1.78.692 1.038 1.008 2.28zm-7.265-4.137q-1.325 0-2.52.544-1.195.545-2.04 1.565.446.117.85.299.405.181.792.416l4.78 2.86 2.731-1.15q.27-.117.545-.204.276-.088.58-.147-.293-.937-.855-1.705-.563-.768-1.319-1.318-.755-.551-1.658-.856-.902-.304-1.886-.304zM2.414 16.395l9.914-4.184-3.832-2.297q-.586-.351-1.23-.539-.645-.188-1.325-.188-.914 0-1.722.364-.809.363-1.412.978-.604.616-.955 1.436-.352.82-.352 1.723 0 .703.234 1.423.235.721.68 1.284zm16.711 1.793q.563 0 1.078-.176.516-.176.961-.516l-7.23-4.324-10.301 4.336q.527.328 1.13.504.604.175 1.237.175zm3.012-1.852q.363-.727.363-1.523 0-.774-.293-1.407t-.791-1.072q-.498-.44-1.166-.68-.668-.24-1.406-.24-.422 0-.838.1t-.815.252q-.398.152-.785.334-.386.181-.761.345Z'/%3E%3C/svg%3E" },
    { id: 'DROPBOX_BIZ', name: 'Dropbox Business', iconUrl: 'https://cdn.simpleicons.org/dropbox/0061FF' },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto flex flex-col h-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Manage Clouds</h1>
        <p className="text-slate-500 mt-1">Connect and manage your cloud storage providers.</p>
      </div>

      {/* Connected Accounts Section */}
      {!isLoading && accounts.length > 0 && (
        <div className="mb-12">
          <h2 className="text-xl font-bold text-slate-900 mb-6 border-b border-slate-200 pb-2">My Connected Clouds</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {accounts.map(account => (
              <div key={account.id} className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-20 h-20 bg-blue-50 rounded-bl-full -z-0 opacity-50 transition-transform group-hover:scale-110" />
                <div className="flex items-start justify-between relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-50 border border-slate-100 rounded-lg">
                      <HardDrive className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900">{account.provider.replace('_', ' ')}</h3>
                      <p className="text-sm text-slate-500">{account.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDisconnect(account.id)}
                    className="text-slate-400 hover:text-red-500 transition-colors p-1 bg-white rounded-md hover:bg-red-50"
                    title="Disconnect"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>

                <div className="mt-6 relative z-10">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-500">Storage Used</span>
                    <span className="font-medium text-slate-900">
                      {formatBytes(account.storage_used)} / {formatBytes(account.storage_limit)}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full"
                      style={{ width: `${Math.min(100, (account.storage_used / account.storage_limit) * 100)}%` }}
                    />
                  </div>
                </div>

                <div className="mt-6 flex items-center gap-2 text-sm text-success font-medium relative z-10">
                  <CheckCircle2 className="h-4 w-4" />
                  Connected successfully
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add New Service Section */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 mb-6 border-b border-slate-200 pb-2">Select a service to connect</h2>
        
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          {/* Personal Services */}
          <div className="p-8 border-b border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-6">Personal Services</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
              {personalServices.map(service => (
                <button
                  key={service.id}
                  onClick={() => handleConnect(service.id, service.name)}
                  className="flex flex-col items-center justify-center p-4 rounded-2xl border border-transparent hover:border-slate-200 hover:shadow-lg transition-all group"
                >
                  <div className={`h-16 w-16 ${service.color || 'bg-slate-50/50'} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    {service.iconUrl ? (
                      <img src={service.iconUrl} alt={service.name} className="h-10 w-10 object-contain drop-shadow-sm" />
                    ) : (
                      service.icon
                    )}
                  </div>
                  <span className="text-sm font-medium text-slate-700 text-center">{service.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Business Services */}
          <div className="p-8 bg-slate-50/50">
            <h3 className="text-lg font-bold text-slate-900 mb-6">Business Services</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
              {businessServices.map(service => (
                <button
                  key={service.id}
                  onClick={() => handleConnect(service.id, service.name)}
                  className="flex flex-col items-center justify-center p-4 rounded-2xl border border-transparent hover:border-slate-200 hover:bg-white hover:shadow-lg transition-all group"
                >
                  <div className={`h-16 w-16 ${service.color || 'bg-white'} shadow-sm rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    {service.iconUrl ? (
                      <img src={service.iconUrl} alt={service.name} className="h-10 w-10 object-contain drop-shadow-sm" />
                    ) : (
                      service.icon
                    )}
                  </div>
                  <span className="text-sm font-medium text-slate-700 text-center">{service.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default ConnectAccount;
