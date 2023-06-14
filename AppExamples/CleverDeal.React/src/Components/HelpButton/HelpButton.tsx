import React from "react";
import Draggable from "react-draggable";
import { RoomIdMap } from "../../Models";
import './HelpButton.scss';

export interface HelpButtonProps {
    helpRoom : RoomIdMap;
    ecpOrigin: string;
};

export const HelpButton = (props : HelpButtonProps) => {
    const dialogRef = React.useRef(null);
    const minimisedRef = React.useRef(null);
    let dialog : HTMLDialogElement;
    let minimised : HTMLDivElement;

    const launchHelp = () => {
        dialog = (dialogRef.current as any);
        minimised = (minimisedRef.current as any);
        if (dialog.open) {
            dialog.close();
        } else {
            dialog.show();
            (window as any).symphony.openStream(props.helpRoom[props.ecpOrigin], '.help-ecp');
        }
    };

    const toggleHelp = () => {
        dialog.style.visibility = dialog.style.visibility === 'hidden' ? 'visible' : 'hidden';
        minimised.style.visibility = minimised.style.visibility === 'hidden' ? 'visible' : 'hidden';
    };

    return (
        <>
            <button
                className="help-button"
                onClick={launchHelp}
            >
                Help
            </button>
            <Draggable nodeRef={dialogRef}>
                <dialog id="help-dialog" ref={dialogRef}>
                    <div className="app-bar">
                        <div>Help</div>
                        <div className="action-buttons">
                            <div className="minimise" onClick={toggleHelp}>_</div>
                            <div className="close" onClick={() => (dialogRef.current as any).close()}>x</div>
                        </div>
                    </div>
                    <div className="help-ecp"></div>
                </dialog>
            </Draggable>
            <div className="minimised" ref={minimisedRef} onClick={toggleHelp} style={{ visibility: 'hidden' }}>
                Help Chat
            </div>
        </>
    );
};
