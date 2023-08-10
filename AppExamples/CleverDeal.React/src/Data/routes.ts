import CleverInvestments from "../Components/CleverInvestments";
import CleverOperations from "../Components/CleverOperations";
import CleverResearch from "../Components/CleverResearch";
import CleverWealth from "../Components/CleverWealth";

export interface AppEntry {
  label: string;
  path?: string;
  component?: any;
}
export const routes: AppEntry[] = [
  { label: "Investments", path: "investments", component: CleverInvestments },
  { label: "Operations", path: "operations", component: CleverOperations },
  { label: "Research", path: "research", component: CleverResearch },
  { label: "Wealth", path: "wealth", component: CleverWealth },
];
