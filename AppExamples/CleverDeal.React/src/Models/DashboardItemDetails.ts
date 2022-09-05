export interface History {
  date: Date;
  detail: string;
}

export interface Member {
  id: string;
  name: string;
  email: string;
}

export interface RoomIdMap extends Record<string, string> {};

export interface DashboardItemDetailsInterface {
  roomId?: RoomIdMap;
  members: Member[];
  country: string;
  riskLevel: string;
  type: string;
  minimum: string;
} 

export interface DashboardItemInterface {
  dealId: string;
  lastUpdated: string;
  status: string;
  name: string;
  details: DashboardItemDetailsInterface;
}
