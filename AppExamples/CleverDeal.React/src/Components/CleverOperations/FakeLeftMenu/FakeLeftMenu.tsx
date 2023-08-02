import { FaMinusSquare } from "react-icons/fa";
import "./FakeLeftMenu.scss";

const SUB_ITEMS = ["Equity", "Debt", "Combined"];
const GROUPS = ["Dashboard", "Trade Exceptions"];

export const FakeLeftMenu = () => {
  return (
    <div className="fake-left-menu">
      {GROUPS.map((groupName) => (
        <div key={groupName} className="menu-group">
          <div className="menu-section">
            <FaMinusSquare />
            {groupName}
          </div>
          <div className="menu-items">
            {SUB_ITEMS.map((itemName) => (
              <div key={itemName} className="menu-item">
                {itemName}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
