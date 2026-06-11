import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HandLandmarker, FilesetResolver } from "@mediapipe/tasks-vision";
import { useSearchParams } from "react-router-dom";
import { auth } from "../lib/firebase";
import { signOut } from "firebase/auth";
import {
  Hand, Zap, ZapOff, Activity, RotateCcw, Clock,
  LogOut, Upload, Camera, Volume2, VolumeX, Copy, Check,
  Sun, Moon, Trash2, Mic, Share2, Trophy, BookOpen,
  BarChart2, Scan, Star, Flame, Target, Award, X, Plus
} from "lucide-react";

// ── Config ──────────────────────────────────────────────────────────────────
const RAILWAY_URL       = import.meta.env.VITE_RAILWAY_API_URL as string;
const FRAME_INTERVAL_MS = 500;
const HOLD_DURATION_MS  = 1000;
const COOLDOWN_MS       = 1500;
const CONFIDENCE_GATE   = 0.80;

// ── Auto dark mode based on time ────────────────────────────────────────────
function shouldBeDark(): boolean {
  const h = new Date().getHours();
  return h < 6 || h >= 20; // dark 8pm–6am, light 6am–8pm
}

function initDarkMode(): boolean {
  const manual = localStorage.getItem("s2s_dark_manual");
  if (manual !== null) return manual === "true";
  return shouldBeDark();
}

// ── Types ───────────────────────────────────────────────────────────────────
interface Prediction {
  topSign: string; confidence: number;
  topFive: { sign: string; confidence: number }[];
  handDetected: boolean; latencyMs: number;
}
interface UserStats {
  totalSigns: number; totalSessions: number; streak: number; maxStreak: number;
  lastActiveDate: string; avgAccuracy: number; accuracyHistory: number[];
  unlockedLetters: string[]; sentenceCount: number;
}
interface Achievement {
  id: string; name: string; desc: string; icon: string;
  check: (s: UserStats) => boolean;
}
type Tab  = "scanner" | "learn" | "progress" | "leaderboard";
type Mode = "webcam" | "upload";
type Lang = "en"|"es"|"ar"|"fr"|"de"|"pt"|"hi"|"ja"|"zh"|"tr"|"it";

// ── Translations ─────────────────────────────────────────────────────────────
const T: Record<Lang, Record<string, string>> = {
  en: { scanner:"Scanner", learn:"Learn", progress:"Progress", leaderboard:"Leaderboard",
    init:"INITIALIZE SCANNER", stop:"STOP SCANNER", loading:"LOADING…",
    sentence:"SENTENCE BUILDER", hold:"Hold 1s to add letter",
    signOfDay:"Sign of the Day", practice:"Practice Mode", alphabet:"ASL Alphabet",
    streak:"Day Streak", accuracy:"Avg Accuracy", totalSigns:"Total Signs",
    badges:"Achievements", share:"Share", copy:"Copy", speak:"Speak",
    clear:"Clear", upload:"UPLOAD IMAGE", noHand:"No hand detected",
    detected:"DETECTED SIGN", top:"TOP CANDIDATES", history:"HISTORY",
    welcome:"Welcome to Sign2Sign AI", getStarted:"Get Started",
    saveTitle:"Add to Sentence?", saveYes:"Yes, Add Letter",
    saveNo:"Skip", saveDontAsk:"Don't ask again",
    step1:"Show your hand to the camera",
    step2:"Hold a sign for 1 second to add it",
    step3:"Build sentences and speak them aloud" },
  es: { scanner:"Escáner", learn:"Aprender", progress:"Progreso", leaderboard:"Clasificación",
    init:"INICIAR ESCÁNER", stop:"DETENER", loading:"CARGANDO…",
    sentence:"CONSTRUCTOR", hold:"Mantén 1s para agregar",
    signOfDay:"Seña del Día", practice:"Práctica", alphabet:"Alfabeto ASL",
    streak:"Racha", accuracy:"Precisión", totalSigns:"Señas Totales",
    badges:"Logros", share:"Compartir", copy:"Copiar", speak:"Hablar",
    clear:"Limpiar", upload:"SUBIR IMAGEN", noHand:"No se detecta mano",
    detected:"SEÑA DETECTADA", top:"CANDIDATOS", history:"HISTORIAL",
    welcome:"Bienvenido a Sign2Sign AI", getStarted:"Comenzar",
    saveTitle:"¿Agregar a la oración?", saveYes:"Sí, Agregar",
    saveNo:"Saltar", saveDontAsk:"No preguntar de nuevo",
    step1:"Muestra tu mano", step2:"Mantén 1s para agregar", step3:"Habla la oración" },
  ar: { scanner:"الماسح", learn:"تعلم", progress:"التقدم", leaderboard:"المتصدرون",
    init:"تشغيل الماسح", stop:"إيقاف", loading:"جار التحميل…",
    sentence:"منشئ الجمل", hold:"امسك ثانية لإضافة حرف",
    signOfDay:"إشارة اليوم", practice:"التدريب", alphabet:"أبجدية ASL",
    streak:"أيام متتالية", accuracy:"الدقة", totalSigns:"الإشارات الكلية",
    badges:"الإنجازات", share:"مشاركة", copy:"نسخ", speak:"تحدث",
    clear:"مسح", upload:"رفع صورة", noHand:"لا توجد يد",
    detected:"الإشارة المكتشفة", top:"المرشحون", history:"السجل",
    welcome:"مرحباً بك", getStarted:"ابدأ",
    saveTitle:"إضافة للجملة؟", saveYes:"نعم، أضف", saveNo:"تخطي", saveDontAsk:"لا تسأل مرة أخرى",
    step1:"أظهر يدك", step2:"امسك ثانية", step3:"انطق الجملة" },
  fr: { scanner:"Scanner", learn:"Apprendre", progress:"Progrès", leaderboard:"Classement",
    init:"DÉMARRER LE SCANNER", stop:"ARRÊTER", loading:"CHARGEMENT…",
    sentence:"CONSTRUCTEUR", hold:"Tenir 1s pour ajouter",
    signOfDay:"Signe du Jour", practice:"Entraînement", alphabet:"Alphabet ASL",
    streak:"Série de Jours", accuracy:"Précision", totalSigns:"Signes Totaux",
    badges:"Succès", share:"Partager", copy:"Copier", speak:"Parler",
    clear:"Effacer", upload:"TÉLÉCHARGER", noHand:"Aucune main détectée",
    detected:"SIGNE DÉTECTÉ", top:"CANDIDATS", history:"HISTORIQUE",
    welcome:"Bienvenue sur Sign2Sign AI", getStarted:"Commencer",
    saveTitle:"Ajouter à la phrase?", saveYes:"Oui, Ajouter", saveNo:"Passer",
    saveDontAsk:"Ne plus demander",
    step1:"Montrez votre main", step2:"Tenez 1s pour ajouter", step3:"Parlez la phrase" },
  de: { scanner:"Scanner", learn:"Lernen", progress:"Fortschritt", leaderboard:"Rangliste",
    init:"SCANNER STARTEN", stop:"STOPPEN", loading:"LÄDT…",
    sentence:"SATZBUILDER", hold:"1s halten zum Hinzufügen",
    signOfDay:"Zeichen des Tages", practice:"Übungsmodus", alphabet:"ASL-Alphabet",
    streak:"Tagessträhne", accuracy:"Genauigkeit", totalSigns:"Gesten Gesamt",
    badges:"Erfolge", share:"Teilen", copy:"Kopieren", speak:"Sprechen",
    clear:"Löschen", upload:"BILD HOCHLADEN", noHand:"Keine Hand erkannt",
    detected:"ERKANNTES ZEICHEN", top:"TOP-KANDIDATEN", history:"VERLAUF",
    welcome:"Willkommen bei Sign2Sign AI", getStarted:"Loslegen",
    saveTitle:"Zum Satz hinzufügen?", saveYes:"Ja, Hinzufügen", saveNo:"Überspringen",
    saveDontAsk:"Nicht mehr fragen",
    step1:"Zeige deine Hand", step2:"1s halten zum Hinzufügen", step3:"Satz aussprechen" },
  pt: { scanner:"Scanner", learn:"Aprender", progress:"Progresso", leaderboard:"Classificação",
    init:"INICIAR SCANNER", stop:"PARAR", loading:"CARREGANDO…",
    sentence:"CONSTRUTOR", hold:"Segure 1s para adicionar",
    signOfDay:"Sinal do Dia", practice:"Prática", alphabet:"Alfabeto ASL",
    streak:"Sequência", accuracy:"Precisão", totalSigns:"Sinais Totais",
    badges:"Conquistas", share:"Compartilhar", copy:"Copiar", speak:"Falar",
    clear:"Limpar", upload:"ENVIAR IMAGEM", noHand:"Nenhuma mão detectada",
    detected:"SINAL DETECTADO", top:"CANDIDATOS", history:"HISTÓRICO",
    welcome:"Bem-vindo ao Sign2Sign AI", getStarted:"Começar",
    saveTitle:"Adicionar à frase?", saveYes:"Sim, Adicionar", saveNo:"Pular",
    saveDontAsk:"Não perguntar novamente",
    step1:"Mostre sua mão", step2:"Segure 1s", step3:"Fale a frase" },
  hi: { scanner:"स्कैनर", learn:"सीखें", progress:"प्रगति", leaderboard:"लीडरबोर्ड",
    init:"स्कैनर शुरू करें", stop:"रोकें", loading:"लोड हो रहा है…",
    sentence:"वाक्य निर्माता", hold:"1 सेकंड होल्ड करें",
    signOfDay:"आज का संकेत", practice:"अभ्यास", alphabet:"ASL वर्णमाला",
    streak:"दिन की श्रृंखला", accuracy:"सटीकता", totalSigns:"कुल संकेत",
    badges:"उपलब्धियां", share:"साझा करें", copy:"कॉपी", speak:"बोलें",
    clear:"साफ़", upload:"छवि अपलोड", noHand:"कोई हाथ नहीं मिला",
    detected:"पहचाना गया संकेत", top:"शीर्ष उम्मीदवार", history:"इतिहास",
    welcome:"Sign2Sign AI में आपका स्वागत है", getStarted:"शुरू करें",
    saveTitle:"वाक्य में जोड़ें?", saveYes:"हाँ, जोड़ें", saveNo:"छोड़ें",
    saveDontAsk:"दोबारा मत पूछें",
    step1:"कैमरे को हाथ दिखाएं", step2:"1 सेकंड होल्ड करें", step3:"वाक्य बोलें" },
  ja: { scanner:"スキャナー", learn:"学習", progress:"進歩", leaderboard:"ランキング",
    init:"スキャナーを起動", stop:"停止", loading:"読込中…",
    sentence:"文章ビルダー", hold:"1秒ホールドで追加",
    signOfDay:"今日のサイン", practice:"練習モード", alphabet:"ASL アルファベット",
    streak:"連続日数", accuracy:"精度", totalSigns:"合計サイン",
    badges:"実績", share:"シェア", copy:"コピー", speak:"読む",
    clear:"クリア", upload:"画像をアップロード", noHand:"手が検出されません",
    detected:"検出されたサイン", top:"トップ候補", history:"履歴",
    welcome:"Sign2Sign AIへようこそ", getStarted:"始める",
    saveTitle:"文章に追加しますか？", saveYes:"はい、追加", saveNo:"スキップ",
    saveDontAsk:"今後確認しない",
    step1:"カメラに手を見せる", step2:"1秒ホールドして追加", step3:"文章を読み上げる" },
  zh: { scanner:"扫描仪", learn:"学习", progress:"进度", leaderboard:"排行榜",
    init:"启动扫描仪", stop:"停止", loading:"加载中…",
    sentence:"句子生成器", hold:"按住1秒添加字母",
    signOfDay:"今日手语", practice:"练习模式", alphabet:"ASL字母表",
    streak:"连续天数", accuracy:"准确率", totalSigns:"总手语数",
    badges:"成就", share:"分享", copy:"复制", speak:"朗读",
    clear:"清除", upload:"上传图片", noHand:"未检测到手",
    detected:"检测到的手语", top:"最佳候选", history:"历史记录",
    welcome:"欢迎使用Sign2Sign AI", getStarted:"开始",
    saveTitle:"添加到句子？", saveYes:"是，添加", saveNo:"跳过",
    saveDontAsk:"不再询问",
    step1:"向摄像头展示您的手", step2:"按住1秒添加", step3:"朗读句子" },
  tr: { scanner:"Tarayıcı", learn:"Öğren", progress:"İlerleme", leaderboard:"Liderlik",
    init:"TARAYICI BAŞLAT", stop:"DURDUR", loading:"YÜKLENİYOR…",
    sentence:"CÜMLE OLUŞTURUCU", hold:"1s tutarak harf ekle",
    signOfDay:"Günün İşareti", practice:"Pratik Modu", alphabet:"ASL Alfabesi",
    streak:"Gün Serisi", accuracy:"Doğruluk", totalSigns:"Toplam İşaret",
    badges:"Başarılar", share:"Paylaş", copy:"Kopyala", speak:"Konuş",
    clear:"Temizle", upload:"RESİM YÜKLE", noHand:"El algılanmadı",
    detected:"ALGILANAN İŞARET", top:"EN İYİ ADAYLAR", history:"GEÇMİŞ",
    welcome:"Sign2Sign AI'ya Hoş Geldiniz", getStarted:"Başla",
    saveTitle:"Cümleye Ekle?", saveYes:"Evet, Ekle", saveNo:"Atla",
    saveDontAsk:"Bir daha sorma",
    step1:"Elinizi kameraya gösterin", step2:"1s tutarak ekleyin", step3:"Cümleyi söyleyin" },
  it: { scanner:"Scanner", learn:"Impara", progress:"Progressi", leaderboard:"Classifica",
    init:"AVVIA SCANNER", stop:"FERMA", loading:"CARICAMENTO…",
    sentence:"COSTRUTTORE", hold:"Tieni 1s per aggiungere",
    signOfDay:"Segno del Giorno", practice:"Modalità Pratica", alphabet:"Alfabeto ASL",
    streak:"Serie Giorni", accuracy:"Precisione", totalSigns:"Segni Totali",
    badges:"Traguardi", share:"Condividi", copy:"Copia", speak:"Parla",
    clear:"Cancella", upload:"CARICA IMMAGINE", noHand:"Nessuna mano rilevata",
    detected:"SEGNO RILEVATO", top:"CANDIDATI", history:"CRONOLOGIA",
    welcome:"Benvenuto su Sign2Sign AI", getStarted:"Inizia",
    saveTitle:"Aggiungere alla frase?", saveYes:"Sì, Aggiungi", saveNo:"Salta",
    saveDontAsk:"Non chiedere più",
    step1:"Mostra la mano alla telecamera", step2:"Tieni 1s per aggiungere", step3:"Leggi la frase" },
};

// ── ASL Signs reference ──────────────────────────────────────────────────────
const ASL_SIGNS: Record<string, { desc: string; tip: string }> = {
  A:{desc:"Fist, thumb on side",tip:"Fingers curled tight"},
  B:{desc:"4 fingers up, thumb tucked",tip:"Fingers together straight up"},
  C:{desc:"Curve hand like holding a cup",tip:"C shape with thumb & fingers"},
  D:{desc:"Index to thumb, others up",tip:"Circle with a stick"},
  E:{desc:"Bend all fingers down",tip:"Fingers curl forward"},
  F:{desc:"Index to thumb, 3 fingers up",tip:"OK sign inverted"},
  G:{desc:"Index sideways, thumb parallel",tip:"Pointing sideways"},
  H:{desc:"Index & middle sideways",tip:"Two fingers sideways"},
  I:{desc:"Pinky up, others curled",tip:"Just the pinky"},
  J:{desc:"Pinky up, trace J",tip:"Draw J with pinky"},
  K:{desc:"Index up, middle angled, thumb between",tip:"Peace but angled"},
  L:{desc:"Index up, thumb out",tip:"L shape"},
  M:{desc:"3 fingers over thumb",tip:"3 fingers over thumb"},
  N:{desc:"2 fingers over thumb",tip:"2 over thumb"},
  O:{desc:"All fingers form O",tip:"Round O shape"},
  P:{desc:"K pointing down",tip:"K shape down"},
  Q:{desc:"G pointing down",tip:"G shape down"},
  R:{desc:"Cross index & middle",tip:"Crossed fingers"},
  S:{desc:"Fist, thumb over fingers",tip:"Thumb on top fist"},
  T:{desc:"Thumb between index & middle",tip:"Thumb peeking through"},
  U:{desc:"Index & middle up together",tip:"Two fingers side by side"},
  V:{desc:"Index & middle V shape",tip:"Peace sign"},
  W:{desc:"3 fingers up spread",tip:"Three fingers spread"},
  X:{desc:"Index bent like hook",tip:"Hooked index"},
  Y:{desc:"Thumb & pinky out",tip:"Shaka sign"},
  Z:{desc:"Draw Z with index",tip:"Trace Z shape"},
};

// ── Achievements ─────────────────────────────────────────────────────────────
const ACHIEVEMENTS: Achievement[] = [
  {id:"first",    name:"First Sign",      icon:"✋", desc:"Recognize first sign",         check:s=>s.totalSigns>=1},
  {id:"ten",      name:"Getting Warm",    icon:"🔥", desc:"10 signs recognized",           check:s=>s.totalSigns>=10},
  {id:"century",  name:"Century",         icon:"💯", desc:"100 signs recognized",          check:s=>s.totalSigns>=100},
  {id:"sentence", name:"Wordsmith",       icon:"✍️", desc:"Build your first sentence",     check:s=>s.sentenceCount>=1},
  {id:"streak3",  name:"Consistent",      icon:"📅", desc:"3 day streak",                  check:s=>s.streak>=3},
  {id:"streak7",  name:"Week Warrior",    icon:"🗓️", desc:"7 day streak",                  check:s=>s.streak>=7},
  {id:"acc90",    name:"Sharp Eye",       icon:"🎯", desc:"Avg accuracy >90%",             check:s=>s.avgAccuracy>=0.9},
  {id:"all26",    name:"Alphabet Master", icon:"🔤", desc:"Recognize all 26 letters",      check:s=>s.unlockedLetters.length>=26},
  {id:"sessions5",name:"Dedicated",       icon:"⭐", desc:"Complete 5 sessions",            check:s=>s.totalSessions>=5},
  {id:"thousand", name:"Sign Master",     icon:"🏆", desc:"1000 signs recognized",         check:s=>s.totalSigns>=1000},
];

// ── Helpers ──────────────────────────────────────────────────────────────────
const DEFAULT_STATS: UserStats = {
  totalSigns:0, totalSessions:0, streak:0, maxStreak:0, lastActiveDate:"",
  avgAccuracy:0, accuracyHistory:[], unlockedLetters:[], sentenceCount:0,
};

function loadStats(): UserStats {
  try { const r=localStorage.getItem("s2s_stats"); return r?{...DEFAULT_STATS,...JSON.parse(r)}:{...DEFAULT_STATS}; }
  catch { return {...DEFAULT_STATS}; }
}
function saveStats(s: UserStats) { localStorage.setItem("s2s_stats",JSON.stringify(s)); }
function loadUnlocked(): string[] {
  try { return JSON.parse(localStorage.getItem("s2s_badges")||"[]"); } catch { return []; }
}
function saveUnlocked(ids: string[]) { localStorage.setItem("s2s_badges",JSON.stringify(ids)); }

function updateStreak(stats: UserStats): UserStats {
  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now()-86400000).toISOString().split("T")[0];
  let {streak,maxStreak,lastActiveDate} = stats;
  if (lastActiveDate===today) return stats;
  streak = lastActiveDate===yesterday ? streak+1 : 1;
  maxStreak = Math.max(maxStreak,streak);
  return {...stats,streak,maxStreak,lastActiveDate:today};
}

function confColor(c:number){ if(c>=0.85)return"#00ffaa"; if(c>=0.65)return"#facc15"; return"#f87171"; }

function getSignOfDay(){ const l=Object.keys(ASL_SIGNS); const k=l[Math.floor(Date.now()/86400000)%l.length]; return{letter:k,...ASL_SIGNS[k]}; }

// ── Main Component ────────────────────────────────────────────────────────────
export default function ScannerDashboard() {
  const [searchParams] = useSearchParams();
  const initialMode = (searchParams.get("mode") as Mode) || "webcam";

  const videoRef      = useRef<HTMLVideoElement>(null);
  const landmarkerRef = useRef<HandLandmarker|null>(null);
  const intervalRef   = useRef<ReturnType<typeof setInterval>>();
  const holdStartRef  = useRef<number|null>(null);
  const holdSignRef   = useRef<string|null>(null);
  const lastAddedRef  = useRef<number>(0);
  const fpsRef        = useRef(0);

  // ── Settings ──────────────────────────────────────────────────────────────
  const [darkMode,  setDarkMode]  = useState(initDarkMode);
  const [lang,      setLang]      = useState<Lang>(()=>(localStorage.getItem("s2s_lang") as Lang)||"en");
  const [ttsOn,     setTtsOn]     = useState(true);
  const [onboarded, setOnboarded] = useState(()=>localStorage.getItem("s2s_onboarded")==="true");
  const [showOnboard, setShowOnboard] = useState(()=>localStorage.getItem("s2s_onboarded")!=="true");
  const [dontAskSave, setDontAskSave] = useState(()=>localStorage.getItem("s2s_dont_ask_save")==="true");
  const [savePrompt, setSavePrompt] = useState<{sign:string;confidence:number}|null>(null);

  // ── Tab / mode ────────────────────────────────────────────────────────────
  const [tab,       setTab]       = useState<Tab>("scanner");
  const [mode,      setMode]      = useState<Mode>(initialMode);

  // ── Scanner state ─────────────────────────────────────────────────────────
  const [phase,      setPhase]      = useState<"idle"|"initializing"|"active"|"stopped"|"error">("idle");
  const [prediction, setPrediction] = useState<Prediction|null>(null);
  const [history,    setHistory]    = useState<string[]>([]);
  const [fps,        setFps]        = useState(0);
  const [ping,       setPing]       = useState<number|null>(null);
  const [error,      setError]      = useState("");
  const [uploadedImg,setUploadedImg] = useState<string|null>(null);
  const [isAnalyzing,setIsAnalyzing] = useState(false);

  // ── Sentence ──────────────────────────────────────────────────────────────
  const [sentence,    setSentence]    = useState("");
  const [holdProgress,setHoldProgress] = useState(0);
  const [holdSign,    setHoldSign]    = useState<string|null>(null);
  const [justAdded,   setJustAdded]   = useState(false);
  const [copied,      setCopied]      = useState(false);
  const [isSpeaking,  setIsSpeaking]  = useState(false);

  // ── Gamification ──────────────────────────────────────────────────────────
  const [stats,        setStats]       = useState<UserStats>(loadStats);
  const [unlocked,     setUnlocked]    = useState<string[]>(loadUnlocked);
  const [newBadge,     setNewBadge]    = useState<Achievement|null>(null);
  const [learnTarget,  setLearnTarget] = useState("A");
  const [learnScore,   setLearnScore]  = useState<number|null>(null);
  const [practiceMode, setPracticeMode]= useState(false);

  const t = T[lang];
  const signOfDay = getSignOfDay();

  // ── Auto theme based on time ──────────────────────────────────────────────
  useEffect(()=>{
    const check=()=>{
      if(localStorage.getItem("s2s_dark_manual")!==null) return;
      setDarkMode(shouldBeDark());
    };
    const timer = setInterval(check, 60000);
    check();
    return ()=>clearInterval(timer);
  },[]);

  // ── Theme ─────────────────────────────────────────────────────────────────
  const theme = {
    bg:      darkMode?"radial-gradient(ellipse at 20% 50%, #0a1628 0%, #020917 60%)":"radial-gradient(ellipse at 20% 50%, #dbeafe 0%, #f0f4ff 60%)",
    surface: darkMode?"#080f1e":"#ffffff",
    surface2:darkMode?"#0a1628":"#e8f0ff",
    border:  darkMode?"rgba(255,255,255,0.06)":"rgba(0,0,0,0.08)",
    text:    darkMode?"#e2e8f0":"#0f172a",
    textMuted:darkMode?"#475569":"#64748b",
    textDim: darkMode?"#334155":"#94a3b8",
    header:  darkMode?"rgba(2,9,23,0.85)":"rgba(255,255,255,0.85)",
    grid:    darkMode?"rgba(0,180,255,0.025)":"rgba(0,100,200,0.04)",
    accent:  "#00b4d8",
  };

  // ── Persist ───────────────────────────────────────────────────────────────
  useEffect(()=>{ localStorage.setItem("s2s_lang",lang); },[lang]);
  useEffect(()=>{ setFps(0); const t=setInterval(()=>{setFps(fpsRef.current); fpsRef.current=0;},1000); return()=>clearInterval(t); },[]);

  // ── TTS ───────────────────────────────────────────────────────────────────
  const speak = useCallback((text:string)=>{
    if(!ttsOn||!text) return;
    window.speechSynthesis.cancel();
    const u=new SpeechSynthesisUtterance(text); u.rate=0.9;
    u.onstart=()=>setIsSpeaking(true); u.onend=()=>setIsSpeaking(false);
    window.speechSynthesis.speak(u);
  },[ttsOn]);

  // ── Check achievements ────────────────────────────────────────────────────
  const checkAchievements = useCallback((s:UserStats, ul:string[])=>{
    for(const a of ACHIEVEMENTS){
      if(!ul.includes(a.id)&&a.check(s)){
        const updated=[...ul,a.id]; setUnlocked(updated); saveUnlocked(updated);
        setNewBadge(a); setTimeout(()=>setNewBadge(null),4000); return updated;
      }
    } return ul;
  },[]);

  // ── Update stats ──────────────────────────────────────────────────────────
  const updateStats = useCallback((sign:string, confidence:number)=>{
    setStats(prev=>{
      let u=updateStreak({...prev});
      u.totalSigns+=1;
      const hist=[...(u.accuracyHistory||[]),confidence].slice(-50);
      u.accuracyHistory=hist;
      u.avgAccuracy=hist.reduce((a,b)=>a+b,0)/hist.length;
      const letter=sign.toUpperCase();
      if(letter.length===1&&letter>="A"&&letter<="Z"&&!u.unlockedLetters.includes(letter))
        u.unlockedLetters=[...u.unlockedLetters,letter];
      saveStats(u); checkAchievements(u,unlocked); return u;
    });
  },[unlocked,checkAchievements]);

  // ── Sentence builder ──────────────────────────────────────────────────────
  const addToSentence = useCallback((sign:string)=>{
    const now=Date.now();
    if(now-lastAddedRef.current<COOLDOWN_MS) return;
    lastAddedRef.current=now;
    setSentence(prev=>{
      if(sign==="del") return prev.slice(0,-1);
      if(sign==="space") return prev+" ";
      return prev+(prev.length===0?sign.toUpperCase():sign.toLowerCase());
    });
    setStats(prev=>{ const u={...prev,sentenceCount:prev.sentenceCount+1}; saveStats(u); return u; });
    setJustAdded(true); setTimeout(()=>setJustAdded(false),400);
    if(sign!=="del"&&sign!=="space") speak(sign);
  },[speak]);

  // ── Hold-to-confirm ───────────────────────────────────────────────────────
  const updateHold = useCallback((sign:string, confidence:number)=>{
    if(confidence<CONFIDENCE_GATE){
      holdStartRef.current=null; holdSignRef.current=null; setHoldSign(null); setHoldProgress(0); return;
    }
    if(holdSignRef.current!==sign){
      holdStartRef.current=Date.now(); holdSignRef.current=sign; setHoldSign(sign); setHoldProgress(0); return;
    }
    const elapsed=Date.now()-(holdStartRef.current??Date.now());
    const progress=Math.min((elapsed/HOLD_DURATION_MS)*100,100);
    setHoldProgress(progress);
    if(progress>=100){ addToSentence(sign); holdStartRef.current=Date.now(); setHoldProgress(0); }
  },[addToSentence]);

  // ── MediaPipe ─────────────────────────────────────────────────────────────
  const loadMediaPipe = useCallback(async()=>{
    if(landmarkerRef.current) return;
    const vision=await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
    );
    landmarkerRef.current=await HandLandmarker.createFromOptions(vision,{
      baseOptions:{ modelAssetPath:"https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task", delegate:"GPU" },
      runningMode:"IMAGE", numHands:1,
    });
  },[]);

  const getToken=useCallback(async()=>{ const u=auth.currentUser; if(!u) return"dev"; return u.getIdToken(false); },[]);

  const sendLandmarks=useCallback(async(landmarks:number[], forLearn=false)=>{
    try{
      const token=await getToken(); const t0=performance.now();
      const headers:Record<string,string>={"Content-Type":"application/json"};
      if(token!=="dev") headers["Authorization"]=`Bearer ${token}`;
      const res=await fetch(`${RAILWAY_URL}/predict`,{method:"POST",headers,body:JSON.stringify({landmarks})});
      setPing(Math.round(performance.now()-t0)); fpsRef.current+=1;
      const data=await res.json(); if(!data.success) return;
      const pred:Prediction={topSign:data.top_sign,confidence:data.confidence,topFive:data.top_five||[],handDetected:true,latencyMs:data.latency_ms};
      setPrediction(pred);
      updateHold(data.top_sign,data.confidence);
      updateStats(data.top_sign,data.confidence);
      if(forLearn) setLearnScore(data.top_sign===learnTarget?data.confidence:0);
      if(data.confidence>=0.78) setHistory(prev=>prev[prev.length-1]===data.top_sign?prev:[...prev.slice(-13),data.top_sign]);
    }catch(e){ console.warn(e); }
  },[getToken,updateHold,updateStats,learnTarget]);

  // ── Upload with save popup ────────────────────────────────────────────────
  const handleFileUpload=useCallback(async(file:File, forLearn=false)=>{
    setIsAnalyzing(true); setPrediction(null); setError(""); setLearnScore(null);
    try{
      await loadMediaPipe();
      if(!landmarkerRef.current) throw new Error("MediaPipe not loaded");
      await landmarkerRef.current.setOptions({runningMode:"IMAGE"});
      const url=URL.createObjectURL(file);
      if(!forLearn) setUploadedImg(url);
      const img=new Image(); img.src=url;
      await new Promise(r=>img.onload=r);
      const result=landmarkerRef.current.detect(img);
      if(!result.landmarks?.length){ setError(t.noHand); setIsAnalyzing(false); return; }
      const lms=result.landmarks[0].flatMap(lm=>[lm.x,lm.y,lm.z]);
      // Get prediction first
      const token=await getToken(); const t0=performance.now();
      const headers:Record<string,string>={"Content-Type":"application/json"};
      if(token!=="dev") headers["Authorization"]=`Bearer ${token}`;
      const res=await fetch(`${RAILWAY_URL}/predict`,{method:"POST",headers,body:JSON.stringify({landmarks:lms})});
      setPing(Math.round(performance.now()-t0));
      const data=await res.json();
      if(!data.success){ setIsAnalyzing(false); return; }
      const pred:Prediction={topSign:data.top_sign,confidence:data.confidence,topFive:data.top_five||[],handDetected:true,latencyMs:data.latency_ms};
      setPrediction(pred);
      updateStats(data.top_sign,data.confidence);
      if(forLearn){ setLearnScore(data.top_sign===learnTarget?data.confidence:0); }
      else{
        // Show save popup (unless don't ask again)
        if(!dontAskSave && data.confidence>=0.70 && data.top_sign!=="del" && data.top_sign!=="space"){
          setSavePrompt({sign:data.top_sign,confidence:data.confidence});
        }
      }
    }catch(e:any){ setError(e.message); }
    finally{ setIsAnalyzing(false); }
  },[loadMediaPipe,getToken,updateStats,learnTarget,dontAskSave,t.noHand]);

  const handleSaveYes=()=>{ if(savePrompt){ addToSentence(savePrompt.sign); } setSavePrompt(null); };
  const handleSaveNo=()=>{ setSavePrompt(null); };
  const handleDontAsk=(checked:boolean)=>{ setDontAskSave(checked); localStorage.setItem("s2s_dont_ask_save",String(checked)); };

  // ── Webcam ────────────────────────────────────────────────────────────────
  const startCamera=useCallback(async()=>{
    const stream=await navigator.mediaDevices.getUserMedia({video:{width:640,height:480,facingMode:"user"},audio:false});
    if(videoRef.current){ videoRef.current.srcObject=stream; await videoRef.current.play(); }
  },[]);

  const processFrame=useCallback(async()=>{
    const video=videoRef.current; const lm=landmarkerRef.current;
    if(!video||!lm||video.readyState<2) return;
    await lm.setOptions({runningMode:"VIDEO"});
    const result=lm.detectForVideo(video,performance.now());
    if(!result.landmarks?.length){
      setPrediction(prev=>prev?{...prev,handDetected:false}:null);
      holdStartRef.current=null; holdSignRef.current=null; setHoldSign(null); setHoldProgress(0); return;
    }
    await sendLandmarks(result.landmarks[0].flatMap(l=>[l.x,l.y,l.z]));
  },[sendLandmarks]);

  const initScanner=useCallback(async()=>{
    setPhase("initializing"); setError("");
    try{
      await loadMediaPipe(); await startCamera();
      setStats(prev=>{ const u={...prev,totalSessions:prev.totalSessions+1}; saveStats(u); return u; });
      setPhase("active");
      intervalRef.current=setInterval(processFrame,FRAME_INTERVAL_MS);
    }catch(e:any){ setError(e.message||"Failed"); setPhase("error"); }
  },[loadMediaPipe,startCamera,processFrame]);

  const stopScanner=useCallback(()=>{
    clearInterval(intervalRef.current);
    (videoRef.current?.srcObject as MediaStream)?.getTracks().forEach(t=>t.stop());
    if(videoRef.current) videoRef.current.srcObject=null;
    setPhase("stopped"); setPrediction(null); setHoldSign(null); setHoldProgress(0);
  },[]);

  const switchMode=(m:Mode)=>{ stopScanner(); setPrediction(null); setUploadedImg(null); setError(""); setMode(m); setPhase("idle"); };

  const shareAsImage=useCallback(async()=>{
    if(!prediction?.handDetected) return;
    const canvas=document.createElement("canvas"); canvas.width=400; canvas.height=400;
    const ctx=canvas.getContext("2d")!;
    ctx.fillStyle="#020917"; ctx.fillRect(0,0,400,400);
    const grad=ctx.createRadialGradient(200,200,0,200,200,180);
    grad.addColorStop(0,"rgba(0,180,216,0.15)"); grad.addColorStop(1,"transparent");
    ctx.fillStyle=grad; ctx.beginPath(); ctx.arc(200,200,180,0,Math.PI*2); ctx.fill();
    ctx.fillStyle="#00b4d8"; ctx.font="bold 180px monospace"; ctx.textAlign="center"; ctx.textBaseline="middle";
    ctx.fillText(prediction.topSign==="space"?"⎵":prediction.topSign==="del"?"⌫":prediction.topSign,200,190);
    ctx.fillStyle="#475569"; ctx.font="22px monospace";
    ctx.fillText(`${(prediction.confidence*100).toFixed(0)}% confidence`,200,315);
    ctx.fillStyle="#334155"; ctx.font="14px monospace";
    ctx.fillText("Sign2Sign AI",200,370);
    const link=document.createElement("a");
    link.download=`sign2sign-${prediction.topSign}-${Date.now()}.png`;
    link.href=canvas.toDataURL("image/png"); link.click();
  },[prediction]);

  useEffect(()=>()=>stopScanner(),[stopScanner]);

  const isActive=phase==="active";
  const RING_R=50; const RING_C=2*Math.PI*RING_R;
  const ringDash=RING_C-(holdProgress/100)*RING_C;

  // ════════ RENDER ═══════════════════════════════════════════════════════════
  return(
    <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",background:theme.bg,fontFamily:"'JetBrains Mono',monospace",color:theme.text,transition:"background 0.4s"}}>

      {/* Grid */}
      <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0,backgroundImage:`linear-gradient(${theme.grid} 1px,transparent 1px),linear-gradient(90deg,${theme.grid} 1px,transparent 1px)`,backgroundSize:"48px 48px"}}/>

      {/* ── SAVE LETTER POPUP ── */}
      <AnimatePresence>
        {savePrompt&&(
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            style={{position:"fixed",inset:0,zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,0.7)",backdropFilter:"blur(8px)"}}>
            <motion.div initial={{scale:0.85,y:20}} animate={{scale:1,y:0}} exit={{scale:0.85,y:20}}
              style={{background:theme.surface,borderRadius:20,padding:32,maxWidth:360,width:"90%",border:`1px solid ${theme.border}`,display:"flex",flexDirection:"column",alignItems:"center",gap:16,textAlign:"center"}}>
              {/* Big sign preview */}
              <div style={{width:80,height:80,borderRadius:16,display:"flex",alignItems:"center",justifyContent:"center",background:darkMode?"#0a2040":"#dbeafe",border:`2px solid ${confColor(savePrompt.confidence)}30`}}>
                <span style={{fontSize:44,fontWeight:700,color:confColor(savePrompt.confidence)}}>{savePrompt.sign}</span>
              </div>
              <div>
                <h3 style={{fontSize:18,fontWeight:700,color:theme.text,margin:"0 0 6px"}}>{t.saveTitle}</h3>
                <p style={{fontSize:12,color:theme.textMuted,margin:0}}>
                  Detected <strong style={{color:confColor(savePrompt.confidence)}}>{savePrompt.sign}</strong> with {(savePrompt.confidence*100).toFixed(0)}% confidence
                </p>
              </div>
              <div style={{display:"flex",gap:10,width:"100%"}}>
                <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.97}}
                  onClick={handleSaveYes}
                  style={{flex:1,padding:"11px",borderRadius:10,fontWeight:700,fontSize:12,border:"none",cursor:"pointer",background:"linear-gradient(135deg,#0077b6,#00b4d8)",color:"white",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
                  <Plus size={14}/>{t.saveYes}
                </motion.button>
                <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.97}}
                  onClick={handleSaveNo}
                  style={{flex:1,padding:"11px",borderRadius:10,fontWeight:700,fontSize:12,cursor:"pointer",background:"transparent",border:`1px solid ${theme.border}`,color:theme.textMuted}}>
                  {t.saveNo}
                </motion.button>
              </div>
              {/* Don't ask again */}
              <label style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",fontSize:11,color:theme.textDim}}>
                <input type="checkbox" checked={dontAskSave} onChange={e=>handleDontAsk(e.target.checked)}
                  style={{accentColor:"#00b4d8"}}/>
                {t.saveDontAsk}
              </label>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── ONBOARDING ── */}
      <AnimatePresence>
        {showOnboard&&(
          <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            style={{position:"fixed",inset:0,zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(0,0,0,0.85)",backdropFilter:"blur(8px)"}}>
            <motion.div initial={{scale:0.8,y:40}} animate={{scale:1,y:0}}
              style={{background:theme.surface,borderRadius:24,padding:36,maxWidth:420,width:"90%",border:`1px solid ${theme.border}`,display:"flex",flexDirection:"column",alignItems:"center",gap:18}}>
              <div style={{width:56,height:56,borderRadius:14,background:"linear-gradient(135deg,#00b4d8,#0077b6)",display:"flex",alignItems:"center",justifyContent:"center"}}>
                <Hand size={28} color="white"/>
              </div>
              <h2 style={{fontSize:20,fontWeight:700,textAlign:"center",margin:0}}>{t.welcome}</h2>
              <div style={{width:"100%",display:"flex",flexDirection:"column",gap:10}}>
                {[t.step1,t.step2,t.step3].map((step,i)=>(
                  <div key={i} style={{display:"flex",alignItems:"flex-start",gap:10,padding:"10px 14px",borderRadius:10,background:theme.surface2,border:`1px solid ${theme.border}`}}>
                    <span style={{width:22,height:22,borderRadius:"50%",flexShrink:0,background:"linear-gradient(135deg,#0077b6,#00b4d8)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:"white"}}>{i+1}</span>
                    <span style={{fontSize:12,color:theme.textMuted,lineHeight:1.5}}>{step}</span>
                  </div>
                ))}
              </div>
              <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.97}}
                onClick={()=>{setShowOnboard(false);localStorage.setItem("s2s_onboarded","true");}}
                style={{width:"100%",padding:"13px",borderRadius:12,fontWeight:700,fontSize:12,letterSpacing:"0.2em",border:"none",cursor:"pointer",background:"linear-gradient(135deg,#0077b6,#00b4d8)",color:"white"}}>
                {t.getStarted} →
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── BADGE POPUP ── */}
      <AnimatePresence>
        {newBadge&&(
          <motion.div initial={{x:300,opacity:0}} animate={{x:0,opacity:1}} exit={{x:300,opacity:0}}
            style={{position:"fixed",bottom:24,right:24,zIndex:50,background:theme.surface,border:"1px solid rgba(0,180,216,0.3)",borderRadius:16,padding:"14px 18px",display:"flex",alignItems:"center",gap:10,boxShadow:"0 8px 32px rgba(0,180,216,0.2)"}}>
            <span style={{fontSize:28}}>{newBadge.icon}</span>
            <div>
              <p style={{fontSize:10,color:theme.accent,letterSpacing:"0.2em",margin:0}}>ACHIEVEMENT UNLOCKED</p>
              <p style={{fontSize:13,fontWeight:700,color:theme.text,margin:0}}>{newBadge.name}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── HEADER ── */}
      <header style={{position:"relative",zIndex:10,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 20px",borderBottom:`1px solid ${theme.border}`,background:theme.header,backdropFilter:"blur(12px)"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:30,height:30,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",background:"linear-gradient(135deg,#00b4d8,#0077b6)"}}>
            <Hand size={15} color="white"/>
          </div>
          <span style={{fontSize:11,letterSpacing:"0.2em",color:theme.textMuted,fontWeight:700}}>SIGN2SIGN AI</span>
          {stats.streak>0&&<span style={{display:"flex",alignItems:"center",gap:3,fontSize:11,color:"#f97316",background:"#f9731615",padding:"2px 8px",borderRadius:20,border:"1px solid #f9731630"}}><Flame size={11}/>{stats.streak}</span>}
        </div>

        {/* Tabs */}
        <div style={{display:"flex",gap:2}}>
          {([
            {id:"scanner",icon:<Scan size={12}/>,label:t.scanner},
            {id:"learn",icon:<BookOpen size={12}/>,label:t.learn},
            {id:"progress",icon:<BarChart2 size={12}/>,label:t.progress},
            {id:"leaderboard",icon:<Trophy size={12}/>,label:t.leaderboard},
          ] as const).map(({id,icon,label})=>(
            <button key={id} onClick={()=>setTab(id)}
              style={{padding:"5px 12px",borderRadius:8,fontSize:10,fontWeight:700,letterSpacing:"0.12em",cursor:"pointer",border:"none",background:tab===id?"linear-gradient(135deg,#0077b6,#00b4d8)":"transparent",color:tab===id?"white":theme.textMuted,display:"flex",alignItems:"center",gap:4,transition:"all 0.2s"}}>
              {icon}{label}
            </button>
          ))}
        </div>

        <div style={{display:"flex",alignItems:"center",gap:8}}>
          {ping!==null&&<span style={{fontSize:10,color:theme.textMuted}}>{ping}ms</span>}
          {isActive&&<span style={{fontSize:10,color:"#4ade80"}}>{fps}fps</span>}
          {/* Language selector */}
          <select value={lang} onChange={e=>setLang(e.target.value as Lang)}
            style={{background:theme.surface2,border:`1px solid ${theme.border}`,color:theme.text,borderRadius:6,padding:"2px 4px",fontSize:10,cursor:"pointer"}}>
            <option value="en">🇬🇧 EN</option>
            <option value="es">🇪🇸 ES</option>
            <option value="ar">🇸🇦 AR</option>
            <option value="fr">🇫🇷 FR</option>
            <option value="de">🇩🇪 DE</option>
            <option value="pt">🇧🇷 PT</option>
            <option value="hi">🇮🇳 HI</option>
            <option value="ja">🇯🇵 JA</option>
            <option value="zh">🇨🇳 ZH</option>
            <option value="tr">🇹🇷 TR</option>
            <option value="it">🇮🇹 IT</option>
          </select>
          <button onClick={()=>setTtsOn(!ttsOn)} style={{background:"none",border:"none",cursor:"pointer",color:ttsOn?theme.accent:theme.textDim,display:"flex"}}>
            {ttsOn?<Volume2 size={15}/>:<VolumeX size={15}/>}
          </button>
          {/* Dark/light toggle — sets manual preference */}
          <button onClick={()=>{const next=!darkMode; setDarkMode(next); localStorage.setItem("s2s_dark_manual",String(next));}}
            style={{background:"none",border:"none",cursor:"pointer",color:theme.textMuted,display:"flex"}} title="Toggle theme (overrides auto)">
            {darkMode?<Sun size={15}/>:<Moon size={15}/>}
          </button>
          {auth.currentUser&&<button onClick={()=>signOut(auth)} style={{background:"none",border:"none",cursor:"pointer",color:theme.textMuted,display:"flex",alignItems:"center",gap:3,fontSize:10}}><LogOut size={12}/></button>}
        </div>
      </header>

      {/* ── CONTENT ── */}
      <div style={{position:"relative",zIndex:10,flex:1,overflow:"hidden"}}>

        {/* ══ SCANNER TAB ══ */}
        {tab==="scanner"&&(
          <div
  style={{
    height:"100%",
    display:"flex",
    flexDirection: window.innerWidth < 768 ? "column" : "row"
  }}
>
            <div style={{flex:1,display:"flex",flexDirection:"column"}}>
              {/* Mode toggle */}
              <div style={{display:"flex",gap:6,padding:"10px 14px 0"}}>
                {(["webcam","upload"] as Mode[]).map(m=>(
                  <button key={m} onClick={()=>switchMode(m)}
                    style={{padding:"5px 14px",borderRadius:8,fontSize:10,fontWeight:700,letterSpacing:"0.15em",cursor:"pointer",border:"none",background:mode===m?"linear-gradient(135deg,#0077b6,#00b4d8)":theme.surface2,color:mode===m?"white":theme.textMuted,display:"flex",alignItems:"center",gap:4}}>
                    {m==="webcam"?<Camera size={11}/>:<Upload size={11}/>}{m.toUpperCase()}
                  </button>
                ))}
              </div>

              {/* Camera */}
              {mode==="webcam"?(
                <div style={{position:"relative",flex:1,margin:14,borderRadius:18,overflow:"hidden",border:`1px solid ${isActive?"rgba(0,180,216,0.2)":theme.border}`,background:darkMode?"#020917":"#e2e8f0",minHeight:240}}>
                  <video ref={videoRef} muted playsInline style={{width:"100%",height:"100%",objectFit:"cover",transform:"scaleX(-1)"}}/>
                  {isActive&&<motion.div style={{position:"absolute",left:0,right:0,height:2,pointerEvents:"none",background:"linear-gradient(90deg,transparent,rgba(0,180,216,0.4),#00b4d8,rgba(0,180,216,0.4),transparent)"}} animate={{top:["4%","96%","4%"]}} transition={{duration:3,repeat:Infinity,ease:"linear"}}/>}
                  {isActive&&holdSign&&(
                    <div style={{position:"absolute",bottom:14,left:"50%",transform:"translateX(-50%)",display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                      <svg width={116} height={116} style={{transform:"rotate(-90deg)"}}>
                        <circle cx={58} cy={58} r={RING_R} fill="rgba(2,9,23,0.75)" stroke="rgba(255,255,255,0.1)" strokeWidth={4}/>
                        <circle cx={58} cy={58} r={RING_R} fill="none" stroke="#00b4d8" strokeWidth={4} strokeDasharray={RING_C} strokeDashoffset={ringDash} strokeLinecap="round" style={{transition:"stroke-dashoffset 0.1s linear"}}/>
                        <text x={58} y={58} textAnchor="middle" dominantBaseline="middle" fill="white" fontSize={26} fontWeight={700} style={{transform:"rotate(90deg)",transformOrigin:"58px 58px"}}>{holdSign==="space"?"⎵":holdSign==="del"?"⌫":holdSign}</text>
                      </svg>
                    </div>
                  )}
                  {isActive&&[{top:10,left:10,borderTop:"2px solid #00b4d8",borderLeft:"2px solid #00b4d8",borderRadius:"8px 0 0 0"},{top:10,right:10,borderTop:"2px solid #00b4d8",borderRight:"2px solid #00b4d8",borderRadius:"0 8px 0 0"},{bottom:10,left:10,borderBottom:"2px solid #00b4d8",borderLeft:"2px solid #00b4d8",borderRadius:"0 0 0 8px"},{bottom:10,right:10,borderBottom:"2px solid #00b4d8",borderRight:"2px solid #00b4d8",borderRadius:"0 0 8px 0"}].map((s,i)=><div key={i} style={{position:"absolute",width:22,height:22,...s}}/>)}
                  <AnimatePresence>
                    {!isActive&&(
                      <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
                        style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:12,background:darkMode?"rgba(2,9,23,0.93)":"rgba(240,244,255,0.93)"}}>
                        {phase==="initializing"?(<><motion.div animate={{rotate:360}} transition={{repeat:Infinity,duration:1.5,ease:"linear"}} style={{width:44,height:44,borderRadius:"50%",border:"2px solid rgba(0,180,216,0.15)",borderTopColor:"#00b4d8"}}/><p style={{fontSize:10,letterSpacing:"0.3em",color:"#00b4d8"}}>LOADING AI…</p></>):phase==="error"?(<p style={{color:"#f87171",fontSize:11,textAlign:"center",maxWidth:240}}>⚠ {error}</p>):(<><Camera size={44} color={theme.textDim}/><p style={{fontSize:10,letterSpacing:"0.3em",color:theme.textDim}}>SCANNER OFFLINE</p></>)}
                      </motion.div>
                    )}
                  </AnimatePresence>
                  {isActive&&prediction?.latencyMs&&<div style={{position:"absolute",top:10,right:10,fontSize:9,padding:"2px 7px",borderRadius:4,background:"rgba(2,9,23,0.75)",color:"#475569",display:"flex",alignItems:"center",gap:3}}><Clock size={8}/>{prediction.latencyMs}ms</div>}
                </div>
              ):(
                <div style={{flex:1,margin:14,display:"flex",flexDirection:"column",gap:10}}>
                  <label style={{flex:uploadedImg?0:1,minHeight:uploadedImg?"auto":240,borderRadius:18,border:`2px dashed ${theme.accent}40`,background:theme.surface,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:8,cursor:"pointer",padding:16}}>
                    <input type="file" accept="image/*" style={{display:"none"}} onChange={e=>e.target.files?.[0]&&handleFileUpload(e.target.files[0])}/>
                    <Upload size={32} color={theme.textDim}/>
                    <p style={{fontSize:11,color:theme.textMuted}}>Click to upload a hand sign image</p>
                    <div style={{padding:"6px 16px",borderRadius:8,fontSize:10,fontWeight:700,background:"linear-gradient(135deg,#0077b6,#00b4d8)",color:"white"}}>{t.upload}</div>
                  </label>
                  {uploadedImg&&(
                    <div style={{position:"relative",borderRadius:16,overflow:"hidden",border:`1px solid ${theme.border}`,flex:1,minHeight:200}}>
                      <img src={uploadedImg} alt="upload" style={{width:"100%",height:"100%",objectFit:"contain",maxHeight:320}}/>
                      {isAnalyzing&&<div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:10,background:"rgba(2,9,23,0.85)"}}><motion.div animate={{rotate:360}} transition={{repeat:Infinity,duration:1,ease:"linear"}} style={{width:32,height:32,borderRadius:"50%",border:"2px solid rgba(0,180,216,0.2)",borderTopColor:"#00b4d8"}}/><p style={{fontSize:10,color:"#00b4d8"}}>ANALYZING…</p></div>}
                      {error&&<div style={{position:"absolute",bottom:8,left:8,right:8,padding:"7px 12px",borderRadius:8,background:"rgba(239,68,68,0.15)",border:"1px solid rgba(239,68,68,0.3)",color:"#fca5a5",fontSize:10,textAlign:"center"}}>{error}</div>}
                    </div>
                  )}
                </div>
              )}

              {/* Sentence builder */}
              <div style={{margin:"0 14px 14px",padding:14,borderRadius:16,background:theme.surface,border:`1px solid ${theme.border}`}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                  <span style={{fontSize:9,letterSpacing:"0.25em",color:theme.textDim}}>{t.sentence}</span>
                  <div style={{display:"flex",gap:4}}>
                    {[".",  "!","?",","].map(p=><button key={p} onClick={()=>setSentence(prev=>prev+p)} style={{padding:"1px 7px",borderRadius:5,fontSize:12,fontWeight:700,background:theme.surface2,border:`1px solid ${theme.border}`,color:theme.textMuted,cursor:"pointer"}}>{p}</button>)}
                    <button onClick={()=>speak(sentence)} disabled={!sentence.trim()} style={{padding:"1px 7px",borderRadius:5,fontSize:9,cursor:"pointer",background:isSpeaking?"#0077b6":theme.surface2,border:`1px solid ${theme.border}`,color:isSpeaking?"white":theme.textMuted,display:"flex",alignItems:"center",gap:2}}><Mic size={9}/>{isSpeaking?"…":t.speak}</button>
                    <button onClick={()=>{navigator.clipboard.writeText(sentence);setCopied(true);setTimeout(()=>setCopied(false),2000);}} disabled={!sentence} style={{padding:"1px 7px",borderRadius:5,fontSize:9,cursor:"pointer",background:copied?"#00ffaa20":theme.surface2,border:`1px solid ${copied?"#00ffaa40":theme.border}`,color:copied?"#00ffaa":theme.textMuted,display:"flex",alignItems:"center",gap:2}}>{copied?<Check size={9}/>:<Copy size={9}/>}{t.copy}</button>
                    <button onClick={()=>setSentence("")} style={{padding:"1px 7px",borderRadius:5,fontSize:9,cursor:"pointer",background:theme.surface2,border:`1px solid ${theme.border}`,color:theme.textMuted,display:"flex",alignItems:"center",gap:2}}><Trash2 size={9}/>{t.clear}</button>
                  </div>
                </div>
                <motion.div animate={{backgroundColor:justAdded?"rgba(0,255,170,0.06)":"transparent"}} transition={{duration:0.3}}
                  style={{minHeight:44,padding:"8px 12px",borderRadius:8,border:`1px solid ${justAdded?"rgba(0,255,170,0.25)":theme.border}`,fontSize:18,fontWeight:700,color:theme.text,fontFamily:"monospace",wordBreak:"break-all",lineHeight:1.5}}>
                  {sentence||<span style={{color:theme.textDim,fontSize:11,fontWeight:400}}>{t.hold}</span>}
                  {sentence&&<span style={{opacity:0.4,animation:"blink 1s infinite"}}>|</span>}
                </motion.div>
              </div>
            </div>

            {/* Right panel */}
            <div style={{width: window.innerWidth < 768 ? "100%" : 270,,display:"flex",flexDirection:"column",gap:12,padding:14,borderLeft: window.innerWidth < 768 ? "none" : `1px solid ${theme.border}`}}>
              {/* Big sign */}
              <div style={{borderRadius:18,padding:18,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",textAlign:"center",gap:8,background:theme.surface,border:`1px solid ${theme.border}`,minHeight:180}}>
                <span style={{fontSize:9,letterSpacing:"0.3em",color:theme.textDim}}>{t.detected}</span>
                <AnimatePresence mode="wait">
                  {prediction?.handDetected?(
                    <motion.div key={prediction.topSign} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:6}}>
                      <div style={{width:84,height:84,borderRadius:14,display:"flex",alignItems:"center",justifyContent:"center",background:darkMode?"#0a2040":"#dbeafe",border:`2px solid ${confColor(prediction.confidence)}25`,boxShadow:`0 0 24px ${confColor(prediction.confidence)}12`}}>
                        <span style={{fontSize:prediction.topSign.length>2?24:48,color:confColor(prediction.confidence),fontWeight:700}}>{prediction.topSign==="space"?"⎵":prediction.topSign==="del"?"⌫":prediction.topSign}</span>
                      </div>
                      <span style={{fontSize:16,fontWeight:700,color:confColor(prediction.confidence)}}>{prediction.topSign==="space"?"SPACE":prediction.topSign==="del"?"DELETE":prediction.topSign}</span>
                      <span style={{fontSize:10,padding:"2px 9px",borderRadius:20,background:`${confColor(prediction.confidence)}10`,border:`1px solid ${confColor(prediction.confidence)}20`,color:confColor(prediction.confidence)}}>{(prediction.confidence*100).toFixed(1)}%</span>
                      {holdSign===prediction.topSign&&holdProgress>0&&<div style={{width:"100%",height:3,borderRadius:3,background:theme.surface2,overflow:"hidden"}}><motion.div style={{height:"100%",borderRadius:3,background:"linear-gradient(90deg,#0077b6,#00ffaa)"}} animate={{width:`${holdProgress}%`}} transition={{duration:0.1}}/></div>}
                      <button onClick={shareAsImage} style={{padding:"3px 10px",borderRadius:7,fontSize:9,fontWeight:700,background:theme.surface2,border:`1px solid ${theme.border}`,color:theme.textMuted,cursor:"pointer",display:"flex",alignItems:"center",gap:3}}><Share2 size={9}/>{t.share}</button>
                    </motion.div>
                  ):(
                    <motion.div key="idle" initial={{opacity:0}} animate={{opacity:1}} style={{opacity:0.25,display:"flex",flexDirection:"column",alignItems:"center",gap:6}}>
                      <Hand size={34} color={theme.textMuted}/>
                      <p style={{fontSize:10,color:theme.textMuted}}>{mode==="upload"?"Upload image…":isActive?"Show a hand sign…":"—"}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Confidence bars */}
              <div style={{borderRadius:14,padding:12,background:theme.surface,border:`1px solid ${theme.border}`}}>
                <span style={{fontSize:9,letterSpacing:"0.25em",color:theme.textDim,display:"block",marginBottom:8}}>{t.top}</span>
                {(prediction?.topFive?.length>0?prediction.topFive:Array.from({length:5},()=>({sign:"—",confidence:0}))).map(({sign,confidence},i)=>(
                  <div key={i} style={{display:"flex",alignItems:"center",gap:6,marginBottom:7}}>
                    <span style={{width:28,fontSize:10,fontWeight:700,color:i===0?"#7dd3fc":theme.textDim}}>{sign}</span>
                    <div style={{flex:1,height:4,borderRadius:4,background:theme.surface2,overflow:"hidden"}}><motion.div style={{height:"100%",borderRadius:4,background:i===0?"linear-gradient(90deg,#0077b6,#00b4d8)":theme.textDim+"40"}} animate={{width:`${confidence*100}%`}} transition={{duration:0.3}}/></div>
                    <span style={{width:28,fontSize:9,textAlign:"right",color:i===0?"#7dd3fc":theme.textDim}}>{confidence>0?`${(confidence*100).toFixed(0)}%`:""}</span>
                  </div>
                ))}
              </div>

              {/* History */}
              <div style={{borderRadius:14,padding:12,background:theme.surface,border:`1px solid ${theme.border}`,flex:1}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:7}}>
                  <span style={{fontSize:9,letterSpacing:"0.25em",color:theme.textDim}}>{t.history}</span>
                  <button onClick={()=>setHistory([])} style={{background:"none",border:"none",cursor:"pointer",color:theme.textDim,display:"flex",alignItems:"center",fontSize:9}}><RotateCcw size={8}/></button>
                </div>
                <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
                  <AnimatePresence>
                    {history.length>0?history.map((sign,i)=>(<motion.span key={`${sign}-${i}`} initial={{scale:0}} animate={{scale:1}} style={{padding:"2px 8px",borderRadius:6,fontSize:11,fontWeight:700,background:theme.surface2,border:`1px solid ${theme.accent}30`,color:"#7dd3fc"}}>{sign==="space"?"⎵":sign==="del"?"⌫":sign}</motion.span>)):<span style={{color:theme.textDim,fontSize:10}}>Signs appear here…</span>}
                  </AnimatePresence>
                </div>
              </div>

              {/* Control */}
              {mode==="webcam"&&(phase!=="active"?(
                <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.98}} onClick={initScanner} disabled={phase==="initializing"}
                  style={{width:"100%",padding:"12px",borderRadius:12,fontWeight:700,fontSize:10,letterSpacing:"0.2em",border:"none",cursor:phase==="initializing"?"wait":"pointer",background:phase==="initializing"?theme.surface2:"linear-gradient(135deg,#0077b6,#00b4d8)",color:phase==="initializing"?theme.textMuted:"white",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
                  <Zap size={13}/>{phase==="initializing"?t.loading:t.init}
                </motion.button>
              ):(
                <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.98}} onClick={stopScanner}
                  style={{width:"100%",padding:"12px",borderRadius:12,fontWeight:700,fontSize:10,letterSpacing:"0.2em",cursor:"pointer",background:"transparent",border:"1px solid rgba(239,68,68,0.25)",color:"#ef4444",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
                  <ZapOff size={13}/>{t.stop}
                </motion.button>
              ))}
              {mode==="upload"&&(
                <label style={{width:"100%",padding:"12px",borderRadius:12,fontWeight:700,fontSize:10,letterSpacing:"0.2em",cursor:"pointer",background:"linear-gradient(135deg,#0077b6,#00b4d8)",color:"white",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
                  <input type="file" accept="image/*" style={{display:"none"}} onChange={e=>e.target.files?.[0]&&handleFileUpload(e.target.files[0])}/>
                  <Upload size={13}/>{t.upload}
                </label>
              )}
            </div>
          </div>
        )}

        {/* ══ LEARN TAB ══ */}
        {tab==="learn"&&(
          <div style={{padding:24,display:"flex",flexDirection:"column",gap:20,overflowY:"auto",height:"100%"}}>
            {/* Sign of day */}
            <div style={{borderRadius:20,padding:28,background:theme.surface,border:"1px solid rgba(0,180,216,0.15)",display:"flex",alignItems:"center",gap:24}}>
              <div style={{width:110,height:110,borderRadius:18,display:"flex",alignItems:"center",justifyContent:"center",background:"linear-gradient(135deg,rgba(0,119,182,0.15),rgba(0,180,216,0.15))",border:"2px solid rgba(0,180,216,0.2)",flexShrink:0}}>
                <span style={{fontSize:64,fontWeight:700,color:"#00b4d8"}}>{signOfDay.letter}</span>
              </div>
              <div style={{flex:1}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}><Star size={13} color="#facc15"/><span style={{fontSize:10,letterSpacing:"0.25em",color:"#facc15"}}>{t.signOfDay}</span></div>
                <h2 style={{fontSize:26,fontWeight:700,margin:"0 0 8px",color:theme.text}}>Letter "{signOfDay.letter}"</h2>
                <p style={{fontSize:13,color:theme.textMuted,margin:"0 0 6px",lineHeight:1.6}}>{signOfDay.desc}</p>
                <p style={{fontSize:11,color:theme.accent,margin:0}}>💡 {signOfDay.tip}</p>
              </div>
            </div>

            {/* Practice */}
            <div style={{borderRadius:20,padding:24,background:theme.surface,border:`1px solid ${theme.border}`}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
                <div style={{display:"flex",alignItems:"center",gap:8}}><Target size={15} color={theme.accent}/><span style={{fontSize:12,fontWeight:700,letterSpacing:"0.15em"}}>{t.practice}</span></div>
                <button onClick={()=>setPracticeMode(!practiceMode)} style={{padding:"5px 14px",borderRadius:8,fontSize:10,fontWeight:700,cursor:"pointer",border:"none",background:practiceMode?"linear-gradient(135deg,#0077b6,#00b4d8)":theme.surface2,color:practiceMode?"white":theme.textMuted}}>
                  {practiceMode?"Active":"Start"}
                </button>
              </div>
              {practiceMode&&(
                <div style={{display:"flex",gap:20,alignItems:"flex-start"}}>
                  <div style={{flex:1}}>
                    <p style={{fontSize:10,color:theme.textDim,marginBottom:8}}>TARGET SIGN</p>
                    <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
                      <div style={{width:72,height:72,borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center",background:"linear-gradient(135deg,rgba(0,119,182,0.15),rgba(0,180,216,0.15))",border:"2px solid rgba(0,180,216,0.3)"}}>
                        <span style={{fontSize:40,fontWeight:700,color:"#00b4d8"}}>{learnTarget}</span>
                      </div>
                      <div>
                        <p style={{fontSize:12,color:theme.textMuted,margin:"0 0 4px",maxWidth:180}}>{ASL_SIGNS[learnTarget]?.desc}</p>
                        <p style={{fontSize:10,color:theme.accent,margin:0}}>{ASL_SIGNS[learnTarget]?.tip}</p>
                      </div>
                    </div>
                    <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
                      {"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map(l=>(
                        <button key={l} onClick={()=>{setLearnTarget(l);setLearnScore(null);}}
                          style={{width:28,height:28,borderRadius:6,fontSize:11,fontWeight:700,cursor:"pointer",border:"none",background:learnTarget===l?"linear-gradient(135deg,#0077b6,#00b4d8)":stats.unlockedLetters.includes(l)?"rgba(0,255,170,0.1)":theme.surface2,color:learnTarget===l?"white":stats.unlockedLetters.includes(l)?"#00ffaa":theme.textMuted}}>
                          {l}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div style={{width:180,display:"flex",flexDirection:"column",gap:8}}>
                    <p style={{fontSize:10,color:theme.textDim,margin:0}}>YOUR SIGN</p>
                    <label style={{height:130,borderRadius:12,border:`2px dashed ${theme.accent}40`,background:theme.surface2,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:6,cursor:"pointer"}}>
                      <input type="file" accept="image/*" style={{display:"none"}} onChange={e=>e.target.files?.[0]&&handleFileUpload(e.target.files[0],true)}/>
                      <Upload size={22} color={theme.textDim}/><span style={{fontSize:10,color:theme.textMuted}}>Upload your sign</span>
                    </label>
                    {learnScore!==null&&(
                      <motion.div initial={{scale:0}} animate={{scale:1}} style={{padding:10,borderRadius:10,textAlign:"center",background:learnScore>0.7?"rgba(0,255,170,0.1)":"rgba(239,68,68,0.1)",border:`1px solid ${learnScore>0.7?"rgba(0,255,170,0.2)":"rgba(239,68,68,0.2)"}`}}>
                        <p style={{fontSize:20,fontWeight:700,margin:0,color:learnScore>0.7?"#00ffaa":"#f87171"}}>{learnScore>0.7?"✓":"✗"}</p>
                        <p style={{fontSize:11,margin:0,color:learnScore>0.7?"#00ffaa":"#f87171"}}>{learnScore>0.7?`${(learnScore*100).toFixed(0)}%`:"Try again!"}</p>
                      </motion.div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Alphabet grid */}
            <div style={{borderRadius:20,padding:24,background:theme.surface,border:`1px solid ${theme.border}`}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}><BookOpen size={15} color={theme.accent}/><span style={{fontSize:12,fontWeight:700,letterSpacing:"0.15em"}}>{t.alphabet}</span><span style={{marginLeft:"auto",fontSize:10,color:theme.textMuted}}>{stats.unlockedLetters.length}/26</span></div>
              <div style={{display:"flex",flexWrap:"wrap",gap:7}}>
                {"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map(l=>(
                  <motion.div key={l} whileHover={{scale:1.05}} title={ASL_SIGNS[l]?.desc}
                    style={{width:50,height:50,borderRadius:10,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",cursor:"pointer",border:`1px solid ${stats.unlockedLetters.includes(l)?"rgba(0,255,170,0.3)":theme.border}`,background:stats.unlockedLetters.includes(l)?"rgba(0,255,170,0.08)":theme.surface2}}>
                    <span style={{fontSize:20,fontWeight:700,color:stats.unlockedLetters.includes(l)?"#00ffaa":theme.textDim}}>{l}</span>
                    {stats.unlockedLetters.includes(l)&&<span style={{fontSize:7,color:"#00ffaa",opacity:0.7}}>✓</span>}
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══ PROGRESS TAB ══ */}
        {tab==="progress"&&(
          <div style={{padding:24,display:"flex",flexDirection:"column",gap:20,overflowY:"auto",height:"100%"}}>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
              {[{label:t.streak,value:stats.streak,unit:"days",icon:<Flame size={18} color="#f97316"/>,color:"#f97316"},{label:t.totalSigns,value:stats.totalSigns,unit:"signs",icon:<Hand size={18} color="#00b4d8"/>,color:"#00b4d8"},{label:t.accuracy,value:`${(stats.avgAccuracy*100).toFixed(0)}`,unit:"%",icon:<Target size={18} color="#00ffaa"/>,color:"#00ffaa"},{label:"Sessions",value:stats.totalSessions,unit:"total",icon:<Activity size={18} color="#a78bfa"/>,color:"#a78bfa"}].map(({label,value,unit,icon,color})=>(
                <div key={label} style={{borderRadius:16,padding:18,background:theme.surface,border:`1px solid ${color}20`}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}><span style={{fontSize:9,color:theme.textMuted,letterSpacing:"0.15em"}}>{label.toUpperCase()}</span>{icon}</div>
                  <div style={{fontSize:34,fontWeight:700,color,lineHeight:1}}>{value}</div>
                  <div style={{fontSize:10,color:theme.textDim,marginTop:4}}>{unit}</div>
                </div>
              ))}
            </div>

            {stats.accuracyHistory.length>1&&(
              <div style={{borderRadius:18,padding:20,background:theme.surface,border:`1px solid ${theme.border}`}}>
                <span style={{fontSize:9,letterSpacing:"0.2em",color:theme.textDim,display:"block",marginBottom:12}}>ACCURACY HISTORY</span>
                <div style={{display:"flex",alignItems:"flex-end",gap:2,height:56}}>
                  {stats.accuracyHistory.slice(-40).map((v,i)=>(
                    <div key={i} style={{flex:1,borderRadius:"2px 2px 0 0",height:`${v*100}%`,minHeight:2,background:v>=0.85?"#00ffaa":v>=0.65?"#facc15":"#f87171",opacity:0.6+(i/40)*0.4}}/>
                  ))}
                </div>
              </div>
            )}

            <div style={{borderRadius:18,padding:20,background:theme.surface,border:`1px solid ${theme.border}`}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}><Flame size={14} color="#f97316"/><span style={{fontSize:9,letterSpacing:"0.2em",color:theme.textDim}}>STREAK</span><span style={{marginLeft:"auto",fontSize:11,color:theme.textMuted}}>Best: {stats.maxStreak}</span></div>
              <div style={{display:"flex",gap:3}}>
                {Array.from({length:30}).map((_,i)=>{const active=i>=30-stats.streak; return(<div key={i} style={{flex:1,height:18,borderRadius:3,background:active?"linear-gradient(135deg,#f97316,#ef4444)":theme.surface2,opacity:active?1:0.3}}/>);})}
              </div>
              <p style={{fontSize:10,color:theme.textMuted,marginTop:8,marginBottom:0}}>{stats.streak>0?`🔥 ${stats.streak} day streak!`:"Sign today to start your streak!"}</p>
            </div>

            <div style={{borderRadius:18,padding:20,background:theme.surface,border:`1px solid ${theme.border}`}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}><Award size={14} color="#facc15"/><span style={{fontSize:9,letterSpacing:"0.2em",color:theme.textDim}}>{t.badges.toUpperCase()}</span><span style={{marginLeft:"auto",fontSize:11,color:theme.textMuted}}>{unlocked.length}/{ACHIEVEMENTS.length}</span></div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:8}}>
                {ACHIEVEMENTS.map(a=>{const done=unlocked.includes(a.id); return(
                  <motion.div key={a.id} whileHover={{scale:1.05}} title={`${a.name}: ${a.desc}`}
                    style={{borderRadius:12,padding:12,textAlign:"center",background:done?"rgba(250,204,21,0.08)":theme.surface2,border:`1px solid ${done?"rgba(250,204,21,0.25)":theme.border}`,opacity:done?1:0.4}}>
                    <div style={{fontSize:22,marginBottom:4}}>{a.icon}</div>
                    <div style={{fontSize:9,fontWeight:700,color:done?"#facc15":theme.textDim,lineHeight:1.3}}>{a.name}</div>
                  </motion.div>
                );})}
              </div>
            </div>
          </div>
        )}

        {/* ══ LEADERBOARD TAB ══ */}
        {tab==="leaderboard"&&(
          <div style={{padding:24,display:"flex",flexDirection:"column",gap:20,overflowY:"auto",height:"100%"}}>
            <div style={{borderRadius:20,padding:28,background:theme.surface,border:"1px solid rgba(250,204,21,0.2)"}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16}}><Trophy size={16} color="#facc15"/><span style={{fontSize:12,fontWeight:700,letterSpacing:"0.15em"}}>{t.yourRank}</span></div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14}}>
                {[{label:"Signs",value:stats.totalSigns,color:"#00b4d8"},{label:"Streak",value:`${stats.streak}d`,color:"#f97316"},{label:"Accuracy",value:`${(stats.avgAccuracy*100).toFixed(0)}%`,color:"#00ffaa"}].map(({label,value,color})=>(
                  <div key={label} style={{textAlign:"center",padding:14,borderRadius:12,background:theme.surface2}}>
                    <div style={{fontSize:26,fontWeight:700,color}}>{value}</div>
                    <div style={{fontSize:10,color:theme.textMuted,marginTop:4}}>{label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{borderRadius:20,padding:24,background:theme.surface,border:`1px solid ${theme.border}`}}>
              <span style={{fontSize:9,letterSpacing:"0.2em",color:theme.textDim,display:"block",marginBottom:12}}>LETTERS MASTERED ({stats.unlockedLetters.length}/26)</span>
              <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                {stats.unlockedLetters.length>0?stats.unlockedLetters.map(l=><span key={l} style={{padding:"4px 12px",borderRadius:8,fontSize:14,fontWeight:700,background:"rgba(0,255,170,0.08)",border:"1px solid rgba(0,255,170,0.2)",color:"#00ffaa"}}>{l}</span>):<p style={{color:theme.textDim,fontSize:12}}>Start scanning to unlock letters!</p>}
              </div>
            </div>

            <div style={{borderRadius:20,padding:28,background:theme.surface,border:`1px solid ${theme.border}`,textAlign:"center"}}>
              <Trophy size={44} color={theme.textDim} style={{margin:"0 auto 14px"}}/>
              <h3 style={{fontSize:18,fontWeight:700,margin:"0 0 8px"}}>Global Leaderboard</h3>
              <p style={{fontSize:13,color:theme.textMuted,margin:"0 0 14px"}}>Compete with signers worldwide — coming soon!</p>
              <div style={{display:"inline-flex",padding:"6px 18px",borderRadius:20,background:"rgba(0,180,216,0.1)",border:"1px solid rgba(0,180,216,0.2)",color:theme.accent,fontSize:11}}>🚧 Coming in next update</div>
            </div>
          </div>
        )}
      </div>

      <style>{`@keyframes blink{0%,100%{opacity:1}50%{opacity:0}}`}</style>
    </div>
  );
}
