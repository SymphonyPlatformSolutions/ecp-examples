# ECP OPEN SDK

This document provides a detailed guide for building and using a custom Embedded Collaboration Platform (ECP) SDK with Symphony.

- [SDK code example](#sdk-code-example)
  - [Run the example](#run-the-sdk-example)
  - [Play with the example](#play-with-the-example)
- [Create your own ECP SDK](#create-your-own-ecp-sdk)
  - [Embedding a Symphony chat](#embedding-a-symphony-chat)
  - [Listening to ECP events](#listening-to-ecp-events)
  - [Rendering multiple chats](#rendering-multiple-chats)
  - [Updating the configuration](#updating-the-configuration)
  - [Updating the rendered chat](#updating-the-rendered-chat)
  - [Sending messages](#sending-messages)
  - [Receiving notifications](#receiving-notifications)
    - [Unread message count notifications](#unread-message-count-notifications)
    - [New message notifications](#new-message-notifications)
    - [Handle notifications](#handle-notifications)

## SDK code example

### Run the example

The SDK code example requires npm to be installed on your machine.
For installing npm, please refer to [NPM JS documentation](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm).

By default, the example is running on port `8080`, make sure this port is available before launching or update the `package.json` accordingly.

Build the app:

```bash
npm install
```

Launch the app:

```bash
npm start
```

### Play with the example

Once the application is up and running, fill the configuration fields with your Symphony Pod URL and your Symphony Partner ID.

To render a first chat, provide the stream ID of the chat to be rendered and click "Open in main frame".
This will initialize the SDK and render the desired chat in the page.
Once SDK is initialized, you can fully play with the SDK through all the action buttons.

In this example, the SDK (`sdk.js`) defines and exposes the following methods used to interact with Symphony:

- `openStream`: renders a Symphony chat in an iframe
- `setStream`: updates the rendered chat of an iframe
- `updateSettings`: updates the configuration of all the existing and new chats
- `sendMessage`: displays the send message dialog in a chat
- `onMessageNotification`: executes a given callback when a message notification is received
- `onUnreadCountNotification`: executes a given callback when an unread count notification is received

---

---

## Create your own ECP SDK

### Embedding a Symphony chat

To embed a Symphony chat, add an iframe element to the DOM with a unique `id` and a `src` attribute in the following format:

```
https://{myPodUrl}/apps/embed/default?embed=true&partnerId={myPartnerId}&streamId={myStreamId}
```

Where:

- `podUrl` is the URL of your Symphony pod
- `partnerId` is a unique identifier provided by Symphony (not required when targeting UAT pods)
- `streamId` is the ID of the chat to render

This iframe will be referred to as the **main frame**. Any additional iframe is referred to as a **child frame** and will be registered using the main iframe.

You can customize the chat by adding query parameters to the src attribute. For example, to enable dark mode and disable notification sounds:

```
https://{myPodUrl}/apps/embed/default?embed=true&partnerId={myPartnerId}&streamId={myStreamId}&mode=dark&sound=false
```

For a complete list of available settings, refer to the [Symphony ECP settings documentation](https://docs.developers.symphony.com/embedded-modules/embedded-collaboration-platform/configuration-parameters#ecp-settings).

The login process is handled automatically within the iframe, showing a login interface if the user is not authenticated.

The entire Symphony application can also be rendered using this URL as `src` attribute:

```
https://{myPodUrl}/apps/client2/default?embed=true&partnerId={myPartnerId}&streamId={myStreamId}
```

### Listening to ECP events

ECP interacts with the SDK through `postMessage` events. ECP main events allow to:

- detect that main frame is fully loaded and ECP is ready for interaction
- receive a response after any ECP API call
- be notified when a subscription callback is triggered (new and unread message notifications)

To make our SDK listening to ECP events, use the following code:

```js
const onEcpMessage = (e) => {
  if (e.origin !== myPodUrl) {
    return;
  }

  const { eventType, payload } = e.data;
  switch (eventType) {
    // sent when ECP has loaded Symphony in the main frame
    case "clientReady": {
      console.log("SDK is ready!");
      break;
    }
    // in response of each ECP API call
    case "sdk-resolve": {
      if (payload.data.error) {
        const { type, message } = payload.data.error;
        console.error(`[${type}] ${message}`);
      } else {
        console.log(`sdk-action with id "${payload.id}" was successful`);
      }
      break;
    }
    // sent every time a subscribed ECP notification event has been triggered
    case "sdk-callback-data": {
      const { id, data } = payload;
      console.log(`[${id}] ${JSON.stringify(data)}`);
      break;
    }
    default: {
      console.log(`Received event is not supported: ${eventType}`);
    }
  }
};

window.addEventListener("message", onEcpMessage, false);
```

### Rendering multiple chats

To render multiple chats simultaneously, start by [embedding a main frame](#embedding-a-symphony-chat) as described above. Additional chats can be embedded as child frames by following these steps:

1. Create a new iframe with the `src` attribute pointing to:

```
https://{myPodUrl}/apps/embed/default/frame-root.html#iframe-container-id
```

Here, `iframe-container-id` refers to the DOM element id where the child frame will be injected.

2. Register the child iframe to ECP once it's fully loaded:

```js
const onIframeLoaded = () => {
  const mainIframe = document.getElementById("main-frame-id");

  // register child frame
  let data = {
    eventType: "sdk-register",
    payload: { iFrameId: "iframe-container-id" },
  };
  mainIframe.contentWindow.postMessage(data, myPodUrl);

  // render chat in child frame
  data = {
    eventType: "sdk-action",
    payload: {
      name: "set-stream",
      params: {
        streamId: "myStreamId",
        container: "#iframe-container-id", // do not forget the '#'
      },
    },
  };
  mainIframe.contentWindow.postMessage(data, myPodUrl);
};

childIframe.addEventListener("load", onIframeLoaded, { once: true });
```

3. Inject the child iframe in the DOM:

```js
document.getElementById("iframe-container-id").appendChild(childIframe);
```

### Updating the configuration

To update the chat's configuration, call ECP through the main iframe using the following code:

```js
const iframe = document.getElementById("main-frame-id");

const data = {
  eventType: "sdk-action",
  payload: {
    name: "set-settings",
    id: "set-settings-id", // optional - used by ECP to identify the request
    params: {
      mode: "dark",
      showTitle: false,
      // any other setting...
    },
  },
};

iframe.contentWindow.postMessage(data, myPodUrl);
```

A full list of configurable settings is available in the [Symphony ECP settings documentation](https://docs.developers.symphony.com/embedded-modules/embedded-collaboration-platform/configuration-parameters#ecp-settings).

Once this `sdk-action` message is posted, ECP responds with a `sdk-resolve` message which indicates wether the action is successful or not.
This response message payload includes the provided request `id` (`set-settings-id` here) to identify the initial action request.

### Updating the rendered chat

To change the rendered chat in a frame, post the following message through the main iframe:

```js
const iframe = document.getElementById("main-frame-id");

const data = {
  eventType: "sdk-action",
  payload: {
    name: "set-stream",
    id: "set-stream-id", // optional - used by ECP to identify the request
    params: {
      streamId: "anotherStreamId",
      container: "#iframe-container-id", // optional
    },
  },
};

iframe.contentWindow.postMessage(data, myPodUrl);
```

Please note that `container` parameter corresponds to a child iframe container id. If not provided, the target frame is the main frame.

Once this `sdk-action` message is posted, ECP responds with a `sdk-resolve` message which indicates wether the action is successful or not.
This response message payload includes the provided request `id` (`set-stream-id` here) to identify the initial action request.

### Sending messages

To trigger the send message dialog in a frame, post the following message through the main iframe:

```js
const iframe = document.getElementById("main-frame-id");

const data = {
  eventType: "sdk-action",
  payload: {
    name: "send-message",
    id: "send-message-id", // optional - used by ECP to identify the request
    params: {
      message: "Hello!",
      options: {
        mode: "blast",
        streamIds: ["myStreamId"],
        container: "#iframe-container-id", // optional - main frame if undefined
      },
    },
  },
};

iframe.contentWindow.postMessage(data, myPodUrl);
```

Refer to the [Symphony send message documentation](https://docs.developers.symphony.com/embedded-modules/embedded-collaboration-platform/send-a-message) for additional details on message properties.

Once this `sdk-action` message is posted, ECP responds with a `sdk-resolve` message which indicates wether the action is successful or not.
This response message payload includes the provided request `id` (`send-message-id` here) to identify the initial action request.

### Receiving notifications

ECP supports subscribing to various types of notification, such as unread message counts and new message notifications.

Once subscribed to these notifications, the SDK will receive a `sdk-callback-data` ECP event each time a subscribed event is triggered (see [Listening to ECP events](#listening-to-ecp-events) section). The event payload will include the `id` provided during the subscription and any relevant data from the notification.
The event payloads are fully described in the [Symphony ECP notifications documentation](https://docs.developers.symphony.com/embedded-modules/embedded-collaboration-platform/notifications).

#### Unread message count notifications

To subscribe to global unread message count notifications:

```js
const iframe = document.getElementById("main-frame-id");

const data = {
  eventType: "sdk-subscription",
  payload: {
    type: "GlobalUnreadCountNotifications",
    id: "subscription-id",
  },
};

iframe.contentWindow.postMessage(data, myPodUrl);
```

For chat-specific unread message count notifications, use:

```js
const iframe = document.getElementById("main-frame-id");

const data = {
  eventType: "sdk-subscription",
  payload: {
    type: "UnreadCountNotifications",
    id: "subscription-id",
    params: {
      streamId: "streamIdToListen",
    },
  },
};

iframe.contentWindow.postMessage(data, myPodUrl);
```

#### New message notifications

To subscribe to new message notifications:

```js
const iframe = document.getElementById("main-frame-id");

const data = {
  eventType: "sdk-subscription",
  payload: {
    type: "MessageNotifications",
    id: "subscription-id",
    params: {
      streamId: "streamIdToListen", // optional - target all the streams if undefined
    },
  },
};

iframe.contentWindow.postMessage(data, myPodUrl);
```

#### Handle notifications

To execute code when a notification is received, the SDK first need to store a callback during the subscription process and then trigger it when `sdk-callback-data` ECP event is received.

1. Register callback at subscription:

```js
// subscription callback collection
const subscriptionCallbacks = {};

const onNotification = (streamId, callback) => {
  const subscriptionId = `subscription-${streamId}`;

  // subscribe to a notification (as described in above sections)
  subscribeToNotifications(subscriptionId, streamId);

  // store the callback
  subscriptionCallbacks[subscriptionId] = callback;
};
```

2. Trigger callback when the [ECP event listener](#listening-to-ecp-events) receives the notification:

```js
switch (eventType) {
  // [...]
  case "sdk-callback-data": {
    const { id, data } = payload;
    const callback = subscriptionCallbacks[id];
    callback?.(data); // execute callback
    break;
  }
  // [...]
}
```
