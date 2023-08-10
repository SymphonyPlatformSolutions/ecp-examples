import classNames from "classnames";
import { useEffect, useState } from "react";
import { DealInterface } from "../../../Models";
import "./DashboardItem.scss";

export interface DashboardItemProps {
  item: DealInterface;
  isActive: boolean;
  onClick: (item: DealInterface) => any;
  ecpOrigin: string;
}

export const DashboardItem = ({
  item,
  isActive,
  onClick,
  ecpOrigin,
}: DashboardItemProps) => {
  const { dealId, lastUpdated, status, name } = item;
  const [badgeCount, setBadgeCount] = useState<number>(0);
  useEffect(() => {
    const streamId = item.details.roomId && item.details.roomId[ecpOrigin];
    if (streamId) {
      (window as any).symphony.listen({
        type: "UnreadCountNotifications",
        params: {
          streamId,
        },
        callback: (notification: any) => {
          // TODO: Type?
          setBadgeCount(notification.count);
        },
      });
    }
  }, [ecpOrigin, item.details.roomId]);
  return (
    <tr
      className={classNames("item-row", { active: isActive })}
      onClick={() => onClick(item)}
    >
      <td className="item-cell">{dealId}</td>
      <td className="item-cell">{lastUpdated}</td>
      <td className="item-cell status">
        <div className="status-badge-cell">
          <div className={`status-badge ${status}`}>{status}</div>
        </div>
      </td>
      <td className="item-cell">
        {name}
        {badgeCount ? (
          <div className="badge-count-container">
            <div className="badge-count">{badgeCount}</div>
          </div>
        ) : null}
      </td>
    </tr>
  );
};
