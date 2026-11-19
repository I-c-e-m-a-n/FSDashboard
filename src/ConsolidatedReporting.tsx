import { useRef, useState } from "react";
import { Download, ArrowLeft, ArrowUpRight, Search, X } from "lucide-react";
import { records, sectors, type RecordItem } from "./data";
import { reportingLabel } from "./reporting";
import { useReporting, downloadReport, type ReportRow } from "./reportingModel";
import "./reports.css";
type Criterion = { field: string; value: string; prefix?: boolean };
export default function ConsolidatedReporting({
  initialArea,
  initialDays,
  onBack,
  onSelect,
}: {
  initialArea: string;
  initialDays: number;
  onBack: () => void;
  onSelect: (r: RecordItem) => void;
}) {
  const params = new URLSearchParams(location.hash.split("?")[1] ?? "");
  const requestedArea = params.get("area");
  const [area, setArea] = useState(
      requestedArea && ["All areas", ...sectors].includes(requestedArea)
        ? requestedArea
        : initialArea,
    ),
    [days, setDays] = useState(
      params.has("days") &&
        [0, 7, 30, 90, 365].includes(Number(params.get("days")))
        ? Number(params.get("days"))
        : initialDays,
    );
  const [datasetKey, setDatasetKey] = useState(
      params.get("dataset") ?? "operations",
    ),
    [criteria, setCriteria] = useState<Criterion[]>(
      params.get("focus") === "reached"
        ? [{ field: "Reached", value: "Yes" }]
        : params.get("focus") === "attended"
          ? [{ field: "Counted attendance", value: "Yes" }]
          : params.get("focus") === "active"
            ? [{ field: "Active", value: "Yes" }]
            : [],
    ),
    [search, setSearch] = useState(""),
    [page, setPage] = useState(1),
    [selected, setSelected] = useState<ReportRow | null>(null),
    [notice, setNotice] = useState("");
  const report = useReporting({ area, days });
  const dataset =
    report.datasets.find((d) => d.key === datasetKey) ?? report.datasets[0];
  const rows = dataset.rows.filter(
    (r) =>
      criteria.every((c) =>
        c.prefix
          ? String(r.values[c.field] ?? "").startsWith(c.value)
          : String(r.values[c.field] ?? "") === c.value,
      ) &&
      Object.values(r.values)
        .join(" ")
        .toLowerCase()
        .includes(search.trim().toLowerCase()),
  );
  const pages = Math.max(1, Math.ceil(rows.length / 12)),
    current = Math.min(page, pages),
    visible = rows.slice((current - 1) * 12, current * 12);
  const dialog = useRef<HTMLDialogElement>(null),
    table = useRef<HTMLDivElement>(null);
  function drill(key: string, conditions: Criterion[] = []) {
    setDatasetKey(key);
    setCriteria(conditions);
    setSearch("");
    setPage(1);
    requestAnimationFrame(() =>
      table.current?.scrollIntoView({ block: "start", behavior: "smooth" }),
    );
  }
  function open(row: ReportRow) {
    setSelected(row);
    dialog.current?.showModal();
  }
  function exportCurrent() {
    downloadReport(dataset, rows, { area, days });
    setNotice(
      `Exported ${rows.length} ${dataset.label.toLowerCase()} rows with the current table filters.`,
    );
  }
  function relatedDataset(field: string, value: string | number) {
    const map: Record<string, string> = {
      Household: "households",
      Resident: "residents",
      Block: "coverage",
      Team: "teams",
      "Organisation ID": "organisations",
      Person: "personnel",
      Personnel: "personnel",
      Coordinator: "personnel",
      Owner: "personnel",
      Activity: "operations",
      Round: "operations",
      Case: "cases",
      Matter: "infrastructure",
      "Source visit": "operations",
    };
    const key =
      field === "From" || field === "To"
        ? dataset.key === "family"
          ? "residents"
          : "operations"
        : map[field];
    return key &&
      report.datasets
        .find((d) => d.key === key)
        ?.rows.some((r) => r.id === String(value))
      ? key
      : null;
  }
  const metrics = report.metrics;
  const monthCounts = report.datasets
    .find((d) => d.key === "resolutions")!
    .rows.reduce<Record<string, number>>((acc, r) => {
      const month = String(r.values.Resolved).slice(0, 7);
      acc[month] = (acc[month] ?? 0) + 1;
      return acc;
    }, {});
  const progress = report.datasets
    .find((d) => d.key === "infrastructure")!
    .rows.reduce<Record<string, number>>((acc, r) => {
      const stage = String(r.values.Stage);
      acc[stage] = (acc[stage] ?? 0) + 1;
      return acc;
    }, {});
  return (
    <div className="reports-page">
      <div className="page-heading">
        <div>
          <div className="eyebrow">ONE WORKSPACE · CONNECTED EVIDENCE</div>
          <h1>
            Consolidated reports<span>.</span>
          </h1>
          <p>Follow every total to the records behind it.</p>
        </div>
        <button className="button" onClick={onBack}>
          <ArrowLeft size={16} />
          Operational explorer
        </button>
      </div>
      <button
        className="button"
        onClick={() => {
          const summary = report.datasets.find((d) => d.key === "summary")!;
          downloadReport(summary, summary.rows, { area, days });
          setNotice(
            "Exported consolidated summary for the selected area and period.",
          );
        }}
      >
        <Download size={16} />
        Export consolidated summary
      </button>
      <div className="report-context">
        <strong>Synthetic data · {reportingLabel} SGT</strong>
        <p>
          Reports use the area and period below, independently of operational
          layer, status and text filters. Each dataset states its date basis.
          Current directories are not historical snapshots.
        </p>
      </div>
      <div className="report-controls">
        <label>
          Reporting area
          <select
            aria-label="Reporting area"
            value={area}
            onChange={(e) => {
              setArea(e.target.value);
              setPage(1);
            }}
          >
            {["All areas", ...sectors].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <label>
          Reporting window
          <select
            aria-label="Reporting window"
            value={days}
            onChange={(e) => {
              setDays(Number(e.target.value));
              setPage(1);
            }}
          >
            {[
              [7, "Last 7 days"],
              [30, "Last 30 days"],
              [90, "Last 90 days"],
              [365, "Last 365 days"],
              [0, "All dates, including schedules"],
            ].map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </label>
        <span>
          Table search and drill-down filters do not alter the summary cards.
        </span>
      </div>
      <section className="report-kpis" aria-label="Consolidated statistics">
        <button onClick={() => drill("resolutions")}>
          <span>Resolved / closed cases</span>
          <strong data-testid="report-resolutions">
            {metrics.resolutions}
          </strong>
          <small>{metrics.closed} closed · latest resolution date</small>
          <ArrowUpRight size={17} />
        </button>
        <button
          onClick={() =>
            drill("deployments", [
              { field: "Counted attendance", value: "Yes" },
            ])
          }
        >
          <span>Recorded personnel attendance</span>
          <strong data-testid="report-attendances">
            {metrics.attendances}
          </strong>
          <small>
            {metrics.participants} distinct personnel · activity date
          </small>
          <ArrowUpRight size={17} />
        </button>
        <button
          onClick={() =>
            drill("households", [{ field: "Reached", value: "Yes" }])
          }
        >
          <span>Households reached</span>
          <strong data-testid="report-reached">
            {metrics.reached}
            <em> / {metrics.households}</em>
          </strong>
          <small>Distinct households · contact date</small>
          <ArrowUpRight size={17} />
        </button>
        <button
          onClick={() =>
            drill("infrastructure", [{ field: "Active", value: "Yes" }])
          }
        >
          <span>Active infrastructure</span>
          <strong>{metrics.activeInfrastructure}</strong>
          <small>
            {metrics.meanProgress ?? "—"}% mean estimated progress · reported
            cohort
          </small>
          <ArrowUpRight size={17} />
        </button>
        <button
          onClick={() =>
            drill("engagements", [
              { field: "Measure", value: "Participations" },
            ])
          }
        >
          <span>Community engagements</span>
          <strong>{metrics.engagements}</strong>
          <small>
            {metrics.actualParticipations} recorded participations · activity
            date
          </small>
          <ArrowUpRight size={17} />
        </button>
        <button onClick={() => drill("visits")}>
          <span>Household visit outcomes</span>
          <strong>
            {report.datasets.find((d) => d.key === "visits")!.rows.length}
          </strong>
          <small>Includes unsuccessful attempts · contact date</small>
          <ArrowUpRight size={17} />
        </button>
      </section>
      <div className="report-charts">
        <section>
          <h2>Organisation workload</h2>
          <p>
            Active cases and infrastructure in the opened/reported-date cohort.
            Separate operational records, not unique neighbourhood issues.
          </p>
          {report.organisationWorkload
            .filter((o) => o.cases + o.infrastructure > 0)
            .map((o) => (
              <button
                className="report-bar"
                key={o.id}
                onClick={() =>
                  drill("operations", [
                    { field: "Organisation ID", value: o.id },
                    { field: "Workload record", value: "Yes" },
                    { field: "Active", value: "Yes" },
                  ])
                }
              >
                <span>
                  {o.name}
                  <small>
                    {o.cases} cases · {o.infrastructure} infrastructure
                  </small>
                </span>
                <meter
                  aria-label={`${o.name} active workload`}
                  min={0}
                  max={Math.max(
                    1,
                    ...report.organisationWorkload.map(
                      (x) => x.cases + x.infrastructure,
                    ),
                  )}
                  value={o.cases + o.infrastructure}
                />
                <b>{o.cases + o.infrastructure}</b>
              </button>
            ))}
          {!report.organisationWorkload.some(
            (o) => o.cases + o.infrastructure > 0,
          ) && <p>No active workload in this scope.</p>}
        </section>
        <section>
          <h2>Case resolution flow</h2>
          <p>
            Months with currently resolved/closed cases in the selected window.
            Reopened cases are excluded; earlier actions remain in Case actions.
          </p>
          {Object.entries(monthCounts)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([month, count]) => (
              <button
                className="report-bar"
                key={month}
                onClick={() =>
                  drill("resolutions", [
                    { field: "Resolved", value: month, prefix: true },
                  ])
                }
              >
                <span>{month}</span>
                <meter
                  aria-label={`${month} resolutions`}
                  min={0}
                  max={Math.max(1, ...Object.values(monthCounts))}
                  value={count}
                />
                <b>{count}</b>
              </button>
            ))}
          {!Object.keys(monthCounts).length && (
            <p>No resolved/closed cases in this window.</p>
          )}
          <h3>Infrastructure stages</h3>
          <div className="report-stage-list">
            {Object.entries(progress).map(([name, count]) => (
              <button
                key={name}
                onClick={() =>
                  drill("infrastructure", [{ field: "Stage", value: name }])
                }
              >
                {name}
                <strong>{count}</strong>
              </button>
            ))}
          </div>
        </section>
      </div>
      <section className="report-coverage">
        <div>
          <h2>House-visit coverage by block</h2>
          <p>
            Successful distinct household contacts / current synthetic roster.
            Repeated contacts do not increase coverage; legacy aggregate round
            totals are a separate measure.
          </p>
        </div>
        <div className="report-blocks">
          {report.coverage.map((r) => (
            <button
              key={r.id}
              onClick={() =>
                drill("households", [{ field: "Block", value: r.id }])
              }
            >
              <span>{r.values.Block}</span>
              <strong>{r.values["Coverage %"]}%</strong>
              <progress
                aria-label={`${r.values.Block} coverage`}
                value={Number(r.values.Contacted)}
                max={Number(r.values.Households) || 1}
              />
              <small>
                {r.values.Contacted} / {r.values.Households} households ·{" "}
                {r.values.Attempts} attempts
              </small>
            </button>
          ))}
        </div>
      </section>
      <div className="report-table-panel" ref={table}>
        <div className="report-table-tools">
          <label>
            Dataset
            <select
              aria-label="Reporting dataset"
              value={dataset.key}
              onChange={(e) => {
                setDatasetKey(e.target.value);
                setCriteria([]);
                setSearch("");
                setPage(1);
              }}
            >
              {report.datasets.map((d) => (
                <option key={d.key} value={d.key}>
                  {d.label} ({d.rows.length})
                </option>
              ))}
            </select>
          </label>
          <label>
            Search this table
            <input
              aria-label="Search report rows"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search any field…"
            />
          </label>
          <button className="button" onClick={exportCurrent}>
            <Download size={16} />
            Export {rows.length} rows
          </button>
        </div>
        <h2>{dataset.label}</h2>
        <p className="report-basis">{dataset.basis}</p>
        <div className="report-selection">
          <strong data-testid="report-row-count">{rows.length} rows</strong>
          {criteria.map((c, i) => (
            <span key={i}>
              {c.field} {c.prefix ? "starts with" : "="} {c.value}
            </span>
          ))}
          {(criteria.length > 0 || search) && (
            <button
              onClick={() => {
                setCriteria([]);
                setSearch("");
                setPage(1);
              }}
            >
              Clear table filters
            </button>
          )}
        </div>
        {notice && <p role="status">{notice}</p>}
        <div
          className="report-scroll"
          tabIndex={0}
          aria-label={`${dataset.label} table`}
        >
          <table>
            <thead>
              <tr>
                {dataset.columns.slice(0, 6).map((c) => (
                  <th key={c} scope="col">
                    {c}
                  </th>
                ))}
                <th scope="col">Details</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((r) => (
                <tr key={r.id}>
                  {dataset.columns.slice(0, 6).map((c) => (
                    <td key={c}>{r.values[c] ?? "—"}</td>
                  ))}
                  <td>
                    <button
                      onClick={() => open(r)}
                      aria-label={`Inspect ${r.id}`}
                    >
                      Inspect <ArrowUpRight size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!rows.length && (
          <p className="report-empty">No rows match this report selection.</p>
        )}
        <div className="report-pagination">
          <span>
            Page {current} of {pages} · inspect a row for all fields; exports
            include every matching row.
          </span>
          <button
            aria-label="Previous report page"
            disabled={current === 1}
            onClick={() => setPage(current - 1)}
          >
            Previous
          </button>
          <button
            aria-label="Next report page"
            disabled={current === pages}
            onClick={() => setPage(current + 1)}
          >
            Next
          </button>
        </div>
      </div>
      <dialog
        ref={dialog}
        className="report-dialog"
        aria-label="Report row details"
        onClose={() => setSelected(null)}
      >
        {selected && (
          <>
            <header>
              <h2>{dataset.label} · record detail</h2>
              <button
                aria-label="Close report details"
                onClick={() => dialog.current?.close()}
              >
                <X />
              </button>
            </header>
            <dl>
              {dataset.columns.map((c) => (
                <div key={c}>
                  <dt>{c}</dt>
                  <dd>
                    {relatedDataset(c, selected.values[c]) ? (
                      <button
                        className="report-reference"
                        onClick={() => {
                          const target = relatedDataset(c, selected.values[c])!;
                          dialog.current?.close();
                          drill(target, [
                            { field: "ID", value: String(selected.values[c]) },
                          ]);
                        }}
                      >
                        {selected.values[c]} ↗
                      </button>
                    ) : (
                      (selected.values[c] ?? "—")
                    )}
                  </dd>
                </div>
              ))}
            </dl>
            <div className="report-detail-actions">
              {selected.operationId &&
                records.some((r) => r.id === selected.operationId) && (
                  <button
                    className="button"
                    onClick={() => {
                      dialog.current?.close();
                      onSelect(
                        records.find((r) => r.id === selected.operationId)!,
                      );
                    }}
                  >
                    Open operational record
                  </button>
                )}
              {selected.href && (
                <a className="button" href={selected.href}>
                  Open source workspace <ArrowUpRight size={16} />
                </a>
              )}
            </div>
          </>
        )}
      </dialog>
    </div>
  );
}
