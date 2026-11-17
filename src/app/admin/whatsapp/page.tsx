'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  MessageSquare,
  Shield,
  ShieldCheck,
  AlertTriangle,
  AlertCircle,
  Send,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  Copy,
  Key,
  Globe,
  Settings,
  FileText,
  Clock,
  Plus,
  Edit,
  Users,
  Search,
  Filter,
  Trash2,
  Play,
  RotateCcw,
  Sparkles,
  Phone,
  Mail,
  Building,
  UserCheck,
  X,
  ChevronRight,
  ChevronLeft,
  TrendingUp,
  Flame,
  FileSpreadsheet,
  BookOpen,
  HelpCircle,
  Lock,
  Zap,
  Calendar,
  IndianRupee,
  Wallet,
  CreditCard,
  Receipt,
  Tag,
  ChevronDown,
  Check,
  CheckSquare,
  History,
  Smartphone,
  Radio,
  ArrowUpRight,
  ArrowDownLeft,
  Headphones,
  Workflow,
  Smile,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Image as ImageIcon,
  Upload,
  GitBranch,
  CornerDownLeft,
} from 'lucide-react';
import { ManageVisibilityModal } from '@/components/visibility/ManageVisibilityModal';
import { TemplateRouterManager } from './TemplateRouterManager';

const QUICK_REPLIES = [
  { shortcut: '/pricing', label: 'Modular Pricing Quote', text: 'Thank you for inquiring about our pricing! Our modular software packages are tailored to your scale. Could you share your key business requirements so we can send an exact quote?' },
  { shortcut: '/demo', label: 'Live Product Demo Invitation', text: 'We would be delighted to schedule a live product demo for you! Would tomorrow at 11:30 AM or 3:30 PM work best for a 15-minute screen share?' },
  { shortcut: '/company', label: 'Company Overview & Creds', text: 'TechInPedia is a leading enterprise software development and digital transformation agency delivering web, mobile, CRM, and cloud solutions.' },
  { shortcut: '/bank', label: 'Official Bank Details', text: 'Our official bank details for invoice settlement:\nBeneficiary: TechInPedia Solutions Pvt Ltd\nBank: HDFC Bank\nAccount No: 50200084920192\nIFSC: HDFC0001234\nUPI: techinpedia@hdfcbank' },
  { shortcut: '/followup', label: 'Gentle Project Follow-up', text: 'Hi! Just following up on our previous discussion regarding your project requirements. Let us know if you have any questions or need any adjustments to the proposal.' },
  { shortcut: '/meeting', label: 'Google Meet / Call Invite', text: "Let's connect on a Google Meet / Zoom call to discuss this in detail. What time works best for you today?" },
];

const POPULAR_EMOJIS = [
  '😊', '👍', '❤️', '🙏', '🔥', '🎉', '🚀', '👏', '💯', '🤝',
  '😂', '✅', '📞', '💼', '⚡', '👋', '🌟', '🎯', '✨', '👌'
];

const EMOJI_CATEGORIES = [
  { name: 'Smileys & Emotion', emojis: ['😀', '😃', '😄', '😁', '😊', '😇', '🙂', '😉', '😌', '😍', '🥰', '😘', '😋', '😎', '🥳', '🤩'] },
  { name: 'Gestures & People', emojis: ['👍', '👎', '👌', '✌️', '🤞', '🤝', '👏', '🙌', '👐', '🙏', '💪', '👋', '✋', '🤙', '✊', '👊'] },
  { name: 'Work & Business', emojis: ['💼', '📊', '📈', '📉', '📁', '📅', '📝', '✉️', '📧', '📞', '💻', '💡', '⏰', '🚀', '🎯', '💰'] },
  { name: 'Status & Symbols', emojis: ['✅', '❌', '⚠️', '🔥', '⭐', '🌟', '✨', '💯', '🎉', '⚡', '🏆', '🥇', '🔔', '📌', '🔒', '🔑'] },
];

const LEAD_STAGES = [
  { key: 'NEW', label: 'New Lead', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { key: 'CONTACTED', label: 'Contacted', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { key: 'QUALIFIED', label: 'Requirement / Qualified', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  { key: 'PROPOSAL_SENT', label: 'Proposal Sent', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  { key: 'NEGOTIATION', label: 'Negotiation', color: 'bg-orange-50 text-orange-700 border-orange-200' },
  { key: 'WON', label: 'Won / Converted', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { key: 'LOST', label: 'Lost / Closed', color: 'bg-rose-50 text-rose-700 border-rose-200' },
];

function LiveTimer({ startTime }: { startTime: string }) {
  const [duration, setDuration] = useState('');

  useEffect(() => {
    const updateTimer = () => {
      const start = new Date(startTime).getTime();
      const now = new Date().getTime();
      const diffMs = now - start;
      if (diffMs < 0) {
        setDuration('00:00:00');
        return;
      }
      const hrs = Math.floor(diffMs / 3600000);
      const mins = Math.floor((diffMs % 3600000) / 60000);
      const secs = Math.floor((diffMs % 60000) / 1000);
      setDuration(
        `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
      );
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  return <span className="font-mono text-amber-600 dark:text-amber-500 ml-1"> • Waiting: {duration}</span>;
}

function WhatsAppAdminPage() {
  const searchParams = useSearchParams();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>(searchParams.get('companyId') || '');
  const [availableCompanies, setAvailableCompanies] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'status' | 'guide' | 'inbox' | 'templates' | 'router' | 'campaigns' | 'suppression' | 'logs' | 'test'
  >((searchParams.get('tab') as any) || 'dashboard');

  const isInboxOnly = currentUser?.companyRole === 'INBOX_ONLY' || currentUser?.companyRole === 'AGENT';
  const isTenant = !!currentUser?.isTenant;
  const effectiveCompanyId = isTenant && currentUser?.companyId ? currentUser.companyId : selectedCompanyId;

  const getCompanyQuery = (cid = effectiveCompanyId) => {
    return cid && cid !== 'master' ? `companyId=${encodeURIComponent(cid)}` : '';
  };

  const appendCompanyQuery = (endpoint: string, cid = effectiveCompanyId) => {
    const q = getCompanyQuery(cid);
    if (!q) return endpoint;
    return endpoint.includes('?') ? `${endpoint}&${q}` : `${endpoint}?${q}`;
  };

  const handleCompanyChange = (newCompanyId: string) => {
    setSelectedCompanyId(newCompanyId);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (newCompanyId && newCompanyId !== 'master') {
        url.searchParams.set('companyId', newCompanyId);
      } else {
        url.searchParams.delete('companyId');
      }
      window.history.replaceState({}, '', url.toString());
    }
  };

  useEffect(() => {
    const cId = searchParams.get('companyId');
    if (cId !== null && cId !== selectedCompanyId) {
      setSelectedCompanyId(cId || '');
    }
  }, [searchParams]);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();
        if (data.authenticated && data.user) {
          setCurrentUser(data.user);
          if (data.user.companyRole === 'INBOX_ONLY' || data.user.companyRole === 'AGENT') {
            setActiveTab('inbox');
          }
        }
      } catch (err) {
        console.error('Error fetching auth session:', err);
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    if (isInboxOnly) {
      setActiveTab('inbox');
      return;
    }
    const tab = searchParams.get('tab');
    if (tab && ['dashboard', 'status', 'guide', 'inbox', 'templates', 'campaigns', 'suppression', 'logs', 'test'].includes(tab)) {
      setActiveTab(tab as any);
    } else {
      setActiveTab('dashboard');
    }
  }, [searchParams, isInboxOnly]);

  // Connection & Health State
  const [connData, setConnData] = useState<any | null>(null);
  const [recentMessages, setRecentMessages] = useState<any[]>([]);
  const [billing, setBilling] = useState<any>(null);
  const [showRechargeModal, setShowRechargeModal] = useState(false);
  const [rechargeAmount, setRechargeAmount] = useState('');
  const [rechargeNotes, setRechargeNotes] = useState('');
  const [rechargeActionType, setRechargeActionType] = useState<'ADD' | 'SET'>('ADD');
  const [savingRecharge, setSavingRecharge] = useState(false);
  const [loadingConn, setLoadingConn] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copyStatus, setCopyStatus] = useState<{ [key: string]: boolean }>({});

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopyStatus((prev) => ({ ...prev, [key]: true }));
    setTimeout(() => {
      setCopyStatus((prev) => ({ ...prev, [key]: false }));
    }, 2000);
  };

  // Connection Form State
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [formPhoneId, setFormPhoneId] = useState('');
  const [formWabaId, setFormWabaId] = useState('');
  const [formAppId, setFormAppId] = useState('');
  const [formToken, setFormToken] = useState('');
  const [formSecret, setFormSecret] = useState('');
  const [formVerifyToken, setFormVerifyToken] = useState('techinpedia_verify_token_2026');
  const [savingConn, setSavingConn] = useState(false);
  const [tokenExpiredNotice, setTokenExpiredNotice] = useState<string | null>(null);

  // Team Inbox State
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [visibilityModalOpen, setVisibilityModalOpen] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [crmContext, setCrmContext] = useState<any | null>(null);
  const [is24hActive, setIs24hActive] = useState(false);
  const [inboxSearch, setInboxSearch] = useState('');
  const [inboxFolder, setInboxFolder] = useState<string>('ALL');
  const [folderMetrics, setFolderMetrics] = useState<any>({
    ALL: 0,
    MY_CHATS: 0,
    UNASSIGNED: 0,
    UNREAD: 0,
    WAITING_CUSTOMER: 0,
    HIGH_PRIORITY: 0,
    CLOSED: 0,
  });
  const [isInternalNoteMode, setIsInternalNoteMode] = useState(false);
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedEmojiCategory, setSelectedEmojiCategory] = useState(0);
  const [teamUsers, setTeamUsers] = useState<any[]>([]);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [mobileInboxView, setMobileInboxView] = useState<'list' | 'chat' | 'details'>('list');

  // AI Co-Pilot State
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [copilotLoading, setCopilotLoading] = useState(false);
  const [copilotSuggestions, setCopilotSuggestions] = useState<string[]>([]);
  const [copilotSummary, setCopilotSummary] = useState<any | null>(null);

  // Live Auto-Sync Refs & Sound Feedback
  const selectedConvIdRef = useRef<string | null>(selectedConvId);
  const inboxFolderRef = useRef<string>(inboxFolder);
  const inboxSearchRef = useRef<string>(inboxSearch);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const prevMessagesCountRef = useRef<number>(0);
  const audioContextRef = useRef<any>(null);

  useEffect(() => {
    selectedConvIdRef.current = selectedConvId;
  }, [selectedConvId]);

  useEffect(() => {
    inboxFolderRef.current = inboxFolder;
  }, [inboxFolder]);

  useEffect(() => {
    inboxSearchRef.current = inboxSearch;
  }, [inboxSearch]);

  const playIncomingDing = () => {
    try {
      if (typeof window === 'undefined') return;
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioCtx();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5 note
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12); // A5 note
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch {
      // Audio autoplay policy or device sound restriction
    }
  };

  // In-Chat Template Dispatch State
  const [showSendTemplateModal, setShowSendTemplateModal] = useState(false);
  const [inboxSelectedTemplate, setInboxSelectedTemplate] = useState('');
  const [inboxTemplateParams, setInboxTemplateParams] = useState<Record<string, string>>({});
  const [sendingInboxTemplate, setSendingInboxTemplate] = useState(false);
  const [inboxTemplateError, setInboxTemplateError] = useState<string | null>(null);

  // Quick Follow-up Modal & In-Chat Lead Actions State
  const [showFollowUpModal, setShowFollowUpModal] = useState(false);
  const [followUpTitle, setFollowUpTitle] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpTime, setFollowUpTime] = useState('11:00');
  const [followUpType, setFollowUpType] = useState('CALL');
  const [followUpNotes, setFollowUpNotes] = useState('');
  const [savingFollowUp, setSavingFollowUp] = useState(false);
  const [updatingLeadStage, setUpdatingLeadStage] = useState(false);
  const [estimatedValueInput, setEstimatedValueInput] = useState('');
  const [savingValue, setSavingValue] = useState(false);

  // New Chat State
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [newChatPhone, setNewChatPhone] = useState('');
  const [newChatName, setNewChatName] = useState('');
  const [newChatMessage, setNewChatMessage] = useState('Hello! How can we assist you today?');
  const [newChatTemplate, setNewChatTemplate] = useState('');
  const [startingChat, setStartingChat] = useState(false);
  const [newChatError, setNewChatError] = useState<string | null>(null);

  const openNewChat = (prefilledPhone = '') => {
    const rawVal = prefilledPhone || inboxSearch;
    const phoneToUse = rawVal && /^[0-9+ \-]+$/.test(rawVal.trim()) ? rawVal.trim() : '';
    setNewChatPhone(phoneToUse);
    setNewChatName('');
    setNewChatMessage('Hello! How can we assist you today?');
    setNewChatTemplate('');
    setNewChatError(null);
    setShowNewChatModal(true);
  };

  // Templates State
  const [templates, setTemplates] = useState<any[]>([]);
  const [syncingTemplates, setSyncingTemplates] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any | null>(null);
  const [templateSearch, setTemplateSearch] = useState('');
  const [templateFilterCategory, setTemplateFilterCategory] = useState('ALL');
  const [templateFilterStatus, setTemplateFilterStatus] = useState('ALL');
  const [deletingTemplateId, setDeletingTemplateId] = useState<string | null>(null);
  const [wabaId, setWabaId] = useState<string | null>(null);
  const [connDetails, setConnDetails] = useState<any | null>(null);

  // Create & Edit Template State
  const [showCreateTemplateModal, setShowCreateTemplateModal] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [tplName, setTplName] = useState('');
  const [tplCategory, setTplCategory] = useState<'MARKETING' | 'UTILITY' | 'AUTHENTICATION'>('MARKETING');
  const [tplLanguage, setTplLanguage] = useState('en_US');
  const [tplHeaderType, setTplHeaderType] = useState<'NONE' | 'TEXT' | 'IMAGE'>('NONE');
  const [tplHeaderText, setTplHeaderText] = useState('');
  const [tplHeaderImageUrl, setTplHeaderImageUrl] = useState('');
  const [tplHeaderImageFile, setTplHeaderImageFile] = useState<File | null>(null);
  const [tplHeaderImagePreview, setTplHeaderImagePreview] = useState('');
  const [tplBodyText, setTplBodyText] = useState('');
  const [showTplEmojiPicker, setShowTplEmojiPicker] = useState(false);
  const [selectedTplEmojiCategory, setSelectedTplEmojiCategory] = useState(0);
  const tplBodyRef = useRef<HTMLTextAreaElement>(null);
  const [tplSampleValues, setTplSampleValues] = useState<Record<string, string>>({});
  const [tplFooterText, setTplFooterText] = useState('');
  const [tplButtons, setTplButtons] = useState<
    Array<{ type: 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER'; text: string; url?: string; phoneNumber?: string }>
  >([]);
  const [creatingTemplate, setCreatingTemplate] = useState(false);
  const [createTemplateError, setCreateTemplateError] = useState<string | null>(null);
  const [createTemplateSuccess, setCreateTemplateSuccess] = useState<string | null>(null);

  // Campaigns State
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [campName, setCampName] = useState('');
  const [campDesc, setCampDesc] = useState('');
  const [campTemplateId, setCampTemplateId] = useState('');
  const [campAudienceSource, setCampAudienceSource] = useState('CRM_LEADS');
  const [campAudiencePreview, setCampAudiencePreview] = useState<any | null>(null);
  const [previewingAudience, setPreviewingAudience] = useState(false);
  const [launchingCamp, setLaunchingCamp] = useState(false);

  // Suppression State
  const [suppressions, setSuppressions] = useState<any[]>([]);
  const [suppressPhone, setSuppressPhone] = useState('');
  const [suppressReason, setSuppressReason] = useState('USER_REQUEST');
  const [addingSuppress, setAddingSuppress] = useState(false);

  // Webhook Logs State
  const [logs, setLogs] = useState<any[]>([]);
  const [retryingLogId, setRetryingLogId] = useState<string | null>(null);

  // Test Console State
  const [testPhone, setTestPhone] = useState('');
  const [testMessage, setTestMessage] = useState('Hello! This is an official test message from TechInPedia WhatsApp Business Platform.');
  const [sendingTest, setSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<any | null>(null);

  // 1. Fetch Connection Info
  const fetchConnection = async (targetCid = effectiveCompanyId) => {
    setLoadingConn(true);
    try {
      const res = await fetch(appendCompanyQuery('/api/whatsapp/connection', targetCid));
      const data = await res.json();
      setConnData(data);
      if (data.availableCompanies) {
        setAvailableCompanies(data.availableCompanies);
      }
      if (data.recentMessages) {
        setRecentMessages(data.recentMessages);
      }
      if (data.billing) {
        setBilling(data.billing);
      }
      if (data.connection) {
        setFormPhoneId(data.connection.phoneNumberId || '');
        setFormWabaId(data.connection.wabaId || '');
        setFormAppId(data.connection.appId || '');
        setFormVerifyToken(data.connection.verifyToken || 'techinpedia_verify_token_2026');
      }
      if (data.companyName) {
        setTestMessage(`Hello! This is an official test message from ${data.companyName} WhatsApp Business Platform.`);
      }
      if (data.companyRole === 'INBOX_ONLY' || data.companyRole === 'AGENT') {
        setActiveTab('inbox');
      }
    } catch (err) {
      console.error('Error fetching connection:', err);
    } finally {
      setLoadingConn(false);
    }
  };

  // Handle Save / Update Meta Recharge
  const handleSaveRecharge = async (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(rechargeAmount);
    if (isNaN(num) || num <= 0) {
      alert('Please enter a valid amount');
      return;
    }
    setSavingRecharge(true);
    try {
      const res = await fetch(appendCompanyQuery('/api/whatsapp/connection', effectiveCompanyId), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: rechargeActionType === 'ADD' ? 'RECORD_RECHARGE' : 'SET_BALANCE',
          amount: rechargeAmount,
          balance: rechargeAmount,
          notes: rechargeNotes || 'Meta Wallet Prepaid Recharge',
          companyId: effectiveCompanyId || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setShowRechargeModal(false);
        setRechargeAmount('');
        setRechargeNotes('');
        await fetchConnection(effectiveCompanyId);
      } else {
        alert(data.error || 'Failed to update recharge');
      }
    } catch (err: any) {
      alert(err.message || 'Error updating recharge');
    } finally {
      setSavingRecharge(false);
    }
  };

  // 2. Fetch Conversations
  const fetchConversations = async (targetCid = effectiveCompanyId) => {
    try {
      const url = new URL('/api/whatsapp/conversations', window.location.origin);
      if (inboxFolderRef.current) url.searchParams.set('folder', inboxFolderRef.current);
      if (inboxSearchRef.current) url.searchParams.set('search', inboxSearchRef.current);
      if (targetCid && targetCid !== 'master') url.searchParams.set('companyId', targetCid);

      const res = await fetch(url.toString());
      const data = await res.json();
      if (data.conversations) {
        setConversations(data.conversations);
        if (data.folderMetrics) {
          setFolderMetrics(data.folderMetrics);
        }
        if (data.conversations.length > 0 && !selectedConvIdRef.current) {
          setSelectedConvId(data.conversations[0].id);
        }
      }
    } catch (err) {
      console.error('Error fetching conversations:', err);
    }
  };

  const [acceptingConversation, setAcceptingConversation] = useState(false);

  const handleAcceptConversation = async (convId: string) => {
    setAcceptingConversation(true);
    try {
      const res = await fetch(`/api/whatsapp/conversations/${convId}/accept`, {
        method: 'POST',
      });
      const data = await res.json();
      if (res.ok) {
        fetchConversations(effectiveCompanyId);
        // Refresh local state to avoid delay
        setConversations(prev => prev.map(c => 
          c.id === convId ? { ...c, assignmentAcceptedAt: new Date().toISOString() } : c
        ));
      } else {
        alert(data.error || 'Failed to accept conversation');
      }
    } catch (err) {
      console.error('Error accepting conversation:', err);
    } finally {
      setAcceptingConversation(false);
    }
  };

  // Fetch Team Users for Assignment
  const fetchTeamUsers = async (targetCid = effectiveCompanyId) => {
    try {
      const url = appendCompanyQuery('/api/users', targetCid);
      const res = await fetch(url);
      const data = await res.json();
      if (data.users) {
        setTeamUsers(data.users);
      }
    } catch (e) {
      console.error('Error fetching users:', e);
    }
  };

  // 3. Fetch Messages for Selected Conversation (Supports silent background auto-sync)
  const fetchMessages = async (convId: string, isSilent = false, targetCid = effectiveCompanyId) => {
    if (!isSilent) setLoadingMessages(true);
    try {
      const url = appendCompanyQuery(`/api/whatsapp/messages?conversationId=${convId}`, targetCid);
      const res = await fetch(url);
      const data = await res.json();
      if (data.messages) {
        // Play notification chime if new inbound message arrives during active conversation
        if (isSilent && data.messages.length > prevMessagesCountRef.current) {
          const lastMsg = data.messages[data.messages.length - 1];
          if (lastMsg && lastMsg.direction === 'INBOUND') {
            playIncomingDing();
          }
        }
        prevMessagesCountRef.current = data.messages.length;
        setMessages(data.messages);
        if (data.templates && data.templates.length > 0) {
          setTemplates(data.templates);
        }
        setCrmContext(data.crmContext);
        setIs24hActive(data.is24hWindowActive);
        if (data.crmContext?.lead?.estimatedValue !== undefined && data.crmContext?.lead?.estimatedValue !== null) {
          setEstimatedValueInput(String(data.crmContext.lead.estimatedValue));
        } else {
          setEstimatedValueInput('');
        }
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      if (!isSilent) setLoadingMessages(false);
    }
  };

  // 4. Fetch Templates
  const fetchTemplates = async (forceSync = false, targetCid = effectiveCompanyId) => {
    try {
      let endpoint = forceSync ? '/api/whatsapp/templates?sync=true' : '/api/whatsapp/templates';
      endpoint = appendCompanyQuery(endpoint, targetCid);
      const res = await fetch(endpoint);
      const data = await res.json();
      if (data.templates) setTemplates(data.templates);
      if (data.wabaId) setWabaId(data.wabaId);
      if (data.connection) setConnDetails(data.connection);
    } catch (err) {
      console.error('Error fetching templates:', err);
    }
  };

  // 5. Fetch Campaigns
  const fetchCampaigns = async (targetCid = effectiveCompanyId) => {
    try {
      const res = await fetch(appendCompanyQuery('/api/whatsapp/campaigns', targetCid));
      const data = await res.json();
      if (data.campaigns) setCampaigns(data.campaigns);
    } catch (err) {
      console.error('Error fetching campaigns:', err);
    }
  };

  // 6. Fetch Suppressions
  const fetchSuppressions = async (targetCid = effectiveCompanyId) => {
    try {
      const res = await fetch(appendCompanyQuery('/api/whatsapp/suppression', targetCid));
      const data = await res.json();
      if (data.suppressions) setSuppressions(data.suppressions);
    } catch (err) {
      console.error('Error fetching suppressions:', err);
    }
  };

  // 7. Fetch Webhook Logs
  const fetchLogs = async (targetCid = effectiveCompanyId) => {
    try {
      const res = await fetch(appendCompanyQuery('/api/whatsapp/webhook/logs', targetCid));
      const data = await res.json();
      if (data.logs) setLogs(data.logs);
    } catch (err) {
      console.error('Error fetching logs:', err);
    }
  };

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId as any);
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('tab', tabId);
      if (effectiveCompanyId && effectiveCompanyId !== 'master') {
        url.searchParams.set('companyId', effectiveCompanyId);
      } else {
        url.searchParams.delete('companyId');
      }
      window.history.replaceState({}, '', url.toString());
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam && ['dashboard', 'status', 'guide', 'inbox', 'templates', 'router', 'campaigns', 'suppression', 'logs', 'test'].includes(tabParam)) {
        setActiveTab(tabParam as any);
      }
    }
    fetchConnection(effectiveCompanyId);
    fetchTemplates(false, effectiveCompanyId);
    fetchCampaigns(effectiveCompanyId);
    fetchSuppressions(effectiveCompanyId);
    fetchTeamUsers(effectiveCompanyId);
    fetchConversations(effectiveCompanyId);
  }, [effectiveCompanyId]);

  useEffect(() => {
    if (activeTab === 'inbox') {
      fetchConversations(effectiveCompanyId);
    } else if (activeTab === 'logs') {
      fetchLogs(effectiveCompanyId);
    }
  }, [activeTab, inboxFolder, inboxSearch, effectiveCompanyId]);

  useEffect(() => {
    if (selectedConvId) {
      prevMessagesCountRef.current = 0;
      fetchMessages(selectedConvId, false);
    }
  }, [selectedConvId]);

  // Auto-scroll to bottom of chat when new messages arrive or load
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length]);

  // Dynamic Real-time Polling for Inbox (3-second cadence when active, 8-second backgrounded)
  useEffect(() => {
    if (activeTab !== 'inbox') return;

    let timer: NodeJS.Timeout | null = null;
    let isPolling = false;

    const poll = async () => {
      if (isPolling) return;
      isPolling = true;
      try {
        await fetchConversations(effectiveCompanyId);
        const currentId = selectedConvIdRef.current;
        if (currentId) {
          await fetchMessages(currentId, true, effectiveCompanyId);
        }
      } finally {
        isPolling = false;
      }
    };

    const startTimer = () => {
      if (timer) clearInterval(timer);
      const delay = typeof document !== 'undefined' && document.hidden ? 8000 : 3000;
      timer = setInterval(() => {
        poll();
      }, delay);
    };

    const handleVisibilityChange = () => {
      if (typeof document !== 'undefined' && !document.hidden) {
        poll();
      }
      startTimer();
    };

    startTimer();
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange);
      window.addEventListener('focus', handleVisibilityChange);
    }

    return () => {
      if (timer) clearInterval(timer);
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('focus', handleVisibilityChange);
      }
    };
  }, [activeTab, effectiveCompanyId]);

  // Handle Refresh Status
  const handleRefreshStatus = async () => {
    setRefreshing(true);
    try {
      const res = await fetch('/api/whatsapp/connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'REFRESH', companyId: effectiveCompanyId || undefined }),
      });
      const data = await res.json();
      if (data.success) {
        fetchConnection(effectiveCompanyId);
      } else {
        alert(data.error || 'Failed to refresh status');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setRefreshing(false);
    }
  };

  // Handle Start New Conversation
  const handleStartNewChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChatPhone.trim()) return;
    setStartingChat(true);
    setNewChatError(null);

    try {
      const res = await fetch('/api/whatsapp/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: newChatPhone.trim(),
          customerName: newChatName.trim() || undefined,
          message: newChatMessage.trim(),
          templateName: newChatTemplate || undefined,
          companyId: effectiveCompanyId || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setNewChatError(data.error || data.hint || 'Failed to start conversation');
        return;
      }

      setShowNewChatModal(false);
      setNewChatPhone('');
      setNewChatName('');
      setNewChatMessage('');
      setInboxSearch('');
      await fetchConversations(effectiveCompanyId);
      if (data.conversation?.id) {
        setSelectedConvId(data.conversation.id);
        setMobileInboxView('chat');
      }
    } catch (err: any) {
      setNewChatError(err.message || 'Network error occurred');
    } finally {
      setStartingChat(false);
    }
  };

  // Handle Save Connection
  const handleSaveConnection = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingConn(true);
    try {
      const res = await fetch('/api/whatsapp/connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'SAVE_AND_CONNECT',
          phoneNumberId: formPhoneId,
          wabaId: formWabaId,
          appId: formAppId,
          accessToken: formToken,
          appSecret: formSecret,
          verifyToken: formVerifyToken,
          companyId: effectiveCompanyId || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setShowConfigModal(false);
        setFormToken('');
        setFormSecret('');
        fetchConnection(effectiveCompanyId);
        if (createTemplateError) {
          setCreateTemplateError(null);
          setCreateTemplateSuccess('Meta Access Token updated successfully! You can now click "Submit Template" below to send your template to Meta.');
        }
      } else {
        alert(data.error || 'Failed to connect WhatsApp');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSavingConn(false);
    }
  };

  // Handle Send Reply in Inbox (WhatsApp Outbound or Team Internal Note)
  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConvId || !replyText.trim()) return;

    setSendingReply(true);
    try {
      const res = await fetch('/api/whatsapp/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: selectedConvId,
          type: 'text',
          text: replyText.trim(),
          isInternalNote: isInternalNoteMode,
          companyId: effectiveCompanyId || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setReplyText('');
        setShowQuickReplies(false);
        fetchMessages(selectedConvId, false, effectiveCompanyId);
        fetchConversations(effectiveCompanyId);
      } else {
        const errorMsg = data.error || 'Failed to dispatch message';
        const hintMsg = data.hint ? `\n\n💡 Tip: ${data.hint}` : '';
        alert(errorMsg + hintMsg);
        if (data.requiresTemplate) {
          setShowSendTemplateModal(true);
        }
      }
    } catch (err: any) {
      alert(err.message || 'Network error occurred');
    } finally {
      setSendingReply(false);
    }
  };

  // Handle Send Approved Template directly from Inbox
  const handleSendInboxTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConvId || !inboxSelectedTemplate) return;
    setSendingInboxTemplate(true);
    setInboxTemplateError(null);
    try {
      const tpl = templates.find((t) => t.name === inboxSelectedTemplate);
      const varIndices: string[] = tpl?.variablesJson
        ? (typeof tpl.variablesJson === 'string' ? JSON.parse(tpl.variablesJson) : tpl.variablesJson).map(String)
        : [];
      const params = varIndices.map((idx: string) => inboxTemplateParams[idx] || '');

      const res = await fetch('/api/whatsapp/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: selectedConvId,
          type: 'template',
          templateName: inboxSelectedTemplate,
          language: tpl?.language || 'en_US',
          templateParams: params,
          companyId: effectiveCompanyId || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setShowSendTemplateModal(false);
        setInboxSelectedTemplate('');
        setInboxTemplateParams({});
        fetchMessages(selectedConvId, false, effectiveCompanyId);
        fetchConversations(effectiveCompanyId);
      } else {
        const hint = data.hint ? `\n\n💡 Tip: ${data.hint}` : '';
        setInboxTemplateError((data.error || 'Failed to send template message') + hint);
      }
    } catch (err: any) {
      setInboxTemplateError(err.message || 'Network error occurred');
    } finally {
      setSendingInboxTemplate(false);
    }
  };

  // Handle Update Lead Stage directly from Chat
  const handleUpdateLeadStage = async (newStage: string) => {
    if (!selectedConvId) return;
    setUpdatingLeadStage(true);
    try {
      const res = await fetch('/api/whatsapp/conversations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedConvId,
          leadStage: newStage,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        fetchMessages(selectedConvId);
        fetchConversations();
      }
    } catch (err: any) {
      alert('Failed to update stage: ' + err.message);
    } finally {
      setUpdatingLeadStage(false);
    }
  };

  // Handle Update Lead Priority directly from Chat
  const handleUpdateLeadPriority = async (newPriority: string) => {
    if (!selectedConvId) return;
    try {
      const res = await fetch('/api/whatsapp/conversations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedConvId,
          priority: newPriority,
        }),
      });
      if (res.ok) {
        fetchMessages(selectedConvId);
        fetchConversations();
      }
    } catch (err: any) {
      alert('Failed to update priority');
    }
  };

  // Handle Update Lead Temperature
  const handleUpdateLeadTemperature = async (newTemp: string) => {
    if (!selectedConvId) return;
    try {
      const res = await fetch('/api/whatsapp/conversations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedConvId,
          temperature: newTemp,
        }),
      });
      if (res.ok) {
        fetchMessages(selectedConvId);
      }
    } catch (err: any) {
      alert('Failed to update temperature');
    }
  };

  // Handle Save Estimated Value
  const handleSaveEstimatedValue = async () => {
    if (!selectedConvId) return;
    setSavingValue(true);
    try {
      const res = await fetch('/api/whatsapp/conversations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedConvId,
          estimatedValue: estimatedValueInput,
        }),
      });
      if (res.ok) {
        fetchMessages(selectedConvId);
      }
    } catch (err) {
      alert('Failed to save estimated value');
    } finally {
      setSavingValue(false);
    }
  };

  // Handle Schedule Follow-up from Right Pane
  const handleScheduleFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!crmContext?.lead?.id || !followUpDate) return;
    setSavingFollowUp(true);
    try {
      const scheduledDateTime = new Date(`${followUpDate}T${followUpTime || '11:00'}:00`);
      const res = await fetch('/api/crm/followups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: followUpTitle.trim() || `Follow-up with ${crmContext?.lead?.name || 'Client'}`,
          type: followUpType,
          scheduledAt: scheduledDateTime.toISOString(),
          enquiryId: crmContext.lead.id,
          notes: followUpNotes.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setShowFollowUpModal(false);
        setFollowUpTitle('');
        setFollowUpNotes('');
        fetchMessages(selectedConvId!);
        fetchConversations();
      } else {
        alert(data.error || 'Failed to schedule follow-up');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSavingFollowUp(false);
    }
  };

  // Handle Complete Follow-up
  const handleCompleteFollowUp = async (followUpId: string) => {
    try {
      const res = await fetch(`/api/crm/followups/${followUpId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'COMPLETED',
          outcome: 'Completed via WhatsApp Shared Inbox',
        }),
      });
      if (res.ok) {
        fetchMessages(selectedConvId!);
        fetchConversations();
      }
    } catch (err) {
      alert('Failed to complete follow-up');
    }
  };

  const handleCopilotSuggest = async () => {
    if (!selectedConvId) return;
    setCopilotLoading(true);
    try {
      const res = await fetch('/api/ai/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'SUGGEST_REPLY', conversationId: selectedConvId }),
      });
      const data = await res.json();
      if (data.success) {
        setCopilotSuggestions(data.suggestions || []);
      }
    } catch (err) {
      console.error('Co-Pilot suggest error:', err);
    } finally {
      setCopilotLoading(false);
    }
  };

  const handleCopilotRewrite = async (style: string) => {
    if (!replyText.trim()) return;
    setCopilotLoading(true);
    try {
      const res = await fetch('/api/ai/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'REWRITE_DRAFT', draftText: replyText, style }),
      });
      const data = await res.json();
      if (data.success && data.rewrittenText) {
        setReplyText(data.rewrittenText);
      }
    } catch (err) {
      console.error('Co-Pilot rewrite error:', err);
    } finally {
      setCopilotLoading(false);
    }
  };

  const handleCopilotSummarize = async () => {
    if (!selectedConvId) return;
    setCopilotLoading(true);
    try {
      const res = await fetch('/api/ai/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'SUMMARIZE_CONVERSATION', conversationId: selectedConvId }),
      });
      const data = await res.json();
      if (data.success) {
        setCopilotSummary(data);
      }
    } catch (err) {
      console.error('Co-Pilot summarize error:', err);
    } finally {
      setCopilotLoading(false);
    }
  };

  // Handle Template Sync
  const handleSyncTemplates = async () => {
    setSyncingTemplates(true);
    try {
      const res = await fetch('/api/whatsapp/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'SYNC', companyId: effectiveCompanyId || undefined }),
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message || 'Templates synced successfully!');
        fetchTemplates(false, effectiveCompanyId);
      } else {
        if (data.error && (data.error.includes('access token') || data.error.includes('Session has expired') || data.error.includes('190') || data.error.includes('OAuthException'))) {
          setTokenExpiredNotice(data.error);
        } else {
          alert(data.error || 'Failed to sync templates');
        }
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSyncingTemplates(false);
    }
  };

  // Open Edit Template Modal Handler
  const handleOpenEditModal = (tpl: any) => {
    setEditingTemplateId(tpl.id);
    setTplName(tpl.name || '');
    setTplCategory((tpl.category as any) || 'MARKETING');
    setTplLanguage(tpl.language || 'en_US');
    setTplHeaderType((tpl.headerType as any) || 'NONE');
    setTplHeaderText(tpl.headerType === 'TEXT' ? (tpl.headerContent || '') : '');
    setTplHeaderImageUrl(tpl.headerType === 'IMAGE' ? (tpl.headerContent || '') : '');
    setTplHeaderImagePreview(tpl.headerType === 'IMAGE' ? (tpl.headerContent || '') : '');
    setTplHeaderImageFile(null);
    setTplBodyText(tpl.bodyText || '');
    setTplFooterText(tpl.footerText || '');

    try {
      const btns = tpl.buttonsConfig ? JSON.parse(tpl.buttonsConfig) : [];
      setTplButtons(Array.isArray(btns) ? btns : []);
    } catch {
      setTplButtons([]);
    }

    try {
      const vars = tpl.variablesJson ? JSON.parse(tpl.variablesJson) : [];
      const sampleObj: Record<string, string> = {};
      if (Array.isArray(vars)) {
        vars.forEach((v: string) => {
          sampleObj[v] = `Sample ${v}`;
        });
      }
      setTplSampleValues(sampleObj);
    } catch {
      setTplSampleValues({});
    }

    setCreateTemplateError(null);
    setCreateTemplateSuccess(null);
    setShowTplEmojiPicker(false);
    setShowCreateTemplateModal(true);
  };

  // Create or Update Template Handler
  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingTemplate(true);
    setCreateTemplateError(null);
    setCreateTemplateSuccess(null);

    const varMatches = tplBodyText.match(/\{\{([0-9]+)\}\}/g) || [];
    const varIndices = Array.from(new Set(varMatches.map((m) => m.replace(/[^0-9]/g, '')))).sort(
      (a, b) => Number(a) - Number(b)
    );

    const bodySampleValues = varIndices.map((idx) => tplSampleValues[idx] || `Sample_${idx}`);

    try {
      let headerMediaUrl = tplHeaderImageUrl ? tplHeaderImageUrl.trim() : undefined;
      let headerMediaBase64: string | undefined = undefined;

      if (tplHeaderType === 'IMAGE') {
        if (tplHeaderImageFile) {
          try {
            const formData = new FormData();
            formData.append('file', tplHeaderImageFile);
            const mediaRes = await fetch('/api/media', {
              method: 'POST',
              body: formData,
            });
            const mediaData = await mediaRes.json();
            if (mediaData?.media?.url) {
              headerMediaUrl = mediaData.media.url;
            }
          } catch (mErr) {
            console.warn('Local media upload fallback:', mErr);
          }
          if (tplHeaderImagePreview && tplHeaderImagePreview.startsWith('data:')) {
            headerMediaBase64 = tplHeaderImagePreview;
          }
        } else if (!headerMediaUrl && tplHeaderImagePreview) {
          headerMediaBase64 = tplHeaderImagePreview;
        }

        if (!headerMediaUrl && !headerMediaBase64 && !editingTemplateId) {
          setCreateTemplateError('Please choose a sample image (file upload or URL) for the Image header.');
          setCreatingTemplate(false);
          return;
        }
      }

      if (editingTemplateId) {
        // UPDATE existing template
        const res = await fetch('/api/whatsapp/templates', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingTemplateId,
            companyId: effectiveCompanyId || undefined,
            category: tplCategory,
            headerType: tplHeaderType,
            headerText: tplHeaderType === 'TEXT' ? tplHeaderText : undefined,
            headerMediaUrl,
            headerMediaBase64,
            bodyText: tplBodyText,
            bodySampleValues,
            footerText: tplFooterText || undefined,
            buttons: tplButtons.filter((b) => b.text.trim()),
          }),
        });

        const data = await res.json();
        if (!res.ok || data.error) {
          setCreateTemplateError(data.error || 'Failed to update template');
        } else {
          setCreateTemplateSuccess(
            data.message || `Template "${tplName}" was successfully updated!`
          );
          fetchTemplates(false, effectiveCompanyId);
          setTimeout(() => {
            setShowCreateTemplateModal(false);
            setEditingTemplateId(null);
            setTplHeaderImageUrl('');
            setTplHeaderImageFile(null);
            setTplHeaderImagePreview('');
          }, 2000);
        }
      } else {
        // CREATE new template
        const res = await fetch('/api/whatsapp/templates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'CREATE',
            companyId: effectiveCompanyId || undefined,
            name: tplName,
            category: tplCategory,
            language: tplLanguage,
            headerType: tplHeaderType,
            headerText: tplHeaderType === 'TEXT' ? tplHeaderText : undefined,
            headerMediaUrl,
            headerMediaBase64,
            bodyText: tplBodyText,
            bodySampleValues,
            footerText: tplFooterText || undefined,
            buttons: tplButtons.filter((b) => b.text.trim()),
          }),
        });

        const data = await res.json();
        if (!res.ok || data.error) {
          setCreateTemplateError(data.error || 'Failed to submit template to Meta');
        } else {
          setCreateTemplateSuccess(
            `Template "${tplName}" was successfully submitted to Meta! Status: ${data.template?.status || 'PENDING'}.`
          );
          fetchTemplates(false, effectiveCompanyId);
          setTimeout(() => {
            setShowCreateTemplateModal(false);
            setEditingTemplateId(null);
            setTplHeaderImageUrl('');
            setTplHeaderImageFile(null);
            setTplHeaderImagePreview('');
          }, 2200);
        }
      }
    } catch (err: any) {
      setCreateTemplateError(err.message || 'An error occurred while saving template.');
    } finally {
      setCreatingTemplate(false);
    }
  };

  // Delete Template Handler
  const handleDeleteTemplate = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete template "${name}" from Meta WABA and local database?`)) return;
    setDeletingTemplateId(id);
    try {
      const q = effectiveCompanyId ? `&companyId=${encodeURIComponent(effectiveCompanyId)}` : '';
      const res = await fetch(`/api/whatsapp/templates?id=${id}${q}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        fetchTemplates(false, effectiveCompanyId);
      } else {
        alert(data.error || 'Failed to delete template');
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setDeletingTemplateId(null);
    }
  };

  // Insert Next Variable Shortcut
  const handleInsertVariable = () => {
    const varMatches = tplBodyText.match(/\{\{([0-9]+)\}\}/g) || [];
    const indices = varMatches.map((m) => parseInt(m.replace(/[^0-9]/g, ''), 10));
    const nextIdx = indices.length > 0 ? Math.max(...indices) + 1 : 1;
    const varTag = `{{${nextIdx}}}`;
    const textarea = tplBodyRef.current;
    if (!textarea) {
      setTplBodyText((prev) => `${prev} ${varTag}`.slice(0, 1024));
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentVal = tplBodyText;
    const nextVal = currentVal.substring(0, start) + ` ${varTag} ` + currentVal.substring(end);
    setTplBodyText(nextVal.slice(0, 1024));
    setTimeout(() => {
      textarea.focus();
      const nextPos = start + varTag.length + 2;
      textarea.setSelectionRange(nextPos, nextPos);
    }, 10);
  };

  // Insert formatting (Bold, Italic, Underline, Strikethrough, Monospace)
  const handleInsertFormat = (prefix: string, suffix: string, defaultPlaceholder = 'text') => {
    const textarea = tplBodyRef.current;
    if (!textarea) {
      setTplBodyText((prev) => `${prev}${prefix}${defaultPlaceholder}${suffix}`.slice(0, 1024));
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentVal = tplBodyText;
    const selected = currentVal.substring(start, end);
    const textToWrap = selected || defaultPlaceholder;
    const replacement = `${prefix}${textToWrap}${suffix}`;
    const nextVal = currentVal.substring(0, start) + replacement + currentVal.substring(end);
    setTplBodyText(nextVal.slice(0, 1024));
    setTimeout(() => {
      textarea.focus();
      if (selected) {
        textarea.setSelectionRange(start, start + replacement.length);
      } else {
        textarea.setSelectionRange(start + prefix.length, start + prefix.length + defaultPlaceholder.length);
      }
    }, 10);
  };

  // Insert Emoji at cursor position
  const handleInsertEmoji = (emoji: string) => {
    const textarea = tplBodyRef.current;
    if (!textarea) {
      setTplBodyText((prev) => `${prev}${emoji}`.slice(0, 1024));
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentVal = tplBodyText;
    const nextVal = currentVal.substring(0, start) + emoji + currentVal.substring(end);
    setTplBodyText(nextVal.slice(0, 1024));
    setTimeout(() => {
      textarea.focus();
      const nextPos = start + emoji.length;
      textarea.setSelectionRange(nextPos, nextPos);
    }, 10);
  };

  // Helper: Format WhatsApp Markdown (*bold*, _italic_, ~strike~, ```code```, newlines)
  const renderFormattedWhatsAppText = (rawText: string | null | undefined, isLightOnDark = false) => {
    if (!rawText) return null;
    const regex = /(```[\s\S]*?```|\*[^*\n]+\*|_[^_\n]+_|~[^~\n]+~|\n)/g;
    const parts = rawText.split(regex);

    return parts.map((part, i) => {
      if (!part) return null;
      if (part === '\n') {
        return <br key={i} />;
      }
      if (part.startsWith('```') && part.endsWith('```') && part.length >= 6) {
        return (
          <code
            key={i}
            className={`font-mono px-1 py-0.5 rounded text-[11px] ${
              isLightOnDark ? 'bg-black/25 text-pink-200' : 'bg-slate-200 dark:bg-slate-700/80 text-pink-600 dark:text-pink-400'
            }`}
          >
            {part.slice(3, -3)}
          </code>
        );
      }
      if (part.startsWith('*') && part.endsWith('*') && part.length >= 2) {
        return (
          <strong key={i} className={`font-bold ${isLightOnDark ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
            {part.slice(1, -1)}
          </strong>
        );
      }
      if (part.startsWith('_') && part.endsWith('_') && part.length >= 2) {
        return (
          <em
            key={i}
            className={`italic underline underline-offset-2 ${
              isLightOnDark ? 'text-emerald-100 decoration-emerald-300/40' : 'decoration-slate-400 dark:decoration-slate-500'
            }`}
          >
            {part.slice(1, -1)}
          </em>
        );
      }
      if (part.startsWith('~') && part.endsWith('~') && part.length >= 2) {
        return (
          <del key={i} className={`line-through ${isLightOnDark ? 'opacity-75' : 'text-slate-400'}`}>
            {part.slice(1, -1)}
          </del>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  // Live WhatsApp Preview Substitution & Formatting (Bold, Italic, Underline, Strike, Code)
  const renderPreviewBody = () => {
    if (!tplBodyText) {
      return (
        <span className="text-slate-400 dark:text-slate-500 italic">
          Hello! Your template preview will appear here in real-time.
        </span>
      );
    }
    let preview = tplBodyText;
    const varMatches = tplBodyText.match(/\{\{([0-9]+)\}\}/g) || [];
    varMatches.forEach((match) => {
      const idx = match.replace(/[^0-9]/g, '');
      const sample = tplSampleValues[idx];
      if (sample && sample.trim()) {
        preview = preview.replaceAll(match, sample.trim());
      }
    });

    // Parse WhatsApp markdown tokens
    // Matches ```code```, *bold*, _italic_, ~strike~, or newlines
    const regex = /(```[\s\S]*?```|\*[^*\n]+\*|_[^_\n]+_|~[^~\n]+~|\n)/g;
    const parts = preview.split(regex);

    return parts.map((part, i) => {
      if (!part) return null;
      if (part === '\n') {
        return <br key={i} />;
      }
      if (part.startsWith('```') && part.endsWith('```') && part.length >= 6) {
        return (
          <code key={i} className="font-mono bg-slate-200 dark:bg-slate-700/80 px-1 py-0.5 rounded text-[11px] text-pink-600 dark:text-pink-400">
            {part.slice(3, -3)}
          </code>
        );
      }
      if (part.startsWith('*') && part.endsWith('*') && part.length >= 2) {
        return (
          <strong key={i} className="font-bold text-slate-900 dark:text-white">
            {part.slice(1, -1)}
          </strong>
        );
      }
      if (part.startsWith('_') && part.endsWith('_') && part.length >= 2) {
        return (
          <em key={i} className="italic underline underline-offset-2 decoration-slate-400 dark:decoration-slate-500">
            {part.slice(1, -1)}
          </em>
        );
      }
      if (part.startsWith('~') && part.endsWith('~') && part.length >= 2) {
        return (
          <del key={i} className="line-through text-slate-500 dark:text-slate-400">
            {part.slice(1, -1)}
          </del>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  const detectedTemplateVariables = (tplBodyText.match(/\{\{([0-9]+)\}\}/g) || [])
    .map((m: string) => m.replace(/[^0-9]/g, ''))
    .filter((val: string, idx: number, arr: string[]) => arr.indexOf(val) === idx)
    .sort((a: string, b: string) => Number(a) - Number(b));

  const targetCidForWebhook = effectiveCompanyId && effectiveCompanyId !== 'master' ? effectiveCompanyId : null;
  const webhookUrl = typeof window !== 'undefined'
    ? (targetCidForWebhook
        ? `${window.location.origin}/api/whatsapp/webhook?companyId=${targetCidForWebhook}`
        : `${window.location.origin}/api/whatsapp/webhook`)
    : (targetCidForWebhook
        ? `https://admin.techinpedia.com/api/whatsapp/webhook?companyId=${targetCidForWebhook}`
        : 'https://techinpedia.com/api/whatsapp/webhook');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              {isInboxOnly
                ? 'Shared Team Inbox'
                : (effectiveCompanyId && connData?.companyName
                    ? `${connData.companyName} WhatsApp`
                    : (isTenant && (currentUser?.companyName || connData?.companyName)
                        ? `${currentUser?.companyName || connData?.companyName} WhatsApp`
                        : 'Meta Cloud API Dashboard'))}
            </h1>
            {connData?.configured ? (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {effectiveCompanyId || isTenant ? `${connData?.companyName || 'COMPANY'} META API CONNECTED` : 'OFFICIAL CLOUD API CONNECTED'}
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30 flex items-center gap-1 border border-amber-200">
                <AlertTriangle className="w-3.5 h-3.5" />
                NOT CONFIGURED
              </span>
            )}
            {isTenant ? (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300 border border-violet-200 dark:border-violet-800">
                🏢 {currentUser?.companyRole || 'TENANT'}
              </span>
            ) : effectiveCompanyId ? (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                🏢 {connData?.companyName || 'SELECTED COMPANY'}
              </span>
            ) : null}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {isInboxOnly
              ? 'Real-time collaborative messaging workspace for sales and customer care agents'
              : (effectiveCompanyId
                  ? `WhatsApp Business Platform for ${connData?.companyName || 'selected company'} — Isolated API & Inbox`
                  : 'WhatsApp Business Platform — Real-time analytics, templates & management')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Company Switcher for Non-Tenant Admins */}
          {!isTenant && (
            <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-2 py-1 shadow-xs">
              <label htmlFor="company-switcher-select" className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap">
                🏢 Account:
              </label>
              <select
                id="company-switcher-select"
                value={selectedCompanyId || ''}
                onChange={(e) => handleCompanyChange(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-800 dark:text-slate-100 py-1 px-1.5 rounded-lg border-0 focus:ring-2 focus:ring-violet-500 focus:outline-none cursor-pointer max-w-[200px] sm:max-w-xs truncate"
              >
                <option value="">⭐ TechInPedia Master (Abdiel Aircon)</option>
                {availableCompanies.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.hasWhatsApp ? `(✅ ${c.businessPhone || 'Connected'})` : '(⚠️ Not Configured)'}
                  </option>
                ))}
              </select>
              {selectedCompanyId && selectedCompanyId !== 'master' && (
                <Link
                  href={`/admin/companies/${selectedCompanyId}`}
                  target="_blank"
                  className="px-2 py-1 text-[11px] font-semibold text-violet-600 dark:text-violet-400 hover:underline flex items-center gap-0.5 whitespace-nowrap"
                  title="Open Company Details"
                >
                  360 <ExternalLink className="w-3 h-3" />
                </Link>
              )}
            </div>
          )}

          <button
            onClick={handleRefreshStatus}
            disabled={refreshing}
            className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          {!isInboxOnly && (
            <button
              onClick={() => setShowConfigModal(true)}
              className="px-3.5 sm:px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Settings</span>
            </button>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1.5 sm:gap-2 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 pb-0.5 overflow-x-auto no-scrollbar -mx-3 px-3 sm:mx-0 sm:px-0">
        {[
          { id: 'dashboard', label: '📊 Meta Cloud API Dashboard', show: !isInboxOnly },
          { id: 'inbox', label: `📥 Shared Team Inbox (${conversations.filter((c) => c.status === 'OPEN').length})`, show: true },
          { id: 'status', label: '⚡ Connection & Health', show: !isInboxOnly },
          { id: 'templates', label: `📝 Templates (${templates.length})`, show: !isInboxOnly },
          { id: 'router', label: '🔀 Package & Purpose Router', show: !isInboxOnly },
          { id: 'campaigns', label: `📢 Campaigns (${campaigns.length})`, show: !isInboxOnly },
          { id: 'guide', label: '📖 API Setup Guide', show: !isInboxOnly },
          { id: 'suppression', label: `🛡️ Suppression & Opt-Out (${suppressions.length})`, show: !isInboxOnly && !isTenant },
          { id: 'logs', label: '📋 Webhook Logs', show: !isInboxOnly && !isTenant },
          { id: 'test', label: '🧪 Test Console', show: !isInboxOnly },
        ].filter((tab) => tab.show).map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`px-4 py-2.5 rounded-t-lg transition-colors whitespace-nowrap border-b-2 ${
              activeTab === tab.id
                ? 'border-violet-600 text-violet-700 bg-white dark:bg-slate-900 font-bold'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white hover:bg-slate-50 dark:bg-slate-950'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 0: META CLOUD API DASHBOARD */}
      {activeTab === 'dashboard' && (
        <div className="space-y-8">
          {/* Top Banner & Telemetry Header */}
          <div className="bg-gradient-to-br from-violet-900 via-indigo-950 to-slate-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-violet-500/20">
            <div className="absolute -right-16 -top-16 w-80 h-80 bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute right-1/3 -bottom-16 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold backdrop-blur-md">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  {connData?.configured
                    ? (effectiveCompanyId
                        ? `${connData?.connection?.verifiedName || connData?.companyName || 'Company'} Meta Cloud API Active`
                        : 'Meta Cloud API Platform v21.0 Active (Abdiel Aircon)')
                    : 'Meta Cloud API Not Configured'}
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  {effectiveCompanyId && connData?.companyName
                    ? `${connData.companyName} WhatsApp Dashboard`
                    : 'Meta Cloud API Dashboard'}
                </h2>
                <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
                  {connData?.configured && (connData?.connection?.displayPhoneNumber || connData?.connection?.businessPhoneNumber)
                    ? `Active WhatsApp: ${connData.connection.displayPhoneNumber || connData.connection.businessPhoneNumber} • Phone ID: ${connData.connection.phoneNumberId || 'Configured'}`
                    : (effectiveCompanyId
                        ? `Configure Meta Cloud API credentials to start sending WhatsApp messages for ${connData?.companyName || 'this company'}`
                        : 'WhatsApp Business Platform — Real-time analytics & management')}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => openNewChat()}
                  className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Send className="w-4 h-4" />
                  Send Direct Message
                </button>
                <button
                  onClick={() => setShowCampaignModal(true)}
                  className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs flex items-center gap-2 backdrop-blur-md border border-white/15 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  Create Campaign
                </button>
                <button
                  onClick={handleRefreshStatus}
                  disabled={refreshing}
                  className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/15 transition-colors"
                  title="Refresh Telemetry"
                >
                  <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
          </div>

          {/* Unconfigured Alert Banner for Selected Company */}
          {effectiveCompanyId && !connData?.configured && (
            <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                <div>
                  <h4 className="text-sm font-bold text-amber-900 dark:text-amber-200">
                    WhatsApp Cloud API is not yet configured for {connData?.companyName || 'this company'}
                  </h4>
                  <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
                    Messages cannot be sent or received for this company until you configure its Meta Phone Number ID, WABA ID, and Permanent Access Token.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setShowConfigModal(true)}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition-colors"
                >
                  Configure WhatsApp Now
                </button>
                <Link
                  href={`/admin/companies/${effectiveCompanyId}?tab=meta`}
                  className="px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 hover:bg-amber-100 text-amber-900 dark:text-amber-100 font-semibold text-xs transition-colors"
                >
                  Company 360 Meta Tab ↗
                </Link>
              </div>
            </div>
          )}

          {/* Today's KPI Metrics Grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800/80 flex items-center gap-1.5 shadow-xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Today
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Real-time 24-hour transmission telemetry
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Metric 1: Messages Today */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-violet-300 dark:hover:border-violet-700/50 transition-all relative overflow-hidden group">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Messages Today
                  </span>
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-violet-500/20 group-hover:scale-105 transition-transform">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  {connData?.metrics?.messagesToday ?? 0}
                </div>
                <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
                  <span>Delivered: <strong className="text-slate-700 dark:text-slate-200">{connData?.metrics?.deliveredToday ?? 0}</strong></span>
                  <span>•</span>
                  <span>Read: <strong className="text-slate-700 dark:text-slate-200">{connData?.metrics?.readToday ?? 0}</strong></span>
                </div>
              </div>

              {/* Metric 2: Active Connections */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-emerald-300 dark:hover:border-emerald-700/50 transition-all relative overflow-hidden group">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Active Connections
                  </span>
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                    <Radio className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                  {connData?.metrics?.activeConnections ?? (connData?.configured ? 1 : 0)}
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
                    {connData?.configured ? 'Active' : 'Offline'}
                  </span>
                </div>
                <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  {connData?.connection?.phoneNumberId ? `Phone ID: ...${connData.connection.phoneNumberId.slice(-6)}` : 'Meta WABA Connection'}
                </p>
              </div>

              {/* Metric 3: Total Contacts */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-blue-300 dark:hover:border-blue-700/50 transition-all relative overflow-hidden group">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Total Contacts
                  </span>
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
                    <Users className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  {connData?.metrics?.totalContacts ?? conversations.length ?? 0}
                </div>
                <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                  Total registered audience channels
                </p>
              </div>

              {/* Metric 4: Templates */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-amber-300 dark:hover:border-amber-700/50 transition-all relative overflow-hidden group">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Templates
                  </span>
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform">
                    <FileText className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  {connData?.metrics?.templates ?? templates.length ?? 0}
                </div>
                <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                  Approved Meta business HSM formats
                </p>
              </div>
            </div>
          </div>

          {/* META PREPAID BALANCE & AUTO PER-MESSAGE DEDUCTION ENGINE */}
          <div className="bg-gradient-to-br from-emerald-950/20 via-slate-900 to-teal-950/20 rounded-3xl p-6 sm:p-7 border border-emerald-500/20 shadow-lg space-y-6 relative overflow-hidden">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-emerald-500/10 pb-5">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Meta Cloud API Ledger • Live Auto-Deduction Engine
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-emerald-500" />
                  Available Balance & Auto-Deduction Engine
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Real-time wallet balance reconciliation against Meta&apos;s official conversation rates.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowRechargeModal(true)}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-emerald-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Plus className="w-4 h-4" />
                  Record Meta Recharge
                </button>
                <a
                  href="https://business.facebook.com/billing_hub/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-900 dark:text-white font-semibold text-xs flex items-center gap-1.5 border border-slate-300 dark:border-white/10 transition-colors"
                >
                  Meta Billing Hub
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Available Balance */}
              <div className="bg-white dark:bg-slate-900/90 rounded-2xl p-5 border border-emerald-500/20 shadow-xs relative overflow-hidden">
                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block mb-1">
                  Available Wallet Balance
                </span>
                <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-baseline gap-1">
                  <span className="text-xl text-emerald-600 font-bold">₹</span>
                  {billing?.availableBalance !== undefined ? billing.availableBalance.toFixed(2) : '0.00'}
                </div>
                <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 dark:border-slate-800/80 pt-2.5">
                  <span>Total Recharged:</span>
                  <strong className="text-slate-800 dark:text-slate-200">₹{(billing?.totalRecharged ?? 0).toFixed(2)}</strong>
                </div>
              </div>

              {/* Card 2: Marketing Deductions */}
              <div className="bg-white dark:bg-slate-900/90 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Marketing Journeys
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 border border-violet-200/50">
                    ₹0.78 / msg
                  </span>
                </div>
                <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  {billing?.deductionSummary?.marketingCount ?? 0}
                  <span className="text-xs font-normal text-slate-500 ml-1.5">sent</span>
                </div>
                <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 dark:border-slate-800/80 pt-2.5">
                  <span>Deducted Cost:</span>
                  <strong className="text-violet-600 dark:text-violet-400 font-bold">
                    ₹{(((billing?.deductionSummary?.marketingCount ?? 0) * (billing?.rates?.MARKETING ?? 0.7846))).toFixed(2)}
                  </strong>
                </div>
              </div>

              {/* Card 3: Utility & Notifications */}
              <div className="bg-white dark:bg-slate-900/90 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Utility & Alerts
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/50">
                    ₹0.11 / msg
                  </span>
                </div>
                <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  {billing?.deductionSummary?.utilityCount ?? 0}
                  <span className="text-xs font-normal text-slate-500 ml-1.5">sent</span>
                </div>
                <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 dark:border-slate-800/80 pt-2.5">
                  <span>Deducted Cost:</span>
                  <strong className="text-blue-600 dark:text-blue-400 font-bold">
                    ₹{(((billing?.deductionSummary?.utilityCount ?? 0) * (billing?.rates?.UTILITY ?? 0.1147))).toFixed(2)}
                  </strong>
                </div>
              </div>

              {/* Card 4: Service / Support Replies */}
              <div className="bg-white dark:bg-slate-900/90 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Service Replies
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/50">
                    ₹0.30 / msg
                  </span>
                </div>
                <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  {billing?.deductionSummary?.serviceCount ?? 0}
                  <span className="text-xs font-normal text-slate-500 ml-1.5">sent</span>
                </div>
                <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 dark:border-slate-800/80 pt-2.5">
                  <span>Deducted Cost:</span>
                  <strong className="text-emerald-600 dark:text-emerald-400 font-bold">
                    ₹{(((billing?.deductionSummary?.serviceCount ?? 0) * (billing?.rates?.SERVICE ?? 0.3000))).toFixed(2)}
                  </strong>
                </div>
              </div>
            </div>

            {/* Live Message Capacity Estimator Bar */}
            <div className="p-4 rounded-2xl bg-white/60 dark:bg-slate-900/50 border border-emerald-500/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-emerald-500 shrink-0" />
                <span className="text-slate-600 dark:text-slate-300">
                  {billing?.availableBalance > 0 ? (
                    <>
                      Your current balance supports approx.{' '}
                      <strong className="text-slate-900 dark:text-white font-bold">
                        {Math.floor(billing.availableBalance / (billing?.rates?.MARKETING ?? 0.7846)).toLocaleString()}
                      </strong>{' '}
                      marketing broadcasts or{' '}
                      <strong className="text-slate-900 dark:text-white font-bold">
                        {Math.floor(billing.availableBalance / (billing?.rates?.UTILITY ?? 0.1147)).toLocaleString()}
                      </strong>{' '}
                      utility alerts.
                    </>
                  ) : (
                    <>No balance recorded yet. Please click &quot;Record Meta Recharge&quot; to log your Meta top-up.</>
                  )}
                </span>
              </div>
              <div className="text-[11px] text-slate-400 shrink-0">
                Official Meta Base Rates • Zero BSP markup
              </div>
            </div>
          </div>

          {/* Enterprise Automation Suite */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-violet-600" />
                Enterprise Automation Suite
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Mission-critical enterprise modules connected with your WhatsApp Business operations
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Suite 1: Sales & CRM */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 hover:border-violet-500/50 hover:shadow-md transition-all flex flex-col justify-between group">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                      CRM Sync
                    </span>
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-slate-900 dark:text-white">
                      Sales & CRM
                    </h4>
                    <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mt-0.5">
                      Pipeline & Forecasting
                    </p>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Convert WhatsApp chats into qualified CRM leads, manage pipeline stages, and project deal revenue.
                  </p>
                </div>
                <a
                  href="/admin/crm"
                  className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center justify-between group-hover:translate-x-0.5 transition-transform"
                >
                  <span>Explore Pipeline</span>
                  <ArrowUpRight className="w-4 h-4" />
                </a>
              </div>

              {/* Suite 2: Automation */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 hover:border-violet-500/50 hover:shadow-md transition-all flex flex-col justify-between group">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 flex items-center justify-center">
                      <Workflow className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800">
                      Smart Flows
                    </span>
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-slate-900 dark:text-white">
                      Automation
                    </h4>
                    <p className="text-xs font-semibold text-purple-600 dark:text-purple-400 mt-0.5">
                      Marketing Journeys
                    </p>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Build event-driven drip sequences, scheduled reminders, and automated template broadcasts.
                  </p>
                </div>
                <a
                  href="/admin/workflows"
                  className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-xs font-bold text-purple-600 dark:text-purple-400 flex items-center justify-between group-hover:translate-x-0.5 transition-transform"
                >
                  <span>Marketing Journeys</span>
                  <ArrowUpRight className="w-4 h-4" />
                </a>
              </div>

              {/* Suite 3: Help Desk */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 hover:border-violet-500/50 hover:shadow-md transition-all flex flex-col justify-between group">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 flex items-center justify-center">
                      <Headphones className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                      24h SLA
                    </span>
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-slate-900 dark:text-white">
                      Help Desk
                    </h4>
                    <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 mt-0.5">
                      SLA & Ticket Center
                    </p>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Track customer satisfaction, manage 24h Meta conversation windows, and enforce SLA tickets.
                  </p>
                </div>
                <a
                  href="/admin/tickets"
                  className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center justify-between group-hover:translate-x-0.5 transition-transform"
                >
                  <span>SLA & Ticket Center</span>
                  <ArrowUpRight className="w-4 h-4" />
                </a>
              </div>

              {/* Suite 4: Omnichannel */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200/80 dark:border-slate-800 hover:border-violet-500/50 hover:shadow-md transition-all flex flex-col justify-between group">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center">
                      <Globe className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                      Multi-Agent
                    </span>
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-slate-900 dark:text-white">
                      Omnichannel
                    </h4>
                    <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
                      Platform Gateway
                    </p>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Unified multi-agent team inbox with internal notes, canned replies, and agent assignment.
                  </p>
                </div>
                <button
                  onClick={() => handleTabChange('inbox')}
                  className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-between group-hover:translate-x-0.5 transition-transform text-left"
                >
                  <span>Platform Gateway</span>
                  <ArrowUpRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Grid Layout: Recent Messages & Campaigns */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Recent Messages */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-violet-600" />
                    Recent Messages
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Real-time transacted message transmission feed
                  </p>
                </div>
                <button
                  onClick={() => handleTabChange('inbox')}
                  className="text-xs font-semibold text-violet-600 hover:text-violet-700 dark:text-violet-400 flex items-center gap-1"
                >
                  View Team Inbox <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
                {recentMessages.length === 0 ? (
                  <div className="py-12 px-4 text-center space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                      <MessageSquare className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                        No messages yet. Send your first message
                      </p>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto">
                        Your WhatsApp Business API is connected and ready. Send a test message or start chatting with leads.
                      </p>
                    </div>
                    <div className="pt-2 flex items-center justify-center gap-3">
                      <button
                        onClick={() => openNewChat()}
                        className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5"
                      >
                        <Send className="w-3.5 h-3.5" />
                        Send First Message
                      </button>
                      <button
                        onClick={() => handleTabChange('test')}
                        className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                      >
                        Test Console
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200/80 dark:border-slate-800">
                        <tr>
                          <th className="px-4 py-3">Direction</th>
                          <th className="px-4 py-3">Phone</th>
                          <th className="px-4 py-3">Type</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3 text-right">Time</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {recentMessages.slice(0, 7).map((msg: any) => {
                          const isIncoming = msg.direction === 'INBOUND' || msg.direction === 'INCOMING';
                          const phone = msg.conversation?.waNumber || msg.conversation?.customerName || msg.customerPhone || msg.to || msg.from || 'Direct User';
                          return (
                            <tr key={msg.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                              <td className="px-4 py-3">
                                {isIncoming ? (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60">
                                    <ArrowDownLeft className="w-3 h-3" />
                                    Incoming
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-50 dark:bg-violet-950/50 text-violet-700 dark:text-violet-400 border border-violet-200/60 dark:border-violet-800/60">
                                    <ArrowUpRight className="w-3 h-3" />
                                    Outgoing
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                                {phone}
                              </td>
                              <td className="px-4 py-3 text-slate-500 uppercase font-mono text-[11px]">
                                {msg.type || 'TEXT'}
                              </td>
                              <td className="px-4 py-3">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  msg.status === 'READ' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                                  msg.status === 'DELIVERED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                  msg.status === 'FAILED' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                                  'bg-slate-100 text-slate-700 border border-slate-200'
                                }`}>
                                  {msg.status || 'SENT'}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right text-slate-400 text-[11px] whitespace-nowrap">
                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Right 1 Col: Campaigns Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-amber-600" />
                    Campaigns
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Marketing blasts & announcements
                  </p>
                </div>
                <button
                  onClick={() => setShowCampaignModal(true)}
                  className="text-xs font-semibold text-violet-600 hover:text-violet-700 dark:text-violet-400 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> New
                </button>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-5">
                {campaigns.length === 0 ? (
                  <div className="py-8 text-center space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center mx-auto">
                      <TrendingUp className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                        No campaigns yet
                      </p>
                      <p className="text-xs text-slate-500">
                        Create targeted WhatsApp broadcasts to reach your CRM leads and client segments.
                      </p>
                    </div>
                    <button
                      onClick={() => setShowCampaignModal(true)}
                      className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-xs transition-colors"
                    >
                      + Create First Campaign
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {campaigns.slice(0, 4).map((c: any) => (
                      <div key={c.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {c.name}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            c.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700' :
                            c.status === 'PROCESSING' ? 'bg-blue-50 text-blue-700' :
                            'bg-slate-100 text-slate-600'
                          }`}>
                            {c.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 truncate">
                          Template: {c.templateName || 'Custom'} • Audience: {c.audienceSource || 'CRM'}
                        </p>
                      </div>
                    ))}
                    <button
                      onClick={() => handleTabChange('campaigns')}
                      className="w-full py-2 text-center text-xs font-bold text-violet-600 hover:text-violet-700 dark:text-violet-400 block pt-2"
                    >
                      View all {campaigns.length} campaigns →
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions Bar */}
          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-violet-600" />
                Quick Actions
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Instantly trigger common WhatsApp business operations
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <button
                onClick={() => openNewChat()}
                className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-violet-500 hover:shadow-xs transition-all flex flex-col items-center justify-center text-center gap-2 group"
              >
                <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-950/60 text-violet-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Send className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Direct Message
                </span>
                <span className="text-[10px] text-slate-400">
                  New single chat
                </span>
              </button>

              <button
                onClick={() => setShowCampaignModal(true)}
                className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-amber-500 hover:shadow-xs transition-all flex flex-col items-center justify-center text-center gap-2 group"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  New Campaign
                </span>
                <span className="text-[10px] text-slate-400">
                  Broadcast list
                </span>
              </button>

              <button
                onClick={handleSyncTemplates}
                disabled={syncingTemplates}
                className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 hover:shadow-xs transition-all flex flex-col items-center justify-center text-center gap-2 group"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <RefreshCw className={`w-5 h-5 ${syncingTemplates ? 'animate-spin' : ''}`} />
                </div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Sync Templates
                </span>
                <span className="text-[10px] text-slate-400">
                  From Meta Graph
                </span>
              </button>

              <button
                onClick={() => handleTabChange('test')}
                className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-500 hover:shadow-xs transition-all flex flex-col items-center justify-center text-center gap-2 group"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Radio className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Test Webhook
                </span>
                <span className="text-[10px] text-slate-400">
                  Simulate events
                </span>
              </button>

              <button
                onClick={() => setShowConfigModal(true)}
                className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-slate-500 hover:shadow-xs transition-all flex flex-col items-center justify-center text-center gap-2 group"
              >
                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Settings className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  API Settings
                </span>
                <span className="text-[10px] text-slate-400">
                  Credentials & Tokens
                </span>
              </button>

              <button
                onClick={() => handleTabChange('guide')}
                className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 hover:shadow-xs transition-all flex flex-col items-center justify-center text-center gap-2 group"
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <BookOpen className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Setup Guide
                </span>
                <span className="text-[10px] text-slate-400">
                  Meta Dev documentation
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 1: CONNECTION & HEALTH STATUS */}
      {activeTab === 'status' && (
        <div className="space-y-6">
          {/* Health & Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm space-y-2">
              <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                Connection Health
              </span>
              <div className="flex items-center justify-between">
                <span className="text-xl font-bold text-slate-900 dark:text-white">
                  {connData?.connection?.connectionHealth || 'HEALTHY'}
                </span>
                <ShieldCheck className="w-6 h-6 text-emerald-600" />
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Quality: <strong>{connData?.connection?.qualityRating || 'GREEN'}</strong> • Limit: {connData?.connection?.messagingLimit || '1K'}
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm space-y-2">
              <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                Messages Dispatched Today
              </span>
              <div className="flex items-center justify-between">
                <span className="text-xl font-bold text-slate-900 dark:text-white">
                  {connData?.metrics?.messagesToday || 0}
                </span>
                <Send className="w-6 h-6 text-violet-600" />
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Delivered: {connData?.metrics?.deliveredToday || 0} • Read: {connData?.metrics?.readToday || 0}
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm space-y-2">
              <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                Active Conversations
              </span>
              <div className="flex items-center justify-between">
                <span className="text-xl font-bold text-slate-900 dark:text-white">
                  {connData?.metrics?.openConversations || conversations.filter((c) => c.status === 'OPEN').length}
                </span>
                <MessageSquare className="w-6 h-6 text-blue-600" />
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Open customer & prospect chat threads
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm space-y-2">
              <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                Active Campaigns
              </span>
              <div className="flex items-center justify-between">
                <span className="text-xl font-bold text-slate-900 dark:text-white">
                  {campaigns.filter((c) => c.status === 'PROCESSING' || c.status === 'SCHEDULED').length}
                </span>
                <TrendingUp className="w-6 h-6 text-amber-600" />
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Total completed: {campaigns.filter((c) => c.status === 'COMPLETED').length}
              </p>
            </div>
          </div>

          {/* Meta Billing & Recharge Panel */}
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 p-6 rounded-3xl border border-emerald-100 dark:border-emerald-900/50 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-emerald-200/50 dark:border-emerald-900/50 pb-4 gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <IndianRupee className="w-5 h-5 text-emerald-600" />
                  Meta Billing & Auto-Deduction Engine
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  Reconciles your Meta prepaid balance and automatically deducts official Meta conversation rates.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowRechargeModal(true)}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  Record Meta Recharge
                </button>
                <a
                  href="https://business.facebook.com/billing_hub/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 text-slate-800 dark:text-white text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-all flex items-center gap-1.5 whitespace-nowrap"
                >
                  Check Live Balance on Meta
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white/80 dark:bg-slate-900/50 backdrop-blur-sm p-4 rounded-2xl border border-emerald-100 dark:border-emerald-900/30">
                <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider block mb-1">
                  Available Wallet Balance
                </span>
                <div className="text-2xl font-black text-slate-900 dark:text-white">
                  ₹{billing?.availableBalance !== undefined ? billing.availableBalance.toFixed(2) : '0.00'}
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  Total Recharged: <strong>₹{(billing?.totalRecharged ?? 0).toFixed(2)}</strong>
                </p>
              </div>

              <div className="bg-white/80 dark:bg-slate-900/50 backdrop-blur-sm p-4 rounded-2xl border border-emerald-100 dark:border-emerald-900/30">
                <span className="text-[11px] font-bold text-violet-600 uppercase tracking-wider block mb-1">
                  Marketing Journeys
                </span>
                <div className="text-2xl font-black text-slate-900 dark:text-white">
                  {billing?.deductionSummary?.marketingCount ?? 0}
                  <span className="text-xs font-normal text-slate-400 ml-1">msgs</span>
                </div>
                <p className="text-[10px] text-violet-600 font-bold mt-1">
                  Rate: ₹0.78 • Deducted: ₹{(((billing?.deductionSummary?.marketingCount ?? 0) * (billing?.rates?.MARKETING ?? 0.7846))).toFixed(2)}
                </p>
              </div>

              <div className="bg-white/80 dark:bg-slate-900/50 backdrop-blur-sm p-4 rounded-2xl border border-emerald-100 dark:border-emerald-900/30">
                <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider block mb-1">
                  Utility Notifications
                </span>
                <div className="text-2xl font-black text-slate-900 dark:text-white">
                  {billing?.deductionSummary?.utilityCount ?? 0}
                  <span className="text-xs font-normal text-slate-400 ml-1">msgs</span>
                </div>
                <p className="text-[10px] text-blue-600 font-bold mt-1">
                  Rate: ₹0.11 • Deducted: ₹{(((billing?.deductionSummary?.utilityCount ?? 0) * (billing?.rates?.UTILITY ?? 0.1147))).toFixed(2)}
                </p>
              </div>

              <div className="bg-white/80 dark:bg-slate-900/50 backdrop-blur-sm p-4 rounded-2xl border border-emerald-100 dark:border-emerald-900/30">
                <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider block mb-1">
                  Service Replies
                </span>
                <div className="text-2xl font-black text-slate-900 dark:text-white">
                  {billing?.deductionSummary?.serviceCount ?? 0}
                  <span className="text-xs font-normal text-slate-400 ml-1">msgs</span>
                </div>
                <p className="text-[10px] text-emerald-600 font-bold mt-1">
                  Rate: ₹0.30 • Deducted: ₹{(((billing?.deductionSummary?.serviceCount ?? 0) * (billing?.rates?.SERVICE ?? 0.3000))).toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* Connection Details Panel */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/80 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Meta Account Credentials & Endpoints</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Stored securely using AES-256-GCM authenticated encryption at rest. Complete tokens are never exposed.
                </p>
              </div>
              <button
                onClick={() => setShowConfigModal(true)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors"
              >
                Reconfigure Credentials
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              <div className="space-y-4">
                <div>
                  <span className="text-slate-400 dark:text-slate-500 block font-semibold mb-1">Display Phone Number</span>
                  <span className="font-mono text-slate-900 dark:text-white font-bold text-sm">
                    {connData?.connection?.businessPhoneNumber || 'Not detected'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-slate-500 block font-semibold mb-1">Phone Number ID</span>
                  <span className="font-mono text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-950 p-2 rounded-lg border border-slate-200 dark:border-slate-800 block">
                    {connData?.connection?.phoneNumberId || 'Missing'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-slate-500 block font-semibold mb-1">WhatsApp Business Account ID (WABA ID)</span>
                  <span className="font-mono text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-950 p-2 rounded-lg border border-slate-200 dark:border-slate-800 block">
                    {connData?.connection?.wabaId || 'Not configured'}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <span className="text-slate-400 dark:text-slate-500 block font-semibold mb-1">System Access Token (Encrypted)</span>
                  <span className="font-mono text-emerald-700 bg-emerald-50 p-2 rounded-lg border border-emerald-200 block">
                    {connData?.connection?.maskedToken || '••••••••••••••••'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-slate-500 block font-semibold mb-1">Webhook Verify Token</span>
                  <span className="font-mono text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-950 p-2 rounded-lg border border-slate-200 dark:border-slate-800 block">
                    {connData?.connection?.verifyToken || 'techinpedia_verify_token_2026'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 dark:text-slate-500 block font-semibold mb-1">Callback Webhook URL</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-950 p-2 rounded-lg border border-slate-200 dark:border-slate-800 flex-1 truncate">
                      {webhookUrl}
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(webhookUrl);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                      className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 text-xs font-semibold shrink-0 flex items-center gap-1"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Setup Walkthrough Banner */}
          <div className="bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-700 text-white p-6 rounded-3xl shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-xs text-white text-[11px] font-bold tracking-wide uppercase">
                  Meta WhatsApp Cloud API
                </span>
                <span className="text-xs text-violet-100 font-medium">7-Step Complete Setup Guide</span>
              </div>
              <h4 className="text-lg font-bold">How to Setup & Connect WhatsApp Cloud API? (Step-by-Step)</h4>
              <p className="text-xs text-violet-100 max-w-2xl leading-relaxed">
                Connect your Phone Number ID, Permanent System User Token, and Webhook from the Meta Developer Portal in under 5 minutes to unlock live 2-way messaging and campaigns.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setActiveTab('guide')}
                className="px-5 py-2.5 rounded-xl bg-white text-violet-700 hover:bg-violet-50 font-bold text-xs flex items-center gap-2 shadow-sm transition-all"
              >
                <BookOpen className="w-4 h-4" />
                View Setup Guide
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB: STEP-BY-STEP API & CREDENTIALS SETUP GUIDE */}
      {activeTab === 'guide' && (
        <div className="space-y-8">
          {/* Guide Header Banner */}
          <div className="bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 text-white p-8 rounded-3xl shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-2 max-w-3xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-xs text-white text-xs font-bold uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5" />
                  Meta WhatsApp Business Platform
                </div>
                <h2 className="text-2xl font-black tracking-tight">
                  WhatsApp Cloud API Setup Guide (Step-by-Step)
                </h2>
                <p className="text-xs sm:text-sm text-violet-100 leading-relaxed">
                  Follow the 7 easy steps below to connect the official <strong>Meta WhatsApp Cloud API</strong> with TechInPedia. Once connected, your <strong>Shared Team Inbox</strong>, <strong>Meta-Approved Templates</strong>, and <strong>Automated Broadcast Campaigns</strong> will start working immediately.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <a
                  href="https://developers.facebook.com/apps"
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2.5 rounded-xl bg-white text-violet-700 hover:bg-violet-50 font-bold text-xs flex items-center gap-1.5 shadow-sm transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Open Meta Developers
                </a>
                <a
                  href="https://business.facebook.com/settings/system-users"
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2.5 rounded-xl bg-violet-800/80 hover:bg-violet-800 text-white font-bold text-xs flex items-center gap-1.5 border border-violet-400/30 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Meta Business Suite
                </a>
                <button
                  onClick={() => setShowConfigModal(true)}
                  className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-colors"
                >
                  <Key className="w-3.5 h-3.5" />
                  Save Credentials
                </button>
              </div>
            </div>

            {/* Quick Prerequisites Bar */}
            <div className="pt-4 border-t border-white/20 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="bg-white/10 rounded-xl p-3 backdrop-blur-xs">
                <span className="font-bold block mb-0.5">1. Meta Facebook Account</span>
                <span className="text-violet-200 text-[11px]">Personal Facebook account to log in to the Meta Developer portal.</span>
              </div>
              <div className="bg-white/10 rounded-xl p-3 backdrop-blur-xs">
                <span className="font-bold block mb-0.5">2. Meta Business Account</span>
                <span className="text-violet-200 text-[11px]">Required for generating Permanent System User Tokens and managing assets.</span>
              </div>
              <div className="bg-white/10 rounded-xl p-3 backdrop-blur-xs">
                <span className="font-bold block mb-0.5">3. Dedicated Phone Number</span>
                <span className="text-violet-200 text-[11px]">A number not currently registered on personal or business WhatsApp mobile apps.</span>
              </div>
            </div>
          </div>

          {/* Detailed Step Cards */}
          <div className="space-y-6">
            {/* STEP 1 */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-2xl bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-400 font-black text-sm flex items-center justify-center shrink-0 border border-violet-200 dark:border-violet-800">
                    1
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Create Meta Developer Account & Business App
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Register on the Meta Developer Portal and initialize a Business application.
                    </p>
                  </div>
                </div>
                <a
                  href="https://developers.facebook.com/apps"
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1 shrink-0"
                >
                  <ExternalLink className="w-3 h-3" />
                  developers.facebook.com
                </a>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950/50 rounded-2xl p-4 border border-slate-200 dark:border-slate-800/80 text-xs space-y-2.5 text-slate-700 dark:text-slate-300">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    Go to <strong>My Apps</strong> and click the <strong>Create App</strong> button.
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    Select <strong>Other</strong> (or <em>Set up business solution</em>) as your use case and click <strong>Next</strong>.
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    Select <strong>Business</strong> as the App Type and click <strong>Next</strong>.
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    Enter your App Name (e.g. <code>TechInPedia CRM</code>), contact email, and select your <strong>Meta Business Portfolio / Account</strong>.
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    Once the App Dashboard loads, scroll down to the <strong>WhatsApp</strong> product card and click <strong>Set up</strong>.
                  </div>
                </div>
              </div>
            </div>

            {/* STEP 2 */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-2xl bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 font-black text-sm flex items-center justify-center shrink-0 border border-blue-200 dark:border-blue-800">
                    2
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Obtain Phone Number ID & WABA ID
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Copy your numerical Phone Number ID and WhatsApp Business Account ID from Meta.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950/50 rounded-2xl p-4 border border-slate-200 dark:border-slate-800/80 text-xs space-y-3 text-slate-700 dark:text-slate-300">
                <p>
                  1. In the left navigation menu, click <strong>WhatsApp</strong> ➔ <strong>API Setup</strong>.
                </p>
                <p>
                  2. Under the <strong>&quot;Send and receive messages&quot;</strong> section, locate two key identifiers:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                    <span className="font-bold text-slate-900 dark:text-white block mb-1">Phone Number ID</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-2">
                      A 15-16 digit numerical identifier (e.g. <code>109283746592019</code>) used by TechInPedia to route and dispatch messages.
                    </span>
                  </div>
                  <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                    <span className="font-bold text-slate-900 dark:text-white block mb-1">WhatsApp Business Account ID (WABA ID)</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-2">
                      Your master WhatsApp account identifier (e.g. <code>1038291048572910</code>) used to manage templates and subscriptions.
                    </span>
                  </div>
                </div>
                <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800/50 text-amber-800 dark:text-amber-200 text-[11px] flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                  <span>
                    <strong>Important Warning:</strong> The Temporary Access Token displayed on this page expires in 24 hours! Do NOT use the temporary token for production. Follow Step 3 below to generate a Permanent System User Token.
                  </span>
                </div>
              </div>
            </div>

            {/* STEP 3 */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 font-black text-sm flex items-center justify-center shrink-0 border border-emerald-200 dark:border-emerald-800">
                    3
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Generate Permanent System User Access Token (Never Expiring)
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Create an admin system user in Meta Business Settings for 24x7 continuous messaging without expiration.
                    </p>
                  </div>
                </div>
                <a
                  href="https://business.facebook.com/settings/system-users"
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1 shrink-0"
                >
                  <ExternalLink className="w-3 h-3" />
                  Business Settings
                </a>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950/50 rounded-2xl p-4 border border-slate-200 dark:border-slate-800/80 text-xs space-y-3 text-slate-700 dark:text-slate-300">
                <ol className="list-decimal list-inside space-y-2 leading-relaxed">
                  <li>
                    Navigate to{' '}
                    <a
                      href="https://business.facebook.com/settings/system-users"
                      target="_blank"
                      rel="noreferrer"
                      className="text-violet-600 dark:text-violet-400 font-bold underline"
                    >
                      business.facebook.com/settings/system-users
                    </a>.
                  </li>
                  <li>
                    Click the <strong>Add</strong> button. Enter System User Name as <code>TechInPedia-Bot</code>, select Role as <strong>Admin</strong>, and click <strong>Create System User</strong>.
                  </li>
                  <li>
                    Select the newly created System User and click <strong>Add Assets</strong>:
                    <ul className="list-disc list-inside pl-4 mt-1 space-y-1 text-slate-600 dark:text-slate-400">
                      <li>
                        <strong>Apps</strong> ➔ Select your App ➔ Toggle <strong>Full Control (Manage App)</strong> to ON.
                      </li>
                      <li>
                        <strong>WhatsApp Accounts</strong> ➔ Select your WhatsApp account ➔ Toggle <strong>Full Control (Manage WhatsApp)</strong> to ON.
                      </li>
                      <li>
                        Click <strong>Save Changes</strong>.
                      </li>
                    </ul>
                  </li>
                  <li>
                    Now click the <strong>Generate New Token</strong> button:
                    <ul className="list-disc list-inside pl-4 mt-1 space-y-1 text-slate-600 dark:text-slate-400">
                      <li>Select your App.</li>
                      <li>
                        Set Token Expiration to <strong>Never</strong>.
                      </li>
                      <li>
                        Check these two required permissions:
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <code className="bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded text-violet-700 dark:text-violet-300 font-mono text-[11px]">
                            whatsapp_business_messaging
                          </code>
                          <code className="bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded text-violet-700 dark:text-violet-300 font-mono text-[11px]">
                            whatsapp_business_management
                          </code>
                          <button
                            onClick={() =>
                              copyToClipboard(
                                'whatsapp_business_messaging, whatsapp_business_management',
                                'perms'
                              )
                            }
                            className="p-1 rounded bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-600 dark:text-slate-300 text-[10px] font-semibold flex items-center gap-1"
                          >
                            <Copy className="w-3 h-3" />
                            {copyStatus['perms'] ? 'Copied!' : 'Copy'}
                          </button>
                        </div>
                      </li>
                    </ul>
                  </li>
                  <li>
                    Click <strong>Generate Token</strong> and copy the token string (starts with <code>EAAG...</code>). Store it safely.
                  </li>
                </ol>
              </div>
            </div>

            {/* STEP 4 */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 font-black text-sm flex items-center justify-center shrink-0 border border-amber-200 dark:border-amber-800">
                    4
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Configure Webhook in Meta Developer Portal
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Enables real-time delivery of customer replies, read receipts, and status updates to TechInPedia Inbox.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950/50 rounded-2xl p-4 border border-slate-200 dark:border-slate-800/80 text-xs space-y-3 text-slate-700 dark:text-slate-300">
                <p>
                  1. In the Meta Developers dashboard, go to <strong>WhatsApp</strong> ➔ <strong>Configuration</strong>.
                </p>
                <p>
                  2. In the <strong>Webhooks</strong> section, click <strong>Edit</strong> and paste the following:
                </p>

                <div className="space-y-2 pt-1">
                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Callback URL:
                    </label>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono text-violet-700 dark:text-violet-300 break-all select-all">
                        {webhookUrl}
                      </code>
                      <button
                        onClick={() => copyToClipboard(webhookUrl, 'webhookUrl')}
                        className="px-3 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs flex items-center gap-1.5 shrink-0 shadow-xs transition-colors"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        {copyStatus['webhookUrl'] ? 'Copied!' : 'Copy URL'}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Verify Token:
                    </label>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono text-emerald-700 dark:text-emerald-400 select-all">
                        {connData?.connection?.verifyToken || 'techinpedia_verify_token_2026'}
                      </code>
                      <button
                        onClick={() =>
                          copyToClipboard(
                            connData?.connection?.verifyToken || 'techinpedia_verify_token_2026',
                            'verifyToken'
                          )
                        }
                        className="px-3 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shrink-0 shadow-xs transition-colors"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        {copyStatus['verifyToken'] ? 'Copied!' : 'Copy Token'}
                      </button>
                    </div>
                  </div>
                </div>

                <p className="pt-2">
                  3. Click <strong>Verify and Save</strong>. (TechInPedia returns an immediate 200 OK challenge handshake).
                </p>
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800/50 text-emerald-800 dark:text-emerald-200 text-[11px] flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                  <span>
                    <strong>Crucial Step:</strong> Under <strong>Webhook fields</strong> on the same page, click <strong>Manage</strong> and click <strong>Subscribe</strong> next to the <strong>&quot;messages&quot;</strong> field. This ensures customer messages reach your inbox in real time.
                  </span>
                </div>
              </div>
            </div>

            {/* STEP 5 */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-2xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 font-black text-sm flex items-center justify-center shrink-0 border border-indigo-200 dark:border-indigo-800">
                    5
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Save Credentials in TechInPedia
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Store your Meta credentials into TechInPedia&apos;s AES-256-GCM encrypted key vault.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowConfigModal(true)}
                  className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors shrink-0"
                >
                  <Settings className="w-3.5 h-3.5" />
                  Open Credentials Form
                </button>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950/50 rounded-2xl p-4 border border-slate-200 dark:border-slate-800/80 text-xs space-y-3 text-slate-700 dark:text-slate-300">
                <p>
                  Click the button above and input the following values into the modal:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                    <span className="font-bold block text-slate-900 dark:text-white">Phone Number ID</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">15-16 digit ID from Step 2</span>
                  </div>
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                    <span className="font-bold block text-slate-900 dark:text-white">System User Access Token</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">Permanent EAAG... token from Step 3</span>
                  </div>
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                    <span className="font-bold block text-slate-900 dark:text-white">WABA ID</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">WhatsApp Business Account ID from Step 2</span>
                  </div>
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                    <span className="font-bold block text-slate-900 dark:text-white">Webhook Verify Token</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">techinpedia_verify_token_2026</span>
                  </div>
                </div>
                <p>
                  Click <strong>Connect & Save</strong>. The system will perform an automated handshake test with Meta Graph API and your connection status will turn to <strong>HEALTHY</strong>!
                </p>
              </div>
            </div>

            {/* STEP 6 */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 font-black text-sm flex items-center justify-center shrink-0 border border-rose-200 dark:border-rose-800">
                    6
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Connect Your Real Business Phone Number (Production)
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Switch from Meta&apos;s test sandbox number to your official company phone number.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950/50 rounded-2xl p-4 border border-slate-200 dark:border-slate-800/80 text-xs space-y-3 text-slate-700 dark:text-slate-300">
                <ol className="list-decimal list-inside space-y-2 leading-relaxed">
                  <li>
                    In the Meta Developers Dashboard, go to <strong>WhatsApp</strong> ➔ <strong>API Setup</strong>.
                  </li>
                  <li>
                    Scroll down to <strong>Step 5: Add a phone number</strong> and click <strong>Add phone number</strong>.
                  </li>
                  <li>
                    Enter your Business Display Name, Category, and Description.
                  </li>
                  <li>
                    Enter your phone number and verify via <strong>SMS</strong> or <strong>Voice Call</strong> OTP.
                  </li>
                  <li>
                    <span className="text-rose-600 dark:text-rose-400 font-bold">Important:</span> The number must NOT be currently active on standard WhatsApp or WhatsApp Business mobile apps. If it is, open the mobile app and go to Settings ➔ Account ➔ <em>Delete my account</em> first.
                  </li>
                  <li>
                    Once verified, copy the new <strong>Phone Number ID</strong> generated for your real number and update it in TechInPedia&apos;s Connection Settings.
                  </li>
                </ol>
              </div>
            </div>

            {/* STEP 7 */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-2xl bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-400 font-black text-sm flex items-center justify-center shrink-0 border border-teal-200 dark:border-teal-800">
                    7
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Send a Live Test Message & Verify Two-Way Chat
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Use the built-in Test Console to dispatch a live message to your mobile phone.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('test')}
                  className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                  Open Test Console
                </button>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950/50 rounded-2xl p-4 border border-slate-200 dark:border-slate-800/80 text-xs space-y-2.5 text-slate-700 dark:text-slate-300">
                <p>
                  1. Switch to the <strong>Test Console</strong> tab above.
                </p>
                <p>
                  2. Enter your personal phone number with country code (e.g. <code>919876543210</code>) and click <strong>Send Live Test Message</strong>.
                </p>
                <p>
                  3. When the message arrives on your phone, reply with any text (e.g. <em>&quot;Hello TechInPedia&quot;</em>).
                </p>
                <p>
                  4. Navigate to the <strong>Shared Team Inbox</strong> tab — your reply will appear in real time!
                </p>
              </div>
            </div>
          </div>

          {/* Frequently Asked Questions / Troubleshooting */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-violet-600" />
              Frequently Asked Questions & Troubleshooting
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1.5">
                <span className="font-bold text-slate-900 dark:text-white block">
                  Q: Messages are sent successfully, but incoming replies don&apos;t show in Inbox?
                </span>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  Go to Meta Developers ➔ WhatsApp ➔ Configuration ➔ <strong>Webhook fields</strong> and ensure the <strong>messages</strong> field is <strong>Subscribed</strong>. If not, click the Subscribe button.
                </p>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1.5">
                <span className="font-bold text-slate-900 dark:text-white block">
                  Q: Why do I get &quot;Error validating access token&quot; after 24 hours?
                </span>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  You used the 24-hour temporary token from the API Setup page. Follow Step 3 to generate a <strong>Permanent System User Access Token</strong> with &quot;Never&quot; expiration from Meta Business Settings.
                </p>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1.5">
                <span className="font-bold text-slate-900 dark:text-white block">
                  Q: What is the 24-Hour Customer Care Window?
                </span>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  When a customer sends a message, you have 24 hours to reply with any free-form text. Once 24 hours elapse without a customer response, subsequent outbound outreach must use Meta-Approved <strong>Templates</strong>.
                </p>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1.5">
                <span className="font-bold text-slate-900 dark:text-white block">
                  Q: Can I use the same phone number on mobile WhatsApp and the Cloud API?
                </span>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  No, Meta Cloud API requires exclusive control over the phone number. You can delete the account from the mobile WhatsApp app to migrate it to API, or use a new dedicated SIM/virtual number.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: 3-PANE ENTERPRISE SHARED TEAM INBOX */}
      {activeTab === 'inbox' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col lg:flex-row h-[calc(100vh-140px)] min-h-[560px] sm:h-[780px]">
          {/* LEFT PANE: Conversation Threads & 8-Folder Taxonomy */}
          <div className={`w-full lg:w-84 border-r border-slate-200 dark:border-slate-800 flex flex-col shrink-0 bg-slate-50 dark:bg-slate-950/50 ${mobileInboxView === 'list' ? 'flex flex-1 lg:flex-initial' : 'hidden lg:flex'}`}>
            {/* Header with New Chat */}
            <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-xs text-slate-800 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Team Inbox</span>
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Live (3s)
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => openNewChat(inboxSearch)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm shadow-emerald-500/20 transition-all cursor-pointer"
                >
                  <Plus className="w-3 h-3" />
                  <span>New Chat</span>
                </button>
              </div>

              {/* Search input */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={inboxSearch}
                  onChange={(e) => setInboxSearch(e.target.value)}
                  placeholder="Search name, phone, or msg..."
                  className="w-full pl-8 pr-3 py-1.5 border border-slate-200 dark:border-slate-800 rounded-xl text-xs bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
                />
              </div>

              {/* 8-Folder Horizontal Taxonomy Pills */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 pt-0.5 no-scrollbar text-[11px] font-medium">
                {[
                  { id: 'ALL', label: 'All', count: folderMetrics.ALL },
                  { id: 'MY_CHATS', label: 'My Chats', count: folderMetrics.MY_CHATS },
                  { id: 'AWAITING_ACCEPTANCE', label: 'Awaiting My Acceptance', count: folderMetrics.AWAITING_ACCEPTANCE },
                  { id: 'NEW_ASSIGNED', label: 'New Assigned', count: null },
                  { id: 'WAITING_CUSTOMER', label: 'Waiting for Customer', count: folderMetrics.WAITING_CUSTOMER },
                  { id: 'CLOSED', label: 'Resolved', count: folderMetrics.CLOSED },
                  { id: 'UNASSIGNED', label: 'Unassigned', count: folderMetrics.UNASSIGNED },
                  { id: 'UNREAD', label: 'Unread', count: folderMetrics.UNREAD },
                  { id: 'FOLLOWUP_REQUIRED', label: 'Follow-up', count: null },
                  { id: 'HIGH_PRIORITY', label: 'Hot / High', count: folderMetrics.HIGH_PRIORITY },
                ].map((f) => {
                  const isActive = inboxFolder === f.id;
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setInboxFolder(f.id)}
                      className={`px-2.5 py-1 rounded-lg whitespace-nowrap transition-all cursor-pointer flex items-center gap-1 ${
                        isActive
                          ? 'bg-emerald-600 text-white font-bold shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      <span>{f.label}</span>
                      {f.count !== null && f.count !== undefined && (
                        <span className={`text-[10px] px-1 py-0.2 rounded-full ${isActive ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'}`}>
                          {f.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Conversation Cards List */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-200 dark:divide-slate-800">
              {conversations.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-xs space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-xs">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-700 dark:text-slate-200">No chats in this folder</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {inboxSearch ? `No chat matching "${inboxSearch}"` : 'Filter returned 0 conversations.'}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => openNewChat(inboxSearch)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Naya Message Bhejein</span>
                  </button>
                </div>
              ) : (
                conversations.map((c) => {
                  const isSelected = selectedConvId === c.id;
                  return (
                    <button
                      key={c.id}
                      onClick={() => {
                        setSelectedConvId(c.id);
                        setMobileInboxView('chat');
                      }}
                      className={`w-full p-3.5 text-left transition-colors flex items-start gap-3 cursor-pointer ${
                        isSelected ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-l-4 border-emerald-600' : 'hover:bg-slate-100 dark:bg-slate-850'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                        {(c.customerName || 'W').charAt(0).toUpperCase()}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                            {c.customerName || c.waNumber}
                          </span>
                          <span className="text-[10px] text-slate-400 shrink-0">
                            {new Date(c.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5 flex items-center gap-1">
                          {c.lastMessageText?.toLowerCase().includes('sticker') ? (
                            <span className="font-semibold text-amber-600 dark:text-amber-400">🎭 Sticker</span>
                          ) : c.lastMessageText?.toLowerCase().includes('audio') ? (
                            <span className="font-semibold text-blue-600 dark:text-blue-400">🎙️ Voice Note</span>
                          ) : c.lastMessageText?.toLowerCase().includes('image') ? (
                            <span className="font-semibold text-emerald-600 dark:text-emerald-400">🖼️ Photo</span>
                          ) : c.lastMessageText?.toLowerCase().includes('video') ? (
                            <span className="font-semibold text-purple-600 dark:text-purple-400">🎥 Video</span>
                          ) : c.lastMessageText?.toLowerCase().includes('document') ? (
                            <span className="font-semibold text-indigo-600 dark:text-indigo-400">📄 Document</span>
                          ) : (
                            c.lastMessageText || 'No message content'
                          )}
                        </p>

                        <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                          <span className="text-[10px] font-mono text-slate-400">
                            {c.waNumber}
                          </span>

                          {c.priority === 'HIGH' || c.priority === 'URGENT' ? (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300">
                              {c.priority}
                            </span>
                          ) : null}

                          {c.assignedUser && (
                            <span className="flex items-center gap-1 text-[9px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">
                              <span className={`w-1.5 h-1.5 rounded-full ${c.assignmentAcceptedAt ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`}></span>
                              {c.assignedUser.name.split(' ')[0]}
                              {!c.assignmentAcceptedAt && c.assignedAt && (
                                <LiveTimer startTime={c.assignedAt} />
                              )}
                            </span>
                          )}

                          {c.unreadCount > 0 && (
                            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-emerald-600 text-white ml-auto">
                              {c.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* CENTER PANE: Active Chat Thread with Internal Notes & Quick Replies */}
          <div className={`flex-1 flex flex-col bg-slate-50 dark:bg-slate-950 min-w-0 ${mobileInboxView === 'chat' ? 'flex' : 'hidden lg:flex'}`}>
            {selectedConvId ? (
              <>
                {/* Chat Header with 24-Hour Care Window Indicator & Lead Stage Badge */}
                <div className="p-3 sm:p-3.5 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {/* Mobile Back Button to Conversation List */}
                    <button
                      type="button"
                      onClick={() => setMobileInboxView('list')}
                      className="lg:hidden p-1.5 -ml-1 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
                      title="Back to conversation list"
                      aria-label="Back to conversation list"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                          {crmContext?.customer?.name || crmContext?.lead?.name || conversations.find((c) => c.id === selectedConvId)?.customerName || 'WhatsApp Contact'}
                        </h3>
                        {crmContext?.lead?.status && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800 shrink-0">
                            {crmContext.lead.status}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 sm:gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex-wrap">
                        <span className="font-mono text-[11px] sm:text-xs">{conversations.find((c) => c.id === selectedConvId)?.waNumber}</span>
                        <span className="hidden sm:inline">•</span>
                        {is24hActive ? (
                          <span className="px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="hidden sm:inline">24h Window Active (Free text allowed)</span>
                            <span className="sm:hidden">24h Active</span>
                          </span>
                        ) : (
                          <span className="px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span className="hidden sm:inline">24h Window Expired (Template required)</span>
                            <span className="sm:hidden">Expired</span>
                          </span>
                        )}
                        <span className="px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                          <span>Live</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                    {/* Mobile CRM Details Toggle Button */}
                    <button
                      type="button"
                      onClick={() => setMobileInboxView('details')}
                      className="lg:hidden p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-violet-700 dark:text-violet-300 flex items-center gap-1 cursor-pointer"
                      title="View CRM Lead Profile"
                    >
                      <UserCheck className="w-4 h-4" />
                      <span className="text-[11px] hidden sm:inline">CRM</span>
                    </button>
                    {/* AI State Badge & Pause/Resume Toggle */}
                    {(() => {
                      const cur = conversations.find((c) => c.id === selectedConvId);
                      if (!cur) return null;
                      const isAiPaused = Boolean(cur.isAiPaused);
                      return (
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold flex items-center gap-1 ${
                            isAiPaused
                              ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                              : 'bg-violet-500/10 text-violet-400 border border-violet-500/20'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${isAiPaused ? 'bg-amber-500' : 'bg-violet-500 animate-pulse'}`} />
                            {isAiPaused ? 'AI Paused' : 'AI Active'}
                          </span>

                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                await fetch(`/api/whatsapp/conversations/${selectedConvId}/ai-toggle`, {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    pause: !isAiPaused,
                                    action: isAiPaused ? 'RETURN_TO_AI' : 'TAKEOVER',
                                  }),
                                });
                                fetchConversations();
                              } catch (err) {
                                console.error('Error toggling AI:', err);
                              }
                            }}
                            className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition flex items-center gap-1 cursor-pointer ${
                              isAiPaused
                                ? 'bg-violet-600/10 hover:bg-violet-600/20 border-violet-500/30 text-violet-700 dark:text-violet-300'
                                : 'bg-amber-600/10 hover:bg-amber-600/20 border-amber-500/30 text-amber-700 dark:text-amber-300'
                            }`}
                            title={isAiPaused ? 'Return conversation to AI Assistant' : 'Take over this chat (pauses AI)'}
                          >
                            {isAiPaused ? '✨ Return to AI' : '👤 Take Over'}
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setIsCopilotOpen(prev => !prev);
                              handleCopilotSuggest();
                            }}
                            className="px-2.5 py-1 rounded-lg bg-violet-600/10 hover:bg-violet-600/20 border border-violet-500/20 text-violet-600 dark:text-violet-400 text-xs font-semibold flex items-center gap-1 transition"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>AI Assist</span>
                          </button>
                        </div>
                      );
                    })()}

                    <button
                      type="button"
                      onClick={async () => {
                        const current = conversations.find((c) => c.id === selectedConvId);
                        const nextStatus = current?.status === 'OPEN' ? 'CLOSED' : 'OPEN';
                        await fetch('/api/whatsapp/conversations', {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ id: selectedConvId, status: nextStatus }),
                        });
                        fetchConversations();
                      }}
                      className="px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer whitespace-nowrap"
                    >
                      {conversations.find((c) => c.id === selectedConvId)?.status === 'OPEN' ? 'Resolve' : 'Re-open'}
                    </button>
                  </div>
                </div>

                {/* Messages Stream (Supports Inbound, Outbound, & Team Internal Notes) */}
                <div className="flex-1 p-5 overflow-y-auto space-y-3">
                  {/* AI Handoff Alert Banner */}
                  {(() => {
                    const cur = conversations.find((c) => c.id === selectedConvId);
                    if (!cur || !cur.isAiPaused) return null;
                    let parsedSummary: any = null;
                    if ((cur as any).aiStateJson) {
                      try {
                        const state = JSON.parse((cur as any).aiStateJson);
                        parsedSummary = state.handoffSummary;
                      } catch {}
                    }
                    return (
                      <div className="mb-4 p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 text-xs shadow-xs">
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <div className="flex items-center gap-1.5 font-bold text-amber-700 dark:text-amber-300">
                            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                            <span>⚡ Live Human Escalation Brief</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-800 dark:text-amber-200">
                              {cur.assignedTeam || 'Support'}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={async () => {
                              await fetch(`/api/whatsapp/conversations/${cur.id}/ai-toggle`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ pause: false, action: 'RETURN_TO_AI' }),
                              });
                              fetchConversations();
                            }}
                            className="px-2.5 py-1 rounded-lg bg-violet-600 hover:bg-violet-700 text-white font-semibold text-[11px] transition flex items-center gap-1 cursor-pointer"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Return to AI</span>
                          </button>
                        </div>
                        <p className="text-slate-800 dark:text-slate-200 font-medium">
                          <strong>Handoff Reason:</strong> {cur.lastAiHandoffReason || 'Customer requested staff assistance'}
                        </p>
                        {parsedSummary && (
                          <div className="mt-2 pt-2 border-t border-amber-500/20 text-[11px] text-slate-700 dark:text-slate-300 space-y-1">
                            {parsedSummary.interestedPackage && parsedSummary.interestedPackage !== 'None' && (
                              <p>• <strong>Interested Package:</strong> <span className="font-semibold text-emerald-600 dark:text-emerald-400">{parsedSummary.interestedPackage}</span></p>
                            )}
                            {parsedSummary.customerAsked && (
                              <p>• <strong>Customer Asked:</strong> "{parsedSummary.customerAsked}"</p>
                            )}
                            {parsedSummary.aiActions && (
                              <p>• <strong>AI Actions:</strong> {parsedSummary.aiActions}</p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {loadingMessages ? (
                    <div className="text-center py-12 text-slate-400 text-xs">
                      <RefreshCw className="w-6 h-6 mx-auto animate-spin mb-2" />
                      Loading conversation messages...
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 text-xs">
                      No messages in this conversation yet. Send a message or add an internal team note below.
                    </div>
                  ) : (
                    messages.map((m) => {
                      const isInternal = m.type === 'internal_note' || m.status === 'INTERNAL';
                      const isOutbound = m.direction === 'OUTBOUND';

                      if (isInternal) {
                        return (
                          <div key={m.id} className="flex justify-center my-2">
                            <div className="max-w-lg w-full p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs space-y-1 shadow-xs">
                              <div className="flex items-center justify-between text-[11px] font-bold text-amber-800 dark:text-amber-300">
                                <span className="flex items-center gap-1.5">
                                  <Lock className="w-3 h-3 text-amber-600" />
                                  <span>Internal Team Note (Private)</span>
                                </span>
                                <span className="text-[10px] font-normal text-amber-600 dark:text-amber-400">
                                  {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <p className="whitespace-pre-wrap text-slate-800 dark:text-slate-200">{m.textBody}</p>
                            </div>
                          </div>
                        );
                      }

                      const isSticker = m.type === 'sticker' || m.textBody?.toLowerCase().includes('sticker') || (m.mediaUrl && m.mimeType?.includes('webp'));
                      const isAudio = m.type === 'audio' || m.textBody?.toLowerCase().includes('audio') || (m.mediaUrl && m.mimeType?.includes('audio'));
                      const isImage = m.type === 'image' || (m.mediaUrl && m.mimeType?.includes('image'));
                      const isVideo = m.type === 'video' || (m.mediaUrl && m.mimeType?.includes('video'));
                      const isDocument = m.type === 'document' || (m.mediaUrl && m.mimeType?.includes('pdf'));
                      const isReaction = m.type === 'reaction';
                      const isTemplate = m.type === 'template' || !!m.templateName || (m.textBody && m.textBody.startsWith('[Template:'));
                      const resolvedTpl = (m as any).template || templates.find((t) => t.name === (m.templateName || (m.textBody?.startsWith('[Template:') ? m.textBody.replace('[Template: ', '').replace(']', '').trim() : '')));

                      return (
                        <div key={m.id} className={`flex ${isOutbound ? 'justify-end' : 'justify-start'}`}>
                          <div
                            className={`max-w-md p-3.5 rounded-2xl text-xs space-y-1.5 shadow-xs ${
                              isSticker && m.mediaUrl
                                ? 'bg-transparent shadow-none border-0 p-1'
                                : isOutbound
                                ? 'bg-emerald-600 text-white rounded-br-none'
                                : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-bl-none'
                            }`}
                          >
                            {/* Message Source Identity Badge */}
                            <div className="flex items-center gap-1 text-[10px] font-semibold opacity-80 mb-1">
                              {m.direction === 'INBOUND' ? (
                                <span className="text-slate-400">👤 Customer</span>
                              ) : m.senderType === 'BOT' || m.senderType === 'AI' ? (
                                <span className="text-violet-200 flex items-center gap-0.5 font-bold">🤖 AI Assistant</span>
                              ) : m.senderType === 'TEMPLATE' || isTemplate ? (
                                <span className="text-emerald-200 flex items-center gap-0.5 font-bold">📄 Template Dispatch</span>
                              ) : m.senderType === 'SYSTEM' || m.campaignId ? (
                                <span className="text-blue-200 flex items-center gap-0.5">⚡ Automation</span>
                              ) : (
                                <span className="text-emerald-100 flex items-center gap-0.5">👨‍💼 Staff Agent</span>
                              )}
                            </div>

                            {/* 1. Sticker Display */}
                            {isSticker ? (
                              <div className="flex flex-col items-start select-none">
                                {m.mediaUrl ? (
                                  <img
                                    src={m.mediaUrl}
                                    alt="WhatsApp Sticker"
                                    className="w-32 h-32 sm:w-40 sm:h-40 object-contain p-1 rounded-2xl drop-shadow-md hover:scale-105 transition-transform"
                                    loading="lazy"
                                  />
                                ) : (
                                  <div className="flex items-center gap-2 p-2.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200">
                                    <span className="text-2xl">🎭</span>
                                    <span className="font-bold">WhatsApp Sticker</span>
                                  </div>
                                )}
                              </div>
                            ) : isAudio ? (
                              /* 2. Audio Voice Note Display */
                              <div className="space-y-1.5 py-0.5">
                                <div className="flex items-center gap-1.5 font-semibold text-[11px] opacity-90">
                                  <span className="text-base">🎙️</span>
                                  <span>Voice Note</span>
                                </div>
                                {m.mediaUrl ? (
                                  <audio controls src={m.mediaUrl} className="w-full max-w-[240px] sm:max-w-[270px] h-8 rounded-lg" />
                                ) : (
                                  <span className="italic text-[11px] opacity-75">Audio recording</span>
                                )}
                              </div>
                            ) : isImage ? (
                              /* 3. Image Display */
                              <div className="space-y-1">
                                {m.mediaUrl && (
                                  <a href={m.mediaUrl} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-xl group">
                                    <img
                                      src={m.mediaUrl}
                                      alt={m.mediaCaption || 'WhatsApp Image'}
                                      className="max-w-xs max-h-60 object-cover rounded-xl group-hover:scale-[1.02] transition-transform"
                                      loading="lazy"
                                    />
                                  </a>
                                )}
                                {m.textBody && !m.textBody.startsWith('[Received') && (
                                  <p className="whitespace-pre-wrap">{m.textBody}</p>
                                )}
                              </div>
                            ) : isVideo ? (
                              /* 4. Video Display */
                              <div className="space-y-1">
                                {m.mediaUrl && (
                                  <video controls src={m.mediaUrl} className="max-w-xs max-h-60 rounded-xl" />
                                )}
                                {m.textBody && !m.textBody.startsWith('[Received') && (
                                  <p className="whitespace-pre-wrap">{m.textBody}</p>
                                )}
                              </div>
                            ) : isDocument ? (
                              /* 5. Document Display */
                              <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-100/70 dark:bg-slate-700/50">
                                <FileText className="w-5 h-5 text-violet-600 shrink-0" />
                                <div className="min-w-0 flex-1">
                                  <div className="font-semibold text-xs truncate">{m.textBody || 'Document'}</div>
                                  {m.mediaUrl && (
                                    <a href={m.mediaUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] text-violet-600 hover:underline font-bold">
                                      Download Document ↓
                                    </a>
                                  )}
                                </div>
                              </div>
                            ) : isReaction ? (
                              /* 6. Emoji Reaction Display */
                              <div className="text-3xl py-1 text-center select-none">{m.textBody}</div>
                            ) : isTemplate ? (
                              /* 7. WhatsApp Template Display */
                              <div className="space-y-2 select-text">
                                {/* Template Identity Badge */}
                                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-black/15 dark:bg-black/30 text-emerald-100 border border-emerald-400/20 w-fit">
                                  <FileText className="w-3 h-3 text-emerald-300 shrink-0" />
                                  <span>WhatsApp Template: {resolvedTpl?.name || m.templateName || 'Message'}</span>
                                </div>

                                {/* Header (Image or Text) */}
                                {resolvedTpl?.headerType === 'IMAGE' && (resolvedTpl.headerContent || m.mediaUrl) && (
                                  <div className="overflow-hidden rounded-xl border border-white/10">
                                    <img
                                      src={resolvedTpl.headerContent || m.mediaUrl}
                                      alt="Template Header"
                                      className="max-w-xs max-h-48 object-cover rounded-xl"
                                      loading="lazy"
                                    />
                                  </div>
                                )}
                                {resolvedTpl?.headerType === 'TEXT' && resolvedTpl.headerContent && (
                                  <div className="font-bold text-sm text-white leading-snug">
                                    {resolvedTpl.headerContent}
                                  </div>
                                )}

                                {/* Body Content */}
                                <div className="whitespace-pre-wrap text-[13px] leading-relaxed break-words">
                                  {renderFormattedWhatsAppText(
                                    m.textBody && !m.textBody.startsWith('[Template:')
                                      ? m.textBody
                                      : resolvedTpl?.bodyText || m.textBody || '',
                                    isOutbound
                                  )}
                                </div>

                                {/* Footer */}
                                {resolvedTpl?.footerText && (
                                  <div className="text-[11px] text-emerald-100/75 pt-1.5 border-t border-emerald-500/20">
                                    {resolvedTpl.footerText}
                                  </div>
                                )}

                                {/* Interactive Buttons */}
                                {(() => {
                                  let btns: any[] = [];
                                  if (resolvedTpl?.buttonsConfig) {
                                    try {
                                      btns = typeof resolvedTpl.buttonsConfig === 'string'
                                        ? JSON.parse(resolvedTpl.buttonsConfig)
                                        : resolvedTpl.buttonsConfig;
                                    } catch {}
                                  }
                                  if (!Array.isArray(btns) || btns.length === 0) return null;
                                  return (
                                    <div className="space-y-1.5 pt-2 border-t border-emerald-500/25">
                                      {btns.map((btn: any, bIdx: number) => (
                                        <div
                                          key={bIdx}
                                          className="flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-white/15 hover:bg-white/20 dark:bg-black/25 text-white text-xs font-semibold shadow-xs select-none transition-colors"
                                        >
                                          {btn.type === 'URL' ? (
                                            <ExternalLink className="w-3 h-3 opacity-80 shrink-0" />
                                          ) : (
                                            <CornerDownLeft className="w-3 h-3 opacity-80 shrink-0" />
                                          )}
                                          <span>{btn.text}</span>
                                        </div>
                                      ))}
                                    </div>
                                  );
                                })()}
                              </div>
                            ) : (
                              /* 8. Standard Text with WhatsApp Markdown */
                              <p className="whitespace-pre-wrap text-[13px] leading-relaxed break-words">
                                {renderFormattedWhatsAppText(m.textBody, isOutbound)}
                              </p>
                            )}

                            <div className={`flex items-center justify-end gap-1.5 text-[10px] ${isOutbound ? 'text-emerald-100' : 'text-slate-400 dark:text-slate-400'}`}>
                              <span>{new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              {isOutbound && (
                                <span className="font-bold">
                                  {m.status === 'READ' ? '✓✓ Read' : m.status === 'DELIVERED' ? '✓✓' : '✓'}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Quick Replies Menu Dropdown (when activated) */}
                {showQuickReplies && (
                  <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shadow-lg">
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200">
                      <span className="flex items-center gap-1.5 text-violet-600">
                        <Zap className="w-3.5 h-3.5" />
                        <span>Instant Quick Replies (Click to Insert)</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowQuickReplies(false)}
                        className="text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-44 overflow-y-auto">
                      {QUICK_REPLIES.map((qr) => (
                        <button
                          key={qr.shortcut}
                          type="button"
                          onClick={() => {
                            setReplyText(qr.text);
                            setShowQuickReplies(false);
                          }}
                          className="p-2 text-left rounded-xl border border-slate-200 dark:border-slate-800 hover:border-violet-400 hover:bg-violet-50/50 dark:hover:bg-violet-950/40 transition-colors cursor-pointer"
                        >
                          <div className="flex items-center justify-between text-xs font-semibold text-slate-800 dark:text-slate-200">
                            <span>{qr.label}</span>
                            <span className="text-[10px] font-mono text-violet-600 bg-violet-50 dark:bg-violet-900/40 px-1 rounded">{qr.shortcut}</span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">{qr.text}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 24-Hour Customer Care Window Banner */}
                {!is24hActive && (
                  <div className="px-4 py-2.5 bg-amber-50 dark:bg-amber-950/40 border-t border-b border-amber-200 dark:border-amber-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300">
                      <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>
                        <strong>24-Hour Window Expired (Meta Policy):</strong> Direct text is restricted by Meta until customer replies. Send an approved template to re-open chat.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowSendTemplateModal(true)}
                      className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors shrink-0 cursor-pointer self-start sm:self-auto"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Send Template</span>
                    </button>
                  </div>
                )}

                {/* Reply Composer with Mode Switcher (Public WhatsApp vs Team Note) */}
                <div className={`p-3.5 border-t border-slate-200 dark:border-slate-800 transition-colors ${isInternalNoteMode ? 'bg-amber-50/60 dark:bg-amber-950/30' : 'bg-white dark:bg-slate-900'}`}>
                  {/* Mode & Shortcut Toolbar */}
                  <div className="flex items-center justify-between pb-2 mb-2 text-xs">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setIsInternalNoteMode(false)}
                        className={`px-2.5 py-1 rounded-lg font-bold text-xs flex items-center gap-1 transition-all cursor-pointer ${
                          !isInternalNoteMode
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        <MessageSquare className="w-3 h-3" />
                        <span>WhatsApp Reply</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setIsInternalNoteMode(true)}
                        className={`px-2.5 py-1 rounded-lg font-bold text-xs flex items-center gap-1 transition-all cursor-pointer ${
                          isInternalNoteMode
                            ? 'bg-amber-600 text-white shadow-xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        <Lock className="w-3 h-3" />
                        <span>🔒 Internal Team Note</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setShowSendTemplateModal(true)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/60 cursor-pointer transition-colors"
                        title="Send Approved WhatsApp Template"
                      >
                        <FileText className="w-3 h-3" />
                        <span>Template</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowQuickReplies(!showQuickReplies)}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-950/50 cursor-pointer"
                      >
                        <Zap className="w-3 h-3" />
                        <span>Quick Replies</span>
                      </button>
                    </div>
                  </div>

                  {/* Quick Emoji Bar & All Emojis Toggle */}
                  <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-2 text-base select-none">
                    <button
                      type="button"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className={`p-1.5 px-2.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
                        showEmojiPicker
                          ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700 shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                      title="Toggle Emoji Picker"
                    >
                      <Smile className="w-3.5 h-3.5 text-amber-500" />
                      <span className="text-[11px] font-bold">Emojis</span>
                    </button>
                    {POPULAR_EMOJIS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setReplyText((prev) => prev + emoji)}
                        className="p-1 px-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-transform hover:scale-125 active:scale-95 cursor-pointer shrink-0 text-base"
                        title={`Insert ${emoji}`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>

                  {/* Expanded Emoji Category Popover */}
                  {showEmojiPicker && (
                    <div className="mb-2 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl space-y-2 animate-in fade-in slide-in-from-bottom-2">
                      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
                        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                          {EMOJI_CATEGORIES.map((cat, idx) => (
                            <button
                              key={cat.name}
                              type="button"
                              onClick={() => setSelectedEmojiCategory(idx)}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                                selectedEmojiCategory === idx
                                  ? 'bg-violet-600 text-white font-bold shadow-xs'
                                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                              }`}
                            >
                              {cat.name}
                            </button>
                          ))}
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowEmojiPicker(false)}
                          className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-xs p-1 cursor-pointer font-bold"
                        >
                          ✕
                        </button>
                      </div>
                      <div className="grid grid-cols-8 sm:grid-cols-12 gap-1 text-xl p-1 max-h-36 overflow-y-auto">
                        {EMOJI_CATEGORIES[selectedEmojiCategory].emojis.map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => setReplyText((prev) => prev + emoji)}
                            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-transform hover:scale-125 active:scale-95 cursor-pointer select-none text-center"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <form onSubmit={handleSendReply} className="flex items-center gap-2.5">
                    <input
                      type="text"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder={
                        isInternalNoteMode
                          ? '🔒 Add internal team note (visible only to sales/manager, never sent to client)...'
                          : is24hActive
                          ? 'Type WhatsApp reply or click Quick Replies...'
                          : 'Window expired. Use approved template or type reply...'
                      }
                      className={`flex-1 p-2.5 border rounded-xl text-xs focus:ring-2 focus:outline-none transition-colors ${
                        isInternalNoteMode
                          ? 'border-amber-300 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-amber-500/20'
                          : 'border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-emerald-500/20'
                      }`}
                    />
                    <button
                      type="submit"
                      disabled={sendingReply || !replyText.trim()}
                      className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer disabled:opacity-50 text-white ${
                        isInternalNoteMode
                          ? 'bg-amber-600 hover:bg-amber-700'
                          : 'bg-emerald-600 hover:bg-emerald-700'
                      }`}
                    >
                      {isInternalNoteMode ? <Lock className="w-3 h-3" /> : <Send className="w-3 h-3" />}
                      <span>{sendingReply ? 'Saving...' : isInternalNoteMode ? 'Save Note' : 'Send'}</span>
                    </button>
                  {/* AI Co-Pilot Slide-over Panel */}
                  {isCopilotOpen && (
                    <div className="p-4 bg-violet-50/80 dark:bg-violet-950/30 border-t border-violet-200 dark:border-violet-800/50 space-y-3 animate-in fade-in">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                          <h4 className="text-xs font-bold text-violet-900 dark:text-violet-200 uppercase tracking-wider">
                            AI Assistant Co-Pilot
                          </h4>
                          {copilotLoading && <RefreshCw className="w-3 h-3 text-violet-500 animate-spin" />}
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsCopilotOpen(false)}
                          className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-xs font-bold p-1 cursor-pointer"
                        >
                          ✕
                        </button>
                      </div>

                      {/* Quick Actions */}
                      <div className="flex flex-wrap items-center gap-2 text-[11px]">
                        <button
                          type="button"
                          onClick={handleCopilotSuggest}
                          disabled={copilotLoading}
                          className="px-2.5 py-1 rounded-lg bg-violet-600 hover:bg-violet-700 text-white font-medium transition cursor-pointer"
                        >
                          💡 Suggest Next Replies
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCopilotRewrite('SHORTER')}
                          disabled={copilotLoading || !replyText.trim()}
                          className="px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-medium transition cursor-pointer"
                        >
                          ✂️ Make Shorter
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCopilotRewrite('PROFESSIONAL')}
                          disabled={copilotLoading || !replyText.trim()}
                          className="px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-medium transition cursor-pointer"
                        >
                          👔 More Professional
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCopilotRewrite('SALES_CONSULTATIVE')}
                          disabled={copilotLoading || !replyText.trim()}
                          className="px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-medium transition cursor-pointer"
                        >
                          🎯 Sales Tone
                        </button>
                        <button
                          type="button"
                          onClick={handleCopilotSummarize}
                          disabled={copilotLoading}
                          className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition cursor-pointer"
                        >
                          📑 Summarize Chat
                        </button>
                      </div>

                      {/* Suggestions list */}
                      {copilotSuggestions.length > 0 && (
                        <div className="space-y-1.5 pt-1">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                            Click to insert suggested reply:
                          </span>
                          {copilotSuggestions.map((sug, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => setReplyText(sug)}
                              className="w-full text-left p-2 rounded-xl bg-white dark:bg-slate-900 border border-violet-200 dark:border-violet-900/50 hover:border-violet-500 text-xs text-slate-800 dark:text-slate-200 transition cursor-pointer shadow-xs"
                            >
                              "{sug}"
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Conversation Summary Box */}
                      {copilotSummary && (
                        <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-violet-200 dark:border-violet-900/50 text-xs space-y-1 shadow-xs">
                          <div className="flex items-center justify-between font-bold text-violet-900 dark:text-violet-200">
                            <span>Chat Summary</span>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300">
                              {copilotSummary.sentiment} Sentiment
                            </span>
                          </div>
                          <p className="text-slate-700 dark:text-slate-300 text-[11px]">{copilotSummary.summary}</p>
                          <div className="pt-1 text-[11px] text-slate-500 flex items-center justify-between">
                            <span>Need: <strong>{copilotSummary.customerNeed}</strong></span>
                            <span>Next: <strong>{copilotSummary.nextAction}</strong></span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  </form>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 space-y-4">
                <div className="w-16 h-16 rounded-3xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-inner">
                  <MessageSquare className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800 dark:text-white">WhatsApp Team Inbox</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
                    Select an existing conversation from the left or start a new WhatsApp chat with any phone number.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => setMobileInboxView('list')}
                    className="lg:hidden flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>View Conversation List</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => openNewChat(inboxSearch)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 cursor-pointer transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Start New Conversation / Naya Message Bhejein</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT PANE: 360° Lead/Customer CRM Command Hub */}
          {selectedConvId && (
            <div className={`w-full lg:w-88 border-l border-slate-200 dark:border-slate-800 p-4 bg-white dark:bg-slate-900 space-y-4 overflow-y-auto shrink-0 ${mobileInboxView === 'details' ? 'block flex-1 lg:flex-initial' : 'hidden lg:block'}`}>
              {/* Mobile Back Button to Chat */}
              <div className="lg:hidden flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-2">
                <button
                  type="button"
                  onClick={() => setMobileInboxView('chat')}
                  className="flex items-center gap-1.5 text-xs font-bold text-violet-600 dark:text-violet-400 hover:text-violet-700 cursor-pointer p-1 -ml-1 rounded-lg"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Back to Conversation</span>
                </button>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Lead CRM 360</span>
              </div>
              {/* Profile Card */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                      {crmContext?.customer?.name || crmContext?.lead?.name || 'WhatsApp Contact'}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {crmContext?.lead?.company || crmContext?.contact?.company?.name || 'Independent Client'}
                    </p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                    {crmContext?.customer ? 'Customer' : 'CRM Lead'}
                  </span>
                </div>

                <div className="space-y-1 text-xs text-slate-600 dark:text-slate-300 pt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Phone:</span>
                    <span className="font-mono">{conversations.find((c) => c.id === selectedConvId)?.waNumber}</span>
                  </div>
                  {crmContext?.lead?.email && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Email:</span>
                      <span className="truncate max-w-[170px]">{crmContext.lead.email}</span>
                    </div>
                  )}
                  {crmContext?.lead?.source && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Source:</span>
                      <span className="font-semibold text-violet-600 dark:text-violet-400">{crmContext.lead.source}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 1. In-Chat Lead Stage Switcher */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                  Lead Pipeline Stage
                </label>
                <select
                  value={crmContext?.lead?.status || 'NEW'}
                  disabled={updatingLeadStage}
                  onChange={(e) => handleUpdateLeadStage(e.target.value)}
                  className="w-full p-2 border border-slate-300 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-950 text-xs font-bold text-violet-700 dark:text-violet-300 focus:ring-2 focus:ring-violet-500/20 cursor-pointer"
                >
                  {LEAD_STAGES.map((s) => (
                    <option key={s.key} value={s.key}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. Priority, Temperature & Lead Score */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-[10px] font-semibold text-slate-400 block mb-1">Priority</label>
                  <select
                    value={conversations.find((c) => c.id === selectedConvId)?.priority || 'MEDIUM'}
                    onChange={(e) => handleUpdateLeadPriority(e.target.value)}
                    className="w-full p-1.5 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-950 text-xs cursor-pointer"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-semibold text-slate-400 block mb-1">Temperature</label>
                  <select
                    value={crmContext?.lead?.temperature || 'WARM'}
                    onChange={(e) => handleUpdateLeadTemperature(e.target.value)}
                    className="w-full p-1.5 border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-950 text-xs cursor-pointer"
                  >
                    <option value="COLD">❄️ Cold</option>
                    <option value="WARM">🌤️ Warm</option>
                    <option value="HOT">🔥 Hot</option>
                  </select>
                </div>
              </div>

              {/* 3. Estimated Deal Value */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                  Estimated Deal Value (₹)
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-semibold">₹</span>
                    <input
                      type="number"
                      value={estimatedValueInput}
                      onChange={(e) => setEstimatedValueInput(e.target.value)}
                      placeholder="e.g. 75000"
                      className="w-full pl-6 pr-2 py-1.5 border border-slate-200 dark:border-slate-800 rounded-xl text-xs bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleSaveEstimatedValue}
                    disabled={savingValue}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    {savingValue ? '...' : 'Save'}
                  </button>
                </div>
              </div>

              {/* Acceptance SLA Banner */}
              {(() => {
                const selectedConv = conversations.find(c => c.id === selectedConvId);
                if (!selectedConv || !selectedConv.assignedUserId) return null;
                
                return (
                  <div className={`p-3 rounded-xl border flex flex-col gap-3 ${
                    selectedConv.assignmentAcceptedAt 
                      ? 'bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-900/30' 
                      : 'bg-amber-50/80 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/50'
                  }`}>
                    <div className="flex items-center gap-3">
                      <div className={`p-1.5 rounded-full ${selectedConv.assignmentAcceptedAt ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30' : 'bg-amber-100 text-amber-600 dark:bg-amber-900/50 animate-pulse'}`}>
                        {selectedConv.assignmentAcceptedAt ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                      </div>
                      <div className="flex-1">
                        <p className={`text-xs font-semibold ${selectedConv.assignmentAcceptedAt ? 'text-emerald-800 dark:text-emerald-400' : 'text-amber-800 dark:text-amber-400'}`}>
                          {selectedConv.assignmentAcceptedAt ? 'Chat Accepted' : 'Awaiting Acceptance'}
                        </p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {selectedConv.assignedAt && (
                            <>Assigned at: {new Date(selectedConv.assignedAt).toLocaleTimeString()}</>
                          )}
                        </p>
                      </div>
                    </div>
                    {!selectedConv.assignmentAcceptedAt && (
                      <button
                        onClick={() => handleAcceptConversation(selectedConv.id)}
                        disabled={acceptingConversation}
                        className="w-full py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-lg shadow-sm disabled:opacity-50 transition-colors"
                      >
                        {acceptingConversation ? 'Accepting...' : 'Accept Conversation'}
                      </button>
                    )}
                  </div>
                );
              })()}

              {/* 4. Assigned Sales Executive */}
              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                    Assigned Executive
                  </label>
                  {currentUser && (currentUser.id || currentUser.userId) && conversations.find((c) => c.id === selectedConvId)?.assignedUserId !== (currentUser.id || currentUser.userId) && (
                    <button
                      type="button"
                      onClick={async () => {
                        const myId = currentUser.id || currentUser.userId;
                        const myMember = teamUsers.find((u) => u.id === myId) || currentUser;
                        setConversations((prev) =>
                          prev.map((c) =>
                            c.id === selectedConvId
                              ? {
                                  ...c,
                                  assignedUserId: myId,
                                  assignedUser: { id: myId, name: myMember.name, email: myMember.email, companyRole: myMember.companyRole },
                                }
                              : c
                          )
                        );
                        await fetch('/api/whatsapp/conversations', {
                          method: 'PATCH',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ id: selectedConvId, assignedUserId: myId }),
                        });
                        fetchConversations(effectiveCompanyId);
                      }}
                      className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer flex items-center gap-0.5"
                    >
                      <span>⚡ Assign to Me</span>
                    </button>
                  )}
                </div>
                <select
                  value={conversations.find((c) => c.id === selectedConvId)?.assignedUserId || ''}
                  onChange={async (e) => {
                    const newAssignedId = e.target.value;
                    const assignedMember = teamUsers.find((u) => u.id === newAssignedId);
                    setConversations((prev) =>
                      prev.map((c) =>
                        c.id === selectedConvId
                          ? {
                              ...c,
                              assignedUserId: newAssignedId || null,
                              assignedUser: assignedMember
                                ? { id: assignedMember.id, name: assignedMember.name, email: assignedMember.email, companyRole: assignedMember.companyRole }
                                : null,
                            }
                          : c
                      )
                    );
                    await fetch('/api/whatsapp/conversations', {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ id: selectedConvId, assignedUserId: newAssignedId }),
                    });
                    fetchConversations(effectiveCompanyId);
                  }}
                  className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-950 text-xs cursor-pointer text-slate-800 dark:text-slate-200 font-medium"
                >
                  <option value="">-- Unassigned --</option>
                  {teamUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.companyRole || u.role})
                    </option>
                  ))}
                </select>
              </div>

              {/* Granular Visibility Control */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80">
                <button
                  type="button"
                  onClick={() => setVisibilityModalOpen(true)}
                  className="flex items-center justify-between w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-800 bg-slate-50/50 dark:bg-slate-900/50 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-purple-600 transition"
                >
                  <span className="flex items-center gap-2">
                    <Shield className="w-3.5 h-3.5 text-purple-600" />
                    Manage Visibility
                  </span>
                  <span className="text-[10px] text-purple-600 font-bold">Configure →</span>
                </button>
              </div>

              {/* 5. Follow-Up Schedule Hub */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-violet-600" />
                    <span>Next Follow-up</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setFollowUpTitle(`Follow-up with ${crmContext?.lead?.name || 'Client'}`);
                      const tomorrow = new Date();
                      tomorrow.setDate(tomorrow.getDate() + 1);
                      setFollowUpDate(tomorrow.toISOString().split('T')[0]);
                      setShowFollowUpModal(true);
                    }}
                    className="text-[11px] font-bold text-violet-600 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Schedule</span>
                  </button>
                </div>

                {crmContext?.followUps && crmContext.followUps.filter((f: any) => f.status === 'PENDING').length > 0 ? (
                  crmContext.followUps
                    .filter((f: any) => f.status === 'PENDING')
                    .slice(0, 2)
                    .map((f: any) => (
                      <div key={f.id} className="p-2.5 rounded-xl bg-violet-50/60 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800 text-xs space-y-1.5">
                        <div className="flex items-center justify-between font-semibold text-slate-800 dark:text-slate-200">
                          <span className="truncate">{f.title}</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-violet-200/60 dark:bg-violet-900/60 text-violet-800 dark:text-violet-200 font-bold">
                            {f.type}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span>{new Date(f.scheduledAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                          <button
                            type="button"
                            onClick={() => handleCompleteFollowUp(f.id)}
                            className="text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-0.5 cursor-pointer"
                          >
                            <CheckSquare className="w-3 h-3" />
                            <span>Done</span>
                          </button>
                        </div>
                      </div>
                    ))
                ) : (
                  <div className="p-2.5 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-slate-400 text-xs">
                    No pending follow-up scheduled.
                  </div>
                )}
              </div>

              {/* 6. Proposals & Quotes Linkage */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Proposals & Quotes</span>
                  </span>
                  <a
                    href={`/admin/quotations?enquiryId=${crmContext?.lead?.id || ''}&clientName=${encodeURIComponent(crmContext?.lead?.name || '')}&clientPhone=${encodeURIComponent(conversations.find((c) => c.id === selectedConvId)?.waNumber || '')}&clientEmail=${encodeURIComponent(crmContext?.lead?.email || '')}`}
                    className="text-[11px] font-bold text-indigo-600 hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>New Quote</span>
                  </a>
                </div>

                {crmContext?.proposals && crmContext.proposals.length > 0 ? (
                  crmContext.proposals.map((p: any) => (
                    <a
                      key={p.id}
                      href="/admin/quotations"
                      className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 block hover:border-indigo-400 transition-colors"
                    >
                      <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
                        <span>{p.proposalNumber}</span>
                        <span className="text-violet-600 font-extrabold">₹{p.grandTotal?.toLocaleString('en-IN') || 0}</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                        <span className="truncate max-w-[120px]">{p.title}</span>
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {p.status}
                        </span>
                      </div>
                    </a>
                  ))
                ) : (
                  <div className="p-2.5 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-slate-400 text-xs">
                    No proposals sent yet.
                  </div>
                )}
              </div>

              {/* 7. Activity Audit Timeline */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80 space-y-2">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <History className="w-3.5 h-3.5 text-slate-400" />
                  <span>Recent Lead Activity</span>
                </span>
                <div className="space-y-2 max-h-40 overflow-y-auto text-xs pr-1">
                  {crmContext?.timeline && crmContext.timeline.length > 0 ? (
                    crmContext.timeline.map((evt: any) => (
                      <div key={evt.id} className="text-[11px] border-l-2 border-slate-200 dark:border-slate-800 pl-2 space-y-0.5">
                        <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                          <span className="truncate">{evt.title}</span>
                          <span className="text-[9px] text-slate-400 shrink-0">
                            {new Date(evt.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        {evt.description && (
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-2">{evt.description}</p>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-[11px] text-slate-400 text-center py-2">
                      No activity events logged yet.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Manage Visibility Modal */}
      {visibilityModalOpen && selectedConvId && (
        <ManageVisibilityModal
          isOpen={true}
          onClose={() => setVisibilityModalOpen(false)}
          resourceType="WHATSAPP_CONVERSATION"
          resourceId={selectedConvId}
          resourceTitle={
            conversations.find((c) => c.id === selectedConvId)?.customerName ||
            conversations.find((c) => c.id === selectedConvId)?.waNumber ||
            'WhatsApp Chat'
          }
          onUpdated={() => {
            fetchConversations(effectiveCompanyId);
          }}
        />
      )}

      {/* INLINE MODAL: SCHEDULE NEXT FOLLOW-UP */}
      {showFollowUpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-violet-600" />
                <span>Schedule Next Follow-Up</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowFollowUpModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleScheduleFollowUp} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Follow-up Title</label>
                <input
                  type="text"
                  value={followUpTitle}
                  onChange={(e) => setFollowUpTitle(e.target.value)}
                  placeholder="e.g. Call client regarding proposal discount"
                  className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl text-xs bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Follow-up Date</label>
                  <input
                    type="date"
                    value={followUpDate}
                    onChange={(e) => setFollowUpDate(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl text-xs bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Time</label>
                  <input
                    type="time"
                    value={followUpTime}
                    onChange={(e) => setFollowUpTime(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl text-xs bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Contact Mode</label>
                <select
                  value={followUpType}
                  onChange={(e) => setFollowUpType(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl text-xs bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white cursor-pointer"
                >
                  <option value="WHATSAPP">💬 WhatsApp Message</option>
                  <option value="CALL">📞 Phone Call</option>
                  <option value="MEETING">🤝 Meeting / Video Call</option>
                  <option value="EMAIL">✉️ Email Follow-up</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Agenda / Notes (Optional)</label>
                <textarea
                  value={followUpNotes}
                  onChange={(e) => setFollowUpNotes(e.target.value)}
                  rows={2}
                  placeholder="Key discussion points..."
                  className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl text-xs bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white resize-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowFollowUpModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-400 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingFollowUp || !followUpDate}
                  className="flex-1 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold shadow-md shadow-violet-500/20 cursor-pointer disabled:opacity-50"
                >
                  {savingFollowUp ? 'Scheduling...' : 'Set Reminder'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 3: TEMPLATES MANAGEMENT */}
      {activeTab === 'templates' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Meta WhatsApp Message Templates</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Official approved templates synchronized directly with Meta WhatsApp Business Account (WABA) for notifications and campaigns.
              </p>
            </div>
            <div className="flex items-center gap-2.5">
              {wabaId && (
                <a
                  href={`https://business.facebook.com/wa/manage/message-templates/?waba_id=${wabaId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                  title="Open Meta WhatsApp Business Manager template console"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Meta Manager
                </a>
              )}
              <button
                onClick={() => handleTabChange('router')}
                className="px-3.5 py-2.5 rounded-xl bg-violet-50 hover:bg-violet-100 dark:bg-violet-950/60 dark:hover:bg-violet-900/60 text-violet-700 dark:text-violet-300 font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                title="Configure dynamic package and purpose routing"
              >
                <GitBranch className="w-3.5 h-3.5" />
                Package & Purpose Router
              </button>
              <button
                onClick={() => {
                  setEditingTemplateId(null);
                  setTplName('');
                  setTplCategory('MARKETING');
                  setTplLanguage('en_US');
                  setTplHeaderType('NONE');
                  setTplHeaderText('');
                  setTplBodyText('');
                  setTplSampleValues({});
                  setTplFooterText('');
                  setTplButtons([]);
                  setCreateTemplateError(null);
                  setCreateTemplateSuccess(null);
                  setShowTplEmojiPicker(false);
                  setShowCreateTemplateModal(true);
                }}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Create Template
              </button>
              <button
                onClick={handleSyncTemplates}
                disabled={syncingTemplates}
                className="px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${syncingTemplates ? 'animate-spin' : ''}`} />
                {syncingTemplates ? 'Syncing...' : 'Sync from Meta WABA'}
              </button>
            </div>
          </div>

          {/* Meta Approval Lifecycle & Status Info Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-violet-50/80 to-blue-50/80 dark:from-violet-950/30 dark:to-blue-950/20 border border-violet-200/80 dark:border-violet-800/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-violet-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    Meta WABA Connected: {connDetails?.displayName || connDetails?.verifiedName || 'Abdiel Aircon'} ({connDetails?.businessPhoneNumber || connDetails?.displayPhoneNumber || '+44 7472 198505'})
                  </h4>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    Verified WABA
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                  All templates created here are submitted directly to Meta Graph API and assigned official Meta IDs. Meta reviews custom templates (typically 5 mins to 24–48 hrs). Click <strong>"Sync from Meta WABA"</strong> or <strong>"Check Status"</strong> anytime to pull live approval updates directly from Meta.
                </p>
              </div>
            </div>
            {wabaId && (
              <a
                href={`https://business.facebook.com/wa/manage/message-templates/?waba_id=${wabaId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-violet-200 dark:border-violet-700 text-violet-700 dark:text-violet-300 hover:bg-violet-50 dark:hover:bg-violet-900/30 text-xs font-bold flex items-center gap-1.5 shrink-0 shadow-xs transition-all"
              >
                <span>View on Meta Manager</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>

          {/* Filters Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search templates..."
                  value={templateSearch}
                  onChange={(e) => setTemplateSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 w-44"
                />
              </div>

              {/* Category Filter */}
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl text-xs overflow-x-auto no-scrollbar max-w-full">
                {['ALL', 'MARKETING', 'UTILITY', 'AUTHENTICATION'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setTemplateFilterCategory(cat)}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-colors shrink-0 ${
                      templateFilterCategory === cat
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-bold'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Status Filter */}
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl text-xs overflow-x-auto no-scrollbar max-w-full">
                {['ALL', 'APPROVED', 'PENDING', 'REJECTED'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setTemplateFilterStatus(st)}
                    className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                      templateFilterStatus === st
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-bold'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            <div className="text-xs text-slate-500 dark:text-slate-400">
              Showing {templates.filter((tpl) => {
                if (templateFilterCategory !== 'ALL' && tpl.category !== templateFilterCategory) return false;
                if (templateFilterStatus !== 'ALL' && tpl.status !== templateFilterStatus) return false;
                if (templateSearch.trim()) {
                  const q = templateSearch.toLowerCase().trim();
                  const matchName = tpl.name?.toLowerCase().includes(q);
                  const matchBody = tpl.bodyText?.toLowerCase().includes(q);
                  if (!matchName && !matchBody) return false;
                }
                return true;
              }).length} of {templates.length} templates
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates
              .filter((tpl) => {
                if (templateFilterCategory !== 'ALL' && tpl.category !== templateFilterCategory) return false;
                if (templateFilterStatus !== 'ALL' && tpl.status !== templateFilterStatus) return false;
                if (templateSearch.trim()) {
                  const q = templateSearch.toLowerCase().trim();
                  const matchName = tpl.name?.toLowerCase().includes(q);
                  const matchBody = tpl.bodyText?.toLowerCase().includes(q);
                  if (!matchName && !matchBody) return false;
                }
                return true;
              })
              .map((tpl) => {
                const vars = JSON.parse(tpl.variablesJson || '[]');
                const buttons = tpl.buttonsConfig ? JSON.parse(tpl.buttonsConfig) : [];
                return (
                  <div key={tpl.id} className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3.5 flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-all">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="font-bold text-sm text-slate-900 dark:text-white break-all">{tpl.name}</span>
                          <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            <span className="font-semibold text-violet-600 dark:text-violet-400">{tpl.category}</span>
                            <span>•</span>
                            <span>{tpl.language}</span>
                          </div>
                          {tpl.metaTemplateId && (
                            <div className="flex items-center gap-1.5 mt-1">
                              <span className="font-mono text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                                Meta ID: {tpl.metaTemplateId}
                              </span>
                            </div>
                          )}
                        </div>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                          tpl.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300' :
                          tpl.status === 'PENDING' ? 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-300 animate-pulse' :
                          tpl.status === 'REJECTED' ? 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {tpl.status === 'PENDING' ? '⏳ META REVIEW' : tpl.status === 'APPROVED' ? '🟢 APPROVED' : tpl.status}
                        </span>
                      </div>

                      {/* Meta Review Notice if Pending */}
                      {tpl.status === 'PENDING' && (
                        <div className="p-2.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/40 text-[11px] space-y-1 text-amber-800 dark:text-amber-200">
                          <div className="flex items-center gap-1.5 font-bold">
                            <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                            <span>Submitted to Meta for Approval</span>
                          </div>
                          <p className="text-[10.5px] leading-relaxed text-amber-700 dark:text-amber-300">
                            Template is undergoing official Meta review (typically takes 5 mins – 24 hrs). Rejection reason: None. Click "Check Status" below to fetch live status.
                          </p>
                        </div>
                      )}

                      {/* Header Content if exists */}
                      {tpl.headerContent && (
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-100 pb-1 border-b border-slate-100 dark:border-slate-800">
                          📌 {tpl.headerContent}
                        </div>
                      )}

                      {/* Template Body Preview */}
                      <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-200 whitespace-pre-wrap font-sans leading-relaxed">
                        {tpl.bodyText}
                      </div>

                      {/* Footer Text if exists */}
                      {tpl.footerText && (
                        <div className="text-[11px] text-slate-400 dark:text-slate-500 italic">
                          {tpl.footerText}
                        </div>
                      )}

                      {/* Action Buttons pills if exists */}
                      {buttons.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {buttons.map((b: any, bIdx: number) => (
                            <span key={bIdx} className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1">
                              {b.type === 'URL' ? '🔗' : b.type === 'PHONE_NUMBER' ? '📞' : '💬'} {b.text}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Rejection reason if available */}
                      {tpl.rejectionReason && (
                        <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-[11px] space-y-0.5">
                          <span className="font-bold flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> Rejection Reason:</span>
                          <p>{tpl.rejectionReason}</p>
                        </div>
                      )}

                      {vars.length > 0 && (
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          <span>Variables: </span>
                          {vars.map((v: string) => (
                            <span key={v} className="font-mono font-bold text-violet-700 dark:text-violet-400 mr-1 bg-violet-50 dark:bg-violet-950 px-1.5 py-0.5 rounded">
                              {`{{${v}}}`}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                      <div className="flex flex-col text-[10px] text-slate-400 leading-tight">
                        <span>Submitted: {new Date(tpl.createdAt).toLocaleDateString()}</span>
                        <span>Synced: {new Date(tpl.lastSyncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {tpl.status === 'PENDING' && (
                          <button
                            onClick={handleSyncTemplates}
                            disabled={syncingTemplates}
                            className="px-2.5 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/40 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-200 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <RefreshCw className={`w-3 h-3 ${syncingTemplates ? 'animate-spin' : ''}`} />
                            Check Status
                          </button>
                        )}
                        {tpl.status === 'APPROVED' && (
                          <button
                            onClick={() => {
                              setTestMessage(tpl.bodyText);
                              setActiveTab('test');
                            }}
                            className="text-violet-600 hover:text-violet-800 dark:text-violet-400 dark:hover:text-violet-300 font-bold hover:underline cursor-pointer text-xs"
                          >
                            Use in Test
                          </button>
                        )}
                        <button
                          onClick={() => handleOpenEditModal(tpl)}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                          title="Edit template content, media header, footer, or action buttons"
                        >
                          <Edit className="w-3 h-3 text-violet-600 dark:text-violet-400" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => handleDeleteTemplate(tpl.id, tpl.name)}
                          disabled={deletingTemplateId === tpl.id}
                          className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 cursor-pointer transition-colors p-1"
                          title="Delete template"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* TAB: DYNAMIC PACKAGE & PURPOSE ROUTER */}
      {activeTab === 'router' && (
        <TemplateRouterManager
          companyId={effectiveCompanyId}
          templates={templates}
          onRefreshTemplates={() => fetchTemplates(false, effectiveCompanyId)}
        />
      )}

      {/* TAB 4: CAMPAIGNS MANAGER */}
      {activeTab === 'campaigns' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">WhatsApp Broadcast Campaigns</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Launch targeted broadcast campaigns using approved Meta templates with audience suppression exclusion.
              </p>
            </div>
            <button
              onClick={() => setShowCampaignModal(true)}
              className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors shrink-0 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Campaign</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {campaigns.map((camp) => (
              <div key={camp.id} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">{camp.name}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{camp.description || 'Targeted WhatsApp Campaign'}</p>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    camp.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700' : 'bg-violet-50 text-violet-700'
                  }`}>
                    {camp.status}
                  </span>
                </div>

                {/* Metrics Breakdown */}
                <div className="grid grid-cols-4 gap-2 text-center text-xs pt-2">
                  <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-950">
                    <span className="text-slate-400 block text-[10px]">Audience</span>
                    <span className="font-bold text-slate-800 text-sm">{camp.validCount}</span>
                  </div>
                  <div className="p-2 rounded-xl bg-blue-50 text-blue-800">
                    <span className="text-blue-600 block text-[10px]">Sent</span>
                    <span className="font-bold text-sm">{camp.sentCount}</span>
                  </div>
                  <div className="p-2 rounded-xl bg-emerald-50 text-emerald-800">
                    <span className="text-emerald-600 block text-[10px]">Delivered</span>
                    <span className="font-bold text-sm">{camp.deliveredCount}</span>
                  </div>
                  <div className="p-2 rounded-xl bg-purple-50 text-purple-800">
                    <span className="text-purple-600 block text-[10px]">Read</span>
                    <span className="font-bold text-sm">{camp.readCount}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                  <span>Source: {camp.audienceSource}</span>
                  <span>Launched: {new Date(camp.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: SUPPRESSION & OPT-OUT */}
      {activeTab === 'suppression' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Opt-Out & Suppression Management</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Contacts on this list are automatically excluded from all outbound campaigns and automated workflows to comply with Meta messaging policies.
            </p>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!suppressPhone) return;
                setAddingSuppress(true);
                try {
                  await fetch('/api/whatsapp/suppression', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ phone: suppressPhone, reason: suppressReason }),
                  });
                  setSuppressPhone('');
                  fetchSuppressions();
                } catch (err: any) {
                  alert(err.message);
                } finally {
                  setAddingSuppress(false);
                }
              }}
              className="flex items-center gap-3 pt-2"
            >
              <input
                type="text"
                value={suppressPhone}
                onChange={(e) => setSuppressPhone(e.target.value)}
                placeholder="Enter phone number to opt-out (e.g. +919818768680)..."
                className="flex-1 p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:ring-2 focus:ring-violet-500/20 focus:outline-none"
              />
              <button
                type="submit"
                disabled={addingSuppress}
                className="px-4 py-2.5 rounded-xl bg-slate-900 text-slate-900 dark:text-white text-xs font-bold shrink-0"
              >
                Add Suppression
              </button>
            </form>
          </div>

          {/* Suppression List */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden text-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left min-w-[640px]">
                <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800/80 font-bold text-slate-600 dark:text-slate-300">
                  <tr>
                    <th className="p-4">Phone Number</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Reason</th>
                    <th className="p-4">Source</th>
                    <th className="p-4">Date</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {suppressions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400">
                        No suppressed phone numbers.
                      </td>
                    </tr>
                  ) : (
                    suppressions.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50 dark:bg-slate-950/50">
                        <td className="p-4 font-mono font-bold text-slate-900 dark:text-white">{s.phone}</td>
                        <td className="p-4">
                          <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 font-bold text-[10px]">
                            {s.status}
                          </span>
                        </td>
                        <td className="p-4 text-slate-600 dark:text-slate-300">{s.reason}</td>
                        <td className="p-4 text-slate-600 dark:text-slate-300">{s.source}</td>
                        <td className="p-4 text-slate-400">{new Date(s.optedOutAt).toLocaleDateString()}</td>
                        <td className="p-4 text-right">
                          <button
                            onClick={async () => {
                              await fetch(`/api/whatsapp/suppression?id=${s.id}`, { method: 'DELETE' });
                              fetchSuppressions();
                            }}
                            className="text-rose-600 hover:text-rose-800 font-semibold cursor-pointer"
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: WEBHOOK EVENT LOGS */}
      {activeTab === 'logs' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden text-xs">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800/80 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Inbound Webhook Event Logs</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Persistent audit of raw incoming Meta events with strict idempotency and retry capabilities.
              </p>
            </div>
            <button
              onClick={fetchLogs}
              className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[640px]">
              <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800/80 font-bold text-slate-600 dark:text-slate-300">
                <tr>
                  <th className="p-4">Meta Event ID</th>
                  <th className="p-4">Event Type</th>
                  <th className="p-4">Sender Phone</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Timestamp</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-mono text-[11px]">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400 font-sans text-xs">
                      No webhook events recorded yet.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50 dark:bg-slate-950/50">
                      <td className="p-4 text-slate-800">{log.metaEventId.slice(0, 20)}...</td>
                      <td className="p-4 text-slate-600 dark:text-slate-300">{log.eventType}</td>
                      <td className="p-4 text-slate-900 dark:text-white font-bold">{log.fromPhone || 'N/A'}</td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold font-sans ${
                          log.status === 'PROCESSED' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                        }`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="p-4 text-slate-400">{new Date(log.createdAt).toLocaleTimeString()}</td>
                      <td className="p-4 text-right font-sans">
                        <button
                          onClick={async () => {
                            setRetryingLogId(log.id);
                            await fetch('/api/whatsapp/webhook/logs', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ eventId: log.id }),
                            });
                            fetchLogs();
                            setRetryingLogId(null);
                          }}
                          className="text-violet-600 hover:text-violet-800 font-bold cursor-pointer"
                        >
                          {retryingLogId === log.id ? 'Retrying...' : 'Retry'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 7: TEST CONSOLE */}
      {activeTab === 'test' && (
        <div className="max-w-xl bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Direct Test Message Console</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Dispatch an official WhatsApp test message directly to your phone number via Meta Graph API v21.0.
            </p>
          </div>

          {/* Active Meta Sender Identity Banner */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Active Sending Account
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                connData?.configured
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
              }`}>
                {connData?.configured ? 'Connected' : 'Not Configured'}
              </span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
              <div>
                <span className="font-bold text-slate-900 dark:text-white">
                  {effectiveCompanyId && connData?.companyName ? connData.companyName : 'TechInPedia Master (Abdiel Aircon)'}
                </span>
                <span className="text-slate-500 dark:text-slate-400 ml-1.5 font-mono text-[11px]">
                  ({connData?.connection?.displayPhoneNumber || connData?.connection?.businessPhoneNumber || 'No Phone Detected'})
                </span>
              </div>
              <span className="font-mono text-[11px] text-slate-600 dark:text-slate-400">
                Phone ID: {connData?.connection?.phoneNumberId || 'Missing'}
              </span>
            </div>
            {!connData?.configured && (
              <p className="text-[11px] text-rose-600 dark:text-rose-400 font-medium">
                ⚠️ WhatsApp API is not yet configured for this account. Messages cannot be dispatched until valid Meta credentials are saved.
              </p>
            )}
          </div>

          {testResult && (
            <div className="space-y-3">
              <div className={`p-4 rounded-xl border text-xs ${
                testResult.success ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300' : 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300'
              }`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold">{testResult.success ? 'Message Sent Successfully!' : 'Dispatch Error'}</span>
                  {testResult.sender && (
                    <span className="font-mono text-[10px] bg-white/80 dark:bg-slate-900/80 px-2 py-0.5 rounded border">
                      Sender: {testResult.sender.displayName || testResult.sender.phone || testResult.sender.companyId || 'Master'}
                    </span>
                  )}
                </div>
                <pre className="font-mono text-[11px] overflow-x-auto whitespace-pre-wrap">{JSON.stringify(testResult, null, 2)}</pre>
              </div>

              {/* Special resolution helper for Meta Error 131030 */}
              {(testResult.error?.includes('131030') || testResult.error?.toLowerCase()?.includes('not in allowed list')) && (
                <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs space-y-2">
                  <div className="flex items-center gap-2 font-bold text-amber-800 dark:text-amber-300 text-sm">
                    <span>💡 Solution for Meta Error #131030 (Recipient Not In Allowed List)</span>
                  </div>
                  <p className="leading-relaxed">
                    Your Meta WhatsApp Business App is currently in <strong>Development / Sandbox Mode</strong>. According to Meta policies, messages can only be sent to numbers that are whitelisted and verified in your Meta Developer Dashboard.
                  </p>
                  <div className="bg-white/80 dark:bg-slate-900/80 p-3 rounded-lg border border-amber-200/60 dark:border-amber-700/60 space-y-1.5 font-sans">
                    <div className="font-bold text-slate-800 dark:text-slate-200">Follow these 4 simple steps (takes ~1 minute):</div>
                    <ol className="list-decimal list-inside space-y-1 text-slate-700 dark:text-slate-300 leading-normal">
                      <li>
                        Log in at{' '}
                        <a href="https://developers.facebook.com/apps/" target="_blank" rel="noopener noreferrer" className="text-violet-600 dark:text-violet-400 font-bold underline inline-flex items-center gap-1">
                          developers.facebook.com <ExternalLink className="w-3 h-3 inline" />
                        </a>{' '}
                        and select your App.
                      </li>
                      <li>In the left sidebar, navigate to <strong>WhatsApp → API Setup</strong>.</li>
                      <li>
                        Under <strong>Step 2: Send and receive messages</strong>, open the <strong>&apos;To&apos;</strong> dropdown and select <strong>&apos;Manage phone number list&apos;</strong>.
                      </li>
                      <li>
                        Enter your phone number <strong>{testPhone || '+918924099779'}</strong> and verify the <strong>6-digit OTP</strong> received via WhatsApp or SMS.
                      </li>
                    </ol>
                  </div>
                  <p className="text-[11px] text-amber-700 dark:text-amber-300">
                    After verification, return here and click &quot;Send Test Message&quot; — your message will be delivered immediately!
                  </p>
                </div>
              )}
            </div>
          )}

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setSendingTest(true);
              setTestResult(null);
              try {
                const res = await fetch('/api/whatsapp/test', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    to: testPhone,
                    message: testMessage,
                    companyId: effectiveCompanyId || undefined,
                  }),
                });
                const data = await res.json();
                setTestResult(data);
              } catch (err: any) {
                setTestResult({ success: false, error: err.message });
              } finally {
                setSendingTest(false);
              }
            }}
            className="space-y-4 text-xs"
          >
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                Recipient Phone Number (with Country Code e.g. +91 98187 68680)
              </label>
              <input
                type="text"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                placeholder="+919818768680"
                required
                className="w-full p-3 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-violet-500/20 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">Message Text</label>
              <textarea
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                rows={4}
                required
                className="w-full p-3 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-violet-500/20 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={sendingTest}
              className="px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-bold flex items-center gap-2 transition-colors shadow-xs"
            >
              <Send className="w-4 h-4" />
              {sendingTest ? 'Sending via Meta API...' : 'Send Live Test Message'}
            </button>
          </form>
        </div>
      )}

      {/* MODAL: RECORD / UPDATE META RECHARGE */}
      {showRechargeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center shadow-xs">
                  <IndianRupee className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Record Meta API Recharge</h3>
                  <p className="text-xs text-slate-500">Sync your Meta Billing Hub prepaid wallet</p>
                </div>
              </div>
              <button onClick={() => setShowRechargeModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRecharge} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-slate-800/60 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setRechargeActionType('ADD')}
                  className={`py-2 rounded-lg font-bold transition-all ${
                    rechargeActionType === 'ADD'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  + Add New Top-up
                </button>
                <button
                  type="button"
                  onClick={() => setRechargeActionType('SET')}
                  className={`py-2 rounded-lg font-bold transition-all ${
                    rechargeActionType === 'SET'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Set Total Balance
                </button>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {rechargeActionType === 'ADD' ? 'Amount Added on Meta (₹) *' : 'Current Meta Wallet Balance (₹) *'}
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3 text-slate-400 font-bold text-sm">₹</span>
                  <input
                    type="number"
                    step="any"
                    value={rechargeAmount}
                    onChange={(e) => setRechargeAmount(e.target.value)}
                    placeholder="e.g. 1000"
                    required
                    className="w-full pl-8 pr-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:outline-none text-base font-bold bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div className="flex items-center gap-2 mt-2">
                  {['500', '1000', '2000', '5000'].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setRechargeAmount(amt)}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-700 dark:text-slate-300 font-semibold text-[11px] border border-slate-200 dark:border-slate-700 transition-colors"
                    >
                      ₹{amt}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Notes / Reference (Optional)</label>
                <input
                  type="text"
                  value={rechargeNotes}
                  onChange={(e) => setRechargeNotes(e.target.value)}
                  placeholder="e.g. Added via HDFC Credit Card on Meta Hub"
                  className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-[11px] text-emerald-800 dark:text-emerald-300 leading-relaxed">
                💡 <strong>Auto-Deduction Engine:</strong> Once saved, TechInPedia will automatically track message delivery and deduct Meta conversation charges (Marketing: ~₹0.78, Utility: ~₹0.11) in real time.
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowRechargeModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingRecharge || !rechargeAmount}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all disabled:opacity-50"
                >
                  {savingRecharge ? 'Saving...' : 'Save & Sync Ledger'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CONNECTION CONFIGURATION */}
      {showConfigModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800/80 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/80 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Configure Meta WhatsApp Business Platform</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Credentials are encrypted at rest with AES-256-GCM.
                </p>
              </div>
              <button onClick={() => setShowConfigModal(false)} className="text-slate-400 hover:text-slate-600 dark:text-slate-300">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-violet-50 dark:bg-violet-950/40 p-3 rounded-xl border border-violet-200 dark:border-violet-800/60 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-violet-800 dark:text-violet-300">
                <BookOpen className="w-4 h-4 shrink-0 text-violet-600" />
                <span>Need help finding your credentials and access tokens?</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowConfigModal(false);
                  setActiveTab('guide');
                }}
                className="text-violet-700 dark:text-violet-300 hover:text-violet-900 font-bold underline shrink-0"
              >
                View Setup Guide ➔
              </button>
            </div>

            <form onSubmit={handleSaveConnection} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">Phone Number ID *</label>
                <input
                  type="text"
                  value={formPhoneId}
                  onChange={(e) => setFormPhoneId(e.target.value)}
                  placeholder="e.g. 109283746592019"
                  required
                  className="w-full p-3 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-violet-500/20 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">System User Access Token *</label>
                <input
                  type="password"
                  value={formToken}
                  onChange={(e) => setFormToken(e.target.value)}
                  placeholder="EAAG... (Permanent System User Token)"
                  required
                  className="w-full p-3 border border-slate-200 dark:border-slate-800 rounded-xl font-mono focus:ring-2 focus:ring-violet-500/20 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">WABA ID (Business Account ID)</label>
                  <input
                    type="text"
                    value={formWabaId}
                    onChange={(e) => setFormWabaId(e.target.value)}
                    placeholder="e.g. 987654321098765"
                    className="w-full p-3 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-violet-500/20 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">Meta App ID</label>
                  <input
                    type="text"
                    value={formAppId}
                    onChange={(e) => setFormAppId(e.target.value)}
                    placeholder="e.g. 1234567890"
                    className="w-full p-3 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-violet-500/20 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">Meta App Secret (for HMAC Webhook Verification)</label>
                <input
                  type="password"
                  value={formSecret}
                  onChange={(e) => setFormSecret(e.target.value)}
                  placeholder="Optional but recommended for cryptographic validation"
                  className="w-full p-3 border border-slate-200 dark:border-slate-800 rounded-xl font-mono focus:ring-2 focus:ring-violet-500/20 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">Webhook Verify Token</label>
                <input
                  type="text"
                  value={formVerifyToken}
                  onChange={(e) => setFormVerifyToken(e.target.value)}
                  className="w-full p-3 border border-slate-200 dark:border-slate-800 rounded-xl font-mono focus:ring-2 focus:ring-violet-500/20 focus:outline-none"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between">
                <button
                  type="button"
                  onClick={async () => {
                    if (confirm('Disconnect Meta WhatsApp integration?')) {
                      await fetch('/api/whatsapp/connection', { method: 'DELETE' });
                      setShowConfigModal(false);
                      fetchConnection();
                    }
                  }}
                  className="text-rose-600 hover:text-rose-800 font-semibold text-xs"
                >
                  Disconnect Account
                </button>

                <button
                  type="submit"
                  disabled={savingConn}
                  className="px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-bold flex items-center gap-2 transition-colors shadow-xs"
                >
                  <ShieldCheck className="w-4 h-4" />
                  {savingConn ? 'Verifying with Meta...' : 'Connect & Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CONNECTION CONFIGURATION */}
      {tokenExpiredNotice && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center shrink-0">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Meta Access Token Expired
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Meta Cloud API Session expired. Developer temporary tokens expire after 24 hours.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setTokenExpiredNotice(null)}
                className="text-slate-400 hover:text-slate-600 dark:text-slate-300 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 space-y-2.5">
              <p className="font-semibold text-slate-800 dark:text-slate-100">
                Meta Response: <span className="font-mono text-[11px] text-rose-600 dark:text-rose-400">{tokenExpiredNotice}</span>
              </p>
              <div className="text-[11px] text-slate-700 dark:text-slate-300 space-y-1.5 pt-2 border-t border-amber-200/80 dark:border-amber-800/80">
                <p className="font-bold text-amber-800 dark:text-amber-300">How to Generate a Permanent Token (Never Expires):</p>
                <ol className="list-decimal list-inside space-y-1 opacity-90">
                  <li>In Meta Business Manager, go to <strong>Business Settings</strong> ➔ <strong>System Users</strong>.</li>
                  <li>Select your System User and click <strong>Generate Token</strong>.</li>
                  <li>Select Expiration as <strong>Never</strong> and enable <code>whatsapp_business_management</code> & <code>whatsapp_business_messaging</code> permissions.</li>
                  <li>Click Generate Token, copy it, and paste it into Settings using the button below.</li>
                </ol>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setTokenExpiredNotice(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  setTokenExpiredNotice(null);
                  setShowConfigModal(true);
                }}
                className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Open Settings & Paste New Token ➔</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CREATE CAMPAIGN WIZARD */}
      {showCampaignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800/80 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/80 pb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Create WhatsApp Campaign</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Targeted broadcast using approved Meta templates with automatic opt-out suppression.
                </p>
              </div>
              <button onClick={() => setShowCampaignModal(false)} className="text-slate-400 hover:text-slate-600 dark:text-slate-300">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setLaunchingCamp(true);
                try {
                  const res = await fetch('/api/whatsapp/campaigns', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      name: campName,
                      description: campDesc,
                      templateId: campTemplateId,
                      audienceSource: campAudienceSource,
                    }),
                  });
                  const data = await res.json();
                  if (res.ok) {
                    setShowCampaignModal(false);
                    fetchCampaigns();
                  } else {
                    alert(data.error || 'Failed to launch campaign');
                  }
                } catch (err: any) {
                  alert(err.message);
                } finally {
                  setLaunchingCamp(false);
                }
              }}
              className="space-y-4 text-xs"
            >
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">Campaign Name *</label>
                <input
                  type="text"
                  value={campName}
                  onChange={(e) => setCampName(e.target.value)}
                  placeholder="e.g. Q4 Website Modernization Offer"
                  required
                  className="w-full p-3 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-violet-500/20 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">Select Approved Template *</label>
                <select
                  value={campTemplateId}
                  onChange={(e) => setCampTemplateId(e.target.value)}
                  required
                  className="w-full p-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900"
                >
                  <option value="">-- Choose Approved Template --</option>
                  {templates.filter((t) => t.status === 'APPROVED').map((t) => (
                    <option key={t.id} value={t.id}>{t.name} ({t.category})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">Audience Source</label>
                <select
                  value={campAudienceSource}
                  onChange={async (e) => {
                    const src = e.target.value;
                    setCampAudienceSource(src);
                    setPreviewingAudience(true);
                    const res = await fetch('/api/whatsapp/campaigns', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ action: 'AUDIENCE_PREVIEW', audienceSource: src }),
                    });
                    const data = await res.json();
                    setCampAudiencePreview(data);
                    setPreviewingAudience(false);
                  }}
                  className="w-full p-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900"
                >
                  <option value="CRM_LEADS">All CRM Prospective Leads</option>
                  <option value="CONTACTS">CRM Contacts Directory</option>
                  <option value="CUSTOMERS">Active Paying Customers</option>
                </select>
              </div>

              {/* Audience Preview Box */}
              {campAudiencePreview && (
                <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1 text-[11px]">
                  <span className="font-bold text-slate-800 block">Audience Validation:</span>
                  <div className="flex items-center gap-3">
                    <span className="text-emerald-700 font-semibold">Eligible: {campAudiencePreview.validCount}</span>
                    <span className="text-rose-700 font-semibold">Suppressed (Excluded): {campAudiencePreview.suppressedCount}</span>
                    <span className="text-slate-400">Invalid numbers: {campAudiencePreview.invalidCount}</span>
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCampaignModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={launchingCamp || !campName || !campTemplateId}
                  className="px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-bold flex items-center gap-2"
                >
                  <Play className="w-4 h-4" />
                  {launchingCamp ? 'Launching Campaign...' : 'Launch Campaign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREATE META WHATSAPP TEMPLATE */}
      {showCreateTemplateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-5xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800/80 space-y-6 max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-2xl ${editingTemplateId ? 'bg-violet-100 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400' : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'} flex items-center justify-center shadow-xs`}>
                  {editingTemplateId ? <Edit className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {editingTemplateId ? `Edit Meta WhatsApp Template: ${tplName}` : 'Create Meta WhatsApp Template'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {editingTemplateId
                      ? 'Update template message body, media header, footer, and interactive action buttons.'
                      : 'Submit a new message template directly to Meta (WABA) for review and official approval.'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowCreateTemplateModal(false);
                  setEditingTemplateId(null);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Editing Notice Banner */}
            {editingTemplateId && (
              <div className="p-3.5 rounded-2xl bg-violet-50/80 dark:bg-violet-950/40 border border-violet-200 dark:border-violet-800 text-xs text-violet-900 dark:text-violet-200 flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-lg bg-violet-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                  <Edit className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="font-bold">Editing Existing Template:</span> You can update the message text, formatting, dynamic variables, header, footer, and interactive buttons. Your changes will take effect across the team inbox and workflows, and submit updated components to Meta WABA for review.
                </div>
              </div>
            )}

            {/* Error & Success Feedback Alerts */}
            {createTemplateError && (() => {
              const isTokenExpired =
                createTemplateError.includes('access token') ||
                createTemplateError.includes('Session has expired') ||
                createTemplateError.includes('190') ||
                createTemplateError.includes('OAuthException');
              return (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300 text-xs space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-bold flex items-center gap-2 text-rose-700 dark:text-rose-300">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>{isTokenExpired ? 'Meta Access Token Expired' : 'Meta Submission Notice'}</span>
                    </div>
                    {isTokenExpired && (
                      <button
                        type="button"
                        onClick={() => setShowConfigModal(true)}
                        className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer transition-colors"
                      >
                        <Settings className="w-3.5 h-3.5" />
                        <span>Update Token in Settings ➔</span>
                      </button>
                    )}
                  </div>
                  <div className="leading-relaxed font-mono text-[11px] bg-rose-100/60 dark:bg-rose-900/30 p-2.5 rounded-xl border border-rose-200/60 dark:border-rose-800/60 break-words">
                    {createTemplateError}
                  </div>
                  {isTokenExpired && (
                    <div className="p-3 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-rose-200/80 dark:border-rose-800/80 space-y-1.5 text-slate-700 dark:text-slate-300">
                      <p className="font-bold text-rose-700 dark:text-rose-400">
                        How to resolve this error (Permanent Token):
                      </p>
                      <ol className="list-decimal list-inside space-y-1 text-[11px] opacity-90">
                        <li>In Meta Business Manager, go to <strong>Business Settings ➔ System Users</strong>.</li>
                        <li>Select your System User, click <strong>Generate Token</strong>, and choose Expiration as <strong>Never</strong>.</li>
                        <li>Ensure <code>whatsapp_business_messaging</code> and <code>whatsapp_business_management</code> permissions are enabled.</li>
                        <li>Click the <strong>&quot;Update Token in Settings ➔&quot;</strong> button above to paste and save the new token. Your drafted template details will be safely preserved!</li>
                      </ol>
                    </div>
                  )}
                </div>
              );
            })()}

            {createTemplateSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <div className="leading-relaxed font-semibold">{createTemplateSuccess}</div>
              </div>
            )}

            <form onSubmit={handleCreateTemplate} className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* LEFT COLUMN: FORM CONTROLS (7 Cols) */}
                <div className="lg:col-span-7 space-y-4 text-xs">
                  {/* Template Name */}
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                      Template Name * <span className="font-normal text-slate-400 text-[11px]">{editingTemplateId ? '(Fixed identifier on Meta)' : '(lowercase, underscores only)'}</span>
                    </label>
                    <input
                      type="text"
                      value={tplName}
                      disabled={!!editingTemplateId}
                      onChange={(e) => setTplName(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))}
                      placeholder="e.g. quotation_followup_alert"
                      required
                      className={`w-full p-2.5 font-mono border border-slate-200 dark:border-slate-800 rounded-xl ${editingTemplateId ? 'bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 cursor-not-allowed' : 'bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white'} focus:ring-2 focus:ring-emerald-500/20 focus:outline-none`}
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      {editingTemplateId
                        ? 'Template name is a permanent identifier on Meta WABA. Message text, media headers, footer, and interactive action buttons can be updated.'
                        : 'Meta requirement: Only lowercase alphanumeric and underscores (e.g. `client_onboarding_welcome`).'}
                    </span>
                  </div>

                  {/* Category & Language */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                        Category *
                      </label>
                      <select
                        value={tplCategory}
                        onChange={(e) => setTplCategory(e.target.value as any)}
                        className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs cursor-pointer focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
                      >
                        <option value="MARKETING">MARKETING (Promotions & Offers)</option>
                        <option value="UTILITY">UTILITY (Quotes, Updates, Alerts)</option>
                        <option value="AUTHENTICATION">AUTHENTICATION (OTPs)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                        Language * {editingTemplateId && <span className="font-normal text-slate-400 text-[11px]">(Fixed on Meta)</span>}
                      </label>
                      <select
                        value={tplLanguage}
                        disabled={!!editingTemplateId}
                        onChange={(e) => setTplLanguage(e.target.value)}
                        className={`w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl ${editingTemplateId ? 'bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 cursor-not-allowed' : 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white'} text-xs cursor-pointer focus:ring-2 focus:ring-emerald-500/20 focus:outline-none`}
                      >
                        <option value="en_US">English (US) [en_US]</option>
                        <option value="hi">Hindi [hi]</option>
                        <option value="en_GB">English (UK) [en_GB]</option>
                        <option value="es">Spanish [es]</option>
                        <option value="ar">Arabic [ar]</option>
                      </select>
                    </div>
                  </div>

                  {/* Header (Optional) */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-700 dark:text-slate-200">Header (Optional)</span>
                      <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-0.5 rounded-lg border border-slate-200 dark:border-slate-800">
                        <button
                          type="button"
                          onClick={() => setTplHeaderType('NONE')}
                          className={`px-2.5 py-0.5 rounded-md text-[11px] font-semibold cursor-pointer transition ${
                            tplHeaderType === 'NONE'
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                          }`}
                        >
                          None
                        </button>
                        <button
                          type="button"
                          onClick={() => setTplHeaderType('TEXT')}
                          className={`px-2.5 py-0.5 rounded-md text-[11px] font-semibold cursor-pointer transition ${
                            tplHeaderType === 'TEXT'
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                          }`}
                        >
                          Text
                        </button>
                        <button
                          type="button"
                          onClick={() => setTplHeaderType('IMAGE')}
                          className={`px-2.5 py-0.5 rounded-md text-[11px] font-semibold cursor-pointer transition ${
                            tplHeaderType === 'IMAGE'
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                          }`}
                        >
                          Image
                        </button>
                      </div>
                    </div>

                    {tplHeaderType === 'TEXT' && (
                      <div>
                        <input
                          type="text"
                          value={tplHeaderText}
                          onChange={(e) => setTplHeaderText(e.target.value.slice(0, 60))}
                          placeholder={`e.g. ${connData?.connection?.displayName || connData?.companyName || 'Official Update'}`}
                          className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
                        />
                        <span className="text-[10px] text-slate-400 block mt-1">
                          Max 60 characters. Displays in bold at top of WhatsApp bubble.
                        </span>
                      </div>
                    )}

                    {tplHeaderType === 'IMAGE' && (
                      <div className="space-y-2.5 pt-1">
                        <div className="flex flex-col sm:flex-row gap-2">
                          <label className="flex-1 flex items-center justify-center gap-2 p-3 border-2 border-dashed border-emerald-500/40 hover:border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20 rounded-xl cursor-pointer transition text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                            <Upload className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                            <span>{tplHeaderImageFile ? tplHeaderImageFile.name : 'Upload Sample Image (PNG / JPG)'}</span>
                            <input
                              type="file"
                              accept="image/png,image/jpeg,image/jpg,image/webp"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  if (file.size > 5 * 1024 * 1024) {
                                    alert('Image file size must be less than 5MB.');
                                    return;
                                  }
                                  setTplHeaderImageFile(file);
                                  const reader = new FileReader();
                                  reader.onload = () => {
                                    setTplHeaderImagePreview(reader.result as string);
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                            />
                          </label>
                        </div>

                        <div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 mb-1 flex items-center justify-between">
                            <span>Or enter Sample Image Public HTTPS URL:</span>
                            {tplHeaderImagePreview && (
                              <button
                                type="button"
                                onClick={() => {
                                  setTplHeaderImageFile(null);
                                  setTplHeaderImagePreview('');
                                  setTplHeaderImageUrl('');
                                }}
                                className="text-rose-500 hover:text-rose-600 font-bold cursor-pointer text-[10px]"
                              >
                                Clear Image
                              </button>
                            )}
                          </div>
                          <input
                            type="url"
                            value={tplHeaderImageUrl}
                            onChange={(e) => {
                              setTplHeaderImageUrl(e.target.value);
                              if (e.target.value.trim().startsWith('http')) {
                                setTplHeaderImagePreview(e.target.value.trim());
                              }
                            }}
                            placeholder="https://example.com/banner.png"
                            className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
                          />
                        </div>

                        {tplHeaderImagePreview && (
                          <div className="relative rounded-xl overflow-hidden border border-emerald-200 dark:border-emerald-800 bg-slate-100 dark:bg-slate-900 max-h-36 flex items-center justify-center p-1">
                            <img
                              src={tplHeaderImagePreview}
                              alt="Header Preview"
                              className="max-h-32 object-contain rounded-lg"
                            />
                          </div>
                        )}

                        <span className="text-[10px] text-slate-400 block">
                          Meta requirement: PNG or JPEG (max 5MB). Meta requires a sample media file during review to approve media templates.
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Body Text */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-slate-700 dark:text-slate-200 text-xs">
                        Body Text * <span className="font-normal text-slate-400 text-[11px]">({tplBodyText.length}/1024)</span>
                      </label>
                      <button
                        type="button"
                        onClick={handleInsertVariable}
                        className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-bold text-[11px] flex items-center gap-1 cursor-pointer bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800 transition shadow-2xs"
                        title="Add dynamic variable placeholder {{1}}, {{2}}"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Insert Variable
                      </button>
                    </div>

                    {/* Rich Formatting & Emoji Toolbar */}
                    <div className="flex flex-wrap items-center justify-between gap-1.5 p-1.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-t-xl">
                      {/* Left: Text Formatting Controls */}
                      <div className="flex items-center gap-1">
                        {/* Bold Button */}
                        <button
                          type="button"
                          onClick={() => handleInsertFormat('*', '*', 'bold text')}
                          className="px-2 py-1 rounded-md text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800 border border-transparent hover:border-slate-300 dark:hover:border-slate-700 transition flex items-center gap-1 cursor-pointer"
                          title="Bold (*text*)"
                        >
                          <Bold className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Bold</span>
                        </button>

                        {/* Italic Button */}
                        <button
                          type="button"
                          onClick={() => handleInsertFormat('_', '_', 'italic text')}
                          className="px-2 py-1 rounded-md text-xs font-serif italic text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800 border border-transparent hover:border-slate-300 dark:hover:border-slate-700 transition flex items-center gap-1 cursor-pointer"
                          title="Italic (_text_)"
                        >
                          <Italic className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Italic</span>
                        </button>

                        {/* Underline Button */}
                        <button
                          type="button"
                          onClick={() => handleInsertFormat('_', '_', 'underlined text')}
                          className="px-2 py-1 rounded-md text-xs underline underline-offset-2 text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800 border border-transparent hover:border-slate-300 dark:hover:border-slate-700 transition flex items-center gap-1 cursor-pointer"
                          title="Underline / Emphasis (_text_)"
                        >
                          <Underline className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Underline</span>
                        </button>

                        {/* Strikethrough Button */}
                        <button
                          type="button"
                          onClick={() => handleInsertFormat('~', '~', 'strikethrough text')}
                          className="px-2 py-1 rounded-md text-xs line-through text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800 border border-transparent hover:border-slate-300 dark:hover:border-slate-700 transition flex items-center gap-1 cursor-pointer"
                          title="Strikethrough (~text~)"
                        >
                          <Strikethrough className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Strike</span>
                        </button>

                        {/* Monospace Code Button */}
                        <button
                          type="button"
                          onClick={() => handleInsertFormat('```', '```', 'code')}
                          className="px-2 py-1 rounded-md text-xs font-mono text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800 border border-transparent hover:border-slate-300 dark:hover:border-slate-700 transition flex items-center gap-1 cursor-pointer"
                          title="Monospace (```code```)"
                        >
                          <Code className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Mono</span>
                        </button>
                      </div>

                      {/* Right: Emoji Picker Toggle */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setShowTplEmojiPicker(!showTplEmojiPicker)}
                          className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer border ${
                            showTplEmojiPicker
                              ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-700'
                              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/60'
                          }`}
                          title="Insert Emoji"
                        >
                          <Smile className="w-3.5 h-3.5 text-amber-500" />
                          <span>Emojis</span>
                        </button>

                        {/* Emoji Picker Popover */}
                        {showTplEmojiPicker && (
                          <>
                            <div
                              className="fixed inset-0 z-40"
                              onClick={() => setShowTplEmojiPicker(false)}
                            />
                            <div className="absolute right-0 bottom-full mb-1 z-50 w-72 sm:w-80 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl space-y-2.5 animate-in fade-in zoom-in-95 duration-100">
                              <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-800">
                                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                                  <Smile className="w-3.5 h-3.5 text-amber-500" /> WhatsApp Emojis
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setShowTplEmojiPicker(false)}
                                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              {/* Category Selector */}
                              <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
                                {EMOJI_CATEGORIES.map((cat, idx) => (
                                  <button
                                    key={cat.name}
                                    type="button"
                                    onClick={() => setSelectedTplEmojiCategory(idx)}
                                    className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold whitespace-nowrap transition cursor-pointer ${
                                      selectedTplEmojiCategory === idx
                                        ? 'bg-emerald-500 text-white'
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                                    }`}
                                  >
                                    {cat.name.split(' ')[0]}
                                  </button>
                                ))}
                              </div>

                              {/* Emojis Grid */}
                              <div className="grid grid-cols-8 gap-1 max-h-40 overflow-y-auto p-1 bg-slate-50 dark:bg-slate-950/60 rounded-xl">
                                {EMOJI_CATEGORIES[selectedTplEmojiCategory].emojis.map((emoji) => (
                                  <button
                                    key={emoji}
                                    type="button"
                                    onClick={() => {
                                      handleInsertEmoji(emoji);
                                    }}
                                    className="w-8 h-8 rounded-lg flex items-center justify-center text-lg hover:bg-white dark:hover:bg-slate-800 hover:scale-125 transition-transform cursor-pointer"
                                    title={`Insert ${emoji}`}
                                  >
                                    {emoji}
                                  </button>
                                ))}
                              </div>

                              {/* Quick Popular bar inside popover */}
                              <div className="pt-1 border-t border-slate-100 dark:border-slate-800">
                                <span className="text-[10px] text-slate-400 block mb-1">Most Popular:</span>
                                <div className="flex flex-wrap gap-1">
                                  {POPULAR_EMOJIS.slice(0, 10).map((emoji) => (
                                    <button
                                      key={emoji}
                                      type="button"
                                      onClick={() => handleInsertEmoji(emoji)}
                                      className="w-6 h-6 rounded flex items-center justify-center text-sm hover:bg-slate-100 dark:hover:bg-slate-800 hover:scale-110 transition cursor-pointer"
                                    >
                                      {emoji}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Textarea */}
                    <textarea
                      ref={tplBodyRef}
                      value={tplBodyText}
                      onChange={(e) => setTplBodyText(e.target.value.slice(0, 1024))}
                      rows={4}
                      required
                      placeholder="Hi {{1}}, your quotation for {{2}} is ready. Let us know if you have any questions!"
                      className="w-full p-3 border border-t-0 border-slate-200 dark:border-slate-800 rounded-b-xl bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500/20 focus:outline-none leading-relaxed font-sans"
                    />

                    {/* Quick Emojis Strip Below Textarea */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[10px] font-bold text-slate-400">Quick Emojis:</span>
                      {POPULAR_EMOJIS.slice(0, 12).map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => handleInsertEmoji(emoji)}
                          className="w-6 h-6 rounded-md hover:bg-slate-200 dark:hover:bg-slate-800 flex items-center justify-center text-sm transition-transform hover:scale-110 cursor-pointer"
                          title={`Insert ${emoji}`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>

                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      Format text with <code className="text-slate-600 dark:text-slate-300 font-mono font-bold">*bold*</code>, <code className="text-slate-600 dark:text-slate-300 font-mono italic">_italic/underline_</code>, <code className="text-slate-600 dark:text-slate-300 font-mono line-through">~strikethrough~</code>, <code className="text-slate-600 dark:text-slate-300 font-mono">```code```</code>, and <code className="text-slate-600 dark:text-slate-300 font-mono">{`{{1}}`}</code> for dynamic variables.
                    </span>
                  </div>

                  {/* Variable Review Samples (Mandatory for Meta Approval when variables present) */}
                  {detectedTemplateVariables.length > 0 && (
                    <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/80 space-y-2.5">
                      <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold">
                        <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                        <span>Meta Review Samples (Required for Approval)</span>
                      </div>
                      <p className="text-[11px] text-amber-700 dark:text-amber-300/80 leading-relaxed">
                        Meta requires realistic sample values for all dynamic variables to verify message intent during automated review.
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                        {detectedTemplateVariables.map((idx) => (
                          <div key={idx} className="space-y-1">
                            <label className="text-[10px] font-bold text-amber-900 dark:text-amber-200 font-mono">
                              Sample for {`{{${idx}}}`}:
                            </label>
                            <input
                              type="text"
                              value={tplSampleValues[idx] || ''}
                              onChange={(e) =>
                                setTplSampleValues((prev) => ({ ...prev, [idx]: e.target.value }))
                              }
                              placeholder={`e.g. Sample ${idx}`}
                              className="w-full p-2 border border-amber-200 dark:border-amber-800 rounded-lg bg-white dark:bg-slate-900 text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Footer Text (Optional) */}
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                      Footer Text (Optional) <span className="font-normal text-slate-400 text-[11px]">({tplFooterText.length}/60)</span>
                    </label>
                    <input
                      type="text"
                      value={tplFooterText}
                      onChange={(e) => setTplFooterText(e.target.value.slice(0, 60))}
                      placeholder={`e.g. Reply STOP to opt out • ${connData?.connection?.displayName || connData?.companyName || 'Support'}`}
                      className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
                    />
                  </div>

                  {/* Action Buttons (Optional - Max 3) */}
                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-bold text-slate-700 dark:text-slate-200">Interactive Buttons</span>
                        <span className="text-[11px] text-slate-400 block">Up to 3 Quick Replies or Call-to-Actions</span>
                      </div>
                      <button
                        type="button"
                        disabled={tplButtons.length >= 3}
                        onClick={() =>
                          setTplButtons((prev) => [
                            ...prev,
                            { type: 'QUICK_REPLY', text: 'Contact Us' },
                          ])
                        }
                        className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950 dark:border-emerald-800 dark:text-emerald-300 text-[11px] font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      >
                        <Plus className="w-3 h-3" /> Add Button
                      </button>
                    </div>

                    {tplButtons.map((btn, bIdx) => (
                      <div key={bIdx} className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <select
                            value={btn.type}
                            onChange={(e) => {
                              const newType = e.target.value as any;
                              setTplButtons((prev) =>
                                prev.map((b, i) => (i === bIdx ? { ...b, type: newType } : b))
                              );
                            }}
                            className="p-1.5 border border-slate-200 dark:border-slate-800 rounded-lg text-[11px] bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white font-semibold cursor-pointer"
                          >
                            <option value="QUICK_REPLY">Quick Reply</option>
                            <option value="URL">Visit Website (URL)</option>
                            <option value="PHONE_NUMBER">Call Phone Number</option>
                          </select>
                          <button
                            type="button"
                            onClick={() => setTplButtons((prev) => prev.filter((_, i) => i !== bIdx))}
                            className="text-slate-400 hover:text-rose-600 cursor-pointer p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div>
                            <input
                              type="text"
                              value={btn.text}
                              onChange={(e) =>
                                setTplButtons((prev) =>
                                  prev.map((b, i) =>
                                    i === bIdx ? { ...b, text: e.target.value.slice(0, 25) } : b
                                  )
                                )
                              }
                              placeholder="Button Label (max 25)"
                              className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded-lg text-xs bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                            />
                          </div>

                          {btn.type === 'URL' && (
                            <div>
                              <input
                                type="text"
                                value={btn.url || ''}
                                onChange={(e) =>
                                  setTplButtons((prev) =>
                                    prev.map((b, i) => (i === bIdx ? { ...b, url: e.target.value } : b))
                                  )
                                }
                                placeholder="https://techinpedia.com"
                                className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded-lg text-xs bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                              />
                            </div>
                          )}

                          {btn.type === 'PHONE_NUMBER' && (
                            <div>
                              <input
                                type="text"
                                value={btn.phoneNumber || ''}
                                onChange={(e) =>
                                  setTplButtons((prev) =>
                                    prev.map((b, i) =>
                                      i === bIdx ? { ...b, phoneNumber: e.target.value } : b
                                    )
                                  )
                                }
                                placeholder="+919876543210"
                                className="w-full p-2 border border-slate-200 dark:border-slate-800 rounded-lg text-xs bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* RIGHT COLUMN: LIVE WHATSAPP BUBBLE PREVIEW (5 Cols) */}
                <div className="lg:col-span-5 bg-slate-100 dark:bg-slate-950 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-4">
                  <div>
                    {/* Simulated WhatsApp Phone Header */}
                    {(() => {
                      const brandName =
                        connData?.connection?.displayName ||
                        connData?.connection?.verifiedName ||
                        connData?.companyName ||
                        currentUser?.companyName ||
                        (effectiveCompanyId ? 'Company' : 'TechInPedia');
                      const brandInitials = (brandName || 'WA')
                        .split(' ')
                        .filter(Boolean)
                        .slice(0, 3)
                        .map((w: string) => w[0]?.toUpperCase())
                        .join('') || 'WA';

                      return (
                        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-200 dark:border-slate-800">
                          <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-xs uppercase">
                            {brandInitials}
                          </div>
                          <div className="leading-tight">
                            <div className="flex items-center gap-1">
                              <span className="font-bold text-xs text-slate-900 dark:text-white">{brandName}</span>
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 fill-emerald-500 text-white" />
                            </div>
                            <span className="text-[10px] text-slate-400">Official Business Account</span>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Chat Doodle Background Simulation */}
                    <div className="pt-4 pb-2 flex flex-col items-start">
                      {/* WhatsApp Message Bubble */}
                      <div className="bg-white dark:bg-[#1f2c34] rounded-2xl rounded-tl-xs p-3.5 shadow-sm max-w-[95%] border border-slate-100 dark:border-slate-700/50 space-y-2">
                        {/* Header text */}
                        {tplHeaderType === 'TEXT' && tplHeaderText && (
                          <div className="font-bold text-xs text-slate-900 dark:text-white pb-1 border-b border-slate-100 dark:border-slate-700/50">
                            {tplHeaderText}
                          </div>
                        )}

                        {/* Image Header Preview */}
                        {tplHeaderType === 'IMAGE' && (
                          <div className="pb-1.5">
                            {tplHeaderImagePreview || tplHeaderImageUrl ? (
                              <img
                                src={tplHeaderImagePreview || tplHeaderImageUrl}
                                alt="Header Preview"
                                className="w-full max-h-44 object-cover rounded-xl border border-slate-100 dark:border-slate-700/60 shadow-xs"
                              />
                            ) : (
                              <div className="w-full h-32 rounded-xl bg-slate-100 dark:bg-slate-800/80 border-2 border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center gap-1.5 text-slate-400 dark:text-slate-500">
                                <ImageIcon className="w-6 h-6 text-slate-400" />
                                <span className="text-[11px] font-semibold">Image Header (1080 × 1080)</span>
                                <span className="text-[9px]">Sample image preview will appear here</span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Body text with live variable replacements */}
                        <div className="text-xs text-slate-800 dark:text-slate-100 whitespace-pre-wrap leading-relaxed font-sans">
                          {renderPreviewBody()}
                        </div>

                        {/* Footer text */}
                        {tplFooterText && (
                          <div className="text-[10px] text-slate-400 dark:text-slate-500 pt-0.5">
                            {tplFooterText}
                          </div>
                        )}

                        {/* Timestamp & read receipts */}
                        <div className="flex items-center justify-end gap-1 text-[9px] text-slate-400 dark:text-slate-500 pt-0.5">
                          <span>12:45 PM</span>
                          <span className="text-emerald-500 font-bold">✓✓</span>
                        </div>
                      </div>

                      {/* Interactive Buttons Below Bubble */}
                      {tplButtons.length > 0 && (
                        <div className="w-[95%] space-y-1.5 mt-1.5">
                          {tplButtons.map((btn, bIdx) => (
                            <div
                              key={bIdx}
                              className="w-full py-2 px-3 rounded-xl bg-white dark:bg-[#1f2c34] border border-slate-100 dark:border-slate-700/50 text-center text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1.5 shadow-xs"
                            >
                              {btn.type === 'URL' ? '🔗' : btn.type === 'PHONE_NUMBER' ? '📞' : '💬'}
                              <span>{btn.text || 'Action Button'}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Meta Review Info Box */}
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1 text-[11px] text-slate-600 dark:text-slate-300">
                    <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
                      <HelpCircle className="w-3.5 h-3.5 text-violet-600" /> Meta Approval Workflow
                    </span>
                    <p className="text-[10px] text-slate-400 leading-relaxed">
                      Submitted templates enter <strong>PENDING</strong> status. Meta automated review typically completes within 1 to 15 minutes. Once approved, you can immediately send it via Shared Inbox or Campaigns.
                    </p>
                  </div>
                </div>
              </div>

              {/* Modal Actions Footer */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateTemplateModal(false);
                    setEditingTemplateId(null);
                  }}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-semibold cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingTemplate || !tplName.trim() || !tplBodyText.trim()}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-xl ${
                    editingTemplateId
                      ? 'bg-violet-600 hover:bg-violet-700 shadow-violet-500/20'
                      : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20'
                  } text-white font-bold shadow-lg cursor-pointer disabled:opacity-50 transition-all text-xs`}
                >
                  {creatingTemplate ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>{editingTemplateId ? 'Saving & Updating Template...' : 'Submitting to Meta WABA...'}</span>
                    </>
                  ) : (
                    <>
                      {editingTemplateId ? <Edit className="w-4 h-4" /> : <Send className="w-4 h-4" />}
                      <span>{editingTemplateId ? 'Save & Update Template' : 'Submit to Meta for Approval'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: START NEW WHATSAPP CHAT */}
      {showNewChatModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Send className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Start New WhatsApp Chat</h3>
                  <p className="text-xs text-slate-400">Send a new message to start a conversation</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowNewChatModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {newChatError && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300 text-xs space-y-1.5">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4" /> Message Dispatch Notice
                </div>
                <div className="leading-relaxed">{newChatError}</div>
                {newChatError.includes('131030') && (
                  <div className="text-[11px] bg-white/70 dark:bg-slate-900/70 p-2 rounded-lg border border-rose-200 dark:border-rose-700/60 mt-1">
                    💡 <strong>Tip:</strong> Go to developers.facebook.com → WhatsApp → API Setup → &apos;To&apos; dropdown and verify this recipient number.
                  </div>
                )}
              </div>
            )}

            <form onSubmit={handleStartNewChat} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                  Recipient Phone Number *
                </label>
                <input
                  type="text"
                  value={newChatPhone}
                  onChange={(e) => setNewChatPhone(e.target.value)}
                  placeholder="+91 89240 99779"
                  required
                  className="w-full p-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">Country code ke saath dalein (e.g. +91 8924099779 ya +91 98187 68680)</span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                  Client / Contact Name (Optional)
                </label>
                <input
                  type="text"
                  value={newChatName}
                  onChange={(e) => setNewChatName(e.target.value)}
                  placeholder="Client Name or Company"
                  className="w-full p-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                  Message Text *
                </label>
                <textarea
                  value={newChatMessage}
                  onChange={(e) => setNewChatMessage(e.target.value)}
                  rows={4}
                  required
                  placeholder="Type message here..."
                  className="w-full p-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
                />
              </div>

              {templates.length > 0 && (
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                    Or Use Approved Template (Optional)
                  </label>
                  <select
                    value={newChatTemplate}
                    onChange={(e) => {
                      setNewChatTemplate(e.target.value);
                      const t = templates.find((x) => x.name === e.target.value);
                      if (t?.bodyText) setNewChatMessage(t.bodyText);
                    }}
                    className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs cursor-pointer"
                  >
                    <option value="">-- No Template (Custom Text Message) --</option>
                    {templates.map((tpl) => (
                      <option key={tpl.id} value={tpl.name}>{tpl.name} ({tpl.language})</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowNewChatModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-semibold cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={startingChat || !newChatPhone.trim()}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-lg shadow-emerald-500/20 cursor-pointer disabled:opacity-60 transition-all"
                >
                  {startingChat ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  <span>{startingChat ? 'Sending...' : 'Send Message & Open Chat'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: SEND APPROVED TEMPLATE IN CHAT */}
      {showSendTemplateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Send Approved Template</h3>
                  <p className="text-xs text-slate-400">Re-engage contact with official Meta approved HSM template</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowSendTemplateModal(false);
                  setInboxTemplateError(null);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {inboxTemplateError && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300 text-xs space-y-1 leading-relaxed">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0" /> Notice
                </div>
                <div className="whitespace-pre-wrap">{inboxTemplateError}</div>
              </div>
            )}

            <form onSubmit={handleSendInboxTemplate} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                  Select Template *
                </label>
                <select
                  value={inboxSelectedTemplate}
                  onChange={(e) => {
                    setInboxSelectedTemplate(e.target.value);
                    setInboxTemplateParams({});
                    setInboxTemplateError(null);
                  }}
                  required
                  className="w-full p-2.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs cursor-pointer focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
                >
                  <option value="">-- Choose Approved Template --</option>
                  {templates
                    .filter((t) => t.status === 'APPROVED' || !t.status)
                    .map((tpl) => (
                      <option key={tpl.id} value={tpl.name}>
                        {tpl.name} ({tpl.language}) • {tpl.category || 'UTILITY'}
                      </option>
                    ))}
                </select>
              </div>

              {inboxSelectedTemplate === 'hello_world' && (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-300 text-xs space-y-1">
                  <div className="font-bold flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> Meta Policy Notice
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    Meta restricts <strong>hello_world</strong> to sandbox test numbers. For your live number, please use or create a custom business template.
                  </p>
                </div>
              )}

              {/* Template Body Preview */}
              {(() => {
                const tpl = templates.find((t) => t.name === inboxSelectedTemplate);
                if (!tpl) return null;
                const varIndices: string[] = tpl.variablesJson
                  ? (typeof tpl.variablesJson === 'string' ? JSON.parse(tpl.variablesJson) : tpl.variablesJson).map(String)
                  : [];

                return (
                  <div className="space-y-3">
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Message Preview</span>
                      <p className="text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                        {tpl.bodyText || 'No body text.'}
                      </p>
                    </div>

                    {varIndices.length > 0 && (
                      <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                        <span className="font-bold text-slate-700 dark:text-slate-200 block text-[11px]">
                          Fill Template Variables ({varIndices.length})
                        </span>
                        {varIndices.map((idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <span className="font-mono text-violet-600 bg-violet-50 dark:bg-violet-900/40 px-2 py-1 rounded text-xs shrink-0">
                              {`{{${idx}}}`}
                            </span>
                            <input
                              type="text"
                              required
                              placeholder={`Value for variable {{${idx}}}...`}
                              value={inboxTemplateParams[idx] || ''}
                              onChange={(e) =>
                                setInboxTemplateParams({
                                  ...inboxTemplateParams,
                                  [idx]: e.target.value,
                                })
                              }
                              className="flex-1 p-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowSendTemplateModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-semibold cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendingInboxTemplate || !inboxSelectedTemplate}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-lg shadow-emerald-500/20 cursor-pointer disabled:opacity-60 transition-all text-xs"
                >
                  {sendingInboxTemplate ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  <span>{sendingInboxTemplate ? 'Sending Template...' : 'Send Template'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function WhatsAppAdminPageWrapper() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500">Loading WhatsApp Module...</div>}>
      <WhatsAppAdminPage />
    </Suspense>
  );
}
