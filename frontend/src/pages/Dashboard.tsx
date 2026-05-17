import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion, type Transition, type Variants } from 'framer-motion';
import { 
  Shield, 
  FileText, 
  UploadCloud, 
  AlertTriangle, 
  MessageSquare, 
  ArrowRight, 
  ChevronRight, 
  Copy, 
  FileCheck, 
  BookOpen, 
  Send, 
  Activity, 
  Info,
  CornerUpLeft,
  Volume2,
  Pause,
  Square
} from 'lucide-react';
import {
  speakScript,
  stopSpeech,
  pauseSpeech,
  resumeSpeech,
  isSpeaking,
  isPaused,
  isVoiceSupported,
  DEFAULT_VOICE_CONFIG,
  type VoiceLanguageCode,
  type VoiceScriptResponse,
} from '../utils/voiceEngine';
import LexGuardLogo from '../components/LexGuardLogo';
import { BACKEND_URL } from '../config';
import { loadSampleContract } from '../utils/loadSampleContract';

// Interfaces matching Pydantic schemas
interface PolicyRule {
  id: string;
  rule_title: string;
  rule_description: string;
  category: string;
  severity_level: string;
}

interface CompliancePolicy {
  id: string;
  name: string;
  description: string;
  rules: PolicyRule[];
}

interface RiskAssessmentItem {
  id: string;
  clause_title: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
  category: string;
  clause_text: string;
  description: string;
  recommendation: string;
  alternative_clause?: string;
}

interface ContractAnalysisResult {
  id: string;
  filename: string;
  compliance_score: number;
  risks_found: RiskAssessmentItem[];
  summary: string;
  verdict: string;
  policy_applied: string;
  document_text: string;
  engine_source?: 'gemini' | 'demo';
}

interface ChatMessage {
  sender: 'user' | 'ai';
  text: string;
  references?: string[];
}

// Multi-Agent Reasoner Interfaces
interface CorporateDefender {
  intent: string;
  defense_points: string[];
}

interface ConsumerProtection {
  unfairness_reasons: string;
  flaws: string[];
}

interface NeutralJudge {
  balanced_verdict: string;
  fairness_score: number;
  risk_level: string;
  recommendation: string;
  revised_clause: string;
  key_changes: string[];
}

interface MultiAgentAuditResult {
  clause_title: string;
  clause_content: string;
  engine_source?: 'gemini';
  corporate_defender: CorporateDefender;
  consumer_protection: ConsumerProtection;
  neutral_judge: NeutralJudge;
}

// Legal Simplifier Interfaces
interface SimplificationLevel {
  explanation: string;
  advantages: string[];
  disadvantages: string[];
  real_world_consequence: string;
}

interface SimplificationResult {
  clause_title: string;
  english: {
    professional: SimplificationLevel;
    simple: SimplificationLevel;
    illiterate_friendly: SimplificationLevel;
  };
  translations: Record<string, {
    professional: SimplificationLevel;
    simple: SimplificationLevel;
    illiterate_friendly: SimplificationLevel;
  }>;
}

// Negotiation Assistant Interfaces
interface NegotiationTurnResult {
  session_id: string;
  user_concern?: string;
  acknowledgement: string;
  tradeoff_explanation: string;
  updated_verdict: string;
  updated_recommendation: string;
  negotiation_leverage: string[];
  protective_addition: string;
  turn_number: number;
}
const smoothEase = [0.22, 1, 0.36, 1] as const;

const panelMotion = {
  initial: { opacity: 0, y: 18, scale: 0.985 },
  animate: { opacity: 1, y: 0, scale: 1 },
  transition: { duration: 0.45, ease: smoothEase } satisfies Transition,
};

const listMotion: Variants = {
  visible: {
    transition: { staggerChildren: 0.055, delayChildren: 0.08 },
  },
};

const itemMotion: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: smoothEase },
  },
};

const capabilityItems = [
  { icon: FileText, title: 'Fast scan', detail: 'Local clause split + single-pass Gemini compliance (~8–15s).' },
  { icon: AlertTriangle, title: 'Risk matrix', detail: 'HIGH / MEDIUM / LOW with quoted clause text.' },
  { icon: FileCheck, title: 'Redline playground', detail: 'Multi-agent debate + balanced alternative clauses.' },
  { icon: BookOpen, title: 'Simplify · 3 tiers', detail: 'Professional, simple, conversational explanations.' },
  { icon: Volume2, title: 'Voice · 7 languages', detail: 'TTS scripts with pause optimization.' },
  { icon: MessageSquare, title: 'Negotiate + Chat', detail: 'Context-aware tradeoffs and document Q&A.' },
];

export default function Dashboard() {
  // Application State
  const [policies, setPolicies] = useState<CompliancePolicy[]>([]);
  const [selectedPolicyId, setSelectedPolicyId] = useState<string>('standard_vendor');
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [analysis, setAnalysis] = useState<ContractAnalysisResult | null>(null);
  const [selectedRisk, setSelectedRisk] = useState<RiskAssessmentItem | null>(null);
  const [activeTab, setActiveTab] = useState<'risks' | 'redline' | 'simplify' | 'negotiate' | 'chat'>('risks');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState<string>('');
  const [isChatting, setIsChatting] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [backendOnline, setBackendOnline] = useState<boolean>(false);
  const [demoNotice, setDemoNotice] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState<boolean>(false);
  const [hoveredClauseId, setHoveredClauseId] = useState<string | null>(null);
  
  // Multi-Agent State Hooks
  const [multiAgentResult, setMultiAgentResult] = useState<MultiAgentAuditResult | null>(null);
  const [isAgentAuditing, setIsAgentAuditing] = useState<boolean>(false);

  // Legal Simplifier State
  const [simplifyResult, setSimplifyResult] = useState<SimplificationResult | null>(null);
  const [isSimplifying, setIsSimplifying] = useState<boolean>(false);
  const [activeSimplifyLevel, setActiveSimplifyLevel] = useState<'professional' | 'simple' | 'illiterate_friendly'>('simple');
  const [activeLanguage, setActiveLanguage] = useState<string>('english');

  // Voice accessibility
  const [voiceScript, setVoiceScript] = useState<VoiceScriptResponse | null>(null);
  const [isLoadingVoice, setIsLoadingVoice] = useState<boolean>(false);
  const [voiceProgress, setVoiceProgress] = useState<{ current: number; total: number }>({ current: 0, total: 0 });
  const [scanStatusMessage, setScanStatusMessage] = useState<string>('Extracting document text...');

  // Negotiation Assistant State
  const [negotiationSessionId, setNegotiationSessionId] = useState<string | null>(null);
  const [negotiationHistory, setNegotiationHistory] = useState<NegotiationTurnResult[]>([]);
  const [negotiationInput, setNegotiationInput] = useState<string>('');
  const [isNegotiating, setIsNegotiating] = useState<boolean>(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const textViewerRef = useRef<HTMLDivElement>(null);
  const negotiationEndRef = useRef<HTMLDivElement>(null);

  // Rotating scan status while upload runs (fast scan = one AI call)
  useEffect(() => {
    if (!isUploading) return;
    const messages = [
      'Extracting document text...',
      'Mapping clauses locally...',
      'Running AI compliance analysis...',
      'Building your executive risk matrix...',
    ];
    let i = 0;
    setScanStatusMessage(messages[0]);
    const id = window.setInterval(() => {
      i = (i + 1) % messages.length;
      setScanStatusMessage(messages[i]);
    }, 2800);
    return () => window.clearInterval(id);
  }, [isUploading]);

  // Multi-Agent API Audit Call
  const runMultiAgentAudit = async (clauseTitle: string, clauseContent: string) => {
    setIsAgentAuditing(true);
    setMultiAgentResult(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/analyze/clause`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clause_title: clauseTitle,
          clause_content: clauseContent,
          document_id: analysis?.id,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      setMultiAgentResult(await res.json());
    } catch (err: any) {
      alert(`Agent Debate Error: ${err.message}`);
    } finally {
      setIsAgentAuditing(false);
    }
  };

  // Legal Simplifier API Call
  const runSimplify = async (clauseTitle: string, clauseContent: string, language?: string) => {
    setIsSimplifying(true);
    setSimplifyResult(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/intelligence/simplify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clause_title: clauseTitle, clause_content: clauseContent, language })
      });
      if (!res.ok) throw new Error(await res.text());
      setSimplifyResult(await res.json());
      setActiveSimplifyLevel('simple');
      setActiveLanguage(language || 'english');
    } catch (err: any) {
      alert(`Simplification Error: ${err.message}`);
    } finally {
      setIsSimplifying(false);
    }
  };

  const loadVoiceScript = async (): Promise<VoiceScriptResponse | null> => {
    if (!selectedRisk) return null;
    setIsLoadingVoice(true);
    setVoiceScript(null);
    try {
      const lang = activeLanguage === 'english' ? 'english' : activeLanguage;
      const res = await fetch(`${BACKEND_URL}/api/intelligence/voice-script`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clause_title: selectedRisk.clause_title,
          clause_content: selectedRisk.clause_text || selectedRisk.clause_title,
          language: lang,
          literacy_tier: activeSimplifyLevel,
          translate_first: lang !== 'english',
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const script: VoiceScriptResponse = await res.json();
      setVoiceScript(script);
      return script;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Voice script failed';
      alert(`Voice Error: ${msg}`);
      return null;
    } finally {
      setIsLoadingVoice(false);
    }
  };

  const handleListenExplanation = async () => {
    if (!isVoiceSupported()) {
      alert('Text-to-speech is not supported in this browser. Try Chrome or Edge.');
      return;
    }
    stopSpeech();
    let script = voiceScript;
    if (!script) {
      script = await loadVoiceScript();
    }
    if (!script) return;
    const lang = (activeLanguage === 'english' ? 'english' : activeLanguage) as VoiceLanguageCode;
    speakScript(script, {
      config: {
        ...DEFAULT_VOICE_CONFIG,
        language: lang,
        literacyTier: activeSimplifyLevel,
      },
      onProgress: (c, t) => setVoiceProgress({ current: c, total: t }),
      onEnd: () => setVoiceProgress({ current: 0, total: 0 }),
    });
  };

  // Negotiation Assistant - Start Session
  const startNegotiation = async (clauseTitle: string, clauseContent: string) => {
    setIsNegotiating(true);
    setNegotiationHistory([]);
    setNegotiationSessionId(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/intelligence/negotiate/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          document_id: analysis?.id || 'demo',
          clause_title: clauseTitle,
          clause_content: clauseContent,
        })
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setNegotiationSessionId(data.session_id);
    } catch (err: any) {
      alert(`Negotiation Error: ${err.message}`);
    } finally {
      setIsNegotiating(false);
    }
  };

  // Negotiation Assistant - Submit Turn
  const submitNegotiationTurn = async () => {
    if (!negotiationSessionId || !negotiationInput.trim()) return;
    const concern = negotiationInput.trim();
    setNegotiationInput('');
    setIsNegotiating(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/intelligence/negotiate/turn`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: negotiationSessionId, user_concern: concern })
      });
      if (!res.ok) throw new Error(await res.text());
      const data: NegotiationTurnResult = await res.json();
      setNegotiationHistory(prev => [...prev, { ...data, user_concern: concern }]);
      setTimeout(() => negotiationEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (err: any) {
      alert(`Negotiation Turn Error: ${err.message}`);
    } finally {
      setIsNegotiating(false);
    }
  };


  // Check Backend Status & Load Policies
  useEffect(() => {
    const fetchStatusAndPolicies = async () => {
      try {
        const statusRes = await fetch(`${BACKEND_URL}/`);
        const statusData = await statusRes.json();
        if (statusData.status === 'online') {
          setBackendOnline(true);
        }

        const policiesRes = await fetch(`${BACKEND_URL}/api/policies`);
        const policiesData = await policiesRes.json();
        setPolicies(policiesData);
      } catch (err) {
        console.error('Failed to connect to LexGuard AI backend:', err);
        setBackendOnline(false);
        // Load fallback offline preset guidelines for visual structure if offline
        setPolicies([
          {
            id: 'standard_vendor',
            name: 'Standard Vendor Agreement Policy',
            description: 'Checks if a standard commercial vendor contract matches typical business protections, focusing on liability, IP protection, and payment terms.',
            rules: []
          },
          {
            id: 'gdpr_privacy',
            name: 'GDPR & Data Privacy Guard',
            description: 'Audits data privacy safeguards, checking for appropriate data processor responsibilities, breach reporting, and security clauses.',
            rules: []
          },
          {
            id: 'mutual_nda',
            name: 'Mutual NDA Standard Policy',
            description: 'Verifies that a Non-Disclosure Agreement provides equal, mutual protection for both disclosing and receiving parties.',
            rules: []
          }
        ]);
      }
    };

    fetchStatusAndPolicies();
  }, []);

  // Scroll Chat to Bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  // Handle Drag-and-Drop file events
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      await uploadFile(file);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      await uploadFile(file);
    }
  };

  // Upload File API Call
  const uploadFile = async (file: File) => {
    setIsUploading(true);
    setSelectedRisk(null);
    setAnalysis(null);
    setDemoNotice(null);
    setChatHistory([]);
    setActiveTab('risks');

    const formData = new FormData();
    formData.append('file', file);
    formData.append('policy_id', selectedPolicyId);

    try {
      const res = await fetch(`${BACKEND_URL}/api/analyze`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || 'Analysis failed.');
      }

      const result: ContractAnalysisResult = await res.json();
      setAnalysis(result);
      
      // Initialize Chatbot introduction
      setChatHistory([
        {
          sender: 'ai',
          text: `Hello! I have successfully audited **${result.filename}** against the **${policies.find(p => p.id === selectedPolicyId)?.name || 'selected policy'}**. 

I identified **${result.risks_found.filter(r => r.severity !== 'INFO').length} risks** requiring attention. You can browse the categorized compliance flaws in the **Risk Assessment** tab, view standard alternatives in the **Redline Playground**, or ask me specific contract questions directly here! What would you like to review first?`
        }
      ]);

    } catch (err: any) {
      alert(`Upload analysis error: ${err.message || 'Make sure the backend server is running on http://localhost:8000.'}`);
    } finally {
      setIsUploading(false);
    }
  };

  // Load sample contract (live Gemini when backend is up, offline demo otherwise)
  const handleLoadSample = async () => {
    setIsUploading(true);
    setSelectedRisk(null);
    setAnalysis(null);
    setChatHistory([]);
    setActiveTab('risks');
    setDemoNotice(null);

    try {
      const { analysis: result, source, message } = await loadSampleContract(selectedPolicyId);
      setAnalysis(result);

      if (source === 'demo') {
        setDemoNotice(
          message
            ? `Offline demo mode — ${message}`
            : 'Offline demo mode — connect the backend for live Gemini analysis.',
        );
      }

      setChatHistory([
        {
          sender: 'ai',
          text: `Welcome! I've loaded and analyzed a highly realistic, high-risk draft **CloudScale Solutions Vendor Agreement** to demonstrate our audit capabilities.

Our model detected **${result.risks_found.filter(r => r.severity !== 'INFO').length} major risk elements** (such as uncapped liabilities, non-reciprocal confidentiality, and unfavorable Swiss arbitration governing law). 

Browse the highlighted segments in the **Document text viewer** on the left, or review the redlines on the right!`,
        },
      ]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      alert(`Sample loading error: ${msg}`);
    } finally {
      setIsUploading(false);
    }
  };

  // Send Chat Message API Call
  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !analysis || isChatting) return;

    const userMsg = chatInput.trim();
    setChatInput('');
    
    // Add user message to history
    const updatedHistory: ChatMessage[] = [
      ...chatHistory,
      { sender: 'user', text: userMsg }
    ];
    setChatHistory(updatedHistory);
    setIsChatting(true);

    try {
      const res = await fetch(`${BACKEND_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          document_id: analysis.id,
          message: userMsg,
          history: updatedHistory.slice(0, -1) // send preceding history
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to send message.');
      }

      const chatReply = await res.json();
      setChatHistory(prev => [
        ...prev,
        {
          sender: 'ai',
          text: chatReply.reply,
          references: chatReply.references
        }
      ]);

    } catch (err: any) {
      setChatHistory(prev => [
        ...prev,
        {
          sender: 'ai',
          text: `Deepest apologies, I encountered an error communicating with the chat service: ${err.message}. Please verify the server connection.`
        }
      ]);
    } finally {
      setIsChatting(false);
    }
  };

  // Copy Alternative Clause text
  const copyToClipboard = (text?: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  // Interactive scroll to matching highlighted text
  const handleRiskItemClick = (risk: RiskAssessmentItem) => {
    setSelectedRisk(risk);
    setMultiAgentResult(null);
    setSimplifyResult(null);
    setVoiceScript(null);
    setNegotiationSessionId(null);
    setNegotiationHistory([]);
    setNegotiationInput('');
    
    // Auto-switch tabs to show appropriate information
    if (activeTab === 'chat') {
      setActiveTab('risks');
    }

    // Scroll left panel document viewer to the matching text
    // We use a small timeout to let rendering finish
    setTimeout(() => {
      const highlightedEl = document.querySelector(`.clause-highlight[data-id="${risk.id}"]`);
      if (highlightedEl) {
        highlightedEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Add an active/glow class momentarily
        highlightedEl.classList.add('glowing-highlight');
        setTimeout(() => highlightedEl.classList.remove('glowing-highlight'), 1500);
      }
    }, 100);
  };

  // Radial Circle Gauge Math helper
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const currentScore = analysis ? analysis.compliance_score : 100;
  const strokeDashoffset = circumference - (currentScore / 100) * circumference;

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'var(--success)';
    if (score >= 60) return 'var(--warning)';
    return 'var(--danger)';
  };

  const getScoreGlow = (score: number) => {
    if (score >= 85) return 'var(--success-glow)';
    if (score >= 60) return 'var(--warning-glow)';
    return 'var(--danger-glow)';
  };

  // Text highlighting compiler
  interface HighlightSegment {
    text: string;
    riskItem?: RiskAssessmentItem;
  }

  const getHighlightedSegments = (fullText: string, risks: RiskAssessmentItem[]): HighlightSegment[] => {
    if (!fullText) return [];
    if (!risks || risks.length === 0) return [{ text: fullText }];

    let matches: { start: number; end: number; risk: RiskAssessmentItem }[] = [];
    
    risks.forEach(risk => {
      if (!risk.clause_text || risk.clause_text.trim() === "" || risk.clause_text.includes("Full text analyzed")) return;
      
      // Clean leading/trailing quotes and spacing
      let phrase = risk.clause_text.trim().replace(/^["']|["']$/g, '');
      if (phrase.length < 15) return; // ignore short fragments
      
      // Use the first 100 chars for a robust lookup index in case formatting slightly shifted
      const lookupPhrase = phrase.substring(0, Math.min(phrase.length, 100)).toLowerCase();
      let index = fullText.toLowerCase().indexOf(lookupPhrase);
      
      if (index === -1 && phrase.length > 50) {
        // Try fallback with the first 40 chars
        index = fullText.toLowerCase().indexOf(phrase.substring(0, 40).toLowerCase());
      }
      
      if (index !== -1) {
        matches.push({
          start: index,
          end: index + phrase.length,
          risk: risk
        });
      }
    });

    // Sort matches chronologically by index start
    matches.sort((a, b) => a.start - b.start);

    // Merge overlapping or nested matches
    const mergedMatches: typeof matches = [];
    matches.forEach(m => {
      if (mergedMatches.length === 0) {
        mergedMatches.push(m);
      } else {
        const prev = mergedMatches[mergedMatches.length - 1];
        if (m.start < prev.end) {
          // If they overlap, expand the previous block to cover the max boundary
          prev.end = Math.max(prev.end, m.end);
        } else {
          mergedMatches.push(m);
        }
      }
    });

    // Segment compilation
    const segments: HighlightSegment[] = [];
    let currentIndex = 0;

    mergedMatches.forEach(m => {
      if (m.start > currentIndex) {
        segments.push({ text: fullText.substring(currentIndex, m.start) });
      }
      segments.push({
        text: fullText.substring(m.start, m.end),
        riskItem: m.risk
      });
      currentIndex = m.end;
    });

    if (currentIndex < fullText.length) {
      segments.push({ text: fullText.substring(currentIndex) });
    }

    return segments;
  };

  const highlightedSegments = analysis 
    ? getHighlightedSegments(analysis.document_text, analysis.risks_found) 
    : [];

  return (
    <div className="app-container">
      {/* Navigation Top Header */}
      <motion.header
        className={`app-header${analysis ? ' app-header--workspace' : ''}`}
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: smoothEase }}
      >
        <Link to="/" className="brand-container" style={{ textDecoration: 'none', color: 'inherit' }}>
          <motion.div className="brand-logo-icon" whileHover={{ scale: 1.06, rotate: -4 }} whileTap={{ scale: 0.96 }}>
            <Shield className="brand-logo" size={20} color="white" />
          </motion.div>
          <h1 className="brand-name">
            LexGuard AI 
            <span className="brand-badge">COMPLIANCE GUARD</span>
          </h1>
        </Link>

        <div className="header-actions">
          {backendOnline ? (
            <div className="api-status-pill">
              <span className="api-status-dot"></span>
              LexGuard Agent Core Online
            </div>
          ) : (
            <div className="api-status-pill" style={{ borderColor: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5', background: 'rgba(239, 68, 68, 0.05)' }}>
              <span className="api-status-dot" style={{ backgroundColor: 'var(--danger)', boxShadow: '0 0 8px var(--danger)', animation: 'none' }}></span>
              Backend offline — start API on port 8000
            </div>
          )}
          {analysis?.engine_source && (
            <div className={`engine-badge engine-badge--${analysis.engine_source}`}>
              Engine: {analysis.engine_source.toUpperCase()}
            </div>
          )}
        </div>
      </motion.header>

      {/* Main Container */}
      <main className={`main-content ${analysis ? 'workspace-main' : ''}`}>
        {demoNotice && analysis && (
          <motion.div
            className="demo-notice-banner"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            role="status"
          >
            <Info size={16} />
            <span>{demoNotice}</span>
            <button type="button" className="demo-notice-dismiss" onClick={() => setDemoNotice(null)} aria-label="Dismiss">
              ×
            </button>
          </motion.div>
        )}
        {!analysis && !isUploading ? (
          /* INITIAL SETUP VIEW: Drag & Drop + Policy Config */
          <motion.div className="dashboard-grid" initial="hidden" animate="visible" variants={listMotion}>
            <motion.div className="left-column" variants={itemMotion}>
              <motion.div className="glass-panel" {...panelMotion}>
                <h3 className="policy-selector-header">
                  <BookOpen size={18} color="var(--primary)" />
                  Select Compliance Policy
                </h3>
                <motion.div className="policy-list" variants={listMotion} initial="hidden" animate="visible">
                  {policies.map(policy => (
                    <motion.button
                      type="button"
                      key={policy.id} 
                      className={`policy-item ${selectedPolicyId === policy.id ? 'active' : ''}`}
                      onClick={() => setSelectedPolicyId(policy.id)}
                      variants={itemMotion}
                      whileHover={{ y: -2, scale: 1.01 }}
                      whileTap={{ scale: 0.985 }}
                    >
                      <div className="policy-item-title">
                        {policy.name}
                        {selectedPolicyId === policy.id && <ChevronRight size={14} color="var(--primary)" />}
                      </div>
                      <div className="policy-item-desc">{policy.description}</div>
                    </motion.button>
                  ))}
                </motion.div>
              </motion.div>
              
              <motion.div className="glass-panel capability-panel" {...panelMotion} transition={{ ...panelMotion.transition, delay: 0.08 }}>
                <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.9rem', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Activity size={14} color="var(--accent-cyan)" />
                  Product Capabilities
                </h4>
                <div className="capability-grid">
                  {capabilityItems.map(({ icon: Icon, title, detail }) => (
                    <motion.div key={title} className="capability-card" whileHover={{ y: -3 }}>
                      <span className="capability-icon"><Icon size={15} /></span>
                      <div>
                        <strong>{title}</strong>
                        <p>{detail}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </motion.div>

            <motion.div className="right-column" variants={itemMotion}>
              <motion.div
                className={`glass-panel upload-hub ${isDragging ? 'dragging' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                whileHover={{ y: -3 }}
                transition={{ duration: 0.25 }}
              >
                <input 
                  type="file" 
                  ref={fileInputRef}
                  className="file-input"
                  accept=".pdf,.docx,.txt,.png,.jpg,.jpeg"
                  onChange={handleFileSelect}
                />
                <div className="upload-logo-slot">
                  <LexGuardLogo size="compact" />
                </div>
                <p className="upload-kicker">AI contract command center</p>
                <h2 className="upload-title-stack">
                  <span>LexGuard</span>
                  <span>AI</span>
                  <span>Contract</span>
                  <span>Review</span>
                </h2>
                <p className="upload-subtitle">
                  Upload for structured risks, redlines, voice simplification, and negotiation guidance.
                  <span className="upload-formats">PDF · DOCX · TXT · Images</span>
                </p>
                
                <div className="upload-action-row">
                  <motion.button 
                    type="button"
                    className="btn-upload btn-upload--premium"
                    onClick={() => fileInputRef.current?.click()}
                    whileHover={{ y: -2, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <UploadCloud size={18} /> Select file to upload
                  </motion.button>
                  <motion.button
                    className="btn-sample"
                    onClick={handleLoadSample}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Load Sample Document
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        ) : isUploading ? (
          /* AUDIT PULSING SKELETON / LOADING LOADER */
          <motion.div className="glass-panel audit-loader audit-loader--advanced" {...panelMotion}>
            <motion.div className="audit-loader-logo">
              <LexGuardLogo size="compact" />
            </motion.div>
            <div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', marginBottom: '0.5rem' }}>LexGuard AI is auditing your contract</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '500px', margin: '0 auto' }}>
                {scanStatusMessage}
              </p>
              <p style={{ color: 'var(--text-dimmed)', fontSize: '0.75rem', marginTop: '0.5rem' }}>
                Fast scan · local clause extraction · single AI compliance pass
              </p>
            </div>
            <div style={{ width: '300px', height: '6px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden', position: 'relative', marginTop: '1rem' }}>
              <div className="skeleton-loading" style={{ width: '100%', height: '100%', borderRadius: '3px' }}></div>
            </div>
          </motion.div>
        ) : (
          /* DYNAMIC MULTI-PANE AUDITED CONTRACT DASHBOARD VIEW */
          <motion.div className="saas-workspace saas-workspace--premium" initial="hidden" animate="visible" variants={listMotion}>
            {/* Column 1: Executive Sidebar Panel */}
            <motion.aside className="saas-sidebar saas-sidebar--premium" variants={itemMotion}>
              <div className="sidebar-header">
                <div className="file-badge">
                  <FileText size={16} className="file-badge-icon" />
                  <span className="file-badge-name" title={analysis?.filename}>
                    {analysis?.filename}
                  </span>
                </div>
                <button 
                  className="btn-back-upload" 
                  onClick={() => setAnalysis(null)}
                  title="Upload another contract"
                >
                  <CornerUpLeft size={14} />
                  <span>Reset</span>
                </button>
              </div>

              {/* compliance circle & metric panel */}
              <div className="sidebar-gauge-card sidebar-gauge-card--premium">
                <motion.div
                  className="radial-progress-container"
                  initial={{ scale: 0.92, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.45, ease: smoothEase }}
                >
                  <svg className="radial-svg">
                    <circle className="radial-bg-circle" cx="55" cy="55" r={radius} />
                    <motion.circle
                      className="radial-fg-circle" 
                      cx="55" 
                      cy="55" 
                      r={radius} 
                      stroke={getScoreColor(currentScore)}
                      strokeDasharray={circumference}
                      initial={{ strokeDashoffset: circumference }}
                      animate={{ strokeDashoffset }}
                      transition={{ duration: 0.95, ease: smoothEase }}
                      style={{ filter: `drop-shadow(0 0 8px ${getScoreGlow(currentScore)})` }}
                    />
                  </svg>
                  <div className="radial-progress-text">
                    <span className="radial-score" style={{ color: getScoreColor(currentScore) }}>
                      {currentScore}%
                    </span>
                    <span className="radial-label">Compliance</span>
                  </div>
                </motion.div>

                <div className="verdict-bubble" style={{ 
                  background: analysis?.compliance_score && analysis.compliance_score >= 80 
                    ? 'rgba(79, 168, 138, 0.08)' 
                    : analysis?.compliance_score && analysis.compliance_score >= 60 
                      ? 'rgba(201, 169, 98, 0.08)' 
                      : 'rgba(212, 134, 122, 0.08)',
                  borderColor: getScoreColor(currentScore)
                }}>
                  <span className="verdict-bubble-lbl">Audit Verdict</span>
                  <span className="verdict-bubble-val">{analysis?.verdict}</span>
                </div>
              </div>

              <div className="sidebar-scrollable-content">
                <div className="summary-section">
                  <h4 className="section-heading">Executive Summary</h4>
                  <p className="summary-paragraph">{analysis?.summary}</p>
                </div>

                <div className="meta-info-section">
                  <h4 className="section-heading">Contract Integrity</h4>
                  <div className="meta-grid">
                    <div className="meta-cell">
                      <span className="meta-lbl">Scanned Rules</span>
                      <span className="meta-val">{policies.find(p => p.id === selectedPolicyId)?.name || "Standard NDA"}</span>
                    </div>
                    <div className="meta-cell">
                      <span className="meta-lbl">Total Flags</span>
                      <span className="meta-val">{analysis?.risks_found.filter(r => r.severity !== 'INFO').length || 0} items</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.aside>

            {/* Column 2: Document Canvas (Paper Sheet Style) */}
            <motion.section className="saas-document-canvas saas-document-canvas--premium" variants={itemMotion}>
              <div className="canvas-header canvas-header--premium">
                <div className="canvas-info">
                  <BookOpen size={14} className="canvas-icon" />
                  <span className="canvas-title">Interactive Document Viewer</span>
                </div>
                <div className="canvas-hint canvas-hint--premium">
                  <Info size={12} />
                  <span>Material clauses only · click highlights for AI actions</span>
                </div>
              </div>

              <div className="paper-container paper-container--premium">
                <div className="paper-sheet paper-sheet--premium" ref={textViewerRef}>
                  {highlightedSegments.map((segment, idx) => {
                    if (segment.riskItem) {
                      const risk = segment.riskItem;
                      const isHovered = hoveredClauseId === risk.id;
                      const isSelected = selectedRisk?.id === risk.id;
                      
                      return (
                        <span 
                          key={idx}
                          data-id={risk.id}
                          className={`clause-highlight severity-${risk.severity} ${isHovered ? 'hovered' : ''} ${isSelected ? 'active' : ''}`}
                          onClick={() => handleRiskItemClick(risk)}
                          onMouseEnter={() => setHoveredClauseId(risk.id)}
                          onMouseLeave={() => setHoveredClauseId(null)}
                          title={`[${risk.severity} RISK] Click to analyze`}
                        >
                          {segment.text}
                        </span>
                      );
                    }
                    return <React.Fragment key={idx}>{segment.text}</React.Fragment>;
                  })}
                </div>
              </div>
            </motion.section>

            {/* Column 3: AI Copilot Assistant Tab Panel */}
            <motion.aside className="saas-ai-panel saas-ai-panel--premium" variants={itemMotion}>
              {/* Navigation Tab Bar */}
              <div className="saas-tab-nav saas-tab-nav--pills">
                <motion.button
                  className={`saas-tab-btn ${activeTab === 'risks' ? 'active' : ''}`}
                  onClick={() => setActiveTab('risks')}
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <AlertTriangle size={13} />
                  <span>Threats ({analysis?.risks_found.filter(r => r.severity !== 'INFO').length})</span>
                </motion.button>
                <motion.button
                  className={`saas-tab-btn ${activeTab === 'redline' ? 'active' : ''}`}
                  onClick={() => {
                    setActiveTab('redline');
                    if (selectedRisk && !multiAgentResult && !isAgentAuditing) {
                      runMultiAgentAudit(
                        selectedRisk.clause_title,
                        selectedRisk.clause_text || selectedRisk.clause_title
                      );
                    }
                  }}
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <FileCheck size={13} />
                  <span>Redlines</span>
                </motion.button>
                <motion.button
                  className={`saas-tab-btn ${activeTab === 'simplify' ? 'active' : ''}`}
                  onClick={() => {
                    setActiveTab('simplify');
                    if (selectedRisk && !simplifyResult) {
                      runSimplify(selectedRisk.clause_title, selectedRisk.clause_text || selectedRisk.clause_title);
                    }
                  }}
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <BookOpen size={13} />
                  <span>Simplify</span>
                </motion.button>
                <motion.button
                  className={`saas-tab-btn ${activeTab === 'negotiate' ? 'active' : ''}`}
                  onClick={() => {
                    setActiveTab('negotiate');
                    if (selectedRisk && !negotiationSessionId) {
                      startNegotiation(selectedRisk.clause_title, selectedRisk.clause_text || selectedRisk.clause_title);
                    }
                  }}
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Activity size={13} />
                  <span>Negotiate</span>
                </motion.button>
                <motion.button
                  className={`saas-tab-btn ${activeTab === 'chat' ? 'active' : ''}`}
                  onClick={() => setActiveTab('chat')}
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <MessageSquare size={13} />
                  <span>Chat</span>
                </motion.button>
              </div>

              {/* Tab Contents */}
              <div className="saas-tab-content saas-tab-content--premium">
                <AnimatePresence mode="wait">
                  {activeTab === 'risks' && (
                    <motion.div
                      key="risks"
                      className="risk-cards-list"
                      initial="hidden"
                      animate="visible"
                      exit={{ opacity: 0, y: 10 }}
                      variants={listMotion}
                    >
                      {analysis?.risks_found.map(risk => (
                        <motion.button
                          type="button"
                          key={risk.id} 
                          className={`risk-card risk-card--premium severity-${risk.severity} ${selectedRisk?.id === risk.id ? 'active' : ''}`}
                          onClick={() => {
                            setSelectedRisk(risk);
                            handleRiskItemClick(risk);
                          }}
                          onMouseEnter={() => setHoveredClauseId(risk.id)}
                          onMouseLeave={() => setHoveredClauseId(null)}
                          variants={itemMotion}
                          whileHover={{ y: -3, scale: 1.01 }}
                          whileTap={{ scale: 0.985 }}
                        >
                          <div className="risk-card-header">
                            <h4 className="risk-card-title">{risk.clause_title}</h4>
                            <span className={`severity-badge severity-${risk.severity}`}>
                              {risk.severity}
                            </span>
                          </div>
                          
                          <div className="risk-card-category">
                            <Shield size={12} color="var(--primary)" />
                            {risk.category}
                          </div>
                          
                          <p className="risk-card-desc">
                            {risk.description.length > 140 
                              ? `${risk.description.substring(0, 140)}...` 
                              : risk.description}
                          </p>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--primary)' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: '500' }}>
                              View Redlines Suggestion
                              <ArrowRight size={12} />
                            </span>
                          </div>
                        </motion.button>
                      ))}
                    </motion.div>
                  )}

                  {activeTab === 'redline' && (
                    <motion.div
                      key="redline"
                      className="redline-section"
                      initial={{ opacity: 0, x: 18 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -18 }}
                      transition={{ duration: 0.28 }}
                    >
                      {selectedRisk ? (
                        <>
                          <div className="redline-header">
                            <div className="redline-title-bar">
                              <span style={{ fontSize: '0.7rem', color: getScoreColor(selectedRisk.severity === 'HIGH' ? 30 : selectedRisk.severity === 'MEDIUM' ? 65 : 90), fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Severity: {selectedRisk.severity} Risk
                              </span>
                              <h4 style={{ fontSize: '1rem', fontWeight: '600' }}>{selectedRisk.clause_title}</h4>
                            </div>
                            <button 
                              className="btn-back-list"
                              onClick={() => setActiveTab('risks')}
                            >
                              Back to Matrix
                            </button>
                          </div>

                          <div className="redline-clause-box">
                            {selectedRisk.clause_text || "Standard policy rules audit item."}
                          </div>

                          <div className="redline-explanation-box">
                            <span className="explanation-title">AI Assessment & Risks</span>
                            <p className="explanation-text">{selectedRisk.description}</p>
                            
                            <span className="explanation-title" style={{ marginTop: '0.5rem' }}>Negotiation Strategy</span>
                            <p className="explanation-text">{selectedRisk.recommendation}</p>
                          </div>

                          {selectedRisk.alternative_clause && (
                            <>
                              <div className="redline-alternative-box">
                                {selectedRisk.alternative_clause}
                              </div>

                              <button 
                                className="btn-copy-alt"
                                onClick={() => copyToClipboard(selectedRisk.alternative_clause)}
                              >
                                <Copy size={12} />
                                {copySuccess ? 'Copied to Clipboard!' : 'Copy Alternative Wording'}
                              </button>
                            </>
                          )}

                          {/* MULTI-AGENT ENGINE BUTTON & SHOWCASE */}
                          <div className="multi-agent-audit-container" style={{ marginTop: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '1.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                              <div>
                                <h5 style={{ fontSize: '0.85rem', fontWeight: '600', color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                  <Shield size={14} color="var(--primary)" />
                                  Deep Multi-Agent AI Audit
                                </h5>
                                <p style={{ fontSize: '0.7rem', color: 'var(--text-dimmed)', marginTop: '0.25rem' }}>
                                  Debate this clause using 3 parallel specialized AI personas for advanced legal reasoning.
                                </p>
                              </div>
                              
                              {!multiAgentResult && !isAgentAuditing && (
                                <button 
                                  className="btn-upload"
                                  style={{ padding: '0.5rem 0.75rem', fontSize: '0.75rem', whiteSpace: 'nowrap', background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)' }}
                                  onClick={() => runMultiAgentAudit(selectedRisk.clause_title, selectedRisk.clause_text || selectedRisk.clause_title)}
                                >
                                  Run Agent Debate
                                </button>
                              )}
                            </div>

                            {/* LOADING STATE */}
                            {isAgentAuditing && (
                              <div style={{ padding: '2rem', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px dashed rgba(255,255,255,0.06)' }}>
                                <div className="brand-logo-icon" style={{ width: '40px', height: '40px', borderRadius: '10px', margin: '0 auto 1rem auto', animation: 'spin 2s linear infinite', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.05)' }}>
                                  <Shield size={20} color="var(--primary)" />
                                </div>
                                <h6 style={{ fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.25rem' }}>Synthesizing AI Reasoning...</h6>
                                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                  Alpha (Corporate Defender) and Beta (Consumer Protection) are debating in parallel. Gamma (Neutral Judge) is evaluating.
                                </p>
                              </div>
                            )}

                            {/* MULTI-AGENT DEBATE RESULTS DISPLAY */}
                            {multiAgentResult && (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                                
                                {/* Side-by-Side: Defender and Protection */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                  {/* ALPHA: Corporate Defender */}
                                  <div style={{ background: 'rgba(59, 130, 246, 0.03)', border: '1px solid rgba(59, 130, 246, 0.15)', borderRadius: '8px', padding: '1rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                                      <span style={{ fontSize: '0.65rem', background: 'rgba(59, 130, 246, 0.1)', color: '#60a5fa', fontWeight: '700', padding: '2px 6px', borderRadius: '4px' }}>AGENT ALPHA</span>
                                      <strong style={{ fontSize: '0.8rem', color: '#93c5fd' }}>Corporate Defender</strong>
                                    </div>
                                    <p style={{ fontSize: '0.75rem', fontStyle: 'italic', color: 'var(--text-dimmed)', marginBottom: '0.5rem' }}>
                                      "{multiAgentResult.corporate_defender.intent}"
                                    </p>
                                    <ul style={{ fontSize: '0.75rem', paddingLeft: '1.1rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.4rem', listStyleType: 'disc' }}>
                                      {multiAgentResult.corporate_defender.defense_points.map((pt, i) => (
                                        <li key={i}>{pt}</li>
                                      ))}
                                    </ul>
                                  </div>

                                  {/* BETA: Consumer Protection */}
                                  <div style={{ background: 'rgba(239, 68, 68, 0.03)', border: '1px solid rgba(239, 68, 68, 0.15)', borderRadius: '8px', padding: '1rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                                      <span style={{ fontSize: '0.65rem', background: 'rgba(239, 68, 68, 0.1)', color: '#fca5a5', fontWeight: '700', padding: '2px 6px', borderRadius: '4px' }}>AGENT BETA</span>
                                      <strong style={{ fontSize: '0.8rem', color: '#fca5a5' }}>Consumer Advocate</strong>
                                    </div>
                                    <p style={{ fontSize: '0.75rem', fontStyle: 'italic', color: 'var(--text-dimmed)', marginBottom: '0.5rem' }}>
                                      "{multiAgentResult.consumer_protection.unfairness_reasons}"
                                    </p>
                                    <ul style={{ fontSize: '0.75rem', paddingLeft: '1.1rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.4rem', listStyleType: 'disc' }}>
                                      {multiAgentResult.consumer_protection.flaws.map((fl, i) => (
                                        <li key={i}>{fl}</li>
                                      ))}
                                    </ul>
                                  </div>
                                </div>

                                {/* GAMMA: Neutral Judge Synthesis */}
                                <div style={{ background: 'rgba(16, 185, 129, 0.03)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '8px', padding: '1.25rem', boxShadow: '0 4px 20px rgba(0,0,0,0.25)' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid rgba(16, 185, 129, 0.15)', paddingBottom: '0.75rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                      <span style={{ fontSize: '0.65rem', background: 'rgba(16, 185, 129, 0.1)', color: '#34d399', fontWeight: '700', padding: '2px 6px', borderRadius: '4px' }}>AGENT GAMMA</span>
                                      <strong style={{ fontSize: '0.85rem', color: '#34d399' }}>⚖️ Neutral Judge Synthesis</strong>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Fairness Rating:</span>
                                      <strong style={{ fontSize: '0.9rem', color: getScoreColor(multiAgentResult.neutral_judge.fairness_score) }}>
                                        {multiAgentResult.neutral_judge.fairness_score}/100
                                      </strong>
                                    </div>
                                  </div>

                                  <p style={{ fontSize: '0.75rem', color: 'var(--text-dimmed)', lineHeight: '1.4', marginBottom: '1rem' }}>
                                    <strong>Balanced Verdict:</strong> {multiAgentResult.neutral_judge.balanced_verdict}
                                  </p>

                                  <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', fontSize: '0.75rem' }}>
                                    <div>
                                      <span style={{ color: 'var(--text-muted)' }}>Risk Level:</span>{' '}
                                      <span className={`severity-badge severity-${multiAgentResult.neutral_judge.risk_level.toUpperCase()}`}>
                                        {multiAgentResult.neutral_judge.risk_level}
                                      </span>
                                    </div>
                                    <div>
                                      <span style={{ color: 'var(--text-muted)' }}>Action:</span>{' '}
                                      <span style={{ 
                                        fontWeight: '600', 
                                        textTransform: 'uppercase', 
                                        color: multiAgentResult.neutral_judge.recommendation === 'safe' ? 'var(--success)' : 
                                               multiAgentResult.neutral_judge.recommendation === 'caution' ? 'var(--warning)' : 'var(--danger)'
                                      }}>
                                        {multiAgentResult.neutral_judge.recommendation}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Key Revisions */}
                                  {multiAgentResult.neutral_judge.key_changes && multiAgentResult.neutral_judge.key_changes.length > 0 && (
                                    <div style={{ marginBottom: '1rem' }}>
                                      <span style={{ fontSize: '0.725rem', fontWeight: '600', color: '#60a5fa', display: 'block', marginBottom: '0.4rem' }}>
                                        🔧 Key Adjustments to Balance Clause
                                      </span>
                                      <ul style={{ paddingLeft: '1.1rem', fontSize: '0.725rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.25rem', listStyleType: 'disc' }}>
                                        {multiAgentResult.neutral_judge.key_changes.map((item, idx) => (
                                          <li key={idx}>{item}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}

                                  {/* Mutual Revised Wording */}
                                  <div>
                                    <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#34d399', display: 'block', marginBottom: '0.5rem' }}>
                                      Suggested Mutually Balanced Wording
                                    </span>
                                    <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '6px', padding: '0.75rem', fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--text-muted)', lineHeight: '1.4', marginBottom: '0.75rem' }}>
                                      {multiAgentResult.neutral_judge.revised_clause}
                                    </div>
                                    <button 
                                      className="btn-copy-alt"
                                      style={{ width: '100%', justifyContent: 'center' }}
                                      onClick={() => copyToClipboard(multiAgentResult.neutral_judge.revised_clause)}
                                    >
                                      <Copy size={12} />
                                      {copySuccess ? 'Copied Balanced Wording!' : 'Copy Balanced Alternative'}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </>
                      ) : (
                        <div style={{ textAlign: 'center', padding: '6rem 2rem', color: 'var(--text-dimmed)' }}>
                          <AlertTriangle size={38} color="rgba(255,255,255,0.05)" style={{ marginBottom: '1rem', display: 'block', marginLeft: 'auto', marginRight: 'auto' }} />
                          <h4>No Clause Selected</h4>
                          <p style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>
                            Click on a highlighted clause in the document or select a item from the Risks Matrix to review the detailed AI redlines and drafting alternatives.
                          </p>
                        </div>
                      )}
                    </motion.div>
                  )}
                  {activeTab === 'simplify' && (
                    <motion.div
                      key="simplify"
                      className="redline-section"
                      initial={{ opacity: 0, x: 18 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -18 }}
                      transition={{ duration: 0.28 }}
                    >
                      {selectedRisk ? (
                        <>
                          <div className="redline-header">
                            <div className="redline-title-bar">
                              <span style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Legal Simplification Engine
                              </span>
                              <h4 style={{ fontSize: '1rem', fontWeight: '600' }}>{selectedRisk.clause_title}</h4>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              {/* Language Selector */}
                              <select 
                                value={activeLanguage}
                                onChange={(e) => {
                                  const lang = e.target.value;
                                  setActiveLanguage(lang);
                                  runSimplify(selectedRisk.clause_title, selectedRisk.clause_text || selectedRisk.clause_title, lang === 'english' ? undefined : lang);
                                }}
                                style={{
                                  background: 'rgba(255,255,255,0.05)',
                                  border: '1px solid rgba(255,255,255,0.1)',
                                  borderRadius: '6px',
                                  color: 'white',
                                  fontSize: '0.75rem',
                                  padding: '0.25rem 0.5rem',
                                  outline: 'none',
                                  cursor: 'pointer'
                                }}
                              >
                                <option value="english" style={{ background: '#1e1e1e' }}>English</option>
                                <option value="hindi" style={{ background: '#1e1e1e' }}>Hindi (हिंदी)</option>
                                <option value="kannada" style={{ background: '#1e1e1e' }}>Kannada (ಕನ್ನಡ)</option>
                                <option value="tamil" style={{ background: '#1e1e1e' }}>Tamil (தமிழ்)</option>
                                <option value="telugu" style={{ background: '#1e1e1e' }}>Telugu (తెలుగు)</option>
                                <option value="bengali" style={{ background: '#1e1e1e' }}>Bengali (বাংলা)</option>
                                <option value="malayalam" style={{ background: '#1e1e1e' }}>Malayalam (മലയാളം)</option>
                              </select>
                              <button 
                                className="btn-back-list"
                                onClick={() => setActiveTab('risks')}
                              >
                                Back to Matrix
                              </button>
                            </div>
                          </div>

                          {/* Level Tabs */}
                          <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
                            <button 
                              className={`tab-btn ${activeSimplifyLevel === 'professional' ? 'active' : ''}`}
                              style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem', borderRadius: '4px' }}
                              onClick={() => setActiveSimplifyLevel('professional')}
                            >
                              💼 Professional
                            </button>
                            <button 
                              className={`tab-btn ${activeSimplifyLevel === 'simple' ? 'active' : ''}`}
                              style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem', borderRadius: '4px' }}
                              onClick={() => setActiveSimplifyLevel('simple')}
                            >
                              💡 Simple
                            </button>
                            <button 
                              className={`tab-btn ${activeSimplifyLevel === 'illiterate_friendly' ? 'active' : ''}`}
                              style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem', borderRadius: '4px' }}
                              onClick={() => setActiveSimplifyLevel('illiterate_friendly')}
                            >
                              👋 Conversational
                            </button>
                          </div>

                          {isSimplifying && (
                            <div style={{ padding: '4rem 2rem', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px dashed rgba(255,255,255,0.06)' }}>
                              <div className="brand-logo-icon" style={{ width: '40px', height: '40px', borderRadius: '10px', margin: '0 auto 1rem auto', animation: 'spin 2s linear infinite', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.05)' }}>
                                <BookOpen size={20} color="var(--primary)" />
                              </div>
                              <h6 style={{ fontSize: '0.8rem', fontWeight: '600', marginBottom: '0.25rem' }}>Simplifying Clause Wording...</h6>
                              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                Translating to {activeLanguage.toUpperCase()} and formatting explanation...
                              </p>
                            </div>
                          )}

                          {simplifyResult && isVoiceSupported() && (
                            <div
                              style={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: '0.5rem',
                                alignItems: 'center',
                                padding: '0.75rem 1rem',
                                background: 'rgba(99,102,241,0.08)',
                                border: '1px solid rgba(99,102,241,0.2)',
                                borderRadius: '8px',
                                marginBottom: '1rem',
                              }}
                            >
                              <Volume2 size={16} color="var(--primary)" />
                              <span style={{ fontSize: '0.75rem', fontWeight: 600, flex: 1 }}>
                                Voice accessibility — listen in {activeLanguage}
                              </span>
                              <button
                                type="button"
                                className="tab-btn active"
                                style={{ padding: '0.35rem 0.75rem', fontSize: '0.7rem' }}
                                disabled={isLoadingVoice}
                                onClick={handleListenExplanation}
                              >
                                {isLoadingVoice ? 'Preparing…' : '▶ Listen'}
                              </button>
                              {isSpeaking() && !isPaused() && (
                                <button type="button" className="tab-btn" style={{ padding: '0.35rem 0.75rem', fontSize: '0.7rem' }} onClick={pauseSpeech}>
                                  <Pause size={12} /> Pause
                                </button>
                              )}
                              {isPaused() && (
                                <button type="button" className="tab-btn" style={{ padding: '0.35rem 0.75rem', fontSize: '0.7rem' }} onClick={resumeSpeech}>
                                  ▶ Resume
                                </button>
                              )}
                              {(isSpeaking() || isPaused()) && (
                                <button
                                  type="button"
                                  className="tab-btn"
                                  style={{ padding: '0.35rem 0.75rem', fontSize: '0.7rem' }}
                                  onClick={() => { stopSpeech(); setVoiceProgress({ current: 0, total: 0 }); }}
                                >
                                  <Square size={12} /> Stop
                                </button>
                              )}
                              {voiceProgress.total > 0 && (
                                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', width: '100%' }}>
                                  Part {voiceProgress.current} of {voiceProgress.total}
                                </span>
                              )}
                            </div>
                          )}

                          {simplifyResult && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                              
                              {/* Explanation Card */}
                              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '1.25rem' }}>
                                <span style={{ fontSize: '0.7rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--primary)', display: 'block', marginBottom: '0.5rem' }}>
                                  De-Jargonized Explanation
                                </span>
                                <p style={{ fontSize: '0.825rem', color: 'white', lineHeight: '1.5', margin: 0 }}>
                                  {activeLanguage === 'english' 
                                    ? simplifyResult.english[activeSimplifyLevel].explanation
                                    : simplifyResult.translations[activeLanguage]?.[activeSimplifyLevel].explanation || simplifyResult.english[activeSimplifyLevel].explanation
                                  }
                                </p>
                              </div>

                              {/* Real-World Consequence */}
                              <div style={{ background: 'rgba(255,165,0,0.02)', border: '1px solid rgba(255,165,0,0.15)', borderRadius: '8px', padding: '1.25rem' }}>
                                <span style={{ fontSize: '0.7rem', fontWeight: '700', textTransform: 'uppercase', color: 'orange', display: 'block', marginBottom: '0.5rem' }}>
                                  ⚠️ Real-World Consequence
                                </span>
                                <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.85)', lineHeight: '1.4', margin: 0 }}>
                                  {activeLanguage === 'english'
                                    ? simplifyResult.english[activeSimplifyLevel].real_world_consequence
                                    : simplifyResult.translations[activeLanguage]?.[activeSimplifyLevel].real_world_consequence || simplifyResult.english[activeSimplifyLevel].real_world_consequence
                                  }
                                </p>
                              </div>

                              {/* Pros & Cons Grid */}
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div style={{ background: 'rgba(16,185,129,0.02)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: '8px', padding: '1rem' }}>
                                  <span style={{ fontSize: '0.7rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--success)', display: 'block', marginBottom: '0.5rem' }}>
                                    ✅ Advantages
                                  </span>
                                  <ul style={{ paddingLeft: '1.1rem', fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.4rem', listStyleType: 'disc' }}>
                                    {(activeLanguage === 'english'
                                      ? simplifyResult.english[activeSimplifyLevel].advantages
                                      : simplifyResult.translations[activeLanguage]?.[activeSimplifyLevel].advantages || simplifyResult.english[activeSimplifyLevel].advantages
                                    ).map((adv, idx) => (
                                      <li key={idx}>{adv}</li>
                                    ))}
                                  </ul>
                                </div>

                                <div style={{ background: 'rgba(239,68,68,0.02)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: '8px', padding: '1rem' }}>
                                  <span style={{ fontSize: '0.7rem', fontWeight: '700', textTransform: 'uppercase', color: 'var(--danger)', display: 'block', marginBottom: '0.5rem' }}>
                                    ❌ Disadvantages / Risks
                                  </span>
                                  <ul style={{ paddingLeft: '1.1rem', fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.4rem', listStyleType: 'disc' }}>
                                    {(activeLanguage === 'english'
                                      ? simplifyResult.english[activeSimplifyLevel].disadvantages
                                      : simplifyResult.translations[activeLanguage]?.[activeSimplifyLevel].disadvantages || simplifyResult.english[activeSimplifyLevel].disadvantages
                                    ).map((dis, idx) => (
                                      <li key={idx}>{dis}</li>
                                    ))}
                                  </ul>
                                </div>
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <div style={{ textAlign: 'center', padding: '6rem 2rem', color: 'var(--text-dimmed)' }}>
                          <BookOpen size={38} color="rgba(255,255,255,0.05)" style={{ marginBottom: '1rem', display: 'block', marginLeft: 'auto', marginRight: 'auto' }} />
                          <h4>No Clause Selected</h4>
                          <p style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>
                            Select a clause in the contract viewer or Risks Matrix to run the Legal Simplification engine.
                          </p>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {activeTab === 'negotiate' && (
                    <motion.div
                      key="negotiate"
                      className="chat-pane"
                      style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: '480px' }}
                      initial={{ opacity: 0, x: 18 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -18 }}
                      transition={{ duration: 0.28 }}
                    >
                      {selectedRisk ? (
                        <>
                          <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.01)' }}>
                            <div>
                              <strong style={{ fontSize: '0.8rem', color: 'white', display: 'block' }}>🤝 Interactive AI Negotiator</strong>
                              <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Tailor recommendations: "{selectedRisk.clause_title}"</span>
                            </div>
                            <button 
                              className="btn-back-list"
                              style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem' }}
                              onClick={() => startNegotiation(selectedRisk.clause_title, selectedRisk.clause_text || selectedRisk.clause_title)}
                            >
                              🔄 Reset
                            </button>
                          </div>

                          <div className="chat-history" style={{ flex: 1, padding: '1rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div className="chat-bubble ai" style={{ maxWidth: '100%', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', alignSelf: 'flex-start' }}>
                              <p style={{ fontSize: '0.75rem', margin: 0, lineHeight: '1.4' }}>
                                Welcome to the Negotiation Hub! Specify your concerns or budget constraints regarding this clause. For example:
                              </p>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.5rem' }}>
                                <button 
                                  className="btn-sample"
                                  style={{ padding: '0.2rem 0.5rem', fontSize: '0.65rem', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', color: 'var(--primary)', border: '1px solid rgba(255,255,255,0.05)' }}
                                  onClick={() => setNegotiationInput("I am fine with standard liability risk because the salary offer is exceptionally high.")}
                                >
                                  "Salary is worth liability risk"
                                </button>
                                <button 
                                  className="btn-sample"
                                  style={{ padding: '0.2rem 0.5rem', fontSize: '0.65rem', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', color: 'var(--primary)', border: '1px solid rgba(255,255,255,0.05)' }}
                                  onClick={() => setNegotiationInput("Can we add gross negligence exemptions to this limitation clause?")}
                                >
                                  "Add gross negligence exemptions"
                                </button>
                              </div>
                            </div>

                            {negotiationHistory.map((turn, index) => (
                              <div key={index} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                <div className="chat-bubble user" style={{ alignSelf: 'flex-end', background: 'var(--primary)', color: 'white', maxWidth: '85%' }}>
                                  <p style={{ fontSize: '0.75rem', margin: 0, opacity: 0.8 }}>Stated Priority / Concern</p>
                                  <div style={{ fontSize: '0.8rem', marginTop: '0.25rem', whiteSpace: 'pre-wrap' }}>
                                    {turn.user_concern || negotiationHistory[index]?.acknowledgement || "Evaluating priority..."}
                                  </div>
                                </div>

                                <div className="chat-bubble ai" style={{ alignSelf: 'flex-start', maxWidth: '100%', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                  <div>
                                    <span style={{ fontSize: '0.65rem', color: 'var(--primary)', fontWeight: '700', textTransform: 'uppercase', display: 'block', marginBottom: '0.25rem' }}>AI Advisor Perspective</span>
                                    <p style={{ fontSize: '0.75rem', margin: 0, lineHeight: '1.4', color: 'white' }}>{turn.acknowledgement}</p>
                                  </div>

                                  <div style={{ background: 'rgba(255,255,255,0.02)', borderLeft: '3px solid var(--warning)', padding: '0.5rem 0.75rem', borderRadius: '4px' }}>
                                    <span style={{ fontSize: '0.65rem', color: 'orange', fontWeight: '700', textTransform: 'uppercase', display: 'block', marginBottom: '0.25rem' }}>⚖️ Recalculated Trade-offs</span>
                                    <p style={{ fontSize: '0.75rem', margin: 0, lineHeight: '1.4', color: 'var(--text-muted)' }}>{turn.tradeoff_explanation}</p>
                                  </div>

                                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', background: 'rgba(0,0,0,0.1)', padding: '0.5rem', borderRadius: '4px' }}>
                                    <div>
                                      <span style={{ fontSize: '0.65rem', color: 'var(--text-dimmed)', display: 'block' }}>Dynamic Verdict:</span>
                                      <strong style={{ fontSize: '0.75rem', color: 'white' }}>{turn.updated_verdict}</strong>
                                    </div>
                                    <div>
                                      <span style={{ fontSize: '0.65rem', color: 'var(--text-dimmed)', display: 'block' }}>Recalculated Action:</span>
                                      <span style={{ 
                                        fontWeight: '700', 
                                        fontSize: '0.75rem',
                                        textTransform: 'uppercase', 
                                        color: turn.updated_recommendation === 'safe' ? 'var(--success)' : 
                                               turn.updated_recommendation === 'caution' ? 'var(--warning)' : 'var(--danger)'
                                      }}>
                                        {turn.updated_recommendation}
                                      </span>
                                    </div>
                                  </div>

                                  {turn.negotiation_leverage && turn.negotiation_leverage.length > 0 && (
                                    <div>
                                      <span style={{ fontSize: '0.65rem', color: 'var(--success)', fontWeight: '700', textTransform: 'uppercase', display: 'block', marginBottom: '0.25rem' }}>💡 Negotiation Leverage Points</span>
                                      <ul style={{ paddingLeft: '1.1rem', fontSize: '0.725rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.25rem', listStyleType: 'decimal' }}>
                                        {turn.negotiation_leverage.map((item, idx) => (
                                          <li key={idx}>{item}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}

                                  {turn.protective_addition && (
                                    <div style={{ background: 'rgba(16,185,129,0.03)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: '6px', padding: '0.75rem', marginTop: '0.25rem' }}>
                                      <span style={{ fontSize: '0.65rem', color: '#34d399', fontWeight: '700', textTransform: 'uppercase', display: 'block', marginBottom: '0.4rem' }}>🛡️ Suggested Protective Clause Addendum</span>
                                      <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '4px', padding: '0.5rem', fontSize: '0.7rem', fontFamily: 'monospace', color: 'var(--text-muted)', lineHeight: '1.3', marginBottom: '0.5rem' }}>
                                        {turn.protective_addition}
                                      </div>
                                      <button 
                                        className="btn-copy-alt"
                                        style={{ width: '100%', padding: '0.25rem', fontSize: '0.65rem', justifyContent: 'center' }}
                                        onClick={() => copyToClipboard(turn.protective_addition)}
                                      >
                                        <Copy size={10} />
                                        {copySuccess ? 'Copied Wording!' : 'Copy Protective Addendum'}
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}

                            {isNegotiating && (
                              <div className="chat-bubble ai" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: 0.6, alignSelf: 'flex-start' }}>
                                <span className="api-status-dot" style={{ animation: 'pulse-green 1s infinite' }}></span>
                                Re-calculating tradeoffs and auditing contract context...
                              </div>
                            )}
                            <div ref={negotiationEndRef} />
                          </div>

                          <div className="chat-input-container" style={{ padding: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                            <input 
                              type="text"
                              className="chat-input"
                              placeholder="Type a concern (e.g. 'I agree to X but need a safety floor of ₹5 Lakhs')"
                              value={negotiationInput}
                              onChange={(e) => setNegotiationInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') submitNegotiationTurn();
                              }}
                              disabled={isNegotiating || !negotiationSessionId}
                            />
                            <button 
                              className="btn-send"
                              onClick={submitNegotiationTurn}
                              disabled={isNegotiating || !negotiationInput.trim() || !negotiationSessionId}
                            >
                              <Send size={14} color="white" />
                            </button>
                          </div>
                        </>
                      ) : (
                        <div style={{ textAlign: 'center', padding: '6rem 2rem', color: 'var(--text-dimmed)' }}>
                          <Activity size={38} color="rgba(255,255,255,0.05)" style={{ marginBottom: '1rem', display: 'block', marginLeft: 'auto', marginRight: 'auto' }} />
                          <h4>No Clause Selected</h4>
                          <p style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>
                            Select a clause in the contract viewer or Risks Matrix to run the Interactive AI Negotiation Assistant.
                          </p>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {activeTab === 'chat' && (
                    <motion.div
                      key="chat"
                      className="chat-pane"
                      initial={{ opacity: 0, x: 18 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -18 }}
                      transition={{ duration: 0.28 }}
                    >
                      <div className="chat-history">
                        {chatHistory.map((msg, index) => (
                          <div 
                            key={index}
                            className={`chat-bubble ${msg.sender}`}
                          >
                            <p style={{ whiteSpace: 'pre-line' }}>{msg.text}</p>
                            
                            {msg.references && msg.references.length > 0 && (
                              <div className="chat-bubble-references">
                                <strong>Contract Evidence:</strong>
                                {msg.references.map((ref, idx) => (
                                  <div key={idx} style={{ marginTop: '4px', borderLeft: '2px solid rgba(255,255,255,0.1)', paddingLeft: '6px' }}>
                                    "{ref.length > 150 ? `${ref.substring(0, 150)}...` : ref}"
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                        {isChatting && (
                          <div className="chat-bubble ai" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: 0.6 }}>
                            <span className="api-status-dot" style={{ animation: 'pulse-green 1s infinite' }}></span>
                            LexGuard Agent is analyzing...
                          </div>
                        )}
                        <div ref={chatEndRef} />
                      </div>

                      <form className="chat-input-container" onSubmit={handleSendChat}>
                        <input 
                          type="text"
                          className="chat-input"
                          placeholder="Ask LexGuard about governing law, late fees, caps..."
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          disabled={isChatting}
                        />
                        <button 
                          type="submit" 
                          className="btn-send"
                          disabled={!chatInput.trim() || isChatting}
                        >
                          <Send size={16} color="white" />
                        </button>
                      </form>
                    </motion.div>
                  )}
                </AnimatePresence>
                </div>
              </motion.aside>
            </motion.div>
          )}
        </main>

      {/* Page Footer */}
      {!analysis && (
      <footer className="app-footer">
        <p>LexGuard AI Compliance Guard • Elite automated contract redlining systems powered by Google Gemini</p>
      </footer>
      )}
    </div>
  );
}
