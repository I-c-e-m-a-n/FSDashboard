import { useReporting } from "./reportingModel";
import "./reports.css";
export default function OperationalHighlights({
  area,
  days,
}: {
  area: string;
  days: number;
}) {
  const { metrics } = useReporting({ area, days });
  const url = (dataset: string, focus = "") =>
    `#explorer/reports?dataset=${dataset}&area=${encodeURIComponent(area)}&days=${days}&focus=${focus}`;
  return (
    <section
      className="workspace-highlights"
      aria-label="Workspace reporting highlights"
    >
      <div>
        <h2>Across the workspace</h2>
        <p>
          {area} · {days ? `last ${days} days` : "all dates"} · independent of
          map search and layers. Each report explains its date basis.
        </p>
      </div>
      <div className="highlight-grid">
        <a href={url("resolutions")}>
          <span>Cases resolved / closed</span>
          <strong>{metrics.resolutions}</strong>
          <small>View resolution records →</small>
        </a>
        <a href={url("households", "reached")}>
          <span>Households reached</span>
          <strong>
            {metrics.reached} <em>/ {metrics.households}</em>
          </strong>
          <small>Inspect contacted households →</small>
        </a>
        <a href={url("deployments", "attended")}>
          <span>Personnel attendance</span>
          <strong>{metrics.attendances}</strong>
          <small>{metrics.participants} distinct personnel →</small>
        </a>
        <a href={url("infrastructure", "active")}>
          <span>Active infrastructure</span>
          <strong>{metrics.activeInfrastructure}</strong>
          <small>
            {metrics.meanProgress ?? "—"}% estimated mean progress →
          </small>
        </a>
      </div>
    </section>
  );
}
