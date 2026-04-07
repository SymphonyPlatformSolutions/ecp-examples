import { useState, type ReactNode } from 'react';
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  FileText,
  Handshake,
  Mail,
  MapPin,
  Phone,
  Send,
  ShieldCheck,
} from 'lucide-react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { Navigate, useParams } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { wealthManagementData } from '../data/wealthManagement';
import { SEGMENT_STYLES, type ClientDocument } from '../models/WealthManagementData';
import { useClientChatSdkController } from '../chat/useClientChatSdkController';
import { debugWealth } from '../chat/wealthDebug';
import ChatLoadingOverlay from '../components/ChatLoadingOverlay';




function debugDocumentShare(message: string, context?: Record<string, unknown>) {
  debugWealth('WealthClientShare', message, context);
}

const documentDataUriCache = new Map<string, Promise<string>>();

function readBlobAsDataUri(blob: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        reject(new Error('Unable to read the PDF asset.'));
        return;
      }

      resolve(reader.result);
    };

    reader.onerror = () => {
      reject(reader.error ?? new Error('Unable to read the PDF asset.'));
    };

    reader.readAsDataURL(blob);
  });
}

function getDocumentDataUri(document: ClientDocument) {
  const cachedDataUri = documentDataUriCache.get(document.assetUrl);
  if (cachedDataUri) {
    return cachedDataUri;
  }

  const dataUriPromise = fetch(document.assetUrl)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Unable to load ${document.name}.`);
      }

      return response.blob();
    })
    .then((blob) => readBlobAsDataUri(blob))
    .catch((error) => {
      documentDataUriCache.delete(document.assetUrl);
      throw error;
    });

  documentDataUriCache.set(document.assetUrl, dataUriPromise);
  return dataUriPromise;
}

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

interface ClientDetailPageProps {
  ecpOrigin?: string;
  partnerId?: string;
}

const TILE_CLASSNAME = 'overflow-hidden rounded-[14px] border border-slate-200 bg-white shadow-[0_2px_8px_rgba(15,23,42,0.06)]';
const TILE_HEADER_CLASSNAME = 'flex h-[38px] items-center justify-between gap-3 bg-[linear-gradient(180deg,#082a60_0%,#113b7d_100%)] px-3 text-white';

function ProfileTile({
  title,
  headerContent,
  bodyClassName,
  className,
  children,
}: {
  title: string;
  headerContent?: ReactNode;
  bodyClassName?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={`${TILE_CLASSNAME} ${className ?? ''}`.trim()}>
      <div className={TILE_HEADER_CLASSNAME}>
        <h2 className="text-[13px] font-semibold tracking-tight text-white">{title}</h2>
        {headerContent}
      </div>
      <div className={bodyClassName ?? 'px-3 py-2.5'}>{children}</div>
    </div>
  );
}

const ACTIVITY_STYLES = {
  meeting: {
    icon: CalendarDays,
    ring: 'bg-sky-500',
    badge: 'bg-sky-100 text-sky-700',
    label: 'Meeting',
  },
  task: {
    icon: CheckCircle2,
    ring: 'bg-emerald-500',
    badge: 'bg-emerald-100 text-emerald-700',
    label: 'Task',
  },
  alert: {
    icon: AlertTriangle,
    ring: 'bg-rose-500',
    badge: 'bg-rose-100 text-rose-700',
    label: 'Alert',
  },
  document: {
    icon: FileText,
    ring: 'bg-amber-500',
    badge: 'bg-amber-100 text-amber-700',
    label: 'Document',
  },
} as const;

async function buildDocumentSharePayload(document: ClientDocument, contactName: string) {
  const dataUri = await getDocumentDataUri(document);

  return {
    text: {
      'text/markdown': `Shared *${document.name}* with ${contactName}.\n\nType: ${document.type}\nUpdated: ${document.updatedAt}`,
    },
    entities: {
      report: {
        type: 'fdc3.fileAttachment',
        data: {
          name: document.name,
          dataUri,
        },
      },
    },
  };
}

export default function ClientDetailPage({
  ecpOrigin = 'corporate.symphony.com',
  partnerId,
}: ClientDetailPageProps) {
  const { id = '' } = useParams<{ id: string }>();
  const [sharingDocumentName, setSharingDocumentName] = useState<string | null>(null);
  const [shareError, setShareError] = useState<string | null>(null);

  const {
    chatError,
    isChatReady,
    isLoading,
    sendMessageToChat,
    streamId,
    slotClassName,
  } = useClientChatSdkController({
    contactId: id,
    ecpOrigin,
    partnerId,
  });

  const contact = (wealthManagementData.contacts ?? []).find((item) => item.id === id);

  if (!contact) {
    return <Navigate to="/wealth-management/clients" replace />;
  }

  const shareDocumentToChat = async (document: ClientDocument) => {
    setShareError(null);
    setSharingDocumentName(document.name);

    try {
      const messagePayload = await buildDocumentSharePayload(document, contact.name);

      debugDocumentShare('Sending document share request to Symphony client chat.', {
        documentName: document.name,
        streamId,
        messagePayload,
      });

      await sendMessageToChat(messagePayload);
      setShareError(null);
    } catch (cause) {
      const message = cause instanceof Error
        ? cause.message
        : `Unable to share ${document.name} to chat.`;
      console.error('[WealthClientShare] Unable to share document to Symphony chat.', {
        documentName: document.name,
        message,
        streamId,
      });
      setShareError(message);
    } finally {
      setSharingDocumentName(null);
    }
  };



  return (
    <div className="flex h-full flex-col overflow-hidden rounded-t-2xl bg-[#eef3f8]">
      <div className="border-b border-slate-200 bg-[linear-gradient(90deg,#07285f_0%,#0f3d83_100%)] px-5 py-3 text-white">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12 border-2 border-white/30 shadow-[0_4px_12px_rgba(7,40,95,0.35)]">
              {contact.avatarUrl ? <AvatarImage src={contact.avatarUrl} alt={contact.name} className="object-[center_20%]" /> : null}
              <AvatarFallback className="bg-white text-[16px] font-bold text-[#07285f]">
                {getInitials(contact.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-[22px] font-bold tracking-tight text-white">{contact.name}</h1>
                <span className={`inline-flex items-center rounded-md border border-white/20 px-3 py-1 text-[11px] font-semibold ${SEGMENT_STYLES[contact.segment] ?? 'bg-white/10 text-white'}`}>
                  {contact.segment}
                </span>
                <Badge variant="success" className="border border-white/20 bg-emerald-500/20 px-3 py-1 text-[11px] text-emerald-200">
                  {contact.portfolioReturn}
                </Badge>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-4 text-[13px] text-sky-100">
                <span>{contact.role}</span>
                <span>{contact.householdLabel}</span>
              </div>
            </div>
          </div>


        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto bg-[#eef3f8] p-4">
        <div className="flex min-h-full gap-4">
          <div className="min-w-0 flex-1">
            <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
              <ProfileTile title="Portfolio Summary" bodyClassName="px-4 py-4">
                <div className="grid gap-4 lg:grid-cols-[180px_1fr]">
                    <div className="h-[180px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={contact.portfolioAllocation} dataKey="value" innerRadius={42} outerRadius={72} stroke="none">
                            {contact.portfolioAllocation.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: number) => [`${value}%`, 'Allocation']} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="space-y-3">
                      {contact.portfolioAllocation.map((allocation) => (
                        <div key={allocation.name} className="flex items-center justify-between gap-3 text-[13px]">
                          <div className="flex items-center gap-2">
                            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: allocation.color }} />
                            <span className="text-slate-600">{allocation.name}</span>
                          </div>
                          <span className="font-semibold text-slate-900">{allocation.value}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
              </ProfileTile>

              <ProfileTile title="Client KPI Summary" bodyClassName="px-4 py-4">
                <div className="grid gap-4 sm:grid-cols-2">
                    {contact.profileSummary.map((item, index) => {
                      const colors = [
                        'bg-[#07285f] text-white',
                        'bg-[#123b7a] text-white',
                        'bg-[#1e5bb5] text-white',
                        'bg-[#2a6fc9] text-white',
                      ];
                      return (
                      <div key={item.label} className={`rounded-2xl px-4 py-3 ${colors[index % colors.length]}`}>
                        <div className="text-[11px] uppercase tracking-[0.16em] opacity-70">{item.label}</div>
                        <div className="mt-2 text-[18px] font-semibold">{item.value}</div>
                      </div>
                      );
                    })}
                </div>
              </ProfileTile>
            </div>

            <div className="mt-4 grid gap-4 xl:grid-cols-[1.18fr_0.82fr]">
              <ProfileTile title="Recent Activity" bodyClassName="px-4 py-4">
                      <div className="space-y-4">
                        {contact.recentActivity.map((activity, index) => (
                          <div key={activity.id} className="relative flex gap-4">
                            <div className="relative flex w-7 flex-shrink-0 justify-center">
                              <div className={`flex h-7 w-7 items-center justify-center rounded-full text-white ${ACTIVITY_STYLES[activity.tone].ring}`}>
                                {(() => {
                                  const Icon = ACTIVITY_STYLES[activity.tone].icon;
                                  return <Icon className="h-3.5 w-3.5" />;
                                })()}
                              </div>
                              {index < contact.recentActivity.length - 1 && <div className="absolute top-8 h-[48px] w-px bg-slate-200" />}
                            </div>
                            <div className="flex-1 pb-2">
                              <div className="flex items-center justify-between gap-3">
                                <div className="min-w-0">
                                  <div className="text-[16px] font-semibold text-slate-900">{activity.title}</div>
                                  <span className={`mt-2 inline-flex rounded-md px-2 py-0.5 text-[10px] font-semibold ${ACTIVITY_STYLES[activity.tone].badge}`}>
                                    {ACTIVITY_STYLES[activity.tone].label}
                                  </span>
                                </div>
                                <div className="shrink-0 text-[12px] text-slate-400">{activity.timestamp}</div>
                              </div>
                              <div className="mt-1 text-[13px] leading-6 text-slate-500">{activity.description}</div>
                            </div>
                          </div>
                        ))}
                      </div>
              </ProfileTile>

              <div className="flex flex-col gap-4">
                <ProfileTile title="Relationships" bodyClassName="px-3 py-3">
                        {contact.relationships.map((relationship) => (
                          <div key={`${relationship.name}-${relationship.entity}`} className="flex items-center gap-3 rounded-xl border border-slate-200 px-3 py-2">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sky-700">
                              <Handshake className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                              <div className="text-[13px] font-semibold leading-5 text-slate-900">{relationship.name}</div>
                              <div className="text-[11px] leading-5 text-slate-500">
                                {relationship.role} · {relationship.entity}
                              </div>
                            </div>
                          </div>
                        ))}
                </ProfileTile>

                <ProfileTile title="Documents" bodyClassName="px-3 py-3">
                        {contact.documents.map((document) => (
                          <div key={document.name} className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                              <FileText className="h-4 w-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="truncate text-[13px] font-semibold leading-5 text-slate-900">{document.name}</div>
                              <div className="text-[11px] leading-5 text-slate-500">
                                {document.type} · Updated {document.updatedAt}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => shareDocumentToChat(document)}
                              disabled={sharingDocumentName === document.name}
                              className="inline-flex shrink-0 items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[11px] font-medium text-slate-600 transition-colors hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
                              aria-label={`Share ${document.name} to chat`}
                            >
                              <Send className="h-3.5 w-3.5" />
                              {sharingDocumentName === document.name ? 'Sharing...' : 'Share'}
                            </button>
                          </div>
                        ))}
                        {shareError ? <div className="rounded-lg bg-rose-50 px-3 py-2 text-[11px] text-rose-600">{shareError}</div> : null}
                </ProfileTile>
              </div>
            </div>
          </div>

          <div className="flex w-[35%] min-w-[470px] flex-shrink-0 flex-col gap-4">
            <ProfileTile
              title="Embedded Communication Panel"
              className="min-h-0 flex flex-1 flex-col"
              bodyClassName="relative min-h-[520px] flex-1 overflow-hidden bg-[#fbfcfe]"
              headerContent={(
                <Badge variant="success" className="border border-white/20 bg-emerald-500/20 px-3 py-1 text-[11px] text-emerald-100">
                  <ShieldCheck className="mr-1 h-3.5 w-3.5" />
                  Secure
                </Badge>
              )}
            >
              {(isLoading || !isChatReady) && !chatError ? <ChatLoadingOverlay /> : null}
              {chatError ? (
                <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#fbfcfe] p-6 text-center text-[13px] leading-6 text-rose-600">
                  {chatError}
                </div>
              ) : null}
              <div
                data-testid="wealth-client-chat-slot"
                className={`${slotClassName} h-full w-full transition-opacity duration-200`}
                style={{ opacity: isChatReady && !isLoading && !chatError ? 1 : 0, pointerEvents: isChatReady && !isLoading && !chatError ? 'auto' : 'none' }}
                aria-hidden={Boolean(chatError) || isLoading || !isChatReady}
              />
            </ProfileTile>

            <ProfileTile title="Contact Details" bodyClassName="px-4 py-4">
                  <div className="grid gap-2 rounded-[10px] border border-slate-200 bg-slate-50 p-4 text-[13px] text-slate-600">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-slate-400" />
                      {contact.email}
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-slate-400" />
                      {contact.phone}
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-slate-400" />
                      {contact.geography}
                    </div>
                  </div>
            </ProfileTile>
          </div>
        </div>
      </div>
    </div>
  );
}
