import {
  ClientDocument,
  Contact,
  WealthManagementData,
} from '../models/WealthManagementData';
import AmeliaChenOnboardingChecklistPdf from '../assets/Amelia_Chen_Onboarding_Checklist.pdf';
import AmeliaChenProfile from '../assets/Amelia_Chen.png';
import EvelynReedCustodialStatementPdf from '../assets/Evelyn_Reed_Custodial_Statement.pdf';
import EvelynReedEstatePlanningBriefPdf from '../assets/Evelyn_Reed_Estate_Planning_Brief.pdf';
import EvelynReedQ1AllocationMemoPdf from '../assets/Evelyn_Reed_Q1_Allocation_Memo.pdf';
import EvelynReedProfile from '../assets/Evelyn_Reed.png';
import FayeZhangApacTaxPackPdf from '../assets/Faye_Zhang_APAC_Tax_Pack.pdf';
import FayeZhangProfile from '../assets/Faye_Zhang.png';
import HansGruberProfile from '../assets/Hans_Gruber.png';
import JonathanSmithLiquidityReviewPdf from '../assets/Jonathan_Smith_Liquidity_Review.pdf';
import JonathanSmithMacroOutlookPdf from '../assets/Jonathan_Smith_Macro_Outlook.pdf';
import JonathanSmithProfile from '../assets/Jonathan_Smith.png';
import RajPatelIncomeStrategyPdf from '../assets/Raj_Patel_Income_Strategy.pdf';
import RajPatelProfile from '../assets/Raj_Patel.png';

const sharedAllocation = [
  { name: 'Core Equities', value: 40, color: '#123b7a' },
  { name: 'Alternatives', value: 22, color: '#2f66b3' },
  { name: 'Private Credit', value: 18, color: '#66a1d2' },
  { name: 'Cash', value: 12, color: '#94b8dd' },
  { name: 'Other', value: 8, color: '#d8e4f2' },
];

const documentAssetByKey: Record<string, string> = {
  'Amelia Chen::Onboarding Checklist.pdf': AmeliaChenOnboardingChecklistPdf,
  'Evelyn Reed::Custodian Statement.pdf': EvelynReedCustodialStatementPdf,
  'Evelyn Reed::Estate Planning Brief.pdf': EvelynReedEstatePlanningBriefPdf,
  'Evelyn Reed::Q1 Allocation Memo.pdf': EvelynReedQ1AllocationMemoPdf,
  'Faye Zhang::APAC Tax Pack.pdf': FayeZhangApacTaxPackPdf,
  'Jonathan Smith::Liquidity Review.pdf': JonathanSmithLiquidityReviewPdf,
  'Jonathan Smith::Macro Outlook.pdf': JonathanSmithMacroOutlookPdf,
  'Raj Patel::Income Strategy.pdf': RajPatelIncomeStrategyPdf,
};

function attachDocumentAssets(
  contactName: string,
  documents: Array<Omit<ClientDocument, 'assetUrl'>>,
): ClientDocument[] {
  return documents.map((document) => {
    const assetUrl = documentAssetByKey[`${contactName}::${document.name}`];

    if (!assetUrl) {
      throw new Error(`Missing document asset for ${contactName}: ${document.name}`);
    }

    return {
      ...document,
      assetUrl,
    };
  });
}

const createClient = (contact: Contact): Contact => contact;

const contacts: Contact[] = [
  createClient({
    id: '1',
    name: 'Evelyn Reed',
    avatarUrl: EvelynReedProfile,
    role: 'Principal',
    segment: 'UHNW',
    preferredChannel: 'Symphony',
    lastContact: '2h ago',
    nextReview: 'Apr 02',
    serviceStatus: 'Active',
    aum: '$25M',
    streamId: 'Sc8n9Qgb7re0hAuOn7aWnX///mLo6093dA==',
    geography: 'New York',
    riskProfile: 'Moderate',
    advisorOwner: 'Hans Gruber',
    email: 'e.reed@reedfamilyoffice.com',
    phone: '+1 212-555-0100',
    portfolioReturn: '+13.6% YTD',
    householdLabel: 'Reed Family Office',
    profileSummary: [
      { label: 'Asset Value', value: '$25M' },
      { label: 'Risk Profile', value: 'Moderate' },
      { label: 'Primary Channel', value: 'Secure Chat' },
      { label: 'Owner', value: 'Hans Gruber' },
    ],
    portfolioAllocation: sharedAllocation,
    relationships: [
      { name: 'Carter Reed', role: 'Spouse', entity: 'Reed Household' },
      { name: 'Reed Family Trust', role: 'Trust Entity', entity: 'Private Trust' },
      { name: 'Nadia Collins', role: 'Tax Counsel', entity: 'Hollis Advisory' },
    ],
    documents: attachDocumentAssets('Evelyn Reed', [
      { name: 'Q1 Allocation Memo.pdf', type: 'Investment Memo', updatedAt: 'Mar 11' },
      { name: 'Estate Planning Brief.pdf', type: 'Legal', updatedAt: 'Mar 08' },
      { name: 'Custodian Statement.pdf', type: 'Statement', updatedAt: 'Mar 01' },
    ]),
    recentActivity: [
      {
        id: 'reed-activity-1',
        title: 'Review Meeting',
        description: 'Monday review completed with updated allocation guidance.',
        timestamp: 'Yesterday - 10:00 AM',
        tone: 'meeting',
      },
      {
        id: 'reed-activity-2',
        title: 'Document Sent',
        description: 'Investment proposal delivered through secure document flow.',
        timestamp: 'Yesterday - 01:00 PM',
        tone: 'document',
      },
      {
        id: 'reed-activity-3',
        title: 'Withdrawal Alert',
        description: 'Monitoring alert opened for private credit cash request.',
        timestamp: 'Today - 08:40 AM',
        tone: 'alert',
      },
      {
        id: 'reed-activity-4',
        title: 'Portfolio Rebalance',
        description: 'Equities trimmed by 3% to fund alternatives sleeve.',
        timestamp: 'Today - 11:15 AM',
        tone: 'task',
      },
    ],
  }),
  createClient({
    id: '2',
    name: 'Jonathan Smith',
    avatarUrl: JonathanSmithProfile,
    role: 'Founder',
    segment: 'UHNW',
    preferredChannel: 'WhatsApp',
    lastContact: '3h ago',
    nextReview: 'Apr 04',
    serviceStatus: 'Active',
    aum: '$32M',
    streamId: 'cO/+x1Uz5Up1hshZZqmkWH///mKXxcyfdA==',
    geography: 'London',
    riskProfile: 'Aggressive',
    advisorOwner: 'John Doe',
    email: 'j.smith@smithfamily.co.uk',
    phone: '+44 20 7946 0100',
    portfolioReturn: '+12.4% YTD',
    householdLabel: 'Smith Household',
    profileSummary: [
      { label: 'Asset Value', value: '$32M' },
      { label: 'Risk Profile', value: 'Aggressive' },
      { label: 'Primary Channel', value: 'WhatsApp' },
      { label: 'Owner', value: 'John Doe' },
    ],
    portfolioAllocation: sharedAllocation,
    relationships: [
      { name: 'Mira Smith', role: 'Family Office Lead', entity: 'Smith Household' },
      { name: 'Northgate Trust', role: 'Trust Entity', entity: 'Northgate' },
      { name: 'Leo Patel', role: 'CIO', entity: 'Independent Advisor' },
    ],
    documents: attachDocumentAssets('Jonathan Smith', [
      { name: 'Macro Outlook.pdf', type: 'Research', updatedAt: 'Mar 12' },
      { name: 'Liquidity Review.pdf', type: 'Memo', updatedAt: 'Mar 09' },
    ]),
    recentActivity: [
      {
        id: 'smith-activity-1',
        title: 'WhatsApp Outreach',
        description: 'Advisor sent direct follow-up regarding the Q2 funding plan.',
        timestamp: 'Today - 07:20 AM',
        tone: 'task',
      },
      {
        id: 'smith-activity-2',
        title: 'Liquidity Review',
        description: 'Cash position assessed ahead of upcoming PE capital call.',
        timestamp: 'Yesterday - 02:30 PM',
        tone: 'meeting',
      },
      {
        id: 'smith-activity-3',
        title: 'Compliance Flagged',
        description: 'Transaction over threshold flagged for enhanced monitoring.',
        timestamp: 'Yesterday - 04:45 PM',
        tone: 'alert',
      },
      {
        id: 'smith-activity-4',
        title: 'Macro Report Shared',
        description: 'Q2 macro outlook document sent via secure channel.',
        timestamp: 'Monday - 09:00 AM',
        tone: 'document',
      },
    ],
  }),
  createClient({
    id: '3',
    name: 'Amelia Chen',
    avatarUrl: AmeliaChenProfile,
    role: 'Chairwoman',
    segment: 'HNW',
    preferredChannel: 'SMS',
    lastContact: '14h ago',
    nextReview: 'Apr 08',
    serviceStatus: 'Pending',
    aum: '$18M',
    streamId: 'IG67/746izQS/AyMmE4Wz3///mLo6VsLdA==',
    geography: 'Singapore',
    riskProfile: 'Moderate',
    advisorOwner: 'Hans Gruber',
    email: 'a.chen@orbitalholdings.sg',
    phone: '+65 6321 5500',
    portfolioReturn: '+10.8% YTD',
    householdLabel: 'Orbital Holdings',
    profileSummary: [
      { label: 'Asset Value', value: '$18M' },
      { label: 'Risk Profile', value: 'Moderate' },
      { label: 'Primary Channel', value: 'SMS' },
      { label: 'Owner', value: 'Hans Gruber' },
    ],
    portfolioAllocation: sharedAllocation,
    relationships: [
      { name: 'Marcus Chen', role: 'COO', entity: 'Orbital Holdings' },
      { name: 'Aster Trustee', role: 'Trust Entity', entity: 'Singapore Trust' },
    ],
    documents: attachDocumentAssets('Amelia Chen', [
      { name: 'Onboarding Checklist.pdf', type: 'Compliance', updatedAt: 'Mar 10' },
    ]),
    recentActivity: [
      {
        id: 'chen-activity-1',
        title: 'KYC Review',
        description: 'Pending final approval on onboarding documentation.',
        timestamp: 'Yesterday - 03:15 PM',
        tone: 'document',
      },
      {
        id: 'chen-activity-2',
        title: 'Onboarding Call',
        description: 'Introductory call with COO to finalize account structure.',
        timestamp: 'Yesterday - 10:00 AM',
        tone: 'meeting',
      },
      {
        id: 'chen-activity-3',
        title: 'Risk Assessment',
        description: 'Moderate risk profile confirmed after suitability questionnaire.',
        timestamp: 'Monday - 04:00 PM',
        tone: 'task',
      },
      {
        id: 'chen-activity-4',
        title: 'Trust Entity Linked',
        description: 'Aster Trustee entity linked to household for reporting.',
        timestamp: 'Monday - 11:30 AM',
        tone: 'document',
      },
    ],
  }),
  createClient({
    id: '4',
    name: 'Raj Patel',
    avatarUrl: RajPatelProfile,
    role: 'Managing Partner',
    segment: 'UHNW',
    preferredChannel: 'Symphony',
    lastContact: '1d ago',
    nextReview: 'Apr 12',
    serviceStatus: 'Active',
    aum: '$21M',
    streamId: 'irhBDGwEawNq/i1dDUzBMH///mLo6lA7dA==',
    geography: 'Toronto',
    riskProfile: 'Conservative',
    advisorOwner: 'Li Zhang',
    email: 'r.patel@patelcapital.ca',
    phone: '+1 416-555-0182',
    portfolioReturn: '+9.9% YTD',
    householdLabel: 'Patel Capital',
    profileSummary: [
      { label: 'Asset Value', value: '$21M' },
      { label: 'Risk Profile', value: 'Conservative' },
      { label: 'Primary Channel', value: 'Symphony' },
      { label: 'Owner', value: 'Li Zhang' },
    ],
    portfolioAllocation: sharedAllocation,
    relationships: [{ name: 'Lila Patel', role: 'Family Office', entity: 'Patel Capital' }],
    documents: attachDocumentAssets('Raj Patel', [
      { name: 'Income Strategy.pdf', type: 'Portfolio', updatedAt: 'Mar 06' },
    ]),
    recentActivity: [
      {
        id: 'patel-activity-1',
        title: 'Income strategy update',
        description: 'Secure note shared with updated fixed income ladder.',
        timestamp: 'Monday - 11:45 AM',
        tone: 'meeting',
      },
      {
        id: 'patel-activity-2',
        title: 'Bond Maturity Alert',
        description: 'Corporate bond maturing in 30 days flagged for reinvestment.',
        timestamp: 'Yesterday - 09:20 AM',
        tone: 'alert',
      },
      {
        id: 'patel-activity-3',
        title: 'Tax Optimization Review',
        description: 'Capital gains harvesting strategy discussed and documented.',
        timestamp: 'Yesterday - 02:00 PM',
        tone: 'task',
      },
      {
        id: 'patel-activity-4',
        title: 'Statement Delivered',
        description: 'March custodian statement uploaded to client portal.',
        timestamp: 'Today - 07:30 AM',
        tone: 'document',
      },
    ],
  }),
  createClient({
    id: '5',
    name: 'Faye Zhang',
    avatarUrl: FayeZhangProfile,
    role: 'Family Principal',
    segment: 'UHNW',
    preferredChannel: 'WhatsApp',
    lastContact: '1d ago',
    nextReview: 'Apr 18',
    serviceStatus: 'Review',
    aum: '$42M',
    streamId: 'HnKT/x6dMRyS7qSePNBMtH///mKXzmcSdA==',
    geography: 'Hong Kong',
    riskProfile: 'Aggressive',
    advisorOwner: 'Li Zhang',
    email: 'f.zhang@zhanginvest.hk',
    phone: '+852 3456 7890',
    portfolioReturn: '+8.7% YTD',
    householdLabel: 'Zhang Investments',
    profileSummary: [
      { label: 'Asset Value', value: '$42M' },
      { label: 'Risk Profile', value: 'Aggressive' },
      { label: 'Primary Channel', value: 'WhatsApp' },
      { label: 'Owner', value: 'Li Zhang' },
    ],
    portfolioAllocation: sharedAllocation,
    relationships: [{ name: 'Victor Wong', role: 'Operating Partner', entity: 'Zhang Investments' }],
    documents: attachDocumentAssets('Faye Zhang', [
      { name: 'APAC Tax Pack.pdf', type: 'Tax', updatedAt: 'Mar 04' },
    ]),
    recentActivity: [
      {
        id: 'zhang-activity-1',
        title: 'Risk review',
        description: 'Account flagged for concentrated single-name exposure.',
        timestamp: 'Monday - 08:00 AM',
        tone: 'alert',
      },
      {
        id: 'zhang-activity-2',
        title: 'APAC Tax Filing',
        description: 'Cross-border tax pack submitted to Hong Kong counsel.',
        timestamp: 'Yesterday - 01:15 PM',
        tone: 'document',
      },
      {
        id: 'zhang-activity-3',
        title: 'Strategy Call',
        description: 'Quarterly investment committee call with family office.',
        timestamp: 'Yesterday - 04:30 PM',
        tone: 'meeting',
      },
      {
        id: 'zhang-activity-4',
        title: 'Hedge Rebalance',
        description: 'FX hedge ratio adjusted from 60% to 75% on USD exposure.',
        timestamp: 'Today - 08:45 AM',
        tone: 'task',
      },
    ],
  }),
];

export const wealthManagementData: WealthManagementData = {
  customer: {
    name: 'Hans Gruber',
    avatarUrl: HansGruberProfile,
    title: 'Lead Advisor, Nakatomi Wealth CRM',
    email: 'h.gruber@nakatomiwealth.com',
    phone: '+44 20 7946 0199',
    address: '1 Canada Square, Canary Wharf, London E14 5AB',
    classification: 'Advisor',
    aum: '$1.25B',
    riskProfile: 'Enterprise',
  },
  wealthRoom: {
    'st3.dev.symphony.com': 'oCQx1R2K7mYcrI8z6/4NSX///nYr1OKEdA==',
    'corporate.symphony.com': 'ZFLJvom6ah5U0tr39vNGlX///nZE+r6KdA==',
    'preview.symphony.com': 'ZFLJvom6ah5U0tr39vNGlX///nZE+r6KdA==',
  },
  reports: [
    {
      header: 'Investment related',
      files: ['Investment Proposal X.pdf', 'Investment Proposal Y.pdf'],
    },
    {
      header: 'Research related',
      files: ['Green energy sector.pdf'],
    },
  ],
  dashboard: {
    hero: {
      title: 'Assets Under Management',
      value: '$1.25 Billion',
      changeLabel: '+4.5% QTD',
    },
    kpis: [
      { label: 'Active Clients', value: '142', helper: '450 covered relationships' },
      { label: 'Open Conversations', value: '28', helper: '8 Symphony, 15 WhatsApp, 5 WeChat' },
      { label: 'Pending Service Requests', value: '7', helper: '3 urgent client actions' },
      { label: 'Campaign Engagement', value: '68%', helper: 'Q3 review open rate', tone: 'success' },
      { label: 'SLA Status', value: '98%', helper: '98% on track', tone: 'success' },
    ],
    openConversationUnreadCount: 7,
    overviewStats: [
      { label: 'Total Clients', value: '450' },
      { label: 'New', value: '5' },
      { label: 'At-Risk', value: '12' },
    ],
    topPerformers: [
      { name: 'E. Reed', performance: '+13.6%', avatarUrl: EvelynReedProfile },
      { name: 'J. Smith', performance: '+12.4%', avatarUrl: JonathanSmithProfile },
      { name: 'A. Chen', performance: '+10.8%', avatarUrl: AmeliaChenProfile },
      { name: 'R. Patel', performance: '+9.9%', avatarUrl: RajPatelProfile },
    ],
    marketData: [
      {
        label: 'S&P 500',
        value: '$14,930.00',
        realTimeValue: '$1,814.85',
        change: '0.36%',
        direction: 'up',
      },
      {
        label: 'Dow Jones',
        value: '$27,490.00',
        realTimeValue: '$2,678.26',
        change: '0.15%',
        direction: 'down',
      },
    ],
    taskMonthLabel: 'October 2023',
    tasks: [
      { id: 'task-1', title: 'Upcoming Tasks', dueLabel: 'Today', completed: false },
      { id: 'task-2', title: 'Check portfolio approvals', dueLabel: 'Tomorrow', completed: false },
      { id: 'task-3', title: 'Renew checklist', dueLabel: 'Thu', completed: false },
    ],
    revenueSummary: {
      totalRevenue: '$18.4M',
      changeLabel: '+6.2% YoY',
      streams: [
        { label: 'Advisory Fees', value: '$8.2M', percentage: 44.6, color: '#123b7a' },
        { label: 'Management Fees', value: '$5.1M', percentage: 27.7, color: '#1e5bb5' },
        { label: 'Trading Commissions', value: '$3.0M', percentage: 16.3, color: '#2a6fc9' },
        { label: 'Performance Fees', value: '$2.1M', percentage: 11.4, color: '#5b9bd5' },
      ],
    },
    engagementHeatmap: [
      {
        name: 'E. Reed',
        channels: [
          { channel: 'Symphony', count: 42, level: 'high' },
          { channel: 'WhatsApp', count: 18, level: 'medium' },
          { channel: 'Email', count: 7, level: 'low' },
        ],
      },
      {
        name: 'J. Smith',
        channels: [
          { channel: 'Symphony', count: 31, level: 'high' },
          { channel: 'WhatsApp', count: 5, level: 'low' },
          { channel: 'Email', count: 22, level: 'medium' },
        ],
      },
      {
        name: 'A. Chen',
        channels: [
          { channel: 'Symphony', count: 8, level: 'low' },
          { channel: 'WhatsApp', count: 35, level: 'high' },
          { channel: 'Email', count: 14, level: 'medium' },
        ],
      },
      {
        name: 'R. Patel',
        channels: [
          { channel: 'Symphony', count: 2, level: 'cold' },
          { channel: 'WhatsApp', count: 1, level: 'cold' },
          { channel: 'Email', count: 4, level: 'cold' },
        ],
      },
      {
        name: 'F. Zhang',
        channels: [
          { channel: 'Symphony', count: 12, level: 'medium' },
          { channel: 'WhatsApp', count: 28, level: 'high' },
          { channel: 'Email', count: 3, level: 'cold' },
        ],
      },
    ],
    activities: [
      {
        id: 'activity-1',
        title: 'Meeting: Sarah Davis - Review',
        subtitle: 'Client annual review completed',
        timestamp: 'Monday at 08:11 pm',
        tone: 'meeting',
      },
      {
        id: 'activity-2',
        title: 'Task: Rebalance Portfolio',
        subtitle: 'Mark Thompson portfolio rebalanced',
        timestamp: 'Tuesday at 11:30 am',
        tone: 'task',
        tag: 'Meeting',
      },
      {
        id: 'activity-3',
        title: 'Alert: Large Withdrawal',
        subtitle: 'L. Garcia portfolio monitoring escalated',
        timestamp: 'Tuesday at 11:10 pm',
        tone: 'alert',
      },
      {
        id: 'activity-4',
        title: 'Document: Tax briefing shared',
        subtitle: 'APAC client outreach package sent',
        timestamp: 'Wednesday at 02:15 pm',
        tone: 'document',
      },
      {
        id: 'activity-5',
        title: 'Meeting: Raj Patel - Strategy',
        subtitle: 'Discussed emerging market exposure',
        timestamp: 'Thursday at 09:45 am',
        tone: 'meeting',
      },
      {
        id: 'activity-6',
        title: 'Task: Compliance Review',
        subtitle: 'KYC documents verified for Reed account',
        timestamp: 'Thursday at 02:30 pm',
        tone: 'task',
        tag: 'Completed',
      },
      {
        id: 'activity-7',
        title: 'Alert: Margin Call Warning',
        subtitle: 'J. Smith leverage threshold approaching',
        timestamp: 'Friday at 08:05 am',
        tone: 'alert',
      },
    ],
  },
  activityTimeline: [
    {
      date: '2024-01-15',
      description: 'Portfolio rebalancing completed - equity allocation adjusted to 60%',
      status: 'completed',
    },
    {
      date: '2024-01-12',
      description: 'Quarterly review meeting with Evelyn Reed',
      status: 'completed',
    },
    {
      date: '2024-01-10',
      description: 'Research report shared: Green Energy Sector Outlook',
      status: 'completed',
    },
    {
      date: '2024-01-08',
      description: 'Investment proposal sent for review',
      status: 'pending',
    },
    {
      date: '2024-01-05',
      description: 'Compliance review - KYC documents updated',
      status: 'completed',
    },
    {
      date: '2024-01-03',
      description: 'Scheduled annual portfolio strategy session',
      status: 'scheduled',
    },
  ],
  portfolioAllocation: sharedAllocation,
  commSummary: [
    { channel: 'Symphony', messages: 142, lastActive: '2 min ago' },
    { channel: 'WhatsApp', messages: 58, lastActive: '1 hr ago' },
    { channel: 'Email', messages: 34, lastActive: '3 hrs ago' },
    { channel: 'Phone', messages: 12, lastActive: '1 day ago' },
  ],
  portfolioHistory: [
    { month: 'Jan', value: 55 },
    { month: 'Feb', value: 59 },
    { month: 'Mar', value: 64 },
    { month: 'Apr', value: 72 },
    { month: 'May', value: 69 },
    { month: 'Jun', value: 85 },
    { month: 'Jul', value: 76 },
    { month: 'Aug', value: 87 },
    { month: 'Sep', value: 96 },
    { month: 'Oct', value: 88 },
    { month: 'Nov', value: 124 },
    { month: 'Dec', value: 140 },
  ],
  contacts,
};
