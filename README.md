# skynet-plotting

## Known problems

**Important!** There is a problem with the npm package `piexif-ts` that declares nonexistent files in its `package.json` file. As a result, Snowpack will try to locate files that do not exist and cause build to fail.

I was not able to find a solution for this in Snowpack's config file yet. For now, a workaround would be running
```bash
npm run fix-piexif
```
**after** running `npm install`, which replaces the `package.json` file for `piexif-ts` with a custom, corrected version of the file.

## Getting Started
Once cloned, run the following command to install required Node.js packages.
```bash
$ npm install
```
Now you can start a testing server that will automatically reload as you make changes.
```bash
$ npm start
```
To build the site, run
```bash
$ npm run build
```
which will place the bundled files in the `./dist` directory.

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
