import { DocumentTab, Tab } from "./shared/DocumentTab";

export const TribeTab = ({ user, initialData }: { user: any, initialData?: Tab[] }) => {
  return (
    <DocumentTab 
      user={user} 
      initialData={initialData} 
      apiEndpoint="/api/tribe-tabs" 
      moduleLabel="Tribe Module" 
    />
  );
};
