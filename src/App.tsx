/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, AnimatePresence } from "motion/react";
import { useState, useEffect } from "react";
import { FloatingBackground } from "./components/FloatingBackground";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { DashboardTabs } from "./components/DashboardTabs";
import { AuthScreen } from "./components/AuthScreen";
import { io } from "socket.io-client";
import { UserManagementModal } from "./components/UserManagementModal";
import { AvailabilityModal } from "./components/AvailabilityModal";
import { Toaster, toast } from "sonner";
import { DebugProvider } from "./context/DebugContext";
import { ThemeProvider } from "./context/ThemeContext";
import { useAuth } from "./hooks/useAuth";
import { DebugLogs } from "./components/debug/DebugLogs";

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
  const { 
    user, 
    isConnecting, 
    error, 
    handleDiscordLogin, 
    handleUpdateUser, 
    handleLogout 
  } = useAuth();

  const [isUserManagementOpen, setIsUserManagementOpen] = useState(false);
  const [isAvailabilityOpen, setIsAvailabilityOpen] = useState(false);

  return (
    <div className="h-screen bg-[var(--color-bg)] text-[var(--color-text-main)] font-mono flex flex-col p-1 relative overflow-hidden transition-colors duration-500">
      <DebugLogs />
      <FloatingBackground />
      <Header 
        user={user} 
        onUpdate={handleUpdateUser} 
        onOpenAvailability={() => setIsAvailabilityOpen(true)}
      />

      <div className={`flex-grow flex ${!user ? 'items-center' : 'items-stretch'} justify-center w-full mt-1 ${user ? 'mb-5' : 'mb-0'} min-h-0 overflow-hidden`}>
        <AnimatePresence mode="wait">
          {!user ? (
            <AuthScreen 
              isConnecting={isConnecting} 
              error={error} 
              onLogin={handleDiscordLogin} 
            />
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
      <Toaster position="top-center" theme="dark" richColors />
    </div>
  );
}
