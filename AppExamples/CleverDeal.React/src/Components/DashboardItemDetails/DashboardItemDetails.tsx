import React, { RefObject } from 'react';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';

import { DashboardItemInterface } from "../../Models"
import { Graph, Loading } from '..';
import './DashboardItemDetails.scss';

export interface DashboardItemDetailsState {
  sdkLoading: boolean;
}
export interface DashboardItemDetailsProps {
  deal: DashboardItemInterface;
  sdkLoaded: Promise<any>;
  ecpOrigin: string;
  onClose: () => any;
}

export class DashboardItemDetails extends React.PureComponent<DashboardItemDetailsProps, DashboardItemDetailsState> {

  private chatId: string;
  private chatRef: RefObject<HTMLDivElement>;

  constructor(props: DashboardItemDetailsProps) {
    super(props);
    this.chatId = `symphony-ecm-${props.deal.dealId}`;
    this.chatRef = React.createRef();
    this.state = {sdkLoading: true};
  }

  private openStream = () => {
    const roomId = this.props.deal.details.roomId && this.props.deal.details.roomId[this.props.ecpOrigin];
    if (roomId) {
      return (window as any).symphony.openStream(roomId, `#${this.chatId}`)
    }
  }

  componentDidMount() {
    this.props.sdkLoaded.then(() => {
      this.openStream().then(() => {
        this.setState({sdkLoading: false});
        console.log('FULLY LOADED');
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

  render() {
    const { name, details } = this.props.deal;
    return (
      <div className="dashboard-item-details">
        <div className="dashboard-item-details-header">
          <h2 className="title">{name}</h2>
          <div className="close cross" onClick={() => this.props.onClose()}>x</div>
        </div>
        <div className="graph">
          <Graph dealId={this.props.deal.dealId} dealName={this.props.deal.name}></Graph>
        </div>
        <div className="tabs">
          <Tabs forceRenderTabPanel={true}>
            <TabList>
              <Tab>Details</Tab>
              <Tab>History</Tab>
              <Tab>Chat</Tab>
            </TabList>
            <TabPanel>
              <div className="deal-details">
                <div className='deal-members'>
                  <div className="deal-detail-block-title">
                    Members
                  </div>
                  <ul>
                    {this.props.deal.details.members?.map((member) => (<li key={`list-item-${member.name}`}>{member.name}</li>))}
                  </ul>
                </div>
                <div className="deal-detail-block">
                  <span className="deal-detail-block-title">Country</span>
                  <span className="deal-detail-block-content">{details.country}</span>
                </div>
                <div className="deal-detail-block">
                  <span className="deal-detail-block-title">Risk level</span>
                  <span className="deal-detail-block-content">{details.riskLevel}</span>
                </div>
                <div className="deal-detail-block">
                  <span className="deal-detail-block-title">Type</span>
                  <span className="deal-detail-block-content">{details.type}</span>
                </div>
                <div className="deal-detail-block">
                  <span className="deal-detail-block-title">Minimum</span>
                  <span className="deal-detail-block-content">{details.minimum}</span>
                </div>
              </div>
            </TabPanel>
            <TabPanel>
              <h3>History</h3>
            </TabPanel>
            <TabPanel>
              <div className={`loader ${this.state.sdkLoading ? 'loading' : ''}`}><Loading animate={true} className="chat-loading"></Loading></div>
              <div ref={this.chatRef} className="symphony-ecm-chat" id={this.chatId}></div>
            </TabPanel>
          </Tabs>
        </div>
      </div>
    )
  }
}
