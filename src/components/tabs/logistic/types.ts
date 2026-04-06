export interface Contributor {
  name: string;
  amount: number;
}

export interface GateData {
  id: string;
  name: string;
  code: string;
  owner_username: string;
  owner_uid: string;
  fuel_status: string;
  fuel_value: number;
  connected_to: string;
  foam: number;
  contributors: Contributor[];
  built: boolean;
}

export const MAX_FOAM = 420;
