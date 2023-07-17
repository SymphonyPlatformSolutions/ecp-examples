import { useState } from "react";
import "./CleverInvestments.scss";

import { Dashboard, DashboardItemDetails } from "..";
import { DashboardItemInterface } from "../../Models";

import { deals } from "../../Data/deals";

interface AppProps {
  ecpOrigin: string;
}

export const CleverInvestments = (props: AppProps) => {
  const [ selectedDeal, setSelectedDeal ] = useState<DashboardItemInterface | undefined>(undefined);
  return (
    <div className="app-container">
      <div className="dashboard">
        <Dashboard
          ecpOrigin={props.ecpOrigin}
          onDashboardItemClick={setSelectedDeal}
          dashboardItems={deals}
          selectedDealId={selectedDeal?.dealId}
        ></Dashboard>
      </div>
      {selectedDeal && (
        <div className="right-panel">
          <DashboardItemDetails
            deal={selectedDeal}
            ecpOrigin={props.ecpOrigin}
            onClose={() => setSelectedDeal(undefined)}
          />
        </div>
      )}
    </div>
  );
};
