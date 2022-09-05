# Documentation support

This package contains a few examples to demonstrate the different ways of integrating the Symphony Embedded Collaboration Platform (ECP) in a website.
By default, all the demos in the repo will target `develop2.symphony.com`. If you want to target another environment, add the `origin` query parameter.
For instance, to target develop: `{demo-url}?origin=develop.symphony.com`. 

This repository does not contain any dev server by default, if you want to run the demo locally, you can simply open the html file in your browser or you can use any static file server such as [serve](https://github.com/vercel/serve).(Run npx serve in the src folder)

All the examples are slightly more complicated than the real implementation would be as they include a form to open ECP with the input parameters (stream ID / user IDs / user email) and the origin as query parameter.

***Unless you have specific constraints, you should use SDK Explicit mode integration.***

## Integrate ECP in an iframe - index-iframe.html
As simple as adding the ECP url in an iframe, with your custom settings as query parameters.

**This integration method is very limited, and should only be used for situations where using the SDK is impossible (e.g. when using an iframe widget in a third-party product)**
```html
<iframe src="https://develop2.symphony.com/embed/index.html?streamId={STREAM_ID}&mode=dark&condensed=true"></iframe>
```
## Integrate ECP using the SDK
ECP provides an SDK for you to better control the chat window. Plesae find below the various examples of how to use the sdk.

### Automatic mode - index-sdk-automatic.html
In automatic mode, the SDK will create the iframe for you so you just need to add the ECP script tag and create a div with the `symphony-ecm` class so the script can find it and add the iframe in it. 
In this case, the parameters will be added as `data-*` attributes to the div that will contain the iframe.

**This integration method is also limited, and is kept only for backwards compatibility with ECM.**
```html
<script id="symphony-ecm-sdk" src="https://develop2.symphony.com/embed/sdk.js"></script>
```
```html
<div class="symphony-ecm" 
  data-stream-id="{streamId}"
  data-mode="dark"
  data-condensed="true">
</div>
```

### Explicit mode 
In explicit mode, the SDK will not only add the iframe to DOM but also expose a list of functions for you to control the ECP chat instances.

**This is the recommended way to integrate ECP into your website.**

#### index-sdk-explicit.html
- Add the script tag with the `explicit` attribute:
```html 
 <script id="symphony-ecm-sdk" data-onload="onSdkLoaded" render="explicit" src="https://develop2.symphony.com/embed/sdk.js"></script>
```
Note that, as shown in the example above, you can also pass a function to the script using the `data-onload` attribute. This function will be called once the SDK is loaded and ready. See the `window.onSdkLoaded` below to render the application.
- Add the ECM container:
```html
<div class="symphony-ecm">
</div>
```
- Render ECP with the desired parameters:
```javascript
window.onSdkLoaded = () => {
  window.symphony.render('symphony-ecm', {streamId: 'STREAM_ID', mode:'dark', condensed: true})
}
```
- Update ECP: Use the SDK functions such as `openStream(streamId)` or `startRoom([userId1, userId2])` to switch to a different chat room, `updateSettings` to update the settings or `listen` to subscribe to chat notifications. 

#### With prefetch - index-sdk-prefetch.html
With the SDK in explicit mode and the functions described in the above example, you can easily prefetch the data and only display ECP once the chat is ready to be used or directly opened by the end user.
Note that the `window.symphony.render()` function returns a `Promise` that resolves when the chat is ready. 

#### Multiple chats- index-multiple-chats.html
The `openStream` and `startRoom` functions can take a second parameter in: a selector(string). With this parameter, the SDK will not override the main `.symphony-ecm` container but open a brand new chat in the corresponding container.
Let's assume ECP is already set up in explicit mode as shown above so we have access to `window.symphony` and ECP is already running in the frame embedded in `<div class="symphony-ecm"></div>`. 
Now I would like to open a new chat in another div: 
```html
<div id="another-ecp-chat">
</div>
```
```javascript
window.symphony.openStream('NEW_STREAM_ID', '#another-ecp-chat');
```
Or
```javascript
window.symphony.startRoom(['userId3'], '#another-ecp-chat');
```
