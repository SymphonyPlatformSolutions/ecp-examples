import { RoomIdMap } from "../Models";

interface Customer {
  name: string;
  title: string;
  email: string;
  phone: string;
  address: string;
}

interface Report {
  header: string;
  files: string[];
}

export interface WealthData {
  customer: Customer;
  wealthRoom: RoomIdMap;
  reports: Report[];
  pdfFile: string;
}
