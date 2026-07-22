import React, { useState } from 'react';
import { insforge } from '../lib/insforge';
import { Eye, EyeOff } from 'lucide-react';
import { Navigate, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const navigate = useNavigate();

  // We removed the auto-redirect here so you can view the design even if you have a lingering session!

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    
    try {
      if (isVerifying) {
        const { error } = await insforge.auth.verifyEmail({ 
          email, 
          otp: verificationCode 
        });
        if (error) throw error;
        window.location.href = '/dashboard';
      } else if (isSignUp) {
        const { error } = await insforge.auth.signUp({ email, password });
        if (error) throw error;
        setIsVerifying(true);
        setErrorMsg('Please enter the 6-digit verification code sent to your email.');
      } else {
        const { error } = await insforge.auth.signInWithPassword({ email, password });
        if (error) throw error;
        window.location.href = '/dashboard';
      }
    } catch (error: any) {
      setErrorMsg(error.message || 'An error occurred during authentication.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      const { error } = await insforge.auth.signInWithOAuth('google', {
        redirectTo: `${window.location.origin}/dashboard`
      });
      if (error) throw error;
    } catch (error) {
      console.error('Error logging in:', error);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex font-sans">
      
      {/* Left Column - Tuga-inspired Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center relative py-12 px-6">
        
        {/* Back to Home Button */}
        <div className="absolute top-8 left-8">
          <Link to="/" className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Home
          </Link>
        </div>

        <div className="w-full max-w-[420px]">
          
          <div className="text-center mb-10">
            <h1 className="text-[2.5rem] font-bold text-slate-900 tracking-tight mb-4">
              {isVerifying ? 'Verify your email' : (isSignUp ? 'Create account!' : 'Welcome back!')}
            </h1>
            <p className="text-slate-500 text-sm leading-relaxed max-w-sm mx-auto">
              {isVerifying 
                ? 'Check your inbox for a 6-digit code to complete registration.' 
                : <span>Simplify your workflow and boost your productivity with <span className="font-semibold text-slate-700">CloudMove</span>. Get started for free.</span>
              }
            </p>
          </div>

          {errorMsg && (
            <div className={`p-4 rounded-2xl mb-6 text-sm text-center ${errorMsg.includes('verification code') ? 'bg-blue-50 text-blue-600' : (errorMsg.includes('successful') ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600')}`}>
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleEmailAuth} className="space-y-4">
            
            {isVerifying ? (
              <div>
                <label htmlFor="code" className="sr-only">Verification Code</label>
                <input
                  id="code"
                  type="text"
                  required
                  placeholder="000000"
                  maxLength={6}
                  value={verificationCode}
                  onChange={e => setVerificationCode(e.target.value)}
                  className="w-full px-6 py-4 bg-white border border-slate-300 hover:border-slate-400 rounded-full text-slate-900 text-center tracking-[0.5em] font-bold text-lg placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all"
                />
              </div>
            ) : (
              <>
                <div>
                  <label htmlFor="email" className="sr-only">Email address</label>
                  <input
                    id="email"
                    type="email"
                    required
                    placeholder="Email address"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full px-6 py-4 bg-white border border-slate-300 hover:border-slate-400 rounded-full text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all sm:text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="password" className="sr-only">Password</label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      required
                      placeholder="Password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="w-full px-6 py-4 bg-white border border-slate-300 hover:border-slate-400 rounded-full text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all sm:text-sm pr-12"
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-5 flex items-center text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  
                  {!isSignUp && (
                    <div className="flex justify-end pr-2">
                      <button type="button" className="text-xs font-semibold text-slate-900 hover:underline">
                        Forgot Password?
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-slate-900 hover:bg-black text-white font-medium px-6 py-4 rounded-full transition-all disabled:opacity-70 mt-4 text-sm tracking-wide"
            >
              {isLoading ? 'Processing...' : (isVerifying ? 'Verify & Login' : (isSignUp ? 'Register' : 'Login'))}
            </button>
          </form>

          {!isVerifying && (
            <>
              <div className="relative my-10">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-slate-400">or continue with</span>
                </div>
              </div>

              <div className="flex justify-center gap-4">
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                  className="h-12 w-12 rounded-full bg-slate-900 hover:bg-black flex items-center justify-center transition-transform hover:scale-105"
                >
                  <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"/>
                  </svg>
                </button>
                <button
                  type="button"
                  disabled
                  className="h-12 w-12 rounded-full bg-slate-900 flex items-center justify-center opacity-50 cursor-not-allowed"
                >
                  <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.379.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
                  </svg>
                </button>
              </div>

              <div className="mt-12 text-center text-sm font-medium text-slate-900">
                {isSignUp ? "Already a member? " : "Not a member? "}
                <button
                  type="button"
                  onClick={() => { setIsSignUp(!isSignUp); setErrorMsg(''); }}
                  className="text-green-600 hover:text-green-700 transition-colors"
                >
                  {isSignUp ? 'Login now' : 'Register now'}
                </button>
              </div>
            </>
          )}

        </div>
      </div>

      {/* Right Column - Hero Graphic with User's requested animations */}
      <div className="hidden lg:flex lg:w-1/2 p-6 pl-0">
        <div className="w-full h-full bg-[#121214] rounded-[2rem] relative overflow-hidden flex flex-col items-center justify-center">
          
          {/* Animated Background Gradients */}
          <div className="absolute inset-0 z-0">
            <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-emerald-600/20 blur-[100px] mix-blend-screen animate-blob" />
            <div className="absolute top-[20%] right-[-10%] w-[50%] h-[70%] rounded-full bg-blue-600/10 blur-[100px] mix-blend-screen animate-blob animation-delay-2000" />
            <div className="absolute bottom-[-20%] left-[20%] w-[70%] h-[60%] rounded-full bg-cyan-600/10 blur-[100px] mix-blend-screen animate-blob animation-delay-4000" />
            
            {/* Subtle dot pattern overlay */}
            <div className="absolute inset-0 opacity-30 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4xNSkiLz48L3N2Zz4=')] mix-blend-overlay"></div>
          </div>

          <div className="relative z-10 text-center px-12">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-2">
              Transfer Clouds <span className="text-emerald-400">Instantly</span>
            </h2>
            <p className="text-slate-400 mt-4 text-lg max-w-md mx-auto">
              Move your files securely across all your drives.
            </p>
          </div>
          
        </div>
      </div>
      
    </div>
  );
};

export default Login;
