export type RoomIdMap = Record<string, string>;

interface Customer {
  name: string;
  title: string;
  email: string;
  phone: string;
  address: string;
  classification?: string;
  aum?: string;
  riskProfile?: string;
  avatarUrl?: string;
}

interface Report {
  header: string;
  files: string[];
}

export type TimelineStatus = 'completed' | 'pending' | 'scheduled';

export interface ActivityEntry {
  date: string;
  description: string;
  status: TimelineStatus;
}

export interface PortfolioAllocation {
  name: string;
  value: number;
  color: string;
}

export interface PortfolioPoint {
  month: string;
  value: number;
}

export interface CommSummaryEntry {
  channel: string;
  messages: number;
  lastActive: string;
}

export type ContactSegment = 'UHNW' | 'HNW' | 'Retail';

export const SEGMENT_STYLES: Record<ContactSegment, string> = {
  UHNW: 'bg-rose-600 text-white',
  HNW: 'bg-violet-600 text-white',
  Retail: 'bg-slate-600 text-white',
};
export type ServiceStatus = 'Active' | 'Pending' | 'Review';
export type PerformanceDirection = 'up' | 'down';
export type ActivityTone = 'meeting' | 'task' | 'alert' | 'document';

export interface DashboardHero {
  title: string;
  value: string;
  changeLabel: string;
}

export type DashboardKpiTone = 'default' | 'success' | 'danger';

export interface DashboardKpiCard {
  label: string;
  value: string;
  helper?: string;
  tone?: DashboardKpiTone;
}

export interface DashboardOverviewStat {
  label: string;
  value: string;
}

export interface TopPerformer {
  name: string;
  performance: string;
  avatarUrl?: string;
}

export interface MarketTicker {
  label: string;
  value: string;
  realTimeValue: string;
  change: string;
  direction: PerformanceDirection;
}

export interface TaskItem {
  id: string;
  title: string;
  dueLabel: string;
  completed: boolean;
}

export interface DashboardActivity {
  id: string;
  title: string;
  subtitle: string;
  timestamp: string;
  tone: ActivityTone;
  tag?: string;
}

export interface RevenueStream {
  label: string;
  value: string;
  percentage: number;
  color: string;
}

export interface RevenueSummary {
  totalRevenue: string;
  changeLabel: string;
  streams: RevenueStream[];
}

export type EngagementLevel = 'high' | 'medium' | 'low' | 'cold';

export interface EngagementCell {
  channel: string;
  count: number;
  level: EngagementLevel;
}

export interface ClientEngagement {
  name: string;
  channels: EngagementCell[];
}

export interface DashboardData {
  hero: DashboardHero;
  kpis: DashboardKpiCard[];
  openConversationUnreadCount?: number;
  overviewStats: DashboardOverviewStat[];
  topPerformers: TopPerformer[];
  marketData: MarketTicker[];
  taskMonthLabel: string;
  tasks: TaskItem[];
  activities: DashboardActivity[];
  revenueSummary: RevenueSummary;
  engagementHeatmap: ClientEngagement[];
}

export interface ClientStat {
  label: string;
  value: string;
}

export interface ClientRelationship {
  name: string;
  role: string;
  entity: string;
}

export interface ClientDocument {
  name: string;
  type: string;
  updatedAt: string;
}

export interface ClientActivity {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  tone: ActivityTone;
}

export interface Contact {
  id: string;
  name: string;
  avatarUrl?: string;
  role: string;
  segment: ContactSegment;
  preferredChannel: string;
  lastContact: string;
  nextReview: string;
  serviceStatus: ServiceStatus;
  aum: string;
  streamId?: string;
  geography: string;
  riskProfile: string;
  advisorOwner: string;
  email: string;
  phone: string;
  portfolioReturn: string;
  householdLabel: string;
  profileSummary: ClientStat[];
  portfolioAllocation: PortfolioAllocation[];
  relationships: ClientRelationship[];
  documents: ClientDocument[];
  recentActivity: ClientActivity[];
}

export interface WealthManagementData {
  customer: Customer;
  wealthRoom: RoomIdMap;
  reports: Report[];
  pdfFile: string;
  dashboard: DashboardData;
  activityTimeline?: ActivityEntry[];
  portfolioAllocation?: PortfolioAllocation[];
  portfolioHistory?: PortfolioPoint[];
  commSummary?: CommSummaryEntry[];
  contacts?: Contact[];
}
