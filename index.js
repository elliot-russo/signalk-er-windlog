/*
 * Copyright 2023 Elliot Russo <elliot.russo@gmail.com>
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const DEBUGMODE = true;

const fs = require('fs');

const Database = require('./lib/Database');
const dbSchema = require('./lib/dbschema.json');

//const fn = require('./lib/functions'); //FIXME:
//const jsonFn = require('./lib/json');
//const skFn = require('./lib/signalkFn');

/*
let SUBMIT_INTERVAL = 1
let DB_UPDATE_MINUTES = 1
let BUFFER_LIMIT = 2
*/

const pluginId = "signalk-er-windlog"

module.exports = function(app) {
  
    //Const debug = app.debug
  let plugin = {};

  plugin.id     = pluginId;
  plugin.name   = "Wind Logger";
  plugin.description = "";
    
  let database;
  let options;
  let tableWindlog;
  let logTimer;

  //let GPS_SOURCE;
  //let MODE;

  //let FILE_ROOT = 'c:\\devprojects\\signalk-voyage-ui';
  let FILE_ROOT = '/windlog/';

  if (isVenusOS())
    FILE_ROOT = '/run/media/mmcblk0p1/signalk_plugins/windlog/';
  else
    FILE_ROOT = 'c:\\devprojects\\signalk-windlog\\data\\';

  /* redundant with admin option? */
  function debug(message){
    if (DEBUGMODE)
      app.debug(message);
  }

  plugin.start = function(_options) {
    options = _options;
    debug("starting");

    //options
    //MODE = options.mode.toString().toLowerCase();
    //GPS_SOURCE = options.gpssource.toString().toLowerCase();

    /*
    if (MODE == "dev")
    {

    }
    */

    debug("creating/opening database");

    //open database
    database = new Database('wind.sqlite.db', FILE_ROOT, dbSchema, false, debug);
    tableWindlog = database.Tables['WindLog'];

    debug("starting logging");
    logData();

    logTimer = setInterval(logData, options.interval * 1000);

    debug("started");
  };

  plugin.stop = function() {
    debug("stopping");
    logTimer && clearTimeout(logTimer);
    database.close();
    debug("stopped");
  };

  plugin.schema = {
    type: "object",
    required: ["interval"],
    properties: {
      interval: {
        title: 'How often should this plugin log data.',
        type: "number",
        default: 10
      },
      mode: {
        title: 'Mode',
        type: "number",
        default: "dev"
      },
      gpssource: {
        title: 'GPS Source',
        type: "text",
        default: ""
      },
      sogKey: {
        title: 'SOG Key',
        type: "text",
        default: "navigation.speedOverGround.dj"
      },
      cogKey: {
        title: 'COG Key',
        type: "text",
        default: "navigation.courseOverGroundTrue.dj"
      },
      stwKey: {
        title: 'STW Key',
        type: "text",
        default: "navigation.speedThroughWater.dj"
      },
      hdgKey: {
        title: 'HDG Key',
        type: "text",
        default: "navigation.headingTrue.dj "
      },
      awsKey: {
        title: 'AWS Key',
        type: "text",
        default: "environment.wind.speedApparent.dj"
      },
      awaKey: {
        title: 'AWA Key',
        type: "text",
        default: "environment.wind.angleApparent.dj"
      }
    }
  };

  function logData(){

    debug("logData()");

    let data = getData();
    debug(data);

    if (data)
    {
      debug("attempt insert");

      let info = tableWindlog.insert(data);
      
      debug(info);

      app.setPluginStatus(`Data logged ${data.DateTime} ${data.SOG} ${data.COG}` );

    }
    else
      app.setPluginStatus(`No Data logged` );

  }

  function getData(){

    debug("getData()");

    let data;
    let sog = getKeyValue(options.sogKey, 15);
debug(sog);

    //if (sog && sog > 1) {

      let position = getKeyValue('navigation.position', 15);
      let cog = getKeyValue(options.cogKey, 15);
      let hdg = getKeyValue(options.hdgKey, 15);
      let stw = getKeyValue(options.stwKey, 15);
      let aws = getKeyValue(options.awsKey, 15);
      let awa = getKeyValue(options.awaKey, 15);

      //if (position && cog && hdg && stw && aws && awa) {
        data = {
          DateTime: Date.now(),
          Latitude: position.latitude,
          Longitude: position.longitude,
          SOG: metersPerSecondToKnots(sog),
          COG: radiantToDegrees(cog),
          HDG: radiantToDegrees(hdg),
          STW: metersPerSecondToKnots(stw),
          AWS: metersPerSecondToKnots(aws),
          AWA: radiantToDegrees(awa)
        //}

      //}
      
    }

    return data;
  }

  function getKeyValue(key, maxAge) {
    debug(`getKeyValue(${key})`);
    let Key = app.getSelfPath(key);
    if (!Key) {
        return null;
    }
    
    return Key.value;
  }

  function isVenusOS() {
    return (fs.existsSync('/etc/venus'));
  }


  radiantToDegrees = function(rad) {
    if (rad == null) {
        return null;
    }
    return Math.round(rad * 57.2958 * 10) / 10;
  }

  metersPerSecondToKnots = function(ms) {
    if (ms == null) {
        return null;
    }
    return Math.round(ms * 1.94384 * 10) / 10;
  }

  return plugin;
};
