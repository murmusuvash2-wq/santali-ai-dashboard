import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowUpRight,
  Check,
  CircleAlert,
  Cloud,
  Database,
  ExternalLink,
  GitBranch,
  GraduationCap,
  Languages,
  Loader2,
  LockKeyhole,
  RefreshCw,
  Server,
  Sparkles,
  Target,
  Wifi,
  XCircle,
} from "lucide-react";

const REPO = "murmusuvash2-wq/santali-ai";
const ACTIONS_API = `https://api.github.com/repos/${REPO}/actions/runs?per_page=10`;
const JOBS_API = (id: number) => `https://api.github.com/repos/${REPO}/actions/runs/${id}/jobs?per_page=30`;
const ACTIONS_URL = `https://github.com/${REPO}/actions`;
const KAGGLE_URL = "https://www.kaggle.com/code/ezqrio/santali-ai-translation";

type GhRun = { id: number; name: string; status: string; conclusion: string | null; html_url: string; created_at: string; updated_at: string; display_title?: string };
type GhStep = { name: string; status: string; conclusion: string | null; completed_at?: string | null };
type GhJob = { name: string; status: string; conclusion: string | null; steps?: GhStep[] };
type Tone = "amber" | "green" | "red" | "slate" | "blue";
type StageState = "ready" | "blocked" | "running" | "failed" | "waiting";
type Stage = { id: string; label: string; caption: string; icon: React.ElementType; state: StageState };

type Pipeline = {
  stages: Stage[];
  workflowPercent: number;
  trainingPercent: number | null;
  tone: Tone;
  badge: string;
  headline: string;
  sub: string;
  note: string;
  workflowLabel: string;
  trainingLabel: string;
  loss: string;
  epoch: string;
  quality: string;
};

function Pill({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  const styles: Record<Tone, string> = {
    amber: "bg-[#ffddb0]/10 text-[#ffc979] border-[#ffc979]/20",
    green: "bg-[#63e6be]/10 text-[#73edc5] border-[#63e6be]/20",
    red: "bg-[#ff7e87]/10 text-[#ff9ba1] border-[#ff7e87]/20",
    slate: "bg-white/[.06] text-[#9aa6b5] border-white/10",
    blue: "bg-[#65b6ff]/10 text-[#7bc4ff] border-[#65b6ff]/20",
  };
  return <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[.14em] ${styles[tone]}`}>{children}</span>;
}

function isStep(jobs: GhJob[], text: string) {
  return jobs.flatMap((job) => job.steps || []).find((step) => step.name.toLowerCase().includes(text.toLowerCase()));
}

function derive(run: GhRun | null, jobs: GhJob[]): Pipeline {
  const stages: Stage[] = [
    { id: "audit", label: "License audit", caption: "Source permissions + hashes", icon: Database, state: "waiting" },
    { id: "dataset", label: "Parallel dataset", caption: "Approved Santali pairs", icon: Cloud, state: "waiting" },
    { id: "model", label: "Base model", caption: "IndicTrans2 · 320M parameters", icon: Sparkles, state: "waiting" },
    { id: "train", label: "GPU training", caption: "Kaggle LoRA fine-tuning", icon: GraduationCap, state: "waiting" },
    { id: "eval", label: "Evaluation", caption: "BLEU / chrF + native review", icon: Target, state: "waiting" },
  ];
  if (!run) {
    stages[0].state = "ready";
    stages[0].caption = "Waiting for the next workflow run";
    return { stages, workflowPercent: 0, trainingPercent: 0, tone: "amber", badge: "No run yet", headline: "Training has not started.", sub: "The console is connected and waiting for a real GitHub Actions run.", note: "No percentage is invented. A GPU percentage appears only after the Kaggle kernel is actually started.", workflowLabel: "No workflow", trainingLabel: "Not started", loss: "—", epoch: "—", quality: "—" };
  }
  const stepNames = jobs.flatMap((job) => job.steps || []);
  const completed = stepNames.filter((step) => step.conclusion === "success" || step.conclusion === "skipped").length;
  const workflowPercent = Math.round((completed / Math.max(stepNames.length, 1)) * 100);
  const audit = isStep(jobs, "Enforce licensed corpus gate");
  const prepare = isStep(jobs, "Prepare approved parallel dataset");
  const push = isStep(jobs, "Push and run Kaggle kernel");
  const trainingRunning = push?.status === "in_progress";
  const hasSkippedTraining = Boolean(push?.conclusion === "skipped" || prepare?.conclusion === "skipped");

  stages[0].state = audit?.conclusion === "success" ? "ready" : audit?.status === "in_progress" ? "running" : audit?.conclusion === "failure" ? "failed" : "waiting";
  stages[1].state = prepare?.conclusion === "success" ? "ready" : prepare?.status === "in_progress" ? "running" : prepare?.conclusion === "skipped" ? "blocked" : "waiting";
  stages[1].caption = prepare?.conclusion === "skipped" ? "Blocked: no approved parallel source" : "Approved Santali pairs";
  stages[2].state = isStep(jobs, "Download IndicTrans2 model")?.conclusion === "success" ? "ready" : "waiting";
  stages[3].state = trainingRunning ? "running" : push?.conclusion === "success" ? "ready" : push?.conclusion === "skipped" ? "blocked" : push?.conclusion === "failure" ? "failed" : "waiting";
  stages[3].caption = trainingRunning ? "Kaggle kernel handoff is active" : push?.conclusion === "skipped" ? "Not started: waiting for licensed data" : "Kaggle LoRA fine-tuning";
  stages[4].state = "waiting";

  if (trainingRunning) return { stages, workflowPercent, trainingPercent: null, tone: "blue", badge: "Handoff live", headline: "Kaggle training handoff is live.", sub: "The GitHub workflow is pushing the approved package and starting the GPU kernel.", note: "GitHub Actions does not expose Kaggle epoch telemetry. GPU progress will show after a real Kaggle metrics artifact is connected.", workflowLabel: `${workflowPercent}% workflow`, trainingLabel: "GPU starting", loss: "Not reported", epoch: "Not reported", quality: "Pending" };
  if (run.status === "queued") return { stages, workflowPercent, trainingPercent: 0, tone: "blue", badge: "Queued", headline: "A real run is queued.", sub: "GitHub Actions has accepted the workflow and is waiting for a runner.", note: "Training percentage remains 0% until the Kaggle kernel is actually started.", workflowLabel: `${workflowPercent}% workflow`, trainingLabel: "0% · not started", loss: "—", epoch: "—", quality: "Pending" };
  if (run.conclusion === "success" && hasSkippedTraining) return { stages, workflowPercent: 100, trainingPercent: 0, tone: "amber", badge: "Safely blocked", headline: "Training did not start.", sub: "The latest workflow completed its license check and skipped Kaggle because no approved parallel source was ready.", note: "This is the truthful state: workflow 100% complete, actual GPU training 0%. Add a verified parallel corpus to unlock training.", workflowLabel: "100% complete", trainingLabel: "0% · not started", loss: "—", epoch: "—", quality: "Pending" };
  if (run.conclusion === "success") return { stages, workflowPercent: 100, trainingPercent: null, tone: "green", badge: "Workflow complete", headline: "The workflow completed.", sub: "Open the Kaggle output to confirm whether a kernel produced metrics and adapter files.", note: "A successful GitHub handoff is not proof of completed GPU training. Metrics must come from Kaggle output.", workflowLabel: "100% complete", trainingLabel: "Check Kaggle metrics", loss: "Not reported", epoch: "Not reported", quality: "Pending" };
  return { stages, workflowPercent, trainingPercent: 0, tone: "red", badge: run.conclusion === "cancelled" ? "Cancelled" : "Run failed", headline: "The latest run needs attention.", sub: "Open the Actions log to inspect the failed step.", note: "No training percentage is reported for a failed workflow.", workflowLabel: `${workflowPercent}% before stop`, trainingLabel: "0% · not confirmed", loss: "—", epoch: "—", quality: "—" };
}

function Stat({ label, value, sub, icon: Icon, accent }: { label: string; value: string; sub: string; icon: React.ElementType; accent: string }) {
  const color: Record<string, string> = { mint: "text-[#63e6be] bg-[#63e6be]/10", blue: "text-[#7bc4ff] bg-[#7bc4ff]/10", amber: "text-[#ffc979] bg-[#ffc979]/10", violet: "text-[#c0a5ff] bg-[#c0a5ff]/10" };
  return <div className="rounded-xl border border-white/[.08] bg-[#101b25] p-4"><div className="flex items-center justify-between"><p className="font-mono text-[9px] uppercase tracking-[.16em] text-[#728090]">{label}</p><div className={`grid h-7 w-7 place-items-center rounded-md ${color[accent]}`}><Icon size={14} /></div></div><p className="mt-4 font-display text-2xl font-bold tracking-tight text-white">{value}</p><p className="mt-1 text-[11px] text-[#728090]">{sub}</p></div>;
}

function StageIcon({ stage }: { stage: Stage }) {
  if (stage.state === "ready") return <Check size={15} strokeWidth={3} />;
  if (stage.state === "running") return <Loader2 size={15} className="animate-spin" />;
  if (stage.state === "blocked") return <LockKeyhole size={14} />;
  if (stage.state === "failed") return <XCircle size={14} />;
  return <stage.icon size={15} />;
}

export default function Home() {
  const [run, setRun] = useState<GhRun | null>(null);
  const [jobs, setJobs] = useState<GhJob[]>([]);
  const [checking, setChecking] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastChecked, setLastChecked] = useState("not yet");
  const fetchStatus = useCallback(async () => {
    setChecking(true); setError(null);
    try {
      const response = await fetch(ACTIONS_API, { headers: { Accept: "application/vnd.github+json" } });
      if (!response.ok) throw new Error(`GitHub API ${response.status}`);
      const data = await response.json();
      const runs: GhRun[] = data.workflow_runs || [];
      const latest = runs.find((candidate) => /kaggle training/i.test(candidate.name)) || runs[0] || null;
      setRun(latest);
      if (latest) {
        const jobsResponse = await fetch(JOBS_API(latest.id), { headers: { Accept: "application/vnd.github+json" } });
        if (jobsResponse.ok) setJobs((await jobsResponse.json()).jobs || []);
      } else setJobs([]);
      setLastChecked(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Unable to reach GitHub"); }
    finally { setChecking(false); setLoaded(true); }
  }, []);
  useEffect(() => { fetchStatus(); const id = window.setInterval(fetchStatus, 30000); return () => window.clearInterval(id); }, [fetchStatus]);
  const pipeline = useMemo(() => derive(run, jobs), [run, jobs]);
  const githubUrl = run?.html_url || ACTIONS_URL;
  const cleared = pipeline.stages.filter((stage) => stage.state === "ready").length;
  return <main className="min-h-screen bg-[#09111a] text-[#eef4f5] selection:bg-[#63e6be]/30">
    <div className="pointer-events-none fixed inset-0 opacity-40 [background-image:linear-gradient(rgba(255,255,255,.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.025)_1px,transparent_1px)] [background-size:64px_64px]" />
    <header className="relative z-10 border-b border-white/[.08] bg-[#09111a]/85 backdrop-blur-xl"><div className="mx-auto flex max-w-[1480px] items-center justify-between px-5 py-4 sm:px-8 lg:px-12"><div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-[#63e6be] text-[#09111a] shadow-[0_0_30px_rgba(99,230,190,.22)]"><Languages size={21} strokeWidth={2.5} /></div><div><p className="font-display text-lg font-bold tracking-tight">Santali<span className="text-[#63e6be]">.AI</span></p><p className="font-mono text-[9px] uppercase tracking-[.2em] text-[#728090]">Live training console</p></div></div><div className="hidden items-center gap-7 md:flex"><a href="#overview" className="text-xs font-semibold text-[#9aa6b5] hover:text-white">Overview</a><a href="#pipeline" className="text-xs font-semibold text-[#9aa6b5] hover:text-white">Pipeline</a><a href="#telemetry" className="text-xs font-semibold text-[#9aa6b5] hover:text-white">Telemetry</a><span className="h-5 w-px bg-white/10" /><div className="flex items-center gap-2 text-xs text-[#9aa6b5]"><span className={`h-2 w-2 rounded-full ${loaded ? "animate-pulse bg-[#63e6be]" : "bg-[#ffc979]"}`} /> {loaded ? "Telemetry connected" : "Connecting"}</div></div><a href={githubUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[.04] px-3 py-2 text-xs font-bold text-[#cbd4dc] hover:border-[#63e6be]/40 hover:text-white">Open Actions <ArrowUpRight size={14} /></a></div></header>
    <section id="overview" className="relative z-10 mx-auto max-w-[1480px] px-5 pb-10 pt-12 sm:px-8 lg:px-12 lg:pt-16"><div className="grid gap-8 lg:grid-cols-[1fr_430px] lg:items-end"><div><div className="mb-5 flex flex-wrap items-center gap-3"><Pill tone={pipeline.tone}><span className="h-1.5 w-1.5 rounded-full bg-current" />{pipeline.badge}</Pill><span className="font-mono text-[10px] uppercase tracking-[.12em] text-[#728090]">Run {run ? `#${run.id}` : "—"} · checked {lastChecked}</span></div><h1 className="max-w-3xl font-display text-4xl font-bold leading-[1.04] tracking-[-.04em] text-white sm:text-6xl">See the truth behind<br /><span className="text-[#738394]">every training run.</span></h1><p className="mt-6 max-w-2xl text-sm leading-7 text-[#8f9dab] sm:text-base"><strong className="text-[#dce7e9]">{pipeline.headline}</strong> {pipeline.sub}</p><div className="mt-8 flex flex-wrap gap-3"><button onClick={fetchStatus} disabled={checking} className="inline-flex items-center gap-2 rounded-lg bg-[#63e6be] px-4 py-3 text-xs font-extrabold text-[#09111a] shadow-[0_8px_30px_rgba(99,230,190,.18)] hover:bg-[#84f2d0] disabled:opacity-70">{checking ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />} Refresh telemetry</button><a href={KAGGLE_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[.04] px-4 py-3 text-xs font-extrabold text-[#cbd4dc] hover:bg-white/[.08]">Open Kaggle kernel <ExternalLink size={14} /></a></div>{error && <p className="mt-4 text-xs text-[#ff9ba1]">{error} · showing the last known state</p>}</div><div className="relative overflow-hidden rounded-2xl border border-white/[.1] bg-[#101d27] p-6 shadow-[0_25px_80px_rgba(0,0,0,.22)]"><div className="absolute -right-20 -top-20 h-52 w-52 rounded-full border-[28px] border-[#63e6be]/10" /><div className="relative"><div className="flex items-center justify-between"><p className="font-mono text-[10px] uppercase tracking-[.18em] text-[#728090]">Actual training progress</p><Activity size={17} className={pipeline.trainingPercent === 0 ? "text-[#ffc979]" : "text-[#63e6be]"} /></div><div className="mt-6 flex items-end gap-2"><span className="font-display text-6xl font-bold tracking-[-.06em] text-white">{pipeline.trainingPercent === null ? "—" : `${pipeline.trainingPercent}%`}</span><span className="mb-2 text-xs text-[#728090]">{pipeline.trainingLabel}</span></div><div className="mt-5 h-2 overflow-hidden rounded-full bg-white/[.08]"><div className={`h-full rounded-full transition-all duration-700 ${pipeline.trainingPercent === 0 ? "bg-[#ffc979]" : "bg-[#63e6be] shadow-[0_0_18px_#63e6be]"}`} style={{ width: `${pipeline.trainingPercent ?? 0}%` }} /></div><div className="mt-5 flex items-center justify-between rounded-lg border border-[#ffc979]/15 bg-[#ffc979]/[.05] px-3 py-2.5 text-[10px] leading-5 text-[#cbb887]"><CircleAlert size={14} className="mr-2 shrink-0 text-[#ffc979]" />{pipeline.trainingPercent === 0 ? "GPU training has not started" : "Epoch telemetry requires Kaggle metrics"}</div></div></div></div></section>
    <section className="relative z-10 mx-auto max-w-[1480px] px-5 pb-7 sm:px-8 lg:px-12"><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><Stat label="Workflow progress" value={`${pipeline.workflowPercent}%`} sub={pipeline.workflowLabel} icon={GitBranch} accent="mint" /><Stat label="GPU training" value={pipeline.trainingPercent === null ? "—" : `${pipeline.trainingPercent}%`} sub={pipeline.trainingLabel} icon={GraduationCap} accent="blue" /><Stat label="Training loss" value={pipeline.loss} sub="Only from Kaggle metrics" icon={Activity} accent="amber" /><Stat label="Quality score" value={pipeline.quality} sub="BLEU · chrF · review" icon={Target} accent="violet" /></div></section>
    <section id="telemetry" className="relative z-10 mx-auto grid max-w-[1480px] gap-4 px-5 pb-7 sm:px-8 lg:grid-cols-[1.25fr_.75fr] lg:px-12"><div className="rounded-2xl border border-white/[.08] bg-[#101b25] p-5 sm:p-7"><div className="flex items-start justify-between"><div><p className="font-mono text-[10px] uppercase tracking-[.18em] text-[#728090]">Live telemetry</p><h2 className="mt-2 font-display text-xl font-bold text-white">No fabricated metrics</h2></div><Pill tone={pipeline.tone}><span className="h-1.5 w-1.5 rounded-full bg-current" /> {pipeline.workflowLabel}</Pill></div><div className="mt-8 grid gap-3 sm:grid-cols-3"><div className="rounded-xl border border-white/[.06] bg-white/[.025] p-4"><p className="font-mono text-[9px] uppercase tracking-[.16em] text-[#728090]">Latest workflow</p><p className="mt-3 text-sm font-bold text-white">{run?.display_title || "Waiting for run"}</p><p className="mt-2 text-[11px] text-[#748392]">{run ? new Date(run.updated_at).toLocaleString() : "—"}</p></div><div className="rounded-xl border border-white/[.06] bg-white/[.025] p-4"><p className="font-mono text-[9px] uppercase tracking-[.16em] text-[#728090]">Epoch</p><p className="mt-3 text-sm font-bold text-white">{pipeline.epoch}</p><p className="mt-2 text-[11px] text-[#748392]">Requires metrics.json</p></div><div className="rounded-xl border border-white/[.06] bg-white/[.025] p-4"><p className="font-mono text-[9px] uppercase tracking-[.16em] text-[#728090]">Data gate</p><p className="mt-3 text-sm font-bold text-white">{pipeline.stages[1].state === "blocked" ? "Blocked" : "Waiting"}</p><p className="mt-2 text-[11px] text-[#748392]">License-cleared pairs only</p></div></div><div className="mt-6 flex items-start gap-3 rounded-xl border border-[#ffc979]/15 bg-[#ffc979]/[.05] p-3.5 text-xs leading-5 text-[#b9a479]"><CircleAlert size={15} className="mt-0.5 shrink-0 text-[#ffc979]" /><p>{pipeline.note}</p></div></div><div className="rounded-2xl border border-white/[.08] bg-[#101b25] p-5 sm:p-7"><div className="flex items-center justify-between"><div><p className="font-mono text-[10px] uppercase tracking-[.18em] text-[#728090]">Model profile</p><h2 className="mt-2 font-display text-xl font-bold text-white">IndicTrans2</h2></div><Sparkles className="text-[#ffc979]" size={20} /></div><div className="mt-7 space-y-4"><div className="flex justify-between border-b border-white/[.06] pb-3 text-xs"><span className="text-[#71808e]">Architecture</span><span className="font-mono text-[10px] text-[#c4ced4]">Encoder-decoder</span></div><div className="flex justify-between border-b border-white/[.06] pb-3 text-xs"><span className="text-[#71808e]">Parameters</span><span className="font-mono text-[10px] text-[#c4ced4]">320M</span></div><div className="flex justify-between border-b border-white/[.06] pb-3 text-xs"><span className="text-[#71808e]">Adapter</span><span className="font-mono text-[10px] text-[#c4ced4]">LoRA · r=16</span></div><div className="flex justify-between border-b border-white/[.06] pb-3 text-xs"><span className="text-[#71808e]">Data policy</span><span className="font-mono text-[10px] text-[#c4ced4]">License-gated</span></div></div><div className="mt-6 flex items-center gap-2 rounded-lg bg-[#63e6be]/[.07] px-3 py-2.5 text-xs text-[#9fe8d2]"><Wifi size={14} /> GitHub telemetry connected</div></div></section>
    <section id="pipeline" className="relative z-10 mx-auto grid max-w-[1480px] gap-4 px-5 pb-10 sm:px-8 lg:grid-cols-[1.15fr_.85fr] lg:px-12"><div className="rounded-2xl border border-white/[.08] bg-[#101b25] p-5 sm:p-7"><div className="flex items-start justify-between"><div><p className="font-mono text-[10px] uppercase tracking-[.18em] text-[#728090]">Orchestration</p><h2 className="mt-2 font-display text-xl font-bold text-white">Truthful pipeline state</h2></div><span className="font-mono text-[10px] text-[#728090]">AUTO-REFRESH · 30s</span></div><div className="mt-6 space-y-2">{pipeline.stages.map((stage, index) => <div key={stage.id} className="flex items-center gap-3 rounded-xl border border-white/[.06] bg-white/[.025] p-3.5"><div className={`grid h-9 w-9 place-items-center rounded-lg ${stage.state === "ready" ? "bg-[#63e6be]/10 text-[#63e6be]" : stage.state === "running" ? "bg-[#65b6ff]/10 text-[#7bc4ff]" : stage.state === "failed" ? "bg-[#ff7e87]/10 text-[#ff9ba1]" : stage.state === "blocked" ? "bg-[#ffc979]/10 text-[#ffc979]" : "bg-white/[.05] text-[#71808e]"}`}><StageIcon stage={stage} /></div><div className="min-w-0 flex-1"><p className="text-xs font-bold text-[#dbe5e8]">{index + 1}. {stage.label}</p><p className="mt-1 text-[11px] text-[#71808e]">{stage.caption}</p></div><span className="font-mono text-[9px] uppercase tracking-wider text-[#728090]">{stage.state}</span></div>)}</div></div><div className="space-y-4"><div className="rounded-2xl border border-white/[.08] bg-[#101b25] p-5 sm:p-7"><div className="flex items-center gap-3"><div className="grid h-9 w-9 place-items-center rounded-lg bg-[#ffc979]/10 text-[#ffc979]"><Server size={17} /></div><div><p className="font-mono text-[10px] uppercase tracking-[.18em] text-[#728090]">Connected systems</p><h2 className="mt-1 font-display text-xl font-bold text-white">Infrastructure</h2></div></div><div className="mt-5 space-y-2"><a href={githubUrl} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-lg border border-white/[.06] p-3 hover:border-[#63e6be]/30"><GitBranch size={15} className="text-[#7bc4ff]" /><span className="min-w-0 flex-1"><strong className="block text-xs text-[#dbe5e8]">GitHub Actions</strong><small className="block truncate font-mono text-[10px] text-[#71808e]">{run ? `#${run.id} · ${run.status}` : "Waiting for run"}</small></span><ArrowUpRight size={14} className="text-[#526272]" /></a><a href={KAGGLE_URL} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-lg border border-white/[.06] p-3 hover:border-[#63e6be]/30"><Cloud size={15} className="text-[#7bc4ff]" /><span className="min-w-0 flex-1"><strong className="block text-xs text-[#dbe5e8]">Kaggle kernel</strong><small className="block truncate font-mono text-[10px] text-[#71808e]">GPU training · metrics.json required</small></span><ArrowUpRight size={14} className="text-[#526272]" /></a></div></div><div className="rounded-2xl border border-[#63e6be]/15 bg-[#63e6be]/[.045] p-5"><p className="font-mono text-[10px] uppercase tracking-[.18em] text-[#63e6be]">Stages cleared</p><p className="mt-2 font-display text-3xl font-bold text-white">{cleared}<span className="text-lg text-[#71808e]"> / {pipeline.stages.length}</span></p><p className="mt-2 text-xs leading-5 text-[#9bb2b4]">Only completed GitHub steps count. GPU epochs and loss appear after Kaggle emits metrics.</p></div></div></section>
    <footer className="relative z-10 border-t border-white/[.08] bg-[#0c151e] px-5 py-6 sm:px-8 lg:px-12"><div className="mx-auto flex max-w-[1480px] items-center justify-between gap-4"><div className="flex items-center gap-3"><div className="grid h-8 w-8 place-items-center rounded-lg bg-[#63e6be] text-[#09111a]"><Languages size={16} /></div><div><p className="text-xs font-bold text-[#cbd4dc]">Santali AI research console</p><p className="font-mono text-[9px] text-[#607080]">Live GitHub state · no fabricated training metrics</p></div></div><a href={ACTIONS_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-xs font-bold text-[#63e6be]">View source telemetry <ArrowUpRight size={14} /></a></div></footer>
  </main>;
}
