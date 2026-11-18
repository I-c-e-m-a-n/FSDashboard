import { useSyncExternalStore } from "react";
let revision = 0;
const listeners = new Set<() => void>();
export function notifyOperations() {
  revision++;
  listeners.forEach((listener) => listener());
}
export function useOperationalRevision() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    () => revision,
  );
}

import { links, type RecordLink } from "./data";
const baselineLinks = links.map((link) => ({ ...link }));
const linkRank = (link: RecordLink) => {
  const rank = baselineLinks.findIndex(
    (l) => l.fromId === link.fromId && l.toId === link.toId,
  );
  return rank < 0 ? baselineLinks.length : rank;
};
const linkSources = new Map<
  string,
  { ids: Set<string>; links: RecordLink[] }
>();
/** Each module owns its associations; the read model deduplicates reciprocal links. */
export function replaceOperationalLinks(
  owner: string,
  ids: string[],
  owned: RecordLink[],
) {
  linkSources.set(owner, { ids: new Set(ids), links: owned });
  const sources = new Set(
    [...linkSources.values()].flatMap((source) => [...source.ids]),
  );
  const candidates = [
    ...baselineLinks.filter((link) => !sources.has(link.fromId)),
    ...[...linkSources.values()].flatMap((source) => source.links),
  ].sort(
    (a, b) =>
      Number(a.kind === "Associated record") -
        Number(b.kind === "Associated record") || linkRank(a) - linkRank(b),
  );
  const seen = new Set<string>();
  const result = candidates.filter((link) => {
    const key =
      link.kind === "Associated record"
        ? [link.fromId, link.toId].sort().join("|")
        : `${link.kind}|${link.fromId}|${link.toId}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  links.splice(0, links.length, ...result);
}

const projections = new Map<string, () => void>();
export function registerOperationalProjection(
  owner: string,
  project: () => void,
) {
  projections.set(owner, project);
}
export function refreshOperationalProjections() {
  projections.forEach((project) => project());
}
