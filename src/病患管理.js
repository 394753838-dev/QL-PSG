import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  Users, Plus, Search, Edit2, Trash2, ArrowLeft, 
  UserPlus, Activity, ClipboardList, Clipboard, 
  X, Info, AlertTriangle, ShieldAlert, Lock,
  Monitor, Cpu, PieChart, Globe, Settings, HelpCircle, FileText,
  BadgeAlert
} from 'lucide-react';

// ############################################################################
// # 1. 国际化字典 & Context (i18n)
// ############################################################################

const enDict = {
  // Navigation & Global
  '病患管理': 'Patients',
  '中央监护': 'Monitor',
  '数据采集': 'Record',
  '睡眠判读': 'Scoring',
  '报告签发': 'Reports',
  '未知模块': 'Unknown Module',
  '中央监护控制台': 'Central Monitoring Console',
  '实时数据采集仪': 'Real-time Data Acquisition',
  '多导睡眠判读中心': 'Sleep Scoring Center',
  '综合报告签发': 'Comprehensive Report Generation',

  // Patient Manager / Table Headers
  '患者档案': 'Patient Records',
  '总建档患者:': 'Total Registered Patients:',
  '新建患者档案': 'New Patient Record',
  '搜索姓名、住院号 或 电话': 'Search Name, Hospital ID or Phone',
  '患者姓名': 'Patient Name',
  '住院号': 'Hospital ID',
  '性别 / 年龄': 'Gender / Age',
  '主治医师': 'Attending Doctor',
  '体征 (BMI/颈围)': 'BMI / Neck',
  '适用AASM标准': 'AASM Standard',
  '操作': 'Actions',

  // Patient Detail View
  '患者临床档案明细': 'Patient Clinical Record Details',
  '编辑资料': 'Edit Info',
  '姓名': 'Name',
  '性别': 'Gender',
  '岁': 'yrs',
  '联系电话': 'Phone',
  '身高 / 体重': 'Height / Weight',
  'BMI / 颈围': 'BMI / Neck',
  'ESS / PSQI': 'ESS / PSQI',
  'ISI / STOP-Bang': 'ISI / STOP-Bang',
  '建档日期': 'Creation Date',
  '合并症': 'Comorbidities',
  '无特殊记录': 'No special record',
  '现用药史': 'Current Medications',
  '未提供用药信息': 'No medication info provided',
  '简要病史': 'Brief History',

  // Tasks
  '临床监测任务及报告': 'Clinical Monitoring Tasks & Reports',
  '任务说明': 'Task Description',
  '管理该患者的所有多导睡眠监测(PSG)及日间试验。在此新建任务，或进入工作台实施采集及判读操作。': 'Manage all PSG and daytime tests. Create tasks or enter workspace here to acquire and score data.',
  '新建监测任务': 'New Task',
  '暂无关联的临床监测记录': 'No associated clinical monitoring records',
  '记录编号': 'Record No.',
  '模式': 'Mode',
  '病床': 'Bed',
  '状态': 'Status',
  '记录日期': 'Record Date',
  '待监测': 'Scheduled',
  '监测中': 'Recording',
  '待判读': 'Pending',
  '已出报告': 'Reported',
  '修改参数': 'Edit Params',
  '永久删除': 'Delete',
  '查看数据': 'View Data',
  '判读数据': 'Score Data',
  '进入档案': 'Enter Record',

  // Modals & Forms
  '新建患者临床档案': 'New Patient Clinical Record',
  '编辑患者临床资料': 'Edit Patient Clinical Info',
  '出生日期(DOB)': 'Date of Birth (DOB)',
  '年龄 (自动计算)': 'Age (Auto-calc)',
  '男': 'Male',
  '女': 'Female',
  '体重 (kg)': 'Weight (kg)',
  '身高 (cm)': 'Height (cm)',
  'BMI (自动计算)': 'BMI (Auto-calc)',
  '颈围 (cm)': 'Neck (cm)',
  'ESS (嗜睡)': 'ESS (Sleepiness)',
  'PSQI (睡眠质量)': 'PSQI (Sleep Quality)',
  'ISI (失眠严重度)': 'ISI (Insomnia Severity)',
  '主诉及简要病史': 'Chief Complaint & Brief History',
  '取消': 'Cancel',
  '保存档案': 'Save Record',
  '确定': 'Confirm',
  '修改临床监测任务': 'Edit Monitoring Task',
  '创建临床监测任务': 'Create Monitoring Task',
  '标准监测模式设置 (AASM)': 'Monitoring Mode (AASM)',
  '整夜多导睡眠监测 (PSG)': 'Overnight PSG',
  '分夜监测 (Split-Night)': 'Split-Night',
  '压力滴定 (CPAP/NIV)': 'Titration (CPAP/NIV)',
  '多次睡眠潜伏期测试 (MSLT)': 'MSLT',
  '清醒维持测试 (MWT)': 'MWT',
  '床位号': 'Bed Number',
  '操作技师': 'Technician',
  '临床备注 / 医嘱': 'Clinical Notes / Orders',
  '例: 01': 'e.g., 01',
  '附加特殊医嘱或监测要求...': 'Additional medical orders or monitoring requirements...',
  '保存修改': 'Save Changes',
  '确认下达任务': 'Confirm Task Order',
  '如：充血性心力衰竭，COPD...': 'e.g., Congestive Heart Failure, COPD...',
  '包含药物名称及剂量...': 'Include drug names and dosages...',
  '详述睡眠相关症状（限500字）...': 'Detail sleep-related symptoms (max 500 chars)...',

  // Auth / Permissions
  '高级操作验证': 'Advanced Operation Verification',
  '即将执行：': 'About to execute: ',
  '。该操作可能影响医疗记录，请输入密码确认：': '. This operation may affect medical records, please enter password to confirm:',
  '测试密码: admin': 'Test Password: admin',
  '确认验证': 'Verify',
  '修改记录参数': 'Edit record parameters',
  '永久删除监测记录': 'Permanently delete record',
  '编辑患者资料': 'Edit patient info',
  '修改患者敏感资料': 'Edit sensitive patient info',
  '删除患者所有档案及任务': 'Delete all patient records and tasks',

  // Module Console
  '返回列表': 'Back to List',
  '监测模式': 'Monitoring Mode',
  '查看相关文书': 'View Related Documents',
  '主工作区': 'Main Workspace',
  '视图说明': 'View Description',
  '此处显示图谱信号、数据分析或报表预览等核心内容。': 'Displays waveform signals, data analysis, or report previews.',
  '核心功能将在此显示': 'Core functions will be displayed here',
  '操作面板': 'Control Panel',
  '快捷操作': 'Quick Actions',
  '自动分析': 'Auto Analyze',
  '伪差剔除': 'Artifact Removal',
  '睡眠分期': 'Sleep Staging',
  '事件审查': 'Event Review',
  '未载入档案': 'No record loaded',

  // Error Messages
  '密码错误，请重试': 'Incorrect password, please try again',
  '请完整填写所有带有 * 号的必填项': 'Please fill in all mandatory fields marked with *',
  '姓名超出限制（最大100个字符）': 'Name exceeds limit (max 100 chars)',
  '住院号超出限制（最大30位字符）': 'Hospital ID exceeds limit (max 30 chars)',
  '日期格式超长，请按照YYYY-MM-DD格式输入': 'Date format error, please use YYYY-MM-DD',
  '联系电话只能输入整数': 'Phone must be numeric',
  '联系电话超出限制（最大20位整数）': 'Phone exceeds limit (max 20 digits)',
  '主治医师超出限制（最大10个字符）': 'Doctor name exceeds limit (max 10 chars)',
  '只能输入数字和小数点': 'Must be numeric (decimals allowed)',
  '数值超出限制（最多允许4位数字）': 'Value exceeds limit (max 4 digits)',
  '颈围只能输入整数': 'Neck circumference must be numeric',
  '颈围超出限制（最大3位数）': 'Neck circumference exceeds limit (max 3 digits)',

  // Rules & Tooltips
  '标准未定': 'Standard Undetermined',
  '适用 AASM 3.0 儿童标准': 'Applicable AASM 3.0 Child Standard',
  '适用 AASM 3.0 成人标准': 'Applicable AASM 3.0 Adult Standard',
  'AASM 3.0 判读规则界限': 'AASM 3.0 Scoring Rule Boundary',
  '系统会根据出生日期自动计算年龄。年龄小于18岁将自动适配 AASM 3.0 儿童判读规则；大于等于18岁适配成人规则。': 'Age is calculated automatically from DOB. <18 years applies Child rules; >=18 years applies Adult rules.',
  '高危指标': 'High Risk Indicator',
  '临床上 BMI>30 视为阻塞性睡眠呼吸暂停(OSA)的强相关体征。': 'Clinically, BMI > 30 is a strong correlate for OSA.',
  'Epworth 嗜睡量表': 'Epworth Sleepiness Scale',
  '评估日间过度嗜睡情况，大于10分提示存在临床意义的嗜睡。': 'Assesses daytime sleepiness, >10 indicates clinically significant sleepiness.',
  '匹兹堡睡眠质量指数': 'Pittsburgh Sleep Quality Index',
  '评估主观睡眠质量。': 'Assesses subjective sleep quality.',
  '失眠严重度指数': 'Insomnia Severity Index',
  '临床评估失眠障碍严重程度的标准化问卷。': 'Standard questionnaire for insomnia severity.',
  'OSA 筛查问卷': 'OSA Screening Questionnaire',
  '快速筛查阻塞性睡眠呼吸暂停的高风险人群，≥3分提示中高危。': 'Screening for OSA risk, >=3 indicates moderate/high risk.',
  '临床关联提示': 'Clinical Correlation Hint',
  '记录可能影响睡眠结构或呼吸事件判读的系统性疾病，如 COPD、神经肌肉疾病、心力衰竭等。': 'Record conditions affecting sleep architecture (e.g. COPD, neuromuscular disease).',
  '影响睡眠结构的用药': 'Medications Affecting Sleep',
  '记录如苯二氮卓类、抗抑郁药、镇静剂等。此类药物可能显著改变微架构(如纺锤波增加或REM潜伏期延长)。': 'Record meds like benzos/antidepressants, which significantly alter microarchitecture.',
  
  // AASM Rules Difference Modal
  'AASM 3.0 儿童与成人判读标准主要差异': 'Key Differences: Pediatric vs. Adult AASM 3.0 Scoring',
  '1. 呼吸事件持续时间': '1. Respiratory Event Duration',
  '成人需≥10秒；儿童仅需≥2个正常呼吸周期。': 'Adults ≥ 10 seconds; Children ≥ 2 baseline breaths.',
  '2. 中枢性呼吸暂停': '2. Central Apnea',
  '儿童规则更为严格，通常持续>20秒，或持续>2个呼吸周期且伴有觉醒、觉醒反应或血氧下降≥3%（或心动过缓）。': 'Stricter in children: typically >20s, or >2 breaths associated with arousal, awakening, or ≥3% desaturation (or bradycardia).',
  '3. 睡眠分期与脑电图': '3. Sleep Staging & EEG',
  '儿童及婴幼儿的脑电波幅通常更高，且慢波睡眠（N3期）标准以及睡眠纺锤波的发育评估与成人有显著不同。': 'Higher EEG amplitude in children/infants. Criteria for slow-wave sleep (N3) and sleep spindle evaluation differ significantly from adults.',
  '知道了': 'Got it'
};

const I18nContext = React.createContext({ t: (k) => k, lang: 'zh' });
const useI18n = () => React.useContext(I18nContext);


// ############################################################################
// # 2. 工具、常量定义与全局样式
// ############################################################################

const GlobalStyles = () => (
  <style dangerouslySetInnerHTML={{ __html: `
    .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 4px; }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: #94a3b8; }
    
    .light-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
    .light-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .light-scrollbar::-webkit-scrollbar-thumb { background-color: #e2e8f0; border-radius: 4px; }
    .light-scrollbar::-webkit-scrollbar-thumb:hover { background-color: #cbd5e1; }
    
    body { background-color: #f1f5f9; margin: 0; padding: 0; overflow: hidden; }

    .medical-grid {
      background-size: 40px 40px;
      background-image: 
        linear-gradient(to right, rgba(226, 232, 240, 0.3) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(226, 232, 240, 0.3) 1px, transparent 1px);
    }
  `}} />
);

const generateId = (prefix) => `${prefix}${Math.floor(Math.random()*10000).toString().padStart(4, '0')}`;

const calcBMI = (h, w) => {
  if (h && w && !isNaN(h) && !isNaN(w)) {
    const heightInMeters = parseFloat(h) / 100;
    if (heightInMeters > 0) return (parseFloat(w) / (heightInMeters * heightInMeters)).toFixed(1);
  }
  return '--';
};

const calcAge = (dob) => {
  if (!dob) return '--';
  const birthDate = new Date(dob);
  if (isNaN(birthDate)) return '--';
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
  return age;
};

const getAASMRule = (age, t) => {
  if (age === '--') return { label: t('标准未定'), color: 'bg-slate-100 text-slate-500' };
  return age < 18 
    ? { label: t('适用 AASM 3.0 儿童标准'), color: 'bg-purple-100 text-purple-700 border-purple-200' }
    : { label: t('适用 AASM 3.0 成人标准'), color: 'bg-indigo-100 text-indigo-700 border-indigo-200' };
};

const INITIAL_DB = {
  patients: [
    { id: "P-2026001", hospitalId: "IP-88201", name: "张伟", gender: "男", dob: "1981-05-12", phone: "13800138000", height: 175, weight: 88, neck: 43, ess: 14, psqi: 9, isi: 12, stopBang: 5, comorbidities: "高血压3年", medications: "硝苯地平控释片", history: "夜间打鼾伴憋气5年，晨起口干头痛。", doctor: "李建国", createdDate: "2026-02-18" },
    { id: "P-2026010", hospitalId: "IP-88205", name: "王小明", gender: "男", dob: "2010-08-20", phone: "13811112222", height: 165, weight: 55, neck: 34, ess: 18, psqi: 5, isi: 6, stopBang: 1, comorbidities: "无", medications: "无", history: "上课时不可抗拒嗜睡2年，伴情绪激动时面部肌肉无力猝倒。否认家族史。", doctor: "张海燕", createdDate: "2026-02-20" },
    { id: "P-2026011", hospitalId: "IP-88208", name: "李司机", gender: "男", dob: "1991-11-03", phone: "13833334444", height: 172, weight: 95, neck: 45, ess: 11, psqi: 7, isi: 8, stopBang: 6, comorbidities: "2型糖尿病", medications: "二甲双胍", history: "职业司机，严重打鼾。自诉近期疲劳驾驶频发，存在公共安全隐患。", doctor: "刘医师", createdDate: "2026-02-20" },
    { id: "P-2026006", hospitalId: "IP-88190", name: "王丽华", gender: "女", dob: "1974-02-28", phone: "13988887777", height: 158, weight: 65, neck: 38, ess: 6, psqi: 16, isi: 21, stopBang: 3, comorbidities: "广泛性焦虑障碍", medications: "氯硝西泮 1mg qn", history: "入睡困难，早醒，每晚睡眠不足4小时。严重依赖安眠药。", doctor: "Dr. Smith", createdDate: "2026-02-17" },
  ],
  tasks: [
    { id: "T-0001", patientId: "P-2026001", type: "PSG", status: "Recording", bed: "01", admissionDate: "2026-02-18", tech: "王技师", note: "首夜常规监测" },
    { id: "T-0002", patientId: "P-2026010", type: "MSLT", status: "Scheduled", bed: "02", admissionDate: "2026-02-20", tech: "李技师", note: "发作性睡病疑诊，注意记录REM潜伏期" },
    { id: "T-0003", patientId: "P-2026011", type: "Titration", status: "Pending", bed: "03", admissionDate: "2026-02-20", tech: "王技师", note: "CPAP人工滴定，消除所有呼吸事件" },
    { id: "T-0004", patientId: "P-2026001", type: "Split-Night", status: "Pending", bed: "01", admissionDate: "2026-02-19", tech: "王技师", note: "前半夜重度OSA则直接转滴定" },
  ]
};

// ==========================================
// 帮助提示组件
// ==========================================
const HelpTooltip = ({ title, content }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0, transform: '', arrowClass: '' });
  const triggerRef = useRef(null);

  const updatePosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const isTop = rect.top < window.innerHeight / 2;
    const isLeft = rect.left < window.innerWidth / 2;
    let top = 0, left = 0, transform = "", arrowClass = "";

    if (isTop && isLeft) { top = rect.bottom + 8; left = rect.left; transform = "translate(0, 0)"; arrowClass = "bottom-full left-2 border-b-slate-800"; } 
    else if (isTop && !isLeft) { top = rect.bottom + 8; left = rect.right; transform = "translate(-100%, 0)"; arrowClass = "bottom-full right-2 border-b-slate-800"; } 
    else if (!isTop && isLeft) { top = rect.top - 8; left = rect.left; transform = "translate(0, -100%)"; arrowClass = "top-full left-2 border-t-slate-800"; } 
    else { top = rect.top - 8; left = rect.right; transform = "translate(-100%, -100%)"; arrowClass = "top-full right-2 border-t-slate-800"; }
    setPos({ top, left, transform, arrowClass });
  };

  return (
    <>
      <div 
        ref={triggerRef}
        className="inline-flex items-center justify-center ml-1.5 cursor-help opacity-50 hover:opacity-100 transition-opacity align-middle"
        onMouseEnter={() => { updatePosition(); setIsVisible(true); }}
        onMouseLeave={() => setIsVisible(false)}
      >
        <HelpCircle size={12} className="text-slate-500 hover:text-slate-700" />
      </div>
      {isVisible && typeof document !== 'undefined' && createPortal(
        <div className="fixed z-[99999] pointer-events-none animate-in fade-in zoom-in-95 duration-150" style={{ top: pos.top, left: pos.left, transform: pos.transform }}>
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
// # 3. 通用 UI 组件与高级鉴权弹窗
// ############################################################################

const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
  if (!isOpen) return null;
  const maxWidth = size === 'lg' ? 'max-w-4xl' : size === 'xl' ? 'max-w-5xl' : 'max-w-md'; 
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-[2px] p-4 animate-in fade-in duration-200">
      <div className={`bg-white border border-slate-200 rounded-xl w-full ${maxWidth} shadow-2xl flex flex-col max-h-[90vh]`}>
        <div className="flex justify-between items-center p-3 border-b border-slate-200 bg-slate-50 rounded-t-xl shrink-0">
          <h3 className="text-xs font-bold text-slate-800 flex items-center gap-2">
             <div className="w-1 h-3 bg-blue-600 rounded-full"/> {title}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-800 transition-colors p-1 rounded hover:bg-slate-200"><X size={14} /></button>
        </div>
        <div className="p-4 overflow-y-auto light-scrollbar">{children}</div>
      </div>
    </div>
  );
};

const CustomConfirmDialog = ({ isOpen, message, onConfirm, onCancel }) => {
    const { t } = useI18n();
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-[2px] p-4 animate-in fade-in duration-200">
            <div className={`bg-white border border-slate-200 rounded-xl w-full max-w-sm shadow-2xl overflow-hidden`}>
                <div className="p-5 flex items-start gap-4">
                    <div className={`p-2 rounded-full bg-amber-50 border border-amber-100 shrink-0`}>
                        <AlertTriangle className="text-amber-600" size={20}/>
                    </div>
                    <div className={`text-slate-800 text-sm font-medium leading-relaxed mt-0.5`}>{message}</div>
                </div>
                <div className={`bg-slate-50 border-t border-slate-200 px-5 py-3 flex justify-end gap-3`}>
                    <button onClick={onCancel} className={`px-4 py-2 rounded-lg font-bold text-[11px] text-slate-600 hover:text-slate-900 hover:bg-slate-200 bg-white border border-slate-300 transition-colors`}>{t('取消')}</button>
                    <button onClick={onConfirm} className="px-4 py-2 rounded-lg font-bold text-[11px] bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-sm">{t('确定')}</button>
                </div>
            </div>
        </div>
    );
};

const AdminAuthDialog = ({ isOpen, actionName, onClose, onSuccess }) => {
    const { t } = useI18n();
    const [pwd, setPwd] = useState('');
    const [err, setErr] = useState('');
    
    useEffect(() => { if(isOpen) { setPwd(''); setErr(''); } }, [isOpen]);
    const handleSubmit = () => { if (pwd === 'admin') onSuccess(); else setErr('密码错误，请重试'); };

    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-200">
                <div className="bg-slate-800 p-3 flex items-center justify-between">
                    <h3 className="text-white font-bold text-[11px] flex items-center gap-2"><ShieldAlert size={14} className="text-amber-400"/> {t('高级操作验证')}</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors"><X size={14}/></button>
                </div>
                <div className="p-5">
                    <p className="text-[11px] text-slate-700 font-medium mb-4 leading-relaxed">
                        {t('即将执行：')}<span className="font-bold text-blue-600 px-1 border-b border-blue-200">{t(actionName)}</span>{t('。该操作可能影响医疗记录，请输入密码确认：')}
                    </p>
                    <input type="password" autoFocus value={pwd} onChange={e=>setPwd(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSubmit()} className={`w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/20 font-mono text-center tracking-[0.3em] text-sm bg-slate-50 shadow-inner transition-colors ${err ? 'border-red-400 focus:border-red-500' : 'border-slate-300 focus:border-blue-500'}`} placeholder="••••••" />
                    <div className="h-4 mt-2">
                        {err ? <p className="text-[10px] text-red-500 font-bold text-center animate-pulse">{t(err)}</p> : <p className="text-[9px] text-slate-400 text-center font-mono">{t('测试密码: admin')}</p>}
                    </div>
                </div>
                <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 rounded-md text-[11px] font-bold text-slate-600 border border-slate-300 bg-white hover:bg-slate-100 transition-colors">{t('取消')}</button>
                    <button onClick={handleSubmit} className="px-4 py-2 rounded-md text-[11px] font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-colors flex items-center gap-1.5"><Lock size={12}/> {t('确认验证')}</button>
                </div>
            </div>
        </div>
    )
};

const StatusBadge = ({ status }) => {
  const { t } = useI18n();
  const config = {
    'Scheduled': { color: 'bg-slate-100 text-slate-700 border-slate-200', label: t('待监测') },
    'Recording': { color: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: t('监测中'), dot: true },
    'Pending': { color: 'bg-orange-50 text-orange-700 border-orange-200', label: t('待判读') },
    'Reported': { color: 'bg-blue-50 text-blue-700 border-blue-200', label: t('已出报告') },
  };
  const c = config[status] || { color: 'bg-slate-50 text-slate-600 border-slate-200', label: status };
  return (
      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border inline-flex items-center gap-1 shadow-sm ${c.color}`}>
          {c.dot && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"/>}
          {c.label}
      </span>
  );
};

const TaskFormModal = ({ isOpen, onClose, onSave, initialData, isEdit }) => {
    const { t } = useI18n();
    const [form, setForm] = useState(initialData || { type: 'PSG', bed: '', tech: '', note: '' });
    
    useEffect(() => {
        if(isOpen) setForm(initialData || { type: 'PSG', bed: '', tech: '', note: '' });
    }, [isOpen, initialData]);

    if (!isOpen) return null;
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? t('修改临床监测任务') : t('创建临床监测任务')} size="md">
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1.5">{t('标准监测模式设置 (AASM)')}</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { id: 'PSG', label: '整夜多导睡眠监测 (PSG)' },
                    { id: 'Split-Night', label: '分夜监测 (Split-Night)' },
                    { id: 'Titration', label: '压力滴定 (CPAP/NIV)' },
                    { id: 'MSLT', label: '多次睡眠潜伏期测试 (MSLT)' },
                    { id: 'MWT', label: '清醒维持测试 (MWT)' }
                  ].map(item => (
                    <button key={item.id} onClick={() => setForm({...form, type: item.id})} className={`py-2 rounded-md text-[10px] font-bold transition-all border ${form.type === item.id ? 'bg-blue-50 text-blue-700 border-blue-500 shadow-sm' : 'bg-white text-slate-600 hover:bg-slate-50 border-slate-200'}`}>
                      {t(item.label)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-[10px] font-bold text-slate-500 mb-1">{t('床位号')}</label><input className="w-full bg-white border border-slate-200 rounded-md px-2.5 py-1.5 text-[11px] outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 font-mono shadow-sm" placeholder={t('例: 01')} value={form.bed || ''} onChange={e=>setForm({...form, bed: e.target.value})}/></div>
                <div><label className="block text-[10px] font-bold text-slate-500 mb-1">{t('操作技师')}</label><input className="w-full bg-white border border-slate-200 rounded-md px-2.5 py-1.5 text-[11px] outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 shadow-sm font-bold" value={form.tech || ''} onChange={e=>setForm({...form, tech: e.target.value})}/></div>
                <div className="col-span-2"><label className="block text-[10px] font-bold text-slate-500 mb-1">{t('临床备注 / 医嘱')}</label><input className="w-full bg-white border border-slate-200 rounded-md px-2.5 py-1.5 text-[11px] outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 shadow-sm" placeholder={t('附加特殊医嘱或监测要求...')} value={form.note || ''} onChange={e=>setForm({...form, note: e.target.value})}/></div>
              </div>
              <div className="pt-3 flex justify-end gap-2 mt-2 border-t border-slate-100">
                <button onClick={onClose} className="px-4 py-1.5 rounded-md font-bold text-[11px] text-slate-600 hover:bg-slate-100 border border-slate-200 bg-white">{t('取消')}</button>
                <button onClick={() => onSave(form)} className="px-4 py-1.5 rounded-md font-bold text-[11px] bg-blue-600 text-white hover:bg-blue-700 shadow-sm">{isEdit ? t('保存修改') : t('确认下达任务')}</button>
              </div>
            </div>
        </Modal>
    );
};

// ############################################################################
// # 4. 工作台模块骨架 (供功能模块复用)
// ############################################################################

const ModuleConsole = ({ moduleName, taskData, onBack }) => {
  const { t } = useI18n();
  const displayTask = taskData || { id: '--', type: '--', patient: { name: t('未载入档案'), hospitalId: '--' } };
  
  return (
    <div className="h-full flex flex-col bg-slate-100 relative z-0 text-[11px]">
      <div className="h-[48px] border-b border-slate-300 bg-white shrink-0 z-30 shadow-sm flex items-center justify-between px-4 relative gap-4">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-1 bg-white border border-slate-200 hover:bg-slate-100 rounded text-slate-600 transition-colors shadow-sm" title={t('返回列表')}><ArrowLeft size={14}/></button>
          <div className="w-px h-5 bg-slate-200"/>
          <div className="flex flex-col justify-center ml-1">
              <span className="font-bold text-xs text-slate-800 flex items-center gap-1.5 leading-none">{t(moduleName)}</span>
              <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-600">
                  <span>{t('姓名')}: <span className="font-bold">{displayTask.patient.name}</span></span>
                  <span className="text-slate-300">|</span>
                  <span>{t('住院号')}: <span className="font-bold font-mono">{displayTask.patient.hospitalId}</span></span>
                  <span className="text-slate-300">|</span>
                  <span>{t('监测模式')}: <span className="font-bold">{displayTask.type}</span></span>
                  <span className="text-slate-300">|</span>
                  <span>{t('记录编号')}: <span className="font-bold font-mono text-slate-400">{displayTask.id}</span></span>
              </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-3 py-1.5 bg-white border border-slate-200 rounded-md text-[11px] font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-1.5 shadow-sm"><FileText size={12}/> {t('查看相关文书')}</button>
        </div>
      </div>
      <div className="flex-1 flex overflow-hidden min-h-0 p-1.5 gap-1.5 relative z-10">
        <div className="flex-1 bg-white border border-slate-300 rounded-md shadow-sm relative flex flex-col min-w-0 overflow-hidden">
          <div className="h-[32px] bg-slate-50 border-b border-slate-200 flex items-center justify-between px-3 shrink-0 z-30 relative">
             <div className="flex items-center">
                 <Activity size={12} className="text-slate-600 mr-2"/>
                 <span className="text-[10px] font-bold text-slate-700 tracking-wide flex items-center">
                    {t('主工作区')}
                    <HelpTooltip title={t('视图说明')} content={t('此处显示图谱信号、数据分析或报表预览等核心内容。')} />
                 </span>
             </div>
          </div>
          <div className="flex-1 overflow-auto p-4 flex flex-col items-center justify-center text-slate-400 medical-grid">
              <Monitor size={48} className="opacity-20 mb-3" strokeWidth={1}/>
              <p className="text-xs font-medium">[{t(moduleName)}] {t('核心功能将在此显示')}</p>
          </div>
        </div>
        <div className="w-[280px] xl:w-[320px] h-full flex flex-col bg-white border border-slate-300 rounded-md shadow-sm overflow-hidden shrink-0">
          <div className="h-[32px] bg-slate-50 border-b border-slate-200 flex items-center justify-between px-3 shrink-0 z-30 relative">
             <div className="flex items-center"><Settings size={12} className="text-slate-600 mr-2"/><span className="text-[10px] font-bold text-slate-700 tracking-wide">{t('操作面板')}</span></div>
          </div>
          <div className="flex-1 p-4 flex flex-col gap-3 overflow-y-auto light-scrollbar">
              <div className="p-3 border border-slate-200 rounded-md bg-slate-50/50">
                  <div className="text-[10px] font-bold text-slate-700 mb-2 border-b border-slate-200 pb-1">{t('快捷操作')}</div>
                  <div className="grid grid-cols-2 gap-2">
                      <button className="py-1.5 bg-white border border-slate-200 rounded text-[10px] font-medium hover:border-blue-300 hover:text-blue-600 transition-colors">{t('自动分析')}</button>
                      <button className="py-1.5 bg-white border border-slate-200 rounded text-[10px] font-medium hover:border-blue-300 hover:text-blue-600 transition-colors">{t('伪差剔除')}</button>
                      <button className="py-1.5 bg-white border border-slate-200 rounded text-[10px] font-medium hover:border-blue-300 hover:text-blue-600 transition-colors">{t('睡眠分期')}</button>
                      <button className="py-1.5 bg-white border border-slate-200 rounded text-[10px] font-medium hover:border-blue-300 hover:text-blue-600 transition-colors">{t('事件审查')}</button>
                  </div>
              </div>
          </div>
        </div>
      </div>
    </div>
  );
};


// ############################################################################
// # 5. 核心业务模块：病患管理库 (Patient & Task Manager)
// ############################################################################

const PatientManager = ({ patients, setPatients, tasks, setTasks, onSelectTask, requireAdminAuth }) => {
  const { t } = useI18n();
  const [viewMode, setViewMode] = useState('list');
  const [activePatient, setActivePatient] = useState(null);
  
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [patientForm, setPatientForm] = useState({ gender: '男' });
  const [editingPatient, setEditingPatient] = useState(null); 
  const [formError, setFormError] = useState('');

  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null); 

  const [showAasmInfo, setShowAasmInfo] = useState(false);

  const [searchQ, setSearchQ] = useState("");

  const [confirmState, setConfirmState] = useState({ isOpen: false, message: '', action: null });
  const handleConfirm = () => { if (confirmState.action) confirmState.action(); setConfirmState({ isOpen: false, message: '', action: null }); };

  const closePatientModal = () => { setShowPatientModal(false); setEditingPatient(null); setPatientForm({ gender: '男' }); setFormError(''); };
  const closeTaskModal = () => { setShowTaskModal(false); setEditingTask(null); };

  const handleFieldChange = (field, value) => {
    let errorMsg = '';
    let isValid = true;

    switch(field) {
      case 'name': if (value.length > 100) { isValid = false; errorMsg = '姓名超出限制（最大100个字符）'; } break;
      case 'hospitalId': if (value.length > 30) { isValid = false; errorMsg = '住院号超出限制（最大30位字符）'; } break;
      case 'dob': 
        if (value && value.length > 10) { isValid = false; errorMsg = '日期格式超长，请按照YYYY-MM-DD格式输入'; } break;
      case 'phone':
        if (value && !/^\d*$/.test(value)) { isValid = false; errorMsg = '联系电话只能输入整数'; }
        else if (value.length > 20) { isValid = false; errorMsg = '联系电话超出限制（最大20位整数）'; } break;
      case 'doctor': if (value.length > 10) { isValid = false; errorMsg = '主治医师超出限制（最大10个字符）'; } break;
      case 'height':
      case 'weight':
        if (value) {
          if (!/^\d*\.?\d*$/.test(value)) { isValid = false; errorMsg = '只能输入数字和小数点'; } 
          else {
            const digitCount = value.replace('.', '').length;
            if (digitCount > 4) { isValid = false; errorMsg = '数值超出限制（最多允许4位数字）'; }
          }
        }
        break;
      case 'neck':
        if (value && !/^\d*$/.test(value)) { isValid = false; errorMsg = '颈围只能输入整数'; }
        else if (value.length > 3) { isValid = false; errorMsg = '颈围超出限制（最大3位数）'; } break;
      default: break;
    }

    if (isValid) {
      setPatientForm(prev => ({ ...prev, [field]: value }));
      setFormError(''); 
    } else { setFormError(errorMsg); }
  };

  const handleSavePatient = () => {
    // 必填项校验保护（含 DOB 取代年龄）
    if (!patientForm.name || !patientForm.dob || !patientForm.gender || !patientForm.weight || !patientForm.phone || !patientForm.hospitalId) {
      setFormError('请完整填写所有带有 * 号的必填项'); return;
    }
    setFormError('');
    if (editingPatient) {
      const updated = { ...editingPatient, ...patientForm };
      setPatients(patients.map(p => p.id === editingPatient.id ? updated : p));
      if (activePatient?.id === editingPatient.id) setActivePatient(updated); 
    } else {
      const newPatient = { id: generateId('P-'), createdDate: new Date().toISOString().split('T')[0], ...patientForm };
      setPatients([newPatient, ...patients]);
    }
    closePatientModal();
  };

  const handleEditPatient = (p, e) => {
    if(e) e.stopPropagation(); setEditingPatient(p); setPatientForm(p); setShowPatientModal(true);
  };

  const handleDeletePatient = (p, e) => {
    if(e) e.stopPropagation();
    requireAdminAuth(`${t('删除患者所有档案及任务')} [${p.name}]`, () => {
      setPatients(patients.filter(x => x.id !== p.id)); setTasks(tasks.filter(t => t.patientId !== p.id));
      if(activePatient?.id === p.id) setViewMode('list');
    });
  };

  const handleSaveTask = (form) => {
    if (editingTask) { setTasks(tasks.map(task => task.id === editingTask.id ? { ...task, ...form } : task)); } 
    else {
      const newTask = {
        id: generateId('T-'), patientId: activePatient.id, status: 'Scheduled',
        admissionDate: new Date().toISOString().split('T')[0], tech: form.tech || '操作员', ...form
      };
      setTasks([newTask, ...tasks]);
    }
    setShowTaskModal(false); setEditingTask(null);
  };

  const handleDeleteTask = (task, e) => {
    if(e) e.stopPropagation(); requireAdminAuth(`${t('永久删除监测记录')} [${task.id}]`, () => { setTasks(tasks.filter(x => x.id !== task.id)); });
  };

  const openDetail = (patient) => { setActivePatient(patient); setViewMode('detail'); };

  const patientTasks = useMemo(() => {
    if(!activePatient) return []; return tasks.filter(task => task.patientId === activePatient.id);
  }, [tasks, activePatient]);

  const lowerQ = searchQ.trim().toLowerCase();
  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(lowerQ) || 
    p.hospitalId?.toLowerCase().includes(lowerQ) || 
    (p.phone && p.phone.includes(lowerQ))
  );

  return (
    <div className="h-full flex flex-col bg-slate-100 p-2 gap-2 relative text-[11px]">
      <CustomConfirmDialog isOpen={confirmState.isOpen} message={confirmState.message} onConfirm={handleConfirm} onCancel={() => setConfirmState({ isOpen: false, message: '', action: null })} />

      {viewMode === 'detail' && activePatient ? (
        <>
          <div className="bg-white border border-slate-200 shadow-sm rounded-md px-4 py-2 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                  <button onClick={() => setViewMode('list')} className="p-1.5 bg-white border border-slate-200 hover:bg-slate-100 rounded-md transition-colors shadow-sm"><ArrowLeft size={14} className="text-slate-600"/></button>
                  <h2 className="text-xs font-bold text-slate-800">{t('患者临床档案明细')}</h2>
              </div>
              <button onClick={(e) => requireAdminAuth(`${t('修改患者敏感资料')} [${activePatient.name}]`, () => handleEditPatient(activePatient, e))} className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-md font-bold text-[11px] transition-all active:scale-95 flex items-center gap-1.5 shadow-sm"><Edit2 size={12}/> {t('编辑资料')}</button>
          </div>

          <div className="bg-white p-4 rounded-md border border-slate-200 flex items-start gap-5 shrink-0 shadow-sm relative overflow-hidden">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-md flex items-center justify-center shrink-0 border border-blue-100 z-10">
                  <UserPlus size={20}/>
              </div>
              <div className="flex-1 grid grid-cols-6 gap-y-3 gap-x-4 z-10">
                  <div><div className="text-[10px] font-bold text-slate-400 mb-0.5">{t('姓名')}</div><div className="font-bold text-[13px] text-slate-800">{activePatient.name}</div></div>
                  <div><div className="text-[10px] font-bold text-slate-400 mb-0.5">{t('住院号')}</div><div className="font-mono text-[11px] font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded w-max border border-slate-200">{activePatient.hospitalId || '--'}</div></div>
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 mb-0.5 flex items-center gap-1">
                      {t('性别 / 年龄')} 
                      <HelpTooltip title={t('AASM 3.0 判读规则界限')} content={t('系统会根据出生日期自动计算年龄。年龄小于18岁将自动适配 AASM 3.0 儿童判读规则；大于等于18岁适配成人规则。')} />
                    </div>
                    <div className="text-[11px] font-bold text-slate-700 flex items-center gap-2">
                      {t(activePatient.gender)} / {calcAge(activePatient.dob)} {t('岁')}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 mb-0.5 flex items-center gap-1">
                      {t('适用AASM标准')} 
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {calcAge(activePatient.dob) < 18 && calcAge(activePatient.dob) !== '--' && (
                          <BadgeAlert 
                              size={16} 
                              className="text-purple-600 cursor-pointer hover:scale-110 transition-transform drop-shadow-sm" 
                              onClick={() => setShowAasmInfo(true)}
                              title={t('AASM 3.0 儿童与成人判读标准主要差异')}
                          />
                      )}
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${getAASMRule(calcAge(activePatient.dob), t).color}`}>
                        {getAASMRule(calcAge(activePatient.dob), t).label}
                      </span>
                    </div>
                  </div>
                  <div><div className="text-[10px] font-bold text-slate-400 mb-0.5">{t('主治医师')}</div><div className="text-[11px] font-bold text-slate-700">{activePatient.doctor || '--'}</div></div>
                  <div><div className="text-[10px] font-bold text-slate-400 mb-0.5">{t('联系电话')}</div><div className="font-mono text-[11px] font-bold text-slate-700">{activePatient.phone || '--'}</div></div>
                  
                  <div><div className="text-[10px] font-bold text-slate-400 mb-0.5">{t('身高 / 体重')}</div><div className="text-[11px] font-bold text-slate-700">{activePatient.height ? `${activePatient.height} cm` : '--'} / {activePatient.weight ? `${activePatient.weight} kg` : '--'}</div></div>
                  <div><div className="text-[10px] font-bold text-slate-400 mb-0.5">{t('BMI / 颈围')}</div><div className="font-mono text-[11px] font-bold text-slate-700">{calcBMI(activePatient.height, activePatient.weight)} / {activePatient.neck ? `${activePatient.neck} cm` : '--'}</div></div>
                  <div><div className="text-[10px] font-bold text-slate-400 mb-0.5">{t('ESS / PSQI')}</div><div className="text-[11px] font-bold text-slate-700">{activePatient.ess ?? '--'} / {activePatient.psqi ?? '--'}</div></div>
                  <div><div className="text-[10px] font-bold text-slate-400 mb-0.5">{t('ISI / STOP-Bang')}</div><div className="text-[11px] font-bold text-slate-700">{activePatient.isi ?? '--'} / {activePatient.stopBang ?? '--'}</div></div>
                  <div className="col-span-2"><div className="text-[10px] font-bold text-slate-400 mb-0.5">{t('建档日期')}</div><div className="text-[11px] font-bold text-slate-700">{activePatient.createdDate}</div></div>
                  
                  <div className="col-span-2"><div className="text-[10px] font-bold text-slate-400 mb-0.5">{t('合并症')}</div><div className="text-[11px] font-bold text-slate-700 truncate text-red-700 bg-red-50 px-1 py-0.5 rounded max-w-max" title={activePatient.comorbidities}>{activePatient.comorbidities || t('无特殊记录')}</div></div>
                  <div className="col-span-4"><div className="text-[10px] font-bold text-slate-400 mb-0.5">{t('现用药史')}</div><div className="text-[11px] font-bold text-slate-700 truncate bg-slate-100 px-1 py-0.5 rounded max-w-max" title={activePatient.medications}>{activePatient.medications || t('未提供用药信息')}</div></div>
                  <div className="col-span-6"><div className="text-[10px] font-bold text-slate-400 mb-0.5">{t('简要病史')}</div><div className="text-[11px] font-bold text-slate-700 truncate" title={activePatient.history}>{activePatient.history || '--'}</div></div>
              </div>
              <Activity className="absolute -right-4 -bottom-4 text-slate-50 opacity-40 z-0 pointer-events-none" size={120} strokeWidth={3}/>
          </div>

          <div className="flex-1 flex flex-col min-h-0 bg-white rounded-md border border-slate-200 overflow-hidden shadow-sm">
              <div className="px-4 py-2 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                  <h3 className="font-bold text-slate-700 text-[11px] flex items-center gap-1.5">
                    <ClipboardList size={14} className="text-blue-600"/> 
                    {t('临床监测任务及报告')} ({patientTasks.length})
                    <HelpTooltip title={t('任务说明')} content={t('管理该患者的所有多导睡眠监测(PSG)及日间试验。在此新建任务，或进入工作台实施采集及判读操作。')} />
                  </h3>
                  <button onClick={() => { setEditingTask(null); setShowTaskModal(true); }} className="px-3 py-1.5 rounded-md font-bold text-[10px] transition-all active:scale-95 flex items-center gap-1 bg-blue-600 text-white hover:bg-blue-700 shadow-sm">
                      <Plus size={12} strokeWidth={2}/> {t('新建监测任务')}
                  </button>
              </div>
              <div className="overflow-y-auto flex-1 light-scrollbar">
                  {patientTasks.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs">
                          <Clipboard size={24} className="mb-2 opacity-30"/>
                          <p>{t('暂无关联的临床监测记录')}</p>
                      </div>
                  ) : (
                      <table className="w-full text-left border-collapse">
                          <thead className="bg-white sticky top-0 z-10 border-b border-slate-200 shadow-sm">
                              <tr>
                                  <th className="px-4 py-2.5 text-[10px] font-bold text-slate-500 font-mono w-28 whitespace-nowrap">{t('记录编号')}</th>
                                  <th className="px-4 py-2.5 text-[10px] font-bold text-slate-500 whitespace-nowrap">{t('模式')}</th>
                                  <th className="px-4 py-2.5 text-[10px] font-bold text-slate-500 whitespace-nowrap">{t('病床')}</th>
                                  <th className="px-4 py-2.5 text-[10px] font-bold text-slate-500 whitespace-nowrap">{t('状态')}</th>
                                  <th className="px-4 py-2.5 text-[10px] font-bold text-slate-500 whitespace-nowrap">{t('记录日期')}</th>
                                  <th className="px-4 py-2.5 text-[10px] font-bold text-slate-500 text-right whitespace-nowrap">{t('操作')}</th>
                              </tr>
                          </thead>
                          <tbody>
                              {patientTasks.map((taskItem) => (
                                  <tr key={taskItem.id} className="group transition-colors hover:bg-blue-50/50 border-b border-slate-100 last:border-0">
                                      <td className="px-4 py-3 font-mono font-bold text-slate-600 text-[11px]">{taskItem.id}</td>
                                      <td className="px-4 py-3"><span className="px-2 py-0.5 rounded text-[10px] font-bold border border-slate-200 bg-slate-50 text-slate-700">{taskItem.type}</span></td>
                                      <td className="px-4 py-3">{taskItem.bed ? <span className="font-mono font-bold text-slate-700 text-[10px]">BED-{taskItem.bed}</span> : '--'}</td>
                                      <td className="px-4 py-3"><StatusBadge status={taskItem.status}/></td>
                                      <td className="px-4 py-3 text-slate-500 text-[10px] font-medium">{taskItem.admissionDate}</td>
                                      <td className="px-4 py-3 text-right">
                                          <div className="flex items-center justify-end gap-1.5">
                                              <button onClick={(e) => { e.stopPropagation(); requireAdminAuth(`${t('修改记录参数')} [${taskItem.id}]`, () => { setEditingTask(taskItem); setShowTaskModal(true); }); }} className="p-1 text-slate-400 hover:text-blue-600 hover:bg-white rounded transition-colors border border-transparent hover:border-blue-200 shadow-sm opacity-0 group-hover:opacity-100" title={t('修改参数')}><Edit2 size={12}/></button>
                                              <button onClick={(e) => handleDeleteTask(taskItem, e)} className="p-1 text-slate-400 hover:text-red-600 hover:bg-white rounded transition-colors border border-transparent hover:border-red-200 shadow-sm opacity-0 group-hover:opacity-100" title={t('永久删除')}><Trash2 size={12}/></button>
                                              <button onClick={(e) => { e.stopPropagation(); onSelectTask(taskItem.id); }} className="text-blue-600 font-bold hover:text-white transition-colors text-[10px] px-2.5 py-1 rounded border border-blue-200 bg-blue-50 hover:bg-blue-600 shadow-sm ml-1">
                                                  {(taskItem.status === 'Reported' || taskItem.status === 'Pending') ? t('判读数据') : t('查看数据')}
                                              </button>
                                          </div>
                                      </td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  )}
              </div>
          </div>
          <TaskFormModal isOpen={showTaskModal} isEdit={!!editingTask} initialData={editingTask} onClose={closeTaskModal} onSave={handleSaveTask}/>
        </>
      ) : (
        <>
          <div className="bg-white border border-slate-200 shadow-sm rounded-md px-4 py-3 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-1.5 bg-blue-50 text-blue-600 rounded-md border border-blue-100">
                 <Users size={16} strokeWidth={2}/>
              </div>
              <div>
                <h2 className="text-[13px] font-bold text-slate-800">{t('患者档案')}</h2>
                <p className="text-slate-500 text-[10px] mt-0.5 font-medium">{t('总建档患者:')} <span className="font-bold text-blue-600">{patients.length}</span></p>
              </div>
            </div>
            <button onClick={() => setShowPatientModal(true)} className="px-4 py-1.5 rounded-md font-bold text-[11px] transition-all active:scale-95 flex items-center gap-1.5 bg-blue-600 text-white hover:bg-blue-700 shadow-sm">
              <Plus size={14} strokeWidth={2.5}/> {t('新建患者档案')}
            </button>
          </div>

          <div className="flex-1 flex flex-col min-h-0 bg-white rounded-md border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-2.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="relative w-[280px]">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={12}/>
                <input className="w-full bg-white border border-slate-200 rounded text-[11px] pl-7 pr-2 py-1.5 outline-none focus:border-blue-500 transition-colors font-medium text-slate-800 placeholder-slate-400 shadow-sm" placeholder={t('搜索姓名、住院号 或 电话')} value={searchQ} onChange={e => setSearchQ(e.target.value)} />
              </div>
            </div>
            
            <div className="overflow-y-auto flex-1 light-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead className="bg-white sticky top-0 z-10 border-b border-slate-200 shadow-sm">
                  <tr>
                    <th className="px-4 py-2.5 text-[10px] font-bold text-slate-500 whitespace-nowrap">{t('患者姓名')}</th>
                    <th className="px-4 py-2.5 text-[10px] font-bold text-slate-500 whitespace-nowrap">{t('住院号')}</th>
                    <th className="px-4 py-2.5 text-[10px] font-bold text-slate-500 whitespace-nowrap">{t('性别 / 年龄')}</th>
                    <th className="px-4 py-2.5 text-[10px] font-bold text-slate-500 whitespace-nowrap">{t('主治医师')}</th>
                    <th className="px-4 py-2.5 text-[10px] font-bold text-slate-500 whitespace-nowrap">{t('体征 (BMI/颈围)')}</th>
                    <th className="px-4 py-2.5 text-[10px] font-bold text-slate-500 whitespace-nowrap">{t('适用AASM标准')}</th>
                    <th className="px-4 py-2.5 text-[10px] font-bold text-slate-500 text-right whitespace-nowrap">{t('操作')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPatients.map((p) => (
                    <tr key={p.id} onClick={() => openDetail(p)} className="group transition-colors hover:bg-blue-50/50 cursor-pointer border-b border-slate-100 last:border-0">
                      <td className="px-4 py-3 font-bold text-slate-800 text-[11px]">{p.name}</td>
                      <td className="px-4 py-3 font-mono font-bold text-slate-600 text-[11px]">{p.hospitalId || '--'}</td>
                      <td className="px-4 py-3 text-slate-700 text-[10px] font-medium">{t(p.gender)} / {calcAge(p.dob)} {t('岁')}</td>
                      <td className="px-4 py-3 text-slate-700 text-[10px] font-bold">{p.doctor || '--'}</td>
                      <td className="px-4 py-3 text-slate-700 text-[10px] font-medium">
                          {calcBMI(p.height, p.weight)} / {p.neck ? `${p.neck}cm` : '--'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {calcAge(p.dob) < 18 && calcAge(p.dob) !== '--' && (
                              <BadgeAlert 
                                  size={14} 
                                  className="text-purple-600 cursor-pointer hover:scale-110 transition-transform drop-shadow-sm"
                                  onClick={(e) => { e.stopPropagation(); setShowAasmInfo(true); }}
                                  title={t('AASM 3.0 儿童与成人判读标准主要差异')}
                              />
                          )}
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${getAASMRule(calcAge(p.dob), t).color}`}>
                            {getAASMRule(calcAge(p.dob), t).label}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                            <button onClick={(e) => { e.stopPropagation(); requireAdminAuth(`${t('编辑患者资料')} [${p.name}]`, () => handleEditPatient(p)); }} className="p-1 text-slate-400 hover:text-blue-600 hover:bg-white rounded transition-colors border border-transparent hover:border-blue-200 shadow-sm opacity-0 group-hover:opacity-100" title={t('编辑资料')}><Edit2 size={12}/></button>
                            <button onClick={(e) => handleDeletePatient(p, e)} className="p-1 text-slate-400 hover:text-red-600 hover:bg-white rounded transition-colors border border-transparent hover:border-red-200 shadow-sm opacity-0 group-hover:opacity-100" title={t('永久删除')}><Trash2 size={12}/></button>
                            <button onClick={(e) => { e.stopPropagation(); openDetail(p); }} className="text-blue-600 font-bold hover:text-white transition-colors text-[10px] px-3 py-1 rounded border border-blue-200 bg-blue-50 hover:bg-blue-600 shadow-sm ml-1">{t('进入档案')}</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* 新增患者 Modal */}
      <Modal isOpen={showPatientModal} onClose={closePatientModal} title={editingPatient ? t('编辑患者临床资料') : t('新建患者临床档案')} size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-4">
            <div><label className="block text-[10px] font-bold text-slate-500 mb-1">{t('姓名')} <span className="text-red-500">*</span></label><input type="text" className="w-full bg-white border border-slate-200 rounded-md px-2.5 py-1.5 text-[11px] outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 text-slate-800 shadow-sm font-bold" value={patientForm.name || ''} onChange={e=>handleFieldChange('name', e.target.value)}/></div>
            <div><label className="block text-[10px] font-bold text-slate-500 mb-1">{t('住院号')} <span className="text-red-500">*</span></label><input type="text" className="w-full bg-white border border-slate-200 rounded-md px-2.5 py-1.5 text-[11px] outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 font-mono text-slate-800 shadow-sm font-bold" value={patientForm.hospitalId || ''} onChange={e=>handleFieldChange('hospitalId', e.target.value)}/></div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 mb-1 flex items-center justify-between">{t('出生日期(DOB)')} <span className="text-red-500">*</span> <HelpTooltip title={t('AASM 3.0 判读规则界限')} content={t('系统会根据出生日期自动计算年龄。年龄小于18岁将自动适配 AASM 3.0 儿童判读规则；大于等于18岁适配成人规则。')}/></label>
              <input type="date" className="w-full bg-white border border-slate-200 rounded-md px-2.5 py-1.5 text-[11px] outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 font-mono text-slate-800 shadow-sm font-bold" value={patientForm.dob || ''} onChange={e=>handleFieldChange('dob', e.target.value)}/>
            </div>
            <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">{t('性别')} <span className="text-red-500">*</span></label>
                <select className="w-full bg-white border border-slate-200 rounded-md px-2.5 py-1.5 text-[11px] outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 text-slate-800 shadow-sm font-bold cursor-pointer" value={patientForm.gender || '男'} onChange={e=>handleFieldChange('gender', e.target.value)}>
                    <option value="男">{t('男')}</option>
                    <option value="女">{t('女')}</option>
                </select>
            </div>
            
            <div><label className="block text-[10px] font-bold text-slate-500 mb-1">{t('联系电话')} <span className="text-red-500">*</span></label><input type="text" className="w-full bg-white border border-slate-200 rounded-md px-2.5 py-1.5 text-[11px] outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 font-mono text-slate-800 shadow-sm font-bold" value={patientForm.phone || ''} onChange={e=>handleFieldChange('phone', e.target.value)}/></div>
            <div><label className="block text-[10px] font-bold text-slate-500 mb-1">{t('主治医师')}</label><input type="text" className="w-full bg-white border border-slate-200 rounded-md px-2.5 py-1.5 text-[11px] outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 text-slate-800 shadow-sm font-bold" value={patientForm.doctor || ''} onChange={e=>handleFieldChange('doctor', e.target.value)}/></div>
            <div><label className="block text-[10px] font-bold text-slate-500 mb-1">{t('身高 (cm)')}</label><input type="text" className="w-full bg-white border border-slate-200 rounded-md px-2.5 py-1.5 text-[11px] outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 font-mono text-slate-800 shadow-sm font-bold" value={patientForm.height || ''} onChange={e=>handleFieldChange('height', e.target.value)}/></div>
            <div><label className="block text-[10px] font-bold text-slate-500 mb-1">{t('体重 (kg)')} <span className="text-red-500">*</span></label><input type="text" className="w-full bg-white border border-slate-200 rounded-md px-2.5 py-1.5 text-[11px] outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 font-mono text-slate-800 shadow-sm font-bold" value={patientForm.weight || ''} onChange={e=>handleFieldChange('weight', e.target.value)}/></div>
            
            <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1 flex items-center gap-1">{t('BMI (自动计算)')} <HelpTooltip title={t('高危指标')} content={t('临床上 BMI>30 视为阻塞性睡眠呼吸暂停(OSA)的强相关体征。')}/></label>
                <div className="w-full bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 text-[11px] font-mono text-slate-500 shadow-inner h-[28px] flex items-center">
                    {calcBMI(patientForm.height, patientForm.weight)}
                </div>
            </div>
            <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1 flex items-center gap-1">{t('年龄 (自动计算)')}</label>
                <div className="w-full bg-slate-50 border border-slate-200 rounded-md px-2.5 py-1.5 text-[11px] font-mono text-slate-500 shadow-inner h-[28px] flex items-center">
                    {calcAge(patientForm.dob)}
                </div>
            </div>
            <div><label className="block text-[10px] font-bold text-slate-500 mb-1">{t('颈围 (cm)')}</label><input type="text" className="w-full bg-white border border-slate-200 rounded-md px-2.5 py-1.5 text-[11px] outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 font-mono text-slate-800 shadow-sm font-bold" value={patientForm.neck || ''} onChange={e=>handleFieldChange('neck', e.target.value)}/></div>
            <div><label className="block text-[10px] font-bold text-slate-500 mb-1 flex items-center justify-between">{t('ESS (嗜睡)')} <HelpTooltip title={t('Epworth 嗜睡量表')} content={t('评估日间过度嗜睡情况，大于10分提示存在临床意义的嗜睡。')}/></label><input type="number" className="w-full bg-white border border-slate-200 rounded-md px-2.5 py-1.5 text-[11px] outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 font-mono text-slate-800 shadow-sm font-bold" placeholder="0-24" value={patientForm.ess || ''} onChange={e=>handleFieldChange('ess', e.target.value)}/></div>
            
            <div><label className="block text-[10px] font-bold text-slate-500 mb-1 flex items-center justify-between">{t('PSQI (睡眠质量)')} <HelpTooltip title={t('匹兹堡睡眠质量指数')} content={t('评估主观睡眠质量。')}/></label><input type="number" className="w-full bg-white border border-slate-200 rounded-md px-2.5 py-1.5 text-[11px] outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 font-mono text-slate-800 shadow-sm font-bold" placeholder="0-21" value={patientForm.psqi || ''} onChange={e=>handleFieldChange('psqi', e.target.value)}/></div>
            <div><label className="block text-[10px] font-bold text-slate-500 mb-1 flex items-center justify-between">{t('ISI (失眠严重度)')} <HelpTooltip title={t('失眠严重度指数')} content={t('临床评估失眠障碍严重程度的标准化问卷。')}/></label><input type="number" className="w-full bg-white border border-slate-200 rounded-md px-2.5 py-1.5 text-[11px] outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 font-mono text-slate-800 shadow-sm font-bold" placeholder="0-28" value={patientForm.isi || ''} onChange={e=>handleFieldChange('isi', e.target.value)}/></div>
            <div className="col-span-2"><label className="block text-[10px] font-bold text-slate-500 mb-1 flex items-center justify-between">{t('STOP-Bang')} <HelpTooltip title={t('OSA 筛查问卷')} content={t('快速筛查阻塞性睡眠呼吸暂停的高风险人群，≥3分提示中高危。')}/></label><input type="number" className="w-full bg-white border border-slate-200 rounded-md px-2.5 py-1.5 text-[11px] outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 font-mono text-slate-800 shadow-sm font-bold" placeholder="0-8" value={patientForm.stopBang || ''} onChange={e=>handleFieldChange('stopBang', e.target.value)}/></div>

            <div className="col-span-2"><label className="block text-[10px] font-bold text-slate-500 mb-1 flex items-center justify-between">{t('合并症')} <HelpTooltip title={t('临床关联提示')} content={t('记录可能影响睡眠结构或呼吸事件判读的系统性疾病，如 COPD、神经肌肉疾病、心力衰竭等。')}/></label><textarea maxLength={200} rows={2} className="w-full bg-white border border-slate-200 rounded-md px-2.5 py-2 text-[11px] outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 text-slate-800 shadow-sm custom-scrollbar resize-none font-medium leading-relaxed" placeholder={t('如：充血性心力衰竭，COPD...')} value={patientForm.comorbidities || ''} onChange={e=>handleFieldChange('comorbidities', e.target.value)}/></div>
            <div className="col-span-2"><label className="block text-[10px] font-bold text-slate-500 mb-1 flex items-center justify-between">{t('现用药史')} <HelpTooltip title={t('影响睡眠结构的用药')} content={t('记录如苯二氮卓类、抗抑郁药、镇静剂等。此类药物可能显著改变微架构(如纺锤波增加或REM潜伏期延长)。')}/></label><textarea maxLength={200} rows={2} className="w-full bg-white border border-slate-200 rounded-md px-2.5 py-2 text-[11px] outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 text-slate-800 shadow-sm custom-scrollbar resize-none font-medium leading-relaxed" placeholder={t('包含药物名称及剂量...')} value={patientForm.medications || ''} onChange={e=>handleFieldChange('medications', e.target.value)}/></div>

            <div className="col-span-4"><label className="block text-[10px] font-bold text-slate-500 mb-1">{t('主诉及简要病史')}</label><textarea maxLength={500} rows={3} className="w-full bg-white border border-slate-200 rounded-md px-2.5 py-2 text-[11px] outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 text-slate-800 shadow-sm custom-scrollbar resize-none font-medium leading-relaxed" placeholder={t('详述睡眠相关症状（限500字）...')} value={patientForm.history || ''} onChange={e=>handleFieldChange('history', e.target.value)}/></div>
          </div>
          
          <div className="pt-4 flex justify-between items-center mt-4 border-t border-slate-100">
            <div className="text-[10px] font-bold text-red-500 w-full animate-in fade-in">{formError ? t(formError) : ''}</div>
            <div className="flex justify-end gap-3 shrink-0">
                <button onClick={closePatientModal} className="px-5 py-2 rounded-md font-bold text-[11px] text-slate-600 hover:bg-slate-100 border border-slate-200 bg-white">{t('取消')}</button>
                <button onClick={handleSavePatient} className="px-5 py-2 rounded-md font-bold text-[11px] bg-blue-600 text-white hover:bg-blue-700 shadow-sm">{t('保存档案')}</button>
            </div>
          </div>
        </div>
      </Modal>

      {/* AASM 规则差异说明 Modal */}
      <Modal isOpen={showAasmInfo} onClose={() => setShowAasmInfo(false)} title={t('AASM 3.0 儿童与成人判读标准主要差异')} size="md">
          <div className="space-y-4 text-slate-700 p-1">
             <div className="bg-purple-50 border border-purple-100 rounded-md p-3">
                <h4 className="font-bold text-[11px] text-purple-900 flex items-center gap-1.5"><Activity size={14}/> {t('1. 呼吸事件持续时间')}</h4>
                <p className="text-[10px] mt-1.5 text-purple-800 leading-relaxed">{t('成人需≥10秒；儿童仅需≥2个正常呼吸周期。')}</p>
             </div>
             <div className="bg-indigo-50 border border-indigo-100 rounded-md p-3">
                <h4 className="font-bold text-[11px] text-indigo-900 flex items-center gap-1.5"><Monitor size={14}/> {t('2. 中枢性呼吸暂停')}</h4>
                <p className="text-[10px] mt-1.5 text-indigo-800 leading-relaxed">{t('儿童规则更为严格，通常持续>20秒，或持续>2个呼吸周期且伴有觉醒、觉醒反应或血氧下降≥3%（或心动过缓）。')}</p>
             </div>
             <div className="bg-blue-50 border border-blue-100 rounded-md p-3">
                <h4 className="font-bold text-[11px] text-blue-900 flex items-center gap-1.5"><Cpu size={14}/> {t('3. 睡眠分期与脑电图')}</h4>
                <p className="text-[10px] mt-1.5 text-blue-800 leading-relaxed">{t('儿童及婴幼儿的脑电波幅通常更高，且慢波睡眠（N3期）标准以及睡眠纺锤波的发育评估与成人有显著不同。')}</p>
             </div>
             <div className="pt-3 flex justify-end mt-2">
                <button onClick={() => setShowAasmInfo(false)} className="px-5 py-2 rounded-md font-bold text-[11px] bg-blue-600 text-white hover:bg-blue-700 shadow-sm transition-colors">{t('知道了')}</button>
             </div>
          </div>
      </Modal>
    </div>
  );
};


// ############################################################################
// # 6. 全局应用外壳 (BaseApp 高保真原型集成)
// ############################################################################

const MODULE_NAMES = {
  central: '中央监护控制台',
  acquisition: '实时数据采集仪',
  scoring: '多导睡眠判读中心',
  report: '综合报告签发'
};

export default function App() {
  const [patients, setPatients] = useState(INITIAL_DB.patients);
  const [tasks, setTasks] = useState(INITIAL_DB.tasks);
  
  const [adminAuthRequest, setAdminAuthRequest] = useState(null);

  const [lang, setLang] = useState('zh');
  const [activeModule, setActiveModule] = useState('patient'); 
  const [currentTask, setCurrentTask] = useState(null); 

  const requireAdminAuth = (actionName, onConfirm) => {
    setAdminAuthRequest({ actionName, onConfirm });
  };

  const handleTaskSelect = (taskId) => {
    const task = tasks.find(t => t.id === taskId);
    const patient = patients.find(p => p.id === task.patientId);
    
    setCurrentTask({ ...task, patient });
    
    if (task.status === 'Recording' || task.status === 'Scheduled') {
      setActiveModule('acquisition');
    } else if (task.status === 'Pending') {
      setActiveModule('scoring');
    } else {
      setActiveModule('report');
    }
  };

  // i18n T helper
  const t = (key) => lang === 'en' ? (enDict[key] || key) : key;

  const NavItem = ({ id, icon: IconComponent, label }) => (
    <button onClick={() => setActiveModule(id)} className={`w-full py-3 flex flex-col items-center gap-1 transition-colors relative ${activeModule === id ? 'text-white' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'}`}>
      {activeModule === id && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-blue-500 rounded-r-full shadow-[0_0_10px_#3b82f6]"/>}
      <div className={`p-1.5 rounded-md transition-colors ${activeModule === id ? 'bg-blue-600 shadow-md shadow-blue-900/50' : 'bg-transparent'}`}>
        <IconComponent size={14} strokeWidth={activeModule === id ? 2 : 1.5} />
      </div>
      <span className={`text-[9px] font-bold text-center leading-tight w-full px-0.5 break-words ${activeModule === id ? 'text-blue-200' : ''}`}>{t(label)}</span>
    </button>
  );

  return (
    <I18nContext.Provider value={{ t, lang }}>
      <div className="flex items-center justify-center h-screen w-full overflow-hidden p-0 bg-slate-900 font-sans select-none">
        <GlobalStyles />
        
        <AdminAuthDialog 
          isOpen={!!adminAuthRequest} 
          actionName={adminAuthRequest?.actionName}
          onClose={() => setAdminAuthRequest(null)}
          onSuccess={() => { adminAuthRequest.onConfirm(); setAdminAuthRequest(null); }}
        />
        
        <div className="flex w-full h-full max-w-[1920px] bg-slate-100 shadow-2xl overflow-hidden relative">
          
          <div className="w-[64px] bg-slate-900 flex flex-col items-center py-4 shrink-0 z-50 relative border-r border-slate-800">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-md flex items-center justify-center font-bold text-white mb-4 text-[11px] tracking-widest shadow border border-blue-400/50">
              QL
            </div>
            <div className="flex-1 w-full space-y-0.5">
              <NavItem id="patient" icon={Users} label="病患管理" />
              <NavItem id="central" icon={Activity} label="中央监护" />
              <NavItem id="acquisition" icon={Monitor} label="数据采集" />
              <NavItem id="scoring" icon={Cpu} label="睡眠判读" />
              <NavItem id="report" icon={PieChart} label="报告签发" />
            </div>
            <div className="mt-auto mb-1 flex flex-col gap-1 w-full px-2">
              <button onClick={() => setLang(l => l === 'zh' ? 'en' : 'zh')} className="py-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors flex flex-col items-center justify-center gap-0.5 font-bold">
                  <Globe size={14}/><span className="text-[8px] tracking-wider">{lang === 'zh' ? 'EN' : '中文'}</span>
              </button>
              <button className="py-2 text-slate-500 hover:text-slate-300 hover:bg-slate-800 rounded-md transition-colors flex flex-col items-center justify-center">
                  <Settings size={14}/>
              </button>
            </div>
          </div>

          <div className="flex-1 relative overflow-hidden bg-slate-200 flex flex-col">
            {activeModule === 'patient' ? (
                <PatientManager 
                  patients={patients} 
                  setPatients={setPatients} 
                  tasks={tasks} 
                  setTasks={setTasks} 
                  onSelectTask={handleTaskSelect} 
                  requireAdminAuth={requireAdminAuth} 
                />
            ) : (
                <ModuleConsole 
                  moduleName={MODULE_NAMES[activeModule] || '未知模块'}
                  taskData={currentTask} 
                  onBack={() => setActiveModule('patient')} 
                />
            )}
          </div>
          
        </div>
      </div>
    </I18nContext.Provider>
  );
}