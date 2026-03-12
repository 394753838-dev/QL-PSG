import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  FileText, ArrowLeft, PieChart, List, BarChart2, 
  Rewind, Play, FastForward, Video,
  Users, Activity, Monitor, Globe, Settings, LogOut,
  Check, X, Cpu, Edit2, CheckCircle2, AlertCircle, Plus, Trash2, MousePointer2,
  PauseCircle, PlayCircle, Activity as ActivityIcon, HeartPulse, Wind, Moon,
  Clock, ListChecks, Tags, Bot, MapPin, ZoomIn, Eye, EyeOff, ArrowUpDown, 
  ChevronUp, ChevronDown, ChevronLeft, ChevronRight, GripVertical, Settings2, BarChart, HelpCircle,
  Undo2, Redo2, Filter, Loader2
} from 'lucide-react';

// ############################################################################
// # 1. 核心底层依赖与样式
// ############################################################################

const Y_AXIS_STEPS = [5, 10, 25, 50, 75, 100, 200, 500, 1000, 2500];

const GlobalStyles = () => (
  <style dangerouslySetInnerHTML={{ __html: `
    .custom-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 4px; }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: #94a3b8; }
    
    .light-scrollbar::-webkit-scrollbar { width: 4px; height: 4px; }
    .light-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .light-scrollbar::-webkit-scrollbar-thumb { background-color: #e2e8f0; border-radius: 4px; }
    .light-scrollbar::-webkit-scrollbar-thumb:hover { background-color: #cbd5e1; }
    
    body { background-color: #0f172a; margin: 0; padding: 0; overflow: hidden; font-family: ui-sans-serif, system-ui, sans-serif; }

    .medical-grid {
      background-size: 5% 42px;
      background-image: 
        linear-gradient(to right, rgba(226, 232, 240, 0.4) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(226, 232, 240, 0.4) 1px, transparent 1px);
    }

    .chart-grid-y {
      background-image: linear-gradient(to bottom, rgba(203, 213, 225, 0.3) 1px, transparent 1px);
    }

    .ai-dashed-border {
      background-image: linear-gradient(90deg, currentColor 50%, transparent 50%), linear-gradient(90deg, currentColor 50%, transparent 50%), linear-gradient(0deg, currentColor 50%, transparent 50%), linear-gradient(0deg, currentColor 50%, transparent 50%);
      background-repeat: repeat-x, repeat-x, repeat-y, repeat-y;
      background-size: 8px 2px, 8px 2px, 2px 8px, 2px 8px;
      background-position: left top, right bottom, left bottom, right top;
    }
    
    @keyframes ping-slow {
      0% { transform: scale(1); opacity: 0.8; }
      100% { transform: scale(3); opacity: 0; }
    }
    .animate-ripple {
      animation: ping-slow 0.6s cubic-bezier(0, 0, 0.2, 1) forwards;
      transform-origin: center;
    }
  `}} />
);

const INITIAL_CHANNELS = [
  { lbl: 'F3-M2', group: 'EEG' }, { lbl: 'F4-M1', group: 'EEG' }, { lbl: 'C3-M2', group: 'EEG' }, { lbl: 'C4-M1', group: 'EEG' },
  { lbl: 'O1-M2', group: 'EEG' }, { lbl: 'O2-M1', group: 'EEG' }, { lbl: 'E1-M2', group: 'EOG' }, { lbl: 'E2-M2', group: 'EOG' },
  { lbl: 'Chin1', group: 'EMG' }, { lbl: 'ECG', group: 'ECG' }, { lbl: 'Leg L', group: 'EMG' }, { lbl: 'Leg R', group: 'EMG' },
  { lbl: 'Flow', group: 'Resp' }, { lbl: 'Thor', group: 'Resp' }, { lbl: 'Abdo', group: 'Resp' }, { lbl: 'Snore', group: 'Snore' },
  { lbl: 'SpO2', group: 'SpO2' }
].map((c, i) => ({ ...c, id: i, visible: true, inverted: false }));

const getChannelColor = (group) => {
    switch(group) {
        case 'EEG': return '#334155'; 
        case 'EOG': return '#d97706'; 
        case 'EMG': return '#059669'; 
        case 'ECG': return '#dc2626'; 
        case 'Resp': return '#2563eb'; 
        case 'Snore': return '#7c3aed'; 
        case 'SpO2': return '#ea580c'; 
        default: return '#64748b';
    }
};

const formatRealTime = (seconds) => {
  const base = 22 * 3600;
  const total = (base + seconds) % 86400;
  const h = Math.floor(total / 3600).toString().padStart(2, '0');
  const m = Math.floor((total % 3600) / 60).toString().padStart(2, '0');
  const s = Math.floor(total % 60).toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
};

// ==========================================
// 静态波形渲染画布
// ==========================================
const EEGCanvas = ({ active, height = 40, color = '#475569', yScale = 1, viewScale, currentEpoch, totalEpochs, inverted }) => {
  const canvasRef = useRef(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!active || !canvas) return;
    const ctx = canvas.getContext('2d');
    const { width, height: h } = canvas.getBoundingClientRect();
    
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, h);
    
    ctx.beginPath();
    ctx.strokeStyle = '#e2e8f0'; 
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.moveTo(0, h/2);
    ctx.lineTo(width, h/2);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.beginPath();
    ctx.strokeStyle = color; 
    ctx.lineWidth = 1.0; 
    
    let speedMultiplier = viewScale === 'global' ? (totalEpochs * 30) / (parseInt(viewScale) || 30) : parseInt(viewScale) / 30;
    let epochOffset = viewScale === 'global' ? 0 : currentEpoch * 1000; 
    let polarity = inverted ? -1 : 1; 

    for(let x = 0; x < width; x+=2) {
      const time = (x + epochOffset) * 0.05 * speedMultiplier;
      let y = h/2;
      let signal = Math.sin(time*2) * (h/4); 
      let noise = Math.sin(time*10) * (h/8) + (Math.sin(time*123.45) * 3); 
      
      y += (signal + noise) * yScale * polarity;
      
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }, [active, color, yScale, viewScale, currentEpoch, totalEpochs, inverted]);
  
  return <canvas ref={canvasRef} className="w-full h-full block pointer-events-none" style={{height}} />;
};

// ==========================================
// 帮助提示组件
// ==========================================
const HelpTooltip = ({ title, content, placement = "bottom-left" }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0, transform: '', arrowClass: '' });
  const triggerRef = useRef(null);

  const updatePosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    
    let top = 0, left = 0, transform = "", arrowClass = "";

    if (placement === "top-center") {
      top = rect.top - 8;
      transform = "translate(-50%, -100%)";
      arrowClass = "top-full left-1/2 -translate-x-1/2 border-t-slate-800";
    } else if (placement === "top-left") {
      top = rect.top - 8;
      left = rect.left;
      transform = "translate(0, -100%)";
      arrowClass = "top-full left-3 border-t-slate-800";
    } else if (placement === "top-right") {
       top = rect.top - 8;
       left = rect.right;
       transform = "translate(-100%, -100%)";
       arrowClass = "top-full right-3 border-t-slate-800";
    } else if (placement === "bottom-left") {
       top = rect.bottom + 8;
       left = rect.left;
       transform = "translate(0, 0)";
       arrowClass = "bottom-full left-3 border-b-slate-800";
    } else if (placement === "bottom-right") {
       top = rect.bottom + 8;
       left = rect.right;
       transform = "translate(-100%, 0)";
       arrowClass = "bottom-full right-3 border-b-slate-800";
    } else if (placement === "left-center") {
       top = rect.top + rect.height / 2;
       left = rect.left - 8;
       transform = "translate(-100%, -50%)";
       arrowClass = "left-full top-1/2 -translate-y-1/2 border-l-slate-800";
    }

    setPos({ top, left, transform, arrowClass });
  };

  return (
    <>
      <div 
        ref={triggerRef}
        className="inline-flex items-center justify-center ml-1 cursor-help opacity-60 hover:opacity-100 transition-opacity align-middle"
        onMouseEnter={() => { updatePosition(); setIsVisible(true); }}
        onMouseLeave={() => setIsVisible(false)}
      >
        <HelpCircle size={12} className="text-blue-500" />
      </div>
      {isVisible && typeof document !== 'undefined' && createPortal(
        <div 
          className="fixed z-[99999] pointer-events-none animate-in fade-in zoom-in-95 duration-150" 
          style={{ top: pos.top, left: pos.left, transform: pos.transform }}
        >
          <div className="w-64 p-3 bg-slate-800 text-white text-[11px] rounded-md shadow-2xl relative">
            <strong className="block text-blue-300 mb-1.5 border-b border-slate-600 pb-1 text-xs">{title}</strong>
            <div className="text-slate-200 space-y-1.5 leading-relaxed">{content}</div>
            <div className={`absolute border-[5px] border-transparent ${pos.arrowClass}`} />
          </div>
        </div>,
        document.body
      )}
    </>
  );
};


// ############################################################################
// # 2. 核心模块：判读台 (Scoring Console)
// ############################################################################

const ScoringConsole = ({ taskData, onBack }) => {
  const [currentEpoch, setCurrentEpoch] = useState(124);
  const totalEpochs = 980;
  
  const [viewScale, setViewScale] = useState('30'); 
  const [yAxisUv, setYAxisUv] = useState(50); 
  const [channels, setChannels] = useState(INITIAL_CHANNELS);

  const [highlights, setHighlights] = useState({ 
    eeg: true, eog: true, emg: true, resp: true, arousal: true, ecg: true 
  });

  const waveformContainerRef = useRef(null);
  const overlayRef = useRef(null); 

  const [stageStr, setStageStr] = useState('N2'); 
  const [autoAdvance, setAutoAdvance] = useState(true); 
  
  // 提示信息系统（放置在组件顶部以避免作用域死区）
  const [toastMsg, setToastMsg] = useState('');
  const toastTimeoutRef = useRef(null);
  
  const showToast = React.useCallback((msg) => {
    setToastMsg(msg);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => setToastMsg(''), 2500);
  }, []);
  
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiProgress, setAiProgress] = useState({ active: false, percent: 0, text: '' });
  
  const [bottomPanelState, setBottomPanelState] = useState(1);
  const [activeTrackIndex, setActiveTrackIndex] = useState(0);

  const [rightPanelTab, setRightPanelTab] = useState('tools'); 
  const [expandedEventId, setExpandedEventId] = useState(null); 
  const [eventSortMode, setEventSortMode] = useState('time');
  
  const [aiTasks, setAiTasks] = useState({
     staging: true, events_resp: true, events_move: true,
     events_arousal: true, feat_eeg: true, feat_eog: true
  });

  const [hoveredEpoch, setHoveredEpoch] = useState(null);
  const [clickRipple, setClickRipple] = useState(null);

  // ================= 通道控制 =================
  const toggleChannelProp = (id, prop) => {
    setChannels(chs => chs.map(c => c.id === id ? { ...c, [prop]: !c[prop] } : c));
  };
  const moveChannel = (index, dir) => {
    if ((dir === -1 && index === 0) || (dir === 1 && index === channels.length - 1)) return;
    const newChannels = [...channels];
    const temp = newChannels[index];
    newChannels[index] = newChannels[index + dir];
    newChannels[index + dir] = temp;
    setChannels(newChannels);
  };

  const isHighlightedChannel = (chGroup) => {
    if (!activeTool) return false;
    const map = {
      'eeg': ['EEG'], 'eog': ['EOG'], 'emg': ['EMG'],
      'resp': ['Resp', 'Snore', 'SpO2'], 'arousal': ['EEG'],
      'ecg': ['ECG'], 'other': []
    };
    return map[activeTool.categoryId]?.includes(chGroup);
  };

  // ================= 缩放逻辑 =================
  useEffect(() => {
    const el = waveformContainerRef.current;
    if (!el) return;
    const handleWheel = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) {
        e.preventDefault(); 
        setYAxisUv(prevUv => {
          const currentIndex = Y_AXIS_STEPS.indexOf(prevUv);
          if (e.deltaY < 0) return currentIndex > 0 ? Y_AXIS_STEPS[currentIndex - 1] : prevUv;
          else return currentIndex < Y_AXIS_STEPS.length - 1 ? Y_AXIS_STEPS[currentIndex + 1] : prevUv;
        });
      }
    };
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, []);

  // ================= 联动状态 =================
  const isGlobalView = viewScale === 'global';
  const viewDurationSec = isGlobalView ? totalEpochs * 30 : parseInt(viewScale);
  const viewStartSec = isGlobalView ? 0 : (currentEpoch - 1) * 30; 
  const viewEndSec = viewStartSec + viewDurationSec;

  const [fftTimeRange, setFftTimeRange] = useState([viewStartSec, viewEndSec]);
  useEffect(() => {
    setFftTimeRange([viewStartSec, viewEndSec]);
  }, [viewStartSec, viewEndSec]);

  const [hypnoData, setHypnoData] = useState(() => {
    return Array.from({length: totalEpochs}).map((_, i) => {
      if(i < 30) return 4; 
      if(i < 50) return 2; 
      if(i < 180) return 1; 
      if(i < 240) return 0; 
      if(i < 250) return 4; 
      if(i < 350) return 1; 
      if(i < 420) return 3; 
      if(i < 600) return 1; 
      if(i < 680) return 0; 
      if(i < 800) return 3; 
      return i > 900 ? 4 : 1; 
    });
  });

  const updateStageAndHypno = (s, epochIndex) => {
    setStageStr(s);
    const stageMap = { 'W': 4, 'R': 3, 'N1': 2, 'N2': 1, 'N3': 0 };
    setHypnoData(prev => {
       const next = [...prev];
       next[epochIndex] = stageMap[s];
       return next;
    });
    
    if (autoAdvance) {
      showToast(`阶段记录更新: ${s}`);
      setTimeout(() => setCurrentEpoch(prev => Math.min(totalEpochs, prev + 1)), 250);
    } else {
      showToast(`阶段记录更新: ${s} (自动翻页已关闭)`);
    }
  };

  const executeAIAnalysis = () => {
    setShowAIModal(false);
    setAiProgress({ active: true, percent: 0, text: '初始化分析引擎...' });
    
    const steps = [
      { p: 15, t: '预处理与滤波...' },
      { p: 35, t: '提取各频段特征...' },
      { p: 60, t: '执行自动睡眠分期...' },
      { p: 85, t: '识别呼吸异常与微觉醒...' },
      { p: 100, t: '综合分析完成' }
    ];
    
    let currentStep = 0;
    const interval = setInterval(() => {
       const target = steps[currentStep];
       setAiProgress(prev => {
          let nextP = prev.percent + Math.random() * 8;
          if (nextP >= target.p) {
             nextP = target.p;
             currentStep++;
          }
          if (nextP >= 100) {
             clearInterval(interval);
             setTimeout(() => {
                setAiProgress({ active: false, percent: 0, text: '' });
                showToast('智能分析已全部更新并应用。');
             }, 800);
             return { active: true, percent: 100, text: target.t };
          }
          return { active: true, percent: nextP, text: target.t };
       });
    }, 150);
  };

  const AASM_EVENT_SETS = [
    { categoryId: 'stage', title: '批量分期', icon: Moon, color: 'bg-indigo-500', borderColor: 'border-indigo-500', textColor: 'text-indigo-800', lightBg: 'bg-indigo-50', items: [ { id: 'stage_W', label: '清醒 (W)' }, { id: 'stage_N1', label: 'N1 期' }, { id: 'stage_N2', label: 'N2 期' }, { id: 'stage_N3', label: 'N3 期' }, { id: 'stage_R', label: 'REM 期' } ] },
    { categoryId: 'eeg', title: 'EEG 特征', icon: Activity, color: 'bg-purple-500', borderColor: 'border-purple-500', textColor: 'text-purple-800', lightBg: 'bg-purple-50', items: [ { id: 'pdr', label: '后主导节律 (PDR)' }, { id: 'lamf', label: '低振幅混合频率' }, { id: 'v_wave', label: '顶点尖波 (V波)' }, { id: 'k_complex', label: 'K复合波' }, { id: 'spindle', label: '睡眠纺锤波' }, { id: 'swa', label: '慢波活动 (SWA)' }, { id: 'sawtooth', label: '锯齿波' }] },
    { categoryId: 'eog', title: 'EOG 特征', icon: Eye, color: 'bg-amber-500', borderColor: 'border-amber-500', textColor: 'text-amber-800', lightBg: 'bg-amber-50', items: [ { id: 'blinks', label: '眨眼' }, { id: 'reading_em', label: '阅读性眼动' }, { id: 'sem', label: '慢速眼动 (SEM)' }, { id: 'rem', label: '快速眼动 (REMs)' } ] },
    { categoryId: 'emg', title: 'EMG 与动作', icon: ActivityIcon, color: 'bg-emerald-500', borderColor: 'border-emerald-500', textColor: 'text-emerald-800', lightBg: 'bg-emerald-50', items: [ { id: 'low_chin', label: '低颏肌张力' }, { id: 'transient_emg', label: '短暂肌电活动' }, { id: 'major_move', label: '大动作' }, { id: 'plm', label: '周期性腿动 (PLM)' }, { id: 'bruxism', label: '磨牙症' } ] },
    { categoryId: 'resp', title: '呼吸事件', icon: Wind, color: 'bg-red-500', borderColor: 'border-red-500', textColor: 'text-red-800', lightBg: 'bg-red-50', items: [ { id: 'osa', label: '阻塞性呼吸暂停' }, { id: 'csa', label: '中枢性呼吸暂停' }, { id: 'hypopnea', label: '低通气 (Hypopnea)' }, { id: 'csr', label: '成人Cheyne-Stokes呼吸' }, { id: 'msa', label: '混合性呼吸暂停' } ] },
    { categoryId: 'arousal', title: '觉醒事件', icon: Moon, color: 'bg-yellow-500', borderColor: 'border-yellow-500', textColor: 'text-yellow-800', lightBg: 'bg-yellow-50', items: [ { id: 'ar_spont', label: '自发性觉醒' }, { id: 'ar_resp', label: '呼吸相关觉醒' } ] },
    { categoryId: 'other', title: '其他标记', icon: Tags, color: 'bg-slate-500', borderColor: 'border-slate-500', textColor: 'text-slate-800', lightBg: 'bg-slate-50', items: [ { id: 'lights_out', label: '熄灯时间' }, { id: 'lights_on', label: '开灯时间' } ] }
  ];

  const [activeTool, setActiveTool] = useState(null); 
  const [batchStageRange, setBatchStageRange] = useState(null);

  const [events, setEvents] = useState([
    { id: '1', categoryId: 'resp', label: '阻塞性呼吸暂停 (OSA)', startSec: 3600, durationSec: 45, color: 'bg-red-500', borderColor: 'border-red-500', textColor: 'text-red-800', source: 'AI', status: 'Pending', typeGroup: 'resp' },
    { id: '2', categoryId: 'eeg', label: '睡眠纺锤波', startSec: 3720, durationSec: 2, color: 'bg-purple-500', borderColor: 'border-purple-500', textColor: 'text-purple-800', source: 'AI', status: 'Pending', typeGroup: 'eeg' },
    { id: '3', categoryId: 'eeg', label: 'K复合波', startSec: 3738, durationSec: 1, color: 'bg-purple-500', borderColor: 'border-purple-500', textColor: 'text-purple-800', source: 'AI', status: 'Pending', typeGroup: 'eeg' },
    { id: '4', categoryId: 'emg', label: '低颏肌张力', startSec: 4500, durationSec: 120, color: 'bg-emerald-500', borderColor: 'border-emerald-500', textColor: 'text-emerald-800', source: 'AI', status: 'Confirmed', typeGroup: 'emg' },
    { id: '5', categoryId: 'arousal', label: '自发性觉醒', startSec: 8200, durationSec: 15, color: 'bg-yellow-500', borderColor: 'border-yellow-500', textColor: 'text-yellow-800', source: 'Manual', status: 'Confirmed', typeGroup: 'arousal' }
  ]);

  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => {
      if (eventSortMode === 'time') return a.startSec - b.startSec;
      if (eventSortMode === 'type') {
         const typeCompare = a.categoryId.localeCompare(b.categoryId);
         if (typeCompare !== 0) return typeCompare;
         return a.startSec - b.startSec;
      }
      return 0;
    });
  }, [events, eventSortMode]);

  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0); 
  const animationRef = useRef(null);
  const lastTimeRef = useRef(null);

  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStartX, setDrawStartX] = useState(0);
  const [drawCurrentX, setDrawCurrentX] = useState(0);

  const toggleVideoPlayback = () => {
    setIsVideoPlaying(!isVideoPlaying);
    if (!isVideoPlaying && videoProgress >= viewDurationSec) setVideoProgress(0);
  };

  const locateToEvent = (startSec, typeGroup) => {
    const epoch = Math.floor(startSec / 30) + 1;
    setCurrentEpoch(Math.min(totalEpochs, Math.max(1, epoch)));
    setVideoProgress(startSec % 30);
    if (viewScale === 'global' || parseInt(viewScale) > 120) setViewScale('30'); 
    
    if (typeGroup && waveformContainerRef.current) {
      const groupMap = { 'resp': 'Resp', 'emg': 'EMG', 'eeg': 'EEG', 'eog': 'EOG', 'arousal': 'EEG', 'ecg': 'ECG', 'other': '' };
      const targetGroup = groupMap[typeGroup];
      if (targetGroup) {
         const firstIndex = channels.findIndex(c => c.visible && c.group === targetGroup);
         if (firstIndex !== -1) {
            const channelRows = waveformContainerRef.current.querySelectorAll('.channel-row');
            if (channelRows[firstIndex]) {
               waveformContainerRef.current.scrollTo({
                  top: channelRows[firstIndex].offsetTop - 10,
                  behavior: 'smooth'
               });
            }
         }
      }
    }
  };

  const toggleEventStatus = (id) => {
    setEvents(events.map(ev => {
      if (ev.id === id) {
        const newStatus = ev.status === 'Pending' ? 'Confirmed' : 'Pending';
        return { ...ev, status: newStatus };
      }
      return ev;
    }));
    const ev = events.find(e => e.id === id);
    if(ev) {
        showToast(ev.status === 'Pending' ? "记录已标记为：已校正" : "已撤回至：待校正");
    }
  };

  const updateEventDetails = (id, field, value) => {
    setEvents(events.map(ev => {
      if (ev.id === id) return { ...ev, [field]: value, status: 'Confirmed', source: ev.source === 'AI' ? 'AI' : 'Manual' };
      return ev;
    }));
  };

  const getSecFromClientX = (clientX) => {
    if (!overlayRef.current) return viewStartSec;
    const rect = overlayRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return viewStartSec + ratio * viewDurationSec;
  };

  const handleMouseDown = (e) => {
    if (!activeTool) return;
    setIsDrawing(true);
    setDrawStartX(e.clientX);
    setDrawCurrentX(e.clientX);
  };

  const handleMouseMove = (e) => {
    if (!isDrawing) return;
    setDrawCurrentX(e.clientX);
  };

  const handleMouseUp = (e) => {
    if (!isDrawing) return;
    setIsDrawing(false);
    
    const startSec = getSecFromClientX(drawStartX);
    const endSec = getSecFromClientX(drawCurrentX);
    let rawStart = Math.min(startSec, endSec);
    let rawDuration = Math.abs(endSec - startSec);
    
    if (rawDuration < 0.5) return; 
    
    if (activeTool.id === 'fft_select') {
       setFftTimeRange([rawStart, rawStart + rawDuration]);
       showToast(`选中片段: ${rawDuration.toFixed(1)}s，分析中...`);
       setActiveTool(null);
       setRightPanelTab('fft');
       if (!isRightPanelOpen) setIsRightPanelOpen(true);
       return;
    }

    const epochSize = 30;
    const startEpochIdx = Math.floor(rawStart / epochSize);
    const endEpochIdx = Math.max(startEpochIdx + 1, Math.ceil((rawStart + rawDuration) / epochSize));
    const finalStart = startEpochIdx * epochSize;
    const finalDuration = (endEpochIdx - startEpochIdx) * epochSize;
    
    if (activeTool.categoryId === 'stage') {
       setBatchStageRange({ startEpoch: startEpochIdx, endEpoch: endEpochIdx, x: e.clientX, y: e.clientY });
       return;
    }

    const newEvent = {
      id: Date.now().toString(),
      categoryId: activeTool.categoryId,
      label: activeTool.label,
      startSec: finalStart,
      durationSec: finalDuration,
      color: activeTool.color,
      borderColor: activeTool.borderColor,
      textColor: activeTool.textColor,
      source: 'Manual',
      status: 'Confirmed',
      typeGroup: activeTool.categoryId
    };
    setEvents([...events, newEvent]);
    showToast(`成功添加：${activeTool.label}`);
    setActiveTool(null); 
    setRightPanelTab('events'); 
    if (!isRightPanelOpen) setIsRightPanelOpen(true);
  };

  const applyBatchStage = (s) => {
    if (!batchStageRange) return;
    const stageMap = { 'W': 4, 'R': 3, 'N1': 2, 'N2': 1, 'N3': 0 };
    setHypnoData(prev => {
      const next = [...prev];
      for(let i = batchStageRange.startEpoch; i < batchStageRange.endEpoch; i++) {
        next[i] = stageMap[s];
      }
      return next;
    });
    showToast(`已批量标记 ${batchStageRange.endEpoch - batchStageRange.startEpoch} 个片帧为 ${s}`);
    setBatchStageRange(null);
    setActiveTool(null);
  };

  const deleteEvent = (id) => {
    setEvents(events.filter(ev => ev.id !== id));
    showToast("记录已移除");
  };

  const renderGlobalEventMasks = () => {
    return events.map(ev => {
      if (ev.startSec + ev.durationSec < viewStartSec || ev.startSec > viewEndSec) return null;
      if (ev.typeGroup === 'eeg' && !highlights.eeg) return null;
      if (ev.typeGroup === 'eog' && !highlights.eog) return null;
      if (ev.typeGroup === 'emg' && !highlights.emg) return null;
      if (ev.typeGroup === 'resp' && !highlights.resp) return null;
      if (ev.typeGroup === 'arousal' && !highlights.arousal) return null;
      if (ev.typeGroup === 'ecg' && !highlights.ecg) return null;
      
      const leftRatio = Math.max(0, (ev.startSec - viewStartSec) / viewDurationSec);
      const rightRatio = Math.min(1, (ev.startSec + ev.durationSec - viewStartSec) / viewDurationSec);
      const widthRatio = rightRatio - leftRatio;
      
      const isPending = ev.status === 'Pending';
      const borderClass = isPending ? 'ai-dashed-border' : 'border-l-[2px] border-r-[2px] border-solid';

      return (
        <div 
          key={ev.id}
          className={`absolute top-0 bottom-0 ${borderClass} ${ev.color} ${ev.textColor} bg-opacity-10 group z-20 flex flex-col items-center pt-8 cursor-pointer hover:bg-opacity-20 transition-all`}
          style={{ left: `${leftRatio * 100}%`, width: `${widthRatio * 100}%` }}
          onClick={(e) => { e.stopPropagation(); locateToEvent(ev.startSec, ev.typeGroup); showToast("已同步定位至该片段"); }}
        >
          <div className="bg-white/95 backdrop-blur px-2.5 py-1 rounded shadow border border-slate-200 text-center scale-90 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all pointer-events-auto mt-2 min-w-max">
            <div className={`text-[10px] font-bold ${ev.textColor} flex items-center gap-1 justify-center`}>
              {isPending ? <AlertCircle size={10} className="text-amber-500"/> : <CheckCircle2 size={10} className="text-emerald-500"/>}
              {ev.label}
            </div>
            <div className="text-[9px] text-slate-500 font-mono mb-1">{ev.durationSec}s</div>
          </div>
        </div>
      );
    });
  };

  // ================= 模拟底部图表的假数据 =================
  const mockSpO2Data = useMemo(() => {
    return Array.from({length: totalEpochs}).map((_, i) => {
      let base = 96 + Math.sin(i * 0.05) * 2;
      if ((i > 100 && i < 110) || (i > 360 && i < 380) || (i > 750 && i < 765)) {
        base -= Math.random() * 20 + 10; 
      }
      if (i > 850 && i < 855) base = 0; 
      return Math.max(0, Math.min(100, base));
    });
  }, [totalEpochs]);

  const getSpO2YPercentage = (val) => {
    if (val >= 85) return 5 + ((100 - val) / 15) * 75; 
    return 80 + ((85 - val) / 85) * 15; 
  };

  const mockPositionData = useMemo(() => {
    let data = [];
    for(let i=0; i<totalEpochs; i++) {
       if(i<200) data.push(0); 
       else if(i<350) data.push(1); 
       else if(i<500) data.push(2); 
       else if(i<800) data.push(0); 
       else data.push(3); 
    }
    return data;
  }, [totalEpochs]);

  const positionPoints = useMemo(() => {
    let pts = [];
    for (let i = 0; i < mockPositionData.length; i++) {
        const y = mockPositionData[i] * 25 + 12.5; 
        if (i > 0) {
            const prevY = mockPositionData[i-1] * 25 + 12.5;
            if (prevY !== y) {
                pts.push(`${i},${prevY}`); 
            }
        }
        pts.push(`${i},${y}`); 
    }
    return pts.join(' ');
  }, [mockPositionData]);

  // 全局交互与动效：Hover 捕捉与 Ripple 波纹
  const handleTrackMouseMove = (e) => {
     const rect = e.currentTarget.getBoundingClientRect();
     // 80px 是左侧标题栏宽度，16px 是右侧安全留白 (right-4)
     const drawableWidth = rect.width - 80 - 16; 
     const offsetX = e.clientX - rect.left - 80;
     if (offsetX >= 0 && offsetX <= drawableWidth) {
        const ratio = offsetX / drawableWidth;
        setHoveredEpoch(Math.min(totalEpochs - 1, Math.max(0, Math.floor(ratio * totalEpochs))));
     } else {
        setHoveredEpoch(null);
     }
  };

  const handleTrackClick = (e) => {
     if (hoveredEpoch !== null) {
        setCurrentEpoch(Math.max(1, hoveredEpoch));
        setVideoProgress(0);
        setClickRipple({ id: Date.now(), epoch: hoveredEpoch });
     }
  };

  const getBottomPanelHeight = () => {
    if (bottomPanelState === 0) return 'h-0 opacity-0';
    if (bottomPanelState === 1) return 'h-[140px] opacity-100'; // II级
    return 'h-[240px] opacity-100'; // III级：完全等分填满，无下拉 (26px header + 4 * 50px+)
  };

  return (
    <div className="h-full flex flex-col bg-slate-100 relative z-0 text-[11px]">
      
      {toastMsg && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-[999] bg-slate-800 text-white px-5 py-2.5 rounded shadow-xl flex items-center gap-2 font-bold animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 size={16} className="text-emerald-400"/> {toastMsg}
        </div>
      )}

      {/* AI 分析全局模态进度遮罩 */}
      {aiProgress.active && (
         <div className="fixed inset-0 z-[99999] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center animate-in fade-in">
            <div className="bg-white rounded-xl shadow-2xl p-6 w-[400px] flex flex-col items-center">
               <Bot size={32} className="text-blue-600 mb-3 animate-pulse"/>
               <span className="text-sm font-bold text-slate-800 mb-4 tracking-wider">AI 引擎正在深度演算...</span>
               <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-2 relative">
                  <div className="h-full bg-blue-500 transition-all duration-200" style={{width: `${aiProgress.percent}%`}}></div>
               </div>
               <div className="w-full flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>{aiProgress.text}</span>
                  <span>{Math.floor(aiProgress.percent)}%</span>
               </div>
            </div>
         </div>
      )}

      {/* 批量分期弹窗 */}
      {batchStageRange && (
         <div className="fixed z-[9999] animate-in zoom-in-95 duration-100" style={{left: batchStageRange.x, top: batchStageRange.y, transform: 'translate(-50%, 10px)'}}>
            <div className="bg-white rounded-lg shadow-2xl border border-slate-200 p-2 flex flex-col gap-2">
               <div className="text-[10px] font-bold text-slate-500 text-center pb-1 border-b border-slate-100">批量定义分期 (Ep {batchStageRange.startEpoch + 1} - {batchStageRange.endEpoch})</div>
               <div className="flex gap-1.5">
                 {['W','N1','N2','N3','R'].map(s => (
                    <button key={s} onClick={() => applyBatchStage(s)} className="w-10 h-8 bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-700 font-bold rounded transition-colors">{s}</button>
                 ))}
               </div>
               <button onClick={() => {setBatchStageRange(null); setActiveTool(null);}} className="text-[9px] text-slate-400 hover:text-slate-600 pt-1">取消操作</button>
            </div>
         </div>
      )}

      {/* ================= 1. 顶部工具栏 ================= */}
      <div className="h-[48px] border-b border-slate-300 bg-white shrink-0 z-30 shadow-sm flex items-center justify-between px-4 relative gap-4">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-1 bg-white border border-slate-200 hover:bg-slate-100 rounded text-slate-600 transition-colors shadow-sm" title="返回"><ArrowLeft size={14}/></button>
          <div className="w-px h-5 bg-slate-200"/>
          
          <div className="flex flex-col justify-center ml-1">
              <span className="font-bold text-xs text-slate-800 flex items-center gap-1.5 leading-none">
                  <ActivityIcon size={14} className="text-blue-600"/> 睡眠医学判读中心
              </span>
              <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-[9px] text-slate-600 font-bold bg-slate-100 px-1.5 py-[1px] border border-slate-200 rounded leading-none">{taskData.patient.name}</span>
                  <span className="text-[9px] text-slate-500 font-mono bg-slate-100 px-1.5 py-[1px] border border-slate-200 rounded leading-none">{taskData.patient.id}</span>
                  <span className="text-[9px] text-blue-700 font-bold bg-blue-50 px-1.5 py-[1px] border border-blue-200 rounded leading-none shadow-sm">{taskData.type}</span>
              </div>
          </div>
          
          <div className="w-px h-5 bg-slate-200 ml-2"></div>
          
          {/* 全局操作：撤销/重做/AI重新分析 */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded px-1.5 py-1 shadow-sm">
             <button onClick={() => showToast('已撤销')} className="p-1 text-slate-500 hover:text-blue-600 hover:bg-white rounded transition-colors" title="撤销操作 (Ctrl+Z)">
               <Undo2 size={14}/>
             </button>
             <button onClick={() => showToast('已重做')} className="p-1 text-slate-500 hover:text-blue-600 hover:bg-white rounded transition-colors" title="重做操作 (Ctrl+Y)">
               <Redo2 size={14}/>
             </button>
             <div className="w-px h-3 bg-slate-300 mx-0.5"></div>
             
             <div className="relative">
               <button onClick={() => setShowAIModal(!showAIModal)} className="flex items-center gap-1 p-1 pr-1.5 text-slate-500 hover:text-blue-600 hover:bg-white rounded transition-colors" title="重新运行 AI 分析引擎">
                 <Bot size={14}/>
                 <span className="text-[10px] font-bold">AI 重新分析</span>
                 <ChevronDown size={10}/>
               </button>
               {showAIModal && (
                 <div className="absolute top-full left-0 mt-2 w-[340px] bg-white rounded-lg shadow-2xl border border-slate-200 p-3.5 z-[999] cursor-default text-slate-700 animate-in fade-in zoom-in-95">
                    <h3 className="text-[11px] font-bold text-slate-800 mb-3 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                      <Bot size={14} className="text-blue-600"/> 配置 AI 智能分析任务
                    </h3>
                    <div className="space-y-3.5">
                       <div className="bg-slate-50 p-2 rounded border border-slate-100 hover:border-blue-200 transition-colors">
                          <label className="flex items-center gap-2 font-bold text-[10px] cursor-pointer">
                            <input type="checkbox" checked={aiTasks.staging} onChange={e=>setAiTasks({...aiTasks, staging: e.target.checked})} className="cursor-pointer" /> 
                            睡眠分期 (W/N1/N2/N3/R)
                          </label>
                       </div>
                       <div>
                          <div className="font-bold text-[10px] mb-1.5 text-slate-500 uppercase flex items-center">
                            各类事件识别
                            <HelpTooltip title="事件识别引擎" content="依托深度学习模型，自动扫描整夜数据并打上特征标签。" placement="bottom-right" />
                          </div>
                          <div className="grid grid-cols-2 gap-2 pl-1">
                             <label className="flex items-center gap-1.5 text-[10px] cursor-pointer"><input type="checkbox" checked={aiTasks.events_resp} onChange={e=>setAiTasks({...aiTasks, events_resp: e.target.checked})} /> 呼吸事件 (OSA/CSA等)</label>
                             <label className="flex items-center gap-1.5 text-[10px] cursor-pointer"><input type="checkbox" checked={aiTasks.events_move} onChange={e=>setAiTasks({...aiTasks, events_move: e.target.checked})} /> 肢体运动 (PLM等)</label>
                             <label className="flex items-center gap-1.5 text-[10px] cursor-pointer"><input type="checkbox" checked={aiTasks.events_arousal} onChange={e=>setAiTasks({...aiTasks, events_arousal: e.target.checked})} /> 觉醒事件 (Arousals)</label>
                          </div>
                       </div>
                       <div>
                          <div className="font-bold text-[10px] mb-1.5 text-slate-500 uppercase flex items-center">
                            各类波形特征识别
                            <HelpTooltip title="微观波形引擎" content="针对特定频段与振幅的微小脑电/眼电特征进行高频扫描。" placement="bottom-right" />
                          </div>
                          <div className="grid grid-cols-2 gap-2 pl-1">
                             <label className="flex items-center gap-1.5 text-[10px] cursor-pointer"><input type="checkbox" checked={aiTasks.feat_eeg} onChange={e=>setAiTasks({...aiTasks, feat_eeg: e.target.checked})} /> 脑电特征 (纺锤波/K复合波)</label>
                             <label className="flex items-center gap-1.5 text-[10px] cursor-pointer"><input type="checkbox" checked={aiTasks.feat_eog} onChange={e=>setAiTasks({...aiTasks, feat_eog: e.target.checked})} /> 眼电特征 (SEM/REM)</label>
                          </div>
                       </div>
                    </div>
                    <div className="mt-4 flex justify-end gap-2 border-t border-slate-100 pt-3">
                       <button onClick={()=>setShowAIModal(false)} className="px-3 py-1.5 rounded text-[10px] font-bold text-slate-500 hover:bg-slate-100 transition-colors">取消</button>
                       <button onClick={executeAIAnalysis} className="px-3 py-1.5 rounded text-[10px] font-bold bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-1 shadow-sm transition-colors">
                         <Play size={10}/> 执行重新分析
                       </button>
                    </div>
                 </div>
               )}
             </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded px-2.5 py-1 shadow-sm">
            <ArrowUpDown size={12} className="text-blue-600"/>
            <span className="text-[10px] text-slate-600 font-bold whitespace-nowrap flex items-center">
              幅度刻度 (μV)
              <HelpTooltip 
                title="幅度刻度 (Amplitude Scale)" 
                content={<>
                  <p className="text-slate-300">控制生理波形的纵向显示比例 (μV)。</p>
                  <p>数值越小波形越放大，数值越大波形越收缩。</p>
                </>} 
                placement="bottom-left"
              />
            </span>
            <select value={yAxisUv} onChange={(e) => setYAxisUv(Number(e.target.value))} className="bg-transparent text-[10px] font-bold text-slate-700 outline-none cursor-pointer pr-1">
              {Y_AXIS_STEPS.map(val => <option key={val} value={val}>{val} μV</option> )}
            </select>
          </div>
          <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded px-2.5 py-1 shadow-sm">
            <Clock size={12} className="text-blue-600"/>
            <span className="text-[10px] text-blue-800 font-bold whitespace-nowrap flex items-center">
              时间刻度 (Sec)
              <HelpTooltip 
                title="时间刻度 (Time Scale)" 
                content={<>
                  <p className="text-slate-300">控制单屏横向显示的时间基宽：</p>
                  <ul className="list-disc pl-4 mt-1">
                    <li><b>5秒</b>: 观察精细微特征 (如心电/肌电)</li>
                    <li><b>30秒</b>: 标准 AASM 分期视窗</li>
                    <li><b>全局</b>: 俯瞰整夜宏观趋势</li>
                  </ul>
                </>} 
                placement="bottom-left"
              />
            </span>
            <select value={viewScale} onChange={(e) => { setViewScale(e.target.value); if (e.target.value === 'global') setCurrentEpoch(1); }} className="bg-transparent text-[10px] font-bold text-blue-700 outline-none cursor-pointer pr-1">
              <option value="5">5 秒/页</option>
              <option value="30">30 秒/页 (标准)</option>
              <option value="60">60 秒/页</option>
              <option value="120">120 秒/页</option>
              <option value="600">10 分钟/页</option>
              <option value="global">全局全览</option>
            </select>
          </div>
        </div>
      </div>

      {/* ================= 2. 核心工作区 (波形 + 右侧栏) ================= */}
      <div className="flex-1 flex overflow-hidden min-h-0 p-2 pb-0 gap-2 relative z-10">
        
        {/* 左侧：波形主视图卡片 */}
        <div className="flex-1 bg-white border border-slate-300 rounded-lg shadow-sm relative flex flex-col min-w-0 overflow-hidden">
          
          {/* 结构化块级小标题：连续波形 */}
          <div className="h-[26px] bg-slate-50 border-b border-slate-200 flex items-center px-3 shrink-0 z-30">
             <Activity size={12} className="text-blue-600 mr-1.5"/>
             <span className="text-[10px] font-bold text-slate-700 tracking-wide flex items-center">
               连续波形
               <HelpTooltip 
                 title="生理信号主视图" 
                 content={<>
                   <p className="text-slate-300">直观展示各个通道的脑电、眼电、肌电、呼吸等时序信号。</p>
                 </>} 
                 placement="bottom-right" 
               />
             </span>
          </div>

          <button
            onClick={() => setIsRightPanelOpen(!isRightPanelOpen)}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-[50] bg-white border-l border-t border-b border-slate-300 rounded-l-md py-4 px-0.5 shadow-md hover:bg-slate-50 text-slate-500"
            title={isRightPanelOpen ? "收起面板" : "展开面板"}
          >
            {isRightPanelOpen ? <ChevronRight size={14}/> : <ChevronLeft size={14}/>}
          </button>

          {/* 底部面板展开收起控件 */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 z-[50] flex bg-white border-t border-l border-r border-slate-300 rounded-t-md shadow-[0_-2px_6px_rgba(0,0,0,0.05)] overflow-hidden">
             <button onClick={() => setBottomPanelState(prev => Math.min(2, prev + 1))} className={`px-4 py-0.5 hover:bg-blue-50 text-slate-500 transition-colors ${bottomPanelState === 2 ? 'opacity-30 cursor-not-allowed bg-slate-50' : 'hover:text-blue-600'}`} disabled={bottomPanelState === 2} title="展开趋势轨道">
               <ChevronUp size={16}/>
             </button>
             <div className="w-[1px] bg-slate-200"></div>
             <button onClick={() => setBottomPanelState(prev => Math.max(0, prev - 1))} className={`px-4 py-0.5 hover:bg-blue-50 text-slate-500 transition-colors ${bottomPanelState === 0 ? 'opacity-30 cursor-not-allowed bg-slate-50' : 'hover:text-blue-600'}`} disabled={bottomPanelState === 0} title="收缩趋势轨道">
               <ChevronDown size={16}/>
             </button>
          </div>

          <div className="flex-1 overflow-y-auto light-scrollbar medical-grid flex flex-col relative" ref={waveformContainerRef}>
            
            {/* 内容包裹层：绝对定位用于确保蒙版覆盖完整高度 */}
            <div className="relative min-h-full px-2 pt-2.5 pb-6 flex flex-col space-y-1">
               
               {/* 全局交互蒙版 (高度贯穿所有波形通道) */}
               <div 
                 ref={overlayRef}
                 className={`absolute top-2.5 bottom-6 left-[88px] right-[10px] z-20 ${activeTool ? 'cursor-crosshair' : 'pointer-events-none'}`}
                 onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}
               >
                 {renderGlobalEventMasks()}
                 {isDrawing && activeTool && overlayRef.current && (
                   <div className={`absolute top-0 bottom-0 border-l-[2px] border-r-[2px] border-dashed ${activeTool.borderColor} ${activeTool.color} bg-opacity-20 z-30 pointer-events-none`}
                        style={{ left: `${Math.max(0, Math.min(drawStartX, drawCurrentX) - overlayRef.current.getBoundingClientRect().left)}px`, width: `${Math.abs(drawCurrentX - drawStartX)}px` }}>
                     <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-2 py-0.5 rounded shadow-lg whitespace-nowrap">
                       {activeTool.categoryId === 'stage' ? `批量标记 ${activeTool.label}...` : (activeTool.id === 'fft_select' ? '选取频段...' : '框选特征')}
                     </div>
                   </div>
                 )}
                 {isVideoPlaying && (
                   <div className="absolute top-0 bottom-0 w-[1px] border-l border-dashed border-red-500 z-40 pointer-events-none" style={{ left: `${(videoProgress / viewDurationSec) * 100}%` }}>
                     <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-red-500 rounded-full flex items-center justify-center"><div className="w-1 h-1 bg-white rounded-full"/></div>
                   </div>
                 )}
               </div>
               
               {/* 波形通道列表 - 增加了通道间的呼吸间隙和更平滑的圆角 */}
               {channels.map((ch, i) => {
                 if (!ch.visible) return null;
                 const isHighlighted = isHighlightedChannel(ch.group);
                 return (
                   <div key={ch.id} className={`channel-row h-[42px] bg-white border border-slate-200 relative flex group rounded-md shadow-sm shrink-0 transition-all ${isHighlighted ? 'ring-[1.5px] ring-indigo-400 bg-indigo-50/30 z-10' : ''}`}>
                     <div className="w-[80px] flex flex-col items-center justify-center border-r bg-slate-50 border-slate-200 z-30 pointer-events-auto shrink-0 transition-colors group-hover:bg-blue-50 relative rounded-l-md">
                         <span className="text-[10px] font-bold font-mono text-slate-700 tracking-tight">{ch.lbl}</span>
                         <div className="absolute inset-0 bg-slate-800/90 backdrop-blur-sm opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1 transition-opacity rounded-l-md">
                            <button onClick={() => toggleChannelProp(ch.id, 'visible')} className="p-0.5 hover:bg-white/20 text-white rounded" title="隐藏通道"><EyeOff size={12}/></button>
                            <button onClick={() => toggleChannelProp(ch.id, 'inverted')} className={`p-0.5 rounded ${ch.inverted ? 'bg-blue-500 text-white' : 'hover:bg-white/20 text-white'}`} title="极性反转"><ArrowUpDown size={12}/></button>
                            <div className="flex flex-col">
                              <button onClick={() => moveChannel(i, -1)} className="p-0 hover:bg-white/20 text-white rounded"><ChevronUp size={10}/></button>
                              <button onClick={() => moveChannel(i, 1)} className="p-0 hover:bg-white/20 text-white rounded"><ChevronDown size={10}/></button>
                            </div>
                         </div>
                     </div>
                     <div className="flex-1 relative bg-transparent overflow-hidden pointer-events-none rounded-r-md">
                         <EEGCanvas active={true} height={40} color={getChannelColor(ch.group)} viewScale={viewScale} currentEpoch={currentEpoch} totalEpochs={totalEpochs} yScale={50 / yAxisUv} inverted={ch.inverted}/>
                         <div className="absolute right-1 top-1/2 -translate-y-1/2 text-[9px] font-mono text-slate-400 bg-white/80 px-1 rounded opacity-50 group-hover:opacity-100 transition-opacity">
                           {yAxisUv}
                         </div>
                     </div>
                   </div>
                 );
               })}
            </div>

          </div>
        </div>

        {/* 右侧：折叠面板 */}
        <div className={`transition-all duration-300 ease-in-out shrink-0 relative z-[40] ${isRightPanelOpen ? 'w-[280px] xl:w-[320px] opacity-100' : 'w-0 opacity-0'}`}>
          <div className="w-full h-full flex flex-col bg-white border border-slate-300 rounded-lg shadow-sm overflow-hidden">
            
            <div className="h-40 xl:h-44 bg-slate-900 flex flex-col shrink-0 group">
              {/* 结构化块级小标题：视频监控 */}
              <div className="h-[26px] bg-slate-950 flex items-center justify-between px-3 shrink-0 border-b border-slate-800 z-20">
                 <span className="text-[10px] font-bold text-slate-200 flex items-center">
                   <Video size={12} className="text-blue-400 mr-1.5"/> 同步视频监控
                   <HelpTooltip 
                     title="同步视频监控" 
                     content={<>
                       <p className="text-slate-300">与波形严格时间同步，用于辅助排查患者真实体位及异常行为。</p>
                       <p>点击画面中央区域可快捷控制播放/暂停。</p>
                     </>} 
                     placement="bottom-left" 
                   />
                 </span>
                 <div className="flex items-center gap-1.5">
                 </div>
              </div>

              <div className="flex-1 relative flex flex-col justify-end p-1.5">
                 <Video className="text-slate-700 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" size={36}/>
                 <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity z-10 cursor-pointer" onClick={toggleVideoPlayback}>
                     {isVideoPlaying ? <PauseCircle size={40} className="text-white/90 hover:text-white transition-transform hover:scale-105" strokeWidth={1.5}/> : <PlayCircle size={40} className="text-white/90 hover:text-white transition-transform hover:scale-105" strokeWidth={1.5}/>}
                 </div>
                 <div className="absolute bottom-1 left-2 text-slate-300 text-[9px] font-mono font-bold bg-black/60 px-1.5 py-0.5 rounded z-10">
                   {formatRealTime(viewStartSec + videoProgress)}
                 </div>
                 <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-700 z-10">
                    <div className="h-full bg-red-500 transition-all duration-75" style={{ width: `${(videoProgress / viewDurationSec) * 100}%` }}/>
                 </div>
              </div>
            </div>

            <div className="flex-1 flex flex-col min-h-0 border-t border-slate-200">
              <div className="flex border-b border-slate-200 bg-slate-50 shrink-0">
                <button onClick={() => setRightPanelTab('tools')} className={`flex-1 py-2 text-[10px] font-bold flex items-center justify-center gap-1 transition-colors ${rightPanelTab === 'tools' ? 'bg-white text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'}`}>
                  <Tags size={12}/> 特征标记
                </button>
                <button onClick={() => setRightPanelTab('events')} className={`flex-1 py-2 text-[10px] font-bold flex items-center justify-center gap-1 transition-colors ${rightPanelTab === 'events' ? 'bg-white text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'}`}>
                  <ListChecks size={12}/> 事件清单 <span className="bg-slate-200 text-slate-600 px-1 rounded text-[9px]">{events.length}</span>
                </button>
                <button onClick={() => setRightPanelTab('fft')} className={`flex-1 py-2 text-[10px] font-bold flex items-center justify-center gap-1 transition-colors ${rightPanelTab === 'fft' ? 'bg-white text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'}`}>
                  <BarChart2 size={12}/> 频谱分析
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto light-scrollbar bg-slate-50/50 p-2.5 relative">
                
                {/* === 工具区 Tab === */}
                {rightPanelTab === 'tools' && (
                  <div className="space-y-3 relative">
                    
                    <div>
                      <div className="flex items-center mb-1.5 px-1 border-b border-slate-200 pb-1">
                        <span className="text-[10px] text-slate-500 font-bold flex items-center">
                          波形叠加指标
                          <HelpTooltip 
                            title="指标显示过滤" 
                            content={<p className="text-slate-300">独立控制不同生理信号特征层的显隐。</p>} 
                            placement="bottom-left" 
                          />
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-1">
                         {['eeg','eog','emg','resp','arousal','ecg'].map(key => (
                            <button key={key} onClick={()=>setHighlights(h=>({...h, [key]: !h[key]}))} className={`py-1 text-[10px] font-bold rounded border transition-colors ${highlights[key] ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white text-slate-400 border-slate-200'}`}>
                              {key.toUpperCase()}
                            </button>
                         ))}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center mb-1.5 mt-2 px-1 border-b border-slate-200 pb-1">
                        <span className="text-[10px] text-slate-500 font-bold flex items-center">
                          生理特征类型
                          <HelpTooltip 
                            title="选择特征类型" 
                            content={<>
                              <p className="text-slate-300">点击激活后，对应的波形通道会高亮提示。</p>
                              <p className="text-slate-300">在主波形区拖拽鼠标即可框选生成特征片段。</p>
                              <p className="text-blue-300 mt-1">再次点击已激活的类型标签即可取消操作状态。</p>
                            </>} 
                            placement="bottom-left" 
                          />
                        </span>
                      </div>
                      
                      <div className="space-y-2 mt-1">
                        {AASM_EVENT_SETS.map((set) => (
                          <div key={set.categoryId} className="bg-white border border-slate-200 rounded-md overflow-hidden shadow-sm">
                            <div className={`px-2 py-1.5 ${set.lightBg} border-b border-slate-100 flex items-center gap-1.5`}>
                              <set.icon size={12} className={set.textColor} />
                              <span className={`text-[10px] font-bold ${set.textColor}`}>{set.title}</span>
                            </div>
                            <div className="p-1 grid grid-cols-1 gap-1">
                              {set.items.map(item => {
                                const isSelected = activeTool && activeTool.id === item.id;
                                return (
                                  <button key={item.id} onClick={() => setActiveTool(isSelected ? null : { id: item.id, categoryId: set.categoryId, label: item.label, color: set.color, borderColor: set.borderColor, textColor: set.textColor })}
                                    className={`text-left px-2 py-1 text-[10px] font-bold rounded-md transition-all border flex items-center justify-between ${isSelected ? `${set.color} border-transparent text-white shadow` : `bg-white border-slate-100 text-slate-600 hover:border-slate-300 hover:bg-slate-50`}`}>
                                    <span>{item.label}</span>{isSelected && <Plus size={12} className="opacity-80"/>}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                )}

                {/* === 事件列表 Tab === */}
                {rightPanelTab === 'events' && (
                  <div className="space-y-2 relative">
                    
                    <div className="flex items-center justify-between mb-1 pb-1 border-b border-slate-200">
                       <span className="text-[10px] text-slate-500 font-bold flex items-center">
                         记录明细
                         <HelpTooltip 
                          title="事件清单管理" 
                          content={<>
                            <ul className="list-disc pl-4 space-y-0.5 text-slate-300">
                              <li>自动追踪系统分析与人工判读事件。</li>
                              <li>右上角状态按钮可一键切换校正结果。</li>
                              <li><b>单击卡片主体</b>即可自动追踪对应波形通道与片帧。</li>
                              <li>点击展开箭头可微调起始时间与时长。</li>
                            </ul>
                          </>} 
                          placement="bottom-left" 
                        />
                       </span>
                       
                       <select value={eventSortMode} onChange={e => setEventSortMode(e.target.value)} className="bg-white border border-slate-200 text-slate-600 text-[9px] rounded px-1 py-0.5 outline-none cursor-pointer font-bold">
                         <option value="time">按时间</option>
                         <option value="type">按类型</option>
                       </select>
                    </div>

                    {sortedEvents.length === 0 && <div className="text-center text-[10px] text-slate-400 mt-10">暂无记录</div>}
                    
                    {sortedEvents.map((ev, index) => {
                      const isPending = ev.status === 'Pending';
                      const isExpanded = expandedEventId === ev.id;
                      const showHeader = eventSortMode === 'type' && (index === 0 || ev.categoryId !== sortedEvents[index-1].categoryId);
                      const categoryTitle = AASM_EVENT_SETS.find(s => s.categoryId === ev.categoryId)?.title || '其他事件';
                      
                      return (
                        <React.Fragment key={ev.id}>
                          {showHeader && (
                            <div className="text-[10px] font-bold text-slate-500 uppercase mt-3 mb-1.5 border-b border-slate-200 pb-0.5 pl-1">
                              {categoryTitle}
                            </div>
                          )}
                          <div className={`border p-2 rounded-md text-[10px] flex flex-col gap-1 transition-all bg-white shadow-sm hover:shadow-md cursor-pointer ${isPending ? 'border-amber-300 bg-amber-50/20' : 'border-slate-200 hover:border-blue-300'}`} 
                               onClick={() => { locateToEvent(ev.startSec, ev.typeGroup); }}>
                            <div className="flex justify-between items-start">
                              <span className={`font-bold ${ev.textColor} flex items-center gap-1.5 leading-tight`}>
                                <div className={`w-2 h-2 rounded-full ${ev.color}`}/>{ev.label}
                              </span>
                              <div className="flex items-center gap-1">
                                {ev.source === 'AI' ? (
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); toggleEventStatus(ev.id); }} 
                                    className={`text-[9px] font-bold flex items-center gap-0.5 px-1 py-0.5 rounded leading-none border transition-colors ${isPending ? 'text-amber-600 bg-amber-50 border-amber-200 hover:bg-amber-100' : 'text-emerald-600 bg-emerald-50 border-emerald-200 hover:bg-emerald-100'}`}
                                    title={isPending ? '点击确认为已校正' : '点击撤回至待校正'}
                                  >
                                    {isPending ? <AlertCircle size={9}/> : <CheckCircle2 size={9}/>} {isPending ? '待校正' : '已校正'}
                                  </button>
                                ) : (
                                  <span className="text-[9px] font-bold flex items-center gap-0.5 px-1 py-0.5 rounded leading-none border border-indigo-200 text-indigo-600 bg-indigo-50">
                                    <Edit2 size={9}/> 人工记录
                                  </span>
                                )}
                                <button onClick={(e) => { e.stopPropagation(); deleteEvent(ev.id); }} className="p-0.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded transition-colors" title="删除记录"><Trash2 size={12}/></button>
                                <button onClick={(e) => { e.stopPropagation(); setExpandedEventId(isExpanded ? null : ev.id); }} className="p-0.5 text-slate-400 hover:bg-slate-100 rounded transition-colors" title={isExpanded ? '收起时间调整' : '展开时间调整'}>
                                  <ChevronDown size={12} className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                </button>
                              </div>
                            </div>
                            
                            {/* 展开的详情内容 (手风琴) */}
                            {isExpanded && (
                              <div className="flex flex-col gap-1.5 mt-1 border-t border-slate-100 pt-2 animate-in fade-in slide-in-from-top-1" onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded border border-slate-100">
                                   <div className="flex flex-col gap-1 flex-1">
                                      <span className="text-[9px] text-slate-500 font-bold pl-0.5">起始时间 (±1帧)</span>
                                      <div className="flex items-center bg-white border border-slate-200 rounded shadow-sm overflow-hidden">
                                        <button onClick={(e) => { e.stopPropagation(); updateEventDetails(ev.id, 'startSec', Math.max(0, ev.startSec - 30)); }} className="px-2 py-1 bg-slate-50 hover:bg-slate-100 border-r border-slate-200 text-slate-600 transition-colors">-</button>
                                        <div className="flex-1 text-center text-[10px] font-mono font-bold text-slate-700">{formatRealTime(ev.startSec)}</div>
                                        <button onClick={(e) => { e.stopPropagation(); updateEventDetails(ev.id, 'startSec', ev.startSec + 30); }} className="px-2 py-1 bg-slate-50 hover:bg-slate-100 border-l border-slate-200 text-slate-600 transition-colors">+</button>
                                      </div>
                                   </div>
                                   <div className="flex flex-col gap-1 flex-1">
                                      <span className="text-[9px] text-slate-500 font-bold pl-0.5">持续时长 (±30s)</span>
                                      <div className="flex items-center bg-white border border-slate-200 rounded shadow-sm overflow-hidden">
                                        <button onClick={(e) => { e.stopPropagation(); updateEventDetails(ev.id, 'durationSec', Math.max(30, ev.durationSec - 30)); }} className="px-2 py-1 bg-slate-50 hover:bg-slate-100 border-r border-slate-200 text-slate-600 transition-colors">-</button>
                                        <div className="flex-1 text-center text-[10px] font-mono font-bold text-slate-700">{ev.durationSec}s</div>
                                        <button onClick={(e) => { e.stopPropagation(); updateEventDetails(ev.id, 'durationSec', ev.durationSec + 30); }} className="px-2 py-1 bg-slate-50 hover:bg-slate-100 border-l border-slate-200 text-slate-600 transition-colors">+</button>
                                      </div>
                                   </div>
                                </div>
                                <div className="flex justify-between items-center px-1 mt-0.5">
                                  <span className="text-[9px] text-slate-400 font-mono">所属片帧: Ep {Math.floor(ev.startSec/30)+1}</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </React.Fragment>
                      );
                    })}
                  </div>
                )}

                {/* === 实时分析 (FFT) Tab === */}
                {rightPanelTab === 'fft' && (
                  <div className="space-y-3 animate-in fade-in zoom-in-95 duration-200 relative">
                    
                    <div className="flex items-center justify-between mb-1 pb-1 border-b border-slate-200">
                      <span className="text-[10px] text-slate-500 font-bold flex items-center">
                        空间与能量分析
                        <HelpTooltip 
                          title="频谱分析操作" 
                          content={<>
                            <p className="text-slate-300">默认实时计算当前视窗内的信号频段能量分布。</p>
                            <p className="text-blue-300 mt-1">点击【选取特征段】后在波形上截取，即可单独分析特定片段。</p>
                          </>} 
                          placement="bottom-left" 
                        />
                      </span>
                      <button 
                         onClick={() => setActiveTool({id: 'fft_select', label: '频谱分析段', borderColor: 'border-indigo-500', color: 'bg-indigo-500'})} 
                         className={`text-[9px] font-bold px-1.5 py-1 rounded shadow-sm flex items-center gap-0.5 transition-colors ${activeTool?.id === 'fft_select' ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-200'}`}
                       >
                          <MousePointer2 size={10}/> 选取特征段
                       </button>
                    </div>

                    <div className="bg-white border border-slate-200 p-2 rounded-lg shadow-sm">
                      <div className="flex justify-between items-center mb-1.5 px-1">
                         <span className="text-[10px] font-bold text-slate-700 flex items-center">
                           连续时频图
                           <HelpTooltip title="连续时频图" content={<p className="text-slate-300">展示随时间变化的信号频谱能量密度。</p>} placement="bottom-left" />
                         </span>
                         <span className="text-[9px] font-mono text-slate-400">0-30Hz</span>
                      </div>
                      <div className="h-24 w-full rounded bg-gradient-to-t from-blue-900 via-purple-700 to-amber-400 relative overflow-hidden">
                         <div className="absolute inset-0 mix-blend-overlay opacity-40" style={{ backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(255,255,255,0.4) 2px, rgba(255,255,255,0.4) 4px)' }}></div>
                         <div className="absolute inset-0 mix-blend-overlay opacity-30" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 4px, rgba(0,0,0,0.4) 4px, rgba(0,0,0,0.4) 8px)' }}></div>
                         <div className="absolute bottom-2 left-[20%] w-[30%] h-8 bg-yellow-300 rounded-[50%] blur-xl opacity-60"></div>
                         <div className="absolute bottom-4 left-[50%] w-[20%] h-6 bg-red-500 rounded-[50%] blur-xl opacity-40"></div>
                      </div>
                      <div className="flex justify-between text-[9px] font-mono text-slate-400 mt-1">
                         <span>{formatRealTime(fftTimeRange[0])}</span>
                         <span>时间(s)</span>
                         <span>{formatRealTime(fftTimeRange[1])}</span>
                      </div>
                    </div>

                    <div className="bg-white border border-slate-200 p-2 rounded-lg shadow-sm mt-2">
                      <div className="flex items-center mb-2 px-1">
                        <span className="text-[10px] font-bold text-slate-700 flex items-center">
                          频段能量占比
                          <HelpTooltip title="频段能量" content={<p className="text-slate-300">量化提取 Delta, Theta, Alpha 等关键睡眠脑电频段的相对占比。</p>} placement="bottom-left" />
                        </span>
                      </div>
                      <div className="flex items-end h-24 gap-1 px-1">
                         {[
                           { lbl: 'δ(0.5-4)', h: '65%', color: 'bg-blue-500', name: 'Delta' },
                           { lbl: 'θ(4-8)', h: '25%', color: 'bg-indigo-500', name: 'Theta' },
                           { lbl: 'α(8-13)', h: '45%', color: 'bg-purple-500', name: 'Alpha' },
                           { lbl: 'σ(11-16)', h: '85%', color: 'bg-pink-500', name: 'Sigma' }, 
                           { lbl: 'β(>16)', h: '15%', color: 'bg-rose-500', name: 'Beta' },
                         ].map(band => (
                           <div key={band.name} className="flex-1 flex flex-col items-center justify-end gap-1 group">
                             <span className="text-[8px] text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity font-mono leading-none">{band.h}</span>
                             <div className={`w-full ${band.color} rounded-t-sm shadow-sm transition-all duration-500 hover:brightness-110`} style={{height: band.h}}></div>
                             <span className="text-[9px] font-bold text-slate-600 text-center leading-tight whitespace-nowrap">{band.lbl.split('(')[0]}<br/><span className="text-[8px] text-slate-400 scale-90 inline-block">({band.lbl.split('(')[1]}</span></span>
                           </div>
                         ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ================= 3. 底部图表区与操作台 ================= */}
      <div className="shrink-0 flex flex-col px-2 pb-2 pt-1 gap-2 relative z-[20]">
        
        {/* 多轨道图表区 (三级高度切换，完全杜绝重叠) */}
        <div className={`transition-all duration-300 ease-in-out w-full relative ${getBottomPanelHeight()}`}>
          <div className="h-full w-full flex flex-col bg-white border border-slate-300 rounded-lg shadow-sm relative overflow-hidden">
            
            {/* 结构化块级小标题：整夜趋势 */}
            <div className="h-[26px] bg-slate-50 border-b border-slate-200 flex items-center px-3 shrink-0 z-10 relative">
               <BarChart size={12} className="text-blue-600 mr-1.5"/>
               <span className="text-[10px] font-bold text-slate-700 tracking-wide flex items-center">
                 整夜趋势
                 <HelpTooltip 
                   title="宏观趋势概览" 
                   content={<>
                     <p className="text-slate-300 mb-1">全局视图：同步分期、事件、血氧与体位4大主轨道。</p>
                     <p className="text-slate-300">
                       • <b>II级 (聚焦)</b>：右侧控件切换独立轨道空间。<br/>
                       • <b>III级 (全览)</b>：4大图表等高平铺，直接尽览全貌。
                     </p>
                     <p className="text-blue-300 mt-1">支持点击任意图表折线或空白处，直接完成主波形跳转定位。</p>
                   </>} 
                   placement="top-right" 
                 />
               </span>
               
               {/* 固定在顶部的红色游标三角 (脱离滚动区域防止丢失) */}
               <div className="absolute bottom-0 pointer-events-none ml-[80px] w-[calc(100%-80px)] left-0 pr-4 pl-3">
                  <div className="absolute bottom-0 transition-all duration-200" style={{ left: `calc(${(currentEpoch / totalEpochs) * 100}% + 12px)`, transform: 'translateX(-50%)' }}>
                      <div className="w-0 h-0 border-l-[4px] border-r-[4px] border-t-[5px] border-transparent border-t-red-600 drop-shadow-md" />
                  </div>
               </div>
            </div>

            {/* II级单轨聚焦时：右侧类滑块/箭头轨道切换器 */}
            {bottomPanelState === 1 && (
              <div 
                className="absolute right-0 top-[26px] bottom-0 w-[40px] bg-white/90 backdrop-blur border-l border-slate-200 shadow-[-2px_0_5px_rgba(0,0,0,0.02)] flex flex-col justify-center items-center py-1 z-[60]"
                onClick={(e) => e.stopPropagation()} 
              >
                 <button onClick={() => setActiveTrackIndex(Math.max(0, activeTrackIndex - 1))} disabled={activeTrackIndex === 0} className="p-1 text-slate-500 hover:text-blue-600 disabled:opacity-20 transition-colors"><ChevronUp size={14}/></button>
                 <div className="flex flex-col gap-1.5 my-1">
                   {[0, 1, 2, 3].map(i => (
                     <button 
                       key={i} 
                       onClick={() => setActiveTrackIndex(i)}
                       className={`w-1.5 h-1.5 rounded-full transition-all ${i === activeTrackIndex ? 'bg-blue-600 ring-[1.5px] ring-blue-200' : 'bg-slate-300 hover:bg-slate-400'}`}
                       title={['分期', '事件', '血氧', '体位'][i]}
                     />
                   ))}
                 </div>
                 <button onClick={() => setActiveTrackIndex(Math.min(3, activeTrackIndex + 1))} disabled={activeTrackIndex === 3} className="p-1 text-slate-500 hover:text-blue-600 disabled:opacity-20 transition-colors"><ChevronDown size={14}/></button>
              </div>
            )}

            {/* 轨道等分排列容器区 */}
            <div className="flex-1 w-full relative overflow-hidden flex flex-col bg-slate-50/50">
              
              <div className="w-full flex-1 flex flex-col p-1.5 gap-1.5" onMouseLeave={() => setHoveredEpoch(null)}>
                
                {/* Track 0: 睡眠分期 (Hypnogram) */}
                {(bottomPanelState === 2 || (bottomPanelState === 1 && activeTrackIndex === 0)) && (
                  <div className={`flex bg-white relative group transition-all shrink-0 ${bottomPanelState === 2 ? 'flex-1 rounded-md border border-slate-200 shadow-sm' : 'h-full'}`}>
                    <div className={`w-[80px] bg-slate-50 relative shrink-0 ${bottomPanelState === 2 ? 'border-r border-slate-200 rounded-l-md' : 'border-r border-slate-200'}`}>
                       <span className="absolute top-1 left-2 text-[9px] font-bold text-slate-500 uppercase">分期</span>
                       <span className="absolute right-2 top-[10%] -translate-y-1/2 text-[8px] font-mono text-red-500 font-bold leading-none">W</span>
                       <span className="absolute right-2 top-[30%] -translate-y-1/2 text-[8px] font-mono text-amber-500 font-bold leading-none">R</span>
                       <span className="absolute right-2 top-[50%] -translate-y-1/2 text-[8px] font-mono text-blue-400 font-bold leading-none">N1</span>
                       <span className="absolute right-2 top-[70%] -translate-y-1/2 text-[8px] font-mono text-blue-500 font-bold leading-none">N2</span>
                       <span className="absolute right-2 top-[90%] -translate-y-1/2 text-[8px] font-mono text-indigo-700 font-bold leading-none">N3</span>
                    </div>
                    {/* 添加交互与涟漪捕捉层 */}
                    <div className="flex-1 relative overflow-hidden chart-grid-y rounded-r-md cursor-crosshair active:scale-[0.998] transition-transform" onMouseMove={handleTrackMouseMove} onClick={handleTrackClick}>
                       <div className={`absolute inset-y-0 left-3 ${bottomPanelState === 1 ? 'right-12' : 'right-4'}`}>
                         <svg className="w-full h-full pointer-events-none" preserveAspectRatio="none" viewBox={`0 0 ${totalEpochs} 100`}>
                           {hypnoData.map((val, i) => {
                              const map = {4: 10, 3: 30, 2: 50, 1: 70, 0: 90};
                              const colorMap = {4: '#ef4444', 3: '#f59e0b', 2: '#60a5fa', 1: '#3b82f6', 0: '#4338ca'};
                              const y = map[val];
                              const color = colorMap[val];

                              return (
                                <g key={i}>
                                  <line x1={i} y1={y} x2={i+1} y2={y} stroke={color} strokeWidth="2.5" />
                                  {i > 0 && hypnoData[i-1] !== val && (
                                    <line x1={i} y1={map[hypnoData[i-1]]} x2={i} y2={y} stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="0.5,1" />
                                  )}
                                </g>
                              );
                           })}
                           {/* 悬停放大指示器 */}
                           {hoveredEpoch !== null && (
                              <circle cx={hoveredEpoch} cy={{4:10, 3:30, 2:50, 1:70, 0:90}[hypnoData[hoveredEpoch]]} r="3.5" fill="#3b82f6" className="transition-all duration-75" />
                           )}
                           {/* 点击波纹特效 */}
                           {clickRipple && (
                              <circle key={clickRipple.id} cx={clickRipple.epoch} cy={{4:10, 3:30, 2:50, 1:70, 0:90}[hypnoData[clickRipple.epoch]]} r="12" fill="transparent" stroke="#3b82f6" strokeWidth="1.5" className="animate-ripple" />
                           )}
                         </svg>
                       </div>
                    </div>
                  </div>
                )}

                {/* Track 1: 睡眠相关事件 (Events) */}
                {(bottomPanelState === 2 || (bottomPanelState === 1 && activeTrackIndex === 1)) && (
                  <div className={`flex bg-white relative group transition-all shrink-0 ${bottomPanelState === 2 ? 'flex-1 rounded-md border border-slate-200 shadow-sm' : 'h-full'}`}>
                    <div className={`w-[80px] bg-slate-50 relative shrink-0 ${bottomPanelState === 2 ? 'border-r border-slate-200 rounded-l-md' : 'border-r border-slate-200'}`}>
                       <span className="absolute top-1 left-2 text-[9px] font-bold text-slate-500 uppercase">事件</span>
                       <span className="absolute right-2 top-[16.5%] -translate-y-1/2 text-[8px] font-bold text-red-500 leading-none">Resp</span>
                       <span className="absolute right-2 top-[50%] -translate-y-1/2 text-[8px] font-bold text-emerald-500 leading-none">Mov</span>
                       <span className="absolute right-2 top-[83.5%] -translate-y-1/2 text-[8px] font-bold text-yellow-500 leading-none">Aro</span>
                    </div>
                    <div className="flex-1 relative overflow-hidden chart-grid-y rounded-r-md cursor-crosshair active:scale-[0.998] transition-transform" onMouseMove={handleTrackMouseMove} onClick={handleTrackClick}>
                       <div className={`absolute inset-y-0 left-3 ${bottomPanelState === 1 ? 'right-12' : 'right-4'}`}>
                         <div className="absolute top-[33.3%] w-full border-t border-slate-200 border-dashed opacity-50 pointer-events-none"/>
                         <div className="absolute top-[66.6%] w-full border-t border-slate-200 border-dashed opacity-50 pointer-events-none"/>
                         
                         {events.map((ev) => {
                             const totalSec = totalEpochs * 30;
                             const left = (ev.startSec / totalSec) * 100;
                             const width = Math.max(0.1, (ev.durationSec / totalSec) * 100); 
                             
                             let topOffset = '9%'; // 默认呼吸车道
                             if (ev.categoryId === 'emg' || ev.categoryId === 'movement') topOffset = '42.5%';
                             else if (ev.categoryId === 'arousal') topOffset = '76%';
  
                             return (
                                 <div 
                                     key={ev.id}
                                     className="absolute flex items-center justify-center group z-10 pointer-events-none"
                                     style={{ left: `${left}%`, width: `${width}%`, top: topOffset, height: '15%', minWidth: '3px' }}
                                 >
                                     <div className="absolute -inset-x-2 inset-y-[-4px] z-20" title={`${ev.label} (${ev.durationSec}s)`} />
                                     <div className={`w-full h-full rounded-sm transition-all duration-200 group-hover:scale-y-[2.0] group-hover:scale-x-[1.5] group-hover:shadow-md ${ev.color}`} />
                                 </div>
                             )
                         })}
                       </div>
                    </div>
                  </div>
                )}

                {/* Track 2: 血氧饱和度 (SpO2) */}
                {(bottomPanelState === 2 || (bottomPanelState === 1 && activeTrackIndex === 2)) && (
                  <div className={`flex bg-white relative group transition-all shrink-0 ${bottomPanelState === 2 ? 'flex-1 rounded-md border border-slate-200 shadow-sm' : 'h-full'}`}>
                    <div className={`w-[80px] bg-slate-50 relative shrink-0 ${bottomPanelState === 2 ? 'border-r border-slate-200 rounded-l-md' : 'border-r border-slate-200'}`}>
                       <span className="absolute top-1 left-2 text-[9px] font-bold text-slate-500 uppercase">SpO2</span>
                       {[100, 95, 90, 85, 0].map(tick => (
                         <span key={tick} className="absolute right-2 text-[8px] font-mono text-slate-400 -translate-y-1/2 leading-none" style={{ top: `${getSpO2YPercentage(tick)}%` }}>
                           {tick}
                         </span>
                       ))}
                    </div>
                    <div className="flex-1 relative overflow-hidden chart-grid-y rounded-r-md cursor-crosshair active:scale-[0.998] transition-transform" onMouseMove={handleTrackMouseMove} onClick={handleTrackClick}>
                       <div className={`absolute inset-y-0 left-3 ${bottomPanelState === 1 ? 'right-12' : 'right-4'}`}>
                         <svg className="w-full h-full pointer-events-none" preserveAspectRatio="none" viewBox={`0 0 ${totalEpochs} 100`}>
                           <polyline points={mockSpO2Data.map((val, i) => `${i},${getSpO2YPercentage(val)}`).join(' ')} fill="none" stroke="#ea580c" strokeWidth="1.2" strokeLinejoin="round" />
                         </svg>
                       </div>
                    </div>
                  </div>
                )}

                {/* Track 3: 体位 (Position) */}
                {(bottomPanelState === 2 || (bottomPanelState === 1 && activeTrackIndex === 3)) && (
                  <div className={`flex bg-white relative group transition-all shrink-0 ${bottomPanelState === 2 ? 'flex-1 rounded-md border border-slate-200 shadow-sm' : 'h-full'}`}>
                    <div className={`w-[80px] bg-slate-50 relative shrink-0 ${bottomPanelState === 2 ? 'border-r border-slate-200 rounded-l-md' : 'border-r border-slate-200'}`}>
                       <span className="absolute top-1 left-2 text-[9px] font-bold text-slate-500 uppercase">体位</span>
                       <span className="absolute right-2 top-[12.5%] -translate-y-1/2 text-[8px] text-slate-400 font-mono leading-none">仰卧</span>
                       <span className="absolute right-2 top-[37.5%] -translate-y-1/2 text-[8px] text-slate-400 font-mono leading-none">左侧</span>
                       <span className="absolute right-2 top-[62.5%] -translate-y-1/2 text-[8px] text-slate-400 font-mono leading-none">右侧</span>
                       <span className="absolute right-2 top-[87.5%] -translate-y-1/2 text-[8px] text-slate-400 font-mono leading-none">俯卧</span>
                    </div>
                    <div className="flex-1 relative overflow-hidden chart-grid-y rounded-r-md cursor-crosshair active:scale-[0.998] transition-transform" onMouseMove={handleTrackMouseMove} onClick={handleTrackClick}>
                       <div className={`absolute inset-y-0 left-3 ${bottomPanelState === 1 ? 'right-12' : 'right-4'}`}>
                         <svg className="w-full h-full pointer-events-none" preserveAspectRatio="none" viewBox={`0 0 ${totalEpochs} 100`}>
                           <polyline points={positionPoints} fill="none" stroke="#059669" strokeWidth="1.5" strokeLinejoin="step" />
                         </svg>
                       </div>
                    </div>
                  </div>
                )}
                
                {/* 贯穿容器的高度红线 (单轨及全轨模式适用) */}
                <div className="absolute top-0 bottom-0 z-30 pointer-events-none ml-[80px] w-[calc(100%-80px)]">
                   <div className={`absolute inset-y-0 left-3 ${bottomPanelState === 1 ? 'right-12' : 'right-4'}`}>
                     <div className="absolute top-0 bottom-0 w-[2px] bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)] transition-all duration-200" style={{ left: `${(currentEpoch / totalEpochs) * 100}%`, transform: 'translateX(-50%)' }} />
                   </div>
                </div>

              </div>
            </div>

          </div>
        </div>

        {/* 固定底部控制台区 (高度 56px，集成控制模块化) */}
        <div className="h-[56px] flex items-center justify-between px-5 bg-white border border-slate-300 rounded-lg shadow-sm shrink-0 relative z-[60]">
           {/* 1. 当前位置信息 */}
           <div className="flex items-center gap-4 w-[20%]">
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest whitespace-nowrap">当前片帧</span>
                <span className="text-xs font-mono font-bold text-slate-700 whitespace-nowrap">Ep: {currentEpoch} / {totalEpochs}</span>
              </div>
           </div>

           {/* 2. 紧凑型核心控制岛 (播放与分期合并) */}
           <div className="flex items-center bg-slate-50 border border-slate-200 rounded-lg p-1 shadow-sm shrink-0 relative">
             
             {/* 播放控制 */}
             <div className="flex bg-white rounded border border-slate-200 shadow-sm shrink-0 mr-1.5">
               <button onClick={() => setCurrentEpoch(e => Math.max(1, e - 1))} className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-50 rounded-l transition-colors border-r border-slate-100" title="回退"><Rewind size={14}/></button>
               <button onClick={toggleVideoPlayback} className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-50 transition-colors border-r border-slate-100" title="行进推演"><Play size={14}/></button>
               <button onClick={() => setCurrentEpoch(e => Math.min(totalEpochs, e + 1))} className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-50 rounded-r transition-colors" title="前进"><FastForward size={14}/></button>
             </div>
             
             <div className="w-px h-6 bg-slate-200 mx-1"></div>
             
             {/* 分期判定 */}
             <div className="flex items-center gap-1 pl-1 pr-1.5 relative">
                <div className="flex gap-1">
                  {['W','N1','N2','N3','R'].map(s => (
                    <button key={s} onClick={() => updateStageAndHypno(s, currentEpoch - 1)} className={`w-10 h-8 rounded font-bold text-xs transition-all flex items-center justify-center ${stageStr === s ? 'bg-blue-600 text-white shadow-md border-none scale-[1.05]' : 'bg-white text-slate-600 hover:bg-blue-50 hover:text-blue-600 border border-slate-200 shadow-sm'}`}>
                      {s}
                    </button>
                  ))}
                </div>
                
                <div className="w-px h-6 bg-slate-200 mx-0.5"></div>
                
                {/* 框选批量分期工具 */}
                <button 
                  onClick={() => setActiveTool(activeTool?.id === 'stage_batch' ? null : { id: 'stage_batch', categoryId: 'stage', label: '批量分期', color: 'bg-indigo-500', borderColor: 'border-indigo-500', textColor: 'text-indigo-800' })}
                  className={`px-2 h-8 rounded flex items-center justify-center gap-1 border transition-colors shadow-sm ${activeTool?.categoryId === 'stage' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-indigo-50 hover:text-indigo-700'}`}
                  title="在主波形区框选多个片段，统一应用某种分期"
                >
                  <MousePointer2 size={12}/>
                  <span className="text-[10px] font-bold whitespace-nowrap">批量分期</span>
                </button>

                <div className="flex flex-col ml-1.5 items-start justify-center gap-1">
                   <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest flex items-center leading-none">
                     分期判定
                     <HelpTooltip 
                       title="分期判定" 
                       content={<>
                         <p className="text-slate-300">手动或快捷键 (W/1/2/3/R) 判定当前片帧的睡眠阶段。</p>
                         <p className="text-slate-300">若开启“判读后自动下一帧”，操作后将自动推演至下一视窗。</p>
                         <p className="text-blue-300 mt-1">激活【批量分期】后可直接在波形区进行大段数据多选。</p>
                       </>} 
                       placement="top-center" 
                     />
                   </span>
                   <button 
                     onClick={() => setAutoAdvance(!autoAdvance)} 
                     className={`text-[9px] px-1 py-[2px] rounded flex items-center gap-0.5 leading-none transition-colors border whitespace-nowrap ${autoAdvance ? 'text-emerald-600 bg-emerald-50 border-emerald-200 hover:bg-emerald-100' : 'text-slate-400 bg-slate-50 border-slate-200 hover:bg-slate-100'}`} 
                     title="开启/关闭分期后自动进入下一帧"
                   >
                     <Bot size={8}/> 判读后自动下一帧 {autoAdvance ? 'ON' : 'OFF'}
                   </button>
                </div>
             </div>
           </div>
           
           {/* 3. 报告签发端 */}
           <div className="w-[20%] flex justify-end items-center relative z-[60]">
              <button className="px-4 py-1.5 bg-white text-blue-700 border border-slate-200 rounded-md text-[11px] font-bold hover:bg-blue-50 transition-colors shadow-sm flex items-center gap-1.5 shrink-0 relative">
                <PieChart size={14}/> 生成报告
                <div className="absolute right-0 bottom-full mb-1" onClick={e=>e.stopPropagation()}>
                   <HelpTooltip 
                     title="生成报告" 
                     content={<>
                       <p className="text-slate-300">终点操作：整合当前所有复核的分期及事件数据。</p>
                       <p className="text-slate-300">将导出标准的 AASM 临床多导睡眠监测报告。</p>
                     </>} 
                     placement="top-right" 
                   />
                </div>
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};


// ############################################################################
// # 3. 根组件与导航包装 (严格适配 1920x1080 桌面端分辨率)
// ############################################################################

export default function App() {
  const [lang, setLang] = useState('zh');
  const activeModule = 'scoring'; 

  const mockTaskData = { taskId: 'T-2026-0315', patient: { id: 'IP-100088', name: '张建国' }, type: 'PSG' };
  const handleBack = () => alert("返回上级环境。");

  const NavItem = ({ id, icon: IconComponent, label }) => (
    <button className={`w-full py-3.5 flex flex-col items-center gap-1 transition-colors relative ${activeModule === id ? 'text-white' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'}`}>
      {activeModule === id && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-blue-500 rounded-r-full shadow-[0_0_10px_#3b82f6]"/>}
      <div className={`p-1.5 rounded-lg transition-colors ${activeModule === id ? 'bg-blue-600 shadow-md shadow-blue-900/50' : 'bg-transparent'}`}>
        <IconComponent size={16} strokeWidth={activeModule === id ? 2 : 1.5} />
      </div>
      <span className={`text-[10px] font-bold tracking-wider ${activeModule === id ? 'text-blue-200' : ''}`}>{label}</span>
    </button>
  );

  return (
    <>
      <GlobalStyles />
      <div className="flex items-center justify-center min-h-screen w-full overflow-hidden p-0 bg-slate-900">
        <div className="flex w-full h-screen max-w-[1920px] max-h-[1080px] bg-slate-100 shadow-2xl overflow-hidden relative">
          
          <div className="w-[64px] bg-slate-900 flex flex-col items-center py-4 shrink-0 z-50 relative border-r border-slate-800">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center font-bold text-white mb-5 text-[11px] tracking-widest shadow border border-blue-400/50">
              QL
            </div>
            <div className="flex-1 w-full space-y-0.5">
              <NavItem id="patient" icon={Users} label={lang === 'zh' ? "病患管理" : "Patient"} />
              <NavItem id="central" icon={Activity} label={lang === 'zh' ? "中央监护" : "Monitor"} />
              <NavItem id="acquisition" icon={Monitor} label={lang === 'zh' ? "数据采集" : "Record"} />
              <NavItem id="scoring" icon={Cpu} label={lang === 'zh' ? "睡眠判读" : "Score"} />
              <NavItem id="report" icon={PieChart} label={lang === 'zh' ? "报告签发" : "Report"} />
            </div>
            <div className="mt-auto mb-1 flex flex-col gap-2 w-full px-2">
              <button onClick={() => setLang(l => l === 'zh' ? 'en' : 'zh')} className="py-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors flex flex-col items-center justify-center gap-0.5 font-bold">
                  <Globe size={16}/><span className="text-[9px] tracking-wider">{lang === 'zh' ? 'EN' : '中'}</span>
              </button>
              <button className="py-2 text-slate-500 hover:text-slate-300 hover:bg-slate-800 rounded-lg transition-colors flex flex-col items-center justify-center">
                  <Settings size={16}/>
              </button>
            </div>
          </div>

          <div className="flex-1 relative overflow-hidden bg-slate-100 flex flex-col">
            <ScoringConsole taskData={mockTaskData} onBack={handleBack} />
          </div>
          
        </div>
      </div>
    </>
  );
}