import React, { RefObject } from "react";
import { Tab, Tabs, TabList, TabPanel } from "react-tabs";

import { DashboardItemInterface } from "../../Models";
import { Graph, Loading } from "..";
import "./DashboardItemDetails.scss";
import { Scope, SYNC_CHART_SCOPE_INTENT } from "../Graph/Graph.utils";

const TABS = {
  DETAILS: "Details",
  HISTORY: "History",
  CHAT: "Chat",
};
export interface DashboardItemDetailsState {
  sdkLoading: boolean;
  selectedTab: number;
}
export interface DashboardItemDetailsProps {
  deal: DashboardItemInterface;
  sdkLoaded: Promise<any>;
  ecpOrigin: string;
  onClose: () => any;
}

export class DashboardItemDetails extends React.PureComponent<
  DashboardItemDetailsProps,
  DashboardItemDetailsState
> {
  private chatId: string;
  private chatRef: RefObject<HTMLDivElement>;

  constructor(props: DashboardItemDetailsProps) {
    super(props);
    this.chatId = `symphony-ecm-${props.deal.dealId}-${Date.now()}`;
    this.chatRef = React.createRef();
    this.state = { sdkLoading: true, selectedTab: 0 };
  }

  private openStream = () => {
    const roomId = this.props.deal.details.roomId?.[this.props.ecpOrigin];
    if (roomId) {
      return (window as any).symphony.openStream(roomId, `#${this.chatId}`);
    }
  };

  componentDidMount() {
    this.props.sdkLoaded.then(() => {
      this.openStream().then(() => {
        this.setState({ sdkLoading: false });
        console.log("FULLY LOADED");
      });
    });
  }

  componentDidUpdate(previousProps: DashboardItemDetailsProps) {
    if (previousProps.deal.dealId !== this.props.deal.dealId) {
      this.props.sdkLoaded.then(() => {
        this.openStream();
      });
    }
  }

  displayTab = (tabName: string) =>
    this.setState({ selectedTab: Object.values(TABS).indexOf(tabName) });

  onShareScreenshot = (b64Image: string) => {
    const roomId = this.props.deal.details.roomId?.[this.props.ecpOrigin];
    if (!roomId) {
      return;
    }

    const message = {
      text: {
        "text/markdown": "",
      },
      entities: {
        attachmentImage: {
          type: "fdc3.fileAttachment",
          data: {
            name: "graph.jpeg",
            dataUri: b64Image,
          },
        },
      },
    };

    this.displayTab(TABS.CHAT);

    return (window as any).symphony.sendMessage(message, {
      mode: "blast",
      streamIds: [roomId],
      users: [],
      container: this.chatId,
    });
  };

  onShare = (scope: Scope) => {
    const roomId = this.props.deal.details.roomId?.[this.props.ecpOrigin];
    if (!roomId) {
      return;
    }

    this.displayTab(TABS.CHAT);

    const message = {
      text: {
        "text/markdown": "",
      },
      entities: {
        button1: {
          type: "fdc3.fdc3Intent",
          data: {
            title: `View ${scope} Chart`,
            intent: SYNC_CHART_SCOPE_INTENT,
            context: {
              type: "fdc3.chart.scope",
              scope,
            },
          },
        },
      },
    };

    return (window as any).symphony.sendMessage(message, {
      mode: "blast",
      streamIds: [roomId],
      users: [],
      container: this.chatId,
    });
  };

  render() {
    const { name, details } = this.props.deal;
    return (
      <div className="dashboard-item-details">
        <div className="dashboard-item-details-header">
          <h2 className="title">{name}</h2>
          <div className="close cross" onClick={() => this.props.onClose()}>
            x
          </div>
        </div>
        <div className="graph">
          <Graph
            dealId={this.props.deal.dealId}
            dealName={this.props.deal.name}
            onShareScreenshot={this.onShareScreenshot}
            onShare={this.onShare}
            sdkLoaded={this.props.sdkLoaded}
          />
        </div>
        <div className="tabs">
          <Tabs
            forceRenderTabPanel={true}
            selectedIndex={this.state.selectedTab}
            onSelect={(index) => this.setState({ selectedTab: index })}
          >
            <TabList>
              {Object.values(TABS).map((tabName) => (
                <Tab key={tabName}>{tabName}</Tab>
              ))}
            </TabList>
            <TabPanel>
              <div className="deal-details">
                <div className="deal-members">
                  <div className="deal-detail-block-title">Members</div>
                  <ul>
                    {this.props.deal.details.members?.map((member) => (
                      <li key={`list-item-${member.name}`}>{member.name}</li>
                    ))}
                  </ul>
                </div>
                <div className="deal-detail-block">
                  <span className="deal-detail-block-title">Country</span>
                  <span className="deal-detail-block-content">
                    {details.country}
                  </span>
                </div>
                <div className="deal-detail-block">
                  <span className="deal-detail-block-title">Risk level</span>
                  <span className="deal-detail-block-content">
                    {details.riskLevel}
                  </span>
                </div>
                <div className="deal-detail-block">
                  <span className="deal-detail-block-title">Type</span>
                  <span className="deal-detail-block-content">
                    {details.type}
                  </span>
                </div>
                <div className="deal-detail-block">
                  <span className="deal-detail-block-title">Minimum</span>
                  <span className="deal-detail-block-content">
                    {details.minimum}
                  </span>
                </div>
              </div>
            </TabPanel>
            <TabPanel>
              <h3>History</h3>
            </TabPanel>
            <TabPanel>
              <div
                className={`loader ${this.state.sdkLoading ? "loading" : ""}`}
              >
                <Loading animate={true} className="chat-loading"></Loading>
              </div>
              <div
                ref={this.chatRef}
                className="symphony-ecm-chat"
                id={this.chatId}
              ></div>
            </TabPanel>
          </Tabs>
        </div>
      </div>
    );
  }
}
