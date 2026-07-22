import React, { useState, useEffect } from 'react';
import { insforge } from '../lib/insforge';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, HardDrive, Folder, CheckCircle2, ChevronRight, X } from 'lucide-react';

type Account = {
  id: string;
  provider: string;
  email: string;
};

const NewTransfer = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [sourceAccount, setSourceAccount] = useState<Account | null>(null);
  const [destAccount, setDestAccount] = useState<Account | null>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'source' | 'dest'>('source');
  
  const [isFileBrowserOpen, setIsFileBrowserOpen] = useState(false);
  const [fileBrowserStep, setFileBrowserStep] = useState<'select-source-files' | 'select-dest-folder'>('select-source-files');
  const [selectedMockFiles, setSelectedMockFiles] = useState<string[]>([]);
  const [sourceFiles, setSourceFiles] = useState<any[]>([]);
  const [destFolders, setDestFolders] = useState<any[]>([]);
  const [selectedDestFolder, setSelectedDestFolder] = useState<string | null>('root');
  const [transferMode, setTransferMode] = useState<'copy' | 'move'>('copy');
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [fileFetchError, setFileFetchError] = useState<string | null>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    const { data } = await insforge.database
      .from('connected_accounts')
      .select('*')
      .eq('user_id', user?.id);
    
    if (data) setAccounts(data as Account[]);
  };

  const handleOpenModal = (type: 'source' | 'dest') => {
    setModalType(type);
    setIsModalOpen(true);
  };

  const handleSelectAccount = (account: Account) => {
    if (modalType === 'source') {
      setSourceAccount(account);
      if (destAccount?.id === account.id) setDestAccount(null);
    } else {
      setDestAccount(account);
      if (sourceAccount?.id === account.id) setSourceAccount(null);
    }
    setIsModalOpen(false);
  };

  const handleStartTransferFlow = async () => {
    if (!sourceAccount || !destAccount) return;
    setFileBrowserStep('select-source-files');
    setSelectedMockFiles([]);
    setIsFileBrowserOpen(true);
    setIsLoadingFiles(true);
    
    try {
      setFileFetchError(null);
      
      const res = await fetch(`http://localhost:3001/api/drive/files?accountId=${sourceAccount.id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'API Error');
      
      const formatted = data.map((f: any) => ({
        id: f.id,
        name: f.name,
        type: f.mimeType === 'application/vnd.google-apps.folder' ? 'folder' : 'file',
        sizeFormatted: f.size ? formatBytes(parseInt(f.size)) : '--',
        rawSize: f.size ? parseInt(f.size) : 0
      }));
      setSourceFiles(formatted);
    } catch (err: any) {
      console.error(err);
      setFileFetchError(err.message || 'Unknown network error');
      setSourceFiles([]);
    } finally {
      setIsLoadingFiles(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleConfirmFiles = async () => {
    if (selectedMockFiles.length === 0) return;
    setFileBrowserStep('select-dest-folder');
    setIsLoadingFiles(true);
    setFileFetchError(null);

    try {
      const res = await fetch(`http://localhost:3001/api/drive/files?accountId=${destAccount?.id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'API Error');
      
      const formatted = data
        .filter((f: any) => f.mimeType === 'application/vnd.google-apps.folder')
        .map((f: any) => ({
          id: f.id,
          name: f.name,
          type: 'folder'
        }));
        
      setDestFolders([{ id: 'root', name: 'My Drive (Root)', type: 'folder' }, ...formatted]);
    } catch (err: any) {
      console.error(err);
      setFileFetchError(err.message || 'Unknown network error');
      setDestFolders([{ id: 'root', name: 'My Drive (Root)', type: 'folder' }]);
    } finally {
      setIsLoadingFiles(false);
    }
  };

  const handleConfirmDestinationAndTransfer = async () => {
    setIsFileBrowserOpen(false);
    setIsSubmitting(true);
    
    // Calculate actual total bytes from selected files
    const totalBytes = sourceFiles
      .filter(f => selectedMockFiles.includes(f.id))
      .reduce((sum, f) => sum + (f.rawSize || 0), 0);

    // Create transfer record
    const { data, error } = await insforge.database.from('transfers').insert([{
      user_id: user?.id,
      source_account_id: sourceAccount!.id,
      destination_account_id: destAccount!.id,
      status: 'PENDING',
      total_files: selectedMockFiles.length,
      total_bytes: totalBytes,
      options: {
        source_file_ids: selectedMockFiles,
        destination_folder_id: selectedDestFolder,
        transfer_mode: transferMode
      }
    }]).select().single();

    if (!error && data) {
      navigate('/dashboard/tasks');
    } else {
      console.error("Failed to create transfer", error);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto flex flex-col h-full">
      <div className="mb-12">
        <h1 className="text-3xl font-bold text-slate-900">Cloud Transfer</h1>
        <p className="text-slate-500 mt-1">Create a transfer task to move files between your cloud drives.</p>
      </div>

      {/* Transfer Builder */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-8 flex-1 max-h-[400px]">
        
        {/* FROM Box */}
        <div 
          onClick={() => handleOpenModal('source')}
          className={`flex-1 w-full h-full min-h-[250px] border-2 border-dashed rounded-3xl flex flex-col items-center justify-center p-8 cursor-pointer transition-all ${sourceAccount ? 'border-primary bg-primary/5' : 'border-slate-300 hover:border-primary/50 hover:bg-slate-50'}`}
        >
          {sourceAccount ? (
            <div className="text-center">
              <div className="h-16 w-16 bg-white shadow-sm rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-100">
                <HardDrive className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-bold text-slate-900 text-xl">{sourceAccount.provider.replace('_', ' ')}</h3>
              <p className="text-slate-500 mt-1">{sourceAccount.email}</p>
              <div className="mt-4 px-4 py-1.5 bg-white rounded-full text-sm font-medium text-slate-600 border border-slate-200 inline-flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-success" /> Selected
              </div>
            </div>
          ) : (
            <div className="text-center text-slate-400 group">
              <p className="text-3xl font-light mb-2 text-slate-300 group-hover:text-primary transition-colors">FROM</p>
              <p className="text-sm">Click here to select the cloud drive<br/>you'd like to transfer from</p>
            </div>
          )}
        </div>

        {/* Arrow */}
        <div className="text-slate-300 hidden md:block">
          <ArrowRight className="h-12 w-12" />
        </div>

        {/* TO Box */}
        <div 
          onClick={() => handleOpenModal('dest')}
          className={`flex-1 w-full h-full min-h-[250px] border-2 border-dashed rounded-3xl flex flex-col items-center justify-center p-8 cursor-pointer transition-all ${destAccount ? 'border-primary bg-primary/5' : 'border-slate-300 hover:border-primary/50 hover:bg-slate-50'}`}
        >
          {destAccount ? (
            <div className="text-center">
              <div className="h-16 w-16 bg-white shadow-sm rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-100">
                <HardDrive className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-bold text-slate-900 text-xl">{destAccount.provider.replace('_', ' ')}</h3>
              <p className="text-slate-500 mt-1">{destAccount.email}</p>
              <div className="mt-4 px-4 py-1.5 bg-white rounded-full text-sm font-medium text-slate-600 border border-slate-200 inline-flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-success" /> Selected
              </div>
            </div>
          ) : (
            <div className="text-center text-slate-400 group">
              <p className="text-3xl font-light mb-2 text-slate-300 group-hover:text-primary transition-colors">TO</p>
              <p className="text-sm">Click here to select the cloud drive<br/>you'd like to transfer to</p>
            </div>
          )}
        </div>

      </div>

      {/* Action Bar */}
      <div className="mt-12 flex items-center justify-end border-t border-slate-200 pt-8">
        <button
          disabled={!sourceAccount || !destAccount || isSubmitting}
          onClick={handleStartTransferFlow}
          className="px-8 py-4 bg-primary text-white rounded-xl font-bold text-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isSubmitting ? (
            <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            'Select Files to Transfer'
          )}
        </button>
      </div>

      {/* Selection Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">
                Select {modalType === 'source' ? 'Source' : 'Destination'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-4 flex-1 overflow-y-auto max-h-[60vh]">
              {accounts.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-slate-500 mb-4">No connected accounts.</p>
                  <button onClick={() => { setIsModalOpen(false); navigate('/dashboard/accounts'); }} className="text-primary font-medium hover:underline">
                    Connect an account
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {accounts.map(acc => {
                    const isDisabled = 
                      (modalType === 'source' && destAccount?.id === acc.id) ||
                      (modalType === 'dest' && sourceAccount?.id === acc.id);
                      
                    return (
                      <button
                        key={acc.id}
                        disabled={isDisabled}
                        onClick={() => handleSelectAccount(acc)}
                        className={`w-full flex items-center gap-4 p-4 rounded-2xl border text-left transition-all ${
                          isDisabled ? 'opacity-50 cursor-not-allowed bg-slate-50 border-slate-100' : 'border-slate-200 hover:border-primary hover:bg-primary/5 bg-white'
                        }`}
                      >
                        <div className="h-12 w-12 rounded-xl bg-slate-50 flex items-center justify-center flex-shrink-0">
                          <HardDrive className="h-6 w-6 text-slate-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-900 truncate">{acc.provider.replace('_', ' ')}</p>
                          <p className="text-sm text-slate-500 truncate">{acc.email}</p>
                        </div>
                        <ChevronRight className="h-5 w-5 text-slate-400" />
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* File Browser Modal */}
      {isFileBrowserOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col h-[600px]">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  {fileBrowserStep === 'select-source-files' ? `Select Files from ${sourceAccount?.provider.replace('_', ' ')}` : `Choose Destination in ${destAccount?.provider.replace('_', ' ')}`}
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  {fileBrowserStep === 'select-source-files' ? 'Choose what you want to transfer.' : 'Where should we save these files?'}
                </p>
              </div>
              <button onClick={() => setIsFileBrowserOpen(false)} className="p-2 text-slate-400 hover:bg-slate-200 rounded-full transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 bg-white">
              {fileBrowserStep === 'select-source-files' ? (
                isLoadingFiles ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400">
                    <div className="h-8 w-8 border-4 border-slate-100 border-t-primary rounded-full animate-spin mb-4" />
                    <p>Loading files from Google Drive...</p>
                  </div>
                ) : fileFetchError ? (
                  <div className="flex flex-col items-center justify-center h-full text-red-500 text-center p-4">
                    <p className="font-bold mb-2">Error Fetching Files</p>
                    <p className="text-sm">{fileFetchError}</p>
                    <p className="text-xs text-slate-400 mt-4">(Check the browser console for details)</p>
                  </div>
                ) : sourceFiles.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400">
                    <p>No files found in this drive.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {sourceFiles.map(file => (
                      <div
                        key={file.id}
                        onClick={() => {
                          setSelectedMockFiles(prev => 
                            prev.includes(file.id) ? prev.filter(id => id !== file.id) : [...prev, file.id]
                          );
                        }}
                        className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${
                          selectedMockFiles.includes(file.id) ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded border flex items-center justify-center ${selectedMockFiles.includes(file.id) ? 'bg-primary border-primary' : 'border-slate-300'}`}>
                          {selectedMockFiles.includes(file.id) && <CheckCircle2 className="h-3 w-3 text-white" />}
                        </div>
                        <Folder className={`h-6 w-6 ${file.type === 'folder' ? 'text-amber-400' : 'text-blue-500'}`} fill={file.type === 'folder' ? 'currentColor' : 'none'} />
                        <div className="flex-1">
                          <p className="font-medium text-slate-900">{file.name}</p>
                        </div>
                        <span className="text-sm text-slate-500">{file.sizeFormatted}</span>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                isLoadingFiles ? (
                  <div className="flex flex-col items-center justify-center h-full text-slate-400">
                    <div className="h-8 w-8 border-4 border-slate-100 border-t-primary rounded-full animate-spin mb-4" />
                    <p>Loading folders from destination...</p>
                  </div>
                ) : fileFetchError && destFolders.length === 1 ? (
                  <div className="flex flex-col items-center justify-center h-full text-red-500 text-center p-4">
                    <p className="font-bold mb-2">Error Fetching Folders</p>
                    <p className="text-sm">{fileFetchError}</p>
                    <p className="text-xs text-slate-400 mt-4">(You can still select the Root folder)</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {destFolders.map(folder => (
                      <div
                        key={folder.id}
                        onClick={() => setSelectedDestFolder(folder.id)}
                        className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${
                          selectedDestFolder === folder.id ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <Folder className="h-6 w-6 text-amber-400" fill="currentColor" />
                        <div className="flex-1">
                          <p className="font-medium text-slate-900">{folder.name}</p>
                        </div>
                        {selectedDestFolder === folder.id && (
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                        )}
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>

            <div className="p-6 border-t border-slate-100 bg-white flex items-center justify-between">
              <p className="text-slate-500 font-medium">
                {fileBrowserStep === 'select-source-files' ? (
                  `${selectedMockFiles.length} item(s) selected`
                ) : (
                  `Destination: ${destAccount?.email}`
                )}
              </p>
              
              {fileBrowserStep === 'select-source-files' ? (
                <button
                  disabled={selectedMockFiles.length === 0 || isLoadingFiles}
                  onClick={handleConfirmFiles}
                  className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Continue
                </button>
              ) : (
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="flex bg-slate-100 p-1 rounded-xl">
                    <button
                      onClick={() => setTransferMode('copy')}
                      className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${transferMode === 'copy' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      Copy
                    </button>
                    <button
                      onClick={() => setTransferMode('move')}
                      className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${transferMode === 'move' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      Move
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setFileBrowserStep('select-source-files')}
                      className="px-6 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-colors"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleConfirmDestinationAndTransfer}
                      disabled={!selectedDestFolder || isSubmitting}
                      className="px-6 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Starting...
                        </>
                      ) : (
                        'Start Transfer'
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewTransfer;
