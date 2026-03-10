import React from 'react';
import { LogIn, X, Shield, Cloud, Zap, AlertTriangle } from 'lucide-react';
import { isFirebaseConfigured } from '../services/firebase';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: () => void;
  isLoggingIn: boolean;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onLogin, isLoggingIn }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#050505] border-2 border-[#00ff00]/30 rounded-sm shadow-[0_0_30px_rgba(0,255,0,0.1)] overflow-hidden relative">
        {/* Header */}
        <div className="bg-[#00ff00]/10 border-b border-[#00ff00]/30 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#00ff00]" />
            <h2 className="text-[#00ff00] font-bold tracking-wider uppercase">Authentication Required</h2>
          </div>
          <button 
            onClick={onClose}
            className="text-[#00ff00]/50 hover:text-[#00ff00] transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 bg-[#00ff00]/5 border border-[#00ff00]/10 rounded-sm">
              <Cloud className="w-5 h-5 text-[#00ff00] mt-1 flex-shrink-0" />
              <p className="text-sm text-[#00ff00]/80 leading-relaxed">
                Connect your account to enable <span className="text-[#00ff00] font-bold underline">CLOUD SYNC</span>. 
                Your progress will be saved automatically across sessions.
              </p>
            </div>

            <div className="flex items-start gap-3 p-3 bg-[#00ff00]/5 border border-[#00ff00]/10 rounded-sm">
              <Zap className="w-5 h-5 text-[#00ff00] mt-1 flex-shrink-0" />
              <p className="text-sm text-[#00ff00]/80 leading-relaxed">
                Access <span className="text-[#00ff00] font-bold underline">GLOBAL LEADERBOARDS</span> and compete with other players in the system.
              </p>
            </div>
          </div>

          {!isFirebaseConfigured && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-sm flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500 mt-1 flex-shrink-0" />
              <div className="space-y-1">
                <p className="text-xs font-bold text-red-500 uppercase">System Error</p>
                <p className="text-xs text-red-400">
                  Firebase is not configured. Cloud features are currently unavailable. 
                  Please check your environment variables.
                </p>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={onLogin}
              disabled={isLoggingIn || !isFirebaseConfigured}
              className={`w-full flex items-center justify-center gap-3 py-4 px-6 rounded-sm font-bold uppercase tracking-widest transition-all
                ${isLoggingIn || !isFirebaseConfigured
                  ? 'bg-gray-800 text-gray-500 cursor-not-allowed border border-gray-700'
                  : 'bg-[#00ff00] text-black hover:bg-[#00ff00]/90 hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_15px_rgba(0,255,0,0.3)]'
                }`}
            >
              {isLoggingIn ? (
                <>
                  <div className="w-5 h-5 border-2 border-black/30 border-t-black animate-spin rounded-full" />
                  <span>Establishing Connection...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  <span>Login with Google</span>
                </>
              )}
            </button>
            
            <p className="text-center text-[10px] text-[#00ff00]/30 uppercase tracking-tighter">
              By logging in, you agree to synchronize your game data with our secure cloud servers.
            </p>
          </div>
        </div>

        {/* Footer Decoration */}
        <div className="h-1 bg-gradient-to-r from-transparent via-[#00ff00]/50 to-transparent" />
      </div>
    </div>
  );
};
