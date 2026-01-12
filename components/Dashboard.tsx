import React, { useState, useEffect, useRef } from 'react';
import { Bot, BotCommand, GeneratedContent, AnalyticsData } from '../types';
import { generateBotProfile } from '../services/geminiService';
import { Play, Pause, Trash2, Plus, Zap, Activity, Copy, Check, Terminal, ShieldCheck, Loader2, AlertCircle, RefreshCw, FileText, Command, X, Save, Edit3, ChevronRight, Search, RotateCw, BarChart3, Bitcoin, Headphones, Gamepad2, ShoppingBag, Newspaper, Image as ImageIcon, Music, Video, Code2, MessageCircle, HelpCircle, Moon, Sun, Upload, User, Settings, Palette, LogOut, DollarSign, LifeBuoy, Menu, ChevronDown, Eye, EyeOff, Key } from 'lucide-react';
import { db, auth } from '../firebase';
import { ref, onValue, push, set, remove, update } from 'firebase/database';
import { signOut } from 'firebase/auth';

interface DashboardProps {
  userEmail: string;
}

// Preset icons map
const PRESET_ICONS: Record<string, React.ElementType> = {
  Bitcoin, Headphones, Gamepad2, ShoppingBag, Newspaper, ImageIcon, Music, Video, Code2, Terminal, User, Settings, Zap, ShieldCheck
};

// Helper to generate mock analytics (Keep this local/mock for now as analytics collection requires a real bot)
const generateMockAnalytics = (): AnalyticsData[] => {
  const data = [];
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  for (let i = 0; i < 7; i++) {
    data.push({
      date: days[i],
      messages: Math.floor(Math.random() * 2000) + 500,
      users: Math.floor(Math.random() * 150) + 20
    });
  }
  return data;
};

const Dashboard: React.FC<DashboardProps> = ({ userEmail }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const [bots, setBots] = useState<Bot[]>([]);
  
  const [activeTab, setActiveTab] = useState<'bots' | 'create' | 'ai' | 'pricing' | 'support' | 'faq'>('bots');
  const [newToken, setNewToken] = useState('');
  const [newBotName, setNewBotName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // AI State
  const [niche, setNiche] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<GeneratedContent | null>(null);

  // Modal State
  const [selectedBot, setSelectedBot] = useState<Bot | null>(null);
  const [modalType, setModalType] = useState<'logs' | 'commands' | 'analytics' | 'icon' | 'settings' | null>(null);

  // Settings State
  const [updateTokenValue, setUpdateTokenValue] = useState('');
  const [showToken, setShowToken] = useState(false);

  // Command Editing State
  const [cmdInput, setCmdInput] = useState('');
  const [descInput, setDescInput] = useState('');
  const [editingCmdIndex, setEditingCmdIndex] = useState<number | null>(null);

  const userId = auth.currentUser?.uid;

  // Firebase Realtime Listener
  useEffect(() => {
    if (!userId) return;

    const botsRef = ref(db, `users/${userId}/bots`);
    const unsubscribe = onValue(botsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Convert Object of Objects to Array
        const botsArray: Bot[] = Object.keys(data).map(key => ({
          ...data[key],
          id: key,
          analytics: data[key].analytics || generateMockAnalytics() // Fallback if no analytics saved
        }));
        setBots(botsArray.reverse()); // Show newest first
      } else {
        setBots([]);
      }
    });

    return () => unsubscribe();
  }, [userId]);

  // Real-time Simulation (Local visual effect only, or you can update DB)
  // For this demo, we will only update local state to avoid database write flooding on free tier
  useEffect(() => {
    const interval = setInterval(() => {
      setBots(currentBots => currentBots.map(bot => {
        if (bot.status !== 'running') return bot;
        
        // Simple visual fluctuation for running bots
        const change = (Math.random() - 0.3) * 0.1;
        const newUptime = Math.min(100, Math.max(90, bot.uptime + change));
        return { ...bot, uptime: Number(newUptime.toFixed(2)) };
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const getBotIcon = (bot: Bot) => {
    if (bot.customIcon) {
        if (bot.customIcon.startsWith('data:')) {
            return (props: any) => <img src={bot.customIcon} alt="icon" className={`w-7 h-7 object-cover rounded-full ${props.className}`} />;
        }
        const Preset = PRESET_ICONS[bot.customIcon];
        if (Preset) return Preset;
    }
    const n = bot.name.toLowerCase();
    if (n.includes('crypto') || n.includes('btc')) return Bitcoin;
    if (n.includes('support')) return Headphones;
    if (n.includes('game')) return Gamepad2;
    return Terminal;
  };

  const handleAddBot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;

    const newBotData = {
      name: newBotName || 'My_New_Bot',
      token: newToken,
      status: 'deploying',
      uptime: 0,
      created_at: new Date().toISOString().split('T')[0],
      commands: [],
      // analytics: generateMockAnalytics() // Optional: Save initial analytics
    };

    const botsRef = ref(db, `users/${userId}/bots`);
    const newBotRef = push(botsRef);
    
    // Simulate deployment process
    await set(newBotRef, newBotData);
    
    setNewToken('');
    setNewBotName('');
    setActiveTab('bots');

    // Simulate "Deployed" state after 3 seconds in DB
    setTimeout(() => {
        update(newBotRef, { status: 'running', uptime: 100 });
    }, 3000);
  };

  const cloneBot = async (bot: Bot) => {
      if (!userId) return;
      const botsRef = ref(db, `users/${userId}/bots`);
      const newBotRef = push(botsRef);
      const clonedData = {
          ...bot,
          name: `${bot.name}_Copy`,
          status: 'stopped',
          uptime: 0,
          analytics: null // Reset analytics
      };
      // remove id from object before saving
      delete (clonedData as any).id;
      await set(newBotRef, clonedData);
  };

  const toggleStatus = async (bot: Bot) => {
    if (!userId) return;
    const botRef = ref(db, `users/${userId}/bots/${bot.id}`);
    
    if (bot.status === 'running') {
        await update(botRef, { status: 'stopped', uptime: 0 });
    } else {
        await update(botRef, { status: 'deploying' });
        setTimeout(() => {
            update(botRef, { status: 'running', uptime: 100 });
        }, 2000);
    }
  };

  const restartBot = async (id: string) => {
    if (!userId) return;
    const botRef = ref(db, `users/${userId}/bots/${id}`);
    await update(botRef, { status: 'restarting' });
    setTimeout(() => {
        update(botRef, { status: 'running', uptime: 100 });
    }, 3000);
  };

  const deleteBot = async (id: string) => {
    if (!confirm("Are you sure you want to delete this bot?")) return;
    if (!userId) return;
    
    const botRef = ref(db, `users/${userId}/bots/${id}`);
    await remove(botRef);
    if (selectedBot?.id === id) closeModal();
  };

  const handleLogout = async () => {
    await signOut(auth);
  };

  // ... (Keep handleAiGenerate same as before)
  const handleAiGenerate = async () => {
    if (!niche) return;
    setAiLoading(true);
    try {
      const result = await generateBotProfile(niche, newBotName || 'MyBot');
      setAiResult(result);
    } catch (e) {
      alert("Failed to generate content. Please try again.");
    } finally {
      setAiLoading(false);
    }
  };

  // ... (Keep other handlers like handleIconUpload, handlePresetSelect, but add Firebase update)
  const handleUpdateBotData = async (updatedData: Partial<Bot>) => {
      if (!userId || !selectedBot) return;
      const botRef = ref(db, `users/${userId}/bots/${selectedBot.id}`);
      await update(botRef, updatedData);
      setSelectedBot({ ...selectedBot, ...updatedData });
  };

  const handleIconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && selectedBot) {
          const reader = new FileReader();
          reader.onloadend = () => {
              const res = reader.result as string;
              handleUpdateBotData({ customIcon: res });
              closeModal();
          };
          reader.readAsDataURL(file);
      }
  };

  const handlePresetSelect = (iconName: string) => {
      if (selectedBot) {
          handleUpdateBotData({ customIcon: iconName });
          closeModal();
      }
  };

  const handleUpdateToken = (e: React.FormEvent) => {
      e.preventDefault();
      if(selectedBot && updateTokenValue) {
          handleUpdateToken({ token: updateTokenValue } as any); // Type cast for simplicity
          setUpdateTokenValue('');
          closeModal();
      }
  }

  // Command Management with Firebase
  const handleSaveCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBot || !cmdInput || !descInput || !userId) return;
    
    const newCommand: BotCommand = { command: cmdInput, description: descInput };
    let updatedCommands = selectedBot.commands ? [...selectedBot.commands] : [];
    
    if (editingCmdIndex !== null) {
      updatedCommands[editingCmdIndex] = newCommand;
    } else {
      updatedCommands.push(newCommand);
    }
    
    await handleUpdateBotData({ commands: updatedCommands });
    setCmdInput(''); setDescInput(''); setEditingCmdIndex(null);
  };

  const handleDeleteCommand = async (index: number) => {
    if (!selectedBot || !selectedBot.commands) return;
    const updatedCommands = selectedBot.commands.filter((_, i) => i !== index);
    await handleUpdateBotData({ commands: updatedCommands });
  };

  const filteredBots = bots.filter(bot => 
    bot.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusConfig = (status: Bot['status']) => {
    switch(status) {
      case 'running': return { color: 'text-green-600', bg: 'bg-green-100', icon: Zap, label: 'Running', border: 'border-green-200' };
      case 'deploying': return { color: 'text-amber-600', bg: 'bg-amber-100', icon: Loader2, label: 'Deploying', border: 'border-amber-200', animate: true };
      case 'restarting': return { color: 'text-blue-600', bg: 'bg-blue-100', icon: Loader2, label: 'Restarting', border: 'border-blue-200', animate: true };
      case 'failed': return { color: 'text-red-600', bg: 'bg-red-100', icon: AlertCircle, label: 'Failed', border: 'border-red-200' };
      case 'stopped': return { color: 'text-slate-500', bg: 'bg-slate-100', icon: Pause, label: 'Stopped', border: 'border-slate-200' };
    }
  };

  // Modal Actions
  const openLogs = (bot: Bot) => { setSelectedBot(bot); setModalType('logs'); };
  const openCommands = (bot: Bot) => { setSelectedBot(bot); setModalType('commands'); setCmdInput(''); setDescInput(''); setEditingCmdIndex(null); };
  const openAnalytics = (bot: Bot) => { setSelectedBot(bot); setModalType('analytics'); };
  const openIconPicker = (bot: Bot) => { setSelectedBot(bot); setModalType('icon'); };
  const openSettings = (bot: Bot) => { setSelectedBot(bot); setModalType('settings'); setUpdateTokenValue(''); setShowToken(false); };
  const closeModal = () => { setSelectedBot(null); setModalType(null); setEditingCmdIndex(null); };

  // ... (LogView and SimpleBarChart components remain the same as previous)
  const LogView = ({ bot }: { bot: Bot }) => {
    const logsEndRef = useRef<HTMLDivElement>(null);
    const [logs] = useState(() => {
        const lines = [
            `[${new Date().toLocaleTimeString()}] System: Connecting to Firebase RTDB...`,
            `[${new Date().toLocaleTimeString()}] Bot: Configuration loaded for ${bot.name}`,
        ];
        if (bot.status === 'running') lines.push(`[${new Date().toLocaleTimeString()}] Status: Online and listening.`);
        return lines;
    });

    return (
        <div className="bg-[#121212] rounded-xl p-4 font-mono text-xs md:text-sm text-cta-DEFAULT h-96 overflow-y-auto shadow-inner border border-gray-800">
            {logs.map((log, i) => (
                <div key={i} className="mb-1 border-b border-white/5 pb-1 last:border-0">{log}</div>
            ))}
            <div ref={logsEndRef} />
        </div>
    );
  };

  const SimpleBarChart = ({ data, dataKey, colorClass }: { data: AnalyticsData[], dataKey: keyof AnalyticsData, colorClass: string }) => {
    const max = Math.max(...data.map(d => Number(d[dataKey])));
    return (
        <div className="h-40 flex items-end justify-between gap-2 pt-4 pb-6 px-2 relative border-b border-gray-100 dark:border-gray-700">
            {data.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2 group relative">
                    <div className="w-full relative h-full flex items-end">
                       <div className={`w-full rounded-md ${colorClass} opacity-80 group-hover:opacity-100 transition-all duration-500 ease-out`} style={{ height: `${(Number(d[dataKey]) / max) * 100}%` }}></div>
                    </div>
                    <span className="text-[10px] text-gray-400 font-medium">{d.date}</span>
                </div>
            ))}
        </div>
    )
  };

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-300 ${theme === 'dark' ? 'bg-[#1E1E1E] text-white' : 'bg-[#F7F9FC] text-[#1E1E1E]'}`}>
      {/* Dark Mode Styles Override */}
      {theme === 'dark' && (
          <style>{`
            .glass { background: rgba(30, 30, 30, 0.8) !important; border-color: rgba(255,255,255,0.1) !important; color: white; }
            .glass-card { background: rgba(40, 40, 40, 0.6) !important; border-color: rgba(255,255,255,0.05) !important; color: white; }
            .glass-modal { background: rgba(30, 30, 30, 0.95) !important; }
            input, textarea { background-color: rgba(50, 50, 50, 0.8) !important; color: white !important; border-color: rgba(255,255,255,0.1) !important; }
            .text-gray-500 { color: #9ca3af !important; }
            .bg-white { background-color: #2C2C2C !important; }
          `}</style>
      )}

      {/* Top Bar */}
      <header className="glass sticky top-0 z-20 px-6 py-4 flex justify-between items-center transition-all border-b border-brand-500/10">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab('bots')}>
          <div className="bg-gradient-to-br from-brand-500 to-accent text-white p-2 rounded-xl shadow-lg shadow-brand-500/30">
            <Terminal size={20} />
          </div>
          <span className={`font-bold text-xl tracking-tight ${theme === 'dark' ? 'text-white' : 'text-brand-800'}`}>Laga Host</span>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} 
            className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          >
            {theme === 'light' ? <Moon size={20} className="text-gray-600" /> : <Sun size={20} className="text-cta-DEFAULT" />}
          </button>
          
          <div className="relative">
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)} 
                className="flex items-center gap-2 bg-white dark:bg-dark-800 border border-gray-200 dark:border-gray-700 rounded-full px-3 py-1.5 hover:shadow-md transition-shadow"
              >
                 <div className="w-8 h-8 rounded-full bg-brand-50 flex items-center justify-center text-brand-500 font-bold text-sm">
                    {userEmail[0].toUpperCase()}
                 </div>
                 <Menu size={20} className="text-gray-500" />
              </button>
              
              {isMenuOpen && (
                  <div className={`absolute right-0 top-full mt-2 w-56 rounded-xl shadow-xl border overflow-hidden animate-fade-in z-50 ${theme === 'dark' ? 'bg-dark-900 border-gray-700' : 'bg-white border-gray-100'}`}>
                      <div className="p-3 border-b border-gray-100 dark:border-gray-800">
                          <p className={`text-sm font-bold truncate ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>{userEmail}</p>
                      </div>
                      <div className="p-2 border-t border-gray-100 dark:border-gray-800">
                          <button onClick={handleLogout} className="w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 transition-colors text-gray-600 dark:text-gray-300">
                              <LogOut size={16} /> Log Out
                          </button>
                      </div>
                  </div>
              )}
          </div>
        </div>
      </header>

      <div className="flex flex-col max-w-7xl mx-auto w-full p-4 md:p-8 relative z-10">
        {/* Navigation Tabs */}
        <div className="flex justify-center mb-8">
            <div className={`p-1.5 rounded-2xl flex items-center gap-2 shadow-lg border ${theme === 'dark' ? 'bg-dark-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <button 
                    onClick={() => setActiveTab('bots')}
                    className={`px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'bots' ? 'bg-brand-500 text-white shadow-md' : 'text-gray-500 hover:bg-brand-50 hover:text-brand-500 dark:hover:bg-gray-700'}`}
                >
                    <Activity size={18} /> My Bots
                </button>
                <button 
                    onClick={() => setActiveTab('create')}
                    className={`px-6 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'create' ? 'bg-brand-500 text-white shadow-md' : 'text-gray-500 hover:bg-brand-50 hover:text-brand-500 dark:hover:bg-gray-700'}`}
                >
                    <Plus size={18} /> Create Bot
                </button>
            </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 glass-card rounded-3xl p-6 md:p-8 min-h-[600px] transition-all pb-24 shadow-2xl">
          
          {activeTab === 'bots' && (
            <div className="animate-fade-in max-w-5xl mx-auto">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                  <h2 className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-brand-900'}`}>Your Bots</h2>
                  <p className="text-gray-500 mt-1">Manage and monitor your deployments.</p>
                </div>
                <div className="relative w-full md:w-auto">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Search bots..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={`pl-10 pr-4 py-2.5 rounded-xl border focus:ring-2 focus:ring-brand-500 outline-none text-sm w-full md:w-64 transition-all shadow-sm ${theme === 'dark' ? 'bg-dark-800 border-dark-900 text-white' : 'bg-white border-gray-200'}`}
                    />
                </div>
              </div>

              {filteredBots.length === 0 && bots.length > 0 ? (
                 <div className="text-center py-16 bg-white/50 rounded-3xl border border-white/50">
                    <Search className="text-gray-300 mx-auto mb-3" size={48} />
                    <p className="text-gray-500 font-medium">No bots found matching "{searchQuery}"</p>
                    <button onClick={() => setSearchQuery('')} className="text-brand-500 font-semibold text-sm mt-3 hover:underline">Clear Search</button>
                 </div>
              ) : bots.length === 0 ? (
                <div className="text-center py-20 bg-white/50 rounded-3xl border border-white/50">
                  <div className="bg-white rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4 shadow-sm">
                    <Activity className="text-gray-300" size={32} />
                  </div>
                  <h3 className="text-xl font-bold">No bots deployed yet</h3>
                  <p className="text-gray-500 mt-2 mb-6">Deploy your first Telegram bot in seconds.</p>
                  <button onClick={() => setActiveTab('create')} className="text-brand-500 font-bold hover:underline">Start Deployment &rarr;</button>
                </div>
              ) : (
                <div className="space-y-6">
                  {filteredBots.map((bot) => {
                    const status = getStatusConfig(bot.status);
                    const StatusIcon = status.icon;
                    const BotIcon = getBotIcon(bot);
                    
                    return (
                      <div key={bot.id} className={`bg-white dark:bg-dark-800 border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'} rounded-3xl p-6 transition-all shadow-sm hover:shadow-xl group`}>
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
                            <div className="flex items-center gap-5">
                                <div 
                                    className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-md ${theme === 'dark' ? 'bg-gray-800' : status.bg} ${status.color} relative overflow-hidden group cursor-pointer`}
                                    onClick={() => openIconPicker(bot)}
                                >
                                    <BotIcon size={32} className={`relative z-10 ${status.animate ? 'animate-pulse' : ''}`} />
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20">
                                        <Edit3 size={20} className="text-white" />
                                    </div>
                                </div>
                                <div>
                                    <h3 className={`font-bold text-xl flex items-center gap-2 ${theme === 'dark' ? 'text-gray-200' : 'text-brand-900'}`}>
                                        {bot.name}
                                    </h3>
                                    <div className="flex items-center gap-3 text-xs font-bold text-gray-500 mt-1 uppercase tracking-wide">
                                        <span className={`flex items-center gap-1.5 ${status.color}`}>
                                            <span className={`w-2 h-2 rounded-full bg-current ${status.animate ? 'animate-pulse' : ''}`}></span>
                                            {status.label}
                                        </span>
                                        <span className="text-gray-300">|</span>
                                        <span>Uptime: {bot.uptime}%</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <button 
                                  onClick={() => toggleStatus(bot)}
                                  className={`p-3 rounded-xl border transition-all ${bot.status === 'running' ? 'bg-red-50 text-red-500 border-red-100 hover:bg-red-100' : 'bg-green-50 text-green-500 border-green-100 hover:bg-green-100'}`}
                                >
                                  {bot.status === 'running' ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
                                </button>
                                <button 
                                  onClick={() => restartBot(bot.id)}
                                  className="p-3 rounded-xl border border-gray-100 bg-white hover:bg-gray-50 text-gray-600 dark:bg-dark-900 dark:border-gray-700 dark:text-gray-300"
                                  disabled={bot.status === 'deploying' || bot.status === 'restarting'}
                                >
                                  <RotateCw size={20} className={bot.status === 'restarting' ? 'animate-spin' : ''} />
                                </button>
                                <button 
                                    onClick={() => cloneBot(bot)} 
                                    className="p-3 rounded-xl border border-gray-100 bg-white hover:bg-gray-50 text-gray-600 dark:bg-dark-900 dark:border-gray-700 dark:text-gray-300"
                                >
                                    <Copy size={20} />
                                </button>
                                <button 
                                  onClick={() => deleteBot(bot.id)}
                                  className="p-3 rounded-xl border border-gray-100 bg-white hover:bg-red-50 hover:text-red-500 text-gray-400 dark:bg-dark-900 dark:border-gray-700 transition-colors"
                                >
                                  <Trash2 size={20} />
                                </button>
                            </div>
                        </div>
                        
                        <div className="h-px w-full bg-gray-100 dark:bg-gray-700 mb-6"></div>

                        <div className="flex flex-wrap gap-4">
                            <button 
                                onClick={() => openLogs(bot)} 
                                className={`flex-1 min-w-[140px] flex items-center justify-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all border ${theme === 'dark' ? 'bg-dark-900 border-gray-700 text-gray-300 hover:bg-dark-800' : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-white hover:shadow-sm'}`}
                            >
                                <FileText size={18} className="text-blue-500" /> Logs
                            </button>
                            
                            <button 
                                onClick={() => openCommands(bot)} 
                                className={`flex-1 min-w-[140px] flex items-center justify-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all border ${theme === 'dark' ? 'bg-dark-900 border-gray-700 text-gray-300 hover:bg-dark-800' : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-white hover:shadow-sm'}`}
                            >
                                <Command size={18} className="text-accent" /> Commands
                            </button>

                            <button 
                                onClick={() => openAnalytics(bot)} 
                                className={`flex-1 min-w-[140px] flex items-center justify-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all border ${theme === 'dark' ? 'bg-dark-900 border-gray-700 text-gray-300 hover:bg-dark-800' : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-white hover:shadow-sm'}`}
                            >
                                <BarChart3 size={18} className="text-emerald-500" /> Analytics
                            </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'create' && (
             <div className="max-w-2xl mx-auto py-8 animate-fade-in">
               <div className="text-center mb-10">
                 <h2 className={`text-3xl font-bold mb-3 ${theme === 'dark' ? 'text-white' : 'text-brand-900'}`}>Deploy a New Bot</h2>
                 <p className="text-gray-500">No VPS. No Coding. Just paste your token.</p>
               </div>
               
               <form onSubmit={handleAddBot} className={`space-y-8 p-8 rounded-3xl border shadow-sm ${theme === 'dark' ? 'bg-dark-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                 <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-500 mb-2">Bot Name (Optional)</label>
                      <input 
                        type="text" 
                        value={newBotName}
                        onChange={(e) => setNewBotName(e.target.value)}
                        placeholder="e.g. MySuperBot"
                        className="w-full px-5 py-3 rounded-xl border border-gray-200 outline-none focus:border-brand-500 transition-all shadow-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-500 mb-2">Bot Token</label>
                      <input 
                          type="text" 
                          required
                          value={newToken}
                          onChange={(e) => setNewToken(e.target.value)}
                          placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
                          className="w-full px-5 py-3 rounded-xl border border-gray-200 outline-none focus:border-brand-500 transition-all font-mono text-sm shadow-sm"
                        />
                    </div>
                 </div>
                 <div className="flex gap-4 pt-4">
                   <button type="button" onClick={() => setActiveTab('bots')} className="px-6 py-3 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50 font-semibold transition-colors">Cancel</button>
                   <button type="submit" className="flex-1 px-6 py-3 rounded-xl bg-brand-500 text-white hover:bg-brand-600 font-bold shadow-lg shadow-brand-500/30 transition-all hover:scale-[1.02]">Deploy Now</button>
                 </div>
               </form>
             </div>
          )}

        </main>
      </div>

      {/* Render Modals (Commands, Logs, etc) */}
      {/* ... (Keep existing Modals code, they rely on 'selectedBot' which is updated via Firebase sync) ... */}
       {modalType === 'icon' && selectedBot && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-900/60 backdrop-blur-md animate-fade-in">
             <div className="glass-modal w-full max-w-lg bg-white dark:bg-dark-900 rounded-3xl shadow-2xl border border-white/20 overflow-hidden flex flex-col">
                 <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                    <h3 className={`font-bold text-lg ${theme === 'dark' ? 'text-white' : 'text-brand-900'}`}>Choose Icon</h3>
                    <button onClick={closeModal} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"><X size={20} className="text-gray-500"/></button>
                 </div>
                 <div className="p-6">
                    <div className="mb-6">
                        <label className="block text-sm font-semibold text-gray-500 mb-3">Upload Custom</label>
                        <div className="relative border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-8 text-center hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer group">
                            <input type="file" accept="image/*" onChange={handleIconUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                            <Upload className="mx-auto text-gray-400 mb-2 group-hover:text-brand-500" size={32} />
                            <p className="text-sm text-gray-500">Click to upload image</p>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-500 mb-3">Presets</label>
                        <div className="grid grid-cols-6 gap-3">
                            {Object.entries(PRESET_ICONS).map(([name, Icon]) => (
                                <button 
                                    key={name} 
                                    onClick={() => handlePresetSelect(name)}
                                    className={`p-3 rounded-xl flex items-center justify-center transition-all ${selectedBot.customIcon === name ? 'bg-brand-50 text-brand-500 ring-2 ring-brand-500' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                                    title={name}
                                >
                                    <Icon size={24} />
                                </button>
                            ))}
                        </div>
                    </div>
                 </div>
             </div>
         </div>
      )}

      {/* Commands Modal */}
      {modalType === 'commands' && selectedBot && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-900/60 backdrop-blur-md animate-fade-in">
            <div className={`glass-card w-full max-w-2xl rounded-3xl flex flex-col max-h-[85vh] shadow-2xl border-white/40 ${theme === 'dark' ? 'bg-dark-900' : ''}`}>
                 <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-white/40 backdrop-blur-md">
                    <div className="flex items-center gap-3"><div className="p-2 bg-white rounded-xl shadow-sm"><Command size={20} className="text-accent"/></div><div><h3 className={`font-bold text-lg ${theme === 'dark' ? 'text-white' : 'text-brand-900'}`}>Command Manager</h3></div></div>
                    <button onClick={closeModal}><X size={20} className="text-gray-500"/></button>
                </div>
                <div className="flex-1 overflow-y-auto p-6 bg-white/30 dark:bg-dark-800/30 custom-scrollbar">
                     {(selectedBot.commands || []).map((cmd, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-white/60 dark:bg-dark-800/60 rounded-xl border border-white/50 dark:border-gray-700 shadow-sm mb-3">
                            <span className="font-mono text-brand-500 dark:text-brand-400">/{cmd.command}</span>
                            <span className="text-sm text-gray-500">{cmd.description}</span>
                            <div className="flex gap-2">
                                <button onClick={() => handleDeleteCommand(idx)}><Trash2 size={16} className="text-gray-400 hover:text-red-500"/></button>
                            </div>
                        </div>
                     ))}
                </div>
                <div className="p-6 bg-white/60 dark:bg-dark-800/60 border-t border-white/40 rounded-b-3xl">
                    <form onSubmit={handleSaveCommand} className="flex flex-col gap-3">
                         <div className="flex gap-3">
                             <input type="text" placeholder="command" value={cmdInput} onChange={e=>setCmdInput(e.target.value)} className="w-1/3 px-4 py-2 rounded-xl outline-none" />
                             <input type="text" placeholder="description" value={descInput} onChange={e=>setDescInput(e.target.value)} className="flex-1 px-4 py-2 rounded-xl outline-none" />
                         </div>
                         <button type="submit" className="bg-accent text-white py-2 rounded-xl font-bold">Save</button>
                    </form>
                </div>
            </div>
          </div>
      )}

      {/* Logs Modal - Kept Simple for Demo */}
      {modalType === 'logs' && selectedBot && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-900/60 backdrop-blur-md animate-fade-in">
            <div className={`glass-card w-full max-w-3xl rounded-3xl overflow-hidden flex flex-col max-h-[85vh] shadow-2xl border-white/40 ${theme === 'dark' ? 'bg-dark-900' : ''}`}>
                <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-white/40 backdrop-blur-md">
                   <div className="flex items-center gap-3"><div className="p-2 bg-white rounded-xl shadow-sm"><FileText size={20} className="text-brand-500"/></div><div><h3 className={`font-bold text-lg ${theme === 'dark' ? 'text-white' : 'text-brand-900'}`}>System Logs</h3></div></div>
                   <button onClick={closeModal}><X size={20} className="text-gray-500"/></button>
                </div>
                <div className="flex-1 overflow-hidden p-6 bg-dark-900"><LogView bot={selectedBot} /></div>
            </div>
          </div>
      )}

    </div>
  );
};

export default Dashboard;
