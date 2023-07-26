interface RoomIdMap extends Record<string, string> {};

export interface CustomerRoom {
  name: string;
  company: string;
  roomId: RoomIdMap;
}

export interface ResearchData {
  coverageRoom: RoomIdMap;
  customerRooms: CustomerRoom[];
}
