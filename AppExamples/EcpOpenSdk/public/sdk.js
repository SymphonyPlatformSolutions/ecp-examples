/**
 * CUSTOM ECP SDK
 * 
 * This file corresponds to a basic implementation of a Symphony ECP SDK.
 * 
 * SDK features:
 * - render chat in iframe
 * - update a existing iframe to render another chat
 * - update all the rendered chat settings
 * - send message
 * - listen to message notifications (unread and new)
 */

// ---------
// CONSTANTS
// ---------

const ECP_MAIN_PATH = '/apps/embed/default';
const ECP_CHILD_PATH = '/apps/embed/default/frame-root.html';
const MAIN_FRAME_ID = 'symphony-main-frame';
const MAIN_FRAME_CONTAINER = 'symphony-main-frame-container';
const DEFAULT_SETTINGS = 'allowChatCreation=true&canAddPeople=false&canClickExternalLinks=false&canClickInternalLinks=false&condensed=true&condensedMessageBelowName=true&ecpLoginPopup=false&mode=dark&showAttach=true&showBookmarkMessage=true&showChatSearch=true&showCompose=true&showDisableInput=true&showEditor=true&showEmoji=true&showInfo=true&showMembers=true&showHashTagPopover=false&showCashTagPopover=true&showProfilePopover=true&showSuppressMessage=true&showSystemMessages=false&showTitle=true&showXPod=true&sound=false&storageAccessPrompt=false&symphonyLogo=true';

// ---------
// VARIABLES
// ---------

let sdkConfiguration = {};
let isMainFrameLoaded = false;
let childFrameCount = 0;
let subscriptionCallbacks = {}; // { [id]: callbackFn }
let actionId = 0;

// --------------
// FRAME HANDLING
// --------------

const iframeContainer = (iframe, id) => {
    const iframeContainer = document.createElement('div');
    if (id) {
        iframeContainer.id = id;
    }
    iframeContainer.className = "frame-container";
    iframeContainer.appendChild(iframe);
    return iframeContainer;
}

/**
 * Initializes the SDK main frame which renders the given chat on the given pod, and injects the frame in the given DOM container.
 */
const initMainFrame = (streamId, containerId) => {
    const { podUrl, partnerId } = sdkConfiguration;
    const container = document.getElementById(containerId);

    // create main frame
    const iframe = document.createElement('iframe');
    const iframeUrl = new URL(`${podUrl}${ECP_MAIN_PATH}?${DEFAULT_SETTINGS}`);
    iframeUrl.searchParams.append("embed", "true");
    iframeUrl.searchParams.append("partnerId", partnerId); // allows you to load Symphony (for production pod only)
    iframeUrl.searchParams.append("streamId", streamId); // loads the desired chat
    iframeUrl.searchParams.append("sdkOrigin", window.location.origin); // allows ECP to send us messages (requires this file to be hosted)
    iframe.src = iframeUrl.href;
    iframe.id = MAIN_FRAME_ID;
    iframe.style.height = '100%';
    iframe.style.width = '100%';

    // inject the main frame
    container.appendChild(iframeContainer(iframe));
}

/**
 * Initializes a child frame which renders the given chat on the given pod, and injects the frame in the given DOM container.
 */
const initChildFrame = (streamId, containerId) => {
    const { podUrl } = sdkConfiguration;
    const container = document.getElementById(containerId);

    // compute ids
    const frameId = childFrameCount++;
    const frameContainerId = `symphony-child-${frameId}`;

    // create the iframe
    const iframe = document.createElement('iframe');
    const iframeUrl = new URL(`${podUrl}${ECP_CHILD_PATH}`);
    iframeUrl.hash = frameContainerId;
    iframe.src = iframeUrl.href;
    iframe.style.height = '100%';
    iframe.style.width = '100%';

    // when the iframe is loaded, register it to ECP and then render the desired chat
    iframe.addEventListener(
        'load',
        () => {
            postEcpMessage('sdk-register', { iFrameId: frameContainerId })
            setStream(streamId, frameContainerId);
        },
        { once: true },
    );

    // inject the iframe
    container.appendChild(iframeContainer(iframe, frameContainerId));
}

// -----------------
// ECP COMMUNICATION
// -----------------

/**
 * Posts a message to ECP (always through the main frame)
 */
const postEcpMessage = (eventType, payload) => {
    const { podUrl } = sdkConfiguration;
    const iframe = document.getElementById(MAIN_FRAME_ID);
    return iframe.contentWindow.postMessage({ eventType, payload }, podUrl);
};

/**
 * ECP message listener.
 */
const onEcpMessage = (e) => {
    const { podUrl, onReady } = sdkConfiguration;
    if (e.origin !== podUrl) {
        return;
    }

    const { eventType, payload } = e.data;

    switch (eventType) {
        // main frame loaded and user logged in
        case 'clientReady': {
            console.log(`SDK is ready !`);
            isMainFrameLoaded = true;
            onReady?.();
            break;
        }

        // in response of each sdk-action
        case 'sdk-resolve': {
            // error handling
            if (payload?.data?.error) {
                const { type, message } = payload.data.error;
                const errorMessage = `[${type}] ${message}`;
                console.error(errorMessage);
                alert(errorMessage);
            } else {
                console.log(`sdk-action with id "${payload.id}" was successful !`);
            }
            break;
        }

        // sent everytime a subscription callback should be triggered
        case 'sdk-callback-data': {
            const { id, data } = payload;
            subscriptionCallbacks[id]?.(data);
            break;
        }

        default: {
            console.log(`Received event is not supported: ${eventType}`);
        }
    }
};

// --------
// SDK APIs
// --------

/**
 * Returns true if the given parameters are properly set, otherwise prints an error message.
 */
const checkRequiredParams = (params) => {
    const keys = Object.keys(params);
    for (var i in keys) {
        const value = params[keys[i]];
        if (!value) {
            keysStr = keys.join(", ");
            const errorMessage = `This action requires the following parameters: ${keysStr}.`;
            console.error(errorMessage);
            alert(errorMessage);
            return false;
        }
    }
    return true;
}

/**
 * Renders a Symphony chat in a given DOM container.
 * If it's the first render, we initialise the ECP event listener.
 */
const openStream = (streamId, containerId) => {
    const { podUrl } = window.sdk.configuration;

    if (!checkRequiredParams({ podUrl, streamId })) {
        return;
    }

    const container = document.getElementById(containerId);
    const isMainFrame = containerId === MAIN_FRAME_CONTAINER;

    if (isMainFrame) {
        if (!isMainFrameLoaded) {
            // save configuration
            sdkConfiguration = window.sdk.configuration;
            // listen to ECP events
            window.addEventListener('message', onEcpMessage, false);
            // initialise the main frame
            initMainFrame(streamId, containerId);
        } else {
            // if main frame is already loaded then just update the target chat
            setStream(streamId);
        }
    } else {
        // initialise a new frame and make it render the desired chat
        initChildFrame(streamId, containerId);
    }
}


/**
 * Updates the rendered chat of an existing frame.
 * If the containerId is not provided, the target frame is the main frame.
 */
const setStream = (streamId, containerId) => {
    if (!checkRequiredParams({ streamId })) {
        return;
    }

    postEcpMessage('sdk-action', {
        name: 'set-stream',
        id: `set-stream-${++actionId}`,
        params: {
            streamId,
            container: containerId ? `#${containerId}` : undefined
        },
    });
}

/**
 * Updates the ECP configuration for all the existing and future frames.
 */
const updateSettings = (settings) => {
    if (!checkRequiredParams({ settings })) {
        return;
    }

    postEcpMessage('sdk-action', {
        name: 'set-settings',
        id: `set-settings-${++actionId}`,
        params: settings,
    });
}

/**
 * Triggers the send message dialog in the given frame.
 * The dialog is pre-filled with the provided message and the target stream ids.
 * If the containerId is not provided, the target frame is the main frame.
 */
const sendMessage = (streamId, message, containerId) => {
    if (!checkRequiredParams({ streamId, message })) {
        return;
    }

    postEcpMessage('sdk-action', {
        name: 'send-message',
        id: `send-message-${++actionId}`,
        params: {
            message,
            options: {
                mode: 'blast',
                streamIds: [streamId],
                container: containerId ? `#${containerId}` : undefined,
            }
        },
    });
}

/**
 * Runs the given callback when ECP triggers a new message notification.
 * If a stream id is provided, the callback is only run when the notifications occurs in the given stream.
 * Otherwise, it is called for any stream of the logged-in user.
 */
const onMessageNotification = (callback, streamId) => {
    if (!checkRequiredParams({ callback })) {
        return;
    }

    const message = `Listening to ${streamId || "all the"} message notifications.`;
    alert(message);
    console.log(message);

    const id = 'message-notification-' + streamId;

    postEcpMessage('sdk-subscription', {
        type: 'MessageNotifications',
        id,
        params: { streamId },
    });

    // store notification callback in our SDK
    subscriptionCallbacks[id] = callback;
};

/**
 * Runs the given callback when ECP triggers an unread message count notification.
 * If a stream id is provided, the callback is only run when the notifications occurs in the given stream.
 * Otherwise, it is called for any stream of the logged-in user.
 */
const onUnreadCountNotification = (callback, streamId) => {
    if (!checkRequiredParams({ callback })) {
        return;
    }

    const message = `Listening to ${streamId || "all the"} unread message count notifications.`;
    alert(message);
    console.log(message);

    const id = 'unread-notification-' + streamId;

    postEcpMessage('sdk-subscription', {
        type: streamId ? 'UnreadCountNotifications' : 'GlobalUnreadCountNotifications',
        id,
        params: { streamId },
    });

    // store notification callback in our SDK
    subscriptionCallbacks[id] = callback;
};

// Inject SDK APIs to be used outside of this file
window.sdk = {
    configuration: {},
    openStream,
    setStream,
    updateSettings,
    sendMessage,
    onMessageNotification,
    onUnreadCountNotification,
};
