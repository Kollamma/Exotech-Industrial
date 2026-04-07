import { RefreshCw, Save } from "lucide-react";
import { DebugLabel } from "../../../context/DebugContext";

interface LogisticInputFormProps {
  inputSystem: string;
  setInputSystem: (val: string) => void;
  inputAmount: string;
  setInputAmount: (val: string) => void;
  isSubmitting: boolean;
  handleInput: () => void;
}

export const LogisticInputForm = ({
  inputSystem,
  setInputSystem,
  inputAmount,
  setInputAmount,
  isSubmitting,
  handleInput
}: LogisticInputFormProps) => {
  return (
    <DebugLabel label="Input Form" className="bg-bg-main/40 border border-accent/20 p-4">
      <h3 className="text-[10px] uppercase tracking-[0.2em] text-text-dim mb-4 border-b border-accent/10 pb-2 flex items-center gap-2">
        <RefreshCw size={12} /> Log Logistics Input
      </h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-[9px] uppercase tracking-widest text-text-dim">System ID</label>
          <input
            type="text"
            value={inputSystem}
            onChange={(e) => setInputSystem(e.target.value.toUpperCase())}
            placeholder="E.G. ERS7R4"
            className="w-full bg-black/50 border border-accent/20 text-sm text-text-main p-2 outline-none focus:border-accent transition-colors uppercase font-mono"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[9px] uppercase tracking-widest text-text-dim">Amount (Units)</label>
          <input
            type="number"
            value={inputAmount}
            onChange={(e) => setInputAmount(e.target.value)}
            placeholder="0"
            className="w-full bg-black/50 border border-accent/20 text-sm text-text-main p-2 outline-none focus:border-accent transition-colors font-mono"
          />
        </div>
      </div>
      <button
        onClick={handleInput}
        disabled={isSubmitting || !inputSystem || !inputAmount}
        className="w-full mt-4 py-2 bg-accent/20 hover:bg-accent/40 border border-accent/50 text-text-accent text-xs uppercase tracking-widest font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {isSubmitting ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
        {isSubmitting ? "Processing..." : "Log Input"}
      </button>
    </DebugLabel>
  );
};
