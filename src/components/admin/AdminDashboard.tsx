import React, { useState, useEffect } from 'react';
import {
  AppData,
  ContactData,
  PortfolioItem,
  Lead,
  AssistantData,
  SmtpConfig,
} from '../../lib/validators.ts';
import { Logo } from '../ui/Logo.tsx';
import {
  Settings,
  FolderKanban,
  Users,
  Bot,
  Mail,
  LogOut,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  Upload,
  RefreshCw,
  Download,
  Search,
  MessageCircle,
  Eye,
  EyeOff,
  ShieldCheck,
  Zap,
} from 'lucide-react';

interface AdminDashboardProps {
  initialData: AppData;
  onAppDataUpdate: (data: AppData) => void;
  onLogout: () => void;
  onBackToSite: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  initialData,
  onAppDataUpdate,
  onLogout,
  onBackToSite,
}) => {
  const [activeTab, setActiveTab] = useState<'contact' | 'portfolio' | 'leads' | 'assistant' | 'email'>('leads');
  const [appData, setAppData] = useState<AppData>(initialData);
  const [leads, setLeads] = useState<Lead[]>(initialData?.leads || []);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [saving, setSaving] = useState(false);

  // Helper for admin auth headers
  const getAuthHeaders = (): Record<string, string> => {
    const headers: Record<string, string> = {};
    try {
      const token = localStorage.getItem('digegain_admin_token');
      if (token) headers['Authorization'] = `Bearer ${token}`;
    } catch {}
    return headers;
  };

  // Leads filter & search
  const [leadSearch, setLeadSearch] = useState('');
  const [leadStatusFilter, setLeadStatusFilter] = useState('all');

  // Portfolio modal
  const [editingItem, setEditingItem] = useState<PortfolioItem | null>(null);
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [projectForm, setProjectForm] = useState({
    title: '',
    category: 'Booking System',
    description: '',
    clientName: '',
    projectUrl: '',
    tags: '',
    featured: false,
  });
  // One uploaded image/video per item
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<{ url: string; type: 'image' | 'video'; name: string } | null>(null);
  const [existingMedia, setExistingMedia] = useState<{ type: 'image' | 'video'; path: string; alt?: string } | null>(null);
  const [uploadProgress, setUploadProgress] = useState(false);

  // Email settings states
  const [testEmailLoading, setTestEmailLoading] = useState(false);
  const [showSmtpPass, setShowSmtpPass] = useState(false);

  const applySmtpPreset = (preset: 'gmail' | 'office365' | 'zoho') => {
    if (preset === 'gmail') {
      setAppData(prev => ({
        ...prev,
        settings: {
          ...prev.settings,
          smtp: {
            host: 'smtp.gmail.com',
            port: 465,
            secure: true,
            user: prev.settings.smtp?.user || prev.settings.notifyEmail || '',
            pass: prev.settings.smtp?.pass || '',
            fromEmail: prev.settings.smtp?.fromEmail || prev.settings.notifyEmail || '',
            fromName: prev.settings.smtp?.fromName || 'DIGEGAIN Project Alerts',
          },
        },
      }));
      showToast('Gmail preset applied! Enter your 16-character App Password.');
    } else if (preset === 'office365') {
      setAppData(prev => ({
        ...prev,
        settings: {
          ...prev.settings,
          smtp: {
            host: 'smtp.office365.com',
            port: 587,
            secure: false,
            user: prev.settings.smtp?.user || '',
            pass: prev.settings.smtp?.pass || '',
            fromEmail: prev.settings.smtp?.fromEmail || '',
            fromName: prev.settings.smtp?.fromName || 'DIGEGAIN Project Alerts',
          },
        },
      }));
      showToast('Office 365 preset applied! Enter your credentials.');
    } else if (preset === 'zoho') {
      setAppData(prev => ({
        ...prev,
        settings: {
          ...prev.settings,
          smtp: {
            host: 'smtp.zoho.com',
            port: 465,
            secure: true,
            user: prev.settings.smtp?.user || '',
            pass: prev.settings.smtp?.pass || '',
            fromEmail: prev.settings.smtp?.fromEmail || '',
            fromName: prev.settings.smtp?.fromName || 'DIGEGAIN Project Alerts',
          },
        },
      }));
      showToast('Zoho Mail preset applied! Enter your credentials.');
    }
  };

  const updateSmtpField = <K extends keyof NonNullable<SmtpConfig>>(field: K, value: NonNullable<SmtpConfig>[K]) => {
    setAppData(prev => {
      const current: NonNullable<SmtpConfig> = prev.settings.smtp || {
        host: '',
        port: 465,
        secure: true,
        user: '',
        pass: '',
        fromEmail: '',
        fromName: 'DIGEGAIN Web Systems',
      };
      return {
        ...prev,
        settings: {
          ...prev.settings,
          smtp: {
            ...current,
            [field]: value,
          },
        },
      };
    });
  };

  // Show Toast Helper
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Fetch full leads list from protected endpoint
  const fetchLeads = async () => {
    try {
      const res = await fetch('/api/admin/leads', {
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setLeads(data);
        }
      }
    } catch (err) {
      console.error('Failed to fetch leads:', err);
    }
  };

  // Fetch full private settings (public /api/appdata intentionally strips
  // notifyEmail + smtp, so admin must load them via the protected endpoint)
  const fetchEmailSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings', {
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      if (res.ok) {
        const settings = await res.json();
        setAppData(prev => ({
          ...prev,
          settings: {
            ...prev.settings,
            ...settings,
            smtp: settings.smtp ?? prev.settings.smtp,
          },
        }));
      }
    } catch (err) {
      console.error('Failed to fetch email settings:', err);
    }
  };

  // Fetch full private assistant config (public /api/appdata strips
  // private knowledge, so admin must load it via the protected endpoint)
  const fetchAssistantConfig = async () => {
    try {
      const res = await fetch('/api/admin/assistant', {
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      if (res.ok) {
        const assistant = await res.json();
        setAppData(prev => ({
          ...prev,
          assistant: {
            ...prev.assistant,
            ...assistant,
            suggestedQuestions: assistant.suggestedQuestions ?? prev.assistant.suggestedQuestions,
            extraKnowledge: assistant.extraKnowledge ?? prev.assistant.extraKnowledge,
          },
        }));
      }
    } catch (err) {
      console.error('Failed to fetch assistant config:', err);
    }
  };

  useEffect(() => {
    fetchLeads();
    fetchEmailSettings();
    fetchAssistantConfig();
  }, []);

  // ═════════════════════════════════════════════════
  // CONTACT INFO SAVE
  // ═════════════════════════════════════════════════
  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/admin/contact', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        credentials: 'include',
        body: JSON.stringify(appData.contact),
      });
      if (!res.ok) throw new Error('Failed to update contact info');
      const result = await res.json();
      const updatedData = { ...appData, contact: result.contact || appData.contact };
      setAppData(updatedData);
      onAppDataUpdate(updatedData);
      showToast('Contact details successfully updated!');
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  // ═════════════════════════════════════════════════
  // PORTFOLIO ACTIONS (One uploaded image or video per item)
  // ═════════════════════════════════════════════════
  const handleSingleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const isVideo = file.type.startsWith('video/') || /\.(mp4|webm)$/i.test(file.name);
      setUploadFile(file);
      setUploadPreview({
        url: URL.createObjectURL(file),
        type: isVideo ? 'video' : 'image',
        name: file.name,
      });
    }
  };

  const handleClearSelectedFile = () => {
    setUploadFile(null);
    setUploadPreview(null);
  };

  const handleCreateOrUpdateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadProgress(true);

    try {
      const formData = new FormData();
      formData.append('title', projectForm.title);
      formData.append('category', projectForm.category);
      formData.append('description', projectForm.description);
      formData.append('clientName', projectForm.clientName);
      formData.append('projectUrl', projectForm.projectUrl);
      formData.append('featured', String(projectForm.featured));
      formData.append(
        'tags',
        JSON.stringify(
          projectForm.tags
            .split(',')
            .map(t => t.trim())
            .filter(Boolean)
        )
      );

      // Single uploaded image or video
      if (uploadFile) {
        formData.append('media', uploadFile);
      } else if (existingMedia) {
        formData.append('existingMedia', JSON.stringify([existingMedia]));
      }

      let res;
      if (editingItem) {
        res = await fetch(`/api/admin/portfolio/${editingItem.id}`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          credentials: 'include',
          body: formData,
        });
      } else {
        res = await fetch('/api/admin/portfolio', {
          method: 'POST',
          headers: getAuthHeaders(),
          credentials: 'include',
          body: formData,
        });
      }

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Project save failed');
      }

      const result = await res.json();
      const updatedItem = result.item || result;

      const nextList = editingItem
        ? appData.portfolio.map(p => (p.id === updatedItem.id ? updatedItem : p))
        : [updatedItem, ...appData.portfolio];
      const updatedData = { ...appData, portfolio: nextList };
      setAppData(updatedData);
      onAppDataUpdate(updatedData);

      showToast(editingItem ? 'Project updated!' : 'New project published!');
      setIsNewProjectModalOpen(false);
      setEditingItem(null);
      setUploadFile(null);
      setUploadPreview(null);
      setExistingMedia(null);
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setUploadProgress(false);
    }
  };

  const handleDeleteProject = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"?`)) return;

    try {
      const res = await fetch(`/api/admin/portfolio/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Delete failed');

      const updatedData = {
        ...appData,
        portfolio: appData.portfolio.filter(p => p.id !== id),
      };
      setAppData(updatedData);
      onAppDataUpdate(updatedData);
      showToast('Project removed');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const openEditModal = (item: PortfolioItem) => {
    setEditingItem(item);
    setProjectForm({
      title: item.title,
      category: item.category,
      description: item.description,
      clientName: item.clientName || '',
      projectUrl: item.projectUrl || '',
      tags: item.tags.join(', '),
      featured: Boolean(item.featured),
    });
    setUploadFile(null);
    setUploadPreview(null);
    setExistingMedia(item.media?.[0] || null);
    setIsNewProjectModalOpen(true);
  };

  const openCreateModal = () => {
    setEditingItem(null);
    setProjectForm({
      title: '',
      category: 'Booking System',
      description: '',
      clientName: '',
      projectUrl: '',
      tags: 'React, TypeScript, Automation',
      featured: false,
    });
    setUploadFile(null);
    setUploadPreview(null);
    setExistingMedia(null);
    setIsNewProjectModalOpen(true);
  };

  // ═════════════════════════════════════════════════
  // LEADS ACTIONS
  // ═════════════════════════════════════════════════
  const handleUpdateLeadStatus = async (id: string, status: 'new' | 'contacted' | 'closed') => {
    // Optimistic update: flip the dropdown immediately for instant feedback.
    const prevStatus = leads.find(l => l.id === id)?.status;
    setLeads(prev => prev.map(l => (l.id === id ? { ...l, status } : l)));

    try {
      const res = await fetch(`/api/admin/leads/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        credentials: 'include',
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Failed to update status');

      showToast(`Lead status updated to ${status}`);
    } catch (err: any) {
      // Roll back to the previous status so the UI never shows a phantom save.
      if (prevStatus) {
        setLeads(prev => prev.map(l => (l.id === id ? { ...l, status: prevStatus } : l)));
      }
      showToast(err.message, 'error');
    }
  };

  const handleDeleteLead = async (id: string) => {
    if (!window.confirm('Delete this lead inquiry?')) return;
    try {
      const res = await fetch(`/api/admin/leads/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to delete lead');
      setLeads(prev => prev.filter(l => l.id !== id));
      showToast('Lead deleted');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleResendLeadEmail = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/leads/${id}/resend`, {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Resend failed');
      showToast('Notification emails resent successfully');
      fetchLeads();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const exportLeadsToCsv = () => {
    if (!leads.length) return;
    const headers = ['ID', 'Date', 'Name', 'Email', 'Phone', 'Service', 'Budget', 'Status', 'EmailStatus', 'Message'];
    const rows = leads.map(l => [
      l.id,
      new Date(l.createdAt).toLocaleDateString(),
      `"${l.name.replace(/"/g, '""')}"`,
      `"${l.email}"`,
      `"${l.phone || ''}"`,
      `"${l.service || ''}"`,
      `"${l.budget || ''}"`,
      l.status,
      l.emailStatus ? `${l.emailStatus.clientConfirmation}/${l.emailStatus.adminNotification}` : 'unknown',
      `"${l.message.replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `digegain-leads-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredLeads = leads.filter(l => {
    const matchStatus = leadStatusFilter === 'all' || l.status === leadStatusFilter;
    const matchSearch =
      leadSearch.trim() === '' ||
      l.name.toLowerCase().includes(leadSearch.toLowerCase()) ||
      l.email.toLowerCase().includes(leadSearch.toLowerCase()) ||
      (l.phone && l.phone.includes(leadSearch)) ||
      (l.service && l.service.toLowerCase().includes(leadSearch.toLowerCase()));
    return matchStatus && matchSearch;
  });

  // ═════════════════════════════════════════════════
  // AI ASSISTANT SAVE
  // ═════════════════════════════════════════════════
  const handleSaveAssistant = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/admin/assistant', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        credentials: 'include',
        body: JSON.stringify(appData.assistant),
      });
      if (!res.ok) throw new Error('Failed to update assistant settings');
      const result = await res.json();
      const updatedData = { ...appData, assistant: result.assistant || appData.assistant };
      setAppData(updatedData);
      onAppDataUpdate(updatedData);
      showToast('AI Assistant settings updated!');
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const addSuggestedQuestion = () => {
    const q = window.prompt('Enter new suggested prompt for the AI:');
    if (q && q.trim()) {
      setAppData(prev => ({
        ...prev,
        assistant: {
          ...prev.assistant,
          suggestedQuestions: [...prev.assistant.suggestedQuestions, q.trim()],
        },
      }));
    }
  };

  const removeSuggestedQuestion = (index: number) => {
    setAppData(prev => ({
      ...prev,
      assistant: {
        ...prev.assistant,
        suggestedQuestions: prev.assistant.suggestedQuestions.filter((_, i) => i !== index),
      },
    }));
  };

  // Persist assistant immediately (used by knowledge add/remove so items are
  // saved + visible even before pressing "Save AI Settings")
  const persistAssistant = async (assistant: AssistantData) => {
    const res = await fetch('/api/admin/assistant', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      credentials: 'include',
      body: JSON.stringify(assistant),
    });
    if (!res.ok) throw new Error('Failed to save knowledge base');
    const result = await res.json();
    const saved = result.assistant || assistant;
    setAppData(prev => {
      const updatedData = { ...prev, assistant: saved };
      onAppDataUpdate(updatedData);
      return updatedData;
    });
    return saved;
  };

  const addKnowledgeItem = async () => {
    const question = window.prompt('Knowledge Question (e.g., What is your cancellation policy?):');
    if (!question?.trim()) return;
    const answer = window.prompt('Answer grounded for AI:');
    if (!answer?.trim()) return;

    const next: AssistantData = {
      ...appData.assistant,
      extraKnowledge: [
        ...(appData.assistant.extraKnowledge || []),
        { id: `k-${Date.now()}`, question: question.trim(), answer: answer.trim(), public: true },
      ],
    };
    // Optimistic UI update
    setAppData(prev => ({ ...prev, assistant: next }));
    try {
      await persistAssistant(next);
      showToast('Knowledge added & saved!');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const removeKnowledgeItem = async (index: number) => {
    if (!window.confirm('Remove this knowledge item?')) return;
    const next: AssistantData = {
      ...appData.assistant,
      extraKnowledge: (appData.assistant.extraKnowledge || []).filter((_, i) => i !== index),
    };
    const prevKnowledge = appData.assistant.extraKnowledge;
    setAppData(prev => ({ ...prev, assistant: next }));
    try {
      await persistAssistant(next);
      showToast('Knowledge removed & saved!');
    } catch (err: any) {
      // Rollback on failure
      setAppData(prev => ({ ...prev, assistant: { ...prev.assistant, extraKnowledge: prevKnowledge } }));
      showToast(err.message, 'error');
    }
  };

  // ═════════════════════════════════════════════════
  // EMAIL SETTINGS & TEST
  // ═════════════════════════════════════════════════
  const handleSaveEmailSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        credentials: 'include',
        body: JSON.stringify(appData.settings),
      });
      if (!res.ok) throw new Error('Failed to update email settings');
      const result = await res.json();
      const updatedData = { ...appData, settings: result.settings || appData.settings };
      setAppData(updatedData);
      onAppDataUpdate(updatedData);
      showToast('Notification email settings saved!');
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSendTestEmail = async () => {
    setTestEmailLoading(true);
    try {
      const res = await fetch('/api/admin/test-email', {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || 'Test email failed');
      showToast('Test email sent! Check recipient inbox.');
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setTestEmailLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
      });
    } finally {
      try {
        localStorage.removeItem('digegain_admin_token');
      } catch {}
      onLogout();
    }
  };

  return (
    <div className="min-h-screen bg-[#040812] text-[#EAF3FF] flex flex-col">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 px-4 py-3 rounded-xl flex items-center gap-2 shadow-2xl text-xs font-semibold ${
            toast.type === 'success'
              ? 'bg-emerald-950/90 text-emerald-200 border border-emerald-500/30'
              : 'bg-red-950/90 text-red-200 border border-red-500/30'
          }`}
        >
          {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-red-400" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Admin Top Header Bar */}
      <header className="bg-[#060D1A] border-b border-white/10 px-6 py-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-6">
          <button
            onClick={onBackToSite}
            className="focus:outline-none cursor-pointer group inline-flex items-center text-left"
            title="Return to Home Page"
            aria-label="Return to Home Page"
          >
            <Logo size="md" variant="full" clickable={false} />
          </button>
          <div className="hidden sm:inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-white/5 text-[11px] font-mono text-slate-400">
            <span>ADMIN ENGINE</span>
            <span className="text-[#0EA5E9]">● ACTIVE</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onBackToSite}
            className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-mono text-slate-300 transition-colors flex items-center gap-1.5"
          >
            <Eye className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">View Live Site</span>
          </button>
          <button
            onClick={handleLogout}
            className="px-3 py-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 border border-red-500/20 text-xs font-mono text-red-300 transition-colors flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* Admin Body */}
      <div className="flex-1 flex flex-col md:flex-row max-w-7xl w-full mx-auto p-4 sm:p-6 gap-6">
        {/* Sidebar Nav */}
        <aside className="w-full md:w-60 flex-shrink-0 space-y-1">
          <button
            onClick={() => setActiveTab('leads')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'leads'
                ? 'bg-gradient-to-r from-[#0284C7] to-[#0EA5E9] text-white shadow-md shadow-[#0284C7]/20'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Users className="w-4 h-4" />
              <span>Client Leads</span>
            </div>
            {leads.filter(l => l.status === 'new').length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-emerald-500 text-black font-bold text-[10px]">
                {leads.filter(l => l.status === 'new').length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('portfolio')}
            className={`w-full flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'portfolio'
                ? 'bg-gradient-to-r from-[#0284C7] to-[#0EA5E9] text-white shadow-md shadow-[#0284C7]/20'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <FolderKanban className="w-4 h-4" />
            <span>Portfolio Showcase</span>
          </button>

          <button
            onClick={() => setActiveTab('contact')}
            className={`w-full flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'contact'
                ? 'bg-gradient-to-r from-[#0284C7] to-[#0EA5E9] text-white shadow-md shadow-[#0284C7]/20'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Contact & NAP</span>
          </button>

          <button
            onClick={() => setActiveTab('assistant')}
            className={`w-full flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'assistant'
                ? 'bg-gradient-to-r from-[#0284C7] to-[#0EA5E9] text-white shadow-md shadow-[#0284C7]/20'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Bot className="w-4 h-4" />
            <span>AI Assistant Config</span>
          </button>

          <button
            onClick={() => setActiveTab('email')}
            className={`w-full flex items-center gap-2.5 px-4 py-3 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'email'
                ? 'bg-gradient-to-r from-[#0284C7] to-[#0EA5E9] text-white shadow-md shadow-[#0284C7]/20'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Mail className="w-4 h-4" />
            <span>Email Settings</span>
          </button>
        </aside>

        {/* Tab Content Panel */}
        <main className="flex-1 glass-panel p-6 rounded-2xl border border-white/10 min-w-0">
          {/* ═════════════════════════════════════════════════
              TAB 1: LEADS
          ═════════════════════════════════════════════════ */}
          {activeTab === 'leads' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
                <div>
                  <h2 className="text-xl font-heading font-bold text-white">
                    Project Leads & Inquiries
                  </h2>
                  <p className="text-xs text-slate-400">
                    Real-time inquiries from website contact form & AI assistant
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={fetchLeads}
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs transition-colors"
                    title="Refresh leads"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                  <button
                    onClick={exportLeadsToCsv}
                    className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-300 hover:text-white transition-colors flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export CSV</span>
                  </button>
                </div>
              </div>

              {/* Filters */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  {['all', 'new', 'contacted', 'closed'].map(st => (
                    <button
                      key={st}
                      onClick={() => setLeadStatusFilter(st)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono uppercase transition-colors ${
                        leadStatusFilter === st
                          ? 'bg-[#0284C7] text-white font-bold'
                          : 'bg-white/5 text-slate-400 hover:text-white'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search leads..."
                    value={leadSearch}
                    onChange={e => setLeadSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-[#060D1A] border border-white/10 text-xs text-white focus:outline-none focus:border-[#0EA5E9]"
                  />
                </div>
              </div>

              {/* Leads List */}
              {filteredLeads.length > 0 ? (
                <div className="space-y-3">
                  {filteredLeads.map(lead => (
                    <div
                      key={lead.id}
                      className="p-4 rounded-xl bg-[#060D1A] border border-white/5 hover:border-white/15 transition-colors space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              lead.status === 'new'
                                ? 'bg-emerald-400'
                                : lead.status === 'contacted'
                                ? 'bg-amber-400'
                                : 'bg-slate-500'
                            }`}
                          />
                          <span className="font-heading font-bold text-sm text-white">
                            {lead.name}
                          </span>
                          <span className="text-xs font-mono text-slate-500">
                            {new Date(lead.createdAt).toLocaleString()}
                          </span>
                          {lead.source === 'ai-assistant' && (
                            <span className="px-1.5 py-0.5 rounded bg-purple-950/60 border border-purple-500/30 text-[10px] font-mono text-purple-300">
                              AI Bot
                            </span>
                          )}
                        </div>

                        {/* Status Controls */}
                        <div className="flex items-center gap-2">
                          <select
                            value={lead.status}
                            onChange={e => handleUpdateLeadStatus(lead.id, e.target.value as any)}
                            className="bg-[#091524] border border-white/10 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-[#0EA5E9]"
                          >
                            <option value="new">Status: New</option>
                            <option value="contacted">Status: Contacted</option>
                            <option value="closed">Status: Closed</option>
                          </select>

                          {(lead.emailStatus?.clientConfirmation === 'failed' || lead.emailStatus?.adminNotification === 'failed') && (
                            <button
                              onClick={() => handleResendLeadEmail(lead.id)}
                              className="px-2 py-1 rounded bg-amber-950/60 border border-amber-500/30 text-[11px] text-amber-300 hover:bg-amber-900/60"
                              title="Resend email notifications"
                            >
                              Resend Email
                            </button>
                          )}

                          <button
                            onClick={() => handleDeleteLead(lead.id)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-white/5 transition-colors"
                            title="Delete lead"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Info & Requirements */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-mono text-slate-400">
                        <div>Email: <a href={`mailto:${lead.email}`} className="text-[#0EA5E9] hover:underline">{lead.email}</a></div>
                        <div>
                          Phone:{' '}
                          {lead.phone ? (
                            <a
                              href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                                `Hi ${lead.name}, thank you for contacting DIGEGAIN regarding your ${lead.service} project.`
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#25D366] hover:underline inline-flex items-center gap-1 font-semibold"
                              title="Chat on WhatsApp"
                            >
                              <span>{lead.phone}</span>
                              <MessageCircle className="w-3 h-3 inline" />
                            </a>
                          ) : (
                            <span className="text-slate-400">N/A</span>
                          )}
                        </div>
                        <div>Service: <span className="text-slate-200">{lead.service}</span></div>
                      </div>

                      <div className="p-3 rounded-lg bg-[#040812] text-xs text-slate-300 leading-relaxed">
                        {lead.message}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-slate-500 text-xs font-mono">
                  No inquiries matching filter criteria.
                </div>
              )}
            </div>
          )}

          {/* ═════════════════════════════════════════════════
              TAB 2: PORTFOLIO MANAGEMENT
          ═════════════════════════════════════════════════ */}
          {activeTab === 'portfolio' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div>
                  <h2 className="text-xl font-heading font-bold text-white">
                    Portfolio Projects
                  </h2>
                  <p className="text-xs text-slate-400">
                    Add, edit, or delete case studies showcased on the public website.
                  </p>
                </div>
                <button
                  onClick={openCreateModal}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#0284C7] to-[#0EA5E9] text-white text-xs font-bold flex items-center gap-1.5 hover:shadow-lg transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Project</span>
                </button>
              </div>

              {/* Projects Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {appData.portfolio.map(p => (
                  <div
                    key={p.id}
                    className="p-4 rounded-xl bg-[#060D1A] border border-white/10 space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="aspect-[16/9] rounded-lg overflow-hidden bg-black/40 relative">
                        {p.media[0] ? (
                          p.media[0].type === 'video' || /\.(mp4|webm)$/i.test(p.media[0].path) ? (
                            <video
                              src={p.media[0].path}
                              muted
                              playsInline
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <img
                              src={p.media[0].path}
                              alt={p.title}
                              className="w-full h-full object-cover"
                            />
                          )
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-600 text-xs font-mono">
                            NO PREVIEW
                          </div>
                        )}
                        <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/70 text-[10px] font-mono text-[#0EA5E9]">
                          {p.category}
                        </span>
                        {p.media[0] && (p.media[0].type === 'video' || /\.(mp4|webm)$/i.test(p.media[0].path)) && (
                          <span className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded bg-black/80 border border-white/10 text-[9px] font-mono text-white">
                            VIDEO
                          </span>
                        )}
                        {p.featured && (
                          <span className="absolute top-2 right-2 px-2 py-0.5 rounded bg-[#EA580C] text-[10px] font-bold text-white">
                            FEATURED
                          </span>
                        )}
                      </div>

                      <div>
                        <h4 className="font-heading font-bold text-base text-white">{p.title}</h4>
                        <div className="text-xs font-mono text-slate-400">{p.clientName}</div>
                        <p className="text-xs text-slate-400 line-clamp-2 mt-1">{p.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-white/5">
                      <div className="flex items-center gap-1 text-[11px] font-mono text-slate-500">
                        <span>{p.tags.slice(0, 2).join(', ')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEditModal(p)}
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-xs transition-colors"
                          title="Edit project"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteProject(p.id, p.title)}
                          className="p-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-300 text-xs transition-colors"
                          title="Delete project"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ═════════════════════════════════════════════════
              TAB 3: CONTACT & NAP INFORMATION
          ═════════════════════════════════════════════════ */}
          {activeTab === 'contact' && (
            <form onSubmit={handleSaveContact} className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div>
                  <h2 className="text-xl font-heading font-bold text-white">
                    Contact Details
                  </h2>
                  <p className="text-xs text-slate-400">
                    Manage the contact information displayed across the public site.
                  </p>
                </div>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#0284C7] to-[#0EA5E9] text-white text-xs font-bold hover:shadow-lg disabled:opacity-50 transition-all"
                >
                  {saving ? 'Saving Changes...' : 'Save All Changes'}
                </button>
              </div>

              {/* Core Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-mono text-slate-300">Company Name</label>
                  <input
                    type="text"
                    value={appData.contact.companyName}
                    onChange={e =>
                      setAppData(prev => ({
                        ...prev,
                        contact: { ...prev.contact, companyName: e.target.value },
                      }))
                    }
                    className="w-full px-3 py-2 rounded-lg bg-[#060D1A] border border-white/10 text-xs text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono text-slate-300">Public Email</label>
                  <input
                    type="email"
                    value={appData.contact.email}
                    onChange={e =>
                      setAppData(prev => ({
                        ...prev,
                        contact: { ...prev.contact, email: e.target.value },
                      }))
                    }
                    className="w-full px-3 py-2 rounded-lg bg-[#060D1A] border border-white/10 text-xs text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono text-slate-300">Phone</label>
                  <input
                    type="text"
                    value={appData.contact.phone}
                    onChange={e =>
                      setAppData(prev => ({
                        ...prev,
                        contact: { ...prev.contact, phone: e.target.value },
                      }))
                    }
                    className="w-full px-3 py-2 rounded-lg bg-[#060D1A] border border-white/10 text-xs text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono text-slate-300">WhatsApp Number (with country code)</label>
                  <input
                    type="text"
                    value={appData.contact.whatsappNumber}
                    onChange={e =>
                      setAppData(prev => ({
                        ...prev,
                        contact: { ...prev.contact, whatsappNumber: e.target.value },
                      }))
                    }
                    className="w-full px-3 py-2 rounded-lg bg-[#060D1A] border border-white/10 text-xs text-white"
                  />
                </div>
              </div>

              {/* WhatsApp Message Preview */}
              <div className="p-4 rounded-xl bg-[#091829] border border-[#25D366]/30 space-y-2">
                <label className="text-xs font-mono text-[#25D366] font-bold block">
                  Default WhatsApp Greeting Message
                </label>
                <input
                  type="text"
                  value={appData.contact.whatsappMessage}
                  onChange={e =>
                    setAppData(prev => ({
                      ...prev,
                      contact: { ...prev.contact, whatsappMessage: e.target.value },
                    }))
                  }
                  className="w-full px-3 py-2 rounded-lg bg-[#060D1A] border border-white/10 text-xs text-white"
                />
                <div className="text-[11px] text-slate-400">
                  Live Link Preview:{' '}
                  <a
                    href={`https://wa.me/${appData.contact.whatsappNumber}?text=${encodeURIComponent(appData.contact.whatsappMessage)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[#25D366] hover:underline"
                  >
                    https://wa.me/{appData.contact.whatsappNumber}?text=...
                  </a>
                </div>
              </div>

              {/* Address */}
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-mono uppercase text-[#0EA5E9]">Physical Address & NAP</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Street Address"
                    value={appData.contact.address.street}
                    onChange={e =>
                      setAppData(prev => ({
                        ...prev,
                        contact: {
                          ...prev.contact,
                          address: { ...prev.contact.address, street: e.target.value },
                        },
                      }))
                    }
                    className="w-full px-3 py-2 rounded-lg bg-[#060D1A] border border-white/10 text-xs text-white"
                  />
                  <input
                    type="text"
                    placeholder="City"
                    value={appData.contact.address.city}
                    onChange={e =>
                      setAppData(prev => ({
                        ...prev,
                        contact: {
                          ...prev.contact,
                          address: { ...prev.contact.address, city: e.target.value },
                        },
                      }))
                    }
                    className="w-full px-3 py-2 rounded-lg bg-[#060D1A] border border-white/10 text-xs text-white"
                  />
                  <input
                    type="text"
                    placeholder="State"
                    value={appData.contact.address.state}
                    onChange={e =>
                      setAppData(prev => ({
                        ...prev,
                        contact: {
                          ...prev.contact,
                          address: { ...prev.contact.address, state: e.target.value },
                        },
                      }))
                    }
                    className="w-full px-3 py-2 rounded-lg bg-[#060D1A] border border-white/10 text-xs text-white"
                  />
                  <input
                    type="text"
                    placeholder="Postal Code"
                    value={appData.contact.address.postalCode}
                    onChange={e =>
                      setAppData(prev => ({
                        ...prev,
                        contact: {
                          ...prev.contact,
                          address: { ...prev.contact.address, postalCode: e.target.value },
                        },
                      }))
                    }
                    className="w-full px-3 py-2 rounded-lg bg-[#060D1A] border border-white/10 text-xs text-white"
                  />
                </div>
              </div>

            </form>
          )}

          {/* ═════════════════════════════════════════════════
              TAB 4: AI ASSISTANT CONFIG
          ═════════════════════════════════════════════════ */}
          {activeTab === 'assistant' && (
            <form onSubmit={handleSaveAssistant} className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div>
                  <h2 className="text-xl font-heading font-bold text-white">
                    AI Assistant Configuration
                  </h2>
                  <p className="text-xs text-slate-400">
                    Controls greeting, suggested questions, and domain knowledge grounded in Gemini.
                  </p>
                </div>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#0284C7] to-[#0EA5E9] text-white text-xs font-bold hover:shadow-lg disabled:opacity-50 transition-all"
                >
                  {saving ? 'Saving...' : 'Save AI Settings'}
                </button>
              </div>

              {/* Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="p-4 rounded-xl bg-[#060D1A] border border-white/10 flex items-center justify-between cursor-pointer">
                  <div>
                    <div className="text-xs font-bold text-white">Enable Assistant Widget</div>
                    <div className="text-[11px] text-slate-400">Displays floating AI orb on website</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={appData.assistant.enabled}
                    onChange={e =>
                      setAppData(prev => ({
                        ...prev,
                        assistant: { ...prev.assistant, enabled: e.target.checked },
                      }))
                    }
                    className="w-4 h-4 rounded text-[#0EA5E9]"
                  />
                </label>

                <label className="p-4 rounded-xl bg-[#060D1A] border border-white/10 flex items-center justify-between cursor-pointer">
                  <div>
                    <div className="text-xs font-bold text-white">Lead Capture In Chat</div>
                    <div className="text-[11px] text-slate-400">Prompts visitors for contact info</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={appData.assistant.leadCaptureEnabled}
                    onChange={e =>
                      setAppData(prev => ({
                        ...prev,
                        assistant: { ...prev.assistant, leadCaptureEnabled: e.target.checked },
                      }))
                    }
                    className="w-4 h-4 rounded text-[#0EA5E9]"
                  />
                </label>
              </div>

              {/* Identity */}
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-mono text-slate-300">Assistant Name</label>
                  <input
                    type="text"
                    value={appData.assistant.name}
                    onChange={e =>
                      setAppData(prev => ({
                        ...prev,
                        assistant: { ...prev.assistant, name: e.target.value },
                      }))
                    }
                    className="w-full px-3 py-2 rounded-lg bg-[#060D1A] border border-white/10 text-xs text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono text-slate-300">Initial Greeting Message</label>
                  <textarea
                    rows={3}
                    value={appData.assistant.greeting}
                    onChange={e =>
                      setAppData(prev => ({
                        ...prev,
                        assistant: { ...prev.assistant, greeting: e.target.value },
                      }))
                    }
                    className="w-full px-3 py-2 rounded-lg bg-[#060D1A] border border-white/10 text-xs text-white resize-none"
                  />
                </div>
              </div>

              {/* Suggested Questions */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-mono uppercase text-[#0EA5E9]">
                    Suggested Chips ({appData.assistant.suggestedQuestions.length})
                  </h3>
                  <button
                    type="button"
                    onClick={addSuggestedQuestion}
                    className="px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-xs text-slate-300 transition-colors"
                  >
                    + Add Question
                  </button>
                </div>

                <div className="space-y-2">
                  {appData.assistant.suggestedQuestions.map((q, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 rounded-lg bg-[#060D1A] border border-white/5 text-xs text-slate-300"
                    >
                      <span>{q}</span>
                      <button
                        type="button"
                        onClick={() => removeSuggestedQuestion(idx)}
                        className="text-slate-500 hover:text-red-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Extra Grounded Knowledge */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-mono uppercase text-[#16A34A]">
                    Custom Business Knowledge Q&A
                  </h3>
                  <button
                    type="button"
                    onClick={addKnowledgeItem}
                    className="px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-xs text-slate-300 transition-colors"
                  >
                    + Add Knowledge
                  </button>
                </div>

                <div className="space-y-2">
                  {(appData.assistant.extraKnowledge || []).map((k, idx) => (
                    <div
                      key={k.id || idx}
                      className="p-3 rounded-lg bg-[#060D1A] border border-white/5 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between text-white font-bold">
                        <span>{k.question}</span>
                        <button
                          type="button"
                          onClick={() => removeKnowledgeItem(idx)}
                          className="text-slate-500 hover:text-red-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="text-slate-400">{k.answer}</div>
                    </div>
                  ))}
                </div>
              </div>
            </form>
          )}

          {/* ═════════════════════════════════════════════════
              TAB 5: EMAIL SETTINGS
          ═════════════════════════════════════════════════ */}
          {activeTab === 'email' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
                <div>
                  <h2 className="text-xl font-heading font-bold text-white">
                    Email Notifications & Delivery Engine
                  </h2>
                  <p className="text-xs text-slate-400">
                    Configure your notification inbox and outbound SMTP server for project leads.
                  </p>
                </div>

                {/* Delivery Engine Status Badge */}
                <div className="flex items-center gap-2">
                  {appData.settings?.smtp?.host && appData.settings?.smtp?.user && appData.settings?.smtp?.pass ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>SMTP Active ({appData.settings.smtp.host})</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0EA5E9]/10 border border-[#0EA5E9]/20 text-[#0EA5E9] text-xs font-mono">
                      <Zap className="w-3.5 h-3.5" />
                      <span>Automated Email Relay Active</span>
                    </span>
                  )}
                </div>
              </div>

              <form onSubmit={handleSaveEmailSettings} className="space-y-6 max-w-2xl">
                {/* 1. Recipient Notification Email */}
                <div className="p-5 rounded-2xl bg-[#060D1A] border border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-mono font-bold text-white uppercase tracking-wider block">
                      Admin Notification Inbox <span className="text-[#0EA5E9]">*</span>
                    </label>
                    <span className="text-[11px] font-mono text-emerald-400">Primary Alert Target</span>
                  </div>
                  <input
                    type="email"
                    required
                    placeholder="e.g. anoopkp10@gmail.com"
                    value={appData.settings?.notifyEmail || ''}
                    onChange={e =>
                      setAppData(prev => ({
                        ...prev,
                        settings: {
                          ...prev.settings,
                          notifyEmail: e.target.value,
                        },
                      }))
                    }
                    className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-[#0EA5E9]"
                  />
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Whenever a client clicks <strong>"Submit Project Requirements"</strong>, an immediate project alert with full specs and contact details is delivered to this email address.
                  </p>
                </div>

                {/* 2. SMTP Delivery Configuration */}
                <div className="p-5 rounded-2xl bg-[#060D1A] border border-white/10 space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                        Outbound SMTP Server (Optional / Recommended)
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        Connect your Gmail, Outlook, or Google Workspace to send directly from your own domain.
                      </p>
                    </div>

                    {/* Quick Presets */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-mono text-slate-500 mr-1">Presets:</span>
                      <button
                        type="button"
                        onClick={() => applySmtpPreset('gmail')}
                        className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-mono text-slate-300 transition-colors"
                      >
                        Gmail
                      </button>
                      <button
                        type="button"
                        onClick={() => applySmtpPreset('office365')}
                        className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-mono text-slate-300 transition-colors"
                      >
                        Outlook
                      </button>
                      <button
                        type="button"
                        onClick={() => applySmtpPreset('zoho')}
                        className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-mono text-slate-300 transition-colors"
                      >
                        Zoho
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-2 space-y-1">
                      <label className="text-[11px] font-mono text-slate-300 block">
                        SMTP Host Server
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. smtp.gmail.com"
                        value={appData.settings?.smtp?.host || ''}
                        onChange={e => updateSmtpField('host', e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-[#0EA5E9]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-mono text-slate-300 block">
                        Port
                      </label>
                      <input
                        type="number"
                        placeholder="465 or 587"
                        value={appData.settings?.smtp?.port ?? 465}
                        onChange={e => updateSmtpField('port', Number(e.target.value) || 465)}
                        className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-[#0EA5E9]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[11px] font-mono text-slate-300 block">
                        SMTP Username / Email
                      </label>
                      <input
                        type="text"
                        placeholder="your-email@gmail.com"
                        value={appData.settings?.smtp?.user || ''}
                        onChange={e => updateSmtpField('user', e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-[#0EA5E9]"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-mono text-slate-300 block">
                          SMTP Password / App Password
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowSmtpPass(p => !p)}
                          className="text-[10px] font-mono text-[#0EA5E9] hover:underline flex items-center gap-1"
                        >
                          {showSmtpPass ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                          <span>{showSmtpPass ? 'Hide' : 'Show'}</span>
                        </button>
                      </div>
                      <input
                        type={showSmtpPass ? 'text' : 'password'}
                        placeholder="••••••••••••••••"
                        value={appData.settings?.smtp?.pass || ''}
                        onChange={e => updateSmtpField('pass', e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-[#0EA5E9]"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={appData.settings?.smtp?.secure ?? true}
                        onChange={e => updateSmtpField('secure', e.target.checked)}
                        className="w-4 h-4 rounded text-[#0EA5E9]"
                      />
                      <span className="text-xs text-slate-300">
                        Use SSL/TLS Encryption (Recommended for Port 465)
                      </span>
                    </label>

                  </div>
                </div>

                {/* Submit & Test Buttons */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#0284C7] to-[#0EA5E9] text-white text-xs font-bold hover:shadow-lg disabled:opacity-50 transition-all flex items-center gap-2"
                  >
                    <span>{saving ? 'Saving...' : 'Save Email Configuration'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSendTestEmail}
                    disabled={testEmailLoading}
                    className="px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-200 transition-colors flex items-center gap-2"
                  >
                    <Mail className="w-3.5 h-3.5 text-[#0EA5E9]" />
                    <span>{testEmailLoading ? 'Dispatching Test...' : `Send Test to ${appData.settings?.notifyEmail || 'Configured Email'}`}</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </main>
      </div>

      {/* ═════════════════════════════════════════════════
          PROJECT ADD / EDIT MODAL
      ═════════════════════════════════════════════════ */}
      {isNewProjectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-[#091524] border border-white/15 rounded-2xl p-6 space-y-5 my-8">
            <h3 className="text-xl font-heading font-bold text-white">
              {editingItem ? 'Edit Project' : 'Add New Portfolio Project'}
            </h3>

            <form onSubmit={handleCreateOrUpdateProject} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-mono text-slate-300">Project Title *</label>
                  <input
                    type="text"
                    required
                    value={projectForm.title}
                    onChange={e => setProjectForm(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg bg-[#060D1A] border border-white/10 text-xs text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono text-slate-300">Category</label>
                  <select
                    value={projectForm.category}
                    onChange={e => setProjectForm(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg bg-[#060D1A] border border-white/10 text-xs text-white"
                  >
                    <option value="Booking System">Booking System</option>
                    <option value="Order System">Order System</option>
                    <option value="Portfolio Website">Portfolio Website</option>
                    <option value="Dashboard">Dashboard</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-mono text-slate-300">Client / Brand Name</label>
                  <input
                    type="text"
                    value={projectForm.clientName}
                    onChange={e => setProjectForm(prev => ({ ...prev, clientName: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg bg-[#060D1A] border border-white/10 text-xs text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono text-slate-300">Live URL (Optional)</label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={projectForm.projectUrl}
                    onChange={e => setProjectForm(prev => ({ ...prev, projectUrl: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg bg-[#060D1A] border border-white/10 text-xs text-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono text-slate-300">Tags (comma separated)</label>
                <input
                  type="text"
                  value={projectForm.tags}
                  onChange={e => setProjectForm(prev => ({ ...prev, tags: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg bg-[#060D1A] border border-white/10 text-xs text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono text-slate-300">Full Description *</label>
                <textarea
                  required
                  rows={4}
                  value={projectForm.description}
                  onChange={e => setProjectForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg bg-[#060D1A] border border-white/10 text-xs text-white resize-none"
                />
              </div>

              {/* Upload Media: 1 Image or 1 Video */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-mono text-slate-300 block">
                    Project Media (1 Image or 1 MP4/WEBM Video) *
                  </label>
                  <span className="text-[11px] font-mono text-slate-500">
                    Saved in uploads folder & path saved to appdata.json
                  </span>
                </div>

                {/* If a new file is chosen */}
                {uploadPreview ? (
                  <div className="p-4 rounded-xl bg-[#060D1A] border border-[#0EA5E9]/50 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono text-[#0EA5E9] font-bold flex items-center gap-1.5">
                        <span>New {uploadPreview.type === 'video' ? 'Video' : 'Image'} Selected:</span>
                        <span className="text-white">{uploadPreview.name}</span>
                      </span>
                      <button
                        type="button"
                        onClick={handleClearSelectedFile}
                        className="text-xs font-mono text-red-400 hover:text-red-300 underline"
                      >
                        Remove / Reselect
                      </button>
                    </div>
                    <div className="rounded-xl overflow-hidden max-h-56 bg-black flex items-center justify-center border border-white/10">
                      {uploadPreview.type === 'video' ? (
                        <video src={uploadPreview.url} controls className="w-full max-h-56 object-contain" />
                      ) : (
                        <img src={uploadPreview.url} alt="Preview" className="w-full max-h-56 object-contain" />
                      )}
                    </div>
                  </div>
                ) : existingMedia ? (
                  /* If editing with existing saved media */
                  <div className="p-4 rounded-xl bg-[#060D1A] border border-white/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono text-slate-400">
                        Current Media ({existingMedia.type}): <span className="text-white">{existingMedia.path}</span>
                      </span>
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold">
                        SAVED IN APPDATA
                      </span>
                    </div>
                    <div className="rounded-xl overflow-hidden max-h-52 bg-black flex items-center justify-center border border-white/5">
                      {existingMedia.type === 'video' || /\.(mp4|webm)$/i.test(existingMedia.path) ? (
                        <video src={existingMedia.path} controls className="w-full max-h-52 object-contain" />
                      ) : (
                        <img
                          src={existingMedia.path}
                          alt={existingMedia.alt || 'Saved preview'}
                          className="w-full max-h-52 object-contain"
                        />
                      )}
                    </div>
                    <div className="pt-2 border-t border-white/5">
                      <label className="block text-xs font-mono text-slate-300 mb-1.5">
                        Upload a new file to replace current media:
                      </label>
                      <input
                        type="file"
                        accept="image/*,video/mp4,video/webm"
                        onChange={handleSingleFileChange}
                        className="w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-white/10 file:text-white hover:file:bg-white/20"
                      />
                    </div>
                  </div>
                ) : (
                  /* If new project with no file yet */
                  <div className="border-2 border-dashed border-white/15 hover:border-[#0EA5E9]/50 rounded-xl p-6 text-center space-y-3 transition-colors bg-[#060D1A]/50">
                    <Upload className="w-8 h-8 text-slate-400 mx-auto" />
                    <div className="space-y-1">
                      <div className="text-xs font-semibold text-white">
                        Upload 1 Image (JPG, PNG, WEBP, GIF) or Video (MP4, WEBM)
                      </div>
                      <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                        File is saved into public/uploads/portfolio/ and the path stored in appdata.json.
                      </p>
                    </div>
                    <input
                      type="file"
                      required={!editingItem}
                      accept="image/*,video/mp4,video/webm"
                      onChange={handleSingleFileChange}
                      className="w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-white/10 file:text-white hover:file:bg-white/20"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsNewProjectModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploadProgress}
                  className="px-6 py-2 rounded-xl bg-gradient-to-r from-[#0284C7] to-[#0EA5E9] text-white text-xs font-bold disabled:opacity-50"
                >
                  {uploadProgress ? 'Processing...' : editingItem ? 'Update Project' : 'Publish Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
