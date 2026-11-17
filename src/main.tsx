import InfrastructureTracking from "./InfrastructureTracking";
import { hydrateWorkspace } from "./hydrateWorkspace";
import EngagementManagement from "./EngagementManagement";
import { useOperationalRevision } from "./engagementStore";
import "@fontsource-variable/dm-sans";
import "@fontsource-variable/manrope";
import React, {
  useCallback,
  useMemo,
  useRef,
  useState,
  useEffect,
} from "react";
import { createRoot } from "react-dom/client";
import {
  Activity,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  ChevronRight,
  CircleHelp,
  Download,
  Home,
  Layers,
  LayoutDashboard,
  MapPinned,
  Search,
  SlidersHorizontal,
  Users,
  Wrench,
  X,
  Check,
  Clock3,
  AlertCircle,
  Info,
  Menu,
} from "lucide-react";
import DataExplorer from "./DataExplorer";
import {
  summarize,
  weeklyActivity,
  relatedLinks,
  downloadRecords,
} from "./analytics";
import { records } from "./data";
import MapView from "./MapView";
import {
  categories,
  colors,
  filterRecords,
  formatDate,
  isOutstanding,
  isOverdue,
  type Category,
  type RecordItem,
} from "./data";
import "./style.css";
hydrateWorkspace();
const icons = [Home, Users, Wrench, CalendarDays];
function App() {
  const revision = useOperationalRevision();
  const backdropPointer = useRef(false);
  const [primary, setPrimary] = useState(
    location.hash.startsWith("#infrastructure")
      ? "infrastructure"
      : location.hash.startsWith("#engagements")
        ? "engagements"
        : location.hash.startsWith("#explorer")
          ? "explorer"
          : "overview",
  );
  useEffect(() => {
    const handler = () =>
      setPrimary(
        location.hash.startsWith("#infrastructure")
          ? "infrastructure"
          : location.hash.startsWith("#engagements")
            ? "engagements"
            : location.hash.startsWith("#explorer")
              ? "explorer"
              : "overview",
      );
    window.addEventListener("hashchange", handler);
    return () => window.removeEventListener("hashchange", handler);
  }, []);

  const [sector, setSector] = useState("All areas"),
    [days, setDays] = useState(30),
    [query, setQuery] = useState(""),
    [active, setActive] = useState<Category[]>([...categories]),
    [selection, setSelection] = useState<RecordItem | null>(null),
    [tab, setTab] = useState<"attention" | "all">("attention"),
    [help, setHelp] = useState(false),
    [nav, setNav] = useState(false),
    [exported, setExported] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null),
    helpDialog = useRef<HTMLDialogElement>(null);
  const items = useMemo(
    () => filterRecords({ sector, days, query, categories: active }),
    [sector, days, query, active, revision],
  );
  const choose = useCallback((r: RecordItem) => {
    setSelection(r);
  }, []);
  useEffect(() => {
    if (selection) dialog.current?.showModal();
  }, [selection]);
  useEffect(() => {
    if (help) helpDialog.current?.showModal();
  }, [help]);
  const outstanding = items.filter(isOutstanding),
    urgent = outstanding.filter((r) => r.priority === "Urgent"),
    overdue = outstanding.filter(isOverdue);
  const listed =
    tab === "attention"
      ? [...outstanding].sort(
          (a, b) =>
            Number(b.priority === "Urgent") - Number(a.priority === "Urgent") ||
            a.due.localeCompare(b.due),
        )
      : items;
  const reset = () => {
    setSector("All areas");
    setDays(30);
    setQuery("");
    setActive([...categories]);
  };
  const toggle = (c: Category) =>
    setActive((a) => (a.includes(c) ? a.filter((x) => x !== c) : [...a, c]));
  function exportCSV() {
    const cells = (s: unknown) => `"${String(s).replaceAll('"', '""')}"`;
    const csv = [
      ["Synthetic demonstration data — snapshot 16 Nov 2026"],
      [
        "ID",
        "Category",
        "Title",
        "Area",
        "Date",
        "Status",
        "Priority",
        "Units",
      ],
      ...items.map((r) => [
        r.id,
        r.category,
        r.title,
        r.sector,
        r.date,
        r.status,
        r.priority,
        r.units,
      ]),
    ]
      .map((r) => r.map(cells).join(","))
      .join("\r\n");
    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "fengshan-demo-2026-11-16.csv";
    a.click();
    URL.revokeObjectURL(url);
    setExported(true);
    setTimeout(() => setExported(false), 3000);
  }
  const weekly = weeklyActivity(items);
  return (
    <>
      <a className="skip" href="#main">
        Skip to dashboard
      </a>
      <aside className={`sidebar ${nav ? "open" : ""}`}>
        <a className="brand" href="#main">
          <span className="brand-mark">
            <MapPinned size={24} />
          </span>
          <span>
            FENGSHAN<small>COMMUNITY INTELLIGENCE</small>
          </span>
        </a>
        <div className="workspace-label">WORKSPACE</div>
        <nav aria-label="Main navigation">
          <a
            className={primary === "overview" ? "nav-active" : ""}
            href="#main"
            onClick={() => setNav(false)}
          >
            <LayoutDashboard size={19} />
            Overview
            {primary === "overview" && <span className="nav-dot" />}
          </a>
          <a
            className={primary === "explorer" ? "nav-active" : ""}
            href="#explorer"
            onClick={() => setNav(false)}
          >
            <Layers size={19} />
            Data Explorer
          </a>
          <a
            className={primary === "engagements" ? "nav-active" : ""}
            href="#engagements"
            onClick={() => setNav(false)}
          >
            <CalendarDays size={19} />
            Engagement Management
          </a>
          <a
            className={primary === "infrastructure" ? "nav-active" : ""}
            href="#infrastructure"
            onClick={() => setNav(false)}
          >
            <Wrench size={19} />
            Infrastructure Tracking
          </a>
          <a href="#operations" onClick={() => setNav(false)}>
            <MapPinned size={19} />
            Operations map
          </a>
          <a
            href="#attention"
            onClick={() => {
              setTab("attention");
              setNav(false);
            }}
          >
            <AlertCircle size={19} />
            Needs attention
            <span className="nav-count">{outstanding.length}</span>
          </a>
          <a href="#insights" onClick={() => setNav(false)}>
            <Activity size={19} />
            Activity & insights
          </a>
        </nav>
        <div className="sidebar-context">
          <span className="context-icon">
            <Layers size={19} />
          </span>
          <strong>
            A connected view
            <br />
            of your community.
          </strong>
          <p>
            From neighbourhood activity to the matters that need a closer look.
          </p>
          <span className="context-line" />
        </div>
        <div className="sidebar-bottom">
          <button onClick={() => setHelp(true)}>
            <CircleHelp size={18} />
            About this demonstration
            <ChevronRight size={15} />
          </button>
          <div className="workspace-footer">
            <span className="avatar">FS</span>
            <div>
              Fengshan workspace<small>Public demonstration</small>
            </div>
          </div>
        </div>
      </aside>
      <div className="app-shell">
        <header className="topbar">
          <button
            className="mobile-menu icon-button"
            aria-label="Toggle navigation"
            aria-expanded={nav}
            onClick={() => setNav(!nav)}
          >
            <Menu />
          </button>
          <div className="breadcrumb">
            Workspace <ChevronRight size={14} />
            <strong>
              {primary === "infrastructure"
                ? "Infrastructure Tracking"
                : primary === "engagements"
                  ? "Engagement Management"
                  : primary === "explorer"
                    ? "Data Explorer"
                    : "Overview"}
            </strong>
          </div>
          <div className="topbar-right">
            <span className="demo-pill">
              <span /> DEMO ENVIRONMENT
            </span>
            <span className="top-divider" />
            <span className="avatar light">FS</span>
          </div>
        </header>
        <main id="main">
          {primary === "infrastructure" ? (
            <InfrastructureTracking />
          ) : primary === "engagements" ? (
            <EngagementManagement />
          ) : primary === "explorer" ? (
            <DataExplorer
              filters={{ sector, days, query, categories: active }}
              onSelect={choose}
              onChange={(change) => {
                if (change.sector !== undefined) setSector(change.sector);
                if (change.days !== undefined) setDays(change.days);
                if (change.query !== undefined) setQuery(change.query);
                if (change.categories !== undefined)
                  setActive(change.categories);
              }}
            />
          ) : (
            <>
              <div className="page-heading">
                <div>
                  <div className="eyebrow">THE NEIGHBOURHOOD, IN FOCUS</div>
                  <h1>
                    Community overview<span>.</span>
                  </h1>
                  <p>
                    Your connected view of activity, progress and priorities in
                    Fengshan.
                  </p>
                </div>
                <button className="button export" onClick={exportCSV}>
                  <Download size={16} />
                  {exported ? "Exported" : "Export snapshot"}
                </button>
              </div>
              <div className="demo-notice">
                <Info size={15} />
                <span>
                  <strong>Demonstration only.</strong> All operational records
                  are synthetic. This public site has no authentication.
                </span>
                <button onClick={() => setHelp(true)}>
                  About the data <ArrowUpRight size={13} />
                </button>
              </div>
              <section className="filterbar" aria-label="Dashboard filters">
                <div className="filter-left">
                  <SlidersHorizontal size={17} />
                  <label>
                    <span className="sr-only">Geographical area</span>
                    <select
                      value={sector}
                      onChange={(e) => setSector(e.target.value)}
                    >
                      <option>All areas</option>
                      <option value="North">North · demo sector</option>
                      <option value="Central">Central · demo sector</option>
                      <option value="South">South · demo sector</option>
                    </select>
                  </label>
                  <span className="filter-divider" />
                  <CalendarDays size={16} />
                  <label>
                    <span className="sr-only">Reporting period</span>
                    <select
                      value={days}
                      onChange={(e) => setDays(Number(e.target.value))}
                    >
                      <option value={0}>All dates (including scheduled)</option>
                      <option value={30}>Last 30 days</option>
                      <option value={7}>Last 7 days</option>
                    </select>
                  </label>
                </div>
                <span className="snapshot">
                  Snapshot: 16 Nov 2026 <span>· SGT</span>
                </span>
              </section>
              <section className="stats" aria-label="Operational summary">
                {categories.map((c, i) => {
                  const group = items.filter((r) => r.category === c),
                    Icon = icons[i];
                  const number =
                    i === 0 ? summarize(group).householdContacts : group.length;
                  return (
                    <button
                      key={c}
                      className={`stat-card ${active.length === 1 && active[0] === c ? "stat-selected" : ""}`}
                      onClick={() =>
                        setActive(
                          active.length === 1 && active[0] === c
                            ? [...categories]
                            : [c],
                        )
                      }
                      aria-label={`Filter ${c}`}
                      aria-pressed={active.length === 1 && active[0] === c}
                    >
                      <div className="stat-top">
                        <span>{c}</span>
                        <span className={`stat-icon tone-${i}`}>
                          <Icon size={18} />
                        </span>
                      </div>
                      <div className="stat-value">
                        {number}
                        <span>
                          {i === 0
                            ? "households contacted"
                            : i === 1
                              ? "cases recorded"
                              : i === 2
                                ? "matters recorded"
                                : "activities held"}
                        </span>
                      </div>
                      <div className="stat-bottom">
                        <span className={i === 2 ? "amber" : "green"}>
                          {i === 0 ? (
                            <ArrowUpRight size={14} />
                          ) : (
                            <Check size={14} />
                          )}{" "}
                          {i === 0
                            ? `${group.filter((r) => r.status === "Completed").length} rounds completed`
                            : i === 3
                              ? `${group.reduce((s, r) => s + r.units, 0)} participants`
                              : `${group.filter((r) => r.status === "Completed").length} completed`}
                        </span>
                        <span>
                          {i === 0
                            ? `${group.length} rounds`
                            : `${group.filter(isOutstanding).length} outstanding`}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </section>
              <div className="primary-grid">
                <section className="panel map-panel" id="operations">
                  <div className="panel-heading">
                    <div>
                      <h2>Neighbourhood pulse</h2>
                      <p>Explore activity across Fengshan</p>
                    </div>
                    <span className="subtle-badge">{items.length} records</span>
                  </div>
                  <div className="map-toolbar">
                    <div className="layer-buttons" aria-label="Map layers">
                      {categories.map((c, i) => (
                        <button
                          key={c}
                          aria-pressed={active.includes(c)}
                          onClick={() => toggle(c)}
                          className={active.includes(c) ? "layer-active" : ""}
                        >
                          <span style={{ background: colors[c] }} />
                          {
                            [
                              "Visits",
                              "Cases",
                              "Infrastructure",
                              "Engagements",
                            ][i]
                          }
                        </button>
                      ))}
                    </div>
                    <label className="map-search">
                      <Search size={15} />
                      <input
                        aria-label="Search operational records"
                        placeholder="Search location or activity"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                      />
                      {query && (
                        <button
                          aria-label="Clear search"
                          onClick={() => setQuery("")}
                        >
                          <X size={14} />
                        </button>
                      )}
                    </label>
                  </div>
                  <MapView
                    items={items}
                    selected={selection?.id ?? null}
                    onSelect={choose}
                  />
                  <div className="map-footer">
                    <span>
                      <span className="legend-urgent" /> Urgent matter{" "}
                      <span className="footer-separator">|</span> Select a
                      marker to explore
                    </span>
                    <button onClick={reset}>Reset filters</button>
                  </div>
                </section>
                <section className="panel attention-panel" id="attention">
                  <div className="panel-heading">
                    <div>
                      <div className="section-kicker">PRIORITY WATCH</div>
                      <h2>
                        Needs attention{" "}
                        <span className="count-badge">
                          {outstanding.length}
                        </span>
                      </h2>
                    </div>
                    <span className="attention-icon">
                      <AlertCircle size={20} />
                    </span>
                  </div>
                  <div className="attention-summary">
                    <span>
                      <b>{urgent.length}</b> urgent
                    </span>
                    <span>
                      <b>{overdue.length}</b> overdue
                    </span>
                    <small>As of 16 Nov</small>
                  </div>
                  <div
                    className="tabs"
                    role="group"
                    aria-label="Operational record views"
                  >
                    <button
                      aria-pressed={tab === "attention"}
                      onClick={() => setTab("attention")}
                    >
                      Outstanding <span>{outstanding.length}</span>
                    </button>
                    <button
                      aria-pressed={tab === "all"}
                      onClick={() => setTab("all")}
                    >
                      All records <span>{items.length}</span>
                    </button>
                  </div>
                  <div
                    className="record-list"
                    role="region"
                    aria-label={
                      tab === "attention"
                        ? "Outstanding records"
                        : "All records"
                    }
                  >
                    {listed.length ? (
                      listed.map((r) => (
                        <button
                          className="record"
                          key={r.id}
                          onClick={() => choose(r)}
                        >
                          <div className="record-meta">
                            <span style={{ color: colors[r.category] }}>
                              {r.category}
                            </span>
                            <span
                              className={
                                r.priority === "Urgent"
                                  ? "urgent-badge"
                                  : "status-badge"
                              }
                            >
                              {r.priority === "Urgent" ? "Urgent" : r.status}
                            </span>
                          </div>
                          <strong>{r.title}</strong>
                          <span className="record-location">{r.location}</span>
                          <div className="record-bottom">
                            <span className={isOverdue(r) ? "overdue" : ""}>
                              <Clock3 size={12} />
                              {isOverdue(r)
                                ? "Overdue · "
                                : r.status === "Completed"
                                  ? "Completed · "
                                  : "Due · "}
                              {formatDate(r.due)}
                            </span>
                            <ArrowRight size={15} />
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="empty">
                        <Check size={24} />
                        <strong>
                          {items.length
                            ? "All caught up"
                            : "No matching records"}
                        </strong>
                        <p>
                          {items.length
                            ? "No outstanding matters in this selection."
                            : "Try another area, layer or search term."}
                        </p>
                        <button onClick={reset}>Reset filters</button>
                      </div>
                    )}
                  </div>
                  <div className="attention-footer">
                    <span className="pulse" /> Linked to your map filters
                  </div>
                </section>
              </div>
              <section className="lower-grid" id="insights">
                <div className="panel activity-panel">
                  <div className="panel-heading">
                    <div>
                      <h2>Activity over time</h2>
                      <p>Snapshot weeks · 19 Oct–15 Nov 2026</p>
                    </div>
                    <span className="subtle-badge">{items.length} total</span>
                  </div>
                  <div
                    className="chart"
                    role="img"
                    aria-label={`Weekly record counts: ${weekly.map((w) => `${w.label}: ${w.values.reduce((a, b) => a + b, 0)}`).join("; ")}`}
                  >
                    <div className="chart-axis">
                      <span>10</span>
                      <span>5</span>
                      <span>0</span>
                    </div>
                    <div className="chart-plot">
                      {weekly.map((w) => (
                        <div className="chart-column" key={w.label}>
                          <div className="stack">
                            {w.values.map(
                              (v, i) =>
                                v > 0 && (
                                  <div
                                    key={i}
                                    style={{
                                      height: `${v * 10}%`,
                                      background: colors[categories[i]],
                                    }}
                                    title={`${categories[i]}: ${v}`}
                                  />
                                ),
                            )}
                          </div>
                          <span>{w.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="chart-legend">
                    {categories.map((c) => (
                      <span key={c}>
                        <i style={{ background: colors[c] }} />
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="panel insight-panel">
                  <div className="panel-heading">
                    <div>
                      <div className="section-kicker">FROM THE DATA</div>
                      <h2>A closer look</h2>
                    </div>
                    <Activity size={21} />
                  </div>
                  <div className="insight-main">
                    <span className="insight-symbol">
                      <ArrowDownRight size={24} />
                    </span>
                    <div>
                      <h3>
                        {overdue.length
                          ? `${overdue.length} follow-ups need a closer look`
                          : "No overdue follow-ups in view"}
                      </h3>
                      <p>
                        {overdue.length
                          ? "The selected records include outstanding matters past their due date. Review ownership and agree the next action."
                          : "Every selected outstanding matter is within its demonstration due date."}
                      </p>
                      <button
                        onClick={() => {
                          setTab("attention");
                          document
                            .getElementById("attention")
                            ?.scrollIntoView({ behavior: "smooth" });
                        }}
                      >
                        Review outstanding matters <ArrowRight size={15} />
                      </button>
                    </div>
                  </div>
                  <div className="completion">
                    <div>
                      <span>Operations completed</span>
                      <strong>
                        {items.length
                          ? Math.round(
                              (summarize(items).completed / items.length) * 100,
                            )
                          : 0}
                        %
                      </strong>
                    </div>
                    <progress
                      value={summarize(items).completed}
                      max={items.length || 1}
                    />
                    <small>
                      {summarize(items).completed} of {items.length} records in
                      the current selection
                    </small>
                  </div>
                </div>
              </section>
              <footer className="page-footer">
                <span>
                  <strong>FENGSHAN</strong> Community intelligence
                </span>
                <span>
                  Synthetic data · Illustrative sectors · Snapshot 16 Nov 2026
                </span>
              </footer>
            </>
          )}
        </main>
      </div>
      <dialog
        aria-label="Operational record details"
        ref={dialog}
        onClose={() => setSelection(null)}
        onPointerDown={(e) => {
          backdropPointer.current = e.target === e.currentTarget;
        }}
        onClick={(e) => {
          if (backdropPointer.current && e.target === e.currentTarget)
            dialog.current?.close();
          backdropPointer.current = false;
        }}
      >
        {selection && (
          <>
            <div className="dialog-heading">
              <span className="eyebrow">{selection.id} · SYNTHETIC RECORD</span>
              <button
                className="icon-button"
                aria-label="Close record details"
                onClick={() => dialog.current?.close()}
              >
                <X />
              </button>
            </div>
            <span
              className="detail-category"
              style={{ color: colors[selection.category] }}
            >
              {selection.category}
            </span>
            <h2>{selection.title}</h2>
            <p className="detail-location">
              <MapPinned size={16} />
              {selection.location}
            </p>
            <dl>
              <div>
                <dt>Status</dt>
                <dd>{selection.status}</dd>
              </div>
              <div>
                <dt>Priority</dt>
                <dd>{selection.priority}</dd>
              </div>
              <div>
                <dt>Recorded</dt>
                <dd>{formatDate(selection.date)} 2026</dd>
              </div>
              <div>
                <dt>Due / completion date</dt>
                <dd>
                  {formatDate(selection.due)} 2026
                  {isOverdue(selection) ? " · Overdue" : ""}
                </dd>
              </div>
              <div>
                <dt>Responsible team</dt>
                <dd>{selection.owner}</dd>
              </div>
              {["House visits", "Engagements"].includes(selection.category) && (
                <div>
                  <dt>
                    {selection.category === "House visits"
                      ? "Households contacted"
                      : "Participants"}
                  </dt>
                  <dd>{selection.units}</dd>
                </div>
              )}
            </dl>
            <h3>Connected records</h3>
            <p>
              Full collection context, including records outside current
              filters.
            </p>
            {relatedLinks(selection.id).map((link) => {
              const other = records.find(
                (r) =>
                  r.id ===
                  (link.fromId === selection.id ? link.toId : link.fromId),
              )!;
              return (
                <button
                  className="related-record"
                  key={link.id}
                  onClick={() => choose(other)}
                >
                  <span>
                    {link.fromId === selection.id
                      ? "Led to"
                      : "Originated from"}{" "}
                    · {link.kind}
                  </span>
                  <strong>
                    {other.id} · {other.title}
                  </strong>
                  <ArrowRight size={15} />
                </button>
              );
            })}
            {!relatedLinks(selection.id).length && (
              <p>No explicit operational links recorded.</p>
            )}
            <h3>Operational note</h3>
            <p>{selection.detail}</p>
            <div className="detail-disclaimer">
              <Info size={16} />
              Illustrative location and fictional activity. No personal records.
            </div>
          </>
        )}
      </dialog>
      <dialog
        aria-label="About this demonstration"
        ref={helpDialog}
        onClose={() => setHelp(false)}
      >
        <div className="dialog-heading">
          <span className="eyebrow">ABOUT THIS DEMONSTRATION</span>
          <button
            className="icon-button"
            aria-label="Close about dialog"
            onClick={() => helpDialog.current?.close()}
          >
            <X />
          </button>
        </div>
        <h2>A community view, built for clarity.</h2>
        <p>
          This homepage demonstrates how branch personnel could explore
          community operations. It is publicly accessible and contains only
          fictional records.
        </p>
        <h3>Reading the dashboard</h3>
        <p>
          Area, period, search and layer filters apply to every summary, map
          marker, record list and chart. Select a summary card to isolate a
          category. Select a marker or list item for details.
        </p>
        <p>
          The fixed snapshot is 16 November 2026, Singapore time. “Last 7 days”
          includes 10–16 November. Due dates before the snapshot are overdue
          unless completed. House visits count households contacted; other cards
          count records. Weekly bars count records, not people.
        </p>
        <h3>Geography and privacy</h3>
        <p>
          North, Central and South are illustrative demo sectors, not official
          administrative boundaries. Locations are approximate. Street tiles are
          provided by OpenStreetMap; loading them sends your IP address and
          requested map tiles to that provider.
        </p>
        <p>
          No authentication, personal data, live operational feeds or resident
          portal is included.
        </p>
      </dialog>
    </>
  );
}
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
