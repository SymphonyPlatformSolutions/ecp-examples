import "./HelpButton.scss";
import { botUserId, helpMessages } from "../../Data/help";
import { useLocation } from "react-router-dom"
import { useRef, useState } from "react";
import Draggable from "react-draggable";

export interface HelpButtonProps {
  ecpOrigin: string;
}

export const HelpButton = (props: HelpButtonProps) => {
  const location = useLocation();
  const maxDialogRef = useRef(null);
  const [ dialogRefs ] = useState([ useRef(null), useRef(null) ]);
  const [ minimisedRefs ] = useState([ useRef(null), useRef(null) ]);
  const [ currentSlot, setCurrentSlot ] = useState(0);
  const [ chatIndex, setChatIndex ] = useState(1);
  const [ chatIndexes, setChatIndexes ] = useState([ 0, 0 ]);

  const helpDialogVisible = () => {
    const dialog1 = dialogRefs[0].current as any;
    const dialog2 = dialogRefs[1].current as any;
    return (
      (dialog1.open && dialog1.style.visibility === "visible") ||
      (dialog2.open && dialog2.style.visibility === "visible")
    );
  };

  const launchHelp = () => {
    const isFullCollab = location.pathname === '/wealth';

    if (helpDialogVisible()) {
      return;
    }
    if (currentSlot > 1) {
      (maxDialogRef.current as any).showModal();
      return;
    }

    const updatedChatIndexes = [...chatIndexes];
    updatedChatIndexes[currentSlot] = chatIndex;
    setChatIndexes(updatedChatIndexes);

    if (!isFullCollab) {
      const dialog = dialogRefs[currentSlot].current as any;
      dialog.show();
    }

    setCurrentSlot((old) => old + 1);
    setChatIndex((old) => old + 1);

    const now = new Date();
    const roomName = `Clever Help ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`;
    const message = {
      text: {
        'text/markdown': '/menu ecp-help-demo-' + helpMessages[location.pathname],
      },
    };
    const options = {
      message,
      external: props.ecpOrigin === 'corporate.symphony.com',
      silent: true,
    };
    const botId = botUserId[props.ecpOrigin];

    const symphony = (window as any).symphony;
    if (!isFullCollab) {
      symphony.createRoom(roomName, [ botId ], options, `.help-ecp-${currentSlot}`);
    } else {
      symphony.createRoom(roomName, [ botId ], options);
    }
  };

  const toggleHelp = (slot: number) => {
    const dialog = dialogRefs[slot].current as any;
    const minimised = minimisedRefs[slot].current as any;
    dialog.style.visibility =
      dialog.style.visibility === "hidden" ? "visible" : "hidden";
    minimised.style.display =
      minimised.style.display === "none" ? "block" : "none";
  };

  const closeHelp = (slot: number) => {
    const ref: any = dialogRefs[slot].current;
    if (ref) {
      ref.close();
    }
    setCurrentSlot(slot);
  };

  const getHelpDialog = (slot: number, ref: any) => (
    <Draggable nodeRef={ref} key={`dialog-${slot}`}>
      <dialog className="help-dialog" ref={ref}>
        <div className="app-bar">
          <div>Help Chat {chatIndexes[slot]}</div>
          <div className="action-buttons">
            <div className="minimise" onClick={() => toggleHelp(slot)}>
              _
            </div>
            <div className="close" onClick={() => closeHelp(slot)}>
              x
            </div>
          </div>
        </div>
        <div className={`help-ecp help-ecp-${slot}`}></div>
      </dialog>
    </Draggable>
  );

  const getMinimised = (slot: number, ref: any) => (
    <div
      key={`minimised-${slot}`}
      ref={ref}
      className="minimised"
      onClick={() => toggleHelp(slot)}
      style={{ display: "none" }}
    >
      Help Chat {chatIndexes[slot]}
    </div>
  );

  return (
    <>
      <button className="button" onClick={launchHelp}>
        Help
      </button>

      {[1, 0].map((i) => getHelpDialog(i, dialogRefs[i]))}

      <div className="minimised-bar">
        {[1, 0].map((i) => getMinimised(i, minimisedRefs[i]))}
      </div>

      <dialog className="max-dialog" ref={maxDialogRef}>
        <div>You can only have a maximum of 2 help chats open at any time</div>
        <button
          className="button"
          onClick={() => (maxDialogRef.current as any).close()}
        >
          OK
        </button>
      </dialog>
    </>
  );
};
