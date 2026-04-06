import { CornerAccents, ManifestContainer } from "./ManifestContainer";

export const TransactionHistory = ({ 
  manifestLogs, 
  isAdmin, 
  handleVerify, 
  isMobile 
}: { 
  manifestLogs: any[]; 
  isAdmin: boolean; 
  handleVerify: (id: string) => void; 
  isMobile?: boolean;
}) => {
  const tableContent = (
    <table className="w-full text-left border-collapse">
      <thead className={isMobile ? "" : "sticky top-0 bg-bg-main z-10"}>
        <tr className="border-b border-accent/20">
          <th className={`py-2 ${isMobile ? "px-1 text-[10px]" : "px-2 text-[12px]"} uppercase tracking-widest text-text-dim font-medium`}>User</th>
          <th className={`py-2 ${isMobile ? "px-1 text-[10px]" : "px-2 text-[12px]"} uppercase tracking-widest text-text-dim font-medium`}>Item</th>
          <th className={`py-2 ${isMobile ? "px-1 text-[10px]" : "px-2 text-[12px]"} uppercase tracking-widest text-text-dim font-medium`}>Amount</th>
          {!isMobile && <th className="py-2 px-2 text-[12px] uppercase tracking-widest text-text-dim font-medium">Target</th>}
          {!isMobile && <th className="py-2 px-2 text-[12px] uppercase tracking-widest text-text-dim font-medium">Date</th>}
          <th className={`py-2 ${isMobile ? "px-1 text-[10px]" : "px-2 text-[12px]"} uppercase tracking-widest text-text-dim font-medium text-right`}>Status</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-accent/5">
        {manifestLogs
          .slice(0, isMobile ? 20 : undefined) 
          .map((log) => (
            <tr key={log.id} className="hover:bg-accent/5 transition-colors">
              <td className={`py-3 ${isMobile ? "px-1 text-[11px] max-w-[60px]" : "px-2 text-[13px]"} uppercase tracking-widest text-text-main truncate`}>{log.username}</td>
              <td className={`py-3 ${isMobile ? "px-1 text-[11px]" : "px-2 text-[13px]"} uppercase tracking-widest text-text-dim`}>{log.resource}</td>
              <td className={`py-3 ${isMobile ? "px-1 text-[11px]" : "px-2 text-[13px]"} uppercase tracking-widest font-mono ${Number(log.ledger_impact) < 0 ? 'text-red-400' : 'text-text-main'}`}>
                {log.resource === "LUX" ? `⌬ ${Number(log.amount).toLocaleString()}` : Number(log.amount).toLocaleString()}
              </td>
              {!isMobile && (
                <td className="py-3 px-2 text-[11px] uppercase tracking-widest text-text-dim/60">
                  {log.target_id || "MANIFEST"}
                </td>
              )}
              {!isMobile && (
                <td className="py-3 px-2 text-[12px] uppercase tracking-widest text-text-dim/40">
                  {log.created_at ? new Date(log.created_at).toLocaleDateString() : "---"}
                </td>
              )}
              <td className={`py-3 ${isMobile ? "px-1" : "px-2"} text-right`}>
                {isMobile ? (
                  <span className={`text-[8px] uppercase tracking-widest px-1 py-0.5 border ${
                    log.verified 
                      ? 'border-blue-500/40 text-blue-400' 
                      : 'border-accent/40 text-text-accent'
                  }`}>
                    {log.verified ? "OK" : "..."}
                  </span>
                ) : (
                  <button 
                    onClick={() => !log.verified && handleVerify(log.id)}
                    disabled={log.verified || !isAdmin}
                    className={`text-[10px] uppercase tracking-widest px-2 py-1 border transition-all ${
                      log.verified 
                        ? 'border-blue-500/40 text-blue-400 bg-blue-500/5 cursor-default' 
                        : isAdmin 
                          ? 'border-accent/40 text-text-accent bg-accent/5 hover:bg-accent/20' 
                          : 'border-accent/20 text-text-accent/40 bg-accent/5 cursor-not-allowed'
                    }`}
                  >
                    {log.verified ? "CONFIRMED" : "PENDING"}
                  </button>
                )}
              </td>
            </tr>
          ))}
        {manifestLogs.length === 0 && (
          <tr>
            <td colSpan={isMobile ? 4 : 6} className={`py-8 text-center ${isMobile ? "text-[10px]" : "text-[12px]"} uppercase tracking-widest text-text-dim`}>
              NO RECENT ENTRIES RECORDED
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );

  if (isMobile) {
    return (
      <div className="relative border border-accent/20 bg-bg-main/40 p-4 flex flex-col">
        <CornerAccents color="var(--color-accent-dim)" />
        <div className="border-b border-accent/10 pb-2 mb-4">
          <span className="text-xs uppercase tracking-[0.2em] text-text-main font-bold">_&gt; Manifest log</span>
        </div>
        <div className="overflow-x-auto">
          {tableContent}
        </div>
      </div>
    );
  }

  return (
    <ManifestContainer title=">_Manifest log" className="flex-1">
      <div className="h-full overflow-y-auto custom-scrollbar pr-1">
        {tableContent}
      </div>
    </ManifestContainer>
  );
};
