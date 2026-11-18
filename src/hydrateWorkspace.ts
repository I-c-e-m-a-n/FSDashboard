import { hydrateCases, reconcileCases } from "./caseStore";
import { hydratePersonnel, reconcilePersonnel } from "./personnelStore";
import {
  hydrateInfrastructure,
  reconcileInfrastructure,
} from "./infrastructureStore";
import { hydrateEngagements, reconcileEngagements } from "./engagementStore";
// Two-phase restoration makes cross-module references independent of import order.
export function hydrateWorkspace() {
  hydratePersonnel();
  hydrateInfrastructure();
  hydrateEngagements();
  hydrateCases();
  reconcileEngagements();
  reconcileInfrastructure();
  reconcilePersonnel();
  reconcileCases();
}
