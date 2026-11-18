import { useRef, useState, useEffect } from "react";
import {
  CalendarDays,
  Plus,
  MapPin,
  Search,
  X,
  ImagePlus,
  ArrowRight,
  Users,
  Info,
} from "lucide-react";
import {
  engagementTypes,
  personnel,
  useEngagementStore,
  saveEngagement,
  freshEngagement,
  storageWarning,
  type Engagement,
  type EngagementStage,
} from "./engagementStore";
import { locations, records, formatDate } from "./data";
import MapView from "./MapView";
import "./engagement.css";
export default function EngagementManagement() {
  const events = useEngagementStore();
  const [view, setView] = useState("Schedule"),
    [query, setQuery] = useState(""),
    [type, setType] = useState("All types"),
    [stage, setStage] = useState("All stages"),
    [area, setArea] = useState("All areas"),
    [month, setMonth] = useState(""),
    [edit, setEdit] = useState<Engagement | null>(null),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (edit) dialog.current?.showModal();
  }, [edit?.id]);
  const filtered = events
    .filter(
      (e) =>
        (type === "All types" || e.type === type) &&
        (stage === "All stages" || e.stage === stage) &&
        (area === "All areas" ||
          locations.find((l) => l.id === e.locationId)?.sector === area) &&
        (!month || e.date.startsWith(month)) &&
        `${e.title} ${e.type} ${e.id}`
          .toLowerCase()
          .includes(query.trim().toLowerCase()),
    )
    .sort(
      (a, b) => a.date.localeCompare(b.date) || a.start.localeCompare(b.start),
    );
  function open(e: Engagement) {
    setError("");
    setEdit(structuredClone(e));
  }
  function update<K extends keyof Engagement>(key: K, value: Engagement[K]) {
    setEdit((e) => (e ? { ...e, [key]: value } : e));
  }
  async function attach(files: FileList | null) {
    if (!files || !edit) return;
    setBusy(true);
    setError("");
    try {
      if (files.length + edit.media.length > 3)
        throw Error("Attach up to three images per engagement.");
      const added: Engagement["media"] = [];
      for (const file of Array.from(files)) {
        if (
          !["image/png", "image/jpeg", "image/webp"].includes(file.type) ||
          file.size > 2 * 1024 * 1024
        )
          throw Error("Use PNG, JPEG or WebP images up to 2 MB each.");
        const bitmap = await createImageBitmap(file);
        const scale = Math.min(1, 1200 / Math.max(bitmap.width, bitmap.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(bitmap.width * scale));
        canvas.height = Math.max(1, Math.round(bitmap.height * scale));
        canvas
          .getContext("2d")!
          .drawImage(bitmap, 0, 0, canvas.width, canvas.height);
        bitmap.close();
        added.push({
          id: crypto.randomUUID(),
          name: file.name,
          data: canvas.toDataURL("image/jpeg", 0.8),
        });
      }
      setEdit((current) =>
        current?.id === edit.id
          ? { ...current, media: [...current.media, ...added] }
          : current,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to read that image.");
    } finally {
      setBusy(false);
    }
  }
  function save(event: React.FormEvent) {
    event.preventDefault();
    if (!edit) return;
    try {
      saveEngagement({ ...edit, title: edit.title.trim() });
      setNotice(
        "Engagement saved in this browser. All tabs use the updated record.",
      );
      dialog.current?.close();
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return (
    <div className="engagement-page">
      <div className="page-heading">
        <div>
          <div className="eyebrow">PLAN. CONNECT. FOLLOW THROUGH.</div>
          <h1>
            Engagement management<span>.</span>
          </h1>
          <p>
            A shared workspace for community moments and neighbourhood outreach.
          </p>
        </div>
        <button
          className="button create-event"
          onClick={() => open(freshEngagement())}
        >
          <Plus size={17} />
          New engagement
        </button>
      </div>
      <div className="demo-notice">
        <Info size={16} />
        <span>
          <strong>Local MVP workspace.</strong> Use synthetic information and
          images only. Changes stay in this browser, are not shared with
          colleagues, and can be lost when browser data is cleared. Times are
          SGT.
        </span>
      </div>
      {storageWarning && <p role="status">{storageWarning}</p>}
      <p className="save-notice" role="status">
        {notice}
      </p>
      <section className="engagement-summary" aria-label="Engagement summary">
        {[
          ["In this view", filtered.length],
          [
            "Planned",
            filtered.filter(
              (e) => e.stage === "Draft" || e.stage === "Scheduled",
            ).length,
          ],
          [
            "In progress",
            filtered.filter((e) => e.stage === "In progress").length,
          ],
          ["Completed", filtered.filter((e) => e.stage === "Completed").length],
        ].map(([label, value]) => (
          <div key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </section>
      <section className="panel engagement-workspace">
        <div className="engagement-toolbar">
          <div
            className="engagement-views"
            role="group"
            aria-label="Engagement view"
          >
            {["Schedule", "Board", "Map"].map((v) => (
              <button
                key={v}
                aria-pressed={view === v}
                onClick={() => setView(v)}
              >
                {v === "Schedule" ? (
                  <CalendarDays size={16} />
                ) : v === "Map" ? (
                  <MapPin size={16} />
                ) : (
                  <Users size={16} />
                )}{" "}
                {v}
              </button>
            ))}
          </div>
          <label className="engagement-search">
            <Search size={16} />
            <input
              aria-label="Search engagements"
              placeholder="Search engagement or reference…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
        </div>
        <div className="engagement-filters">
          <select
            aria-label="Engagement type"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option>All types</option>
            {engagementTypes.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
          <select
            aria-label="Engagement stage"
            value={stage}
            onChange={(e) => setStage(e.target.value)}
          >
            <option>All stages</option>
            {[
              "Draft",
              "Scheduled",
              "In progress",
              "Completed",
              "Cancelled",
            ].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <select
            aria-label="Engagement area"
            value={area}
            onChange={(e) => setArea(e.target.value)}
          >
            {["All areas", "North", "Central", "South"].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <label>
            Month{" "}
            <input
              type="month"
              aria-label="Engagement month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
            />
          </label>
          <button
            className="text-button"
            onClick={() => {
              setType("All types");
              setStage("All stages");
              setArea("All areas");
              setMonth("");
              setQuery("");
            }}
          >
            Reset filters
          </button>
        </div>
        {view === "Map" ? (
          <>
            <MapView
              items={filtered.map((e) => records.find((r) => r.id === e.id)!)}
              selected={null}
              onSelect={(r) => open(events.find((e) => e.id === r.id)!)}
            />
            <div className="analysis-footnote">
              Approximate synthetic locations. Select a marker or use the
              schedule to edit its engagement.
            </div>
          </>
        ) : view === "Board" ? (
          <div className="engagement-board">
            {(
              [
                "Draft",
                "Scheduled",
                "In progress",
                "Completed",
                "Cancelled",
              ] as EngagementStage[]
            ).map((s) => (
              <section key={s}>
                <h2>
                  {s}{" "}
                  <span>{filtered.filter((e) => e.stage === s).length}</span>
                </h2>
                {filtered
                  .filter((e) => e.stage === s)
                  .map((e) => (
                    <button
                      className="board-event"
                      key={e.id}
                      onClick={() => open(e)}
                    >
                      <small>{e.type}</small>
                      <strong>{e.title}</strong>
                      <span>
                        {formatDate(e.date)} {e.date.slice(0, 4)} · {e.start}
                      </span>
                    </button>
                  ))}
                {!filtered.some((e) => e.stage === s) && <p>No engagements</p>}
              </section>
            ))}
          </div>
        ) : (
          <div className="schedule-list">
            {filtered.map((e) => (
              <button
                className="schedule-event"
                key={e.id}
                onClick={() => open(e)}
              >
                <span className="date-tile">
                  <b>{e.date.slice(8)}</b>
                  <span>
                    {formatDate(e.date).split(" ").slice(1).join(" ")}{" "}
                    {e.date.slice(0, 4)}
                  </span>
                </span>
                <span className="event-title">
                  <small>{e.type}</small>
                  <strong>{e.title}</strong>
                  <span>
                    {locations.find((l) => l.id === e.locationId)?.label} ·{" "}
                    {personnel.find((p) => p.id === e.personId)?.name}
                  </span>
                </span>
                <span className="event-time">
                  {e.start}–{e.end}
                  <small>SGT · {e.media.length} images</small>
                </span>
                <span className="state-tag">{e.stage}</span>
                <ArrowRight size={17} />
              </button>
            ))}
          </div>
        )}
        {!filtered.length && (
          <div className="explorer-empty">
            <CalendarDays size={30} />
            <h3>No engagements in this view</h3>
            <p>
              Adjust the filters or create a synthetic engagement to get
              started.
            </p>
          </div>
        )}
      </section>
      <div className="explorer-disclosure">
        <Info size={14} />
        <span>
          House visits share the existing visit records; other activities share
          engagement records. Planned attendance is separate from actual counts.
          Use “All dates” on Overview or Data Explorer to include future
          schedules beyond the historical snapshot.
        </span>
      </div>
      <dialog
        ref={dialog}
        aria-label="Engagement editor"
        onClose={() => setEdit(null)}
      >
        {edit && (
          <form onSubmit={save}>
            <div className="dialog-heading">
              <span className="eyebrow">
                {events.some((e) => e.id === edit.id)
                  ? "MANAGE ENGAGEMENT"
                  : "NEW ENGAGEMENT"}{" "}
                · SYNTHETIC ONLY
              </span>
              <button
                type="button"
                className="icon-button"
                aria-label="Close engagement editor"
                onClick={() => dialog.current?.close()}
              >
                <X />
              </button>
            </div>
            <h2>{edit.title || "Plan a community engagement"}</h2>
            <div className="event-form">
              <label className="full-field">
                Title
                <input
                  required
                  maxLength={120}
                  value={edit.title}
                  onChange={(e) => update("title", e.target.value)}
                />
              </label>
              <label>
                Type
                <select
                  aria-label="Type"
                  value={edit.type}
                  onChange={(e) => update("type", e.target.value)}
                >
                  {engagementTypes.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </label>
              <label>
                Lifecycle stage
                <select
                  aria-label="Lifecycle stage"
                  value={edit.stage}
                  onChange={(e) =>
                    update("stage", e.target.value as EngagementStage)
                  }
                >
                  {[
                    "Draft",
                    "Scheduled",
                    "In progress",
                    "Completed",
                    "Cancelled",
                  ].map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </label>
              <label>
                Date
                <input
                  type="date"
                  required
                  value={edit.date}
                  onChange={(e) => update("date", e.target.value)}
                />
              </label>
              <div className="time-fields">
                <label>
                  Start (SGT)
                  <input
                    type="time"
                    required
                    value={edit.start}
                    onChange={(e) => update("start", e.target.value)}
                  />
                </label>
                <label>
                  End (SGT)
                  <input
                    type="time"
                    required
                    value={edit.end}
                    onChange={(e) => update("end", e.target.value)}
                  />
                </label>
              </div>
              <label className="full-field">
                Location
                <select
                  aria-label="Location"
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
              <label className="full-field">
                Coordinator
                <select
                  aria-label="Coordinator"
                  value={edit.personId}
                  onChange={(e) => update("personId", e.target.value)}
                >
                  {personnel.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} · {p.teamId}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Planned{" "}
                {edit.type === "House visit"
                  ? "household contacts"
                  : "participants"}
                <input
                  type="number"
                  min="0"
                  max="10000"
                  required
                  value={edit.expected}
                  onChange={(e) => update("expected", Number(e.target.value))}
                />
              </label>
              <label>
                Actual{" "}
                {edit.type === "House visit"
                  ? "household contacts"
                  : "participants"}
                <input
                  type="number"
                  min="0"
                  max="10000"
                  required
                  value={edit.actual}
                  onChange={(e) => update("actual", Number(e.target.value))}
                />
              </label>
              <label className="full-field">
                Notes and outcomes
                <textarea
                  rows={3}
                  maxLength={3000}
                  value={edit.notes}
                  onChange={(e) => update("notes", e.target.value)}
                />
              </label>
            </div>
            <fieldset className="event-links">
              <legend>Linked cases and infrastructure matters</legend>
              <p>
                Link existing records without creating duplicate cases. Links
                describe an association, not necessarily the origin of a case.
              </p>
              {records
                .filter((r) =>
                  ["Case management", "Infrastructure"].includes(r.category),
                )
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
            <div className="attachment-heading">
              <h3>Activity media</h3>
              <label className="button">
                <ImagePlus size={16} />
                Add images
                <input
                  className="sr-only"
                  type="file"
                  aria-label="Add synthetic images"
                  accept="image/png,image/jpeg,image/webp"
                  multiple
                  disabled={busy}
                  onChange={(e) => {
                    void attach(e.target.files);
                    e.target.value = "";
                  }}
                />
              </label>
            </div>
            <p className="attachment-help">
              Up to 3 PNG, JPEG or WebP images, 2 MB each. Images are resized
              and metadata stripped; stored only in this browser. Never upload
              real people or personal records.
            </p>
            <div className="event-media">
              {edit.media.map((m) => (
                <figure key={m.id}>
                  <img src={m.data} alt={m.name} />
                  <figcaption>{m.name}</figcaption>
                  <button
                    type="button"
                    aria-label={`Remove ${m.name}`}
                    onClick={() =>
                      update(
                        "media",
                        edit.media.filter((x) => x.id !== m.id),
                      )
                    }
                  >
                    <X size={14} />
                  </button>
                </figure>
              ))}
            </div>
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <div className="event-actions">
              <button
                type="button"
                className="button"
                onClick={() => dialog.current?.close()}
              >
                Discard changes
              </button>
              <button className="button create-event" disabled={busy}>
                {busy ? "Processing images…" : "Save engagement"}
              </button>
            </div>
          </form>
        )}
      </dialog>
    </div>
  );
}
