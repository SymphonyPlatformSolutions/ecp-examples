import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Loading, ThemePicker, HelpButton, LandingPage } from '..';
import { helpRoom } from '../../Data/deals';
import { routes } from '../../Data/routes';
import { FaHome } from 'react-icons/fa';
import './app.scss';

const DEFAULT_ORIGIN: string = "corporate.symphony.com";
const originInParams = (new URL(window.location.href)).searchParams.get('ecpOrigin');
const partnerIdInParams = (new URL(window.location.href)).searchParams.get('partnerId');

const LargeLoading = () => (
  <div className="large-loading">
    <Loading animate={true} className="logo"></Loading>
  </div>
);

export const App = () => {
  const [ loading, setLoading ] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const ecpProps = {
    ecpOrigin: originInParams || DEFAULT_ORIGIN,
  };

  useEffect(() => {
    const sdkScriptNode = document.createElement('script');
    sdkScriptNode.src = `https://${originInParams || DEFAULT_ORIGIN}/embed/sdk.js`;
    sdkScriptNode.id = 'symphony-ecm-sdk';
    sdkScriptNode.setAttribute('render', 'explicit');
    sdkScriptNode.setAttribute('data-onload', 'renderRoom');
    if (partnerIdInParams) {
      sdkScriptNode.setAttribute('data-partner-id', partnerIdInParams);
    }
    document.body.appendChild(sdkScriptNode);

    (window as any).renderRoom = () =>
    (window as any).symphony.render('symphony-ecm', {
      showTitle: false,
      ecpLoginPopup: true,
    }).then(() => setLoading(false));
  }, []);

  const getAppLabel = () => {
    const route = routes.find(({ path }) => `/${path}` === location.pathname);
    return route ? `: ${route.label}` : '';
  };

  return loading ? <LargeLoading /> : (
    <div className="App">
      <div className="app-header">
        <div className="brand" onClick={() => navigate('/')}>
          <FaHome />
          <Loading animate={false} className="logo"></Loading>
          <h1>
            Clever Deal 2.0
            { getAppLabel() }
          </h1>
        </div>
        <div className="app-header-settings">
          <ThemePicker />
          <HelpButton ecpOrigin={ecpProps.ecpOrigin} helpRoom={helpRoom} />
        </div>
      </div>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        { routes.filter(({ component }) => component).map((route) => (
          <Route
            key={route.path}
            {...route}
            element={React.createElement(route.component, ecpProps)}
          />
        ))}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
};
