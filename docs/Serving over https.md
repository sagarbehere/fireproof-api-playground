#Serving your app with https

Here is one anecdotal way to serve the app with https when using npm and Vite on MacOS.

## Step 1

Install [Homebrew](https://brew.sh/) if you have not already done so. Then, install `mkcert` by typing the following in a terminal 

```sh
brew install mkcert
brew install nss # if using Firefox
```

## Step 2

Install a local certificate authority by typing the following in the terminal

```sh
mkcert -install
```

## Step 3

Create your certificate with mkcert

```sh
mkdir your_project/cert
cd your_project/cert
mkcert -key-file key.pem -cert-file cert.pem localhost
```

## Step 4

Update your vite config in `vite.config.ts`

```typescript
import fs from 'fs'
// other import statements

export default defineConfig({
  // ...
  server : {
    https: {
      key: fs.readFileSync(`${__dirname}/cert/key.pem`),
      cert: fs.readFileSync(`${__dirname}/cert/cert.pem`)
    },
    host: true,
    proxy: {}
  },
  // ...
})
```

## Step 5

Now run `npm run dev` and your app will be served over https. Your browser will probably warn you about a security risk when accessing the app URL, since this is a self-signed certificate. You'll need to select the option to continue despite the warning.