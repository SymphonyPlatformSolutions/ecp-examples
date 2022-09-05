import React, { useState } from 'react';
import './App.scss';

import { Dashboard, DashboardItemDetails, Loading, ThemePicker } from './Components'
import { DashboardItemInterface } from './Models';

import { deals } from './Data/deals';

interface AppProps {
  sdkLoaded: Promise<any>;
  ecpOrigin: string;
}

function App(props: AppProps) {
  const [selectedDeal, setSelectedDeal] = useState<DashboardItemInterface | undefined>(undefined);
  return (
    <div className="App">
      <div className="app-header">
        <div className="brand">
          <Loading animate={false} className="logo"></Loading>
          <h1>Clever deal</h1>
        </div>
        <div className="app-header-settings">
          <ThemePicker></ThemePicker>
        </div>
      </div>
      <div className="app-container">
        <div className="dashboard">
          <Dashboard ecpOrigin={props.ecpOrigin} sdkLoaded={props.sdkLoaded} onDashboardItemClick={setSelectedDeal} dashboardItems={deals} selectedDealId={selectedDeal?.dealId}></Dashboard>
        </div>
        {
          selectedDeal ? 
          (
            <div className="right-panel">
              <DashboardItemDetails sdkLoaded={props.sdkLoaded} deal={selectedDeal} ecpOrigin={props.ecpOrigin} onClose={() => setSelectedDeal(undefined)}></DashboardItemDetails>
            </div>
          ) : null
        }
      </div>
    </div>
  );
}

export default App;
