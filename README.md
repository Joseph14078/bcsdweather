# BCSD Weather

The official BCSD weather app! Developed by students, using school-generated data and information pulled from the National Weather Service.

## Dependencies

* node.js
* npm
* grunt-cli
* ruby
* sass
* cordova (For Android builds only)
* Android SDK and proper components (For Android builds only, see below)

Make sure to follow the [Cordova Android Platform Guide](https://cordova.apache.org/docs/en/latest/guide/platforms/android/index.html) to ensure Cordova has its dependencies satisfied.

### Ubuntu

In terminal:

~~~
sudo apt-get install nodejs nodejs-legacy ruby
sudo npm install grunt-cli -g
sudo gem install sass

sudo npm install cordova -g
~~~

### Windows

* node.js: https://nodejs.org/en/download/
* ruby: http://rubyinstaller.org/

Then, in an [administrative command prompt](https://technet.microsoft.com/en-us/library/cc947813(v=ws.10).aspx):

~~~
npm install grunt-cli -g
gem install sass

npm install cordova -g
~~~

## Compiling

Make sure you have terminal or command prompt open in the `client/src` directory.

### First time only

`npm install`

### All compilations

`grunt [command]`

Where `[command]` can be one of the folllowing:

* `test_www`: This is the default if no command is passed. This command is used to quickly test HTML5-only versions of the app. It skips image minification and uses the URL from the `urlDataTest` key in `package.json` to retrieve weather information.
* `build_www`: This command is used to prepare an HTML5-only version of the app. It uses the URL from the `urlDataBuild` key in `package.json` to retrieve weather information.
* `test_cordova`: Runs `test_www` and then prepare files for a Cordova app to be built. Cordova commands must be run manually afterwards.
* `build_cordova`: Runs `build_www` and then prepare files for a Cordova app to be built. Cordova commands must be run manually afterwards.

### Cordova

Make sure you have terminal or command prompt open in the `client/src/cordova` directory.

Most times, you will want to run the following command to test an Android build:

`cordova run android`

[Click here for a more comprehensive explanation of Cordova's syntax.](https://cordova.apache.org/docs/en/latest/reference/cordova-cli/#syntax)

## Hosting

Simply host the `client/build/www` folder after compiling with your favorite server. Make sure your `urlDataBuild` setting in `package.json` is set to the URL where you will host the server's data before compiling.