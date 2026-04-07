import { Suspense, lazy } from 'react';
import Loading from '../Loading';
import { loadWealthManagementModule } from './loadWealthManagementModule';

const WealthManagement = lazy(loadWealthManagementModule);

function WealthManagementModuleLoading() {
  return (
    <div className="large-loading">
      <Loading animate={true} className="logo" />
    </div>
  );
}

export default function WealthManagementRoute() {
  return (
    <Suspense fallback={<WealthManagementModuleLoading />}>
      <WealthManagement />
    </Suspense>
  );
}