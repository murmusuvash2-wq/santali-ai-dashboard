import { useMemo, useState } from "react";
import {
  Activity,
  ArrowUpRight,
  BookOpen,
  Check,
  ChevronRight,
  CircleAlert,
  Cloud,
  Code2,
  Database,
  ExternalLink,
  Gauge,
  GitBranch,
  GraduationCap,
  Languages,
  LockKeyhole,
  Play,
  RefreshCw,
  Server,
  Sparkles,
  Target,
  Users,
  Wifi,
  X,
  Zap,
} from "lucide-react";

const githubRunUrl = "https://github.com/murmusuvash2-wq/santali-ai/actions/runs/35127753722";
const kaggleUrl = "https://www.kaggle.com/ezqrio";

const stages = [
  { id: "data", label: "Data prepared", caption: "Parallel pairs + license checks", icon: Database, state: "ready" },
  { id: "upload", label: "Kaggle input", caption: "Approved dataset attached", icon: Cloud, state: "blocked" },
  { id: "model", label: "Base model", caption: "IndicTrans2 · 320M", icon: Sparkles, state: "ready" },
  { id: "train", label: "LoRA training", caption: "GPU fine-tuning run", icon: GraduationCap, state: "blocked" },
  { id: "eval", label: "Evaluation", caption: "BLEU / chrF + native review", icon: Target, state: "waiting" },
];

const lessons = [
  ["Hindi → Ol Chiki", "hin_Deva → sat_Olck", "Planned"],
  ["English → Ol Chiki", "eng_Latn → sat_Olck", "Planned"],
  ["Ol Chiki script", "Unicode-safe normalization", "Ready"],
];

function StatusPill({ tone, children }: { tone: "amber" | "green" | "red" | "slate"; children: React.ReactNode }) {
  const styles = {
    amber: "bg-[#fff2d5] text-[#9c5a00] ring-[#f4c76c]/50",
    green: "bg-[#dff7ec] text-[#13704a] ring-[#8ee0bb]/50",
    red: "bg-[#ffe5e1] text-[#a13b35] ring-[#f2a79f]/50",
    slate: "bg-[#e9edf2] text-[#53616d] ring-[#cbd4dc]/70",
  };
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold tracking-[0.08em] ring-1 ${styles[tone]}`}>{children}</span>;
}

export default function Home() {
  const [checking, setChecking] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [lastChecked, setLastChecked] = useState("Just now");

  const progress = useMemo(() => ({ done: 1, total: 5, percent: 20 }), []);

  const checkStatus = () => {
    setChecking(true);
    window.setTimeout(() => {
      setChecking(false);
      setLastChecked("Just now");
    }, 900);
  };

  return (
    <main className="min-h-screen overflow-hidden bg-[#f5f7f3] text-[#18242a]">
      <div className="pointer-events-none fixed inset-0 opacity-40 [background-image:radial-gradient(#c9d9d0_0.7px,transparent_0.7px)] [background-size:18px_18px]" />
      <header className="relative z-10 border-b border-[#dbe5df] bg-[#f5f7f3]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-5 py-4 sm:px-8 lg:px-12">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[#173f35] text-[#d7f6bb] shadow-[0_8px_24px_rgba(23,63,53,0.2)]"><Languages size={21} /></div>
            <div><p className="font-display text-lg font-extrabold tracking-tight">Santali AI</p><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#74837b]">Learning control room</p></div>
          </div>
          <div className="flex items-center gap-3 text-xs font-semibold text-[#64736b]"><span className="hidden sm:inline">Ol Chiki · Data-first</span><span className="h-2 w-2 rounded-full bg-[#efb64d] shadow-[0_0_0_5px_#f8e7c0]" /> Live monitor</div>
        </div>
      </header>

      <section className="relative z-10 mx-auto max-w-[1440px] px-5 pb-10 pt-10 sm:px-8 lg:px-12 lg:pt-14">
        <div className="grid gap-8 lg:grid-cols-[1.3fr_0.7fr] lg:items-end">
          <div>
            <div className="mb-5 flex flex-wrap items-center gap-3"><StatusPill tone="amber"><CircleAlert size={13} /> WAITING FOR INPUT</StatusPill><span className="text-xs font-semibold text-[#718079]">Run #35127753722 · checked {lastChecked}</span></div>
            <h1 className="max-w-3xl font-display text-4xl font-black leading-[0.98] tracking-[-0.05em] text-[#173f35] sm:text-6xl lg:text-7xl">Humara model abhi <span className="text-[#d28a24]">seekhne ke liye ready</span> hai.</h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-[#5f7068] sm:text-lg">Yeh page transparent tareeke se dikhata hai ki Santali AI ne kya prepare kiya, training kahan ruki hai, aur run start hone ke baad kitna improve kar raha hai.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button onClick={checkStatus} className="group inline-flex items-center gap-2 rounded-xl bg-[#173f35] px-5 py-3 text-sm font-bold text-white shadow-[0_12px_24px_rgba(23,63,53,0.18)] transition hover:-translate-y-0.5 hover:bg-[#20594b] active:scale-[0.98]">{checking ? <RefreshCw className="animate-spin" size={16} /> : <RefreshCw size={16} />} Check latest status</button>
              <a href={githubRunUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-[#cddbd3] bg-white/70 px-5 py-3 text-sm font-bold text-[#315b4e] transition hover:-translate-y-0.5 hover:bg-white">Open GitHub run <ExternalLink size={15} /></a>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-[28px] bg-[#173f35] p-6 text-white shadow-[0_24px_60px_rgba(23,63,53,0.2)] sm:p-8">
            <div className="absolute -right-10 -top-12 h-40 w-40 rounded-full border-[18px] border-[#d7f6bb]/20" /><div className="absolute -bottom-20 -left-10 h-48 w-48 rounded-full border-[22px] border-[#efb64d]/20" />
            <div className="relative"><div className="mb-8 flex items-center justify-between"><span className="text-xs font-bold uppercase tracking-[0.16em] text-[#b9d5c5]">Learning progress</span><Gauge size={19} className="text-[#d7f6bb]" /></div><div className="flex items-end gap-3"><span className="font-display text-7xl font-black tracking-[-0.07em] text-[#d7f6bb]">{progress.percent}%</span><span className="mb-3 text-sm font-semibold text-[#b9d5c5]">pipeline complete</span></div><div className="mt-5 h-3 overflow-hidden rounded-full bg-white/15"><div className="h-full w-[20%] rounded-full bg-[#d7f6bb] shadow-[0_0_14px_#d7f6bb]" /></div><div className="mt-4 flex justify-between text-xs font-semibold text-[#b9d5c5]"><span>{progress.done} of {progress.total} stages ready</span><span>0 examples trained</span></div></div>
          </div>
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-[1440px] px-5 pb-8 sm:px-8 lg:px-12">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Base model", "IndicTrans2", "320M parameters", Sparkles, "green"],
            ["Training data", "Not attached", "Needs Kaggle input", Database, "amber"],
            ["GPU run", "Not started", "Waiting for dataset", Zap, "slate"],
            ["Quality score", "—", "Appears after evaluation", Target, "slate"],
          ].map(([label, value, sub, Icon, tone]) => { const MetricIcon = Icon as React.ElementType; return <div key={String(label)} className="rounded-2xl border border-[#dbe5df] bg-white/75 p-5 shadow-[0_8px_30px_rgba(38,70,57,0.04)]"><div className="flex items-start justify-between"><span className="text-xs font-bold uppercase tracking-[0.12em] text-[#7c8b83]">{String(label)}</span><MetricIcon size={17} className={tone === "green" ? "text-[#3f9b6e]" : tone === "amber" ? "text-[#d28a24]" : "text-[#9aa8a2]"} /></div><p className="mt-4 font-display text-2xl font-black tracking-tight text-[#173f35]">{String(value)}</p><p className="mt-1 text-xs font-semibold text-[#809088]">{String(sub)}</p></div>; })}
        </div>
      </section>

      <section className="relative z-10 mx-auto grid max-w-[1440px] gap-6 px-5 pb-14 sm:px-8 lg:grid-cols-[1.15fr_0.85fr] lg:px-12">
        <div className="rounded-[26px] border border-[#dbe5df] bg-white/80 p-6 shadow-[0_12px_40px_rgba(38,70,57,0.06)] sm:p-8">
          <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-[#809088]">What happens next</p><h2 className="mt-2 font-display text-2xl font-black tracking-tight text-[#173f35]">Training pipeline</h2></div><span className="rounded-full bg-[#fff2d5] px-3 py-1 text-[11px] font-bold text-[#9c5a00]">1 / 5 ready</span></div>
          <div className="mt-8 space-y-3">{stages.map((stage, index) => { const Icon = stage.icon; const isDone = stage.state === "ready" && index === 0; const isBlocked = stage.state === "blocked"; return <div key={stage.id} className={`relative flex items-center gap-4 rounded-2xl border p-4 transition ${isBlocked ? "border-[#f0dfb6] bg-[#fffaf0]" : "border-[#e1e9e3] bg-[#fbfcfa]"}`}><div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${isDone ? "bg-[#dff7ec] text-[#13704a]" : isBlocked ? "bg-[#fff0cf] text-[#a66a17]" : "bg-[#e9edf2] text-[#718079]"}`}>{isDone ? <Check size={18} strokeWidth={3} /> : isBlocked ? <LockKeyhole size={17} /> : <Icon size={18} />}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="text-sm font-extrabold text-[#29443a]">{stage.label}</p>{isDone && <StatusPill tone="green">DONE</StatusPill>}{isBlocked && <StatusPill tone="amber">BLOCKED</StatusPill>}</div><p className="mt-1 text-xs font-medium text-[#829087]">{stage.caption}</p></div><ChevronRight size={17} className="text-[#bdc9c1]" /></div> })}</div>
          <div className="mt-6 flex items-start gap-3 rounded-2xl bg-[#fff7e7] p-4 text-sm text-[#76531d]"><CircleAlert size={17} className="mt-0.5 shrink-0 text-[#d28a24]" /><p><strong>Start kab hoga?</strong> Kaggle input dataset attach hote hi GitHub workflow kernel push karega. Uske baad GPU allocation, dependencies, data validation aur LoRA training automatic steps hain.</p></div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[26px] bg-[#e5f0e9] p-6 sm:p-8"><div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-[#648073]">What the model will learn</p><h2 className="mt-2 font-display text-2xl font-black tracking-tight text-[#173f35]">Lessons queued</h2></div><BookOpen className="text-[#3c8064]" size={23} /></div><div className="mt-6 space-y-3">{lessons.map(([name, detail, state]) => <div key={name} className="flex items-center gap-3 rounded-xl bg-white/70 p-3"><div className="grid h-8 w-8 place-items-center rounded-lg bg-[#d0e7d9] text-[#286b52]"><Languages size={15} /></div><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-[#29443a]">{name}</p><p className="text-[11px] font-medium text-[#799087]">{detail}</p></div><span className={`text-[10px] font-extrabold uppercase tracking-wider ${state === "Ready" ? "text-[#2b8a5d]" : "text-[#9c7a3b]"}`}>{state}</span></div>)}</div></div>
          <div className="rounded-[26px] border border-[#dbe5df] bg-white/80 p-6 sm:p-8"><div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.14em] text-[#809088]">Run details</p><h2 className="mt-2 font-display text-xl font-black tracking-tight text-[#173f35]">Connected systems</h2></div><Wifi size={20} className="text-[#4f9275]" /></div><div className="mt-5 space-y-3 text-sm"><a href={githubRunUrl} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-xl border border-[#e2e9e4] p-3 transition hover:bg-[#f7faf7]"><GitBranch size={17} className="text-[#315b4e]" /><span className="flex-1"><strong className="block text-[#29443a]">GitHub Actions</strong><small className="text-xs text-[#849188]">Run #35127753722 · authentication check</small></span><ArrowUpRight size={16} className="text-[#9aa8a2]" /></a><a href={kaggleUrl} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-xl border border-[#e2e9e4] p-3 transition hover:bg-[#f7faf7]"><Server size={17} className="text-[#315b4e]" /><span className="flex-1"><strong className="block text-[#29443a]">Kaggle</strong><small className="text-xs text-[#849188]">ezqrio · GPU kernel destination</small></span><ArrowUpRight size={16} className="text-[#9aa8a2]" /></a></div></div>
        </div>
      </section>

      <section className="relative z-10 border-t border-[#dbe5df] bg-[#edf4ef] px-5 py-8 sm:px-8 lg:px-12"><div className="mx-auto flex max-w-[1440px] flex-col justify-between gap-4 sm:flex-row sm:items-center"><div className="flex items-center gap-3"><div className="grid h-9 w-9 place-items-center rounded-xl bg-[#d7f6bb] text-[#173f35]"><Users size={17} /></div><div><p className="text-sm font-extrabold text-[#29443a]">Native speaker review is part of the score</p><p className="text-xs font-medium text-[#809088]">Automatic metrics tell us progress; people tell us whether Santali sounds right.</p></div></div><button onClick={() => setShowExplanation(!showExplanation)} className="inline-flex items-center gap-2 text-sm font-bold text-[#2e7157] hover:text-[#173f35]">How to read this page <ChevronRight size={16} className={showExplanation ? "rotate-90 transition" : "transition"} /></button></div>{showExplanation && <div className="mx-auto mt-5 max-w-[1440px] rounded-2xl bg-white/70 p-4 text-sm leading-6 text-[#5f7068]">“Kitna sikha” training examples ki ginti nahi hoti. Har evaluation checkpoint par BLEU/chrF, exact-match samples, script safety aur native speaker feedback compare hoga. Dashboard mein real numbers tab aayenge jab Kaggle run successfully complete hoga.</div>}</section>
    </main>
  );
}
