import { useEffect, useRef, useState } from "react";
import "./CleverInvestments.scss";

import { Dashboard } from "./Dashboard";
import { DealInterface } from "../../Models";

import { INITIAL_DEALS } from "../../Data/deals";
import DashboardItemDetails from "./DashboardItemDetails";

interface AppProps {
  ecpOrigin: string;
}

export const CleverInvestments = (props: AppProps) => {
  const [deals, setDeals] = useState<DealInterface[]>([...INITIAL_DEALS]);

  const dealsLatest = useRef<DealInterface[]>(deals);

  const [selectedDeal, setSelectedDeal] = useState<DealInterface | undefined>(
    undefined
  );

  const updateDeal = (newDeal: DealInterface) => {
    const dealIndex = dealsLatest.current.findIndex(
      (d) => d.dealId === newDeal.dealId
    );

    if (dealIndex === -1) return;

    const newDeals = [...dealsLatest.current];
    newDeals[dealIndex] = newDeal;

    setDeals(newDeals);
    setSelectedDeal(newDeal);
  };

  useEffect(() => {
    dealsLatest.current = deals;
  }, [deals]);

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
            updateDealHandler={updateDeal}
          />
        </div>
      )}
    </div>
  );
};
