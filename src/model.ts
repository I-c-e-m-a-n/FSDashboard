export const categories = [
  "House visits",
  "Case management",
  "Infrastructure",
  "Engagements",
] as const;
export type Category = (typeof categories)[number];
export const sectors = ["North", "Central", "South"] as const;
export type Sector = (typeof sectors)[number];
export interface Location {
  id: string;
  label: string;
  sector: Sector;
  lat: number;
  lng: number;
}
export interface Team {
  id: string;
  name: string;
  sector: Sector;
}
interface OperationBase {
  id: string;
  title: string;
  locationId: string;
  teamId: string;
  date: string;
  due: string;
  status: "Open" | "In progress" | "Completed" | "Cancelled";
  priority: "Urgent" | "Routine";
  detail: string;
}
export type Operation = OperationBase &
  (
    | {
        category: "House visits";
        measure: { kind: "householdContacts"; count: number };
      }
    | {
        category: "Engagements";
        measure: { kind: "participations"; count: number };
      }
    | { category: "Case management" | "Infrastructure"; measure: null }
  );
export interface RecordLink {
  id: string;
  fromId: string;
  toId: string;
  kind: "Raised matter" | "Support referral" | "Associated record";
  note: string;
}
/** Joined read model for UI compatibility. Units are category-specific, never summed across categories. */
export interface RecordItem extends OperationBase {
  category: Category;
  location: string;
  sector: Sector;
  lat: number;
  lng: number;
  units: number;
  owner: string;
}
