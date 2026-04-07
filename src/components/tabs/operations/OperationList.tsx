import { ChevronRight, Plus } from "lucide-react";
import { DebugLabel } from "../../../context/DebugContext";

interface Operation {
  id: string;
  operation_number: number;
  lead_uid: string;
  username: string;
  operation_type: string;
  system_id: string;
  description: string;
  members: string;
  contributions: string;
  status: string;
  created_at: string;
}

interface OperationListProps {
  operations: Operation[];
  selectedOp: Operation | null;
  setSelectedOp: (op: Operation) => void;
  isLoading: boolean;
  setIsModalOpen: (open: boolean) => void;
  handleJoinOp: (opId: string) => void;
  user: any;
  getOpIcon: (type: string) => React.ReactNode;
}

export const OperationList = ({
  operations,
  selectedOp,
  setSelectedOp,
  isLoading,
  setIsModalOpen,
  handleJoinOp,
  user,
  getOpIcon
}: OperationListProps) => {
  return (
    <DebugLabel label="Operations List" className="w-[30%] flex flex-col gap-1 border border-accent/20 bg-bg-main/40 p-2">
      <button
        onClick={() => setIsModalOpen(true)}
        className="w-full py-2 bg-accent/10 hover:bg-accent/20 border border-accent/30 text-text-accent flex items-center justify-center gap-2 transition-colors"
      >
        <Plus size={16} />
        <span className="text-[10px] uppercase tracking-widest font-bold">Start Operation</span>
      </button>

      <div className="flex-grow overflow-y-auto custom-scrollbar mt-2 space-y-2">
        {isLoading ? (
          <div className="text-[10px] uppercase tracking-widest text-text-dim text-center py-4 animate-pulse">
            Loading Operations...
          </div>
        ) : operations.length === 0 ? (
          <div className="text-[10px] uppercase tracking-widest text-text-dim text-center py-4">
            No active operations
          </div>
        ) : (
          operations.map((op) => (
            <div
              key={op.id}
              onClick={() => setSelectedOp(op)}
              className={`p-3 border cursor-pointer transition-all ${
                selectedOp?.id === op.id 
                  ? 'border-accent bg-accent/10' 
                  : 'border-accent/20 bg-black/20 hover:border-accent/50 hover:bg-accent/5'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {getOpIcon(op.operation_type)}
                  <span className="text-xs font-bold text-text-main uppercase tracking-wider">
                    OP-{op.operation_number?.toString().padStart(3, '0')} {op.operation_type}
                  </span>
                </div>
                <ChevronRight size={14} className={`text-text-dim transition-transform ${selectedOp?.id === op.id ? 'translate-x-1 text-accent' : ''}`} />
              </div>
              <div className="flex justify-between items-end">
                <div className="text-[9px] uppercase tracking-widest text-text-dim">
                  Lead: <span className="text-text-accent">{op.username}</span>
                </div>
                <div className="flex items-center gap-2">
                  {!op.members?.split(',').includes(user?.uid) && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleJoinOp(op.id);
                      }}
                      className="px-2 py-1 bg-accent/10 hover:bg-accent/20 border border-accent/30 text-[8px] uppercase tracking-widest text-text-accent transition-colors"
                    >
                      Join Op
                    </button>
                  )}
                  <div className="text-[8px] uppercase tracking-widest text-text-dim opacity-60">
                    {new Date(op.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </DebugLabel>
  );
};
