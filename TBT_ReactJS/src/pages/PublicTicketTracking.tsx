import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { selectCurrentUser, setUser, fetchMe } from '@/redux/user/userSlice';
import { removeToken } from '@/lib/jwt';
import { LogOut } from 'lucide-react';
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import usePusherClient from '@/hooks/usePusherClient';
import {
  getPublicTicketTracking,
  PublicTicketTrackingData,
} from '@/services/ticketService';
import { formatRichTextToPlain } from '@/utils/textUtils';
import {
  Clock,
  MessageSquare,
  Ticket as TicketIcon,
  Copy,
  Check,
  AlertCircle,
  Loader2,
  FileText,
  RefreshCw,
  Search,
  Calendar,
  Tag,
  ShieldCheck,
  ExternalLink,
  Paperclip,
  Activity,
  ArrowRight,
} from 'lucide-react';

const PublicTicketTracking: React.FC = () => {
  const { hash: urlHash } = useParams<{ hash?: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector(selectCurrentUser);
  const { subscribe } = usePusherClient({ autoConnect: true });

  const [searchInput, setSearchInput] = useState<string>(urlHash || '');
  const [activeQuery, setActiveQuery] = useState<string | null>(urlHash || null);
  const [ticketData, setTicketData] = useState<PublicTicketTrackingData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  useEffect(() => {
    if (!currentUser) {
      dispatch(fetchMe());
    }
  }, [dispatch, currentUser]);


  // Fetch ticket details by query (ticket ID, number, or hash)
  const fetchTicket = useCallback(async (queryToFetch: string, isSilent = false) => {
    if (!queryToFetch || !queryToFetch.trim()) return;

    const cleanedQuery = queryToFetch.trim();
    if (!isSilent) setLoading(true);
    else setRefreshing(true);
    setErrorMessage(null);
    setHasSearched(true);

    try {
      const data = await getPublicTicketTracking(cleanedQuery);
      setTicketData(data);
      setActiveQuery(cleanedQuery);
    } catch (err: any) {
      console.error('Failed to load public ticket:', err);
      setTicketData(null);
      const msg = err?.response?.data?.message || `No ticket found matching "${cleanedQuery}". Please check the ticket number and try again.`;
      setErrorMessage(msg);
      if (!isSilent) {
        toast.error('Ticket not found', { toastId: 'ticket-not-found' });
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Sync search when URL param changes
  useEffect(() => {
    if (urlHash) {
      setSearchInput(urlHash);
      fetchTicket(urlHash);
    }
  }, [urlHash, fetchTicket]);

  // Handle Search Form Submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchInput || !searchInput.trim()) {
      toast.warning('Please enter a ticket number or ID');
      return;
    }
    const clean = searchInput.trim();
    if (clean === urlHash) {
      fetchTicket(clean);
    } else {
      navigate(`/track-ticket/${encodeURIComponent(clean)}`);
    }
  };

  // Subscribe to real-time Pusher updates for current ticket
  useEffect(() => {
    const targetHash = ticketData?.hash || activeQuery;
    if (!targetHash) return;

    let unbindHashUpdated: (() => void) | null = null;
    let unbindHashComment: (() => void) | null = null;
    let unbindIdUpdated: (() => void) | null = null;
    let unbindIdComment: (() => void) | null = null;

    const setupPusher = async () => {
      const channelByHash = `public-ticket-${targetHash}`;
      unbindHashUpdated = await subscribe(channelByHash, 'ticket.updated', () => {
        console.log('[Pusher] Ticket updated event received for hash:', targetHash);
        fetchTicket(targetHash, true);
      });
      unbindHashComment = await subscribe(channelByHash, 'ticket.comment.public', () => {
        console.log('[Pusher] Ticket comment event received for hash:', targetHash);
        fetchTicket(targetHash, true);
      });

      if (ticketData?.id) {
        const channelById = `public-ticket-${ticketData.id}`;
        unbindIdUpdated = await subscribe(channelById, 'ticket.updated', () => {
          console.log('[Pusher] Ticket updated event received for id:', ticketData.id);
          fetchTicket(targetHash, true);
        });
        unbindIdComment = await subscribe(channelById, 'ticket.comment.public', () => {
          console.log('[Pusher] Ticket comment event received for id:', ticketData.id);
          fetchTicket(targetHash, true);
        });
      }
    };

    setupPusher();

    return () => {
      if (unbindHashUpdated) unbindHashUpdated();
      if (unbindHashComment) unbindHashComment();
      if (unbindIdUpdated) unbindIdUpdated();
      if (unbindIdComment) unbindIdComment();
    };
  }, [ticketData?.hash, ticketData?.id, activeQuery, fetchTicket, subscribe]);

  // Handle Copy Tracking Link
  
  const handleLogout = () => {
    removeToken();
    dispatch(setUser(null));
    navigate('/login');
  };

  
  // Helper to extract a human-readable attachment filename
  const getAttachmentFileName = (res: any, index: number) => {
    if (res?.originalName) return res.originalName;
    if (res?.name) return res.name;
    const rawPath = res?.file_path || res?.url || '';
    if (rawPath) {
      try {
        const withoutQuery = rawPath.split('?')[0];
        const parts = withoutQuery.split('/');
        const lastPart = parts[parts.length - 1] || '';
        const uuidMatch = lastPart.match(/[0-9a-fA-F-]{36}-(.+)$/);
        if (uuidMatch && uuidMatch[1]) {
          return decodeURIComponent(uuidMatch[1].replace(/_/g, ' '));
        }
        if (lastPart) {
          return decodeURIComponent(lastPart.replace(/_/g, ' '));
        }
      } catch {
        // fallback
      }
    }
    return `Attachment #${index + 1}`;
  };

  // Helper to resolve a valid external URL
  const getAttachmentUrl = (res: any) => {
    if (res?.url && (res.url.startsWith('http://') || res.url.startsWith('https://'))) {
      return res.url;
    }
    if (res?.file_url && (res.file_url.startsWith('http://') || res.file_url.startsWith('https://'))) {
      return res.file_url;
    }
    if (res?.file_path && (res.file_path.startsWith('http://') || res.file_path.startsWith('https://'))) {
      return res.file_path;
    }
    // Fallback to backend public download route
    if (ticketData?.id && res?.id) {
      return `/api/v1/tickets/public/${ticketData.hash || ticketData.id}/resources/${res.id}/download`;
    }
    return '#';
  };

  // Explicit handler to open in a new tab/window
  const handleOpenAttachment = (e: React.MouseEvent, res: any) => {
    const targetUrl = getAttachmentUrl(res);
    if (!targetUrl || targetUrl === '#') {
      e.preventDefault();
      toast.error('Unable to resolve attachment file URL');
      return;
    }
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
    e.preventDefault();
  };

  const handleCopyLink = () => {
    const currentUrl = window.location.href;
    navigator.clipboard.writeText(currentUrl);
    setCopied(true);
    toast.success('Tracking link copied to clipboard!');
    setTimeout(() => setCopied(false), 2500);
  };

  // Helper for Status Badge styling matching user screenshots
  const getStatusBadge = (status: string) => {
    const s = (status || '').toLowerCase();
    if (s === 'closed') {
      return {
        bg: 'bg-[#ff8a7a] text-slate-950 font-semibold border-none', // Coral Red
        label: 'Closed',
      };
    }
    if (s === 'resolved') {
      return {
        bg: 'bg-[#4ade80] text-slate-950 font-semibold border-none', // Vibrant Green
        label: 'Resolved',
      };
    }
    if (s === 'in progress' || s === 'in_progress') {
      return {
        bg: 'bg-[#fcd34d] text-slate-950 font-semibold border-none', // Warm Yellow
        label: 'In Progress',
      };
    }
    if (s === 'assigned' || s === 'open') {
      return {
        bg: 'bg-[#60a5fa] text-slate-950 font-semibold border-none', // Medium Blue
        label: status || 'Assigned',
      };
    }
    return {
      bg: 'bg-[#60a5fa] text-slate-950 font-semibold border-none', // Medium Blue
      label: status || 'Submitted',
    };
  };

  // Helper for Priority Badge styling matching app pill style
  const getPriorityBadge = (priority: string) => {
    const p = (priority || '').toLowerCase();
    if (p === 'critical' || p === 'urgent') {
      return {
        bg: 'bg-rose-100 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800',
        dot: 'bg-rose-500',
        label: priority || 'Critical',
      };
    }
    if (p === 'high') {
      return {
        bg: 'bg-amber-100 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800',
        dot: 'bg-amber-500',
        label: 'High',
      };
    }
    if (p === 'medium') {
      return {
        bg: 'bg-sky-100 dark:bg-sky-950/70 text-sky-600 dark:text-sky-400 border-sky-200 dark:border-sky-800',
        dot: 'bg-sky-500',
        label: 'Medium',
      };
    }
    return {
      bg: 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
      dot: 'bg-emerald-500',
      label: priority || 'Low',
    };
  };

  // Format date nicely for ticket meta
  const formatDate = (dateVal?: string | number) => {
    if (!dateVal) return 'N/A';
    try {
      const d = new Date(dateVal);
      return d.toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return String(dateVal);
    }
  };

  // Helper to format date in PST (Pacific Standard Time) for ticket comments
  const formatPSTDate = (dateVal?: string | number) => {
    if (!dateVal) return '';
    try {
      const raw = typeof dateVal === 'string' ? dateVal.trim() : dateVal;
      if (typeof raw === 'string' && raw.endsWith('PST')) {
        return raw;
      }
      const d = new Date(raw);
      if (isNaN(d.getTime())) return String(dateVal);
      return (
        d.toLocaleString('en-US', {
          timeZone: 'America/Los_Angeles',
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
        }) + ' PST'
      );
    } catch {
      return String(dateVal);
    }
  };

  // Filter out any internal comments
  const publicComments = (ticketData?.comments || []).filter(
    (c) => (c.type || '').toLowerCase() !== 'internal'
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-300 overflow-x-hidden">
      {/* Main Content Area (No Header or Footer) */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-8 sm:py-14">
        {/* Agent Account Indicator & Sign Out */}
        {currentUser && (
          <div className="mb-6 rounded-2xl bg-slate-900 text-slate-100 p-3.5 px-5 flex flex-wrap items-center justify-between gap-3 shadow-md border border-slate-800">
            <div className="flex items-center space-x-3">
              <div className="h-9 w-9 rounded-xl bg-sky-500/20 text-sky-400 font-bold flex items-center justify-center border border-sky-500/30">
                {currentUser.name ? currentUser.name[0].toUpperCase() : 'A'}
              </div>
              <div>
                <p className="text-[11px] text-slate-400 font-medium">Logged in as Agent</p>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  {currentUser.name || currentUser.email}
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 font-semibold border border-sky-500/30">
                    Ticket Tracker
                  </span>
                </h3>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-bold transition-colors border border-rose-500/20"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        )}


        {/* SEARCH INTERFACE BOX */}
        <div className="mb-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl p-5 sm:p-8">
          <div className="text-center max-w-xl mx-auto mb-6">
            <div className="h-12 w-12 rounded-2xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center mx-auto mb-3 shadow-inner">
              <TicketIcon className="h-6 w-6" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Ticket Status Lookup
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Enter your ticket number or reference code to view live status updates.
            </p>
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} className="max-w-xl mx-auto flex flex-col sm:flex-row items-center gap-2.5">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Enter Ticket Number or ID (e.g. 19, TBT-19)..."
                className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all font-medium"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white text-sm font-bold shadow-lg shadow-sky-500/25 flex items-center justify-center space-x-2 transition-all shrink-0 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Searching...</span>
                </>
              ) : (
                <>
                  <span>Track Ticket</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Initial Empty State (before search) */}
        {!hasSearched && !loading && !ticketData && !errorMessage && (
          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 p-10 text-center shadow-sm max-w-xl mx-auto">
            <Search className="h-10 w-10 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
            <h3 className="text-sm sm:text-base font-semibold text-slate-700 dark:text-slate-300">
              Ready to Search
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              Please enter your ticket number in the search bar above to view your support progress.
            </p>
          </div>
        )}

        {/* Loading Spinner */}
        {loading && (
          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-10 sm:p-14 text-center shadow-lg">
            <Loader2 className="h-10 w-10 text-sky-500 animate-spin mx-auto mb-3" />
            <h3 className="text-sm sm:text-base font-semibold text-slate-800 dark:text-slate-200">
              Locating Ticket Details...
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Fetching ticket status and real-time updates.
            </p>
          </div>
        )}

        {/* Invalid or Not Found Indicator */}
        {!loading && errorMessage && (
          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/50 p-7 sm:p-10 text-center shadow-xl max-w-2xl mx-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="h-14 w-14 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto mb-4 border border-rose-500/20">
              <AlertCircle className="h-8 w-8" />
            </div>
            <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100">
              Invalid Ticket Number or Ticket Not Found
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto mt-2 leading-relaxed">
              {errorMessage}
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button
                onClick={() => {
                  setErrorMessage(null);
                  setSearchInput('');
                }}
                className="px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold hover:opacity-90 transition-opacity"
              >
                Clear Search
              </button>
            </div>
          </div>
        )}

        {/* Loaded Ticket Content */}
        {!loading && ticketData && (
          <div className="space-y-6 animate-in fade-in duration-300">

            {/* Live Indicator & Quick Actions Bar */}
            <div className="rounded-2xl bg-gradient-to-r from-sky-500/10 via-blue-500/10 to-indigo-500/10 border border-sky-500/20 p-3.5 sm:p-4 flex flex-wrap items-center justify-between gap-3 shadow-sm">
              <div className="flex items-center space-x-3">
                <div className="h-8 w-8 rounded-xl bg-sky-500/20 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                  <Activity className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    Live Ticket View
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      Real-time Connected
                    </span>
                  </h4>
                </div>
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                <button
                  onClick={() => activeQuery && fetchTicket(activeQuery, true)}
                  disabled={refreshing}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 transition-colors border border-slate-200 dark:border-slate-700 shadow-sm"
                  title="Refresh status"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin text-sky-500' : ''}`} />
                  <span>Refresh</span>
                </button>

                <button
                  onClick={handleCopyLink}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 shadow-sm shadow-sky-500/20 transition-all"
                >
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy Link'}</span>
                </button>
              </div>
            </div>

            {/* Header & Status Card */}
            <div className="rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-md sm:shadow-xl p-4 sm:p-7 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600"></div>

              {/* Heading & Status + Priority Badges */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-5 border-b border-slate-100 dark:border-slate-800">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1 flex-wrap">
                    <TicketIcon className="h-4 w-4 text-sky-500 shrink-0" />
                    <span>Ticket #{ticketData.id}</span>
                    <span className="text-slate-300 dark:text-slate-700">•</span>
                    <span className="font-mono text-[11px] text-slate-400 break-all">{ticketData.hash}</span>
                  </div>
                  {/* TICKET HEADING */}
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mt-1 leading-snug break-words">
                    {formatRichTextToPlain(ticketData.title) || ticketData.title}
                  </h1>
                </div>

                {/* TICKET STATUS BADGE & PRIORITY BADGE */}
                <div className="shrink-0 flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
                  {/* Status Badge */}
                  {(() => {
                    const badge = getStatusBadge(ticketData.status);
                    return (
                      <div className={`inline-flex items-center justify-center px-3.5 py-1.5 sm:px-4 sm:py-1.5 rounded-lg text-xs sm:text-sm font-semibold shadow-sm transition-all ${badge.bg}`}>
                        <span>{badge.label}</span>
                      </div>
                    );
                  })()}

                  {/* Priority Badge */}
                  {ticketData.priority && (() => {
                    const prio = getPriorityBadge(ticketData.priority);
                    return (
                      <div className={`inline-flex items-center space-x-1.5 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full text-xs font-semibold border shadow-xs ${prio.bg}`}>
                        <span className={`h-2 w-2 rounded-full ${prio.dot}`}></span>
                        <span>{prio.label}</span>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Mobile Responsive Status Lifecycle */}
              <div className="pt-5">
                <div className="text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 mb-3 uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="h-3.5 w-3.5 text-sky-500" />
                  <span>Ticket Status Progress</span>
                </div>
                {(() => {
                  const s = (ticketData.status || '').toLowerCase();
                  let currentStep = 1;
                  if (s === 'assigned' || s === 'open') currentStep = 2;
                  if (s === 'in progress' || s === 'in_progress') currentStep = 3;
                  if (s === 'resolved') currentStep = 4;
                  if (s === 'closed') currentStep = 5;

                  const steps = [
                    {
                      step: 1,
                      label: 'Submitted',
                      activeBg: 'bg-sky-500 text-white shadow-md shadow-sky-500/20',
                      currentCardBg: 'bg-sky-500/10 border-sky-500/30',
                      labelColor: 'text-sky-600 dark:text-sky-400',
                    },
                    {
                      step: 2,
                      label: 'Assigned',
                      activeBg: 'bg-sky-500 text-white shadow-md shadow-sky-500/20',
                      currentCardBg: 'bg-sky-500/10 border-sky-500/30',
                      labelColor: 'text-sky-600 dark:text-sky-400',
                    },
                    {
                      step: 3,
                      label: 'In Progress',
                      activeBg: 'bg-sky-500 text-white shadow-md shadow-sky-500/20',
                      currentCardBg: 'bg-sky-500/10 border-sky-500/30',
                      labelColor: 'text-sky-600 dark:text-sky-400',
                    },
                    {
                      step: 4,
                      label: 'Resolved',
                      activeBg: 'bg-sky-500 text-white shadow-md shadow-sky-500/20',
                      currentCardBg: 'bg-sky-500/10 border-sky-500/30',
                      labelColor: 'text-sky-600 dark:text-sky-400',
                    },
                    {
                      step: 5,
                      label: 'Closed',
                      activeBg: 'bg-sky-500 text-white shadow-md shadow-sky-500/20',
                      currentCardBg: 'bg-sky-500/10 border-sky-500/30',
                      labelColor: 'text-sky-600 dark:text-sky-400',
                    },
                  ];

                  return (
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
                      {steps.map((st) => {
                        const isDone = st.step <= currentStep;
                        const isCurrent = st.step === currentStep;

                        return (
                          <div
                            key={st.step}
                            className={`flex flex-row sm:flex-col items-center p-2.5 sm:p-3 rounded-xl transition-all ${
                              isCurrent
                                ? `${st.currentCardBg} border shadow-sm`
                                : 'bg-slate-50 sm:bg-transparent dark:bg-slate-800/40 sm:dark:bg-transparent border border-transparent'
                            }`}
                          >
                            <div
                              className={`h-7 w-7 sm:h-9 sm:w-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 transition-all ${
                                isDone
                                  ? `${st.activeBg} shadow-md`
                                  : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                              }`}
                            >
                              {isDone ? <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 stroke-[3]" /> : st.step}
                            </div>
                            <span
                              className={`ml-2.5 sm:ml-0 text-xs font-medium sm:mt-2 leading-tight ${
                                isDone ? `${st.labelColor} font-bold` : 'text-slate-400'
                              }`}
                            >
                              {st.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>

              {/* Meta info footer */}
              <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 gap-2">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="flex items-center space-x-1">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    <span>Created: {formatDate(ticketData.createdAt)}</span>
                  </span>
                  {ticketData.priority && (
                    <span className="flex items-center space-x-1">
                      <Tag className="h-3.5 w-3.5 text-slate-400" />
                      <span>Priority: </span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {ticketData.priority}
                      </span>
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-1 text-slate-400">
                  <Clock className="h-3.5 w-3.5" />
                  <span>Updated: {formatDate(ticketData.updatedAt)}</span>
                </div>
              </div>
            </div>

            {/* TICKET BODY CARD */}
            <div className="rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-md sm:shadow-xl p-4 sm:p-7">
              <h2 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider mb-3 flex items-center gap-2">
                <FileText className="h-4 w-4 text-sky-500" />
                <span>Ticket Body</span>
              </h2>

              <div className="rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800/80 p-4 sm:p-5">
                <p className="text-sm sm:text-base text-slate-700 dark:text-slate-200 whitespace-pre-line leading-relaxed font-normal break-words">
                  {formatRichTextToPlain(ticketData.body) || 'No message content provided.'}
                </p>

                {ticketData.serialNo && (
                  <div className="mt-3.5 inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg bg-slate-200/60 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">
                    <span>Serial No:</span>
                    <span className="font-bold">{ticketData.serialNo}</span>
                  </div>
                )}
              </div>

              {/* Attachment Links */}
              {ticketData.resources && ticketData.resources.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Paperclip className="h-3.5 w-3.5 text-sky-500" />
                    <span>Attachments ({ticketData.resources.length})</span>
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {ticketData.resources.map((res: any, idx: number) => {
                      const fileName = getAttachmentFileName(res, idx);
                      const targetUrl = getAttachmentUrl(res);
                      return (
                        <a
                          key={idx}
                          href={targetUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => handleOpenAttachment(e, res)}
                          className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-sky-50 dark:bg-slate-800 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:text-sky-600 transition-all shadow-xs cursor-pointer group"
                          title="Open attachment in new tab"
                        >
                          <ExternalLink className="h-3.5 w-3.5 text-sky-500 group-hover:scale-110 transition-transform shrink-0" />
                          <span className="truncate max-w-[220px]">
                            {fileName}
                          </span>
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* COMMENTS SECTION (With PST Created Times, No Internal Comments) */}
            <div className="rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-md sm:shadow-xl p-4 sm:p-7">
              <div className="flex items-center justify-between mb-5 pb-3.5 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center space-x-2">
                  <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 text-sky-500 shrink-0" />
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                    Comments & Updates
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    {publicComments.length}
                  </span>
                </div>
              </div>

              {/* Public Comments List */}
              {publicComments.length > 0 ? (
                <div className="space-y-3.5">
                  {publicComments.map((c) => {
                    const isAgent = !!c.fromUser || c.type === 'agent_to_customer';
                    const commentCreatedAt = c.createdAt || (c as any).created_at;

                    return (
                      <div
                        key={c.id}
                        className={`rounded-2xl p-4 sm:p-5 border transition-all ${
                          isAgent
                            ? 'bg-sky-500/5 dark:bg-sky-950/20 border-sky-500/20'
                            : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200/80 dark:border-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="flex items-center space-x-2 min-w-0">
                            <div
                              className={`h-6 w-6 sm:h-7 sm:w-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${
                                isAgent
                                  ? 'bg-sky-600 text-white'
                                  : 'bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                              }`}
                            >
                              {isAgent ? 'A' : 'C'}
                            </div>
                            <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                              {c.fromUser?.name || (isAgent ? 'Support Agent' : 'Customer')}
                            </span>
                            {isAgent && (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-900/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 shrink-0">
                                Support Team
                              </span>
                            )}
                          </div>

                          {commentCreatedAt && (
                            <span className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1 shrink-0 ml-auto">
                              <Clock className="h-3 w-3 text-slate-400" />
                              <span>{formatPSTDate(commentCreatedAt)}</span>
                            </span>
                          )}
                        </div>

                        {/* COMMENT BODY */}
                        <p className="text-xs sm:text-base text-slate-700 dark:text-slate-200 whitespace-pre-line leading-relaxed pl-8 sm:pl-9 break-words">
                          {formatRichTextToPlain(c.comment) || c.comment}
                        </p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-10 text-center rounded-2xl bg-slate-50 dark:bg-slate-950/40 border border-dashed border-slate-200 dark:border-slate-800">
                  <MessageSquare className="h-7 w-7 text-slate-400 mx-auto mb-2 opacity-60" />
                  <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400">
                    No comments added yet.
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Updates posted by our support team will appear here automatically.
                  </p>
                </div>
              )}

              {/* View Only Bottom Notice */}
              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
                <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1.5 flex-wrap">
                  <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span>
                    This page is view-only. To reply to this ticket, respond directly to your SMS text message.
                  </span>
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default PublicTicketTracking;
