import { motion } from "motion/react";
import { LogIn, ShieldCheck, Cpu, Database } from "lucide-react";
import { HashedBox } from "./HashedBox";

interface AuthScreenProps {
  isConnecting: boolean;
  error: string | null;
  onLogin: () => void;
}

export const AuthScreen = ({ isConnecting, error, onLogin }: AuthScreenProps) => {
  return (
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
            onClick={onLogin}
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
  );
};
