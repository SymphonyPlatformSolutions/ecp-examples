import { CleverInvestments } from "../Components/CleverInvestments";
import { CleverResearch } from "../Components/CleverResearch";

export interface AppEntry {
  label: string;
  path?: string;
  component?: any;
}
export const routes : AppEntry[] = [
  { label: 'Investments', path: 'investments', component: CleverInvestments },
  { label: 'Operations' },
  { label: 'Research', path: 'research', component: CleverResearch },
  { label: 'Wealth' },
];
