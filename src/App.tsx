/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, AnimatePresence } from "motion/react";
import { useState, useEffect } from "react";
import { LogIn, ShieldCheck, Cpu, Database } from "lucide-react";
import { FloatingBackground } from "./components/FloatingBackground";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { DashboardTabs } from "./components/DashboardTabs";
import { HashedBox } from "./components/HashedBox";
import { io } from "socket.io-client";
import { UserManagementModal } from "./components/UserManagementModal";
import { AvailabilityModal } from "./components/AvailabilityModal";
import { DebugProvider } from "./context/DebugContext";
import { ThemeProvider } from "./context/ThemeContext";

const socket = io();

export default function App() {
  return (
    <ThemeProvider>
      <DebugProvider>
        <AppContent />
      </DebugProvider>
    </ThemeProvider>
  );
}

function AppContent() {
  const [user, setUser] = useState<any>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isUserManagementOpen, setIsUserManagementOpen] = useState(false);
  const [isAvailabilityOpen, setIsAvailabilityOpen] = useState(false);

  useEffect(() => {
    // Check session on mount
    console.log("Checking session on mount...");
    fetch('/api/auth/me', { credentials: 'include' })
      .then(res => {
        if (!res.ok) {
          console.log("Session check failed:", res.status);
          return {};
        }
        return res.json();
      })
      .then((data: any) => {
        if (data && data.id) {
          console.log("Session restored for user:", data.id);
          setUser(data);
        } else {
          console.log("No active session found.");
        }
      })
      .catch(err => console.error("Session check error:", err));

    const handleMessage = (event: MessageEvent) => {
      // Validate origin
      if (!event.origin.endsWith('.run.app') && !event.origin.includes('localhost')) return;
      
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        setUser(event.data.user);
        setError(null);
        setIsConnecting(false);
      } else if (event.data?.type === 'OAUTH_AUTH_ERROR') {
        let errorMessage = event.data.error;
        if (errorMessage === 'ACCESS_DENIED: INSUFFICIENT_CLEARANCE_LEVEL') {
          errorMessage = 'ACCESS_DENIED: INSUFFICIENT_CLEARANCE_LEVEL\nPLEASE SPEAK WITH A DIRECTOR OR OFFICER FOR ACCESS TO THIS TOOL';
        }
        setError(errorMessage);
        setIsConnecting(false);
      }
    };
    window.addEventListener('message', handleMessage);
    
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  // Socket.io Realtime connection
  useEffect(() => {
    if (!user) return;

    socket.on('user_update', (payload: any) => {
      console.log("Socket.io Realtime Update Received:", payload);
      setUser((prev: any) => {
        // Try matching with 'id' if 'uid' doesn't exist
        const incomingId = (payload.new as any).uid || (payload.new as any).id;
        if (prev && prev.id === incomingId) {
          return { ...prev, ...payload.new };
        }
        return prev;
      });
    });

    return () => {
      socket.off('user_update');
    };
  }, [user]);

  const handleDiscordLogin = async () => {
    setIsConnecting(true);
    setError(null);
    try {
      console.log("Fetching auth URL...");
      const response = await fetch('/api/auth/url', { credentials: 'include' });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to get auth URL');
      }
      const { url } = await response.json();
      console.log("Auth URL received:", url);
      
      const width = 500;
      const height = 700;
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      
      const authWindow = window.open(url, 'discord_auth', `width=${width},height=${height},left=${left},top=${top}`);

      if (!authWindow) {
        throw new Error('Popup blocked. Please allow popups for this site and try again.');
      }

      const checkWindow = setInterval(() => {
        if (authWindow.closed) {
          clearInterval(checkWindow);
          setIsConnecting(false);
        }
      }, 1000);
    } catch (error: any) {
      console.error("Login Error:", error);
      setIsConnecting(false);
      setError(error.message || 'An unexpected error occurred during login.');
    }
  };

  const handleUpdateUser = async (data: any) => {
    try {
      console.log("Updating user profile...", data);
      const response = await fetch('/api/user/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to update user');
      }
      
      // Update local state
      setUser((prev: any) => ({ ...prev, ...data }));
    } catch (error: any) {
      console.error("User Update Error:", error);
      alert(`Failed to update user: ${error.message}`);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    setUser(null);
  };

  return (
    <div className="h-screen bg-[var(--color-bg)] text-[var(--color-text-main)] font-mono flex flex-col p-1 relative overflow-hidden transition-colors duration-500">
      <FloatingBackground />
      <Header 
        user={user} 
        onUpdate={handleUpdateUser} 
        onOpenAvailability={() => setIsAvailabilityOpen(true)}
      />

      <div className={`flex-grow flex ${!user ? 'items-center' : 'items-stretch'} justify-center w-full mt-1 ${user ? 'mb-5' : 'mb-0'} min-h-0 overflow-hidden`}>
        <AnimatePresence mode="wait">
          {!user ? (
            <motion.div
              key="login"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="relative z-10 w-full max-w-md space-y-12"
            >
              <div className="flex flex-col items-center justify-center space-y-8">
                <div className="relative">
                  <div className="absolute -inset-4 border border-[var(--color-accent)] opacity-20 animate-pulse" />
                  <div className="absolute -inset-2 border border-[var(--color-accent)] opacity-40" />
                  <HashedBox />
                </div>

                <div className="text-center space-y-4">
                  <h2 className="text-2xl font-black tracking-[0.2em] uppercase text-[var(--color-text-main)] italic">
                    Neural Link Required
                  </h2>
                  <div className="flex items-center justify-center gap-4 text-[10px] uppercase tracking-widest text-[var(--color-text-dim)]">
                    <span className="flex items-center gap-1"><ShieldCheck size={12} className="text-[var(--color-text-main)]" /> Secure</span>
                    <span className="flex items-center gap-1"><Cpu size={12} className="text-[var(--color-text-main)]" /> Encrypted</span>
                    <span className="flex items-center gap-1"><Database size={12} className="text-[var(--color-text-main)]" /> Verified</span>
                  </div>
                </div>

                <div className="w-full space-y-4">
                  <button
                    onClick={handleDiscordLogin}
                    disabled={isConnecting}
                    className="group relative w-full py-4 bg-[var(--color-accent)] hover:opacity-90 text-black font-black uppercase tracking-[0.2em] transition-all overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500" />
                    <div className="relative flex items-center justify-center gap-3">
                      <LogIn size={20} />
                      {isConnecting ? "Synchronizing..." : "Initialize Link"}
                    </div>
                  </button>

                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 border border-red-600/50 bg-red-950/20 text-red-500 text-[10px] uppercase tracking-widest text-center leading-relaxed"
                    >
                      <div className="font-bold mb-1">Critical Error</div>
                      {error}
                    </motion.div>
                  )}
                </div>

                <div className="pt-8 border-t border-[var(--color-accent)] opacity-10 w-full text-center">
                  <p className="text-[9px] uppercase tracking-[0.3em] text-[var(--color-text-dim)]">
                    Exotech Industrial Sub-Sector Access Node
                  </p>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 0 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative z-10 w-full flex justify-between h-full"
            >
              <div className="flex-grow h-full">
                <DashboardTabs user={user} onUpdate={handleUpdateUser} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {user && <Footer user={user} onOpenUserManagement={() => setIsUserManagementOpen(true)} onLogout={handleLogout} />}

      {/* Decorative Elements */}
      <div className="fixed top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[var(--color-accent)] to-transparent opacity-10" />
      <div className="fixed bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[var(--color-accent)] to-transparent opacity-10" />
      
      {user && user.rank >= 2 && (
        <UserManagementModal 
          isOpen={isUserManagementOpen} 
          onClose={() => setIsUserManagementOpen(false)} 
        />
      )}

      {user && (
        <AvailabilityModal
          isOpen={isAvailabilityOpen}
          onClose={() => setIsAvailabilityOpen(false)}
          availabilityMask={user.availability_mask || ""}
          timezone={user.timezone || "UTC +0"}
          onSave={(mask, timezone) => {
            handleUpdateUser({ 
              availability_mask: mask, 
              timezone
            });
          }}
        />
      )}
    </div>
  );
}
