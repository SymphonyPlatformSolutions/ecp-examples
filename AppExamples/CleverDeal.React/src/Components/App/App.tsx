import {
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { createElement, useEffect, useState, useContext } from "react";
import { FaHome } from "react-icons/fa";
import { getEcpParam } from "../../Utils/utils";
import { routes } from "../../Data/routes";
import { ThemeState, ThemeContext } from '../../Theme/ThemeProvider';
import HelpButton from "../HelpButton";
import LandingPage from "../LandingPage";
import Loading from "../Loading";
import ThemePicker from "../ThemePicker";
import "./app.scss";

const DEFAULT_ORIGIN: string = "corporate.symphony.com";
const ecpOriginParam = getEcpParam("ecpOrigin") || DEFAULT_ORIGIN;
const partnerIdParam = getEcpParam("partnerId");

const DEFAULT_SDK_PATH: string = "/embed/sdk.js";
const sdkPath = getEcpParam("sdkPath", false) || DEFAULT_SDK_PATH;

const LargeLoading = () => (
  <div className="large-loading">
    <Loading animate={true} className="logo"></Loading>
  </div>
);

export const App = () => {
  const [ loading, setLoading ] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const ecpProps = { ecpOrigin: ecpOriginParam, partnerId: partnerIdParam };
  const { applyTheme } = useContext(ThemeContext) as ThemeState;

  useEffect(() => {
    if ((window as any).symphony) {
      return;
    }
    const sdkScriptNode = document.createElement("script");
    sdkScriptNode.src = `https://${ecpOriginParam}${sdkPath}`;
    sdkScriptNode.id = "symphony-ecm-sdk";
    sdkScriptNode.setAttribute("render", "explicit");
    sdkScriptNode.setAttribute("data-onload", "renderRoom");
    if (partnerIdParam) {
      sdkScriptNode.setAttribute("data-partner-id", partnerIdParam);
    }
    document.body.appendChild(sdkScriptNode);

    (window as any).renderRoom = () =>
      (window as any).symphony
        .render("symphony-ecm", {
          showTitle: false,
          ecpLoginPopup: true,
          allowedApps: "com.symphony.zoom,com.symphony.teams",
          sound: false,
        })
        .then(() => {
          applyTheme();
          setLoading(false);
        });
  }, [ applyTheme, location.pathname ]);

  const getAppLabel = () => {
    const route = routes.find(({ path }) => `/${path}` === location.pathname);
    return route ? `: ${route.label}` : "";
  };

  return (loading && location.pathname !== '/') ? (
    <LargeLoading />
  ) : (
    <div className="App">
      <div className="app-header">
        <div className="brand" onClick={() => navigate("/")}>
          <FaHome />
          <Loading animate={false} className="logo"></Loading>
          <h1>
            Clever Deal 2.0
            {getAppLabel()}
          </h1>
        </div>
        <div className="app-header-settings">
          <ThemePicker />
          <HelpButton disabled={loading} ecpOrigin={ecpProps.ecpOrigin} />
        </div>
      </div>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        {routes
          .filter(({ component }) => component)
          .map((route) => (
            <Route
              key={route.path}
              {...route}
              element={createElement(route.component, ecpProps)}
            />
          ))}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
};
