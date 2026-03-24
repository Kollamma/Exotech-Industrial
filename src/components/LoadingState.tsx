import { HashedBox } from "./HashedBox";

export const LoadingState = () => (
  <div className="flex flex-col items-center justify-center p-10 text-[#8E9299]">
    <HashedBox />
    <p className="text-xs uppercase tracking-widest mt-4">Connection establishing...</p>
  </div>
);
