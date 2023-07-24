import { Icon, TextField } from "@symphony-ui/uitoolkit-components";
import classNames from "classnames";
import { Tab, TabList, TabPanel, Tabs } from "react-tabs";
import { TODAY_MINUS } from "../../../Data/operations";
import "./FakeTopMenu.scss";

const TABS = {
  MISMATCHED: "Mismatched",
  NOT_MATCHED: "Not Matched",
  ALL: "All Exceptions",
};

const SORT_BUTTONS = {
  BOTH: "Both Sides",
  MINE: "My Side",
  COUNTERPARTY: "Counterparty",
};

const ACTION_BUTTONS = [
  "Force Match",
  "New Pair",
  "Cancel Trade",
  "Reject Trade",
  "Amend Trade",
];

const noop = () => {};

export const FakeTopMenu = () => {
  return (
    <div className="fake-top-menu">
      <Tabs>
        <TabList>
          {Object.values(TABS).map((tabName) => (
            <Tab key={tabName}>{tabName}</Tab>
          ))}
        </TabList>

        {Object.values(TABS).map((tabName) => (
          <TabPanel key={tabName + "-panel"}></TabPanel>
        ))}
      </Tabs>

      <div className="sorting-section">
        <div className="date-sort">
          <div>Trade Date</div>
          <TextField
            value={TODAY_MINUS(12).toLocaleDateString()}
            onChange={noop}
            size="small"
            rightDecorators={<Icon iconName="calendar" />}
          />
        </div>
        <div className="side-sort">
          {Object.values(SORT_BUTTONS).map((label) => (
            <button
              key={label}
              type="button"
              onClick={noop}
              className={classNames({ active: SORT_BUTTONS.BOTH === label })}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="actions">
        {ACTION_BUTTONS.map((label) => (
          <button key={label} type="button" onClick={noop}>
            {label}
          </button>
        ))}
      </div>
    </div>
  );
};
