import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

const DEFAULT_ORIGIN: string = "corporate.symphony.com";

const loadSdk = (
  ): Promise<void> => {
    return new Promise<void>((resolve) => {
      const sdkScriptNode = document.createElement('script');
      sdkScriptNode.src = `https://${DEFAULT_ORIGIN}/embed/sdk.js`;
      sdkScriptNode.id = 'symphony-ecm-sdk';
      sdkScriptNode.setAttribute('render', 'explicit');
      (window as any).renderRoom = () => {
        (window as any).symphony
          .render('symphony-ecm', {
            showTitle: false,
            ecpLoginPopup: true
          }).then(() => {resolve();});
      };
      sdkScriptNode.setAttribute('data-onload', 'renderRoom'); // Will call window.renderRoom once initialized
      document.body.appendChild(sdkScriptNode);
    });
  };

root.render(
  <React.StrictMode>
    <App chatReady={loadSdk()}/>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
