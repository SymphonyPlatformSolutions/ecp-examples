import { RoomIdMap } from "../Models";

export interface CustomerRoom {
  name: string;
  company: string;
  roomId: RoomIdMap;
}

export interface ResearchData {
  coverageRoom: RoomIdMap;
  customerRooms: CustomerRoom[];
  pdfFile: string;
}
