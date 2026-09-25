import React, { useState, useEffect, useRef } from 'react';
import {
  AppData,
  ContactData,
  PortfolioItem,
  Lead,
  AssistantData,
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
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Upload,
  RefreshCw,
  Download,
  Search,
  MessageCircle,
  Eye,
} from 'lucide-react';

interface AdminDashboardProps {
  initialData: AppData;
  onLogout: () => void;
  onBackToSite: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  initialData,
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
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploadPreview, setUploadPreview] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState(false);

  // Email test state
  const [testEmailLoading, setTestEmailLoading] = useState(false);

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

  useEffect(() => {
    fetchLeads();
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
      showToast('Contact details successfully updated!');
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  // ═════════════════════════════════════════════════
  // PORTFOLIO ACTIONS
  // ═════════════════════════════════════════════════
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setUploadFiles(files);
      const previews = files.map(f => URL.createObjectURL(f));
      setUploadPreview(previews);
    }
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

      // Add uploaded files
      uploadFiles.forEach(file => {
        formData.append('media', file);
      });

      let res;
      if (editingItem) {
        // Retain existing media
        formData.append('existingMedia', JSON.stringify(editingItem.media));
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

      const updatedItem = await res.json();

      setAppData(prev => {
        const nextList = editingItem
          ? prev.portfolio.map(p => (p.id === updatedItem.id ? updatedItem : p))
          : [updatedItem, ...prev.portfolio];
        return { ...prev, portfolio: nextList };
      });

      showToast(editingItem ? 'Project updated!' : 'New project published!');
      setIsNewProjectModalOpen(false);
      setEditingItem(null);
      setUploadFiles([]);
      setUploadPreview([]);
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

      setAppData(prev => ({
        ...prev,
        portfolio: prev.portfolio.filter(p => p.id !== id),
      }));
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
    setUploadFiles([]);
    setUploadPreview([]);
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
    setUploadFiles([]);
    setUploadPreview([]);
    setIsNewProjectModalOpen(true);
  };

  // ═════════════════════════════════════════════════
  // LEADS ACTIONS
  // ═════════════════════════════════════════════════
  const handleUpdateLeadStatus = async (id: string, status: 'new' | 'contacted' | 'closed') => {
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

      setLeads(prev => prev.map(l => (l.id === id ? { ...l, status } : l)));
      showToast(`Lead status updated to ${status}`);
    } catch (err: any) {
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

  const addKnowledgeItem = () => {
    const question = window.prompt('Knowledge Question (e.g., What is your cancellation policy?):');
    if (!question) return;
    const answer = window.prompt('Answer grounded for AI:');
    if (!answer) return;

    setAppData(prev => ({
      ...prev,
      assistant: {
        ...prev.assistant,
        extraKnowledge: [
          ...(prev.assistant.extraKnowledge || []),
          { id: `k-${Date.now()}`, question, answer, public: true },
        ],
      },
    }));
  };

  const removeKnowledgeItem = (index: number) => {
    setAppData(prev => ({
      ...prev,
      assistant: {
        ...prev.assistant,
        extraKnowledge: (prev.assistant.extraKnowledge || []).filter((_, i) => i !== index),
      },
    }));
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
      if (!res.ok) throw new Error(data.error || 'Test email failed');
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
                          <img
                            src={p.media[0].path}
                            alt={p.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-600 text-xs font-mono">
                            NO PREVIEW
                          </div>
                        )}
                        <span className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/70 text-[10px] font-mono text-[#0EA5E9]">
                          {p.category}
                        </span>
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
                    Contact & Google Business Profile
                  </h2>
                  <p className="text-xs text-slate-400">
                    Controls all NAP details, footer coordinates, and WhatsApp links across the app.
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

              {/* Google Business Profile & Maps */}
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-mono uppercase text-[#EA580C]">Google Business Profile Integration</h3>
                <div className="space-y-2">
                  <input
                    type="url"
                    placeholder="Google Business Profile URL"
                    value={appData.contact.googleBusinessProfileUrl || ''}
                    onChange={e =>
                      setAppData(prev => ({
                        ...prev,
                        contact: { ...prev.contact, googleBusinessProfileUrl: e.target.value },
                      }))
                    }
                    className="w-full px-3 py-2 rounded-lg bg-[#060D1A] border border-white/10 text-xs text-white"
                  />
                  <input
                    type="url"
                    placeholder="Google Review URL"
                    value={appData.contact.googleReviewUrl || ''}
                    onChange={e =>
                      setAppData(prev => ({
                        ...prev,
                        contact: { ...prev.contact, googleReviewUrl: e.target.value },
                      }))
                    }
                    className="w-full px-3 py-2 rounded-lg bg-[#060D1A] border border-white/10 text-xs text-white"
                  />
                  <input
                    type="text"
                    placeholder="Google Maps Embed URL (iframe src)"
                    value={appData.contact.googleMapsEmbedUrl || ''}
                    onChange={e =>
                      setAppData(prev => ({
                        ...prev,
                        contact: { ...prev.contact, googleMapsEmbedUrl: e.target.value },
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
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div>
                  <h2 className="text-xl font-heading font-bold text-white">
                    Email Notifications Settings
                  </h2>
                  <p className="text-xs text-slate-400">
                    Configure recipient inbox for client leads and test SMTP deliverability.
                  </p>
                </div>
              </div>

              <form onSubmit={handleSaveEmailSettings} className="space-y-4 max-w-xl">
                <div className="space-y-1">
                  <label className="text-xs font-mono text-slate-300 block">
                    Admin Notification Email
                  </label>
                  <input
                    type="email"
                    required
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
                    className="w-full px-3 py-2 rounded-lg bg-[#060D1A] border border-white/10 text-xs text-white"
                  />
                  <span className="text-[11px] text-slate-500">
                    Lead alerts will be delivered immediately to this address.
                  </span>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#0284C7] to-[#0EA5E9] text-white text-xs font-bold hover:shadow-lg disabled:opacity-50 transition-all"
                  >
                    Save Email Configuration
                  </button>

                  <button
                    type="button"
                    onClick={handleSendTestEmail}
                    disabled={testEmailLoading}
                    className="px-5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-200 transition-colors flex items-center gap-1.5"
                  >
                    <Mail className="w-3.5 h-3.5 text-[#0EA5E9]" />
                    <span>{testEmailLoading ? 'Sending Test...' : 'Send Test Email'}</span>
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

              {/* Upload Media Files */}
              <div className="space-y-2">
                <label className="text-xs font-mono text-slate-300 block">
                  Media Files (Images or MP4 Videos)
                </label>
                <input
                  type="file"
                  multiple
                  accept="image/*,video/mp4"
                  onChange={handleFileChange}
                  className="w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-white/10 file:text-white hover:file:bg-white/20"
                />

                {uploadPreview.length > 0 && (
                  <div className="flex gap-2 pt-2 overflow-x-auto">
                    {uploadPreview.map((src, idx) => (
                      <div key={idx} className="w-16 h-12 rounded-lg overflow-hidden border border-white/20">
                        <img src={src} alt="Upload preview" className="w-full h-full object-cover" />
                      </div>
                    ))}
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
