import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Cloud, Lock, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

const Landing = () => {
  return (
    <div className="min-h-screen bg-background">
      <header className="px-6 py-4 flex items-center justify-between border-b border-slate-200">
        <div className="flex items-center gap-2 text-primary font-bold text-xl">
          <Cloud className="h-6 w-6" />
          <span>CloudMove</span>
        </div>
        <nav className="flex gap-4">
          <Link to="/login" className="px-4 py-2 text-slate-600 hover:text-slate-900 font-medium">Log in</Link>
          <Link to="/login" className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">Get Started</Link>
        </nav>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-20 flex flex-col items-center text-center">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight max-w-4xl"
        >
          Move Your Files Between Cloud Accounts <span className="text-primary">in One Click</span>
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-6 text-xl text-slate-600 max-w-2xl"
        >
          Transfer Google Drive files securely without downloading or re-uploading manually.
        </motion.p>
        
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-10 flex flex-col sm:flex-row gap-4"
        >
          <Link to="/login" className="flex items-center justify-center gap-2 px-8 py-4 bg-primary text-white rounded-xl font-bold text-lg hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-all hover:-translate-y-1">
            Get Started Free <ArrowRight className="h-5 w-5" />
          </Link>
        </motion.div>

        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="h-12 w-12 bg-blue-100 text-primary rounded-lg flex items-center justify-center mb-4">
              <Lock className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Secure OAuth</h3>
            <p className="text-slate-600">Your credentials never touch our servers. We use official APIs to securely manage your transfers.</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="h-12 w-12 bg-purple-100 text-secondary rounded-lg flex items-center justify-center mb-4">
              <Zap className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Lightning Fast</h3>
            <p className="text-slate-600">Files stream directly between cloud providers. No local bandwidth required.</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="h-12 w-12 bg-green-100 text-success rounded-lg flex items-center justify-center mb-4">
              <Cloud className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Resume Anywhere</h3>
            <p className="text-slate-600">Interrupted transfers pick up right where they left off without restarting.</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Landing;
