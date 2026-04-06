import { ManifestContainer } from "./ManifestContainer";
import { ASSET_OPTIONS } from "./ManifestForm";

export const StockLedger = ({ stockData }: { stockData: any[] }) => {
  return (
    <ManifestContainer title=">_Manifest" className="h-fit py-1">
      <div className="h-full flex items-center px-4 overflow-x-auto custom-scrollbar gap-8">
        {stockData
          .sort((a, b) => ASSET_OPTIONS.indexOf(a.resource) - ASSET_OPTIONS.indexOf(b.resource))
          .map((stock) => (
            <div key={stock.resource} className="flex flex-col shrink-0">
              <span className="text-[9px] uppercase tracking-widest text-text-dim">{stock.resource}</span>
              <span className="text-[12px] font-mono text-text-main font-bold">
                {stock.resource === "LUX" ? `⌬ ${Number(stock.total_amount).toLocaleString()}` : Number(stock.total_amount).toLocaleString()}
              </span>
            </div>
          ))}
        {stockData.length === 0 && (
          <span className="text-[10px] uppercase tracking-[0.3em] text-text-dim">System manifest synchronised // All nodes operational</span>
        )}
      </div>
    </ManifestContainer>
  );
};
