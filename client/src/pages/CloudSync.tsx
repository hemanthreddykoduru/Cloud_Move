import React from 'react';
import { RefreshCw, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const CloudSync = () => {
  return (
    <div className="p-8 max-w-7xl mx-auto h-full flex flex-col">
      <div className="mb-12">
        <h1 className="text-3xl font-bold text-slate-900">Cloud Sync</h1>
        <p className="text-slate-500 mt-1">Keep folders across different cloud drives synced automatically.</p>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-8 flex-1 max-h-[400px]">
        {/* Source Box */}
        <div className="flex-1 w-full h-full min-h-[250px] border-2 border-dashed border-slate-300 hover:border-primary/50 hover:bg-slate-50 rounded-3xl flex flex-col items-center justify-center p-8 cursor-pointer transition-all group">
          <div className="text-center text-slate-400">
            <p className="text-3xl font-light mb-2 text-slate-300 group-hover:text-primary transition-colors">ADD</p>
            <p className="text-sm">Click here to add the directory<br/>you want to sync</p>
          </div>
        </div>

        {/* Sync Icon */}
        <div className="text-slate-300 hidden md:block">
          <RefreshCw className="h-12 w-12" />
        </div>

        {/* Destination Box */}
        <div className="flex-1 w-full h-full min-h-[250px] border-2 border-dashed border-slate-300 hover:border-primary/50 hover:bg-slate-50 rounded-3xl flex flex-col items-center justify-center p-8 cursor-pointer transition-all group">
          <div className="text-center text-slate-400">
            <p className="text-3xl font-light mb-2 text-slate-300 group-hover:text-primary transition-colors">ADD</p>
            <p className="text-sm">Click here to select the target<br/>directory</p>
          </div>
        </div>
      </div>

      <div className="mt-12 flex items-center justify-between border-t border-slate-200 pt-8">
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
            <input type="radio" name="sync-type" defaultChecked className="text-primary focus:ring-primary" />
            Normal Sync
          </label>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
            <input type="radio" name="sync-type" className="text-primary focus:ring-primary" />
            Real Time Sync
          </label>
        </div>
        <button className="px-8 py-4 bg-primary text-white rounded-xl font-bold text-lg hover:bg-blue-700 transition-colors opacity-50 cursor-not-allowed">
          Sync Now
        </button>
      </div>
    </div>
  );
};

export default CloudSync;
