import React from 'react';
import logo from './logo.svg';
import './App.css';
import { SidePane } from "react-side-pane";

export interface AppProps {
  chatReady: Promise<any>;
}

export const App = (props: AppProps) => {
  const [open, dispatchOpen] = React.useReducer((_open) => !_open, false);
  const [name, setName] = React.useState('');
  const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setName(event.target.value)
  }
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.tsx</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
        <input type="text" value={name} onChange={handleNameChange}/>
        <button onClick={dispatchOpen}>Open pane</button>
      </header>
      <SidePane open={open} width={33} onClose={dispatchOpen}>
        <>
          <Chat userIds={[name]}></Chat>
        </>
      </SidePane>
    </div>
  );
}

export interface ChatProps {
  userIds: string[];
}

export const Chat = (props: ChatProps) => {
  const [chatId, setChatId] = React.useState(`pane-chat-${Date.now()}`);
  React.useEffect(() => {
    (window as any).symphony.startRoom(props.userIds, `#${chatId}`)
  }, [chatId]);
  return (
    <div className="panel-container">
      <h3>Symphony chat with {props.userIds.join(',')}</h3>
      <div className="symphony-pane-chat" id={chatId}></div>
    </div>
  ) 
}

export default App;
