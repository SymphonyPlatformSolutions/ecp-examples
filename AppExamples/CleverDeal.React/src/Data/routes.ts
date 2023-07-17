import { CleverInvestments } from '../Components/CleverInvestments/CleverInvestments';

export interface AppEntry {
  label: string;
  path?: string;
  component?: any;
}
export const routes : AppEntry[] = [
  { label: 'Investments', path: 'investments', component: CleverInvestments },
  { label: 'Operations' },
  { label: 'Research' },
  { label: 'Wealth' },
];
