/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useRef, useState } from "react";
import { Tab, TabList, TabPanel, Tabs } from "react-tabs";
import {
  getCreateDealRoomMessage,
  getShareMessage,
  getShareScreenshotMessage,
} from "../../../Data/deals";
import { DealInterface } from "../../../Models";
import { Graph, GraphRefType } from "../../Graph/Graph";
import { Scope } from "../../Graph/Graph.utils";
import "./DashboardItemDetails.scss";

const TABS = {
  DETAILS: "Details",
  HISTORY: "History",
  CHAT: "Chat",
};

interface DashboardItemDetailsProps {
  deal: DealInterface;
  ecpOrigin: string;
  onClose: () => any;
  updateDealHandler: (newDeal: DealInterface) => any;
}

const CHAT_ID_PREFIX = `symphony-ecm-deal-chat`;
const CHAT_CONTAINER_CLASS = "chat-container";

const DashboardItemDetails: React.FC<DashboardItemDetailsProps> = ({
  deal,
  ecpOrigin,
  onClose,
  updateDealHandler,
}) => {
  const roomId = deal.details?.roomId?.[ecpOrigin];

  const [selectedTab, setSelectedTab] = useState(0);

  const graphRef = useRef<GraphRefType>(null);
  const chatRef = useRef<HTMLDivElement>(null);

  const getChatId = () =>
    document.querySelector(`.${CHAT_CONTAINER_CLASS}`)?.id;

  useEffect(() => {
    const container = document.querySelector(`.${CHAT_CONTAINER_CLASS}`);
    const id = CHAT_ID_PREFIX + Date.now();

    if (container) {
      container.innerHTML = "";
      container.id = id;
    }
  }, []);

  const openOrCreateStream = () => {
    if (roomId) {
      return (window as any).symphony.openStream(roomId, `#${getChatId()}`);
    } else {
      return (window as any).symphony
        .createRoom(
          deal.name + " room [" + Date.now() + "]",
          [],
          {},
          `#${getChatId()}`
        )
        .then((response: { streamId: string }) => {
          updateDealHandler({
            ...deal,
            status: "active",
            details: {
              ...deal.details,
              roomId: {
                [ecpOrigin]: response.streamId,
              },
            },
          });

          const b64Image = graphRef.current?.getChartImage();
          return (window as any).symphony.sendMessage(
            getCreateDealRoomMessage(b64Image),
            {
              mode: "blast",
              streamIds: [response.streamId],
              users: [],
              container: getChatId(),
            }
          );
        });
    }
  };

  useEffect(() => {
    openOrCreateStream();
  }, [deal.dealId]);

  const displayTab = (tabName: string) => {
    setSelectedTab(Object.values(TABS).indexOf(tabName));
  };

  const onShareScreenshot = (b64Image: string | undefined) => {
    displayTab(TABS.CHAT);

    return (window as any).symphony.sendMessage(
      getShareScreenshotMessage(b64Image),
      {
        mode: "blast",
        streamIds: [roomId],
        users: [],
        container: getChatId(),
      }
    );
  };

  const onShare = (scope: Scope) => {
    displayTab(TABS.CHAT);

    return (window as any).symphony.sendMessage(getShareMessage(scope), {
      mode: "blast",
      streamIds: [roomId],
      users: [],
      container: getChatId(),
    });
  };

  return (
    <div className="dashboard-item-details">
      <div className="dashboard-item-details-header">
        <h2 className="title">{deal.name}</h2>
        <div className="close cross" onClick={onClose}>
          x
        </div>
      </div>
      <div className="graph">
        <Graph
          ref={graphRef}
          dealId={deal.dealId}
          dealName={deal.name}
          onShareScreenshot={roomId ? onShareScreenshot : undefined}
          onShare={roomId ? onShare : undefined}
        />
      </div>
      <div className="tabs">
        <Tabs
          forceRenderTabPanel={true}
          selectedIndex={selectedTab}
          onSelect={(index) => setSelectedTab(index)}
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

                {!!deal.details?.members?.length ? (
                  <ul>
                    {deal.details?.members?.map((member) => (
                      <li key={`list-item-${member.name}`}>{member.name}</li>
                    ))}
                  </ul>
                ) : (
                  <span className="deal-detail-block-content">None</span>
                )}
              </div>
              <div className="deal-detail-block">
                <span className="deal-detail-block-title">Country</span>
                <span className="deal-detail-block-content">
                  {deal.details?.country}
                </span>
              </div>
              <div className="deal-detail-block">
                <span className="deal-detail-block-title">Risk level</span>
                <span className="deal-detail-block-content">
                  {deal.details?.riskLevel}
                </span>
              </div>
              <div className="deal-detail-block">
                <span className="deal-detail-block-title">Type</span>
                <span className="deal-detail-block-content">
                  {deal.details?.type}
                </span>
              </div>
              <div className="deal-detail-block">
                <span className="deal-detail-block-title">Minimum</span>
                <span className="deal-detail-block-content">
                  {deal.details?.minimum}
                </span>
              </div>
            </div>
          </TabPanel>
          <TabPanel>
            <h3>History</h3>
          </TabPanel>
          <TabPanel>
            <div
              ref={chatRef}
              className={`symphony-ecm-chat ${CHAT_CONTAINER_CLASS}`}
            ></div>
          </TabPanel>
        </Tabs>
      </div>
    </div>
  );
};

export default DashboardItemDetails;