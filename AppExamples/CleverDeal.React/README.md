# Clever Deal application

This application just aims to show how to integrate ECP into a React application. It relies on fake data and will target some preset steam ids that you can modify in the data folder.

## Build the project

- run the command:

```sh
yarn install
```

## Run against corporate.symphony.com

- run the app with:

```sh
yarn start
```

- open http://localhost:3000/

## Run against st3.symphony.com

- run the app with:

```sh
HTTPS=true yarn start
```

- open https://localhost:3000/?ecpOrigin=st3.symphony.com&partnerId=3

## Query params

- `ecpOrigin`: URL of the target pod to be loaded in ECP (supported values are `corporate.symphony.com` [default], `st3.symphony.com` or `preview.symphony.com`)
- `partnerId`: loads ECP with a given partnerId, useful if your environment has partnership configurations (use partnerId=3 to allow Symphony to be loaded on localhost)
- `sdkPath`: used to target a specific version of ECP (supported values are `/embed/sdk.js` [default] and `/apps/embed/{tag}/sdk.js`)

### Run against ECP (SFE-Lite) running locally

```sh
HTTPS=true yarn start
```

- go to https://localhost:3000/?ecpOrigin=local-dev.symphony.com:9090&sdkPath=/client-bff/sdk.js
