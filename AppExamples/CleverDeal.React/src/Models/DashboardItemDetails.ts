export interface History {
  date: Date;
  detail: string;
}

export interface Member {
  id: string;
  name: string;
  email: string;
}

export interface RoomIdMap extends Record<string, string> {}

export interface DealDetailsInterface {
  roomId?: RoomIdMap;
  members: Member[];
  country: string;
  riskLevel: string;
  type: string;
  minimum: string;
}

export type DealStatus = "active" | "inactive";

export interface DealInterface {
  dealId: string;
  lastUpdated: string;
  status: DealStatus;
  name: string;
  details: DealDetailsInterface;
}
