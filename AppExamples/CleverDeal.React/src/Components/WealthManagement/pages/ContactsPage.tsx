import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  type ColumnDef,
  type SortingState,
  useReactTable,
} from '@tanstack/react-table';
import { ArrowUpDown, MessageSquare, Search, TrendingUp, Users, Wallet, Activity } from 'lucide-react';
import { wealthManagementData } from '../data/wealthManagement';
import type { Contact, ContactSegment, ServiceStatus } from '../models/WealthManagementData';
import { SEGMENT_STYLES } from '../models/WealthManagementData';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Table, TBody, TD, TH, THead, TR } from '../ui/table';
import { cn } from '../ui/utils';
import { symphonyNotifications, type SymphonyStreamUnreadCounts } from '../chat/symphonyNotifications';

const STATUS_VARIANT: Record<ServiceStatus, 'success' | 'default' | 'secondary'> = {
  Active: 'success',
  Pending: 'secondary',
  Review: 'default',
};

const CHANNEL_STYLES: Record<string, string> = {
  Symphony: 'bg-sky-600 text-white',
  'Secure Chat': 'bg-indigo-600 text-white',
  WhatsApp: 'bg-emerald-600 text-white',
  WeChat: 'bg-green-600 text-white',
};

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

function ContactAvatar({ name, avatarUrl }: { name: string; avatarUrl?: string }) {
  const initials = getInitials(name);
  const tones = ['bg-sky-500', 'bg-emerald-500', 'bg-violet-500', 'bg-amber-500', 'bg-rose-500'];
  const tone = tones[initials.charCodeAt(0) % tones.length];

  return (
    <Avatar className="h-9 w-9">
      {avatarUrl ? <AvatarImage src={avatarUrl} alt={name} /> : null}
      <AvatarFallback className={cn('text-[11px] font-semibold text-white', tone)}>{initials}</AvatarFallback>
    </Avatar>
  );
}

function parseAum(aum: string): number {
  const n = parseFloat(aum.replace(/[^0-9.]/g, ''));
  if (aum.includes('B')) return n * 1000;
  return n;
}

interface ContactsPageProps {
  onOpenChat?: (contactId: string) => void;
}

export default function ContactsPage({ onOpenChat }: ContactsPageProps) {
  const navigate = useNavigate();
  const [sorting, setSorting] = useState<SortingState>([{ id: 'aum', desc: true }]);
  const [search, setSearch] = useState('');
  const [segmentFilter, setSegmentFilter] = useState<ContactSegment | 'All'>('All');
  const [statusFilter, setStatusFilter] = useState<ServiceStatus | 'All'>('All');
  const [streamUnreadCounts, setStreamUnreadCounts] = useState<SymphonyStreamUnreadCounts>(symphonyNotifications.streamUnreadSnapshot);

  const contacts = useMemo(() => wealthManagementData.contacts ?? [], []);

  useEffect(() => {
    return symphonyNotifications.onStreamUnreadChange(setStreamUnreadCounts);
  }, []);
  const filteredContacts = useMemo(
    () =>
      contacts.filter((contact) => {
        const query = search.trim().toLowerCase();
        const matchesSearch =
          !query ||
          contact.name.toLowerCase().includes(query) ||
          contact.geography.toLowerCase().includes(query) ||
          contact.advisorOwner.toLowerCase().includes(query) ||
          contact.householdLabel.toLowerCase().includes(query);

        const matchesSegment = segmentFilter === 'All' || contact.segment === segmentFilter;
        const matchesStatus = statusFilter === 'All' || contact.serviceStatus === statusFilter;

        return matchesSearch && matchesSegment && matchesStatus;
      }),
    [contacts, search, segmentFilter, statusFilter],
  );

  const totalAum = useMemo(() => contacts.reduce((sum, c) => sum + parseAum(c.aum), 0), [contacts]);
  const activeCount = useMemo(() => contacts.filter((c) => c.serviceStatus === 'Active').length, [contacts]);
  const avgReturn = useMemo(() => {
    const returns = contacts.map((c) => parseFloat(c.portfolioReturn?.replace('%', '') ?? '0'));
    return returns.length ? (returns.reduce((a, b) => a + b, 0) / returns.length).toFixed(1) : '0';
  }, [contacts]);
  const topChannel = useMemo(() => {
    const counts: Record<string, number> = {};
    contacts.forEach((c) => { counts[c.preferredChannel] = (counts[c.preferredChannel] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—';
  }, [contacts]);

  const columns = useMemo<ColumnDef<Contact>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Client',
        cell: ({ row }) => {
          const contact = row.original;
          const unreadCount = contact.streamId ? streamUnreadCounts[contact.streamId] ?? 0 : 0;
          return (
            <div className="flex items-center gap-2.5">
              <ContactAvatar name={contact.name} avatarUrl={contact.avatarUrl} />
              <div className="min-w-0">
                <div className="truncate text-[13px] font-semibold text-slate-900">{contact.name}</div>
                <div className="truncate text-[11px] text-slate-600">
                  {contact.role} · {contact.householdLabel}
                </div>
                {unreadCount > 0 && (
                  <div className="mt-1 inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-red-700 ring-1 ring-red-200">
                    {unreadCount > 99 ? '99+' : unreadCount} unread
                  </div>
                )}
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: 'segment',
        header: 'Segment',
        cell: ({ getValue }) => {
          const seg = getValue() as ContactSegment;
          return (
            <span className={cn(
              'rounded-md px-2.5 py-1 text-[11px] font-semibold',
              SEGMENT_STYLES[seg] ?? 'bg-slate-600 text-white',
            )}>
              {seg}
            </span>
          );
        },
      },
      {
        accessorKey: 'preferredChannel',
        header: 'Channel',
        cell: ({ getValue }) => (
          <span
            className={cn(
              'rounded-md px-2.5 py-1 text-[11px] font-semibold',
              CHANNEL_STYLES[String(getValue())] ?? 'bg-slate-600 text-white',
            )}
          >
            {String(getValue())}
          </span>
        ),
      },
      {
        accessorKey: 'portfolioReturn',
        header: 'Return',
        cell: ({ row }) => {
          const val = row.original.portfolioReturn ?? '—';
          const isPositive = val.startsWith('+');
          return (
            <span className={cn('text-[12px] font-semibold', isPositive ? 'text-emerald-600' : 'text-red-500')}>
              {val}
            </span>
          );
        },
      },
      {
        id: 'actions',
        header: 'Chat',
        cell: ({ row }) => {
          const contact = row.original;
          const unreadCount = contact.streamId ? streamUnreadCounts[contact.streamId] ?? 0 : 0;
          return (
            <div className="flex items-center justify-start">
              <Button
                size="sm"
                variant="outline"
                className="h-7 rounded-full border-sky-200 px-2.5 text-[11px] text-sky-700 hover:bg-sky-50"
                onClick={(event) => {
                  event.stopPropagation();
                  onOpenChat?.(contact.id);
                }}
              >
                <MessageSquare className="h-3 w-3" />
                Chat
                {unreadCount > 0 && (
                  <span className="ml-1 inline-flex min-w-[18px] items-center justify-center rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </Button>
            </div>
          );
        },
      },
      {
        accessorKey: 'lastContact',
        header: 'Last Contact',
        cell: ({ getValue }) => <span className="text-[13px] text-slate-700">{String(getValue())}</span>,
      },
      {
        accessorKey: 'nextReview',
        header: 'Next Review',
        cell: ({ getValue }) => <span className="text-[13px] text-slate-700">{String(getValue())}</span>,
      },
      {
        accessorKey: 'serviceStatus',
        header: 'Status',
        cell: ({ row }) => <Badge variant={STATUS_VARIANT[row.original.serviceStatus]}>{row.original.serviceStatus}</Badge>,
      },
      {
        accessorKey: 'aum',
        header: ({ column }) => (
          <button
            type="button"
            className="inline-flex items-center gap-1"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            AUM
            <ArrowUpDown className="h-3.5 w-3.5" />
          </button>
        ),
        cell: ({ row }) => <span className="text-[13px] font-semibold text-slate-900">{row.original.aum}</span>,
      },
      {
        accessorKey: 'advisorOwner',
        header: 'Advisor',
        cell: ({ getValue }) => <span className="text-[13px] text-slate-700">{String(getValue())}</span>,
      },
    ],
    [onOpenChat, streamUnreadCounts],
  );

  const table = useReactTable({
    columns,
    data: filteredContacts,
    state: { sorting },
    autoResetPageIndex: false,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const segmentBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    contacts.forEach((c) => { counts[c.segment] = (counts[c.segment] || 0) + 1; });
    return counts;
  }, [contacts]);

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#eef3f8]">
      {/* Header */}
      <div className="rounded-t-2xl border-b border-[#11346c] bg-[linear-gradient(90deg,#07285f_0%,#0f3d83_100%)] px-5 py-3 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[18px] font-bold tracking-tight text-white">Client Book</h1>
            <p className="text-[12px] text-sky-200/80">Advisor coverage, relationship health &amp; direct messaging</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="border border-white/20 bg-white/10 px-2.5 py-0.5 text-[11px] text-white">
              {contacts.length} clients
            </Badge>
            {filteredContacts.length !== contacts.length && (
              <Badge variant="secondary" className="border border-white/20 bg-sky-400/20 px-2.5 py-0.5 text-[11px] text-sky-200">
                {filteredContacts.length} filtered
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 overflow-auto p-3">
        {/* KPI cards */}
        <div className="grid grid-cols-2 gap-2 xl:grid-cols-4">
          {[
            { icon: Wallet, label: 'Total AUM', value: `$${totalAum}M`, color: 'text-white bg-sky-600' },
            { icon: TrendingUp, label: 'Avg Return', value: `${avgReturn}%`, color: 'text-white bg-emerald-600' },
            { icon: Users, label: 'Active Clients', value: `${activeCount}/${contacts.length}`, color: 'text-white bg-violet-600' },
            { icon: Activity, label: 'Top Channel', value: topChannel, color: 'text-white bg-amber-500' },
          ].map((kpi) => (
            <div key={kpi.label} className="flex items-center gap-2.5 rounded-[12px] bg-white px-3 py-2.5 shadow-sm ring-1 ring-slate-100">
              <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg', kpi.color)}>
                <kpi.icon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] font-medium uppercase tracking-wider text-slate-400">{kpi.label}</div>
                <div className="truncate text-[15px] font-bold text-slate-900">{kpi.value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters + Table container */}
        <Card className="min-h-0 flex-1 rounded-[14px] border-slate-200 shadow-sm">
          {/* Search & filter toolbar */}
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5">
            <div className="relative" style={{ width: 240 }}>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search clients…"
                className="h-8 w-full rounded-lg border border-slate-200 bg-slate-50/70 pl-8 pr-3 text-[12px] text-slate-900 placeholder:text-slate-400 focus:border-sky-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/25"
              />
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400">Segment</span>
                {(['All', 'UHNW', 'HNW', 'Retail'] as const).map((segment) => (
                  <button
                    key={segment}
                    type="button"
                    onClick={() => setSegmentFilter(segment)}
                    className={cn(
                      'rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors',
                      segmentFilter === segment
                        ? 'bg-[#0a2c63] text-white shadow-sm'
                        : 'text-slate-600 hover:bg-slate-100',
                    )}
                  >
                    {segment}
                  </button>
                ))}
              </div>
              <div className="h-5 w-px bg-slate-200" />
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400">Status</span>
                {(['All', 'Active', 'Pending', 'Review'] as const).map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setStatusFilter(status)}
                    className={cn(
                      'rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors',
                      statusFilter === status
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'text-slate-600 hover:bg-slate-100',
                    )}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
          </div>
          {/* Table */}
          <CardContent className="min-h-0 flex-1 p-0">
            <Table className="min-w-[1100px]">
              <THead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TR key={headerGroup.id} className="border-b border-slate-200/80 bg-slate-50/60 hover:bg-slate-50/60">
                    {headerGroup.headers.map((header) => (
                      <TH key={header.id} className="py-2.5 text-[11px]">
                        {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                      </TH>
                    ))}
                  </TR>
                ))}
              </THead>
              <TBody>
                {table.getRowModel().rows.length ? (
                  table.getRowModel().rows.map((row, idx) => (
                    <TR
                      key={row.id}
                      className={cn(
                        'cursor-pointer border-b border-slate-200 transition-colors hover:bg-sky-100/60',
                        idx % 2 === 0 ? 'bg-white' : 'bg-slate-100/70',
                      )}
                      onClick={() => navigate(`/wealth-management/clients/${row.original.id}`)}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TD key={cell.id} className="py-3">{flexRender(cell.column.columnDef.cell, cell.getContext())}</TD>
                      ))}
                    </TR>
                  ))
                ) : (
                  <TR className="bg-white hover:bg-white">
                    <TD colSpan={columns.length} className="py-16 text-center text-[13px] text-slate-400">
                      No clients matched the current search and filter set.
                    </TD>
                  </TR>
                )}
              </TBody>
            </Table>
          </CardContent>
        </Card>

        {/* Bottom insight cards */}
        <div className="grid gap-2 xl:grid-cols-3">
          <div className="flex items-start gap-3 rounded-[12px] border-l-[3px] border-l-sky-500 bg-white px-4 py-3 shadow-sm ring-1 ring-slate-100">
            <div>
              <div className="text-[10px] font-medium uppercase tracking-wider text-slate-400">Segment Breakdown</div>
              <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
                {Object.entries(segmentBreakdown).map(([seg, count]) => (
                  <span key={seg} className="text-[12px] text-slate-700">
                    <span className="font-semibold">{count}</span> {seg}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-[12px] border-l-[3px] border-l-emerald-500 bg-white px-4 py-3 shadow-sm ring-1 ring-slate-100">
            <div>
              <div className="text-[10px] font-medium uppercase tracking-wider text-slate-400">Preferred Channel</div>
              <div className="mt-0.5 text-[14px] font-semibold text-slate-900">Symphony Secure Chat</div>
              <div className="text-[11px] text-slate-500">Primary channel for {activeCount} active relationships</div>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-[12px] border-l-[3px] border-l-violet-500 bg-white px-4 py-3 shadow-sm ring-1 ring-slate-100">
            <div>
              <div className="text-[10px] font-medium uppercase tracking-wider text-slate-400">Next Review Window</div>
              <div className="mt-0.5 text-[14px] font-semibold text-slate-900">April service cycle</div>
              <div className="text-[11px] text-slate-500">Chat actions route to matching Symphony stream</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
