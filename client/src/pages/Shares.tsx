import React from 'react';
import { Share2, Plus } from 'lucide-react';

const Shares = () => {
  return (
    <div className="p-8 max-w-7xl mx-auto h-full flex flex-col">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Shares</h1>
          <p className="text-slate-500 mt-1">You can manage all your shared files here.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
          <Plus className="h-5 w-5" />
          Create Share
        </button>
      </div>

      <div className="flex gap-8 border-b border-slate-200 mb-6">
        <button className="pb-4 font-bold text-primary border-b-2 border-primary">My shares</button>
        <button className="pb-4 font-medium text-slate-500 hover:text-slate-700 transition-colors">Saved Shares</button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 flex-1 flex flex-col overflow-hidden">
        <div className="grid grid-cols-5 gap-4 p-4 border-b border-slate-100 bg-slate-50/50 text-sm font-medium text-slate-500">
          <div className="col-span-2 flex items-center gap-2">
            <input type="checkbox" className="rounded text-primary border-slate-300 focus:ring-primary" />
            <span>File Name ↑</span>
          </div>
          <div>Type</div>
          <div>Size</div>
          <div>Shared on</div>
        </div>
        
        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
          <div className="text-red-500 mb-4">
            <Share2 className="h-16 w-16 mx-auto opacity-50" />
          </div>
          <h3 className="text-xl font-bold text-red-500 mb-2">You haven't shared any file yet.</h3>
          <p className="text-slate-500 text-sm">Tips: To share a file, you can just right click on the file and select "Share" option in the Cloud Explorer.</p>
        </div>
      </div>
    </div>
  );
};

export default Shares;
