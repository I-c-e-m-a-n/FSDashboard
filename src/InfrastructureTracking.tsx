import { useRef, useState, useEffect } from "react";
import {
  ArrowRight,
  Building2,
  CheckCheck,
  Clock3,
  Download,
  Info,
  MapPin,
  Plus,
  Search,
  SlidersHorizontal,
  Wrench,
  X,
} from "lucide-react";
import {
  infrastructureTypes,
  organisations,
  stages,
  useInfrastructure,
  freshMatter,
  saveMatter,
  isActive,
  isMatterOverdue,
  infrastructureReport,
  infrastructureWarning,
  type InfrastructureMatter,
  type InfrastructureStage,
} from "./infrastructureStore";
import { locations, teams, records, links, formatDate } from "./data";
import MapView from "./MapView";
import "./infrastructure.css";
const stageLabel = (stage: InfrastructureStage) =>
  stage.toLowerCase().replaceAll(" ", "-");
export default function InfrastructureTracking() {
  const matters = useInfrastructure();
  const [view, setView] = useState("Register"),
    [query, setQuery] = useState(""),
    [category, setCategory] = useState("All categories"),
    [stage, setStage] = useState("All stages"),
    [org, setOrg] = useState("All organisations"),
    [area, setArea] = useState("All areas"),
    [attention, setAttention] = useState("All priorities"),
    [sort, setSort] = useState("Target date"),
    [edit, setEdit] = useState<InfrastructureMatter | null>(null),
    [note, setNote] = useState(""),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (edit) dialog.current?.showModal();
  }, [edit?.id]);
  const filtered = matters
    .filter(
      (m) =>
        (category === "All categories" || m.type === category) &&
        (stage === "All stages" || m.stage === stage) &&
        (org === "All organisations" || m.organisationId === org) &&
        (area === "All areas" ||
          locations.find((l) => l.id === m.locationId)?.sector === area) &&
        (attention === "All priorities" ||
          (attention === "Overdue"
            ? isMatterOverdue(m)
            : m.priority === attention)) &&
        `${m.id} ${m.title} ${m.description} ${locations.find((l) => l.id === m.locationId)?.label}`
          .toLowerCase()
          .includes(query.toLowerCase()),
    )
    .sort((a, b) =>
      sort === "Newest report"
        ? b.reportedOn.localeCompare(a.reportedOn) || a.id.localeCompare(b.id)
        : sort === "Progress"
          ? b.progress - a.progress || a.id.localeCompare(b.id)
          : a.dueOn.localeCompare(b.dueOn) || a.id.localeCompare(b.id),
    );
  const active = filtered.filter(isActive),
    resolved = filtered.filter((m) => ["Resolved", "Closed"].includes(m.stage)),
    overdue = filtered.filter(isMatterOverdue),
    urgent = active.filter((m) => m.priority === "Urgent");
  function open(m: InfrastructureMatter) {
    setEdit(structuredClone(m));
    setNote("");
    setError("");
  }
  function update<K extends keyof InfrastructureMatter>(
    key: K,
    value: InfrastructureMatter[K],
  ) {
    setEdit((m) => (m ? { ...m, [key]: value } : m));
  }
  function reset() {
    setQuery("");
    setCategory("All categories");
    setStage("All stages");
    setOrg("All organisations");
    setArea("All areas");
    setAttention("All priorities");
  }
  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!edit) return;
    try {
      saveMatter(edit, note);
      dialog.current?.close();
      setNotice(
        "Matter and progress update saved in this browser. All dashboard tabs now use the same record.",
      );
    } catch (error) {
      setError((error as Error).message);
    }
  }
  function exportReport() {
    const url = URL.createObjectURL(
      new Blob([infrastructureReport(filtered)], {
        type: "text/csv;charset=utf-8",
      }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "fengshan-infrastructure-demo.csv";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setNotice(`Exported ${filtered.length} matching matters.`);
  }
  const inherited = edit ? links.filter((l) => l.toId === edit.id) : [];
  return (
    <div className="infra-page">
      <div className="page-heading">
        <div>
          <div className="eyebrow">BETTER PLACES, VISIBLE PROGRESS</div>
          <h1>
            Infrastructure tracking<span>.</span>
          </h1>
          <p>From neighbourhood observations to accountable action.</p>
        </div>
        <div className="infra-heading-actions">
          <button
            className="button"
            onClick={exportReport}
            disabled={!filtered.length}
          >
            <Download size={15} />
            Export report
          </button>
          <button
            className="button infra-primary"
            onClick={() => open(freshMatter())}
          >
            <Plus size={17} />
            Report a matter
          </button>
        </div>
      </div>
      <div className="demo-notice">
        <Info size={15} />
        <span>
          <strong>Synthetic, browser-local MVP.</strong> Reports and updates
          stay in this browser. No submission is sent to Town Council, NEA, LTA
          or other organisations. Do not enter real resident information.
        </span>
      </div>
      {infrastructureWarning && (
        <p role="status" className="infra-warning">
          {infrastructureWarning}
        </p>
      )}
      <p className="save-notice" role="status">
        {notice}
      </p>
      <section className="infra-metrics" aria-label="Infrastructure summary">
        <div>
          <span>
            Matters in view
            <Wrench size={18} />
          </span>
          <strong data-testid="infra-total">{filtered.length}</strong>
          <small>
            {new Set(filtered.map((m) => m.type)).size} categories represented
          </small>
        </div>
        <div>
          <span>
            Active workload
            <Building2 size={18} />
          </span>
          <strong>{active.length}</strong>
          <small>
            {urgent.length} urgent ·{" "}
            {active.filter((m) => m.organisationId === "ORG-UNASSIGNED").length}{" "}
            unassigned
          </small>
        </div>
        <div>
          <span>
            Past target
            <Clock3 size={18} />
          </span>
          <strong>{overdue.length}</strong>
          <small>As of 17 Nov 2026 · SGT</small>
        </div>
        <div>
          <span>
            Resolved or closed
            <CheckCheck size={18} />
          </span>
          <strong>{resolved.length}</strong>
          <small>
            {filtered.length
              ? Math.round((resolved.length / filtered.length) * 100)
              : 0}
            % of all selected matters
          </small>
        </div>
      </section>
      <section className="panel infra-register">
        <div className="infra-toolbar">
          <div
            role="group"
            aria-label="Infrastructure view"
            className="infra-views"
          >
            {["Register", "Map", "Reports"].map((v) => (
              <button
                key={v}
                aria-pressed={view === v}
                onClick={() => setView(v)}
              >
                {v === "Map" ? (
                  <MapPin size={16} />
                ) : v === "Reports" ? (
                  <Building2 size={16} />
                ) : (
                  <Wrench size={16} />
                )}{" "}
                {v}
              </button>
            ))}
          </div>
          <label className="infra-search">
            <Search size={16} />
            <input
              aria-label="Search infrastructure"
              placeholder="Search title, location or reference…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
        </div>
        <div className="infra-filters">
          <SlidersHorizontal size={16} />
          <select
            aria-label="Infrastructure category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option>All categories</option>
            {infrastructureTypes.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
          <select
            aria-label="Responsible organisation filter"
            value={org}
            onChange={(e) => setOrg(e.target.value)}
          >
            <option>All organisations</option>
            {organisations.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
          <select
            aria-label="Infrastructure stage filter"
            value={stage}
            onChange={(e) => setStage(e.target.value)}
          >
            <option>All stages</option>
            {stages.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <select
            aria-label="Infrastructure area"
            value={area}
            onChange={(e) => setArea(e.target.value)}
          >
            {["All areas", "North", "Central", "South"].map((a) => (
              <option key={a}>{a}</option>
            ))}
          </select>
          <select
            aria-label="Infrastructure attention filter"
            value={attention}
            onChange={(e) => setAttention(e.target.value)}
          >
            {["All priorities", "Routine", "Urgent", "Overdue"].map((a) => (
              <option key={a}>{a}</option>
            ))}
          </select>
          <button className="text-button" onClick={reset}>
            Reset filters
          </button>
        </div>
        {view === "Register" && (
          <>
            <div className="infra-list-heading">
              <span aria-live="polite">
                {filtered.length} matching matters · select a record to manage
              </span>
              <label>
                Sort{" "}
                <select
                  aria-label="Infrastructure sort"
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                >
                  {["Target date", "Newest report", "Progress"].map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </label>
            </div>
            <div className="infra-list">
              {filtered.map((m) => (
                <button
                  className="infra-record"
                  key={m.id}
                  onClick={() => open(m)}
                >
                  <span className="infra-record-icon">
                    <Wrench size={20} />
                  </span>
                  <span className="infra-record-title">
                    <span>
                      {m.id} <i>{m.type}</i>
                      {m.priority === "Urgent" && (
                        <b className="urgent-badge">Urgent</b>
                      )}
                    </span>
                    <strong>{m.title}</strong>
                    <small>
                      {locations.find((l) => l.id === m.locationId)?.label}
                    </small>
                  </span>
                  <span className="infra-owner">
                    <Building2 size={14} />
                    {organisations.find((o) => o.id === m.organisationId)?.name}
                    <small>{teams.find((t) => t.id === m.teamId)?.name}</small>
                  </span>
                  <span className="infra-progress">
                    <span>
                      {m.progress}%{" "}
                      <small>
                        {m.stage === "Cancelled"
                          ? "retained progress"
                          : "work complete"}
                      </small>
                    </span>
                    <progress value={m.progress} max={100} />
                  </span>
                  <span className={`infra-state ${stageLabel(m.stage)}`}>
                    {m.stage}
                  </span>
                  <span
                    className={`infra-due ${isMatterOverdue(m) ? "late" : ""}`}
                  >
                    {isMatterOverdue(m) ? "Overdue" : "Target"}
                    <strong>
                      {formatDate(m.dueOn)} {m.dueOn.slice(0, 4)}
                    </strong>
                  </span>
                  <ArrowRight size={16} />
                </button>
              ))}
            </div>
          </>
        )}
        {view === "Map" && (
          <>
            <MapView
              items={filtered.map((m) => records.find((r) => r.id === m.id)!)}
              selected={null}
              onSelect={(r) => open(matters.find((m) => m.id === r.id)!)}
            />
            <div className="analysis-footnote">
              Approximate synthetic locations · markers and register open the
              same record.
            </div>
          </>
        )}
        {view === "Reports" && (
          <div className="infra-reports">
            <section>
              <div className="eyebrow">RESPONSIBILITY & FOLLOW-UP</div>
              <h2>Organisation workload</h2>
              <p>
                Current filtered selection. Select an organisation to inspect
                its matters.
              </p>
              {organisations.map((o) => {
                const group = filtered.filter((m) => m.organisationId === o.id);
                return (
                  <button
                    className="org-report"
                    key={o.id}
                    disabled={!group.length}
                    onClick={() => {
                      setOrg(o.id);
                      setView("Register");
                    }}
                  >
                    <span>
                      <strong>{o.name}</strong>
                      <small>{o.scope} · illustrative allocation</small>
                    </span>
                    <span>
                      <b>{group.filter(isActive).length}</b> active
                      <small>
                        {group.filter(isMatterOverdue).length} overdue /{" "}
                        {group.length} total
                      </small>
                    </span>
                    <ArrowRight size={15} />
                  </button>
                );
              })}
            </section>
            <section>
              <div className="eyebrow">LIFECYCLE DISTRIBUTION</div>
              <h2>Where matters stand</h2>
              <p>Counts of matters, not progress updates.</p>
              {stages.map((s) => {
                const count = filtered.filter((m) => m.stage === s).length;
                return (
                  <button
                    key={s}
                    className="stage-report"
                    disabled={!count}
                    onClick={() => {
                      setStage(s);
                      setView("Register");
                    }}
                  >
                    <span>{s}</span>
                    <span className="stage-track">
                      <i
                        style={{
                          width: `${filtered.length ? (count / filtered.length) * 100 : 0}%`,
                        }}
                      />
                    </span>
                    <strong>{count}</strong>
                  </button>
                );
              })}
              <div className="infra-report-note">
                <Info size={17} />
                <p>
                  Progress is a manually reported estimate. Resolution requires
                  100% and a note; closure records completion of the
                  administrative follow-up. Cancelled records remain available
                  for reference.
                </p>
              </div>
            </section>
          </div>
        )}
        {!filtered.length && (
          <div className="explorer-empty">
            <Wrench size={28} />
            <h3>No matching infrastructure matters</h3>
            <p>
              Adjust your filters or report a synthetic neighbourhood matter.
            </p>
            <button className="button" onClick={reset}>
              Clear infrastructure filters
            </button>
          </div>
        )}
      </section>
      <div className="explorer-disclosure">
        <Info size={14} />
        <span>
          One record across the dashboard. Infrastructure uses an explicit 17
          Nov 2026 reporting date; Overview’s historical snapshot remains 16
          Nov. Choose All dates in Overview or Data Explorer to include newer
          reports.
        </span>
      </div>
      <dialog
        ref={dialog}
        aria-label="Infrastructure matter editor"
        onClose={() => setEdit(null)}
      >
        {edit && (
          <form onSubmit={submit}>
            <div className="dialog-heading">
              <span className="eyebrow">
                {edit.history.length ? "MANAGE MATTER" : "NEW REPORT"} ·
                SYNTHETIC ONLY
              </span>
              <button
                type="button"
                className="icon-button"
                aria-label="Close infrastructure editor"
                onClick={() => dialog.current?.close()}
              >
                <X />
              </button>
            </div>
            <h2>{edit.title || "Report a neighbourhood matter"}</h2>
            <p className="infra-reference">{edit.id}</p>
            <div className="infra-form">
              <label className="wide">
                Title
                <input
                  required
                  maxLength={120}
                  value={edit.title}
                  onChange={(e) => update("title", e.target.value)}
                />
              </label>
              <label>
                Category
                <select
                  aria-label="Matter category"
                  value={edit.type}
                  onChange={(e) => update("type", e.target.value)}
                >
                  {infrastructureTypes.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </label>
              <label>
                Priority
                <select
                  aria-label="Matter priority"
                  value={edit.priority}
                  onChange={(e) =>
                    update("priority", e.target.value as "Routine" | "Urgent")
                  }
                >
                  <option>Routine</option>
                  <option>Urgent</option>
                </select>
              </label>
              <label className="wide">
                Location
                <select
                  aria-label="Matter location"
                  value={edit.locationId}
                  onChange={(e) => update("locationId", e.target.value)}
                >
                  {locations.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Responsible organisation
                <select
                  aria-label="Responsible organisation"
                  value={edit.organisationId}
                  onChange={(e) => update("organisationId", e.target.value)}
                >
                  {organisations.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Branch coordination team
                <select
                  aria-label="Branch coordination team"
                  value={edit.teamId}
                  onChange={(e) => update("teamId", e.target.value)}
                >
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Reported date
                <input
                  type="date"
                  required
                  readOnly={edit.history.length > 0}
                  value={edit.reportedOn}
                  onChange={(e) => update("reportedOn", e.target.value)}
                />
              </label>
              <label>
                Target date
                <input
                  type="date"
                  required
                  min={edit.reportedOn}
                  value={edit.dueOn}
                  onChange={(e) => update("dueOn", e.target.value)}
                />
              </label>
              <label>
                Lifecycle stage
                <select
                  aria-label="Matter lifecycle stage"
                  value={edit.stage}
                  onChange={(e) =>
                    update("stage", e.target.value as InfrastructureStage)
                  }
                >
                  {stages.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </label>
              <label>
                Progress (%)
                <input
                  type="number"
                  min={0}
                  max={100}
                  step={1}
                  required
                  value={edit.progress}
                  onChange={(e) => update("progress", Number(e.target.value))}
                />
              </label>
              <label className="wide">
                Description
                <input
                  required
                  maxLength={3000}
                  value={edit.description}
                  onChange={(e) => update("description", e.target.value)}
                />
              </label>
              <label className="wide">
                Update note (required)
                <textarea
                  rows={3}
                  required
                  maxLength={1500}
                  placeholder="What changed, what was done, and what happens next?"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </label>
            </div>
            {inherited.length > 0 && (
              <section className="infra-origin">
                <h3>Links maintained by other modules</h3>
                <p>
                  These associations remain attached to their source records.
                </p>
                {inherited.map((l) => (
                  <div key={l.id}>
                    <span>{l.kind}</span>
                    <strong>
                      {records.find((r) => r.id === l.fromId)?.title ??
                        l.fromId}
                    </strong>
                    <small>{l.fromId}</small>
                  </div>
                ))}
              </section>
            )}
            <fieldset className="infra-links">
              <legend>Related operational records</legend>
              <p>
                Optional associations to existing resident cases, visits or
                engagements. Synthetic IDs only; no resident identities are
                stored. Existing incoming links are shown above.
              </p>
              {records
                .filter((r) => r.category !== "Infrastructure")
                .map((r) => (
                  <label key={r.id}>
                    <input
                      type="checkbox"
                      checked={edit.relatedIds.includes(r.id)}
                      onChange={(e) =>
                        update(
                          "relatedIds",
                          e.target.checked
                            ? [...edit.relatedIds, r.id]
                            : edit.relatedIds.filter((id) => id !== r.id),
                        )
                      }
                    />
                    <span>
                      {r.id} · {r.title}
                      <small>
                        {r.category} · {r.status}
                      </small>
                    </span>
                  </label>
                ))}
            </fieldset>
            <section className="infra-history">
              <div className="eyebrow">PROGRESS JOURNAL</div>
              <h3>{edit.history.length} recorded updates</h3>
              {!edit.history.length && (
                <p>Your initial report and note will create the first entry.</p>
              )}
              {[...edit.history].reverse().map((h) => (
                <article key={h.id}>
                  <span className={`infra-state ${stageLabel(h.stage)}`}>
                    {h.stage}
                  </span>
                  <strong>{h.progress}%</strong>
                  <time dateTime={h.at}>
                    {new Intl.DateTimeFormat("en-SG", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                      timeZone: "Asia/Singapore",
                    }).format(new Date(h.at))}{" "}
                    SGT
                  </time>
                  <p>{h.note}</p>
                </article>
              ))}
            </section>
            <p className="infra-history-note">
              Notes are appended when you save. This browser-local journal is a
              demonstration, not a tamper-proof audit trail.
            </p>
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <div className="infra-form-actions">
              <button
                type="button"
                className="button"
                onClick={() => dialog.current?.close()}
              >
                Discard changes
              </button>
              <button className="button infra-primary">
                Save matter & update
              </button>
            </div>
          </form>
        )}
      </dialog>
    </div>
  );
}
