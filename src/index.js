/*
 * @Author: Kvkens
 * @Date:   2017-5-15 00:00:00
 * @Last Modified by:   Kvkens
 * @Last Modified time: 2017-5-19 22:38:39
 */

const path = require("path");
const os = require("os");
const chalk = require("chalk");
const execSync = require('child_process').execSync;
const co = require('co');
const fs = require('fs');
const npminstall = require('npminstall');

var commands = null;
var pluginname = null;
var installDir = os.homedir() + "/.moli-cli";
var moliVersionPath = installDir + "/moli-plugin.json";

function getPrefix() {
  try {
    return execSync('npm config get prefix').toString().trim();
  } catch (err) {
    throw new Error(`exec npm config get prefix ERROR: ${err.message}`);
  }
}

function getNodeModulePath(name) {
  return os.platform() == "darwin" ? `${getPrefix()}/lib/node_modules/${name}/` : `${getPrefix()}/node_modules/${name}/`;
}

function uninstall(pkgname) {
  fs.readFile(moliVersionPath, "utf8", (err, data) => {
    var configObj = JSON.parse(data);
    console.log(configObj);
    delete configObj["version"][pkgname];
    console.log(configObj);
    fs.writeFile(moliVersionPath, JSON.stringify(configObj), (err) => {
      if (err) throw err;
    });
  });
}

function updateVersion(pkgname) {
  var version = require(`${getNodeModulePath(pluginname)}node_modules/moli-${pkgname}/package.json`).version;
  fs.readFile(moliVersionPath, "utf8", (err, data) => {
    var configObj = JSON.parse(data);
    configObj["version"][pkgname] = version;
    fs.writeFile(moliVersionPath, JSON.stringify(configObj), (err) => {
      if (err) throw err;
      console.log(chalk.green(`success installed. try <moli ${pkgname} -h>`));
    });
  });
}

function installPackage(pkg, name) {
  co(function*() {
    yield npminstall({
      // install root dir
      root: getNodeModulePath(name),
      // optional packages need to install, default is package.json's dependencies and devDependencies
      pkgs: [{
        name: "moli-" + pkg
      }],
      // install to specific directory, default to root
      // targetDir: '/home/admin/.global/lib',
      // link bin to specific directory (for global install)
      // binDir: '/home/admin/.global/bin',
      // registry, default is https://registry.npmjs.org
      registry: 'https://registry.npm.taobao.org',
      // debug: false,
      // storeDir: root + 'node_modules',
      storeDir: path.join(os.homedir(), '.moli-cli', 'install')
      // ignoreScripts: true, // ignore pre/post install scripts, default is `false`
      // forbiddenLicenses: forbit install packages which used these licenses
    });
  }).catch(err => {
    console.error(err.stack);
  }).then(function(value) {
    console.log(chalk.green("Plugin installed."));
    updateVersion(pkg);
  });
}

function getHelp() {
  console.log(chalk.green(" Usage : "));
  console.log();
  console.log(chalk.green(" moli install <name>"));
  console.log();
  process.exit(0);
}

function getVersion() {
  console.log(chalk.green(require("../package.json").version));
  process.exit(0);
}


module.exports = {
  plugin: function(options) {
    commands = options.cmd;
    pluginname = options.name;
    if (options.argv.h || options.argv.help) {
      getHelp();
    }
    if (options.argv.v || options.argv.version) {
      getVersion();
    }

    installPackage(commands[1], options.name);
  }
}
