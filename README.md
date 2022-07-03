# skynet-plotting

## Getting Started
First, make sure you have installed [node](https://nodejs.org/en/) using [nvm](https://github.com/nvm-sh/nvm). If you are using Windows, I recommend [setting up Windows Subsystem for Linux](https://docs.microsoft.com/en-us/windows/wsl/install). Then [clone](https://docs.github.com/en/repositories/creating-and-managing-repositories/cloning-a-repository) this repository. Once cloned, run the following command to install required Node.js packages.
```bash
$ npm install
```
Now you can start a testing server that will automatically reload as you make changes.
```bash
$ npm start
```
To build the site for production
```bash
$ npm run build
```
which will place the bundled files in the `./dist` directory.

_The API urls are different for development and production. The switch is handled automatically by vite environment variable._

To use functionalities that require our backend server, for example in Cluster and Gravity, check out [@RuideFu](https://github.com/RuideFu)'s [skynet-plotting-server](https://github.com/UNC-Skynet/skynet-plotting-server), forked from [@finnsjames](https://github.com/finnsjames)'s [skynet-plotting-server](https://github.com/finnsjames/skynet-plotting-server).

*Note: `npm start` is a shortcut for `npm run start`. Any `npm run <your-script-name>` command (like the two we used here) is defined in the `scripts` section of `package.json`. Take a look by yourself! In other words, these are not some magic commands that npm has built-in, but rather some convenient "scripts" that we have defined.*

## Description
A graphing tool used by the OPIS! (Our Place In Space) and MWU! (The Multi-Wavelength Universe) [curricula](https://www.danreichart.com/curricula) at UNC Chapel Hill and many other institutions. Developed under the guidance of [Dr. Dan Reichart](https://www.danreichart.com/news).

![Light Curve](./pics/light-curve.png)
![Periodogram](./pics/periodogram.png)
![Period Folding](./pics/period-folding.png)
![Clustering](./pics/clustering.png)
![Dual](./pics/dual.png)
![Moon](./pics/moon.png)
![Scatter](./pics/scatter.png)
