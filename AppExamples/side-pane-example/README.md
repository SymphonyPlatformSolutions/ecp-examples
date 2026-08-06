# Basic ECP explicit mode example with React

## Context

The aim of this application is to show how to use ECP in a React environment. This very simple application only adds an email input field and an "open" button to open an ECP chat window with the given user.
It uses the ECP explicit rendering mode so it can keep ECP up and running in a "master" window even though the actual chat window (child) is not created yet or has been closed. For demo purposes, again, the master window will remain open at the bottom left of the screen to show that this one is not used and is only meant to keep the ECP logic running. Then, everytime the user clicks on the open button, we create a new div that will embed a new child chat with the given user.

## HOWTO

This application has been done in very few steps that we resume below:

- Create the application using the Create React App script (see reference at the end of this file)
- Add the main ECP container in the index.html file so it's always on screen (you can of course hide in a real application):
```HTML
  <div class="ecp-main-hidden-frame symphony-ecm" data-ecp-login-popup="true" id="symphony-ecm"></div>
```
- Load the ECP SDK, in index.tsx, before even rendering the React application:
```Typescript
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
            // Add initial ECP parameters here
            showTitle: false,
            ecpLoginPopup: true
          }).then(resolve);
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
```
Here the `loadSdk` function returns a `Promise` that resolves when ECP is ready to be displayed (When the SDK `render` function resolves). This promise is passed to the `App` component as `Props` in case the app want to know when the chat is ready to be displayed. This is not mandatory and we don't use in our App component in this example. 
- Add your logic to know when to open the chat, where and with which options (streamId / userIds)
In our case, it's just a simple input and an open button. The input button lets the user enter an email address, the open button opens the side panel containing the chat.
See the details if needed in the `App` component in `App.tsx`.
- The `Chat` component in the `App.tsx` file holds the logic to open the chat:
```Typescript
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
```
As you can see, the component is very simple. All it does is adding a div to the DOM that will contain the ECP chat window. **ECP will keep track of all the containers you pass it, so if you give ECP an existing container, it will not create the iframe but just update its content**. In our case the container is deleted everytime the panel is closed, so we need to create a unique ID so ECP recreated an iframe everytime we open a panel: `pane-chat` suffixed with the timestamp.
Once our div is ready, all we need to do is to tell ECP to `startRoom` with the given userIds: 
```Typescript
window.symphony.startRoom(props.userIds, `#${chatId}`)
```


## Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

### Available Scripts

In the project directory, you can run:

#### `yarn start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

#### `yarn build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).
