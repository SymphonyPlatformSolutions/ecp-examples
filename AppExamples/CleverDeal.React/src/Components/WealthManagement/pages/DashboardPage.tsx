import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  CircleDot,
  TrendingUp,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { wealthManagementData } from '../data/wealthManagement';
import { symphonyNotifications } from '../chat/symphonyNotifications';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Calendar } from '../ui/calendar';
import { cn } from '../ui/utils';

const ACTIVITY_STYLES = {
  meeting: {
    icon: CalendarDays,
    ring: 'bg-sky-500',
    badge: 'bg-sky-100 text-sky-700',
  },
  task: {
    icon: CheckCircle2,
    ring: 'bg-emerald-500',
    badge: 'bg-emerald-100 text-emerald-700',
  },
  alert: {
    icon: AlertTriangle,
    ring: 'bg-rose-500',
    badge: 'bg-rose-100 text-rose-700',
  },
  document: {
    icon: CircleDot,
    ring: 'bg-amber-500',
    badge: 'bg-amber-100 text-amber-700',
  },
};

const MARKET_CHARTS = [
  { label: 'S&P 500', symbol: 'VANTAGE:SP500' },
  { label: 'Dow Jones', symbol: 'BLACKBULL:US30' },
  { label: 'UK 100', symbol: 'VANTAGE:UK100' },
];

type KpiBadgeConfig = {
  label: string;
  variant: 'info' | 'alert' | 'warning' | 'success';
};

let tradingViewMiniChartScriptPromise: Promise<void> | null = null;

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function buildAllocationDonutBackground(segments: Array<{ value: number; color: string }>) {
  let currentAngle = 0;
  const gapDegrees = 1;

  const stops = segments.flatMap((segment) => {
    const segmentAngle = (segment.value / 100) * 360;
    const segmentStart = currentAngle;
    const segmentEnd = currentAngle + segmentAngle;
    const visibleEnd = Math.max(segmentStart, segmentEnd - gapDegrees);

    currentAngle = segmentEnd;

    return [
      `${segment.color} ${segmentStart}deg ${visibleEnd}deg`,
      `#ffffff ${visibleEnd}deg ${segmentEnd}deg`,
    ];
  });

  return `conic-gradient(from -90deg, ${stops.join(', ')})`;
}

function loadTradingViewMiniChartScript() {
  if (typeof window === 'undefined') {
    return Promise.resolve();
  }

  if (window.customElements?.get('tv-mini-chart')) {
    return Promise.resolve();
  }

  if (!tradingViewMiniChartScriptPromise) {
    tradingViewMiniChartScriptPromise = new Promise<void>((resolve, reject) => {
      const existingScript = document.querySelector<HTMLScriptElement>(
        'script[src="https://widgets.tradingview-widget.com/w/en/tv-mini-chart.js"]',
      );

      if (existingScript) {
        existingScript.addEventListener('load', () => resolve(), { once: true });
        existingScript.addEventListener('error', () => reject(new Error('Failed to load TradingView widget script.')), {
          once: true,
        });
        return;
      }

      const script = document.createElement('script');
      script.type = 'module';
      script.src = 'https://widgets.tradingview-widget.com/w/en/tv-mini-chart.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load TradingView widget script.'));
      document.head.appendChild(script);
    });
  }

  return tradingViewMiniChartScriptPromise;
}

function TradingViewMiniChart({ symbol }: { symbol: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState<boolean>(typeof window !== 'undefined' && Boolean(window.customElements?.get('tv-mini-chart')));
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    loadTradingViewMiniChartScript()
      .then(() => {
        if (isMounted) {
          setIsReady(true);
        }
      })
      .catch(() => {
        if (isMounted) {
          setLoadError(true);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!containerRef.current || !isReady) {
      return;
    }

    const container = containerRef.current;
    container.innerHTML = '';

    const chart = document.createElement('tv-mini-chart');
    chart.setAttribute('symbol', symbol);
    chart.setAttribute('show-time-range', '');
    chart.setAttribute('transparent', '');
    chart.setAttribute('style', 'display:block;width:100%;height:100%;min-height:88px;');

    container.appendChild(chart);

    return () => {
      container.innerHTML = '';
    };
  }, [isReady, symbol]);

  if (loadError) {
    return (
      <div className="flex h-[110px] items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white text-[12px] text-slate-400">
        Market chart unavailable
      </div>
    );
  }

  return (
    <div className="relative h-[110px] overflow-hidden rounded-xl bg-white">
      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white text-[12px] text-slate-400">
          Loading chart...
        </div>
      )}
      <div ref={containerRef} className="h-full w-full" />
    </div>
  );
}

function DashboardTile({
  title,
  className,
  bodyClassName,
  headerContent,
  children,
}: {
  title: string;
  className?: string;
  bodyClassName?: string;
  headerContent?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-[14px] border border-slate-200 bg-white shadow-[0_2px_8px_rgba(15,23,42,0.06)]',
        className,
      )}
    >
      <div className="flex h-[38px] items-center justify-between gap-3 bg-[linear-gradient(180deg,#082a60_0%,#113b7d_100%)] px-3 text-white">
        <h2 className="text-[13px] font-semibold tracking-tight">{title}</h2>
        {headerContent}
      </div>
      <div className={cn('px-3 py-2.5', bodyClassName)}>{children}</div>
    </div>
  );
}

function PrimaryActivityFeed({ activities }: { activities: typeof wealthManagementData.dashboard.activities }) {
  return (
    <DashboardTile title="Activity Feed" bodyClassName="p-0">
      <div className="border-b border-slate-200 px-3 py-2">
        <div className="text-[13px] font-semibold text-slate-900">Recent Activities</div>
      </div>
      <div className="px-3 py-2">
        <div className="space-y-3">
          {activities.map((activity, index) => {
            const style = ACTIVITY_STYLES[activity.tone];
            const Icon = style.icon;
            return (
              <div key={activity.id} className="relative flex gap-3">
                <div className="relative flex w-6 flex-shrink-0 justify-center">
                  <div className={cn('flex h-6 w-6 items-center justify-center rounded-full text-white', style.ring)}>
                    <Icon className="h-3 w-3" />
                  </div>
                  {index < activities.length - 1 && <div className="absolute top-7 h-[52px] w-px bg-slate-200" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-[13px] font-semibold text-slate-900">{activity.title}</div>
                      <div className="mt-0.5 text-[11px] text-slate-600">{activity.subtitle}</div>
                    </div>
                    <div className="shrink-0 text-right text-[11px] text-slate-400">{activity.timestamp}</div>
                  </div>
                  {activity.tag && (
                    <span className={cn('mt-2 inline-flex rounded-md px-2 py-0.5 text-[10px] font-semibold', style.badge)}>
                      {activity.tag}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="border-t border-slate-200 px-3 py-2">
        <div className="grid grid-cols-4 gap-2 text-center">
          {[
            { label: 'Meetings', value: activities.filter(a => a.tone === 'meeting').length, color: 'text-sky-600' },
            { label: 'Tasks', value: activities.filter(a => a.tone === 'task').length, color: 'text-emerald-600' },
            { label: 'Alerts', value: activities.filter(a => a.tone === 'alert').length, color: 'text-rose-600' },
            { label: 'Docs', value: activities.filter(a => a.tone === 'document').length, color: 'text-amber-600' },
          ].map((stat) => (
            <div key={stat.label} className="rounded-lg bg-slate-50 px-1 py-1.5">
              <div className={cn('text-[15px] font-bold leading-none', stat.color)}>{stat.value}</div>
              <div className="mt-0.5 text-[9px] font-semibold uppercase tracking-wider text-slate-400">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </DashboardTile>
  );
}

const TIMELINE_STATUS_STYLES = {
  completed: {
    icon: CheckCircle2,
    ring: 'bg-emerald-500',
    badge: 'bg-emerald-100 text-emerald-700',
    label: 'Completed',
  },
  pending: {
    icon: AlertTriangle,
    ring: 'bg-amber-500',
    badge: 'bg-amber-100 text-amber-700',
    label: 'Pending',
  },
  scheduled: {
    icon: CalendarDays,
    ring: 'bg-sky-500',
    badge: 'bg-sky-100 text-sky-700',
    label: 'Scheduled',
  },
} as const;

function ScheduleAndTimeline({
  items,
  tasks,
  selectedDate,
  onSelectDate,
  calendarMonthLabel,
}: {
  items: NonNullable<typeof wealthManagementData.activityTimeline>;
  tasks: typeof wealthManagementData.dashboard.tasks;
  selectedDate: Date | undefined;
  onSelectDate: (date: Date | undefined) => void;
  calendarMonthLabel: string;
}) {
  return (
    <DashboardTile title="Schedule & Timeline">
      <div className="grid gap-3 xl:grid-cols-[minmax(0,1.15fr)_256px]">
        <div>
          <div className="text-[13px] font-semibold text-slate-900">Upcoming Timeline</div>
          <div className="mt-2 space-y-3">
            {items.map((item, index) => {
              const style = TIMELINE_STATUS_STYLES[item.status];
              const Icon = style.icon;

              return (
                <div key={`${item.date}-${item.description}`} className="relative flex gap-3">
                  <div className="relative flex w-6 flex-shrink-0 justify-center">
                    <div className={cn('flex h-6 w-6 items-center justify-center rounded-full text-white', style.ring)}>
                      <Icon className="h-3 w-3" />
                    </div>
                    {index < items.length - 1 && <div className="absolute top-7 h-[48px] w-px bg-slate-200" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 text-[12px] font-medium leading-[1.3] text-slate-900">{item.description}</div>
                      <div className="shrink-0 text-right text-[11px] text-slate-400">
                        {new Date(item.date).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' })}
                      </div>
                    </div>
                    <span className={cn('mt-2 inline-flex rounded-md px-2 py-0.5 text-[10px] font-semibold', style.badge)}>
                      {style.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-3 border-t border-slate-200 pt-3">
            <div className="text-[12px] font-semibold text-slate-900">Communication Summary</div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {[
                { channel: 'Secure Chat', messages: 142, lastActive: '2 min ago', color: 'bg-sky-500' },
                { channel: 'WhatsApp', messages: 58, lastActive: '1 hr ago', color: 'bg-emerald-500' },
                { channel: 'Email', messages: 34, lastActive: '3 hrs ago', color: 'bg-amber-500' },
                { channel: 'Phone', messages: 12, lastActive: '1 day ago', color: 'bg-slate-400' },
              ].map((ch) => (
                <div key={ch.channel} className="flex items-center gap-2 rounded-lg border border-slate-100 bg-slate-50 px-2 py-1.5">
                  <span className={cn('h-2 w-2 rounded-full', ch.color)} />
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] font-semibold text-slate-800">{ch.channel}</div>
                    <div className="text-[10px] text-slate-500">{ch.messages} msgs &middot; {ch.lastActive}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          </div>

        <div className="rounded-[10px] border border-slate-200 bg-slate-50 p-2">
          <div className="text-[13px] font-semibold text-slate-900">Calendar & Tasks</div>
          <div className="mt-0.5 text-right text-[10px] text-slate-400">{calendarMonthLabel}</div>
          <Calendar selected={selectedDate} onSelect={onSelectDate} className="mt-1 border-slate-200 bg-white" />
          <div className="mt-3 border-t border-slate-200 pt-3">
            <div className="text-[12px] font-semibold text-slate-900">Upcoming Tasks</div>
            <div className="mt-2 space-y-2">
              {tasks.map((task) => (
                <label key={task.id} className="flex items-center gap-3 text-[12px] text-slate-800">
                  <input type="checkbox" checked={task.completed} readOnly className="h-4 w-4 rounded border-slate-300" />
                  <span className="min-w-0 flex-1">{task.title}</span>
                  <span className="text-[10px] text-slate-400">{task.dueLabel}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardTile>
  );
}

function getKpiBadge(label: string, openConversationUnreadCount: number): KpiBadgeConfig | null {
  switch (label) {
    case 'Active Clients':
      return {
        label: '450 Active Relationships',
        variant: 'info',
      };
    case 'Pending Service Requests':
      return {
        label: '3 Urgent Client Actions',
        variant: 'warning',
      };
    case 'Campaign Engagement':
      return {
        label: 'Q3 Review Open Rate',
        variant: 'success',
      };
    case 'SLA Status':
      return {
        label: 'On Track',
        variant: 'success',
      };
    default:
      return null;
  }
}

function isBusinessDay(date: Date) {
  const day = date.getDay();
  return day !== 0 && day !== 6;
}

function getNextBusinessDay(date: Date) {
  const next = new Date(date);
  next.setDate(next.getDate() + 1);

  while (!isBusinessDay(next)) {
    next.setDate(next.getDate() + 1);
  }

  return next;
}

function getUpcomingTaskDueLabel(index: number, baseDate: Date) {
  if (index === 0) {
    return 'Today';
  }

  if (index === 1) {
    return 'Tomorrow';
  }

  let targetDate = new Date(baseDate);
  targetDate.setDate(targetDate.getDate() + 2);

  while (!isBusinessDay(targetDate)) {
    targetDate.setDate(targetDate.getDate() + 1);
  }

  for (let offset = 2; offset < index; offset += 1) {
    targetDate = getNextBusinessDay(targetDate);
  }

  return targetDate.toLocaleDateString('en-GB', { weekday: 'short' });
}

export default function DashboardPage() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(() => new Date());
  const [liveHistory, setLiveHistory] = useState(wealthManagementData.portfolioHistory ?? []);
  const [liveHeroChange, setLiveHeroChange] = useState(wealthManagementData.dashboard.hero.changeLabel);
  const [heroPulse, setHeroPulse] = useState(false);
  const [liveUnreadCount, setLiveUnreadCount] = useState(symphonyNotifications.count);
  const heroPulseTimeoutRef = useRef<number | null>(null);
  const { dashboard, portfolioAllocation } = wealthManagementData;
  const openConversationUnreadCount = liveUnreadCount;
  const allocationData = portfolioAllocation ?? [];
  const primaryAllocation = allocationData[0];
  const timelineItems = (wealthManagementData.activityTimeline ?? []).slice(0, 6);
  const marketStatusLabel = 'Market Open';
  const taskBaseDate = new Date();
  const tasksWithDynamicDueLabels = dashboard.tasks.map((task, index) => ({
    ...task,
    dueLabel: getUpcomingTaskDueLabel(index, taskBaseDate),
  }));
  const calendarMonthLabel = (selectedDate ?? new Date()).toLocaleDateString('en-GB', {
    month: 'long',
    year: 'numeric',
  });

  useEffect(() => symphonyNotifications.onCountChange(setLiveUnreadCount), []);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setLiveHistory((current) =>
        current.map((point, index) => ({
          ...point,
          value: index === current.length - 1 ? Number((point.value + (point.value > 138 ? -1.6 : 1.8)).toFixed(1)) : point.value,
        })),
      );

      setLiveHeroChange((current) => (current === '+4.5% QTD' ? '+4.7% QTD' : '+4.5% QTD'));
      setHeroPulse(true);

      if (heroPulseTimeoutRef.current !== null) {
        window.clearTimeout(heroPulseTimeoutRef.current);
      }

      heroPulseTimeoutRef.current = window.setTimeout(() => {
        setHeroPulse(false);
        heroPulseTimeoutRef.current = null;
      }, 1200);
    }, 4000);

    return () => {
      window.clearInterval(intervalId);
      if (heroPulseTimeoutRef.current !== null) {
        window.clearTimeout(heroPulseTimeoutRef.current);
        heroPulseTimeoutRef.current = null;
      }
    };
  }, []);

  return (
    <div className="bg-[#eef3f8]">
      <div className="p-3">
        <div style={{ display: 'grid', rowGap: 8 }}>
        <div className="grid gap-[10px] md:grid-cols-2 xl:grid-cols-5">
          {dashboard.kpis.map((kpi) => {
            const badge = getKpiBadge(kpi.label, openConversationUnreadCount);
            const showUnreadMessages = kpi.label === 'Open Conversations' && openConversationUnreadCount > 0;

            return (
              <div
                key={kpi.label}
                className="rounded-[10px] border border-slate-200 bg-white px-3 py-1.5 shadow-[0_1px_3px_rgba(15,23,42,0.05)]"
              >
                <div className="text-[11px] font-semibold text-slate-600">{kpi.label}</div>
                <div className="mt-0.5 text-[20px] font-bold leading-none tracking-tight text-slate-950">{kpi.value}</div>
                {showUnreadMessages && (
                  <div
                    className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-red-600 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-white shadow-[0_8px_18px_rgba(220,38,38,0.28)] motion-safe:animate-pulse"
                    style={{ animationDuration: '2.8s' }}
                  >
                    <span className="rounded-full bg-white/18 px-1.5 py-0.5 text-[11px] leading-none text-white">
                      {openConversationUnreadCount > 99 ? '99+' : openConversationUnreadCount}
                    </span>
                    <span>Unread Messages</span>
                  </div>
                )}
                {badge && (
                  <Badge
                    variant={badge.variant}
                    className="mt-1 inline-flex px-2 py-0.5 text-[9px] font-semibold"
                  >
                    {badge.label}
                  </Badge>
                )}
              </div>
            );
          })}
        </div>

        <div className="grid gap-3 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1fr)_minmax(240px,0.7fr)] xl:grid-rows-[auto_1fr]">
            <DashboardTile title={dashboard.hero.title} bodyClassName="p-0">
              <div className="px-3 pb-1.5 pt-1.5">
                <div className="text-[24px] font-bold leading-[0.96] tracking-tight text-slate-950">{dashboard.hero.value}</div>
                <div className="mt-0.5 inline-flex items-center">
                  <span className={cn(
                    'relative inline-flex rounded-md px-1.5 py-0.5 text-[12px] font-semibold text-[#123b7a] transition-colors duration-700',
                    heroPulse ? 'bg-sky-100' : 'bg-transparent',
                  )}>
                    {liveHeroChange}
                  </span>
                </div>
              </div>
              <div className="border-t border-slate-200 px-3 pb-2 pt-1.5">
                <div className="mb-0.5 flex items-center justify-between">
                  <div className="text-[12px] font-semibold text-slate-900">AUM Trend (12 Months)</div>
                  <div className="text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-400">Updated 08:30 AM</div>
                </div>
                <div className="h-[140px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={liveHistory} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                      <defs>
                        <linearGradient id="aum-gradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#123b7a" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#123b7a" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="#dde5f1" vertical={false} />
                      <XAxis axisLine={false} tickLine={false} dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#64748b', fontSize: 11 }}
                        tickFormatter={(value: number) => (value >= 100 ? `$${(value / 100).toFixed(2)}B` : `$${value}M`)}
                      />
                      <Tooltip
                        formatter={(value: number) => [`$${value}M`, 'AUM']}
                        contentStyle={{ borderRadius: 10, borderColor: '#dbe3ef', fontSize: 12 }}
                      />
                      <Area type="monotone" dataKey="value" stroke="#123b7a" strokeWidth={3} fill="url(#aum-gradient)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </DashboardTile>

            <div className="grid grid-cols-2 gap-3">
            <DashboardTile title="Client Overview">
              <div className="space-y-2">
                <div className="grid grid-cols-3 gap-1.5">
                  {dashboard.overviewStats.map((stat) => (
                    <div key={stat.label} className="rounded-[10px] border border-slate-200 bg-slate-50 px-1.5 py-1.5 text-center">
                      <div className="text-[9px] font-semibold uppercase tracking-[0.08em] text-slate-500">{stat.label}</div>
                      <div className="text-[17px] font-bold leading-tight text-[#123b7a]">{stat.value}</div>
                    </div>
                  ))}
                </div>

                <div>
                  <div className="text-[12px] font-semibold text-slate-900">Asset Allocation</div>
                  <div className="mt-1 flex items-center gap-2.5">
                    <div className="flex-shrink-0">
                      <div className="relative aspect-square w-[110px] rounded-full" style={{ background: buildAllocationDonutBackground(allocationData) }}>
                        <div className="absolute inset-[20px] rounded-full bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.95)]" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-center">
                            <div className="text-[8px] font-semibold uppercase tracking-[0.14em] text-slate-400">Mix</div>
                            <div className="mt-0.5 text-[17px] font-bold leading-none text-[#123b7a]">{primaryAllocation?.value}%</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="min-w-0 flex-1 space-y-0.5">
                      {allocationData.map((segment) => (
                        <div key={segment.name} className="flex items-center justify-between text-[12px]">
                          <div className="flex items-center gap-1.5 text-slate-700">
                            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: segment.color }} />
                            {segment.name}
                          </div>
                          <div className="font-semibold text-slate-900">{segment.value}%</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </DashboardTile>

            <DashboardTile title="Revenue Summary">
              <div className="space-y-2">
                <div className="rounded-[10px] border border-slate-200 bg-slate-50 px-2.5 py-1.5">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-500">Total Revenue</div>
                  <div className="text-[20px] font-bold leading-tight text-[#123b7a]">{dashboard.revenueSummary.totalRevenue}</div>
                  <div className="flex items-center gap-1 text-[#123b7a]">
                    <TrendingUp className="h-3 w-3" />
                    <span className="text-[12px] font-semibold">{dashboard.revenueSummary.changeLabel}</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  {dashboard.revenueSummary.streams.map((stream) => (
                    <div key={stream.label}>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-700">{stream.label}</span>
                        <span className="font-semibold text-slate-900">{stream.value}</span>
                      </div>
                      <div className="mt-0.5 h-1 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${stream.percentage}%`, backgroundColor: stream.color }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </DashboardTile>
            </div>

            <div className="grid grid-cols-2 gap-3">
            <DashboardTile title="Top Performers">
              <div className="text-[13px] font-semibold text-slate-900">Top Portfolios (YTD)</div>
              <div className="mt-2 space-y-2.5">
                {dashboard.topPerformers.map((performer) => (
                  <div key={performer.name} className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <Avatar className="h-7 w-7 border border-slate-200">
                        {performer.avatarUrl ? <AvatarImage src={performer.avatarUrl} alt={performer.name} /> : null}
                        <AvatarFallback className="bg-slate-100 text-[10px] font-semibold text-slate-700">
                          {getInitials(performer.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="truncate text-[13px] font-medium text-slate-900">{performer.name}</div>
                    </div>
                    <div className="text-[13px] font-semibold text-emerald-600">{performer.performance}</div>
                  </div>
                ))}
              </div>
            </DashboardTile>

            <DashboardTile title="Engagement Heatmap">
              <div className="space-y-1.5">
                <div className="grid grid-cols-[1fr_repeat(3,44px)] gap-1 text-center">
                  <div />
                  {['SYM', 'WA', 'EM'].map((ch) => (
                    <div key={ch} className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">{ch}</div>
                  ))}
                </div>
                {dashboard.engagementHeatmap.map((client) => (
                  <div key={client.name} className="grid grid-cols-[1fr_repeat(3,44px)] items-center gap-1">
                    <div className="truncate text-[12px] font-medium text-slate-800">{client.name}</div>
                    {client.channels.map((cell) => (
                      <div
                        key={cell.channel}
                        title={`${cell.count} interactions`}
                        className={cn(
                          'flex h-[26px] items-center justify-center rounded-md text-[10px] font-semibold',
                          cell.level === 'high' && 'bg-emerald-500 text-white',
                          cell.level === 'medium' && 'bg-emerald-200 text-emerald-900',
                          cell.level === 'low' && 'bg-amber-100 text-amber-800',
                          cell.level === 'cold' && 'bg-rose-100 text-rose-700',
                        )}
                      >
                        {cell.count}
                      </div>
                    ))}
                  </div>
                ))}
                <div className="flex items-center justify-end gap-2 pt-1">
                  {[
                    { level: 'High', cls: 'bg-emerald-500' },
                    { level: 'Med', cls: 'bg-emerald-200' },
                    { level: 'Low', cls: 'bg-amber-100' },
                    { level: 'Cold', cls: 'bg-rose-100' },
                  ].map((l) => (
                    <div key={l.level} className="flex items-center gap-1">
                      <span className={cn('h-2 w-2 rounded-sm', l.cls)} />
                      <span className="text-[9px] text-slate-400">{l.level}</span>
                    </div>
                  ))}
                </div>
              </div>
            </DashboardTile>
            </div>

            <PrimaryActivityFeed activities={dashboard.activities} />

            <ScheduleAndTimeline
              items={timelineItems}
              tasks={tasksWithDynamicDueLabels}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
              calendarMonthLabel={calendarMonthLabel}
            />

            <DashboardTile
              title="Market Data"
              headerContent={(
                <div className="flex items-center gap-1.5">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" style={{ animationDuration: '2s' }} />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  </span>
                  <span className="text-[10px] font-medium text-emerald-300">{marketStatusLabel}</span>
                </div>
              )}
              className="flex flex-col"
              bodyClassName="flex-1 flex flex-col"
            >
              <div className="text-[13px] font-semibold text-slate-900">Market Snapshot</div>
              <div className="mt-1.5 flex flex-1 flex-col gap-1.5">
                {MARKET_CHARTS.map((item) => (
                  <div key={item.symbol} className="flex flex-1 flex-col rounded-[10px] border border-slate-200 bg-slate-50 p-1.5">
                    <div className="mb-1 text-[12px] font-semibold text-slate-900">{item.label}</div>
                    <TradingViewMiniChart symbol={item.symbol} />
                  </div>
                ))}
              </div>
            </DashboardTile>
        </div>
        </div>
      </div>
    </div>
  );
}
