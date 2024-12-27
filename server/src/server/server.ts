'use strict'

import fs = require("fs")
import { v4 as uuidv4 } from 'uuid';
import { Control } from "./control"
import { Agent } from "./agent/agent";

const uuid = uuidv4()

const appname = 'toktoktalk'
const configFile: string = `${appname}.json`

var args = process.argv.slice(2);
console.log('args: ', args);


const homedir = require('os').homedir();
// const rootdir = `${homedir}/.${appname}`
// mkdir(rootdir)

const PORT = process.env.PORT || 30100;

// @assumption: server is running on the same machine as janus in production.
const janusApiUrl = process.env.NODE_ENV === "development"
? 'https://janus.toktoktalk.com/janus'
: 'http://localhost:8088/janus';

function loadConfig(path: string) {
  if (!fs.existsSync(path)) {
    console.log('no file. a default config. will be created.');
    fs.writeFileSync(path, JSON.stringify({
      uuid: uuid,
      port: `${PORT}`,
      // rootdir: rootdir,
      // logpath: `${appname}.db`,
      // agent: {
      //   // host: 'https://www-dev.onthe.live/api/v1/xtreams',
      //   host: 'https://janus.papergirl.site',
      //   port: 443
      // },
      janus: {
        url: janusApiUrl,
        protocol: 'janus-protocol'
      },
    }, null, 2));
  }

  return JSON.parse(fs.readFileSync(path).toString())
}

const config = loadConfig(configFile)

console.log(config)

// var agent = new Agent(config.janus.url)
// agent.init()

var control = new Control(config)
control.init()
control.start()



function exitHandler(options: any, exitCode: number) {
  if (options.cleanup) {
    setTimeout(() => {
      process.exit()
    }, 2000)
  }

  if (exitCode || exitCode === 0) console.log(`exit code ${exitCode}`)

  if (options.exit) {
    process.exit()
  }
}

//do something when app is closing
process.on('exit', exitHandler.bind(null, { cleanup: true }))

//catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null, { cleanup: true }))

// catches "kill pid" (for example: nodemon restart)
process.on('SIGUSR1', exitHandler.bind(null, { cleanup: true }))
process.on('SIGUSR2', exitHandler.bind(null, { cleanup: true }))
process.on('SIGTERM', exitHandler.bind(null, { cleanup: true }))
process.on('SIGSEGV', exitHandler.bind(null, { cleanup: true }))
process.on('SIGABRT', exitHandler.bind(null, { cleanup: true }))

//catches uncaught exceptions
process.on('uncaughtException', exitHandler.bind(null, { cleanup: true }))
