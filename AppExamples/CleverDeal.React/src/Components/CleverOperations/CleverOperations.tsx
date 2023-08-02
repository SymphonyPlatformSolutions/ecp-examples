import "./CleverOperations.scss";
import FakeLeftMenu from "./FakeLeftMenu";
import TradeExceptionDashboard from "./TradeExceptionDashboard";

interface CleverOperationsProps {
  ecpOrigin: string;
}

export const CleverOperations = (props: CleverOperationsProps) => {
  return (
    <div className="operations-page">
      <FakeLeftMenu />
      <TradeExceptionDashboard ecpOrigin={props.ecpOrigin} />
    </div>
  );
};
