import { DocumentTab, Tab } from "./shared/DocumentTab";

export const IntelTab = ({ user, initialData }: { user: any, initialData?: Tab[] }) => {
  return (
    <DocumentTab 
      user={user} 
      initialData={initialData} 
      apiEndpoint="/api/intel-tabs" 
      moduleLabel="Intel Module" 
    />
  );
};
