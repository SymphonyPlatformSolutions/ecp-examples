import { AiOutlineShareAlt } from "react-icons/ai";
import {
  FaEnvelope, FaPhone, FaLocationDot, FaCirclePlus, FaCircleUser,
} from "react-icons/fa6";
import { FaHome } from "react-icons/fa";
import { getEcpParam } from "../../Utils/utils";
import { getShareScreenshotMessage } from "../../Data/deals";
import { Graph, GraphRefType } from "../Graph/Graph";
import { ThemeState, ThemeContext } from '../../Theme/ThemeProvider';
import { useContext, useEffect, useState, useRef, Fragment } from 'react';
import { wealthData } from "../../Data/wealth";
import HelpButton from "../HelpButton";
import Loading from "../Loading";
import ThemePicker from "../ThemePicker";
import "../App/app.scss";
import "./CleverWealth.scss";

const ecpOrigin = getEcpParam("ecpOrigin") || "corporate.symphony.com";
const partnerId = getEcpParam("partnerId");
const DEFAULT_SDK_PATH: string = "/embed/sdk.js";
const sdkPath = getEcpParam("sdkPath", false) || DEFAULT_SDK_PATH;

interface WealthProps {
  setLoading: (loading : boolean) => void;
}

const WealthApp = ({ setLoading } : WealthProps) => {
  const graphRef = useRef<GraphRefType>(null);
  const { applyTheme } = useContext(ThemeContext) as ThemeState;

  useEffect(() => {
    if ((window as any).symphony) {
      return;
    }
    const sdkScriptNode = document.createElement("script");
    sdkScriptNode.src = `https://${ecpOrigin}${sdkPath}`;
    sdkScriptNode.id = "symphony-ecm-sdk";
    sdkScriptNode.setAttribute("render", "explicit");
    sdkScriptNode.setAttribute("data-mode", "full");
    sdkScriptNode.setAttribute("data-onload", "renderEcp");
    if (partnerId) {
      sdkScriptNode.setAttribute("data-partner-id", partnerId);
    }
    document.body.appendChild(sdkScriptNode);

    (window as any).renderEcp = () => {
      (document as any).querySelector(".ecp").innerHTML = "";
      (window as any).symphony.render("ecp", {
        streamId: wealthData.wealthRoom[ecpOrigin],
        ecpLoginPopup: true,
        condensed: true,
        allowedApps: "com.symphony.zoom,com.symphony.teams,salesforce2-app",
      })
      .then(() => {
        setLoading(false);
        applyTheme();
      });
    }
  }, [ applyTheme, setLoading ]);

  const share = (file : string) => {
    const payload = {
      text: { "text/markdown": `Here's a research report on..` },
      entities: {
        report: {
          type: "fdc3.fileAttachment",
          data: { name: file, dataUri: wealthData.pdfFile },
        },
      },
    };
    (window as any).symphony.sendMessage(payload, {
      mode: "blast",
      streamIds: [ wealthData.wealthRoom[ecpOrigin] ],
      container: '.ecp',
    });
  };

  const handleShareScreenshot = (b64Image: string | undefined) =>
    (window as any).symphony.sendMessage(
      getShareScreenshotMessage(b64Image), {
        mode: "blast",
        streamIds: [ wealthData.wealthRoom[ecpOrigin] ],
      });

  return (
    <div className="wealth-root">
      <div className="ecp"></div>
      <div className="details">
        <div className="client-profile">
          <h3>Client Profile</h3>
          <div className="client-card">
            <FaCircleUser />
            <div className="client-details">
              <div className="client-name">
                { wealthData.customer.name }
              </div>
              <div>
              { wealthData.customer.title }
              </div>
            </div>
          </div>
          <ul>
            <li><FaEnvelope /> { wealthData.customer.email }</li>
            <li><FaPhone /> { wealthData.customer.phone }</li>
            <li><FaLocationDot /> { wealthData.customer.address }</li>
            <li><FaCirclePlus /> More..</li>
          </ul>
        </div>
        <div className="performance">
          <h3>Performance</h3>
          <Graph
            ref={graphRef}
            dealId="Deal"
            dealName="Portfolio Return"
            onShareScreenshot={handleShareScreenshot}
            onShare={() => {}}
          />
        </div>
        <div className="reports">
          <h3>Reports</h3>
          { wealthData.reports.map((report, i) => (
            <Fragment key={i}>
              <h4>{report.header}</h4>
              <ul>
                { report.files.map((file, j) => (
                  <li key={j}>{file} <AiOutlineShareAlt onClick={() => share(file)} /></li>
                ))}
              </ul>
            </Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};

export const CleverWealth = () => {
  const [ loading, setLoading ] = useState(true);
  return (
    <div className="App">
      <div className="app-header">
        <div className="brand" onClick={() => window.location.href = '/'}>
          <FaHome />
          <Loading animate={false} className="logo"></Loading>
          <h1>Clever Deal 2.0: Wealth</h1>
        </div>
        <div className="app-header-settings">
          <ThemePicker />
          <HelpButton disabled={loading} ecpOrigin={ecpOrigin} />
        </div>
      </div>
      <WealthApp setLoading={setLoading} />
    </div>
  );
};
