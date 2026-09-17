import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  BookOpen,
  Check,
  ChevronRight,
  CircleAlert,
  Cloud,
  Database,
  ExternalLink,
  Gauge,
  GitBranch,
  GraduationCap,
  Languages,
  Loader2,
  LockKeyhole,
  RefreshCw,
  Server,
  Sparkles,
  Target,
  Users,
  Wifi,
  Zap,
} from "lucide-react";

const REPO = "murmusuvash2-wq/santali-ai";
const ACTIONS_API = `https://api.github.com/repos/${REPO}/actions/runs?per_page=5`;
const KAGGLE_URL = "https://www.kaggle.com/code/ezqrio/santali-ai-translation";
const KAGGLE_PROFILE = "https://www.kaggle.com/ezqrio";
const ACTIONS_URL = `https://github.com/${REPO}/actions`;

type StageState = "ready" | "blocked" | "running" | "failed" | "waiting";

type Stage = {
  id: string;
  label: string;
  caption: string;
  icon: React.ElementType;
  state: StageState;
};

type GhRun = {
  id: number;
  name: string;
  status: string;
  conclusion: string | null;
  html_url: string;
  created_at: string;
  updated_at: string;
  display_title?: string;
};

const lessons = [
  ["Hindi → Ol Chiki", "hin_Deva → sat_Olck", "Planned"],
  ["English → Ol Chiki", "eng_Latn → sat_Olck", "Planned"],
  ["Ol Chiki script", "Unicode-safe normalization", "Ready"],
];

function StatusPill({
  tone,
  children,
}: {
  tone: "amber" | "green" | "red" | "slate" | "blue";
  children: React.ReactNode;
}) {
  const styles = {
    amber: "bg-[#fff2d5] text-[#9c5a00] ring-[#f4c76c]/50",
    green: "bg-[#dff7ec] text-[#13704a] ring-[#8ee0bb]/50",
    red: "bg-[#ffe5e1] text-[#a13b35] ring-[#f2a79f]/50",
    slate: "bg-[#e9edf2] text-[#53616d] ring-[#cbd4dc]/70",
    blue: "bg-[#e8f1ff] text-[#1d4f91] ring-[#a8c4f0]/50",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold tracking-[0.08em] ring-1 ${styles[tone]}`}
    >
      {children}
    </span>
  );
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function derivePipeline(run: GhRun | null): {
  stages: Stage[];
  percent: number;
  done: number;
  badge: { tone: "amber" | "green" | "red" | "slate" | "blue"; label: string };
  headline: React.ReactNode;
  metrics: {
    label: string;
    value: string;
    sub: string;
    icon: React.ElementType;
    tone: string;
  }[];
  tip: string;
} {
  const baseStages: Stage[] = [
    {
      id: "data",
      label: "Data prepared",
      caption: "Parallel pairs + license checks",
      icon: Database,
      state: "ready",
    },
    {
      id: "upload",
      label: "Kaggle input",
      caption: "Approved dataset attached",
      icon: Cloud,
      state: "blocked",
    },
    {
      id: "model",
      label: "Base model",
      caption: "IndicTrans2 · 320M",
      icon: Sparkles,
      state: "ready",
    },
    {
      id: "train",
      label: "LoRA training",
      caption: "GPU fine-tuning run",
      icon: GraduationCap,
      state: "blocked",
    },
    {
      id: "eval",
      label: "Evaluation",
      caption: "BLEU / chrF + native review",
      icon: Target,
      state: "waiting",
    },
  ];

  if (!run) {
    return {
      stages: baseStages,
      percent: 20,
      done: 1,
      badge: { tone: "amber", label: "WAITING FOR INPUT" },
      headline: (
        <>
          Humara model abhi <span className="text-[#d28a24]">seekhne ke liye ready</span> hai.
        </>
      ),
      metrics: [
        {
          label: "Base model",
          value: "IndicTrans2",
          sub: "320M parameters",
          icon: Sparkles,
          tone: "green",
        },
        {
          label: "Training data",
          value: "Not attached",
          sub: "Needs Kaggle input",
          icon: Database,
          tone: "amber",
        },
        {
          label: "GPU run",
          value: "Not started",
          sub: "Waiting for dataset",
          icon: Zap,
          tone: "slate",
        },
        {
          label: "Quality score",
          value: "—",
          sub: "Appears after evaluation",
          icon: Target,
          tone: "slate",
        },
      ],
      tip: "Kaggle input dataset attach hote hi GitHub workflow kernel push karega. Uske baad GPU allocation, dependencies, data validation aur LoRA training automatic steps hain.",
    };
  }

  const status = run.status; // queued | in_progress | completed
  const conclusion = run.conclusion; // success | failure | cancelled | null

  if (status === "in_progress" || status === "queued") {
    baseStages[1].state = "running";
    baseStages[1].caption = "Workflow running — dataset / kernel push";
    baseStages[3].state = "running";
    baseStages[3].caption = "GPU job may be starting on Kaggle";
    return {
      stages: baseStages,
      percent: 45,
      done: 2,
      badge: { tone: "blue", label: status === "queued" ? "QUEUED" : "RUNNING" },
      headline: (
        <>
          Training <span className="text-[#1d4f91]">chal rahi hai</span> — pipeline active.
        </>
      ),
      metrics: [
        {
          label: "Base model",
          value: "IndicTrans2",
          sub: "320M parameters",
          icon: Sparkles,
          tone: "green",
        },
        {
          label: "Training data",
          value: "Pushing",
          sub: "Workflow in progress",
          icon: Database,
          tone: "blue",
        },
        {
          label: "GPU run",
          value: "Starting",
          sub: "Kaggle kernel push",
          icon: Zap,
          tone: "blue",
        },
        {
          label: "Quality score",
          value: "—",
          sub: "After evaluation",
          icon: Target,
          tone: "slate",
        },
      ],
      tip: "GitHub Actions abhi Kaggle pe dataset update aur kernel push kar raha hai. Complete hone ke baad metrics yahan update honge.",
    };
  }

  if (conclusion === "success") {
    baseStages[1].state = "ready";
    baseStages[1].caption = "Dataset + kernel push completed";
    baseStages[3].state = "ready";
    baseStages[3].caption = "Workflow finished successfully";
    baseStages[4].state = "waiting";
    baseStages[4].caption = "Check Kaggle outputs for metrics";
    return {
      stages: baseStages,
      percent: 80,
      done: 4,
      badge: { tone: "green", label: "WORKFLOW SUCCESS" },
      headline: (
        <>
          Pipeline <span className="text-[#13704a]">successfully complete</span> ho gayi.
        </>
      ),
      metrics: [
        {
          label: "Base model",
          value: "IndicTrans2",
          sub: "320M parameters",
          icon: Sparkles,
          tone: "green",
        },
        {
          label: "Training data",
          value: "Attached",
          sub: "Kaggle dataset updated",
          icon: Database,
          tone: "green",
        },
        {
          label: "GPU run",
          value: "Pushed",
          sub: "Check Kaggle kernel",
          icon: Zap,
          tone: "green",
        },
        {
          label: "Quality score",
          value: "Pending",
          sub: "Open Kaggle outputs",
          icon: Target,
          tone: "amber",
        },
      ],
      tip: "GitHub workflow success. Ab Kaggle kernel outputs (adapter + metrics.json) check karo. Native speaker review still required before production.",
    };
  }

  // failure / cancelled / other
  baseStages[1].state = "failed";
  baseStages[1].caption = "Workflow failed — check Actions log";
  baseStages[3].state = "failed";
  baseStages[3].caption = "Training did not complete";
  return {
    stages: baseStages,
    percent: 25,
    done: 1,
    badge: {
      tone: "red",
      label: conclusion === "cancelled" ? "CANCELLED" : "FAILED",
    },
    headline: (
      <>
        Run <span className="text-[#a13b35]">fail</span> ho gaya — log check karo.
      </>
    ),
    metrics: [
      {
        label: "Base model",
        value: "IndicTrans2",
        sub: "320M parameters",
        icon: Sparkles,
        tone: "green",
      },
      {
        label: "Training data",
        value: "Error",
        sub: "See GitHub Actions",
        icon: Database,
        tone: "red",
      },
      {
        label: "GPU run",
        value: "Failed",
        sub: conclusion || "error",
        icon: Zap,
        tone: "red",
      },
      {
        label: "Quality score",
        value: "—",
        sub: "Blocked by failure",
        icon: Target,
        tone: "slate",
      },
    ],
    tip: "Common causes: missing KAGGLE_API_TOKEN secret, path errors in kernel, or dataset not found. Open the GitHub run log for the exact step.",
  };
}

export default function Home() {
  const [checking, setChecking] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [lastChecked, setLastChecked] = useState("—");
  const [run, setRun] = useState<GhRun | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  const fetchStatus = useCallback(async () => {
    setChecking(true);
    setError(null);
    try {
      const res = await fetch(ACTIONS_API, {
        headers: { Accept: "application/vnd.github+json" },
      });
      if (!res.ok) {
        throw new Error(`GitHub API ${res.status}`);
      }
      const data = await res.json();
      const runs: GhRun[] = data.workflow_runs || [];
      // Prefer the Kaggle training workflow if present
      const preferred =
        runs.find((r) => /kaggle/i.test(r.name)) || runs[0] || null;
      setRun(preferred);
      setLastChecked(relativeTime(new Date().toISOString()));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to fetch status");
    } finally {
      setChecking(false);
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    const id = window.setInterval(fetchStatus, 60_000);
    return () => window.clearInterval(id);
  }, [fetchStatus]);

  const pipeline = useMemo(() => derivePipeline(run), [run]);
  const githubRunUrl = run?.html_url || ACTIONS_URL;
  const runLabel = run
    ? `Run #${run.id} · ${run.status}${run.conclusion ? `/${run.conclusion}` : ""}`
    : "No recent runs";

  return (
    <main className="min-h-screen overflow-hidden bg-[#f5f7f3] text-[#18242a]">
      <div className="pointer-events-none fixed inset-0 opacity-40 [background-image:radial-gradient(#c9d9d0_0.7px,transparent_0.7px)] [background-size:18px_18px]" />
      <header className="relative z-10 border-b border-[#dbe5df] bg-[#f5f7f3]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-5 py-4 sm:px-8 lg:px-12">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[#173f35] text-[#d7f6bb] shadow-[0_8px_24px_rgba(23,63,53,0.2)]">
              <Languages size={21} />
            </div>
            <div>
              <p className="font-display text-lg font-extrabold tracking-tight">
                Santali AI
              </p>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#74837b]">
                Learning control room
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs font-semibold text-[#64736b]">
            <span className="hidden sm:inline">Ol Chiki · Data-first</span>
            <span className="h-2 w-2 rounded-full bg-[#efb64d] shadow-[0_0_0_5px_#f8e7c0]" />{" "}
            Live monitor
          </div>
        </div>
      </header>

      <section className="relative z-10 mx-auto max-w-[1440px] px-5 pb-10 pt-10 sm:px-8 lg:px-12 lg:pt-14">
        <div className="grid gap-8 lg:grid-cols-[1.3fr_0.7fr] lg:items-end">
          <div>
            <div className="mb-5 flex flex-wrap items-center gap-3">
              <StatusPill tone={pipeline.badge.tone}>
                {pipeline.badge.tone === "red" ? (
                  <CircleAlert size={13} />
                ) : pipeline.badge.tone === "blue" ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <CircleAlert size={13} />
                )}"{" "}
                {pipeline.badge.label}
              </StatusPill>
              <span className="text-xs font-semibold text-[#718079]">
                {runLabel} · checked {lastChecked}
              </span>
            </div>
            <h1 className="max-w-3xl font-display text-4xl font-black leading-[0.98] tracking-[-0.05em] text-[#173f35] sm:text-6xl lg:text-7xl">
              {pipeline.headline}
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-[#5f7068] sm:text-lg">
              Yeh page transparent tareeke se dikhata hai ki Santali AI ne kya
              prepare kiya, training kahan ruki hai, aur run start hone ke baad
              kitna improve kar raha hai.
            </p>
            {error && (
              <p className="mt-3 text-sm font-semibold text-[#a13b35]">
                Status fetch error: {error}. Showing last known / default state.
              </p>
            )}
            <div className="mt-8 flex flex-wrap gap-3">
              <button
                onClick={fetchStatus}
                disabled={checking}
                className="group inline-flex items-center gap-2 rounded-xl bg-[#173f35] px-5 py-3 text-sm font-bold text-white shadow-[0_12px_24px_rgba(23,63,53,0.18)] transition hover:-translate-y-0.5 hover:bg-[#20594b] active:scale-[0.98] disabled:opacity-70"
              >
                {checking ? (
                  <RefreshCw className="animate-spin" size={16} />
                ) : (
                  <RefreshCw size={16} />
                )}"{" "}
                Check latest status
              </button>
              <a
                href={githubRunUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-[#cddbd3] bg-white/70 px-5 py-3 text-sm font-bold text-[#315b4e] transition hover:-translate-y-0.5 hover:bg-white"
              >
                Open GitHub run <ExternalLink size={15} />
              </a>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-[28px] bg-[#173f35] p-6 text-white shadow-[0_24px_60px_rgba(23,63,53,0.2)] sm:p-8">
            <div className="absolute -right-10 -top-12 h-40 w-40 rounded-full border-[18px] border-[#d7f6bb]/20" />
            <div className="absolute -bottom-20 -left-10 h-48 w-48 rounded-full border-[22px] border-[#efb64d]/20" />
            <div className="relative">
              <div className="mb-8 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-[0.16em] text-[#b9d5c5]">
                  Learning progress
                </span>
                <Gauge size={19} className="text-[#d7f6bb]" />
              </div>
              <div className="flex items-end gap-3">
                <span className="font-display text-7xl font-black tracking-[-0.07em] text-[#d7f6bb]">
                  {pipeline.percent}%
                </span>
                <span className="mb-3 text-sm font-semibold text-[#b9d5c5]">
                  pipeline complete
                </span>
              </div>
              <div className="mt-5 h-3 overflow-hidden rounded-full bg-white/15">
                <div
                  className="h-full rounded-full bg-[#d7f6bb] shadow-[0_0_14px_#d7f6bb] transition-all duration-700"
                  style={{ width: `${pipeline.percent}%` }}
                />
              </div>
              <div className="mt-4 flex justify-between text-xs font-semibold text-[#b9d5c5]">
                <span>
                  {pipeline.done} of 5 stages ready
                </span>
                <span>{loaded ? "Live from GitHub" : "Loading…"}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-[1440px] px-5 pb-8 sm:px-8 lg:px-12">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {pipeline.metrics.map((m) => {
            const MetricIcon = m.icon;
            return (
              <div
                key={m.label}
                className="rounded-2xl border border-[#dbe5df] bg-white/75 p-5 shadow-[0_8px_30px_rgba(38,70,57,0.04)]"
              >
                <div className="flex items-start justify-between">
                  <span className="text-xs font-bold uppercase tracking-[0.12em] text-[#7c8b83]">
                    {m.label}
                  </span>
                  <MetricIcon
                    size={17}
                    className={
                      m.tone === "green"
                        ? "text-[#3f9b6e]"
                        : m.tone === "amber"
                          ? "text-[#d28a24]"
                          : m.tone === "red"
                            ? "text-[#a13b35]"
                            : m.tone === "blue"
                              ? "text-[#1d4f91]"
                              : "text-[#9aa8a2]"
                    }
                  />
                </div>
                <p className="mt-4 font-display text-2xl font-black tracking-tight text-[#173f35]">
                  {m.value}
                </p>
                <p className="mt-1 text-xs font-semibold text-[#809088]">{m.sub}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="relative z-10 mx-auto grid max-w-[1440px] gap-6 px-5 pb-14 sm:px-8 lg:grid-cols-[1.15fr_0.85fr] lg:px-12">
        <div className="rounded-[26px] border border-[#dbe5df] bg-white/80 p-6 shadow-[0_12px_40px_rgba(38,70,57,0.06)] sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#809088]">
                What happens next
              </p>
              <h2 className="mt-2 font-display text-2xl font-black tracking-tight text-[#173f35]">
                Training pipeline
              </h2>
            </div>
            <span className="rounded-full bg-[#fff2d5] px-3 py-1 text-[11px] font-bold text-[#9c5a00]">
              {pipeline.done} / 5 ready
            </span>
          </div>
          <div className="mt-8 space-y-3">
            {pipeline.stages.map((stage) => {
              const Icon = stage.icon;
              const isDone = stage.state === "ready";
              const isBlocked = stage.state === "blocked";
              const isRunning = stage.state === "running";
              const isFailed = stage.state === "failed";
              return (
                <div
                  key={stage.id}
                  className={`relative flex items-center gap-4 rounded-2xl border p-4 transition ${
                    isBlocked || isFailed
                      ? isFailed
                        ? "border-[#f2a79f] bg-[#fff5f3]"
                        : "border-[#f0dfb6] bg-[#fffaf0]"
                      : isRunning
                        ? "border-[#a8c4f0] bg-[#f3f7ff]"
                        : "border-[#e1e9e3] bg-[#fbfcfa]"
                  }`}
                >
                  <div
                    className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${
                      isDone
                        ? "bg-[#dff7ec] text-[#13704a]"
                        : isFailed
                          ? "bg-[#ffe5e1] text-[#a13b35]"
                          : isBlocked
                            ? "bg-[#fff0cf] text-[#a66a17]"
                            : isRunning
                              ? "bg-[#e8f1ff] text-[#1d4f91]"
                              : "bg-[#e9edf2] text-[#718079]"
                    }`}
                  >
                    {isDone ? (
                      <Check size={18} strokeWidth={3} />
                    ) : isBlocked ? (
                      <LockKeyhole size={17} />
                    ) : isRunning ? (
                      <Loader2 size={17} className="animate-spin" />
                    ) : (
                      <Icon size={18} />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-extrabold text-[#29443a]">
                        {stage.label}
                      </p>
                      {isDone && <StatusPill tone="green">DONE</StatusPill>}
                      {isBlocked && (
                        <StatusPill tone="amber">BLOCKED</StatusPill>
                      )}
                      {isRunning && (
                        <StatusPill tone="blue">RUNNING</StatusPill>
                      )}
                      {isFailed && <StatusPill tone="red">FAILED</StatusPill>}
                    </div>
                    <p className="mt-1 text-xs font-medium text-[#829087]">
                      {stage.caption}
                    </p>
                  </div>
                  <ChevronRight size={17} className="text-[#bdc9c1]" />
                </div>
              );
            })}
          </div>
          <div className="mt-6 flex items-start gap-3 rounded-2xl bg-[#fff7e7] p-4 text-sm text-[#76531d]">
            <CircleAlert
              size={17}
              className="mt-0.5 shrink-0 text-[#d28a24]"
            />
            <p>
              <strong>Status note:</strong> {pipeline.tip}
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[26px] bg-[#e5f0e9] p-6 sm:p-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#648073]">
                  What the model will learn
                </p>
                <h2 className="mt-2 font-display text-2xl font-black tracking-tight text-[#173f35]">
                  Lessons queued
                </h2>
              </div>
              <BookOpen className="text-[#3c8064]" size={23} />
            </div>
            <div className="mt-6 space-y-3">
              {lessons.map(([name, detail, state]) => (
                <div
                  key={name}
                  className="flex items-center gap-3 rounded-xl bg-white/70 p-3"
                >
                  <div className="grid h-8 w-8 place-items-center rounded-lg bg-[#d0e7d9] text-[#286b52]">
                    <Languages size={15} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-[#29443a]">
                      {name}
                    </p>
                    <p className="text-[11px] font-medium text-[#799087]">
                      {detail}
                    </p>
                  </div>
                  <span
                    className={`text-[10px] font-extrabold uppercase tracking-wider ${
                      state === "Ready"
                        ? "text-[#2b8a5d]"
                        : "text-[#9c7a3b]"
                    }`}
                  >
                    {state}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-[26px] border border-[#dbe5df] bg-white/80 p-6 sm:p-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#809088]">
                  Run details
                </p>
                <h2 className="mt-2 font-display text-xl font-black tracking-tight text-[#173f35]">
                  Connected systems
                </h2>
              </div>
              <Wifi size={20} className="text-[#4f9275]" />
            </div>
            <div className="mt-5 space-y-3 text-sm">
              <a
                href={githubRunUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 rounded-xl border border-[#e2e9e4] p-3 transition hover:bg-[#f7faf7]"
              >
                <GitBranch size={17} className="text-[#315b4e]" />
                <span className="flex-1">
                  <strong className="block text-[#29443a]">GitHub Actions</strong>
                  <small className="text-xs text-[#849188]">
                    {run
                      ? `#${run.id} · ${run.name} · ${run.status}`
                      : "Latest workflow runs"}
                  </small>
                </span>
                <ArrowUpRight size={16} className="text-[#9aa8a2]" />
              </a>
              <a
                href={KAGGLE_URL}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 rounded-xl border border-[#e2e9e4] p-3 transition hover:bg-[#f7faf7]"
              >
                <Server size={17} className="text-[#315b4e]" />
                <span className="flex-1">
                  <strong className="block text-[#29443a]">Kaggle kernel</strong>
                  <small className="text-xs text-[#849188]">
                    ezqrio/santali-ai-translation · GPU
                  </small>
                </span>
                <ArrowUpRight size={16} className="text-[#9aa8a2]" />
              </a>
              <a
                href={KAGGLE_PROFILE}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 rounded-xl border border-[#e2e9e4] p-3 transition hover:bg-[#f7faf7]"
              >
                <Server size={17} className="text-[#315b4e]" />
                <span className="flex-1">
                  <strong className="block text-[#29443a]">Kaggle profile</strong>
                  <small className="text-xs text-[#849188]">ezqrio</small>
                </span>
                <ArrowUpRight size={16} className="text-[#9aa8a2]" />
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 border-t border-[#dbe5df] bg-[#edf4ef] px-5 py-8 sm:px-8 lg:px-12">
        <div className="mx-auto flex max-w-[1440px] flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-[#d7f6bb] text-[#173f35]">
              <Users size={17} />
            </div>
            <div>
              <p className="text-sm font-extrabold text-[#29443a]">
                Native speaker review is part of the score
              </p>
              <p className="text-xs font-medium text-[#809088]">
                Automatic metrics tell us progress; people tell us whether
                Santali sounds right.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowExplanation(!showExplanation)}
            className="inline-flex items-center gap-2 text-sm font-bold text-[#2e7157] hover:text-[#173f35]"
          >
            How to read this page{" "}
            <ChevronRight
              size={16}
              className={showExplanation ? "rotate-90 transition" : "transition"}
            />
          </button>
        </div>
        {showExplanation && (
          <div className="mx-auto mt-5 max-w-[1440px] rounded-2xl bg-white/70 p-4 text-sm leading-6 text-[#5f7068]">
            Status ab GitHub Actions API se live aata hai (har minute auto-refresh +
            manual button). Success = workflow ne Kaggle push complete kiya.
            Actual BLEU/chrF numbers Kaggle kernel output (metrics.json) se aayenge.
            Native speaker review production se pehle zaroori hai.
          </div>
        )}
      </section>
    </main>
  );
}
