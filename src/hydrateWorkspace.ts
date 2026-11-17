import {
  hydrateInfrastructure,
  reconcileInfrastructure,
} from "./infrastructureStore";
import { hydrateEngagements, reconcileEngagements } from "./engagementStore";
// Two-phase restoration makes cross-module references independent of import order.
export function hydrateWorkspace() {
  hydrateInfrastructure();
  hydrateEngagements();
  reconcileEngagements();
  reconcileInfrastructure();
}
