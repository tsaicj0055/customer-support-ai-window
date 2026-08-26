import { useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";
import { ArrowUp, CheckCircle2, ChevronDown, FileSpreadsheet, Headphones, Info, Languages, Paperclip, Plus, RotateCcw, Send, ShieldCheck, SlidersHorizontal, Sparkles, UserRound, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import workbook from "../data/knowledge-base.json";
import { analyzeMessage, buildLocalReply, getFieldDictionary, getKnowledgeBase, getRules, type ConversationMessage, type KnowledgeItem, type SupportState } from "@/lib/supportEngine";
import { demoResponses, getDemoViewModel, type DemoLanguage, type DemoTone } from "@/lib/brandVoiceDemo";
import { trpc } from "@/lib/trpc";

const seedMessages: ConversationMessage[] = [{ role: "assistant", content: "您好，我是您的 Meta 廣告客服助理。\n我會先理解完整問題，再依據知識庫與處理規則回答；若需要個案查核，也會只向您補問最必要的一項資訊。", time: "11:42" }];
const scenarios = (workbook.prototypeScenarios as KnowledgeItem[]).slice(0, 3);

export default function Home() {
  const switchScenario = typeof window !== "undefined" && new URLSearchParams(window.location.search).has("switchScenario");
  const scenarioHistory: ConversationMessage[] = [
    ...seedMessages,
    { role: "customer", content: "我的信用卡付款失敗", time: "11:44" },
    { role: "assistant", content: "請提供 Ad Account ID 以便查核。", time: "11:44" },
    { role: "customer", content: "我的粉絲團被封鎖了，請問要怎麼辦？", time: "11:45" },
  ];
  const scenarioFields = { F01: "act_1234", F11: "末四碼 1234" };
  const [messages, setMessages] = useState<ConversationMessage[]>(switchScenario ? scenarioHistory : seedMessages);
  const [draft, setDraft] = useState("");
  const [fields, setFields] = useState<Record<string, string>>(switchScenario ? scenarioFields : {});
  const [activeKb, setActiveKb] = useState<KnowledgeItem[]>(getKnowledgeBase());
  const [state, setState] = useState<SupportState>(() => switchScenario ? analyzeMessage("我的粉絲團被封鎖了，請問要怎麼辦？", scenarioHistory, scenarioFields, getKnowledgeBase()) : analyzeMessage("", [], {}, getKnowledgeBase()));
  const [ticketOpen, setTicketOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [demoOpen, setDemoOpen] = useState(() => new URLSearchParams(window.location.search).has("demo"));
  const [demoTone, setDemoTone] = useState<DemoTone>("親切");
  const [demoLanguage, setDemoLanguage] = useState<DemoLanguage>("繁體中文");
  const [showDetails, setShowDetails] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const replyMutation = trpc.support.reply.useMutation();
  const fieldNames = useMemo(() => Object.fromEntries(getFieldDictionary().map((f) => [String(f["Field ID"]), String(f["Field Name"])])), []);

  const sendMessage = async (preset?: string) => {
    const text = (preset ?? draft).trim();
    if (!text || isTyping) return;
    const customer: ConversationMessage = { role: "customer", content: text, time: new Date().toLocaleTimeString("zh-TW", { hour: "2-digit", minute: "2-digit" }) };
    const nextHistory = [...messages, customer];
    const nextState = analyzeMessage(text, messages, fields, activeKb);
    setMessages(nextHistory);
    setDraft("");
    setState(nextState);
    setFields(nextState.collectedFields);
    setIsTyping(true);
    const top = nextState.matchedKb;
    try {
      const result = await replyMutation.mutateAsync({
        message: text,
        history: nextHistory.slice(-10).map(({ role, content }) => ({ role, content })),
        context: { intent: nextState.intent, category: nextState.category, confidence: nextState.confidence, resolutionType: nextState.resolutionType, knowledge: top, missingFields: nextState.missingFields, collectedFields: nextState.collectedFields, rules: getRules() },
      });
      const assistant: ConversationMessage = { role: "assistant", content: result.answer, time: new Date().toLocaleTimeString("zh-TW", { hour: "2-digit", minute: "2-digit" }) };
      setMessages((current) => [...current, assistant]);
      setState((current) => ({ ...current, confidence: result.confidence, needsHuman: result.needsHuman, summary: result.summary }));
    } catch {
      const assistant: ConversationMessage = { role: "assistant", content: buildLocalReply(text, nextState), time: new Date().toLocaleTimeString("zh-TW", { hour: "2-digit", minute: "2-digit" }) };
      setMessages((current) => [...current, assistant]);
      toast.info("目前以規則與知識庫模式回覆；稍後可再啟用 AI 增強回答。", { duration: 3000 });
    } finally {
      setIsTyping(false);
    }
  };

  const importWorkbook = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const buffer = await file.arrayBuffer();
    const parsed = XLSX.read(buffer, { type: "array" });
    const sheetName = parsed.SheetNames.find((name) => /KB|知識|Knowledge/i.test(name)) ?? parsed.SheetNames[0];
    const rows = XLSX.utils.sheet_to_json<KnowledgeItem>(parsed.Sheets[sheetName], { defval: null });
    if (rows.length) {
      setActiveKb(rows);
      toast.success(`已匯入「${sheetName}」：${rows.length} 筆知識條目`);
    } else toast.error("找不到可解析的知識庫資料");
  };

  const reset = () => { setMessages(seedMessages); setFields({}); setState(analyzeMessage("", [], {}, activeKb)); setTicketOpen(false); };
  const confidenceLabel = state.confidence >= 0.8 ? "高信心" : state.confidence >= 0.55 ? "中信心" : "低信心";
  const confidenceColor = state.confidence >= 0.8 ? "text-emerald-700 bg-emerald-50" : state.confidence >= 0.55 ? "text-amber-700 bg-amber-50" : "text-rose-700 bg-rose-50";
  const demoView = getDemoViewModel(state, demoLanguage, demoTone);

  return <div className="min-h-screen bg-[#f5f7fb] text-slate-900">
    <header className="h-[72px] border-b border-slate-200/80 bg-white/90 px-7 flex items-center justify-between sticky top-0 z-20 backdrop-blur">
      <div className="flex items-center gap-3"><div className="brand-mark"><Sparkles size={17} /></div><div><div className="font-semibold tracking-tight text-[17px]">客服智能工作台</div><div className="text-[11px] text-slate-400 tracking-[0.14em] uppercase">Conversation intelligence</div></div></div>
      <div className="flex items-center gap-3"><Button variant="outline" aria-label="開啟語氣與語言 Demo" className="flex h-8 w-8 sm:w-auto rounded-full text-xs gap-1.5 p-0 sm:px-3" onClick={() => setDemoOpen(true)}><SlidersHorizontal size={14} /><span className="hidden sm:inline">語氣與語言 Demo</span></Button><Badge variant="outline" className="rounded-full border-emerald-200 bg-emerald-50 text-emerald-700 font-medium"><span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block" />AI 引擎運作中</Badge><Button variant="ghost" size="icon" onClick={reset} aria-label="重新開始"><RotateCcw size={17} /></Button><div className="avatar">R</div></div>
    </header>
    <div className="workspace-grid">
      <aside className="border-r border-slate-200/80 bg-white px-5 py-6 flex flex-col gap-7">
        <div><div className="section-label">工作區</div><nav className="mt-3 space-y-1"><button className="nav-item nav-active"><Headphones size={17} />客服對話</button><button className="nav-item" onClick={() => setAdminOpen(true)}> <ShieldCheck size={17} />品質與規則</button><button className="nav-item" onClick={() => toast.info("工單佇列將在接入正式客服系統後同步。")}> <CheckCircle2 size={17} />工單佇列 <span className="ml-auto text-[11px] bg-slate-100 px-2 py-0.5 rounded-full">3</span></button></nav></div>
        <div><div className="section-label">知識庫</div><Card className="mt-3 border-slate-200/70 shadow-none rounded-xl p-3.5"><div className="flex gap-3"><div className="p-2 rounded-lg bg-indigo-50 text-indigo-600"><FileSpreadsheet size={17} /></div><div className="min-w-0"><div className="text-sm font-medium truncate">Phase 2 知識庫</div><div className="text-xs text-slate-400 mt-1">{activeKb.length} 筆 · {getRules().length} 條 rules</div></div></div><Button variant="outline" className="w-full mt-3 h-8 text-xs" onClick={() => fileRef.current?.click()}>匯入新的 .xlsx</Button><input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={importWorkbook} /></Card></div>
        <div className="mt-auto rounded-2xl bg-[#111827] text-white p-4"><div className="text-xs text-slate-400">目前模式</div><div className="mt-1 font-medium">RAG + Rules Guardrail</div><p className="text-[11px] text-slate-400 mt-2 leading-relaxed">先檢索，再依規則決定回答、補問或轉接。</p></div>
      </aside>
      <main className="min-w-0 flex flex-col h-[calc(100vh-72px)]"><div className="conversation-head px-8 py-5"><div><div className="text-xs text-slate-400">即時客戶對話 / CASE-20260824-018</div><h1 className="text-xl font-semibold mt-1">Meta 廣告帳戶諮詢</h1></div><div className="flex gap-2"><Badge variant="outline" className="rounded-full">LINE 來源</Badge><Badge className="rounded-full bg-indigo-50 text-indigo-700 hover:bg-indigo-50">進行中</Badge></div></div>
        <div className="messages-area px-8 py-5 space-y-5">{messages.map((message, index) => <div key={`${message.time}-${index}`} className={`flex gap-3 ${message.role === "customer" ? "justify-end" : "justify-start"}`}><div className={`flex gap-3 max-w-[76%] ${message.role === "customer" ? "flex-row-reverse" : ""}`}><div className={`message-avatar ${message.role === "customer" ? "customer-avatar" : "assistant-avatar"}`}>{message.role === "customer" ? <UserRound size={16} /> : <Sparkles size={16} />}</div><div><div className={`message-bubble whitespace-pre-line ${message.role === "customer" ? "customer-bubble" : "assistant-bubble"}`}>{message.content}</div><div className={`text-[10px] text-slate-400 mt-1 ${message.role === "customer" ? "text-right" : ""}`}>{message.time}</div></div></div></div>)}{isTyping && <div className="flex items-center gap-2 text-xs text-slate-400 pl-12"><span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" /> 正在檢索脈絡與規則…</div>}</div>
        <div className="mt-auto px-8 pb-6"><div className="quick-row"><span className="text-[11px] text-slate-400 mr-1">測試情境</span>{scenarios.map((s, i) => <button key={i} className="quick-chip" onClick={() => sendMessage(String(s["Customer Message"] ?? ""))}>{String(s["Customer Message"] ?? "範例問題")}</button>)}</div><div className="composer"><Textarea value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }} placeholder="輸入客戶問題…（Enter 送出，Shift + Enter 換行）" className="min-h-[64px] max-h-32 resize-none border-0 shadow-none focus-visible:ring-0 px-4 pt-4 text-sm" /><div className="flex items-center justify-between px-3 pb-2"><div className="flex gap-1"><Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400" onClick={() => fileRef.current?.click()}><Paperclip size={16} /></Button><span className="text-[11px] text-slate-400 self-center ml-1">已啟用對話脈絡記憶</span></div><Button onClick={() => sendMessage()} disabled={!draft.trim() || isTyping} className="rounded-xl bg-[#16213a] hover:bg-[#243456] text-white h-9 px-4"><Send size={15} className="mr-2" />送出</Button></div></div></div></main>
      <aside className="context-panel border-l border-slate-200/80 bg-white px-5 py-6 overflow-y-auto"><div className="flex items-center justify-between"><div><div className="section-label">即時決策脈絡</div><div className="text-sm font-semibold mt-2">AI 回覆控制台</div></div><button className="text-slate-400" onClick={() => setShowDetails(!showDetails)}><ChevronDown size={17} className={showDetails ? "rotate-180" : ""} /></button></div>{showDetails && <><div className="mt-5 rounded-2xl bg-slate-50 p-4"><div className="flex items-center justify-between"><span className="text-xs text-slate-500">回答信心</span><span className={`text-xs font-medium px-2 py-1 rounded-full ${confidenceColor}`}>{confidenceLabel}</span></div><div className="mt-3 h-2 rounded-full bg-slate-200 overflow-hidden"><div className="h-full rounded-full bg-indigo-500 transition-all" style={{ width: `${Math.round(state.confidence * 100)}%` }} /></div><div className="text-right text-[11px] text-slate-400 mt-1">{Math.round(state.confidence * 100)} / 100</div></div><div className="panel-block"><div className="panel-title"><Info size={15} />意圖與路由</div><div className="data-row"><span>Category</span><strong>{state.category ?? "待辨識"}</strong></div><div className="data-row"><span>Intent</span><strong>{state.intent ?? "待辨識"}</strong></div><div className="data-row"><span>Resolution</span><strong className="text-indigo-700">{state.resolutionType ?? "CLARIFY"}</strong></div></div><div className="panel-block"><div className="panel-title"><FileSpreadsheet size={15} />回答依據</div>{state.matchedKb ? <><div className="text-xs font-medium">{state.matchedKb["KB ID"]} · {state.matchedKb["Intent"]}</div><div className="text-[11px] text-slate-500 mt-1 leading-relaxed">{state.matchedKb["Source Title"]}</div><a className="text-[11px] text-indigo-600 mt-2 inline-block hover:underline" href={String(state.matchedKb["Source URL"] ?? "#")} target="_blank" rel="noreferrer">查看官方來源 ↗</a></> : <div className="text-xs text-slate-400">尚未找到足夠可靠的知識匹配</div>}</div><div className="panel-block"><div className="panel-title"><ShieldCheck size={15} />欄位檢查</div>{state.missingFields.length ? <><div className="text-xs text-amber-700 bg-amber-50 rounded-lg p-2.5">尚缺 {state.missingFields.length} 個必要欄位，系統只會逐一補問。</div><div className="mt-2 space-y-2">{state.missingFields.slice(0, 4).map((id) => <div className="data-row" key={id}><span>{id}</span><strong>{fieldNames[id] ?? "必要資訊"}</strong></div>)}</div></> : <div className="text-xs text-emerald-700 bg-emerald-50 rounded-lg p-2.5">目前沒有待補欄位</div>}</div><div className="panel-block"><div className="panel-title"><ArrowUp size={15} />下一步</div><p className="text-xs leading-relaxed text-slate-600">{state.missingFields.length ? "向客戶補問最前面的必要欄位" : state.needsHuman ? "可建立人工工單，由專員接續處理" : "結束對話並保留來源依據"}</p>{state.needsHuman && <Button onClick={() => setTicketOpen(true)} className="w-full mt-3 h-9 rounded-lg bg-[#16213a] hover:bg-[#243456] text-white text-xs">建立人工轉接工單</Button>}</div></>}</aside>
    </div>
    {adminOpen && <div className="modal-backdrop"><Card className="ticket-modal"><div className="flex justify-between items-start"><div><div className="section-label">Quality review</div><h2 className="text-lg font-semibold mt-1">管理者改善檢視</h2><p className="text-xs text-slate-500 mt-2">用測試情境檢查 AI 是否遵守「先理解、再檢索、最後決策」。</p></div><button onClick={() => setAdminOpen(false)}><X size={18} className="text-slate-400" /></button></div><div className="mt-5 grid grid-cols-2 gap-3"><div className="rounded-xl bg-emerald-50 p-4"><div className="text-xs text-emerald-700">已覆核情境</div><div className="text-2xl font-semibold text-emerald-800 mt-1">3 / 5</div><div className="text-[11px] text-emerald-700 mt-1">直接回答、補問、拒答</div></div><div className="rounded-xl bg-amber-50 p-4"><div className="text-xs text-amber-700">改善焦點</div><div className="text-2xl font-semibold text-amber-800 mt-1">2</div><div className="text-[11px] text-amber-700 mt-1">多意圖拆分、衝突提示</div></div></div><div className="mt-4 space-y-2">{["多問題：先拆解意圖，再逐題保留脈絡", "追問：每回合只問一個缺漏欄位", "無法回答：低信心時拒絕臆測並轉接"].map((item) => <div className="flex items-center gap-2 text-xs text-slate-600 rounded-lg bg-slate-50 p-3" key={item}><CheckCircle2 size={15} className="text-emerald-600" />{item}</div>)}</div><div className="flex justify-end mt-5"><Button className="bg-[#16213a] text-white" onClick={() => setAdminOpen(false)}>完成檢視</Button></div></Card></div>}
    {demoOpen && <div className="modal-backdrop"><Card className="ticket-modal max-w-3xl"><div className="flex justify-between items-start"><div><div className="section-label">Brand voice playground</div><h2 className="text-lg font-semibold mt-1">語氣與多語言 Demo</h2><p className="text-xs text-slate-500 mt-2">同一個案件切換語言與品牌語氣；意圖、知識來源、Rules 與信心取自目前客服狀態。</p></div><button onClick={() => setDemoOpen(false)} aria-label="關閉 Demo"><X size={18} className="text-slate-400" /></button></div><div className="mt-5 grid gap-5 md:grid-cols-[180px_1fr]"><div className="space-y-4"><div><label className="text-xs font-medium text-slate-500">回答語言</label><div className="mt-2 space-y-1">{(["繁體中文", "English", "日本語"] as DemoLanguage[]).map((item) => <button key={item} onClick={() => setDemoLanguage(item)} className={`w-full text-left rounded-lg px-3 py-2 text-xs transition ${demoLanguage === item ? "bg-indigo-50 text-indigo-700 font-medium" : "text-slate-500 hover:bg-slate-50"}`}><Languages size={13} className="inline mr-2" />{item}</button>)}</div></div><div><label className="text-xs font-medium text-slate-500">品牌語氣</label><div className="mt-2 space-y-1">{(["親切", "專業", "精簡"] as DemoTone[]).map((item) => <button key={item} onClick={() => setDemoTone(item)} className={`w-full text-left rounded-lg px-3 py-2 text-xs transition ${demoTone === item ? "bg-indigo-50 text-indigo-700 font-medium" : "text-slate-500 hover:bg-slate-50"}`}><SlidersHorizontal size={13} className="inline mr-2" />{item}</button>)}</div></div></div><div><div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4"><div className="flex items-center justify-between"><span className="text-[11px] uppercase tracking-wider text-indigo-600">Customer message</span><Badge className="bg-white text-indigo-700 hover:bg-white">Page restriction</Badge></div><p className="mt-3 text-sm text-slate-700">我的粉絲團被封鎖了，請問要怎麼辦？</p></div><div className="mt-3 rounded-xl border border-slate-200 bg-white p-4"><div className="flex items-center gap-2 text-xs font-medium text-slate-500"><Sparkles size={14} className="text-indigo-500" />AI 回覆（{demoLanguage}／{demoTone}）</div><p className="mt-3 text-sm leading-7 text-slate-700">{demoResponses[demoLanguage][demoTone]}</p></div><div className="mt-3 grid grid-cols-2 gap-2 text-[11px]"><div className="rounded-lg bg-emerald-50 p-3 text-emerald-700"><div className="text-slate-400">Live intent</div><strong className="block mt-1">{demoView.intent ?? "待辨識"}</strong></div><div className="rounded-lg bg-slate-50 p-3 text-slate-600"><div className="text-slate-400">Confidence</div><strong className="block mt-1">{Math.round(demoView.confidence * 100)} / 100</strong></div><div className="rounded-lg bg-indigo-50 p-3 text-indigo-700"><div className="text-slate-400">Source</div><strong className="block mt-1 truncate">{demoView.sourceId ?? "尚無來源"}</strong></div><div className="rounded-lg bg-amber-50 p-3 text-amber-700"><div className="text-slate-400">Rules</div><strong className="block mt-1">{getRules().length} 條已套用</strong></div></div><div className="mt-3 rounded-lg border border-slate-100 bg-slate-50 p-3 text-[11px] text-slate-500"><div className="font-medium text-slate-600">目前路由：{demoView.resolutionType ?? "CLARIFY"}</div><div className="mt-1">{demoView.missingFields.length ? `下一步：補問「${fieldNames[demoView.missingFields[0]] ?? "必要資訊"}」` : state.needsHuman ? "下一步：可轉人工處理" : "下一步：依來源完成回答"}</div></div><p className="mt-4 text-[11px] leading-relaxed text-slate-400">透明提示：這是 AI 產生的客服回覆；若無法確認或您要求人工，我們會保留對話脈絡並轉交客服專員。</p><Button className="w-full mt-3 bg-[#16213a] text-white" onClick={() => { setDemoOpen(false); setTicketOpen(true); }}><Headphones size={14} className="mr-2" />開啟人工轉接工單</Button></div></div><div className="flex justify-end mt-5"><Button className="bg-[#16213a] text-white" onClick={() => setDemoOpen(false)}>返回客服工作臺</Button></div></Card></div>}
    {ticketOpen && <div className="modal-backdrop"><Card className="ticket-modal"><div className="flex justify-between items-start"><div><div className="section-label">Human handoff</div><h2 className="text-lg font-semibold mt-1">人工轉接／工單預覽</h2><p className="text-xs text-slate-500 mt-2">建立前可檢視 AI 整理的脈絡與必要欄位。</p></div><button onClick={() => setTicketOpen(false)}><X size={18} className="text-slate-400" /></button></div><div className="ticket-grid mt-5"><div><label>Category</label><div>{state.category}</div></div><div><label>Intent</label><div>{state.intent}</div></div><div className="col-span-2"><label>Conversation summary</label><div>{state.summary || "客戶尚未提供對話內容"}</div></div><div className="col-span-2"><label>已取得欄位</label><div>{Object.keys(fields).length ? Object.entries(fields).map(([id, value]) => <Badge key={id} variant="outline" className="mr-2 mb-1">{id}: {value}</Badge>) : <span className="text-slate-400">尚無</span>}</div></div><div className="col-span-2"><label>缺少欄位</label><div>{state.missingFields.length ? state.missingFields.map((id) => <Badge key={id} variant="outline" className="mr-2 mb-1 text-amber-700">{id}: {fieldNames[id] ?? "必要資訊"}</Badge>) : <span className="text-emerald-700">無</span>}</div></div><div className="col-span-2"><label>轉接原因</label><div>{state.handoffReason}</div></div></div><div className="flex justify-end gap-2 mt-6"><Button variant="outline" onClick={() => setTicketOpen(false)}>返回修改</Button><Button className="bg-[#16213a]" onClick={() => { setTicketOpen(false); toast.success("已建立工單草稿 CASE-20260824-018"); }}>建立工單草稿</Button></div></Card></div>}
  </div>;
}
