import { App } from './Components/App';
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ThemeProvider } from './Theme/ThemeProvider';
import CleverWealth from './Components/CleverWealth';
import React from 'react';
import ReactDOM from 'react-dom';

ReactDOM.render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <Routes>
          <Route path="wealth" element={<CleverWealth />} />
          <Route path="*" element={<App />} />
        </Routes>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>,
  document.getElementById('root')
);
