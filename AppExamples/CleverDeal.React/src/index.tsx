import React from 'react';
import ReactDOM from 'react-dom';
import './index.scss';
import App from './App';
import reportWebVitals from './reportWebVitals';


const DEFAULT_ORIGIN: string = "corporate.symphony.com";
const originInParams = (new URL(window.location.href)).searchParams.get('ecpOrigin');

const loadSdk = (
): Promise<void> => {
  return new Promise<void>((resolve) => {
    const sdkScriptNode = document.createElement('script');
    sdkScriptNode.src = `https://${originInParams || DEFAULT_ORIGIN}/embed/sdk.js`;
    sdkScriptNode.id = 'symphony-ecm-sdk';
    sdkScriptNode.setAttribute('render', 'explicit');
    (window as any).renderRoom = () => {
      (window as any).symphony
        .render('symphony-ecm', {
          showTitle: false,
          ecpLoginPopup: true
        }).then(() => {resolve();});
    };
    sdkScriptNode.setAttribute('data-onload', 'renderRoom');
    document.body.appendChild(sdkScriptNode);
  });
};

ReactDOM.render(
  <React.StrictMode>
    <App sdkLoaded={loadSdk()} ecpOrigin={originInParams || DEFAULT_ORIGIN}/>
  </React.StrictMode>,
  document.getElementById('root')
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
