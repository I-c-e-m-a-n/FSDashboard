import ConsolidatedReporting from "./ConsolidatedReporting";
import { people } from "./personnelStore";
import { organisations } from "./referenceData";
import { reportingDate, reportingLabel } from "./reporting";
import { useOperationalRevision } from "./engagementStore";
import { useMemo, useState, useEffect } from "react";
import {
  ArrowDown,
  ArrowUp,
  ArrowRight,
  ArrowUpRight,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  Database,
  Download,
  FileText,
  GitBranch,
  Info,
  Layers,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import {
  categories,
  colors,
  filterRecords,
  formatDate,
  isOverdue,
  locations,
  records,
  sectors,
  teams,
  type Filters,
  type RecordItem,
} from "./data";
import {
  connectedLinks,
  downloadRecords,
  relatedLinks,
  summarize,
  weeklyActivity,
} from "./analytics";
import "./explorer.css";
type View = "records" | "connections" | "model" | "reports";
type Sort = "date" | "title" | "due";
export default function DataExplorer({
  filters,
  onChange,
  onSelect,
}: {
  filters: Filters;
  onChange: (change: Partial<Filters>) => void;
  onSelect: (record: RecordItem) => void;
}) {
  const revision = useOperationalRevision();
  const [view, setView] = useState<View>(
      location.hash.includes("/reports") ? "reports" : "records",
    ),
    [status, setStatus] = useState("All statuses"),
    [teamId, setTeamId] = useState(""),
    [priority, setPriority] = useState("All priorities"),
    [sort, setSort] = useState<Sort>("date"),
    [ascending, setAscending] = useState(false),
    [page, setPage] = useState(1),
    [exported, setExported] = useState(false);
  useEffect(() => {
    const handle = () => {
      if (location.hash.includes("/reports")) setView("reports");
      else if (location.hash === "#explorer")
        setView((v) => (v === "reports" ? "records" : v));
    };
    window.addEventListener("hashchange", handle);
    return () => window.removeEventListener("hashchange", handle);
  }, []);
  const scoped = useMemo(
    () => filterRecords(filters),
    [filters.sector, filters.days, filters.query, filters.categories, revision],
  );
  const items = useMemo(
    () =>
      scoped
        .filter(
          (r) =>
            (status === "All statuses" ||
              (status === "Overdue" ? isOverdue(r) : r.status === status)) &&
            (!teamId || r.teamId === teamId) &&
            (priority === "All priorities" || r.priority === priority),
        )
        .sort(
          (a, b) =>
            (a[sort].localeCompare(b[sort]) || a.id.localeCompare(b.id)) *
            (ascending ? 1 : -1),
        ),
    [scoped, status, priority, sort, ascending, teamId],
  );
  const stats = summarize(items),
    connections = connectedLinks(items),
    weeks = weeklyActivity(items),
    maxWeek = Math.max(
      1,
      ...weeks.map((w) => w.values.reduce((a, b) => a + b, 0)),
    );
  const pages = Math.max(1, Math.ceil(items.length / 8)),
    currentPage = Math.min(page, pages),
    visible = items.slice((currentPage - 1) * 8, currentPage * 8);
  const facetBase = filterRecords({
    ...filters,
    categories: [...categories],
  }).filter(
    (r) =>
      (status === "All statuses" ||
        (status === "Overdue" ? isOverdue(r) : r.status === status)) &&
      (!teamId || r.teamId === teamId) &&
      (priority === "All priorities" || r.priority === priority),
  );
  function change(update: Partial<Filters>) {
    onChange(update);
    setPage(1);
  }
  function reset() {
    change({
      sector: "All areas",
      days: 30,
      query: "",
      categories: [...categories],
    });
    setTeamId("");
    setStatus("All statuses");
    setPriority("All priorities");
  }
  function order(field: Sort) {
    setAscending(sort === field ? !ascending : field === "title");
    setSort(field);
    setPage(1);
  }
  function exportData() {
    downloadRecords(items, `fengshan-explorer-${reportingDate}.csv`);
    setExported(true);
    setTimeout(() => setExported(false), 3000);
  }
  const selectedOne =
    filters.categories.length === 1 ? filters.categories[0] : null;
  if (view === "reports")
    return (
      <ConsolidatedReporting
        initialArea={filters.sector}
        initialDays={filters.days}
        onSelect={onSelect}
        onBack={() => {
          setView("records");
          location.hash = "explorer";
        }}
      />
    );
  return (
    <div className="explorer">
      <div className="page-heading">
        <div>
          <div className="eyebrow">THE RECORDS BEHIND THE PICTURE</div>
          <h1>
            Data explorer<span>.</span>
          </h1>
          <p>
            Follow the activity. Understand the connections. Find the detail.
          </p>
        </div>
        <button
          className="button export"
          onClick={exportData}
          disabled={!items.length}
        >
          <Download size={16} />
          {exported ? "Exported" : `Export ${items.length} records`}
        </button>
      </div>
      <div className="explorer-context">
        <span>
          <span className="pulse" /> SYNTHETIC DATA COLLECTION
        </span>
        <span>
          Snapshot · {reportingLabel} <span className="context-sgt">SGT</span>
        </span>
      </div>
      <div
        className="dataset-selector"
        role="group"
        aria-label="Select dataset"
      >
        <button
          aria-pressed={filters.categories.length === 4}
          onClick={() => change({ categories: [...categories] })}
        >
          <Database size={18} />
          <span>
            All datasets<strong>{facetBase.length}</strong>
          </span>
        </button>
        {categories.map((c, i) => (
          <button
            key={c}
            aria-pressed={selectedOne === c}
            onClick={() => change({ categories: [c] })}
          >
            <span className="dataset-number" style={{ color: colors[c] }}>
              0{i + 1}
            </span>
            <span>
              {c}
              <strong>
                {facetBase.filter((r) => r.category === c).length}
              </strong>
            </span>
          </button>
        ))}
      </div>
      <section className="explorer-filters" aria-label="Explorer filters">
        <label className="explorer-search">
          <Search size={17} />
          <input
            aria-label="Search explorer records"
            placeholder="Search records, locations or reference IDs…"
            value={filters.query}
            onChange={(e) => change({ query: e.target.value })}
          />
          {filters.query && (
            <button
              aria-label="Clear explorer search"
              onClick={() => change({ query: "" })}
            >
              <X size={15} />
            </button>
          )}
        </label>
        <div className="explorer-filter-controls">
          <SlidersHorizontal size={16} />
          <select
            aria-label="Responsible team filter"
            value={teamId}
            onChange={(e) => {
              setTeamId(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All teams</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          <label>
            <span className="sr-only">Explorer area</span>
            <select
              aria-label="Explorer area"
              value={filters.sector}
              onChange={(e) => change({ sector: e.target.value })}
            >
              <option>All areas</option>
              {sectors.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          <label>
            <span className="sr-only">Explorer period</span>
            <select
              aria-label="Explorer period"
              value={filters.days}
              onChange={(e) => change({ days: Number(e.target.value) })}
            >
              <option value={0}>All dates (including scheduled)</option>
              <option value={30}>Last 30 days</option>
              <option value={7}>Last 7 days</option>
            </select>
          </label>
          <label>
            <span className="sr-only">Record status</span>
            <select
              aria-label="Record status"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
            >
              {[
                "All statuses",
                "Open",
                "In progress",
                "Completed",
                "Cancelled",
                "Overdue",
              ].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          <label>
            <span className="sr-only">Record priority</span>
            <select
              aria-label="Record priority"
              value={priority}
              onChange={(e) => {
                setPriority(e.target.value);
                setPage(1);
              }}
            >
              {["All priorities", "Urgent", "Routine"].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          <button className="text-button" onClick={reset}>
            Reset all
          </button>
        </div>
      </section>
      <section className="explorer-metrics" aria-label="Explorer summary">
        <div>
          <span>Records in view</span>
          <strong data-testid="explorer-total">
            {stats.total}
            <FileText size={19} />
          </strong>
          <small>
            Across {new Set(items.map((r) => r.category)).size} operational
            datasets
          </small>
        </div>
        <div>
          <span>Outstanding</span>
          <strong>
            {stats.outstanding}
            <span className="metric-sub">{stats.overdue} overdue</span>
          </strong>
          <small>{stats.urgent} urgent · at the snapshot date</small>
        </div>
        <div>
          <span>Connected records</span>
          <strong>
            {new Set(connections.flatMap((c) => [c.fromId, c.toId])).size}
            <GitBranch size={19} />
          </strong>
          <small>
            {connections.length} explicit links within this selection
          </small>
        </div>
        <div>
          <span>Completion rate</span>
          <strong>
            {stats.completionRate}%<CheckCheck size={20} />
          </strong>
          <small>
            {stats.completed} of {stats.total} operations completed
          </small>
        </div>
      </section>
      <div className="explorer-views">
        <div role="group" aria-label="Explorer view">
          {(["records", "connections", "model", "reports"] as View[]).map(
            (v) => (
              <button
                key={v}
                aria-pressed={view === v}
                onClick={() => {
                  setView(v);
                  if (v === "reports") location.hash = "explorer/reports";
                }}
              >
                {v === "records" ? (
                  <Layers size={16} />
                ) : v === "connections" ? (
                  <GitBranch size={16} />
                ) : (
                  <Database size={16} />
                )}
                {
                  {
                    records: "Records",
                    connections: "Connections",
                    model: "Data model",
                    reports: "Reports",
                  }[v]
                }
                {v === "connections" && <span>{connections.length}</span>}
              </button>
            ),
          )}
        </div>
        <span className="selection-note">
          {filters.sector === "All areas"
            ? "All demo areas"
            : `${filters.sector} demo area`}{" "}
          <span> / </span>{" "}
          {selectedOne ??
            (filters.categories.length === 4
              ? "All datasets"
              : `${filters.categories.length} datasets`)}
        </span>
      </div>
      {view === "records" && (
        <>
          <section
            className="panel explorer-table-panel"
            aria-labelledby="records-heading"
          >
            <div className="explorer-section-heading">
              <div>
                <h2 id="records-heading">
                  Operational register <span>{items.length}</span>
                </h2>
                <p>One connected view of neighbourhood operations.</p>
              </div>
              <span className="record-help">
                <Info size={14} /> Select a record to explore its context
              </span>
            </div>
            <div
              className="table-scroll"
              tabIndex={0}
              role="region"
              aria-label="Operational records table, scroll horizontally on small screens"
            >
              <table className="explorer-table">
                <caption className="sr-only">
                  Filtered operational records. Sort using the record, recorded
                  date or due date column headers.
                </caption>
                <thead>
                  <tr>
                    <th
                      aria-sort={
                        sort === "title"
                          ? ascending
                            ? "ascending"
                            : "descending"
                          : "none"
                      }
                    >
                      <button onClick={() => order("title")}>
                        Record{" "}
                        {sort === "title" &&
                          (ascending ? (
                            <ArrowUp size={13} />
                          ) : (
                            <ArrowDown size={13} />
                          ))}
                      </button>
                    </th>
                    <th>Dataset / area</th>
                    <th>Status</th>
                    <th
                      aria-sort={
                        sort === "date"
                          ? ascending
                            ? "ascending"
                            : "descending"
                          : "none"
                      }
                    >
                      <button onClick={() => order("date")}>
                        Recorded{" "}
                        {sort === "date" &&
                          (ascending ? (
                            <ArrowUp size={13} />
                          ) : (
                            <ArrowDown size={13} />
                          ))}
                      </button>
                    </th>
                    <th
                      aria-sort={
                        sort === "due"
                          ? ascending
                            ? "ascending"
                            : "descending"
                          : "none"
                      }
                    >
                      <button onClick={() => order("due")}>
                        Due / completed{" "}
                        {sort === "due" &&
                          (ascending ? (
                            <ArrowUp size={13} />
                          ) : (
                            <ArrowDown size={13} />
                          ))}
                      </button>
                    </th>
                    <th>
                      <span className="sr-only">Connections</span>
                      <GitBranch size={14} />
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((r) => (
                    <tr key={r.id}>
                      <td>
                        <button
                          className="record-name"
                          onClick={() => onSelect(r)}
                        >
                          <span>
                            {r.id}
                            {r.priority === "Urgent" && <i>Urgent</i>}
                          </span>
                          <strong>{r.title}</strong>
                        </button>
                      </td>
                      <td>
                        <span className="dataset-cell">
                          <i style={{ background: colors[r.category] }} />
                          {r.category}
                        </span>
                        <small>
                          {r.sector} · {r.locationId}
                        </small>
                      </td>
                      <td>
                        <span
                          className={`state-tag state-${r.status.toLowerCase().replace(" ", "-")}`}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td>{formatDate(r.date)}</td>
                      <td className={isOverdue(r) ? "due-overdue" : ""}>
                        {formatDate(r.due)}
                        {isOverdue(r) && <small>Overdue</small>}
                      </td>
                      <td>
                        <span
                          className="link-count"
                          title="Links across the full collection"
                        >
                          {relatedLinks(r.id).length}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!items.length && (
              <div className="explorer-empty">
                <Search size={28} />
                <h3>No records match this view</h3>
                <p>
                  Try a different dataset, area or status, or clear your search.
                </p>
                <button className="button" onClick={reset}>
                  Reset all filters
                </button>
              </div>
            )}
            <div className="table-pagination">
              <span aria-live="polite">
                {items.length
                  ? `${(currentPage - 1) * 8 + 1}–${Math.min(currentPage * 8, items.length)} of ${items.length} records`
                  : "0 records"}{" "}
                <span>
                  · Sorted by{" "}
                  {sort === "date"
                    ? "recorded date"
                    : sort === "title"
                      ? "record title"
                      : "due date"}
                </span>
              </span>
              <div>
                <button
                  aria-label="Previous records page"
                  disabled={currentPage === 1}
                  onClick={() => setPage(currentPage - 1)}
                >
                  <ChevronLeft size={16} />
                </button>
                <span>
                  Page {currentPage} of {pages}
                </span>
                <button
                  aria-label="Next records page"
                  disabled={currentPage === pages}
                  onClick={() => setPage(currentPage + 1)}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </section>
          <div className="explorer-analysis">
            <section className="panel">
              <div className="explorer-section-heading">
                <div>
                  <div className="eyebrow">AREA × DATASET</div>
                  <h2>Where activity is concentrated</h2>
                  <p>Select a cell to narrow the shared data view.</p>
                </div>
              </div>
              <div className="matrix-scroll">
                <table className="area-matrix">
                  <caption className="sr-only">
                    Record counts by illustrative area and dataset
                  </caption>
                  <thead>
                    <tr>
                      <th>Area</th>
                      {categories.map((c) => (
                        <th key={c}>
                          {c === "Case management"
                            ? "Cases"
                            : c === "House visits"
                              ? "Visits"
                              : c}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sectors.map((s) => (
                      <tr key={s}>
                        <th scope="row">{s}</th>
                        {categories.map((c) => {
                          const count = items.filter(
                            (r) => r.sector === s && r.category === c,
                          ).length;
                          return (
                            <td key={c}>
                              <button
                                disabled={!count}
                                aria-label={`${s}, ${c}: ${count} records`}
                                style={{
                                  background: count
                                    ? `rgba(53,109,181,${0.07 + count * 0.065})`
                                    : "#f6f8fb",
                                }}
                                onClick={() =>
                                  change({ sector: s, categories: [c] })
                                }
                              >
                                {count || "—"}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="analysis-footnote">
                Counts are operations, not people. Demo areas are illustrative.
              </div>
            </section>
            <section className="panel">
              <div className="explorer-section-heading">
                <div>
                  <div className="eyebrow">RECORDED ACTIVITY</div>
                  <h2>Activity across the selection</h2>
                  <p>Date buckets cover all selected records</p>
                </div>
              </div>
              <div className="explorer-weekly">
                {weeks.map((w) => {
                  const count = w.values.reduce((a, b) => a + b, 0);
                  return (
                    <div key={w.label}>
                      <span>{w.label}</span>
                      <div
                        className="week-track"
                        role="img"
                        aria-label={`${w.label}: ${count} records`}
                      >
                        {w.values.map(
                          (v, i) =>
                            v > 0 && (
                              <span
                                key={i}
                                style={{
                                  width: `${(v / maxWeek) * 100}%`,
                                  background: colors[categories[i]],
                                }}
                              />
                            ),
                        )}
                      </div>
                      <strong>{count}</strong>
                    </div>
                  );
                })}
              </div>
              <div className="explorer-measures">
                <span>
                  <b>{stats.householdContacts}</b> household contacts
                </span>
                <span>
                  <b>{stats.participations}</b> participations
                </span>
              </div>
              <div className="analysis-footnote">
                Contacts and participations are separate measures, not unique
                people.
              </div>
            </section>
          </div>
        </>
      )}
      {view === "connections" && (
        <section className="panel connections-panel">
          <div className="explorer-section-heading">
            <div>
              <h2>From activity to action</h2>
              <p>
                Explicit referrals and raised matters. Both endpoints must be in
                your filtered selection.
              </p>
            </div>
            <GitBranch size={21} />
          </div>
          <div className="connections-list">
            {connections.map((link) => {
              const from = records.find((r) => r.id === link.fromId)!,
                to = records.find((r) => r.id === link.toId)!;
              return (
                <article className="connection-card" key={link.id}>
                  <button onClick={() => onSelect(from)}>
                    <span style={{ color: colors[from.category] }}>
                      {from.category} <span>{from.id}</span>
                    </span>
                    <strong>{from.title}</strong>
                    <small>
                      {from.sector} · {formatDate(from.date)}
                    </small>
                  </button>
                  <div className="connection-direction">
                    <span>{link.kind}</span>
                    <ArrowRight size={22} />
                  </div>
                  <button onClick={() => onSelect(to)}>
                    <span style={{ color: colors[to.category] }}>
                      {to.category} <span>{to.id}</span>
                    </span>
                    <strong>{to.title}</strong>
                    <small>
                      {to.sector} · {to.status}
                    </small>
                  </button>
                  <p>
                    <Info size={13} />
                    {link.note}
                  </p>
                </article>
              );
            })}
          </div>
          {!connections.length && (
            <div className="explorer-empty">
              <GitBranch size={30} />
              <h3>No connections within this selection</h3>
              <p>
                Cross-dataset links need both datasets in view. Individual
                record details always show their full context.
              </p>
              <button className="button" onClick={reset}>
                Show all records
              </button>
            </div>
          )}
          <div className="analysis-footnote">
            Links describe fictional operational provenance. Shared geography or
            team ownership alone does not establish a causal relationship.
          </div>
        </section>
      )}
      {view === "model" && (
        <section className="panel model-panel">
          <div className="explorer-section-heading">
            <div>
              <h2>A shared foundation</h2>
              <p>
                Collection-wide definitions and reference entities. These counts
                are independent of your filters.
              </p>
            </div>
            <span className="subtle-badge">Read-only demonstration</span>
          </div>
          <div className="model-diagram">
            <div className="model-node">
              <span>REFERENCE ENTITY</span>
              <h3>Locations</h3>
              <strong>{locations.length}</strong>
              <p>
                One location → many operations
                <br />
                Area and coordinates live here.
              </p>
            </div>
            <div className="model-connector">
              1 : many <ArrowRight size={19} />
            </div>
            <div className="model-node model-core">
              <span>OPERATIONAL ENTITY</span>
              <h3>Operations</h3>
              <strong>{records.length}</strong>
              <p>
                Four typed datasets
                <br />
                Stable IDs, status and dates.
              </p>
            </div>
            <div className="model-connector">
              <ChevronLeft size={19} /> many : 1
            </div>
            <div className="model-node">
              <span>REFERENCE ENTITY</span>
              <h3>Teams</h3>
              <strong>{teams.length}</strong>
              <p>
                One team → many operations
                <br />
                Explicit responsibility.
              </p>
            </div>
          </div>
          <div className="model-link-note">
            <GitBranch size={17} />
            <span>
              <strong>Record links</strong> connect operations through
              directional, typed relationships. A record can have multiple
              links; a link never duplicates its endpoint records.
            </span>
          </div>
          <div className="model-columns">
            <div>
              <h3>Shared reference directories</h3>
              <p>
                {people.length} personnel · {organisations.length} organisation
                entries (including unassigned). Coordinator and deployment IDs
                resolve to the same personnel directory. Organisation
                responsibility is separate from branch team ownership.
              </p>
              <h3>Responsibility directory</h3>
              <p>Each demo team currently covers one illustrative area.</p>
              {teams.map((team) => (
                <button
                  className="team-row"
                  key={team.id}
                  onClick={() => {
                    reset();
                    onChange({ sector: "All areas", days: 0 });
                    setTeamId(team.id);
                    setView("records");
                  }}
                >
                  <span>
                    <strong>{team.name}</strong>
                    <small>{team.id}</small>
                  </span>
                  <span>
                    {records.filter((r) => r.teamId === team.id).length} records{" "}
                    <ArrowUpRight size={15} />
                  </span>
                </button>
              ))}
            </div>
            <div>
              <h3>How to read the measures</h3>
              <dl className="dictionary">
                <div>
                  <dt>Household contacts</dt>
                  <dd>
                    Sum of contacts recorded in visit rounds. Not a count of
                    unique households.
                  </dd>
                </div>
                <div>
                  <dt>Participations</dt>
                  <dd>
                    Sum of attendees recorded for engagements. Repeat attendance
                    may occur.
                  </dd>
                </div>
                <div>
                  <dt>Completion rate</dt>
                  <dd>
                    Completed operations ÷ all filtered operations. Empty
                    selections show 0%.
                  </dd>
                </div>
                <div>
                  <dt>Overdue</dt>
                  <dd>
                    Active (not completed or cancelled), with a due date before
                    17 November 2026 (SGT).
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </section>
      )}
      <div className="explorer-disclosure">
        <Info size={14} />
        <span>
          Public demonstration · Fictional operations and relationships only.
          Area, period, search and dataset selections carry across both primary
          tabs; status and priority refine this explorer only.
        </span>
      </div>
    </div>
  );
}
