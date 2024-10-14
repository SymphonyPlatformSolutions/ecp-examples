import { App } from './Components/App';
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ThemeProvider } from './Theme/ThemeProvider';
import CleverWealth from './Components/CleverWealth';
import ContentDistribution from './Components/ContentDistribution';
import React from 'react';
import ReactDOM from 'react-dom';


ReactDOM.render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <Routes>
          <Route path="wealth" element={<CleverWealth />} />
          <Route path="*" element={<App />} />
          <Route path="content" element={<ContentDistribution />} />
        </Routes>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>,
  document.getElementById('root')
);
