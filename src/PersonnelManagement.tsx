import { useEffect, useState } from "react";
import { records, teams } from "./data";
import "./personnel.css";
type Person = {
  id: string;
  age: number;
  sex: string;
  race: string;
  kind: string;
  stage: string;
  team: string;
  awards: string[];
  training: string[];
  deployments: { recordId: string; status: string }[];
};
const key = "fengshan.personnel.v1";
const stages = ["Prospect", "Onboarding", "Active", "Inactive"];
const seed: Person[] = Array.from({ length: 18 }, (_, i) => ({
  id: `SYN-${String(i + 1).padStart(3, "0")}`,
  age: 22 + ((i * 7) % 53),
  sex: ["Female", "Male", "Not stated"][i % 3],
  race: ["Chinese", "Malay", "Indian", "Other", "Not stated"][i % 5],
  kind: i % 3 ? "Regular" : "Ad-hoc",
  stage: stages[i % 7 === 0 ? 0 : i % 7 === 1 ? 1 : 2],
  team: teams[i % teams.length].id,
  awards: i % 5 === 0 ? ["Party Award · 2026"] : [],
  training: i % 2 ? ["Community first aid · Completed · 2026"] : [],
  deployments:
    i % 7 > 1
      ? [
          {
            recordId: records[i % records.length].id,
            status: i % 2 ? "Attended" : "Assigned",
          },
        ]
      : [],
}));
function load() {
  try {
    const data = JSON.parse(localStorage.getItem(key) || "null");
    if (!data) return seed;
    if (
      !Array.isArray(data) ||
      data.length > 200 ||
      data.some(
        (p) =>
          !/^SYN-[\w-]+$/.test(p.id) ||
          !Number.isInteger(p.age) ||
          p.age < 18 ||
          p.age > 100 ||
          !stages.includes(p.stage) ||
          !teams.some((t) => t.id === p.team) ||
          !Array.isArray(p.awards) ||
          !Array.isArray(p.training) ||
          !Array.isArray(p.deployments),
      )
    )
      throw Error();
    return data as Person[];
  } catch {
    return seed;
  }
}
export default function PersonnelManagement() {
  const [people, setPeople] = useState<Person[]>(load),
    [query, setQuery] = useState(""),
    [stage, setStage] = useState("All"),
    [kind, setKind] = useState("All"),
    [edit, setEdit] = useState<Person | null>(null),
    [message, setMessage] = useState(""),
    [record, setRecord] = useState(records[0].id),
    [attendance, setAttendance] = useState("Assigned"),
    [award, setAward] = useState("Party Award"),
    [course, setCourse] = useState("Community first aid"),
    [courseStatus, setCourseStatus] = useState("Planned");
  useEffect(() => {
    if (edit) document.getElementById("personnel-profile")?.scrollIntoView({block:"start"});
  }, [edit?.id]);
  const selected = people.filter(
    (p) =>
      (stage === "All" || p.stage === stage) &&
      (kind === "All" || p.kind === kind) &&
      `${p.id} ${teams.find((t) => t.id === p.team)?.name}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  function save() {
    if (!edit) return;
    if (edit.age < 18 || edit.age > 100 || !Number.isInteger(edit.age)) {
      setMessage("Age must be a whole number between 18 and 100.");
      return;
    }
    const next = people.some((p) => p.id === edit.id)
      ? people.map((p) => (p.id === edit.id ? edit : p))
      : [...people, edit];
    try {
      if (next.length > 200) throw Error();
      localStorage.setItem(key, JSON.stringify(next));
      setPeople(next);
      setEdit(null);
      setMessage("Synthetic profile saved in this browser.");
    } catch {
      setMessage(
        "Unable to save. Browser storage is unavailable or the 200-profile limit was reached. Your edits remain open.",
      );
    }
  }
  function change<K extends keyof Person>(k: K, v: Person[K]) {
    setEdit((p) => (p ? { ...p, [k]: v } : p));
  }
  const attended = selected
    .flatMap((p) => p.deployments)
    .filter((d) => d.status === "Attended").length;
  return (
    <div className="personnel">
      <div className="page-heading">
        <div>
          <div className="eyebrow">PEOPLE, PARTICIPATION & DEVELOPMENT</div>
          <h1>Personnel management.</h1>
          <p>Plan capacity. Support development. Recognise contribution.</p>
        </div>
        <button
          className="button"
          onClick={() => {
            setMessage("");
            setEdit({
              ...seed[0],
              id: `SYN-${crypto.randomUUID()}`,
              stage: "Prospect",
              awards: [],
              training: [],
              deployments: [],
            });
          }}
        >
          Add synthetic member
        </button>
      </div>
      <p className="personnel-notice">
        Public demonstration · Non-identifying synthetic profiles only. Changes
        stay in this browser. Ages are as of 17 Nov 2026; no birth dates or
        contact details are collected.
      </p>
      {message && <p role="status">{message}</p>}
      <div className="personnel-stats">
        {[
          ["Members in view", selected.length],
          [
            "Active members",
            selected.filter((p) => p.stage === "Active").length,
          ],
          ["Recorded attendances", attended],
          [
            "Recruitment pipeline",
            selected.filter((p) => ["Prospect", "Onboarding"].includes(p.stage))
              .length,
          ],
        ].map(([label, value]) => (
          <article key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </article>
        ))}
      </div>
      <div className="personnel-panel">
        <div className="personnel-filters">
          <label>
            Search directory
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Synthetic ID or team"
            />
          </label>
          <label>
            Membership stage
            <select value={stage} onChange={(e) => setStage(e.target.value)}>
              {["All", ...stages].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          <label>
            Personnel classification
            <select value={kind} onChange={(e) => setKind(e.target.value)}>
              {["All", "Regular", "Ad-hoc"].map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
        </div>
        <h2>Workforce composition</h2>
        <p>
          All charts reflect the filtered directory. Demographics are
          descriptive and do not determine deployment eligibility.
        </p>
        <div className="personnel-charts">
          {[
            ["Age distribution", ["18–29", "30–44", "45–59", "60+"]],
            ["Sex", ["Female", "Male", "Not stated"]],
            ["Race", ["Chinese", "Malay", "Indian", "Other", "Not stated"]],
          ].map(([title, labels]) => (
            <section key={title as string}>
              <h3>{title}</h3>
              {(labels as string[]).map((label, i) => {
                const n = selected.filter((p) =>
                  title === "Age distribution"
                    ? i === 0
                      ? p.age < 30
                      : i === 1
                        ? p.age >= 30 && p.age < 45
                        : i === 2
                          ? p.age >= 45 && p.age < 60
                          : p.age >= 60
                    : title === "Sex"
                      ? p.sex === label
                      : p.race === label,
                ).length;
                return (
                  <div className="personnel-bar" key={label}>
                    <span>{label}</span>
                    <meter
                      min={0}
                      max={selected.length || 1}
                      value={n}
                      aria-label={`${title}: ${label}`}
                    />
                    <b>{n}</b>
                  </div>
                );
              })}
            </section>
          ))}
        </div>
        <h2>Member directory</h2>
        <div className="personnel-directory">
          {selected.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                setMessage("");
                setEdit(structuredClone(p));
              }}
            >
              <strong>{p.id}</strong>
              <span>
                {p.kind} · {p.stage}
              </span>
              <span>{teams.find((t) => t.id === p.team)?.name}</span>
              <small>
                {p.deployments.length} deployments · {p.training.length}{" "}
                learning records · {p.awards.length} awards
              </small>
            </button>
          ))}
        </div>
        {!selected.length && <p>No matching members.</p>}
      </div>
      {edit && (
        <div className="personnel-panel" id="personnel-profile" aria-label="Personnel profile">
          <h2>Profile · {edit.id}</h2>
          <p>
            Use synthetic details only. Save applies all profile changes
            together.
          </p>
          <div className="personnel-filters">
            <label>
              Age
              <input
                type="number"
                min="18"
                max="100"
                value={edit.age}
                onChange={(e) => change("age", Number(e.target.value))}
              />
            </label>
            {(
              [
                ["sex", ["Female", "Male", "Not stated"]],
                ["race", ["Chinese", "Malay", "Indian", "Other", "Not stated"]],
                ["kind", ["Regular", "Ad-hoc"]],
                ["stage", stages],
              ] as const
            ).map(([field, values]) => (
              <label key={field}>
                {field}
                <select
                  value={edit[field]}
                  onChange={(e) => change(field, e.target.value)}
                >
                  {values.map((v) => (
                    <option key={v}>{v}</option>
                  ))}
                </select>
              </label>
            ))}
            <label>
              Team
              <select
                value={edit.team}
                onChange={(e) => change("team", e.target.value)}
              >
                {teams.map((t) => (
                  <option value={t.id} key={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <h3>Deployments & attendance</h3>
          <p>
            References use the shared operational records, including new
            engagements and infrastructure matters. Attendance counts are
            individual participation, not resident contacts.
          </p>
          <div className="personnel-filters">
            <label>
              Operational activity
              <select
                value={record}
                onChange={(e) => setRecord(e.target.value)}
              >
                {records.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.id} · {r.title}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Attendance
              <select
                value={attendance}
                onChange={(e) => setAttendance(e.target.value)}
              >
                {["Assigned", "Attended", "Absent", "Excused"].map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </label>
            <button
              className="button"
              onClick={() =>
                change("deployments", [
                  ...edit.deployments.filter((d) => d.recordId !== record),
                  { recordId: record, status: attendance },
                ])
              }
            >
              Set deployment
            </button>
          </div>
          {edit.deployments.map((d) => (
            <p key={d.recordId}>
              {records.find((r) => r.id === d.recordId)?.title || d.recordId} ·{" "}
              {d.status}{" "}
              <button
                onClick={() =>
                  change(
                    "deployments",
                    edit.deployments.filter((x) => x.recordId !== d.recordId),
                  )
                }
              >
                Remove deployment
              </button>
            </p>
          ))}
          <h3>Recognition</h3>
          <label>
            Award
            <select aria-label="Award" value={award} onChange={(e) => setAward(e.target.value)}>
              <option>Party Award</option>
              <option>CDC District Achievement Award</option>
            </select>
          </label>
          <button
            className="button"
            onClick={() =>
              change("awards", [
                ...new Set([...edit.awards, `${award} · 2026`]),
              ])
            }
          >
            Record award
          </button>
          {edit.awards.map((a) => (
            <p key={a}>
              {a}{" "}
              <button
                onClick={() =>
                  change(
                    "awards",
                    edit.awards.filter((x) => x !== a),
                  )
                }
              >
                Remove award
              </button>
            </p>
          ))}
          <h3>Training & qualifications</h3>
          <div className="personnel-filters">
            <label>
              Learning programme
              <select
                value={course}
                onChange={(e) => setCourse(e.target.value)}
              >
                {[
                  "Community first aid",
                  "Volunteer orientation",
                  "Safeguarding awareness",
                  "Event coordination",
                ].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
            <label>
              Learning status
              <select
                value={courseStatus}
                onChange={(e) => setCourseStatus(e.target.value)}
              >
                {["Planned", "In progress", "Completed"].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
            <button
              className="button"
              onClick={() =>
                change("training", [
                  ...edit.training.filter((t) => !t.startsWith(course + " ·")),
                  `${course} · ${courseStatus} · 2026`,
                ])
              }
            >
              Update learning record
            </button>
          </div>
          {edit.training.map((t) => (
            <p key={t}>{t}</p>
          ))}
          <div className="personnel-filters">
            <button className="button" onClick={save}>
              Save profile
            </button>
            <button className="button" onClick={() => setEdit(null)}>
              Discard changes
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
