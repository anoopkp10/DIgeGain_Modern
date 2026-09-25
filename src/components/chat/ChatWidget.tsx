import React, { useState, useRef, useEffect } from 'react';
import { AssistantData, ContactData } from '../../lib/validators.ts';
import {
  Sparkles,
  X,
  Send,
  Minimize2,
  Maximize2,
  Trash2,
  ArrowUpRight,
  MessageCircle,
  Bot,
  User,
  CheckCircle,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Square,
  Radio,
  AlertCircle,
  Check,
} from 'lucide-react';

interface ChatWidgetProps {
  assistant: AssistantData;
  contact: ContactData;
  onNavigate: (path: string) => void;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

// Clean markdown syntax so spoken voice sounds natural
function stripMarkdownForSpeech(text: string): string {
  return text
    .replace(/```[\s\S]*?```/g, '') // remove multi-line code blocks
    .replace(/`([^`]+)`/g, '$1') // inline code
    .replace(/\*\*([^*]+)\*\*/g, '$1') // bold **text**
    .replace(/\*([^*]+)\*/g, '$1') // italics *text*
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1') // links [text](url) -> text
    .replace(/^[•\-\*]\s+/gm, '') // bullet lists
    .replace(/^#+\s+/gm, '') // headings
    .replace(/https?:\/\/\S+/g, '') // direct URLs
    .replace(/[#_~|]/g, '')
    .trim();
}

export const ChatWidget: React.FC<ChatWidgetProps> = ({
  assistant,
  contact,
  onNavigate,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const saved = sessionStorage.getItem('digegain_chat_history');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      {
        id: 'initial',
        role: 'assistant',
        content:
          assistant.greeting ||
          "Hi! I'm DIGEGAIN's AI assistant. Ask me about our web systems or past projects.",
      },
    ];
  });
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [leadFormState, setLeadFormState] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
    submitted: false,
    loading: false,
  });

  // Voice Conversation States
  const [isListening, setIsListening] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [autoSpeak, setAutoSpeak] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('digegain_chat_autospeak');
      return saved === 'true';
    } catch {
      return false;
    }
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  const isSpeechRecognitionSupported =
    typeof window !== 'undefined' &&
    Boolean((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

  const isTtsSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  // Persist chat history
  useEffect(() => {
    try {
      sessionStorage.setItem('digegain_chat_history', JSON.stringify(messages));
    } catch {}
  }, [messages]);

  // Persist auto-speak preference
  useEffect(() => {
    try {
      localStorage.setItem('digegain_chat_autospeak', String(autoSpeak));
    } catch {}
  }, [autoSpeak]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isStreaming, isListening]);

  // Clean up speech recognition & synthesis on unmount
  useEffect(() => {
    return () => {
      stopSpeaking();
      stopListening();
    };
  }, []);

  if (!assistant.enabled) return null;

  // -------------------------------------------------------------
  // Speech-to-Text (Voice Input)
  // -------------------------------------------------------------
  const startListening = () => {
    if (!isSpeechRecognitionSupported) {
      setVoiceError(
        'Speech recognition is not supported in this browser. Please use Chrome, Edge, Safari, or Brave.'
      );
      setTimeout(() => setVoiceError(null), 5000);
      return;
    }

    // Stop active bot speech before listening to user
    stopSpeaking();
    setVoiceError(null);

    try {
      const SpeechRec =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRec();
      recognitionRef.current = recognition;
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setLiveTranscript('');
      };

      recognition.onresult = (event: any) => {
        let interim = '';
        let final = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const item = event.results[i];
          if (item.isFinal) {
            final += item[0].transcript;
          } else {
            interim += item[0].transcript;
          }
        }

        const recognized = final || interim;
        if (recognized) {
          setLiveTranscript(recognized);
          setInput(recognized);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setVoiceError('Microphone permission was denied. Please allow mic access in your browser settings.');
        } else if (event.error === 'no-speech') {
          setVoiceError('No speech detected. Please tap the mic and try again.');
        } else if (event.error !== 'aborted') {
          setVoiceError(`Voice input error: ${event.error}`);
        }
        setIsListening(false);
        setTimeout(() => setVoiceError(null), 5000);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
      setIsListening(false);
      setVoiceError('Unable to access microphone.');
      setTimeout(() => setVoiceError(null), 4000);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
    setIsListening(false);
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  // -------------------------------------------------------------
  // Text-to-Speech (Voice Output)
  // -------------------------------------------------------------
  const speakMessage = (msgId: string, text: string) => {
    if (!isTtsSupported) return;

    // Toggle off if already speaking this message
    if (speakingMessageId === msgId) {
      stopSpeaking();
      return;
    }

    stopSpeaking();
    const clean = stripMarkdownForSpeech(text);
    if (!clean) return;

    try {
      const utterance = new SpeechSynthesisUtterance(clean);
      const voices = window.speechSynthesis.getVoices();

      // Find highest quality English voice
      const preferredVoice =
        voices.find(
          v =>
            (v.name.includes('Google') ||
              v.name.includes('Natural') ||
              v.name.includes('Samantha') ||
              v.name.includes('Daniel') ||
              v.name.includes('Karen')) &&
            v.lang.startsWith('en')
        ) ||
        voices.find(v => v.lang.startsWith('en')) ||
        voices[0];

      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }
      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      utterance.onstart = () => {
        setSpeakingMessageId(msgId);
      };
      utterance.onend = () => {
        setSpeakingMessageId(null);
      };
      utterance.onerror = () => {
        setSpeakingMessageId(null);
      };

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.error('Speech synthesis error:', err);
      setSpeakingMessageId(null);
    }
  };

  const stopSpeaking = () => {
    if (isTtsSupported) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }
    setSpeakingMessageId(null);
  };

  // -------------------------------------------------------------
  // Message Sending & Streaming
  // -------------------------------------------------------------
  const handleSend = async (overrideText?: string) => {
    const text = (overrideText || input).trim();
    if (!text || isStreaming) return;

    // Stop any active audio
    stopSpeaking();
    stopListening();

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLiveTranscript('');
    setIsStreaming(true);

    const botMsgId = `bot-${Date.now()}`;
    setMessages(prev => [...prev, { id: botMsgId, role: 'assistant', content: '' }]);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.slice(-10).map(m => ({
            role: m.role === 'assistant' ? 'assistant' : 'user',
            content: m.content,
          })),
        }),
      });

      if (!res.ok) {
        throw new Error('Chat service unavailable');
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No reader available');

      const decoder = new TextDecoder();
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const raw = decoder.decode(value, { stream: true });
        const lines = raw.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const payload = line.slice(6).trim();
            if (payload === '[DONE]') break;
            try {
              const parsed = JSON.parse(payload);
              if (parsed.text) {
                accumulated += parsed.text;
                setMessages(prev =>
                  prev.map(m => (m.id === botMsgId ? { ...m, content: accumulated } : m))
                );
              }
            } catch {
              // Non-json chunk
            }
          }
        }
      }

      // If Auto-Speak voice responses is enabled, speak the reply
      if (autoSpeak && accumulated) {
        speakMessage(botMsgId, accumulated);
      }
    } catch (err) {
      const errorFallback =
        "I'm temporarily having trouble connecting to our AI server. You can speak directly with our engineers on WhatsApp or drop us an inquiry via our contact form!";
      setMessages(prev =>
        prev.map(m => (m.id === botMsgId ? { ...m, content: errorFallback } : m))
      );
      if (autoSpeak) {
        speakMessage(botMsgId, errorFallback);
      }
    } finally {
      setIsStreaming(false);
    }
  };

  const clearChat = () => {
    stopSpeaking();
    stopListening();
    const initial: Message[] = [
      {
        id: 'initial',
        role: 'assistant',
        content: assistant.greeting,
      },
    ];
    setMessages(initial);
    sessionStorage.removeItem('digegain_chat_history');
  };

  const handleLeadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadFormState.name || !leadFormState.email) return;

    setLeadFormState(prev => ({ ...prev, loading: true }));
    try {
      const res = await fetch('/api/contact-form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: leadFormState.name,
          email: leadFormState.email,
          phone: leadFormState.phone,
          service: 'AI Assistant Qualified Lead',
          message: leadFormState.message || 'Captured from DIGEGAIN AI Chat Widget',
          source: 'ai-assistant',
        }),
      });

      if (res.ok) {
        setLeadFormState(prev => ({ ...prev, submitted: true, loading: false }));
        const confirmationText = `Thank you, **${leadFormState.name}**! Your project details have been sent to our lead engineer. We've sent a confirmation email to **${leadFormState.email}** and will contact you within 24 hours.`;
        setMessages(prev => [
          ...prev,
          {
            id: `sys-${Date.now()}`,
            role: 'assistant',
            content: confirmationText,
          },
        ]);
        if (autoSpeak) {
          speakMessage(`sys-${Date.now()}`, confirmationText);
        }
        setTimeout(() => setShowLeadForm(false), 2000);
      }
    } catch {
      setLeadFormState(prev => ({ ...prev, loading: false }));
    }
  };

  const formatMarkdown = (text: string) => {
    return text.split('\n').map((line, idx) => {
      let formatted = line;

      // Bold text replacement
      formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

      // Link replacement
      formatted = formatted.replace(
        /\[(.*?)\]\((.*?)\)/g,
        '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-[#0EA5E9] hover:underline font-semibold">$1</a>'
      );

      if (line.trim().startsWith('•') || line.trim().startsWith('-')) {
        return (
          <li
            key={idx}
            className="ml-4 list-disc"
            dangerouslySetInnerHTML={{ __html: formatted.replace(/^[•-]\s*/, '') }}
          />
        );
      }

      if (line.trim() === '') {
        return <div key={idx} className="h-2" />;
      }

      return (
        <p
          key={idx}
          className="mb-1.5 last:mb-0 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: formatted }}
        />
      );
    });
  };

  const waUrl = `https://wa.me/${contact.whatsappNumber}?text=${encodeURIComponent(
    contact.whatsappMessage || 'Hi DIGEGAIN'
  )}`;

  return (
    <aside aria-label="AI Assistant" className="fixed bottom-6 left-6 z-40">
      {/* Floating Trigger Button with Breathing AI Orb */}
      {!isOpen && (
        <button
          onClick={() => {
            setIsOpen(true);
            setTimeout(() => inputRef.current?.focus(), 100);
          }}
          data-cursor-label="Ask AI"
          className="group relative flex items-center gap-3 p-2 pr-4 rounded-full bg-[#0b1b2e]/90 backdrop-blur-xl border border-white/15 shadow-2xl shadow-black/50 hover:border-[#0EA5E9]/50 hover:shadow-[#0284C7]/25 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]"
          aria-label="Open DIGEGAIN AI chat assistant with voice"
        >
          {/* Breathing Orb */}
          <div className="relative w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-tr from-[#EA580C] via-[#0284C7] to-[#16A34A] p-[2px] shadow-lg shadow-[#0284C7]/40 group-hover:scale-105 transition-transform">
            <div className="w-full h-full rounded-full bg-[#060D1A] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-[#0EA5E9] animate-pulse" />
            </div>
            <span className="absolute inset-0 rounded-full bg-[#0EA5E9] opacity-30 blur-sm animate-ping pointer-events-none" />
          </div>

          <div className="flex flex-col text-left">
            <span className="text-xs font-heading font-bold text-white flex items-center gap-1.5">
              <span>{assistant.name}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-mono bg-[#0EA5E9]/15 text-[#38BDF8] border border-[#0EA5E9]/30">
                <Mic className="w-2.5 h-2.5" /> Voice
              </span>
            </span>
            <span className="text-[11px] text-slate-400">Ask or Speak · 24/7 Free</span>
          </div>
        </button>
      )}

      {/* Glassmorphism Chat Panel */}
      {isOpen && (
        <div
          className={`glass-panel rounded-2xl shadow-2xl shadow-black/80 flex flex-col border border-white/15 transition-all duration-300 overflow-hidden ${
            isExpanded
              ? 'fixed inset-4 sm:inset-10 z-50'
              : 'w-[92vw] sm:w-[420px] h-[600px] max-h-[85vh]'
          }`}
        >
          {/* Panel Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-[#081524] border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="relative w-8 h-8 rounded-full bg-gradient-to-tr from-[#EA580C] via-[#0284C7] to-[#16A34A] p-[1.5px] flex-shrink-0">
                <div className="w-full h-full rounded-full bg-[#060D1A] flex items-center justify-center">
                  <Bot className="w-4 h-4 text-[#0EA5E9]" />
                </div>
                {speakingMessageId && (
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border border-[#081524] flex items-center justify-center animate-pulse">
                    <span className="w-1 h-1 rounded-full bg-white" />
                  </span>
                )}
              </div>
              <div>
                <div className="text-xs font-heading font-bold text-white flex items-center gap-1.5">
                  <span>{assistant.name}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                </div>
                <div className="text-[10px] text-slate-400 flex items-center gap-1.5">
                  <span>AI Digital Strategist</span>
                  <span>•</span>
                  <span className="text-emerald-400 font-mono">Voice Active</span>
                </div>
              </div>
            </div>

            {/* Header Action Buttons */}
            <div className="flex items-center gap-1">
              {/* Voice Auto-Readout Toggle Button */}
              {isTtsSupported && (
                <button
                  type="button"
                  onClick={() => {
                    if (speakingMessageId) stopSpeaking();
                    setAutoSpeak(prev => !prev);
                  }}
                  title={autoSpeak ? 'Auto Voice Readout: ON (Click to mute)' : 'Auto Voice Readout: OFF (Click to unmute)'}
                  className={`relative p-1.5 rounded-lg text-xs transition-colors flex items-center gap-1 ${
                    autoSpeak
                      ? 'bg-[#0EA5E9]/20 text-[#38BDF8] border border-[#0EA5E9]/40 hover:bg-[#0EA5E9]/30'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                  aria-label="Toggle voice readout"
                >
                  {autoSpeak ? (
                    <>
                      <Volume2 className="w-3.5 h-3.5 text-[#38BDF8]" />
                      <span className="hidden sm:inline text-[10px] font-mono font-medium">Voice</span>
                    </>
                  ) : (
                    <VolumeX className="w-3.5 h-3.5 text-slate-400" />
                  )}
                </button>
              )}

              {/* Clear History */}
              <button
                onClick={clearChat}
                title="Clear Chat History"
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                aria-label="Clear chat"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>

              {/* Minimize/Maximize */}
              <button
                onClick={() => setIsExpanded(prev => !prev)}
                title={isExpanded ? 'Minimize' : 'Expand'}
                className="hidden sm:block p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                aria-label="Toggle chat panel size"
              >
                {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>

              {/* Close Button */}
              <button
                onClick={() => {
                  stopSpeaking();
                  stopListening();
                  setIsOpen(false);
                }}
                title="Close Assistant"
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                aria-label="Close chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Action Banner */}
          <div className="bg-[#050D18] px-4 py-2 flex items-center justify-between border-b border-white/5 text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <span>Need human engineer consultation?</span>
            </span>
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[#25D366] hover:underline font-semibold"
            >
              <MessageCircle className="w-3 h-3" />
              <span>WhatsApp</span>
            </a>
          </div>

          {/* Active Voice Speaking Indicator Banner */}
          {speakingMessageId && (
            <div className="bg-[#0284C7]/20 border-b border-[#0EA5E9]/30 px-4 py-1.5 flex items-center justify-between text-xs text-[#38BDF8] animate-fadeIn">
              <div className="flex items-center gap-2">
                <div className="flex items-end gap-0.5 h-3">
                  <span className="w-0.5 h-full bg-[#38BDF8] rounded-full animate-wave-bar" style={{ animationDelay: '0ms' }} />
                  <span className="w-0.5 h-full bg-[#38BDF8] rounded-full animate-wave-bar" style={{ animationDelay: '200ms' }} />
                  <span className="w-0.5 h-full bg-[#38BDF8] rounded-full animate-wave-bar" style={{ animationDelay: '400ms' }} />
                  <span className="w-0.5 h-full bg-[#38BDF8] rounded-full animate-wave-bar" style={{ animationDelay: '150ms' }} />
                </div>
                <span className="text-[11px] font-medium">DIGEGAIN AI speaking response...</span>
              </div>
              <button
                onClick={stopSpeaking}
                className="flex items-center gap-1 px-2 py-0.5 rounded bg-black/40 hover:bg-black/60 text-white text-[10px] font-mono transition-colors"
                title="Stop speaking"
              >
                <Square className="w-2.5 h-2.5 fill-current" /> Stop
              </button>
            </div>
          )}

          {/* Voice Error Banner */}
          {voiceError && (
            <div className="bg-rose-500/20 border-b border-rose-500/30 px-4 py-2 flex items-center gap-2 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span className="flex-1 text-[11px]">{voiceError}</span>
              <button
                onClick={() => setVoiceError(null)}
                className="text-rose-400 hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Messages Area */}
          <div
            className="flex-1 overflow-y-auto p-4 space-y-4 text-xs"
            aria-live="polite"
          >
            {messages.map(m => {
              const isAssistant = m.role === 'assistant';
              const isSpeakingThis = speakingMessageId === m.id;

              return (
                <div
                  key={m.id}
                  className={`flex gap-2.5 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {isAssistant && (
                    <div className="w-6 h-6 rounded-full bg-[#0284C7]/20 border border-[#0284C7]/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Sparkles className="w-3 h-3 text-[#0EA5E9]" />
                    </div>
                  )}

                  <div
                    className={`max-w-[84%] flex flex-col ${
                      m.role === 'user' ? 'items-end' : 'items-start'
                    }`}
                  >
                    <div
                      className={`px-3.5 py-2.5 rounded-2xl ${
                        m.role === 'user'
                          ? 'bg-gradient-to-r from-[#0284C7] to-[#0EA5E9] text-white rounded-br-none shadow-md shadow-[#0284C7]/20 font-medium'
                          : `bg-[#091829] text-slate-200 border rounded-bl-none shadow-sm leading-relaxed transition-colors ${
                              isSpeakingThis
                                ? 'border-[#0EA5E9]/60 shadow-md shadow-[#0284C7]/20'
                                : 'border-white/10'
                            }`
                      }`}
                    >
                      {m.content ? (
                        formatMarkdown(m.content)
                      ) : (
                        <div className="flex items-center gap-1 py-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#0EA5E9] animate-bounce" />
                          <span className="w-1.5 h-1.5 rounded-full bg-[#0EA5E9] animate-bounce [animation-delay:0.2s]" />
                          <span className="w-1.5 h-1.5 rounded-full bg-[#0EA5E9] animate-bounce [animation-delay:0.4s]" />
                        </div>
                      )}
                    </div>

                    {/* Per-message Listen Button for Assistant Replies */}
                    {isAssistant && m.content && isTtsSupported && (
                      <div className="mt-1 flex items-center gap-2 px-1">
                        <button
                          type="button"
                          onClick={() => speakMessage(m.id, m.content)}
                          className={`flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-md transition-colors ${
                            isSpeakingThis
                              ? 'bg-[#0EA5E9]/20 text-[#38BDF8] border border-[#0EA5E9]/40'
                              : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                          }`}
                          title={isSpeakingThis ? 'Stop listening' : 'Listen to this reply'}
                        >
                          {isSpeakingThis ? (
                            <>
                              <Square className="w-2.5 h-2.5 fill-current text-[#38BDF8]" />
                              <span>Stop Voice</span>
                              <div className="flex items-end gap-0.5 h-2.5 ml-0.5">
                                <span className="w-0.5 h-full bg-[#38BDF8] rounded-full animate-wave-bar" />
                                <span className="w-0.5 h-full bg-[#38BDF8] rounded-full animate-wave-bar" style={{ animationDelay: '150ms' }} />
                              </div>
                            </>
                          ) : (
                            <>
                              <Volume2 className="w-2.5 h-2.5" />
                              <span>Listen</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Suggested Question Chips & Voice Prompt */}
            {messages.length === 1 && (
              <div className="pt-2 space-y-2.5">
                {/* Voice input hint banner */}
                <div className="p-2.5 rounded-xl bg-gradient-to-r from-[#0284C7]/15 via-[#0EA5E9]/10 to-[#16A34A]/15 border border-[#0EA5E9]/25 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-[#0EA5E9]/20 flex items-center justify-center text-[#38BDF8]">
                      <Mic className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-[11px] font-semibold text-white">Voice Conversation Active</div>
                      <div className="text-[10px] text-slate-400">Speak your question or listen to replies. 100% Free.</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={toggleListening}
                    className="px-2.5 py-1 rounded-lg bg-[#0EA5E9] text-[#060D1A] font-bold text-[10px] hover:bg-[#38BDF8] transition-colors flex items-center gap-1"
                  >
                    <Mic className="w-3 h-3" /> Speak Now
                  </button>
                </div>

                {assistant.suggestedQuestions?.length > 0 && (
                  <>
                    <div className="text-[11px] font-mono text-slate-500 uppercase tracking-wider">
                      Suggested topics:
                    </div>
                    <div className="flex flex-col gap-1.5">
                      {assistant.suggestedQuestions.map((q, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSend(q)}
                          className="text-left px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-[#0284C7]/50 text-slate-300 hover:text-white transition-all text-xs flex items-center justify-between group"
                        >
                          <span>{q}</span>
                          <ArrowUpRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-[#0EA5E9] transition-colors" />
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Lead capture prompt card */}
            {assistant.leadCaptureEnabled && !showLeadForm && messages.length >= 3 && (
              <div className="p-3 rounded-xl bg-[#0d2238] border border-[#0284C7]/30 flex items-center justify-between gap-3">
                <div className="text-[11px] text-slate-300">
                  Ready to discuss your project with our lead engineer?
                </div>
                <button
                  onClick={() => setShowLeadForm(true)}
                  className="px-2.5 py-1.5 rounded-lg bg-[#0EA5E9] text-[#060D1A] font-bold text-[11px] whitespace-nowrap hover:bg-[#38bdf8] transition-colors"
                >
                  Request Quote
                </button>
              </div>
            )}

            {/* Inline Lead Capture Form */}
            {showLeadForm && (
              <form
                onSubmit={handleLeadSubmit}
                className="p-3.5 rounded-xl bg-[#091829] border border-[#0EA5E9]/40 space-y-2.5"
              >
                <div className="flex items-center justify-between text-xs font-bold text-white">
                  <span>Fast Project Inquiry</span>
                  <button
                    type="button"
                    onClick={() => setShowLeadForm(false)}
                    className="text-slate-400 hover:text-white text-[10px]"
                  >
                    Cancel
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="Your Name *"
                  required
                  value={leadFormState.name}
                  onChange={e => setLeadFormState(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-1.5 rounded-lg bg-[#060D1A] border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-[#0EA5E9]"
                />
                <input
                  type="email"
                  placeholder="Your Email *"
                  required
                  value={leadFormState.email}
                  onChange={e => setLeadFormState(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-1.5 rounded-lg bg-[#060D1A] border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-[#0EA5E9]"
                />
                <input
                  type="tel"
                  placeholder="Phone / WhatsApp (Optional)"
                  value={leadFormState.phone}
                  onChange={e => setLeadFormState(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-3 py-1.5 rounded-lg bg-[#060D1A] border border-white/10 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-[#0EA5E9]"
                />
                <button
                  type="submit"
                  disabled={leadFormState.loading}
                  className="w-full py-2 rounded-lg bg-gradient-to-r from-[#0284C7] to-[#0EA5E9] font-bold text-white text-xs hover:shadow-md transition-all flex items-center justify-center gap-1.5"
                >
                  {leadFormState.loading ? 'Submitting...' : 'Submit Requirements'}
                </button>
              </form>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Active Microphone Listening Overlay / Status */}
          {isListening && (
            <div className="px-3 py-2.5 bg-gradient-to-r from-[#0b1b2e] to-[#092238] border-t border-[#0EA5E9]/30 flex items-center justify-between gap-2.5 animate-fadeIn">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                {/* Pulsating Voice Orb */}
                <div className="relative flex items-center justify-center w-7 h-7 flex-shrink-0">
                  <span className="absolute inset-0 rounded-full bg-rose-500 opacity-40 animate-voice-ripple" />
                  <div className="relative w-6 h-6 rounded-full bg-rose-600 flex items-center justify-center text-white shadow-lg shadow-rose-600/50">
                    <Mic className="w-3.5 h-3.5 animate-pulse" />
                  </div>
                </div>

                {/* Transcript / Listening Text */}
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-semibold text-rose-300 flex items-center gap-1.5">
                    <span>Listening...</span>
                    <span className="text-[10px] text-slate-400 font-normal">Speak clearly</span>
                  </div>
                  <div className="text-[11px] text-white truncate font-medium">
                    {liveTranscript || 'Listening to your voice...'}
                  </div>
                </div>
              </div>

              {/* Action Buttons while listening */}
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    stopListening();
                    if (input.trim()) {
                      handleSend();
                    }
                  }}
                  disabled={!input.trim()}
                  className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-[#0284C7] to-[#0EA5E9] text-white text-[11px] font-bold disabled:opacity-40 hover:shadow-md transition-all flex items-center gap-1"
                >
                  <Send className="w-3 h-3" />
                  <span>Send</span>
                </button>
                <button
                  type="button"
                  onClick={stopListening}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                  title="Stop listening"
                >
                  <Square className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Input Box & Voice Controls */}
          <form
            onSubmit={e => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 bg-[#081524] border-t border-white/10 flex items-center gap-2"
          >
            {/* Microphone Button */}
            <button
              type="button"
              onClick={toggleListening}
              disabled={isStreaming}
              className={`relative w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
                isListening
                  ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/40 ring-2 ring-rose-400'
                  : 'bg-white/5 hover:bg-white/10 text-slate-300 hover:text-[#38BDF8] border border-white/10 hover:border-[#0EA5E9]/50'
              }`}
              title={
                isListening
                  ? 'Stop voice recording'
                  : 'Speak your question (Free voice input via Web Speech API)'
              }
              aria-label={isListening ? 'Stop recording voice' : 'Start voice input'}
            >
              {isListening ? (
                <MicOff className="w-4 h-4" />
              ) : (
                <Mic className="w-4 h-4" />
              )}
            </button>

            {/* Text Input */}
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={
                isListening
                  ? 'Listening to speech...'
                  : 'Ask or tap mic to speak...'
              }
              disabled={isStreaming}
              className="flex-1 bg-[#060D1A] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-[#0EA5E9] transition-colors"
            />

            {/* Send Button */}
            <button
              type="submit"
              disabled={!input.trim() || isStreaming}
              className="w-9 h-9 rounded-xl bg-gradient-to-r from-[#0284C7] to-[#0EA5E9] text-white flex items-center justify-center disabled:opacity-40 disabled:pointer-events-none hover:shadow-md hover:shadow-[#0284C7]/30 transition-all flex-shrink-0"
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </aside>
  );
};
