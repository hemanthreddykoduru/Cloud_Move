import React, { useState, useEffect } from 'react';
import { insforge } from '../lib/insforge';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeftRight, Clock, CheckCircle2, XCircle, AlertCircle, Play } from 'lucide-react';
import { Link } from 'react-router-dom';

type Transfer = {
  id: string;
  source_account_id: string;
  destination_account_id: string;
  status: string;
  total_files: number;
  total_bytes: number;
  transferred_bytes: number;
  created_at: string;
  source_account: { provider: string, email: string };
  destination_account: { provider: string, email: string };
};

const Transfers = () => {
  const { user } = useAuth();
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTransfers();
    // Poll for real-time progress updates
    const interval = setInterval(fetchTransfers, 3000);
    return () => clearInterval(interval);
  }, [user]);

  const fetchTransfers = async () => {
    const { data, error } = await insforge.database
      .from('transfers')
      .select(`
        *,
        source_account:connected_accounts!source_account_id(provider, email),
        destination_account:connected_accounts!destination_account_id(provider, email)
      `)
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setTransfers(data as any);
    }
    setIsLoading(false);
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED': return <CheckCircle2 className="h-5 w-5 text-success" />;
      case 'PROCESSING': return <div className="h-5 w-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />;
      case 'FAILED': return <XCircle className="h-5 w-5 text-red-500" />;
      default: return <Clock className="h-5 w-5 text-slate-400" />;
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Task List</h1>
          <p className="text-slate-500 mt-1">Monitor and manage your file transfers.</p>
        </div>
        <Link
          to="/dashboard/transfer"
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          <Play className="h-5 w-5" />
          New Transfer
        </Link>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      ) : transfers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <div className="h-16 w-16 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <ArrowLeftRight className="h-8 w-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">No tasks yet</h3>
          <p className="text-slate-500 mb-6">Start moving files between your connected cloud accounts.</p>
          <Link
            to="/dashboard/transfer"
            className="px-6 py-3 bg-primary text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
          >
            Start a Transfer
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-sm font-medium text-slate-500">Status</th>
                <th className="px-6 py-4 text-sm font-medium text-slate-500">Source</th>
                <th className="px-6 py-4 text-sm font-medium text-slate-500">Destination</th>
                <th className="px-6 py-4 text-sm font-medium text-slate-500">Progress</th>
                <th className="px-6 py-4 text-sm font-medium text-slate-500">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transfers.map(transfer => (
                <tr key={transfer.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(transfer.status)}
                      <span className="text-sm font-medium text-slate-900">{transfer.status}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-slate-900">{transfer.source_account?.provider?.replace('_', ' ')}</div>
                    <div className="text-xs text-slate-500">{transfer.source_account?.email}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-slate-900">{transfer.destination_account?.provider?.replace('_', ' ')}</div>
                    <div className="text-xs text-slate-500">{transfer.destination_account?.email}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="w-48">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-500">{formatBytes(transfer.transferred_bytes)}</span>
                        <span className="text-slate-500">{formatBytes(transfer.total_bytes)}</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5">
                        <div
                          className="bg-primary h-1.5 rounded-full transition-all duration-500"
                          style={{ width: `${transfer.total_bytes > 0 ? (transfer.transferred_bytes / transfer.total_bytes) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500">
                    {new Date(transfer.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Transfers;
