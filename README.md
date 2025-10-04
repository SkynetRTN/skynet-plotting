# Skynet Plotting

## Description
A graphing tool used by the OPIS! (Our Place In Space) and MWU! (The Multi-Wavelength Universe) [curricula](https://www.danreichart.com/curricula) at UNC Chapel Hill and many other institutions. Developed under the guidance of [Dr. Dan Reichart](https://www.danreichart.com/news).

![Light Curve](./pics/light-curve.png)
![Periodogram](./pics/periodogram.png)
![Period Folding](./pics/period-folding.png)
![Clustering](./pics/clustering.png)
![Dual](./pics/dual.png)
![Moon](./pics/moon.png)
![Scatter](./pics/scatter.png)

## Getting Started
The Skynet Plotting project relies on `Node.js`. The installation varies
depending on your operating system. However, once `Node.js` is installed,
the project setup is independent of the operating system.

### Installing Node.js on Windows
Install [Fast Node Manager (fnm)](https://github.com/Schniz/fnm).
```bash
winget install Schniz.fnm
```

You may need to close and reopen your terminal before continuing.

Environment variables need to be setup before you can start using fnm. 
This is done by evaluating the output of fnm env.
```bash
eval "$(fnm env --use-on-cd)"
```
`Note: the above command assumes that you're using git bash. See the fnm 
repo for instruction with other terminals.`

Download and install Node.js
```bash
fnm use --install-if-missing 20
```

To verify that everything worked, run `node -v`. You should see the
version output.

### Installing Node.js on Linux or Mac
Install [Node Version Manager (nvm)](https://github.com/nvm-sh/nvm).
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
```

Download and install Node.js
```bash
nvm install 20
```

To verify that everything worked, run `node -v`. You should see the
version output.

### Setup
Clone the repository.

```bash
clone https://github.com/SkynetRTN/skynet-plotting.git
```
Install the required Node.js packages.
```bash
$ npm install
```

Start a testing server that will automatically reload as you make changes.
```bash
$ npm start
```

### Preparing for Production
Build the site. This will place the bundled files in the `./dist` directory.
```bash
$ npm run build
```

_The API urls are different for development and production. The switch is handled automatically by vite environment variable._

### Using the Server Companion
To use functionalities that require our backend server, for example in Cluster and Gravity, check out [@RuideFu](https://github.com/RuideFu)'s [skynet-plotting-server](https://github.com/UNC-Skynet/skynet-plotting-server), forked from [@finnsjames](https://github.com/finnsjames)'s [skynet-plotting-server](https://github.com/finnsjames/skynet-plotting-server).

*Note: `npm start` is a shortcut for `npm run start`. Any `npm run <your-script-name>` command (like the two we used here) is defined in the `scripts` section of `package.json`. Take a look by yourself! In other words, these are not some magic commands that npm has built-in, but rather some convenient "scripts" that we have defined.*
