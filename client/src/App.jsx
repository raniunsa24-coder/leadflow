import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  BarChart3,
  Bookmark,
  BookmarkCheck,
  Building2,
  CheckCircle2,
  ChevronRight,
  Download,
  Filter,
  Globe2,
  LayoutDashboard,
  MapPin,
  Menu,
  Search,
  Sparkles,
  Target,
  TrendingUp,
  X,
} from "lucide-react";

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api/leads";

const fallbackLeads = [
  {
    id: 1,
    company: "Northstar Manufacturing",
    industry: "Manufacturing",
    location: "Austin, TX",
    revenue: "$8.4M",
    employees: 62,
    score: 100,
    fit: "Excellent Fit",
    reason:
      "Strong revenue, scalable operations, and attractive acquisition profile.",
  },
  {
    id: 2,
    company: "Vertex Industrial Group",
    industry: "Industrial Services",
    location: "Dallas, TX",
    revenue: "$6.7M",
    employees: 48,
    score: 90,
    fit: "Excellent Fit",
    reason: "Established business with strong operating fundamentals.",
  },
  {
    id: 3,
    company: "BluePeak Software",
    industry: "SaaS",
    location: "Denver, CO",
    revenue: "$4.9M",
    employees: 35,
    score: 85,
    fit: "Excellent Fit",
    reason: "Recurring revenue model with strong growth potential.",
  },
  {
    id: 4,
    company: "Summit Equipment Co.",
    industry: "Manufacturing",
    location: "Phoenix, AZ",
    revenue: "$3.8M",
    employees: 29,
    score: 80,
    fit: "Strong Fit",
    reason: "Healthy business with a clear acquisition opportunity.",
  },
  {
    id: 5,
    company: "Crestline Logistics",
    industry: "Logistics",
    location: "Atlanta, GA",
    revenue: "$2.6M",
    employees: 24,
    score: 70,
    fit: "Potential Fit",
    reason: "Promising company with moderate acquisition signals.",
  },
];

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "discover", label: "Discover Leads", icon: Search },
  { id: "saved", label: "Saved Leads", icon: Bookmark },
  { id: "insights", label: "Insights", icon: BarChart3 },
];

function ScoreBadge({ score }) {
  const classes =
    score >= 85
      ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
      : score >= 75
        ? "bg-blue-50 text-blue-700 ring-blue-200"
        : "bg-amber-50 text-amber-700 ring-amber-200";

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${classes}`}
    >
      {score}
    </span>
  );
}

function FitBadge({ fit }) {
  const classes =
    fit === "Excellent Fit"
      ? "bg-emerald-50 text-emerald-700"
      : fit === "Strong Fit"
        ? "bg-blue-50 text-blue-700"
        : "bg-amber-50 text-amber-700";

  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-medium ${classes}`}
    >
      {fit}
    </span>
  );
}

function StatCard({ icon: Icon, label, value, detail, delay }) {
  return (
    <div
      className="group animate-fade-up rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition duration-500 hover:-translate-y-1.5 hover:shadow-xl sm:p-5"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">{label}</p>

          <p className="mt-2 text-xl font-bold tracking-tight text-slate-900 transition duration-300 group-hover:translate-x-0.5 sm:text-2xl">
            {value}
          </p>
        </div>

        <div className="shrink-0 rounded-xl bg-slate-100 p-2.5 text-slate-700 transition duration-500 group-hover:rotate-3 group-hover:scale-110 group-hover:bg-slate-900 group-hover:text-white">
          <Icon size={19} />
        </div>
      </div>

      <p className="mt-3 text-xs leading-5 text-slate-400">{detail}</p>
    </div>
  );
}

function EmptyState({ title, description }) {
  return (
    <div className="animate-fade-up flex min-h-[320px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white px-6 text-center sm:min-h-[360px]">
      <div className="animate-soft-pulse rounded-2xl bg-slate-100 p-4 text-slate-500">
        <Bookmark size={25} />
      </div>

      <h3 className="mt-4 text-lg font-semibold text-slate-900">{title}</h3>

      <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
        {description}
      </p>
    </div>
  );
}

function LoadingState({ text = "Loading..." }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 p-10 text-sm text-slate-500">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-slate-900" />
      <span>{text}</span>
    </div>
  );
}

export default function App() {
  const [activePage, setActivePage] = useState("dashboard");
  const [leads, setLeads] = useState([]);
  const [savedLeads, setSavedLeads] = useState(() => {
    try {
      const stored = localStorage.getItem("leadflow-saved-leads");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [selectedLead, setSelectedLead] = useState(null);
  const [scoreDetails, setScoreDetails] = useState(null);
  const [scoreLoading, setScoreLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [industry, setIndustry] = useState("All Industries");
  const [minimumScore, setMinimumScore] = useState("All Scores");

  const [loading, setLoading] = useState(true);
  const [apiStatus, setApiStatus] = useState("connecting");
  const [mobileMenu, setMobileMenu] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(
        "leadflow-saved-leads",
        JSON.stringify(savedLeads),
      );
    } catch {
      // Ignore localStorage errors.
    }
  }, [savedLeads]);

  const loadLeads = async ({
    searchValue = search,
    industryValue = industry,
    scoreValue = minimumScore,
  } = {}) => {
    try {
      setLoading(true);

      const params = new URLSearchParams();

      if (searchValue.trim()) {
        params.set("search", searchValue.trim());
      }

      if (industryValue !== "All Industries") {
        params.set("industry", industryValue);
      }

      if (scoreValue !== "All Scores") {
        params.set("minScore", scoreValue);
      }

      const query = params.toString();
      const url = query ? `${API_URL}?${query}` : API_URL;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error("Unable to load leads");
      }

      const data = await response.json();

      if (!Array.isArray(data.leads)) {
        throw new Error("Invalid API response");
      }

      setLeads(data.leads);
      setApiStatus("connected");
    } catch (error) {
      console.error(error);
      setLeads(fallbackLeads);
      setApiStatus("fallback");
    } finally {
      setLoading(false);
    }
  };

  const loadScoreDetails = async (lead) => {
    try {
      setScoreLoading(true);
      setScoreDetails(null);

      const response = await fetch(`${API_URL}/${lead.id}/score`);

      if (!response.ok) {
        throw new Error("Unable to calculate score");
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error("Invalid score response");
      }

      setScoreDetails(data);
    } catch (error) {
      console.error(error);
      setScoreDetails(null);
    } finally {
      setScoreLoading(false);
    }
  };

  useEffect(() => {
    loadLeads({
      searchValue: "",
      industryValue: "All Industries",
      scoreValue: "All Scores",
    });
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadLeads();
    }, 350);

    return () => clearTimeout(timer);
  }, [search, industry, minimumScore]);

  useEffect(() => {
    if (selectedLead) {
      loadScoreDetails(selectedLead);
    } else {
      setScoreDetails(null);
    }
  }, [selectedLead]);

  const industries = useMemo(() => {
    const source = leads.length ? leads : fallbackLeads;

    return [
      "All Industries",
      ...new Set(source.map((lead) => lead.industry)),
    ];
  }, [leads]);

  const filteredLeads = leads;

  const allKnownLeads = useMemo(() => {
    const map = new Map();

    [...fallbackLeads, ...leads].forEach((lead) => {
      map.set(lead.id, lead);
    });

    return Array.from(map.values());
  }, [leads]);

  const savedLeadObjects = allKnownLeads.filter((lead) =>
    savedLeads.includes(lead.id),
  );

  const highPriorityLeads = leads.filter((lead) => lead.score >= 85);

  const averageScore = leads.length
    ? Math.round(
        leads.reduce((total, lead) => total + lead.score, 0) / leads.length,
      )
    : 0;

  const toggleSaved = (leadId) => {
    setSavedLeads((current) =>
      current.includes(leadId)
        ? current.filter((id) => id !== leadId)
        : [...current, leadId],
    );
  };

  const goToPage = (page) => {
    setActivePage(page);
    setMobileMenu(false);
    setSelectedLead(null);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const clearFilters = () => {
    setSearch("");
    setIndustry("All Industries");
    setMinimumScore("All Scores");
  };

  const exportLeads = (data = filteredLeads) => {
    if (!data.length) return;

    const headers = [
      "Company",
      "Industry",
      "Location",
      "Revenue",
      "Employees",
      "Score",
      "Fit",
    ];

    const rows = data.map((lead) => [
      lead.company,
      lead.industry,
      lead.location,
      lead.revenue,
      lead.employees,
      lead.score,
      lead.fit,
    ]);

    const csv = [
      headers.join(","),
      ...rows.map((row) =>
        row
          .map((value) => `"${String(value).replace(/"/g, '""')}"`)
          .join(","),
      ),
    ].join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "leadflow-leads.csv";

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  };

  const pageTitle = {
    dashboard: "Deal sourcing dashboard",
    discover: "Discover acquisition leads",
    saved: "Saved leads",
    insights: "Lead intelligence",
  }[activePage];

  const pageDescription = {
    dashboard:
      "Prioritize the companies that show the strongest acquisition signals.",
    discover:
      "Search, filter, score, and evaluate potential acquisition targets.",
    saved:
      "Keep your highest-potential opportunities in one focused workspace.",
    insights:
      "Understand your pipeline through scoring, industry mix, and acquisition signals.",
  }[activePage];

  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from {
            opacity: 0;
            transform: translateY(16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.96) translateY(8px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-18px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes softPulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.04);
          }
        }

        .animate-fade-up {
          animation: fadeUp 0.6s cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        .animate-fade-in {
          animation: fadeIn 0.4s ease-out both;
        }

        .animate-scale-in {
          animation: scaleIn 0.35s cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        .animate-slide-in {
          animation: slideIn 0.35s cubic-bezier(0.22, 1, 0.36, 1) both;
        }

        .animate-soft-pulse {
          animation: softPulse 2.4s ease-in-out infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          *,
          *::before,
          *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            scroll-behavior: auto !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>

      <div className="min-h-screen overflow-x-hidden bg-slate-50 text-slate-900">
        <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-slate-200 bg-white lg:flex lg:flex-col">
          <div className="flex h-20 shrink-0 items-center border-b border-slate-100 px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white transition duration-500 hover:rotate-3 hover:scale-105">
                <Target size={21} />
              </div>

              <div className="min-w-0">
                <p className="text-lg font-bold tracking-tight">LeadFlow</p>

                <p className="truncate text-[11px] font-medium uppercase tracking-widest text-slate-400">
                  Acquisition intelligence
                </p>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-6">
            <p className="px-3 text-[11px] font-semibold uppercase tracking-widest text-slate-400">
              Workspace
            </p>

            <nav className="mt-3 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = activePage === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => goToPage(item.id)}
                    className={`flex w-full touch-manipulation items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium transition-all duration-300 ${
                      active
                        ? "bg-slate-900 text-white shadow-sm"
                        : "text-slate-600 hover:translate-x-1 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    <Icon size={18} />

                    <span>{item.label}</span>

                    {item.id === "saved" && savedLeads.length > 0 && (
                      <span
                        className={`ml-auto rounded-full px-2 py-0.5 text-[11px] ${
                          active
                            ? "bg-white/15 text-white"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {savedLeads.length}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="shrink-0 border-t border-slate-100 p-4">
            <div className="rounded-2xl bg-slate-900 p-4 text-white transition duration-500 hover:-translate-y-1 hover:shadow-xl">
              <div className="flex items-center gap-2">
                <Sparkles size={16} />

                <span className="text-sm font-semibold">Smart scoring</span>
              </div>

              <p className="mt-2 text-xs leading-5 text-slate-300">
                Focus your time on leads with the strongest acquisition
                signals.
              </p>
            </div>
          </div>
        </aside>

        {mobileMenu && (
          <div
            className="fixed inset-0 z-50 animate-fade-in bg-slate-950/40 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileMenu(false)}
          >
            <aside
              className="animate-slide-in flex h-full w-[min(86vw,320px)] flex-col overflow-y-auto bg-white shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex h-20 shrink-0 items-center justify-between border-b border-slate-100 px-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white">
                    <Target size={19} />
                  </div>

                  <p className="font-bold">LeadFlow</p>
                </div>

                <button
                  onClick={() => setMobileMenu(false)}
                  className="touch-manipulation rounded-lg p-2 text-slate-500 transition-all duration-200 hover:rotate-90 hover:bg-slate-100"
                  aria-label="Close menu"
                >
                  <X size={19} />
                </button>
              </div>

              <nav className="space-y-1 p-4">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const active = activePage === item.id;

                  return (
                    <button
                      key={item.id}
                      onClick={() => goToPage(item.id)}
                      className={`flex w-full touch-manipulation items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium transition-all duration-300 ${
                        active
                          ? "bg-slate-900 text-white"
                          : "text-slate-600 hover:translate-x-1 hover:bg-slate-100"
                      }`}
                    >
                      <Icon size={18} />

                      <span>{item.label}</span>

                      {item.id === "saved" && savedLeads.length > 0 && (
                        <span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">
                          {savedLeads.length}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </aside>
          </div>
        )}

        <main className="min-h-screen min-w-0 lg:ml-64">
          <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
            <div className="flex h-20 min-w-0 items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
              <div className="flex min-w-0 items-center gap-3">
                <button
                  onClick={() => setMobileMenu(true)}
                  className="shrink-0 touch-manipulation rounded-xl border border-slate-200 p-2 text-slate-600 transition-all duration-200 hover:scale-105 hover:bg-slate-50 lg:hidden"
                  aria-label="Open menu"
                >
                  <Menu size={20} />
                </button>

                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-400">LeadFlow</p>

                  <h1 className="max-w-[55vw] truncate text-base font-bold text-slate-900 sm:max-w-none sm:text-lg">
                    {pageTitle}
                  </h1>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 sm:flex">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      apiStatus === "connected"
                        ? "bg-emerald-500"
                        : "bg-amber-400"
                    }`}
                  />

                  <span className="text-xs font-medium text-slate-500">
                    {apiStatus === "connected"
                      ? "API connected"
                      : "Demo data"}
                  </span>
                </div>

                <button
                  onClick={() => exportLeads()}
                  className="flex h-10 w-10 touch-manipulation items-center justify-center rounded-xl bg-slate-900 text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-lg active:scale-95 sm:h-auto sm:w-auto sm:gap-2 sm:px-4 sm:py-2.5"
                  aria-label="Export leads"
                  title="Export leads"
                >
                  <Download size={16} />

                  <span className="hidden text-sm font-semibold sm:inline">
                    Export
                  </span>
                </button>
              </div>
            </div>
          </header>

          <div
            key={activePage}
            className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 sm:py-7 lg:px-8"
          >
            <section className="animate-fade-up rounded-3xl bg-slate-900 p-5 text-white shadow-sm transition duration-500 hover:shadow-xl sm:p-8">
              <div className="max-w-3xl">
                <div className="mb-4 inline-flex animate-fade-in items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-slate-200">
                  <Sparkles size={14} />
                  Intelligent deal sourcing
                </div>

                <h2 className="animate-fade-up text-2xl font-bold leading-tight tracking-tight sm:text-4xl">
                  {pageDescription}
                </h2>

                <p className="mt-4 max-w-2xl animate-fade-up text-sm leading-6 text-slate-300 [animation-delay:120ms] sm:text-base">
                  LeadFlow helps acquisition teams discover, evaluate, and
                  prioritize companies using structured lead intelligence.
                </p>
              </div>
            </section>

            {activePage === "dashboard" && (
              <>
                <section className="mt-5 grid gap-4 sm:grid-cols-2 xl:mt-6 xl:grid-cols-4">
                  <StatCard
                    icon={Building2}
                    label="Total Leads"
                    value={leads.length}
                    detail="Companies in your current pipeline"
                    delay={80}
                  />

                  <StatCard
                    icon={Target}
                    label="High-Priority"
                    value={highPriorityLeads.length}
                    detail="Leads scoring 85 or higher"
                    delay={140}
                  />

                  <StatCard
                    icon={TrendingUp}
                    label="Average Score"
                    value={averageScore}
                    detail="Across all discovered companies"
                    delay={200}
                  />

                  <StatCard
                    icon={Bookmark}
                    label="Saved Leads"
                    value={savedLeads.length}
                    detail="Opportunities you've bookmarked"
                    delay={260}
                  />
                </section>

                <section className="mt-5 grid gap-5 xl:mt-6 xl:grid-cols-[minmax(0,1fr)_360px]">
                  <div className="animate-fade-up min-w-0 rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-500 hover:shadow-lg">
                    <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                      <div>
                        <h3 className="font-bold text-slate-900">
                          Priority pipeline
                        </h3>

                        <p className="mt-1 text-xs text-slate-500">
                          Highest scoring opportunities
                        </p>
                      </div>

                      <button
                        onClick={() => goToPage("discover")}
                        className="flex w-fit touch-manipulation items-center gap-1 text-sm font-semibold text-slate-700 transition-all duration-300 hover:translate-x-1 hover:text-slate-950"
                      >
                        View all
                        <ChevronRight size={16} />
                      </button>
                    </div>

                    <div className="divide-y divide-slate-100">
                      {loading ? (
                        <LoadingState text="Loading leads..." />
                      ) : (
                        highPriorityLeads.map((lead, index) => (
                          <div
                            key={lead.id}
                            className="animate-fade-up group flex flex-col gap-4 p-4 transition-all duration-300 hover:bg-slate-50 sm:p-5 md:flex-row md:items-center md:justify-between"
                            style={{ animationDelay: `${index * 70}ms` }}
                          >
                            <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700 transition-all duration-500 group-hover:rotate-3 group-hover:bg-slate-900 group-hover:text-white sm:h-11 sm:w-11">
                                <Building2 size={19} />
                              </div>

                              <div className="min-w-0">
                                <button
                                  onClick={() => setSelectedLead(lead)}
                                  className="max-w-full truncate text-left font-semibold text-slate-900 transition hover:translate-x-0.5 hover:underline"
                                >
                                  {lead.company}
                                </button>

                                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                                  <span>{lead.industry}</span>
                                  <span>•</span>
                                  <span>{lead.location}</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center justify-between gap-4 md:justify-end">
                              <ScoreBadge score={lead.score} />

                              <button
                                onClick={() => toggleSaved(lead.id)}
                                className="touch-manipulation rounded-lg p-2 text-slate-400 transition-all duration-300 hover:scale-110 hover:bg-slate-100 hover:text-slate-900 active:scale-90"
                                aria-label={
                                  savedLeads.includes(lead.id)
                                    ? "Remove saved lead"
                                    : "Save lead"
                                }
                              >
                                {savedLeads.includes(lead.id) ? (
                                  <BookmarkCheck
                                    size={18}
                                    className="text-slate-900"
                                  />
                                ) : (
                                  <Bookmark size={18} />
                                )}
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="animate-fade-up rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-500 hover:-translate-y-1 hover:shadow-lg sm:p-6">
                    <div className="flex items-center gap-3">
                      <div className="rounded-xl bg-slate-100 p-2.5 transition duration-500 hover:rotate-3 hover:scale-105">
                        <Sparkles size={18} />
                      </div>

                      <div>
                        <h3 className="font-bold">Lead intelligence</h3>

                        <p className="text-xs text-slate-500">
                          How LeadFlow prioritizes
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 space-y-4">
                      {[
                        ["01", "Company profile", "Industry and business type"],
                        ["02", "Scale signals", "Revenue and employee count"],
                        ["03", "Fit score", "Combined acquisition signal"],
                      ].map(([number, title, description], index) => (
                        <div
                          key={number}
                          className="animate-fade-up flex gap-3 transition duration-300 hover:translate-x-1"
                          style={{ animationDelay: `${index * 100 + 200}ms` }}
                        >
                          <span className="text-xs font-bold text-slate-400">
                            {number}
                          </span>

                          <div>
                            <p className="text-sm font-semibold">{title}</p>

                            <p className="mt-1 text-xs leading-5 text-slate-500">
                              {description}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => goToPage("insights")}
                      className="mt-6 flex w-full touch-manipulation items-center justify-center gap-2 rounded-xl border border-slate-200 py-3 text-sm font-semibold transition-all duration-300 hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-sm active:scale-[0.98]"
                    >
                      Explore insights
                      <ArrowUpRight size={16} />
                    </button>
                  </div>
                </section>
              </>
            )}

            {activePage === "discover" && (
              <section className="mt-5 animate-fade-up sm:mt-6">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition duration-500 hover:shadow-md sm:p-5">
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_190px_160px_auto]">
                    <div className="relative sm:col-span-2 lg:col-span-1">
                      <Search
                        size={17}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                      />

                      <input
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search company, industry or location..."
                        className="h-11 w-full touch-manipulation rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none transition-all duration-300 focus:border-slate-400 focus:bg-white focus:shadow-md focus:ring-4 focus:ring-slate-100"
                      />
                    </div>

                    <select
                      value={industry}
                      onChange={(event) => setIndustry(event.target.value)}
                      className="h-11 w-full touch-manipulation rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition-all duration-300 focus:border-slate-400 focus:shadow-md focus:ring-4 focus:ring-slate-100"
                    >
                      {industries.map((item) => (
                        <option key={item}>{item}</option>
                      ))}
                    </select>

                    <select
                      value={minimumScore}
                      onChange={(event) =>
                        setMinimumScore(event.target.value)
                      }
                      className="h-11 w-full touch-manipulation rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition-all duration-300 focus:border-slate-400 focus:shadow-md focus:ring-4 focus:ring-slate-100"
                    >
                      <option value="All Scores">All Scores</option>
                      <option value="85">85+ Score</option>
                      <option value="75">75+ Score</option>
                      <option value="60">60+ Score</option>
                    </select>

                    <button
                      onClick={clearFilters}
                      className="flex h-11 touch-manipulation items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-600 transition-all duration-300 hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow-sm active:scale-95 sm:col-span-2 lg:col-span-1"
                    >
                      <Filter size={16} />
                      Clear
                    </button>
                  </div>
                </div>

                <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-500 hover:shadow-lg sm:mt-6">
                  <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                    <div>
                      <h3 className="font-bold text-slate-900">
                        Lead pipeline
                      </h3>

                      <p className="mt-1 text-xs text-slate-500">
                        {filteredLeads.length} matching opportunities
                      </p>
                    </div>

                    <button
                      onClick={() => exportLeads(filteredLeads)}
                      className="flex w-full touch-manipulation items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-lg active:scale-95 sm:w-auto"
                    >
                      <Download size={16} />
                      Export CSV
                    </button>
                  </div>

                  {loading ? (
                    <LoadingState text="Loading leads from API..." />
                  ) : filteredLeads.length === 0 ? (
                    <div className="animate-fade-up p-10 text-center">
                      <Search
                        className="mx-auto animate-soft-pulse text-slate-300"
                        size={28}
                      />

                      <p className="mt-3 font-semibold">No leads found</p>

                      <p className="mt-1 text-sm text-slate-500">
                        Try changing your search or filters.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="border-b border-slate-100 px-4 py-2 text-[11px] font-medium text-slate-400 sm:hidden">
                        Swipe horizontally to view all columns →
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[900px]">
                          <thead className="bg-slate-50">
                            <tr className="border-b border-slate-100 text-left text-xs font-semibold uppercase tracking-wider text-slate-400">
                              <th className="px-5 py-4">Company</th>
                              <th className="px-5 py-4">Industry</th>
                              <th className="px-5 py-4">Location</th>
                              <th className="px-5 py-4">Revenue</th>
                              <th className="px-5 py-4">Score</th>
                              <th className="px-5 py-4">Fit</th>
                              <th className="px-5 py-4"></th>
                            </tr>
                          </thead>

                          <tbody className="divide-y divide-slate-100">
                            {filteredLeads.map((lead, index) => (
                              <tr
                                key={lead.id}
                                className="animate-fade-up transition-all duration-300 hover:bg-slate-50"
                                style={{
                                  animationDelay: `${index * 60}ms`,
                                }}
                              >
                                <td className="px-5 py-4">
                                  <button
                                    onClick={() => setSelectedLead(lead)}
                                    className="group flex items-center gap-3 text-left"
                                  >
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600 transition-all duration-500 group-hover:rotate-3 group-hover:bg-slate-900 group-hover:text-white">
                                      <Building2 size={16} />
                                    </div>

                                    <div>
                                      <p className="font-semibold text-slate-900 transition duration-300 group-hover:translate-x-0.5 group-hover:underline">
                                        {lead.company}
                                      </p>

                                      <p className="mt-0.5 text-xs text-slate-400">
                                        {lead.employees} employees
                                      </p>
                                    </div>
                                  </button>
                                </td>

                                <td className="px-5 py-4 text-sm text-slate-600">
                                  {lead.industry}
                                </td>

                                <td className="px-5 py-4">
                                  <div className="flex items-center gap-1.5 text-sm text-slate-600">
                                    <MapPin size={14} />
                                    {lead.location}
                                  </div>
                                </td>

                                <td className="px-5 py-4 text-sm font-medium text-slate-700">
                                  {lead.revenue}
                                </td>

                                <td className="px-5 py-4">
                                  <ScoreBadge score={lead.score} />
                                </td>

                                <td className="px-5 py-4">
                                  <FitBadge fit={lead.fit} />
                                </td>

                                <td className="px-5 py-4">
                                  <button
                                    onClick={() => toggleSaved(lead.id)}
                                    className="touch-manipulation rounded-lg p-2 text-slate-400 transition-all duration-300 hover:scale-110 hover:bg-slate-100 hover:text-slate-900 active:scale-90"
                                    aria-label={
                                      savedLeads.includes(lead.id)
                                        ? "Remove saved lead"
                                        : "Save lead"
                                    }
                                  >
                                    {savedLeads.includes(lead.id) ? (
                                      <BookmarkCheck
                                        size={18}
                                        className="text-slate-900"
                                      />
                                    ) : (
                                      <Bookmark size={18} />
                                    )}
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </div>
              </section>
            )}

            {activePage === "saved" && (
              <section className="mt-5 animate-fade-up sm:mt-6">
                {savedLeadObjects.length === 0 ? (
                  <EmptyState
                    title="No saved leads yet"
                    description="Go to Discover Leads and bookmark companies that look like strong acquisition opportunities."
                  />
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {savedLeadObjects.map((lead, index) => (
                      <div
                        key={lead.id}
                        className="animate-fade-up rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-500 hover:-translate-y-1.5 hover:shadow-xl"
                        style={{ animationDelay: `${index * 80}ms` }}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700 transition duration-500 hover:rotate-3 hover:scale-105">
                            <Building2 size={19} />
                          </div>

                          <button
                            onClick={() => toggleSaved(lead.id)}
                            className="touch-manipulation rounded-lg p-2 text-slate-700 transition-all duration-300 hover:scale-110 hover:bg-slate-100 active:scale-90"
                            aria-label="Remove saved lead"
                          >
                            <BookmarkCheck size={18} />
                          </button>
                        </div>

                        <button
                          onClick={() => setSelectedLead(lead)}
                          className="mt-5 max-w-full text-left"
                        >
                          <h3 className="break-words font-bold text-slate-900 transition duration-300 hover:translate-x-0.5 hover:underline">
                            {lead.company}
                          </h3>

                          <p className="mt-1 text-sm text-slate-500">
                            {lead.industry}
                          </p>
                        </button>

                        <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                          <div className="min-w-0">
                            <p className="text-xs text-slate-400">Location</p>

                            <p className="mt-1 truncate text-sm font-medium">
                              {lead.location}
                            </p>
                          </div>

                          <div className="shrink-0">
                            <ScoreBadge score={lead.score} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}

            {activePage === "insights" && (
              <section className="mt-5 grid animate-fade-up gap-5 sm:mt-6 xl:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-500 hover:-translate-y-1 hover:shadow-lg sm:p-6">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-slate-100 p-3 transition duration-500 hover:rotate-3 hover:scale-105">
                      <BarChart3 size={19} />
                    </div>

                    <div>
                      <h3 className="font-bold">Score distribution</h3>

                      <p className="text-xs text-slate-500">
                        Current lead quality
                      </p>
                    </div>
                  </div>

                  <div className="mt-7 space-y-5">
                    {[
                      {
                        label: "Excellent Fit",
                        count: leads.filter(
                          (lead) => lead.fit === "Excellent Fit",
                        ).length,
                      },
                      {
                        label: "Strong Fit",
                        count: leads.filter(
                          (lead) => lead.fit === "Strong Fit",
                        ).length,
                      },
                      {
                        label: "Potential Fit",
                        count: leads.filter(
                          (lead) => lead.fit === "Potential Fit",
                        ).length,
                      },
                    ].map((item, index) => {
                      const percentage = leads.length
                        ? Math.round((item.count / leads.length) * 100)
                        : 0;

                      return (
                        <div
                          key={item.label}
                          className="animate-fade-up"
                          style={{ animationDelay: `${index * 100}ms` }}
                        >
                          <div className="flex justify-between gap-3 text-sm">
                            <span className="font-medium">{item.label}</span>

                            <span className="shrink-0 text-slate-500">
                              {item.count} leads
                            </span>
                          </div>

                          <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full bg-slate-900 transition-all duration-1000 ease-out"
                              style={{
                                width: `${percentage}%`,
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-500 hover:-translate-y-1 hover:shadow-lg sm:p-6">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-slate-100 p-3 transition duration-500 hover:rotate-3 hover:scale-105">
                      <Globe2 size={19} />
                    </div>

                    <div>
                      <h3 className="font-bold">Industry intelligence</h3>

                      <p className="text-xs text-slate-500">
                        Where your pipeline is concentrated
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 space-y-3">
                    {industries
                      .filter((item) => item !== "All Industries")
                      .map((item, index) => {
                        const count = leads.filter(
                          (lead) => lead.industry === item,
                        ).length;

                        return (
                          <div
                            key={item}
                            className="animate-fade-up flex items-center justify-between gap-3 rounded-xl bg-slate-50 p-4 transition-all duration-300 hover:translate-x-1 hover:bg-slate-100"
                            style={{ animationDelay: `${index * 70}ms` }}
                          >
                            <div className="flex min-w-0 items-center gap-3">
                              <Building2
                                size={17}
                                className="shrink-0 text-slate-500"
                              />

                              <span className="truncate text-sm font-medium">
                                {item}
                              </span>
                            </div>

                            <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 shadow-sm transition duration-300 hover:scale-105">
                              {count}
                            </span>
                          </div>
                        );
                      })}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-500 hover:shadow-lg xl:col-span-2 sm:p-6">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-slate-100 p-3 transition duration-500 hover:rotate-3 hover:scale-105">
                      <Sparkles size={19} />
                    </div>

                    <div>
                      <h3 className="font-bold">Highest conviction leads</h3>

                      <p className="text-xs text-slate-500">
                        Opportunities that deserve attention first
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 md:grid-cols-3">
                    {highPriorityLeads.map((lead, index) => (
                      <button
                        key={lead.id}
                        onClick={() => setSelectedLead(lead)}
                        className="animate-fade-up touch-manipulation rounded-xl border border-slate-200 p-4 text-left transition-all duration-500 hover:-translate-y-1 hover:border-slate-400 hover:shadow-md"
                        style={{ animationDelay: `${index * 80}ms` }}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="break-words font-semibold text-slate-900">
                              {lead.company}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              {lead.industry}
                            </p>
                          </div>

                          <div className="shrink-0">
                            <ScoreBadge score={lead.score} />
                          </div>
                        </div>

                        <p className="mt-4 text-xs leading-5 text-slate-500">
                          {lead.reason}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              </section>
            )}

            <footer className="mt-8 flex flex-col gap-3 border-t border-slate-200 py-6 text-xs text-slate-400 sm:flex-row sm:items-center sm:justify-between">
              <span>LeadFlow · Acquisition intelligence platform</span>

              <span className="flex items-center gap-2">
                <CheckCircle2 size={14} />
                Built for focused deal sourcing
              </span>
            </footer>
          </div>
        </main>

        {selectedLead && (
          <div
            className="fixed inset-0 z-[60] flex animate-fade-in items-center justify-center bg-slate-950/50 p-2 backdrop-blur-sm sm:p-4"
            onClick={() => setSelectedLead(null)}
          >
            <div
              className="animate-scale-in max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl sm:rounded-3xl"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-4 sm:p-6">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white transition duration-500 hover:rotate-3">
                    <Building2 size={19} />
                  </div>

                  <div className="min-w-0">
                    <h2 className="break-words font-bold text-slate-900">
                      {selectedLead.company}
                    </h2>

                    <p className="mt-0.5 text-xs text-slate-500">
                      {selectedLead.industry}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedLead(null)}
                  className="shrink-0 touch-manipulation rounded-xl p-2 text-slate-400 transition-all duration-300 hover:rotate-90 hover:bg-slate-100 hover:text-slate-700"
                  aria-label="Close details"
                >
                  <X size={19} />
                </button>
              </div>

              <div className="p-4 sm:p-6">
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="animate-fade-up rounded-2xl bg-slate-50 p-4 transition duration-300 hover:-translate-y-1">
                    <p className="text-xs text-slate-400">Lead score</p>

                    <div className="mt-2">
                      <ScoreBadge
                        score={scoreDetails?.score ?? selectedLead.score}
                      />
                    </div>
                  </div>

                  <div
                    className="animate-fade-up rounded-2xl bg-slate-50 p-4 transition duration-300 hover:-translate-y-1"
                    style={{ animationDelay: "70ms" }}
                  >
                    <p className="text-xs text-slate-400">Revenue</p>

                    <p className="mt-2 font-semibold">
                      {selectedLead.revenue}
                    </p>
                  </div>

                  <div
                    className="animate-fade-up rounded-2xl bg-slate-50 p-4 transition duration-300 hover:-translate-y-1"
                    style={{ animationDelay: "140ms" }}
                  >
                    <p className="text-xs text-slate-400">Employees</p>

                    <p className="mt-2 font-semibold">
                      {selectedLead.employees}
                    </p>
                  </div>
                </div>

                <div className="mt-6 animate-fade-up">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Smart score breakdown
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        Transparent acquisition scoring
                      </p>
                    </div>

                    <Sparkles
                      size={17}
                      className="animate-soft-pulse text-slate-400"
                    />
                  </div>

                  {scoreLoading ? (
                    <div className="mt-3 rounded-2xl border border-slate-100 bg-slate-50 p-5">
                      <LoadingState text="Calculating lead score..." />
                    </div>
                  ) : scoreDetails ? (
                    <div className="mt-3 grid gap-3 sm:grid-cols-3">
                      {[
                        {
                          label: "Revenue",
                          value: scoreDetails.breakdown.revenue,
                          max: 35,
                        },
                        {
                          label: "Team Size",
                          value: scoreDetails.breakdown.employees,
                          max: 30,
                        },
                        {
                          label: "Industry",
                          value: scoreDetails.breakdown.industry,
                          max: 35,
                        },
                      ].map((item, index) => (
                        <div
                          key={item.label}
                          className="animate-fade-up rounded-2xl border border-slate-100 bg-slate-50 p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-sm"
                          style={{ animationDelay: `${index * 100}ms` }}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-medium text-slate-500">
                              {item.label}
                            </p>

                            <span className="text-sm font-bold text-slate-900">
                              {item.value}/{item.max}
                            </span>
                          </div>

                          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
                            <div
                              className="h-full rounded-full bg-slate-900 transition-all duration-1000 ease-out"
                              style={{
                                width: `${(item.value / item.max) * 100}%`,
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-500">
                      Score details are currently unavailable.
                    </div>
                  )}
                </div>

                <div className="mt-6 animate-fade-up">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Company intelligence
                  </p>

                  <div className="mt-3 space-y-3">
                    <div className="flex flex-col gap-2 rounded-xl border border-slate-100 p-4 transition duration-300 hover:translate-x-1 hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between">
                      <span className="flex items-center gap-2 text-sm text-slate-500">
                        <MapPin size={16} />
                        Location
                      </span>

                      <span className="break-words text-sm font-semibold sm:text-right">
                        {selectedLead.location}
                      </span>
                    </div>

                    <div className="flex flex-col gap-2 rounded-xl border border-slate-100 p-4 transition duration-300 hover:translate-x-1 hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between">
                      <span className="flex items-center gap-2 text-sm text-slate-500">
                        <Building2 size={16} />
                        Industry
                      </span>

                      <span className="break-words text-sm font-semibold sm:text-right">
                        {selectedLead.industry}
                      </span>
                    </div>

                    <div className="flex flex-col gap-2 rounded-xl border border-slate-100 p-4 transition duration-300 hover:translate-x-1 hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between">
                      <span className="flex items-center gap-2 text-sm text-slate-500">
                        <TrendingUp size={16} />
                        Acquisition fit
                      </span>

                      <span>
                        <FitBadge
                          fit={scoreDetails?.fit ?? selectedLead.fit}
                        />
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 animate-fade-up rounded-2xl bg-slate-900 p-5 text-white transition duration-500 hover:shadow-xl">
                  <div className="flex items-center gap-2">
                    <Sparkles size={17} />

                    <p className="text-sm font-semibold">Why this lead?</p>
                  </div>

                  <p className="mt-3 text-sm leading-6 text-slate-300">
                    {selectedLead.reason}
                  </p>
                </div>

                <div className="mt-6 flex animate-fade-up flex-col gap-3 sm:flex-row">
                  <button
                    onClick={() => toggleSaved(selectedLead.id)}
                    className="flex flex-1 touch-manipulation items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-lg active:scale-[0.98]"
                  >
                    {savedLeads.includes(selectedLead.id) ? (
                      <>
                        <BookmarkCheck size={17} />
                        Saved
                      </>
                    ) : (
                      <>
                        <Bookmark size={17} />
                        Save Lead
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => setSelectedLead(null)}
                    className="flex-1 touch-manipulation rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition-all duration-300 hover:-translate-y-0.5 hover:bg-slate-50 active:scale-[0.98]"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}