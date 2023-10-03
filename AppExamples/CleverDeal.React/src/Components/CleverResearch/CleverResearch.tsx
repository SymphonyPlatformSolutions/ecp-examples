import { Fragment, useEffect } from "react";
import { AiOutlineShareAlt } from "react-icons/ai";
import { BsChatDotsFill } from "react-icons/bs";
import { researchData } from "../../Data/research";
import "./CleverResearch.scss";

interface AppProps {
  ecpOrigin: string;
}

export const CleverResearch = (props: AppProps) => {
  useEffect(() => {
    const coverageRoomId = researchData.coverageRoom[props.ecpOrigin];
    (window as any).symphony.openStream(coverageRoomId, '.coverage-ecp');

    const firstClientRoomId = researchData.customerRooms.map((c) => c.roomId[props.ecpOrigin])[0];
    openClientChat(firstClientRoomId);
  }, [props.ecpOrigin]);

  const openClientChat = (streamId: string) =>
    (window as any).symphony.openStream(streamId, '.client-ecp');

  const blastReport = () => {
    const payload = {
      text: { "text/markdown": `Here's our latest research report on..` },
      entities: {
        report: {
          type: "fdc3.fileAttachment",
          data: { name: "ressearch-report.pdf", dataUri: researchData.pdfFile }
        },
      },
    };
    (window as any).symphony.sendMessage(payload, {
      mode: "blast",
      streamIds: researchData.customerRooms.map(
        (c) => c.roomId[props.ecpOrigin]
      ),
      container: 'client-ecp',
    });
  };

  const getDate = (delta: number) => {
    const date = new Date(new Date().getTime() - delta);
    return date.toLocaleDateString("en", { month: "short", day: "numeric" });
  };

  return (
    <div className="research-root">
      <div className="research-modal">
        <div className="header">
          <div className="company-name">Tesla Inc</div>
          <div className="company-details">
            <div>Ticker</div>
            <div>TSLA US</div>
            <div>Sector</div>
            <div>Automotives</div>
            <div>Price</div>
            <div>265.28 (1.4%)</div>
            <div>Analyst</div>
            <div>Brian Jones</div>
          </div>
        </div>
        <div className="grid">
          <div className="research-list">
            <h3>Reports</h3>
            <div className="table">
              <div>Title</div>
              <div>Date</div>
              <div>Status</div>
              <div></div>
              <div>Why X is building revenue</div>
              <div>{getDate(100000000)}</div>
              <div>
                <span className="inactive badge">Draft</span>
              </div>
              <div></div>
              <div>Tesla, new entrants, new challenges</div>
              <div>{getDate(300000000)}</div>
              <div>
                <span className="active badge">Published</span>
              </div>
              <div>
                <AiOutlineShareAlt onClick={blastReport} />
              </div>
              <div>Batteries are the key for TSLA</div>
              <div>{getDate(500000000)}</div>
              <div>
                <span className="active badge">Published</span>
              </div>
              <div>
                <AiOutlineShareAlt onClick={blastReport} />
              </div>
            </div>
          </div>
          <div>
            <h3>Coverage Room</h3>
            <div className="ecp coverage-ecp"></div>
          </div>
          <div className="client-list">
            <h3>Clients</h3>
            <div className="table">
              <div>Name</div>
              <div>Company</div>
              <div>Last</div>
              <div></div>
              {researchData.customerRooms.map((customer, index) => (
                <Fragment key={customer.name}>
                  <div>{customer.name}</div>
                  <div>{customer.company}</div>
                  <div>{getDate((index + 1) * 150000000)}</div>
                  <div
                    onClick={() =>
                      openClientChat(customer.roomId[props.ecpOrigin])
                    }
                  >
                    <BsChatDotsFill />
                  </div>
                </Fragment>
              ))}
            </div>
          </div>
          <div>
            <h3>Client Room</h3>
            <div className="ecp client-ecp"></div>
          </div>
        </div>
      </div>
    </div>
  );
};
