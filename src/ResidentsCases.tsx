import { useEffect, useRef, useState } from "react";
import {
  Plus,
  Users,
  ClipboardList,
  MapPin,
  Download,
  Info,
  X,
} from "lucide-react";
import { records, links } from "./data";
import { locations, teams, organisations } from "./referenceData";
import { people } from "./personnelStore";
import {
  reportingDate,
  reportingLabel,
  inReportingWindow,
  matchesQuery,
} from "./reporting";
import {
  blocks,
  useCases,
  caseWarning,
  caseStages,
  caseChannels,
  visitOutcomes,
  freshCase,
  freshHousehold,
  saveCase,
  saveHousehold,
  saveContact,
  updateContact,
  blockCoverage,
  caseMetrics,
  activeCase,
  type ResidentCase,
  type Household,
  type VisitContact,
  type FamilyLink,
} from "./caseStore";
import MapView from "./MapView";
import "./residents.css";
const householdLabel = (id: string) =>
  id.length > 12 ? `HH-${id.slice(-8)}` : id;
export default function ResidentsCases() {
  const data = useCases();
  const [view, setView] = useState("Cases"),
    [query, setQuery] = useState(""),
    [block, setBlock] = useState(""),
    [stage, setStage] = useState(""),
    [channel, setChannel] = useState(""),
    [urgency, setUrgency] = useState(""),
    [days, setDays] = useState(30);
  const [edit, setEdit] = useState<ResidentCase | null>(null),
    [house, setHouse] = useState<Household | null>(null),
    [visit, setVisit] = useState<VisitContact | null>(null),
    [note, setNote] = useState(""),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const [from, setFrom] = useState(""),
    [to, setTo] = useState(""),
    [relation, setRelation] = useState<FamilyLink["kind"]>("Parent of");
  const caseDialog = useRef<HTMLDialogElement>(null),
    houseDialog = useRef<HTMLDialogElement>(null),
    visitDialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (edit) caseDialog.current?.showModal();
  }, [edit?.id]);
  useEffect(() => {
    if (house) houseDialog.current?.showModal();
  }, [house?.id]);
  useEffect(() => {
    if (visit) visitDialog.current?.showModal();
  }, [visit?.id]);
  const householdMatches = (id: string) =>
    !block || data.households.find((h) => h.id === id)?.blockId === block;
  const filtered = data.cases
    .filter(
      (c) =>
        householdMatches(c.householdId) &&
        (!stage ||
          (stage === "Overdue"
            ? activeCase(c) && c.followUp < reportingDate
            : c.stage === stage)) &&
        (view === "MPS"
          ? c.channel === "MPS"
          : !channel || c.channel === channel) &&
        (!urgency || c.urgency === urgency) &&
        inReportingWindow(c.openedOn, days) &&
        matchesQuery(query, c.id, c.title, c.householdId, c.residentId),
    )
    .sort(
      (a, b) =>
        Number(activeCase(b)) - Number(activeCase(a)) ||
        a.followUp.localeCompare(b.followUp),
    );
  const roster = data.households.filter(
    (h) =>
      householdMatches(h.id) &&
      matchesQuery(query, h.id, ...h.members.map((m) => m.id)),
  );
  const metrics = caseMetrics(filtered);
  function openCase(c: ResidentCase) {
    setError("");
    setNote("");
    setEdit(structuredClone(c));
  }
  function openHouse(h: Household) {
    setError("");
    setFrom(h.members[0]?.id ?? "");
    setTo(h.members[1]?.id ?? "");
    setHouse(structuredClone(h));
  }
  function openVisit(h: Household) {
    setError("");
    setVisit({
      id: `VISIT-${crypto.randomUUID()}`,
      householdId: h.id,
      operationId: records.find(
        (r) => r.category === "House visits" && r.status !== "Cancelled",
      )!.id,
      personId: people[0].id,
      date: reportingDate,
      outcome: "Contacted",
    });
  }
  function update<K extends keyof ResidentCase>(
    key: K,
    value: ResidentCase[K],
  ) {
    setEdit((c) => (c ? { ...c, [key]: value } : c));
  }
  function finish(action: () => void, dialog: HTMLDialogElement | null) {
    try {
      action();
      dialog?.close();
      setNotice("Saved in this browser. Shared operational views are updated.");
    } catch (e) {
      setError((e as Error).message);
    }
  }
  function reset() {
    setQuery("");
    setBlock("");
    setStage("");
    setChannel("");
    setUrgency("");
    setDays(30);
  }
  function exportCases() {
    const cell = (s: unknown) =>
      `"${String(s)
        .replace(/^[=+@-]/, "'$&")
        .replaceAll('"', '""')}"`;
    const rows = [
      ["Synthetic case report", reportingLabel],
      [
        "ID",
        "Title",
        "Household",
        "Resident",
        "Channel",
        "Opened",
        "Stage",
        "Urgency",
        "Organisation",
        "Follow-up",
        "Resolved",
      ],
      ...filtered.map((c) => [
        c.id,
        c.title,
        c.householdId,
        c.residentId,
        c.channel,
        c.openedOn,
        c.stage,
        c.urgency,
        organisations.find((o) => o.id === c.organisationId)!.name,
        c.followUp,
        c.resolvedOn,
      ]),
    ];
    const url = URL.createObjectURL(
      new Blob([rows.map((r) => r.map(cell).join(",")).join("\r\n")], {
        type: "text/csv;charset=utf-8",
      }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "fengshan-synthetic-cases.csv";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  useEffect(() => {
    const selectFromHash = () => {
      const id = decodeURIComponent(location.hash.split("/")[1] ?? "");
      const match = data.cases.find((c) => c.id === id);
      if (match) openCase(match);
    };
    selectFromHash();
    window.addEventListener("hashchange", selectFromHash);
    return () => window.removeEventListener("hashchange", selectFromHash);
  }, []);
  const titleId = edit?.id ?? "";
  return (
    <div className="residents-page">
      <div className="page-heading">
        <div>
          <div className="eyebrow">HOUSEHOLDS, FOLLOW-THROUGH & OUTCOMES</div>
          <h1>
            Residents & cases<span>.</span>
          </h1>
          <p>A connected view from doorstep conversations to resolution.</p>
        </div>
        <div className="rc-actions">
          <button className="button" onClick={exportCases}>
            <Download size={16} />
            Export cases
          </button>
          <button
            className="button rc-primary"
            onClick={() => openCase(freshCase())}
          >
            <Plus size={16} />
            New case
          </button>
        </div>
      </div>
      <div className="rc-disclosure">
        <Info size={16} />
        <span>
          Synthetic demonstration · {reportingLabel}, SGT. No names, real
          addresses or contact details. Browser-local records only; referrals
          are not sent to organisations.
        </span>
      </div>
      {notice && <p role="status">{notice}</p>}
      {caseWarning && <p role="status">{caseWarning}</p>}
      <section className="rc-metrics" aria-label="Filtered case statistics">
        {[
          ["Cases in view", filtered.length, "Filtered by opened date"],
          [
            "Active cases",
            metrics.active,
            `${metrics.overdue} follow-ups overdue`,
          ],
          [
            "Resolved / closed",
            metrics.resolved,
            `${metrics.rate}% of all selected cases`,
          ],
          [
            "Mean resolution time",
            metrics.meanDays === null ? "—" : `${metrics.meanDays}d`,
            "Opening to latest resolution; resolved cohort only",
          ],
        ].map(([label, value, detail]) => (
          <article key={label}>
            <span>{label}</span>
            <strong
              data-testid={label === "Cases in view" ? "case-total" : undefined}
            >
              {value}
            </strong>
            <small>{detail}</small>
          </article>
        ))}
      </section>
      <section className="rc-panel">
        <div className="rc-toolbar">
          <div className="rc-tabs" aria-label="Resident workspace views">
            {["Cases", "Households", "Coverage", "MPS", "Outcomes", "Map"].map(
              (v) => (
                <button
                  key={v}
                  aria-pressed={view === v}
                  onClick={() => setView(v)}
                  className={view === v ? "active" : ""}
                >
                  {v}
                </button>
              ),
            )}
          </div>
          <label className="sr-only" htmlFor="rc-search">
            Search cases or households
          </label>
          <input
            id="rc-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Case title, household or resident ID…"
          />
        </div>
        <div className="rc-filters">
          <label>
            Block
            <select
              aria-label="Resident block filter"
              value={block}
              onChange={(e) => setBlock(e.target.value)}
            >
              <option value="">All demo blocks</option>
              {blocks.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Reporting period
            <select
              aria-label="Case reporting period"
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
            >
              <option value={30}>Last 30 days</option>
              <option value={7}>Last 7 days</option>
              <option value={0}>All dates</option>
            </select>
          </label>
          {["Cases", "MPS", "Outcomes", "Map"].includes(view) && (
            <>
              <label>
                Stage
                <select
                  aria-label="Case stage filter"
                  value={stage}
                  onChange={(e) => setStage(e.target.value)}
                >
                  <option value="">All stages</option>
                  {[...caseStages, "Overdue"].map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </label>
              <label>
                Channel
                <select
                  aria-label="Case channel filter"
                  value={view === "MPS" ? "MPS" : channel}
                  disabled={view === "MPS"}
                  onChange={(e) => setChannel(e.target.value)}
                >
                  <option value="">All channels</option>
                  {caseChannels.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </label>
              <label>
                Urgency
                <select
                  aria-label="Case urgency filter"
                  value={urgency}
                  onChange={(e) => setUrgency(e.target.value)}
                >
                  <option value="">All urgency levels</option>
                  {["Routine", "Urgent", "Critical"].map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </label>
            </>
          )}
          <button onClick={reset}>Reset filters</button>
        </div>
        {view === "Cases" && (
          <div className="rc-register">
            {filtered.map((c) => (
              <button
                className="rc-case"
                key={c.id}
                onClick={() => openCase(c)}
              >
                <div>
                  <small>
                    {c.id} · {c.channel}
                  </small>
                  <strong>{c.title}</strong>
                  <span>
                    {householdLabel(c.householdId)} ·{" "}
                    {
                      blocks.find(
                        (b) =>
                          b.id ===
                          data.households.find((h) => h.id === c.householdId)
                            ?.blockId,
                      )?.label
                    }
                  </span>
                </div>
                <div>
                  <span
                    className={`rc-badge ${c.urgency !== "Routine" ? "urgent" : ""}`}
                  >
                    {c.urgency}
                  </span>
                  <span>{c.stage}</span>
                  <small>
                    {organisations.find((o) => o.id === c.organisationId)?.name}
                  </small>
                </div>
                <div>
                  <span>
                    {activeCase(c) ? "Next follow-up" : "Final follow-up"}
                  </span>
                  <strong
                    className={
                      activeCase(c) && c.followUp < reportingDate
                        ? "rc-overdue"
                        : ""
                    }
                  >
                    {c.followUp}
                  </strong>
                  <small>{people.find((p) => p.id === c.ownerId)?.name}</small>
                </div>
              </button>
            ))}
            {!filtered.length && (
              <p className="rc-empty">No cases match this view.</p>
            )}
          </div>
        )}
        {view === "Households" && (
          <div className="rc-content">
            <div className="rc-section-heading">
              <div>
                <h2>Household directory</h2>
                <p>
                  {roster.length} synthetic households. Search and block filters
                  apply; case stage and reporting period do not remove residents
                  from the roster.
                </p>
              </div>
              <button
                className="button"
                onClick={() => openHouse(freshHousehold())}
              >
                <Users size={16} />
                Add household
              </button>
            </div>
            <div className="rc-households">
              {roster.map((h) => (
                <article key={h.id}>
                  <small>{blocks.find((b) => b.id === h.blockId)?.label}</small>
                  <h3>{householdLabel(h.id)}</h3>
                  <p>
                    {h.members.length} residents · {h.relationships.length}{" "}
                    family links
                  </p>
                  <p>
                    {
                      data.cases.filter(
                        (c) => c.householdId === h.id && activeCase(c),
                      ).length
                    }{" "}
                    active cases ·{" "}
                    {data.contacts.filter((v) => v.householdId === h.id).length}{" "}
                    visit outcomes
                  </p>
                  <div className="rc-actions">
                    <button onClick={() => openHouse(h)}>View household</button>
                    <button onClick={() => openVisit(h)}>Record visit</button>
                    <button onClick={() => openCase(freshCase(h))}>
                      Open case
                    </button>
                  </div>
                </article>
              ))}
            </div>
            {!roster.length && <p>No households match this view.</p>}
          </div>
        )}
        {view === "Coverage" && (
          <div className="rc-content">
            <h2>Block-level house-visit coverage</h2>
            <p>
              Distinct roster households with a “Contacted” outcome ÷ households
              in the block. Repeat visits count once. No answer, declined and
              revisit requested are attempts, not completed contact. Period and
              block filters apply; search and case filters do not affect
              coverage.
            </p>
            <div className="rc-coverage">
              {blocks
                .filter((b) => !block || b.id === block)
                .map((b) => {
                  const stats = blockCoverage(b.id, days);
                  return (
                    <article key={b.id}>
                      <div>
                        <h3>{b.label}</h3>
                        <small>
                          {locations.find((l) => l.id === b.locationId)?.label}
                        </small>
                      </div>
                      <strong>{stats.percent}%</strong>
                      <progress
                        aria-label={`${b.label} household coverage`}
                        value={stats.contacted}
                        max={stats.total || 1}
                      />
                      <p>
                        {stats.contacted} / {stats.total} households contacted ·{" "}
                        {stats.attempts} attempts · {stats.remaining} not yet
                        contacted
                      </p>
                      <button
                        onClick={() => {
                          setBlock(b.id);
                          setQuery("");
                          setView("Households");
                        }}
                      >
                        Review households
                      </button>
                    </article>
                  );
                })}
            </div>
            <p className="rc-caption">
              The roster contains a small synthetic sample, not every household
              in Fengshan. Visit rounds’ legacy aggregate contact totals are
              preserved separately and are not used as this denominator.
            </p>
          </div>
        )}
        {view === "MPS" && (
          <div className="rc-content">
            <h2>MPS case tracking</h2>
            <p>
              Cases grouped by meeting date, after the case filters above.
              Meetings are derived from case records; these are not appointments
              or submissions.
            </p>
            {[
              ...new Set(
                filtered
                  .filter((c) => c.channel === "MPS")
                  .map((c) => c.mpsDate),
              ),
            ]
              .sort()
              .reverse()
              .map((date) => {
                const group = filtered.filter(
                  (c) => c.channel === "MPS" && c.mpsDate === date,
                );
                const stats = caseMetrics(group);
                return (
                  <section className="rc-meeting" key={date}>
                    <h3>Meeting · {date}</h3>
                    <p>
                      {group.length} cases · {stats.active} active ·{" "}
                      {stats.resolved} resolved / closed · {stats.overdue}{" "}
                      overdue
                    </p>
                    {group.map((c) => (
                      <button key={c.id} onClick={() => openCase(c)}>
                        {c.title}{" "}
                        <span>
                          {c.stage} · {c.urgency}
                        </span>
                      </button>
                    ))}
                  </section>
                );
              })}
            {!filtered.some((c) => c.channel === "MPS") && (
              <p>No MPS cases match this view.</p>
            )}
          </div>
        )}
        {view === "Outcomes" && (
          <div className="rc-content">
            <h2>Case resolution & workload</h2>
            <p>
              Opened-date cohort, using all active case filters. Resolved and
              closed cases count once; cancelled cases remain in the rate
              denominator. Durations use the latest resolution date.
            </p>
            <div className="rc-coverage">
              {caseChannels.map((source) => {
                const group = filtered.filter((c) => c.channel === source),
                  stats = caseMetrics(group);
                return (
                  <article key={source}>
                    <h3>{source}</h3>
                    <strong>{stats.rate}%</strong>
                    <progress
                      aria-label={`${source} case resolution rate`}
                      max={group.length || 1}
                      value={stats.resolved}
                    />
                    <p>
                      {stats.resolved} / {group.length} resolved or closed ·{" "}
                      {stats.meanDays === null
                        ? "No resolved cases"
                        : `${stats.meanDays} days mean resolution`}
                    </p>
                  </article>
                );
              })}
            </div>
            <h3>Active case age</h3>
            <div className="rc-age-bands">
              {[
                ["0–7 days", 0, 7],
                ["8–30 days", 8, 30],
                ["31+ days", 31, Infinity],
              ].map(([label, min, max]) => (
                <article key={String(label)}>
                  <strong>
                    {
                      filtered.filter((c) => {
                        const age =
                          (Date.parse(reportingDate) - Date.parse(c.openedOn)) /
                          86400000;
                        return (
                          activeCase(c) &&
                          age >= Number(min) &&
                          age <= Number(max)
                        );
                      }).length
                    }
                  </strong>
                  <span>{label}</span>
                </article>
              ))}
            </div>
            <h3>Organisation follow-through</h3>
            {organisations.map((o) => {
              const group = filtered.filter((c) => c.organisationId === o.id);
              if (!group.length) return null;
              const stats = caseMetrics(group);
              return (
                <div className="rc-org-row" key={o.id}>
                  <strong>{o.name}</strong>
                  <span>
                    {stats.active} active · {stats.overdue} overdue ·{" "}
                    {stats.resolved} resolved / closed
                  </span>
                </div>
              );
            })}
          </div>
        )}
        {view === "Map" && (
          <MapView
            items={records.filter((r) => filtered.some((c) => c.id === r.id))}
            onSelect={(r) => openCase(data.cases.find((c) => c.id === r.id)!)}
            selected={null}
          />
        )}
      </section>
      <dialog
        ref={caseDialog}
        aria-label="Resident case editor"
        className="rc-dialog"
        onClose={() => setEdit(null)}
      >
        {edit && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              finish(() => saveCase(edit, note), caseDialog.current);
            }}
          >
            <header>
              <div>
                <small>{titleId}</small>
                <h2>
                  {data.cases.some((c) => c.id === edit.id)
                    ? "Manage case"
                    : "Open a case"}
                </h2>
              </div>
              <button
                type="button"
                aria-label="Close case editor"
                onClick={() => caseDialog.current?.close()}
              >
                <X />
              </button>
            </header>
            {error && (
              <p role="alert" className="rc-error">
                {error}
              </p>
            )}
            <div className="rc-form">
              <label className="rc-wide">
                Case title
                <input
                  required
                  maxLength={120}
                  value={edit.title}
                  onChange={(e) => update("title", e.target.value)}
                />
              </label>
              <label>
                Household
                <select
                  aria-label="Case household"
                  disabled={data.cases.some((c) => c.id === edit.id)}
                  value={edit.householdId}
                  onChange={(e) => {
                    const h = data.households.find(
                      (h) => h.id === e.target.value,
                    )!;
                    setEdit({
                      ...edit,
                      householdId: h.id,
                      residentId: h.members[0].id,
                    });
                  }}
                >
                  {data.households.map((h) => (
                    <option key={h.id} value={h.id}>
                      {householdLabel(h.id)} ·{" "}
                      {blocks.find((b) => b.id === h.blockId)?.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Resident
                <select
                  aria-label="Case resident"
                  disabled={data.cases.some((c) => c.id === edit.id)}
                  value={edit.residentId}
                  onChange={(e) => update("residentId", e.target.value)}
                >
                  {data.households
                    .find((h) => h.id === edit.householdId)
                    ?.members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.id} · age {m.age}
                      </option>
                    ))}
                </select>
              </label>
              <label>
                Channel
                <select
                  aria-label="Case channel"
                  value={edit.channel}
                  onChange={(e) =>
                    update("channel", e.target.value as ResidentCase["channel"])
                  }
                >
                  {caseChannels.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </label>
              <label>
                Urgency
                <select
                  aria-label="Case urgency"
                  value={edit.urgency}
                  onChange={(e) =>
                    update("urgency", e.target.value as ResidentCase["urgency"])
                  }
                >
                  {["Routine", "Urgent", "Critical"].map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </label>
              {edit.channel === "MPS" && (
                <label>
                  MPS meeting date
                  <input
                    type="date"
                    required
                    value={edit.mpsDate}
                    onChange={(e) => update("mpsDate", e.target.value)}
                  />
                </label>
              )}
              {edit.channel === "House visit" && (
                <label>
                  Source visit round
                  <select
                    aria-label="Source visit round"
                    value={edit.sourceId}
                    onChange={(e) => update("sourceId", e.target.value)}
                  >
                    <option value="">Select a visit round</option>
                    {records
                      .filter((r) => r.category === "House visits")
                      .map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.title}
                        </option>
                      ))}
                  </select>
                </label>
              )}
              <label>
                Opened date
                <input
                  type="date"
                  required
                  readOnly={data.cases.some((c) => c.id === edit.id)}
                  value={edit.openedOn}
                  onChange={(e) => update("openedOn", e.target.value)}
                />
              </label>
              <label>
                Next follow-up
                <input
                  type="date"
                  required
                  value={edit.followUp}
                  onChange={(e) => update("followUp", e.target.value)}
                />
              </label>
              <label>
                Case owner
                <select
                  aria-label="Case owner"
                  value={edit.ownerId}
                  onChange={(e) => update("ownerId", e.target.value)}
                >
                  {people.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Responsible team
                <select
                  aria-label="Case team"
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
                Responsible organisation
                <select
                  aria-label="Case organisation"
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
                Lifecycle stage
                <select
                  aria-label="Case lifecycle"
                  value={edit.stage}
                  onChange={(e) =>
                    update("stage", e.target.value as ResidentCase["stage"])
                  }
                >
                  {caseStages.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </label>
              <label className="rc-wide">
                Case description
                <textarea
                  maxLength={3000}
                  value={edit.description}
                  onChange={(e) => update("description", e.target.value)}
                />
              </label>
              {["Resolved", "Closed"].includes(edit.stage) && (
                <>
                  <label>
                    Resolution date
                    <input
                      required
                      type="date"
                      value={edit.resolvedOn}
                      onChange={(e) => update("resolvedOn", e.target.value)}
                    />
                  </label>
                  <label className="rc-wide">
                    Resolution note
                    <textarea
                      required
                      maxLength={1500}
                      value={edit.resolution}
                      onChange={(e) => update("resolution", e.target.value)}
                    />
                  </label>
                </>
              )}
              <label className="rc-wide">
                Action note (required)
                <textarea
                  required
                  maxLength={1500}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Record the referral, follow-up, decision or reason for reopening."
                />
              </label>
            </div>
            <fieldset className="rc-links">
              <legend>Related operations</legend>
              <p>
                Link engagements, infrastructure matters or other cases.
                Existing incoming links remain maintained by their originating
                module.
              </p>
              {records
                .filter((r) => r.id !== edit.id)
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
                    {r.id} · {r.title}
                  </label>
                ))}
            </fieldset>
            <h3>Connected records</h3>
            {links
              .filter((l) => l.toId === edit.id)
              .map((l) => (
                <p key={l.id}>
                  {records.find((r) => r.id === l.fromId)?.title} · {l.kind}
                </p>
              ))}
            <h3>Case journal · {edit.history.length} actions</h3>
            <ol className="rc-journal">
              {[...edit.history].reverse().map((h) => (
                <li key={h.id}>
                  <strong>
                    {h.date} · {h.stage}
                  </strong>
                  <p>{h.note}</p>
                  {h.resolution && (
                    <p>
                      Resolution ({h.resolvedOn}): {h.resolution}
                    </p>
                  )}
                  <small>
                    {organisations.find((o) => o.id === h.organisationId)?.name}{" "}
                    · follow-up {h.followUp}
                  </small>
                </li>
              ))}
            </ol>
            <footer>
              <button
                type="button"
                className="button"
                onClick={() => caseDialog.current?.close()}
              >
                Discard changes
              </button>
              <button className="button rc-primary" type="submit">
                Save case & action
              </button>
            </footer>
          </form>
        )}
      </dialog>
      <dialog
        ref={houseDialog}
        aria-label="Household editor"
        className="rc-dialog"
        onClose={() => setHouse(null)}
      >
        {house && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              finish(() => saveHousehold(house), houseDialog.current);
            }}
          >
            <header>
              <div>
                <small>{house.id}</small>
                <h2>Household & family</h2>
              </div>
              <button
                type="button"
                aria-label="Close household editor"
                onClick={() => houseDialog.current?.close()}
              >
                <X />
              </button>
            </header>
            {error && (
              <p role="alert" className="rc-error">
                {error}
              </p>
            )}
            <label>
              Block
              <select
                aria-label="Household block"
                value={house.blockId}
                onChange={(e) =>
                  setHouse({ ...house, blockId: e.target.value })
                }
              >
                {blocks.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.label} ·{" "}
                    {locations.find((l) => l.id === b.locationId)?.label}
                  </option>
                ))}
              </select>
            </label>
            <h3>Synthetic residents</h3>
            <p>
              Identifiers only. No names, contact information or exact unit
              addresses are collected.
            </p>
            {house.members.map((m, i) => (
              <div className="rc-member" key={m.id}>
                <span>{m.id}</span>
                <label>
                  Age
                  <input
                    aria-label={`Resident ${i + 1} age`}
                    type="number"
                    min={0}
                    max={110}
                    required
                    value={m.age}
                    onChange={(e) =>
                      setHouse({
                        ...house,
                        members: house.members.map((x) =>
                          x.id === m.id
                            ? { ...x, age: Number(e.target.value) }
                            : x,
                        ),
                      })
                    }
                  />
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setHouse({
                      ...house,
                      members: house.members.filter((x) => x.id !== m.id),
                      relationships: house.relationships.filter(
                        (l) => l.fromId !== m.id && l.toId !== m.id,
                      ),
                    })
                  }
                >
                  Remove resident {i + 1}
                </button>
              </div>
            ))}
            <button
              type="button"
              className="button"
              onClick={() =>
                setHouse({
                  ...house,
                  members: [
                    ...house.members,
                    {
                      id: `${house.id}-${crypto.randomUUID().slice(0, 8)}`,
                      age: 30,
                    },
                  ],
                })
              }
            >
              Add resident
            </button>
            <h3>Family relationships</h3>
            <div className="rc-form">
              <label>
                From resident
                <select
                  aria-label="Family from"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                >
                  <option value="">Select resident</option>
                  {house.members.map((m) => (
                    <option key={m.id}>{m.id}</option>
                  ))}
                </select>
              </label>
              <label>
                Relationship
                <select
                  aria-label="Family relationship"
                  value={relation}
                  onChange={(e) =>
                    setRelation(e.target.value as FamilyLink["kind"])
                  }
                >
                  {["Parent of", "Spouse of", "Sibling of"].map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </label>
              <label>
                To resident
                <select
                  aria-label="Family to"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                >
                  <option value="">Select resident</option>
                  {house.members.map((m) => (
                    <option key={m.id}>{m.id}</option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                onClick={() =>
                  setHouse({
                    ...house,
                    relationships: [
                      ...house.relationships,
                      { fromId: from, toId: to, kind: relation },
                    ],
                  })
                }
              >
                Add family link
              </button>
            </div>
            {house.relationships.map((l, i) => (
              <p key={i}>
                {l.fromId} → {l.kind} → {l.toId}{" "}
                <button
                  type="button"
                  onClick={() =>
                    setHouse({
                      ...house,
                      relationships: house.relationships.filter(
                        (_, n) => n !== i,
                      ),
                    })
                  }
                >
                  Remove link {i + 1}
                </button>
              </p>
            ))}
            <h3>Household cases</h3>
            {data.cases
              .filter((c) => c.householdId === house.id)
              .map((c) => (
                <p key={c.id}>
                  {c.id} · {c.title} · {c.stage}
                </p>
              ))}
            <h3>Visit history</h3>
            {data.contacts
              .filter((v) => v.householdId === house.id)
              .map((v) => (
                <div className="rc-history" key={v.id}>
                  <span>
                    {v.date} ·{" "}
                    {records.find((r) => r.id === v.operationId)?.title} ·{" "}
                    {v.outcome}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      houseDialog.current?.close();
                      setError("");
                      setVisit(structuredClone(v));
                    }}
                  >
                    Edit visit outcome
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      houseDialog.current?.close();
                      openCase({
                        ...freshCase(house),
                        channel: "House visit",
                        sourceId: v.operationId,
                      });
                    }}
                  >
                    Raise visit case
                  </button>
                </div>
              ))}
            <footer>
              <button
                className="button"
                type="button"
                onClick={() => houseDialog.current?.close()}
              >
                Discard changes
              </button>
              <button className="button rc-primary" type="submit">
                Save household
              </button>
            </footer>
          </form>
        )}
      </dialog>
      <dialog
        ref={visitDialog}
        aria-label="Visit outcome editor"
        className="rc-dialog"
        onClose={() => setVisit(null)}
      >
        {visit && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              finish(
                () =>
                  data.contacts.some((v) => v.id === visit.id)
                    ? updateContact(visit)
                    : saveContact(visit),
                visitDialog.current,
              );
            }}
          >
            <header>
              <h2>Record household visit</h2>
              <button
                type="button"
                aria-label="Close visit editor"
                onClick={() => visitDialog.current?.close()}
              >
                <X />
              </button>
            </header>
            <p>
              {visit.householdId} · each household/round/date has one outcome.
            </p>
            {error && (
              <p role="alert" className="rc-error">
                {error}
              </p>
            )}
            <div className="rc-form">
              <label>
                Visit round
                <select
                  aria-label="Visit round"
                  disabled={data.contacts.some((v) => v.id === visit.id)}
                  value={visit.operationId}
                  onChange={(e) =>
                    setVisit({ ...visit, operationId: e.target.value })
                  }
                >
                  {records
                    .filter(
                      (r) =>
                        r.category === "House visits" &&
                        r.status !== "Cancelled",
                    )
                    .map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.title}
                      </option>
                    ))}
                </select>
              </label>
              <label>
                Visit date
                <input
                  type="date"
                  required
                  readOnly={data.contacts.some((v) => v.id === visit.id)}
                  value={visit.date}
                  onChange={(e) => setVisit({ ...visit, date: e.target.value })}
                />
              </label>
              <label>
                Visiting personnel
                <select
                  aria-label="Visiting personnel"
                  value={visit.personId}
                  onChange={(e) =>
                    setVisit({ ...visit, personId: e.target.value })
                  }
                >
                  {people.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Outcome
                <select
                  aria-label="Visit outcome"
                  value={visit.outcome}
                  onChange={(e) =>
                    setVisit({
                      ...visit,
                      outcome: e.target.value as VisitContact["outcome"],
                    })
                  }
                >
                  {visitOutcomes.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </label>
            </div>
            <footer>
              <button
                type="button"
                className="button"
                onClick={() => visitDialog.current?.close()}
              >
                Discard changes
              </button>
              <button type="submit" className="button rc-primary">
                Save visit outcome
              </button>
            </footer>
          </form>
        )}
      </dialog>
    </div>
  );
}
