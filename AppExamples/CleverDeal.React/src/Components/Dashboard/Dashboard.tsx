import "./Dashboard.scss";
import { DealInterface } from "../../Models";
import { DashboardItem } from "..";

export interface DashboardProps {
  dashboardItems: DealInterface[];
  selectedDealId?: string;
  onDashboardItemClick: (item: DealInterface) => any;
  ecpOrigin: string;
}

export const Dashboard = ({
  dashboardItems,
  onDashboardItemClick,
  ecpOrigin,
  selectedDealId,
}: DashboardProps) => (
  <>
    <table>
      <thead>
        <tr>
          <th>Deal ID</th>
          <th>Last Updated</th>
          <th>Status</th>
          <th>Name</th>
        </tr>
      </thead>
      <tbody>
        {dashboardItems.map((item) => (
          <DashboardItem
            ecpOrigin={ecpOrigin}
            isActive={selectedDealId === item.dealId}
            onClick={onDashboardItemClick}
            key={item.dealId}
            item={item}
          ></DashboardItem>
        ))}
      </tbody>
    </table>
  </>
);
