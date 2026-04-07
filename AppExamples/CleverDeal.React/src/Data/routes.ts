import CleverInvestments from "../Components/CleverInvestments";
import CleverOperations from "../Components/CleverOperations";
import CleverResearch from "../Components/CleverResearch";
import CleverWealth from "../Components/CleverWealth";
import ContentDistribution from "../Components/ContentDistribution";
import WealthManagementRoute from "../Components/WealthManagement/WealthManagementRoute";

export interface AppEntry {
  label: string;
  path: string;
  routePath?: string;
  component?: any;
  enabled?: boolean;
}
export const routes: AppEntry[] = [
  { label: "Investments",      path: "investments",      component: CleverInvestments },
  { label: "Operations",       path: "operations",       component: CleverOperations },
  { label: "Research",         path: "research",         component: CleverResearch },
  { label: "Wealth",           path: "wealth",           component: CleverWealth },
  { label: "Content",          path: "content",          component: ContentDistribution },
  { label: "Wealth Management", path: "wealth-management", routePath: "wealth-management/*", component: WealthManagementRoute, enabled: true },
];
