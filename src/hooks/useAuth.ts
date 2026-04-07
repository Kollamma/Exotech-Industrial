import { useState, useEffect } from "react";
import { toast } from "sonner";
import { io } from "socket.io-client";

const socket = io();

export function useAuth() {
  const [user, setUser] = useState<any>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      const response = await fetch('/api/users/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to update user');
      }
      
      setUser((prev: any) => ({ ...prev, ...data }));
      toast.success("Profile updated successfully");
    } catch (error: any) {
      console.error("User Update Error:", error);
      toast.error(`Failed to update user: ${error.message}`);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    setUser(null);
  };

  return {
    user,
    setUser,
    isConnecting,
    error,
    handleDiscordLogin,
    handleUpdateUser,
    handleLogout
  };
}
