import { Fragment, useEffect, useState } from "react";
import { AiOutlineShareAlt } from "react-icons/ai";
import { BsChatDotsFill } from "react-icons/bs";
import { researchData } from "../../Data/research";
import "./CleverResearch.scss";

interface AppProps {
  ecpOrigin: string;
}

export const CleverResearch = (props: AppProps) => {
  const [clientEcpId, setClientEcpId] = useState("");

  useEffect(() => {
    const roomId = researchData.coverageRoom[props.ecpOrigin];
    const container = document.querySelector(".coverage-ecp");
    if (container) {
      container.innerHTML = "";
      container.id = `coverage-ecp-${Date.now()}`;
      (window as any).symphony.openStream(roomId, `#${container.id}`);
    }

    openClientChat(
      researchData.customerRooms.map((c) => c.roomId[props.ecpOrigin])[0]
    );
  }, [props.ecpOrigin]);

  const openClientChat = (streamId: string) => {
    const container = document.querySelector(".client-ecp");
    if (container) {
      container.innerHTML = "";
      container.id = `client-ecp-${Date.now()}`;
      setClientEcpId(container.id);
      (window as any).symphony.openStream(streamId, `#${container.id}`);
    }
  };

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
      container: `#${clientEcpId}`,
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
          <div className="coverage-ecp"></div>
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
          <div className="client-ecp"></div>
        </div>
      </div>
    </div>
  );
};
