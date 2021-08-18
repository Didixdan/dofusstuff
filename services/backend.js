/**
 *    Copyright 2018 Amazon.com, Inc. or its affiliates
 *
 *    Licensed under the Apache License, Version 2.0 (the "License");
 *    you may not use this file except in compliance with the License.
 *    You may obtain a copy of the License at
 *
 *        http://www.apache.org/licenses/LICENSE-2.0
 *
 *    Unless required by applicable law or agreed to in writing, software
 *    distributed under the License is distributed on an "AS IS" BASIS,
 *    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *    See the License for the specific language governing permissions and
 *    limitations under the License.
 */

// const fs = require("fs");
const Hapi = require("hapi");
// const path = require("path");
const Boom = require("boom");
// const color = require("color");
const ext = require("commander");
const jsonwebtoken = require("jsonwebtoken");
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(StealthPlugin());

const request = require("request");

var jsdom = require("jsdom");
const { JSDOM } = jsdom;
const { window } = new JSDOM();
const { document } = new JSDOM("").window;
global.document = document;

var $ = (jQuery = require("jquery")(window));

// The developer rig uses self-signed certificates.  Node doesn't accept them
// by default.  Do not use this in production.
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

// Use verbose logging during development.  Set this to false for production.
const verboseLogging = true;
const verboseLog = verboseLogging ? console.log.bind(console) : () => {};

// Service state variables
// const initialColor = color("#6441A4"); // super important; bleedPurple, etc.
const serverTokenDurationSec = 30; // our tokens for pubsub expire after 30 seconds
// const userCooldownMs = 1000; // maximum input rate per user to prevent bot abuse
const userCooldownClearIntervalMs = 60000; // interval to reset our tracking object
const channelCooldownMs = 1000; // maximum broadcast rate per channel
const bearerPrefix = "Bearer "; // HTTP authorization headers have this prefix
// const colorWheelRotation = 30;
let htmlResponse = "";
const channelCooldowns = {}; // rate limit compliance
// let userCooldowns = {}; // spam prevention
let itemsDofusRoom = {};

const baseUrlItemImage = "https://www.dofusroom.com/img/assets/items/";
const baseUrlCharImage = "https://www.dofusroom.com/img/buildroom/assets/char/";

const STRINGS = {
  // secretEnv: usingValue("secret"),
  // clientIdEnv: usingValue("client-id"),
  // ownerIdEnv: usingValue("owner-id"),
  serverStarted: "Server running at %s",
  // secretMissing: missingValue("secret", "EXT_SECRET"),
  // clientIdMissing: missingValue("client ID", "EXT_CLIENT_ID"),
  // ownerIdMissing: missingValue("owner ID", "EXT_OWNER_ID"),
  messageSendError: "Error sending message to channel %s: %s",
  pubsubResponse: "Message to c:%s returned %s",
  cyclingColor: "Cycling color for c:%s on behalf of u:%s",
  colorBroadcast: "Broadcasting color %s for c:%s",
  sendColor: "Sending color %s to c:%s",
  cooldown: "Please wait before clicking again",
  invalidAuthHeader: "Invalid authorization header",
  invalidJwt: "Invalid JWT",
};

ext
  .version(require("../package.json").version)
  .option("-s, --secret <secret>", "Extension secret")
  .option("-c, --client-id <client_id>", "Extension client ID")
  .option("-o, --owner-id <owner_id>", "Extension owner ID")
  .parse(process.argv);

const ownerId = getOption("ownerId", "EXT_OWNER_ID");
const secret = Buffer.from(getOption("secret", "EXT_SECRET"), "base64");
const clientId = getOption("clientId", "EXT_CLIENT_ID");

const serverOptions = {
  host: "localhost",
  port: 8081,
  routes: {
    cors: {
      origin: ["*"],
    },
  },
};
// const serverPathRoot = path.resolve(__dirname, "..", "conf", "server");
// if (fs.existsSync(serverPathRoot + ".crt") && fs.existsSync(serverPathRoot + ".key")) {
//   serverOptions.tls = {
//     // If you need a certificate, execute "npm run cert".
//     cert: fs.readFileSync(serverPathRoot + ".crt"),
//     key: fs.readFileSync(serverPathRoot + ".key"),
//   };
// }
const server = new Hapi.Server(serverOptions);

(async () => {
  // Handle a viewer request to cycle the color.
  // server.route({
  //   method: "POST",
  //   path: "/color/cycle",
  //   handler: colorCycleHandler,
  // });

  // Handle a new viewer requesting the color.
  server.route({
    method: "GET",
    path: "/stuff",
    handler: formatstuffQuery,
  });

  // Load items from Dofus Roomvar myInit = { method: 'GET',
  const options = {
    url: "https://www.dofusroom.com/api/item/findAll",
    headers: {
      ApiKey: "20d0d6435863c8c01b8f079ee313030f455a8e48",
      Organization: "didix",
    },
  };
  request.post(options, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      itemsDofusRoom = JSON.parse(body).data;
      console.log("Items chargés");
    }
  });

  // Start the server.
  await server.start();
  console.log("Serveur OK");

  // Periodically clear cool-down tracking to prevent unbounded growth due to
  // per-session logged-out user tokens.
  setInterval(() => {
    userCooldowns = {};
  }, userCooldownClearIntervalMs);
})();

// function usingValue(name) {
//   return `Using environment variable for ${name}`;
// }

// function missingValue(name, variable) {
//   const option = name.charAt(0);
//   return `Extension ${name} required.\nUse argument "-${option} <${name}>" or environment variable "${variable}".`;
// }

// Get options from the command line or the environment.
function getOption(optionName, environmentName) {
  const option = (() => {
    if (ext[optionName]) {
      return ext[optionName];
    } else if (process.env[environmentName]) {
      console.log(STRINGS[optionName + "Env"]);
      return process.env[environmentName];
    }
    console.log(STRINGS[optionName + "Missing"]);
    process.exit(1);
  })();
  console.log(`Using "${option}" for ${optionName}`);
  return option;
}

// Verify the header and the enclosed JWT.
function verifyAndDecode(header) {
  if (header.startsWith(bearerPrefix)) {
    try {
      const token = header.substring(bearerPrefix.length);
      return jsonwebtoken.verify(token, secret, { algorithms: ["HS256"] });
    } catch (ex) {
      throw Boom.unauthorized(STRINGS.invalidJwt);
    }
  }
  throw Boom.unauthorized(STRINGS.invalidAuthHeader);
}

// function colorCycleHandler(req) {
//   // Verify all requests.
//   const payload = verifyAndDecode(req.headers.authorization);
//   const { channel_id: channelId, opaque_user_id: opaqueUserId } = payload;

//   // Store the color for the channel.
//   let currentColor = channelColors[channelId] || initialColor;

//   // Bot abuse prevention:  don't allow a user to spam the button.
//   if (userIsInCooldown(opaqueUserId)) {
//     throw Boom.tooManyRequests(STRINGS.cooldown);
//   }

//   // Rotate the color as if on a color wheel.
//   verboseLog(STRINGS.cyclingColor, channelId, opaqueUserId);
//   currentColor = color(currentColor).rotate(colorWheelRotation).hex();

//   // Save the new color for the channel.
//   channelColors[channelId] = currentColor;

//   // Broadcast the color change to all other extension instances on this channel.
//   attemptColorBroadcast(channelId);

//   return currentColor;
// }

// function delay(time) {
//   return new Promise(function (resolve) {
//     setTimeout(resolve, time);
//   });
// }
// function getImg(html, classe, i = 0) {
//   return html.find(classe)[i];
// }

function getItemFromId(id) {
  return itemsDofusRoom.filter((obj) => obj["iconId"] == id)[0];
}

function getItemIdFromHTML(html, classe, i = 0) {
  return html.find(classe)[i].src.match("[0-9]+")[0];
}

// function modifImgSrc(html) {
//   var element = document.createElement("div");
//   element.innerHTML = html;
//   var imgSrcUrls = element.getElementsByTagName("img");
//   // debugger;
//   for (var i = 0; i < imgSrcUrls.length; i++) {
//     var urlValue = imgSrcUrls[i].getAttribute("src");
//     if (urlValue) {
//       if (config.mode === "dr") {
//         imgSrcUrls[i].setAttribute("src", "https://www.dofusroom.com/" + urlValue);
//       } else if (config.mode === "dpp") {
//         if (urlValue.match("items.*")) {
//           imgSrcUrls[i].setAttribute("src", "https://www.dofusroom.com/img/assets/items/" + urlValue.match("[0-9]+.png"));
//         }
//       }
//     }
//   }
//   return element.innerHTML;
// }

// function newImg(selector, image) {
//   let img = document.createElement("img");
//   img.setAttribute("src", image.getAttribute("src"));
//   if (image.hasAttribute("data-original-title")) {
//     let htmlTitle = document.createElement("div");
//     htmlTitle.innerHTML = image.getAttribute("data-original-title");
//     debugger;
//     let newHtmlTitle = $(htmlTitle).find("h6")[0];
//     newHtmlTitle = newHtmlTitle + $(htmlTitle).getElementsByTagName("div")[0];
//     img.setAttribute("data-original-title", newHtmlTitle.innerHTML);
//   }
//   $(selector).html(img);
// }

function createItemJson(html, classe) {
  let item = getItemFromId(getItemIdFromHTML(html, classe));
  return {
    name: item.name,
    image: baseUrlItemImage + item.iconId + ".png",
    level: item.level,
  };
}

async function formatstuffQuery(req) {
  const response = await stuffQueryHandler(req);

  // const html = modifImgSrc(response);
  const documentHTML = $($.parseHTML(response));

  let objReturn = {};
  let arrayItems = [];

  objReturn.link = documentHTML.find("h4[data-build-name='']").html();

  arrayItems.push(createItemJson(documentHTML, ".item-box-amulet img"));
  arrayItems.push(createItemJson(documentHTML, ".item-box-ring[data-position='bottom'] img"));
  arrayItems.push(createItemJson(documentHTML, ".item-box-ring[data-position='top'] img"));

  arrayItems.push(createItemJson(documentHTML, ".item-box-hat img"));
  arrayItems.push(createItemJson(documentHTML, ".item-box-cape img"));
  arrayItems.push(createItemJson(documentHTML, ".item-box-belt img"));
  arrayItems.push(createItemJson(documentHTML, ".item-box-boots img"));

  arrayItems.push(createItemJson(documentHTML, ".item-box-weapon img"));
  arrayItems.push(createItemJson(documentHTML, ".item-box-shield img"));

  arrayItems.push(createItemJson(documentHTML, ".item-box-creature img"));

  arrayItems.push(createItemJson(documentHTML, ".item-box-trophus[data-position='1'] img"));
  arrayItems.push(createItemJson(documentHTML, ".item-box-trophus[data-position='2'] img"));
  arrayItems.push(createItemJson(documentHTML, ".item-box-trophus[data-position='3'] img"));
  arrayItems.push(createItemJson(documentHTML, ".item-box-trophus[data-position='4'] img"));
  arrayItems.push(createItemJson(documentHTML, ".item-box-trophus[data-position='5'] img"));
  arrayItems.push(createItemJson(documentHTML, ".item-box-trophus[data-position='6'] img"));

  objReturn.items = arrayItems;
  objReturn.character = baseUrlCharImage + documentHTML.find("#character img")[0].src.match("(char/)(.+.png)")[2];

  return objReturn;
}

function stuffQueryHandler(req) {
  // Verify all requests.
  const payload = verifyAndDecode(req.headers.authorization);
  const { channel_id: channelId, opaque_user_id: opaqueUserId } = payload;

  if (typeof req.query.mode !== "undefined" && typeof req.query.url !== "undefined") {
    const config = { mode: req.query.mode, link: req.query.url };

    let url = "";
    switch (config.mode) {
      case "dpp":
        // Dofus page persos
        url = "https://www.dofus.com/fr/mmorpg/communaute/annuaires/pages-persos/" + config.link + "/caracteristiques";
        break;
      case "dr":
        // Dofus Room
        url = "https://www.dofusroom.com/buildroom/build/show/" + config.link;
        break;
    }

    return new Promise((resolve, rejection) => {
      // if (config.mode == "dr") {
      (async () => {
        try {
          const browser = await puppeteer.launch({ headless: true });
          const page = await browser.newPage();
          await page.goto(url);
          let wait = 0;
          switch (config.mode) {
            case "dr":
              wait = 1200;
              break;
            case "dpp":
              wait = 5000;
              break;
          }
          await page.waitForTimeout(wait);
          htmlResponse = await page.content();
          // await page.screenshot({ path: "testresult.png", fullPage: true });
          await browser.close();
          resolve(htmlResponse);
        } catch (error) {
          rejection(error);
        }
      })();
      // } else if (config.mode == "dpp") {
      // (async () => {
      //   try {
      //     const response = await cloudflareScraper.get(url);
      //     resolve(response);
      //   } catch (error) {
      //     rejection(error);
      //   }
      // })();
      // }
    });
  }
}

// function attemptStuffBroadcast(channelId) {
//   // Check the cool-down to determine if it's okay to send now.
//   const now = Date.now();
//   const cooldown = channelCooldowns[channelId];
//   if (!cooldown || cooldown.time < now) {
//     // It is.
//     sendStuffBroadcast(channelId);
//     channelCooldowns[channelId] = { time: now + channelCooldownMs };
//   } else if (!cooldown.trigger) {
//     // It isn't; schedule a delayed broadcast if we haven't already done so.
//     cooldown.trigger = setTimeout(sendStuffBroadcast, now - cooldown.time, channelId);
//   }
// }

// function sendStuffBroadcast(channelId) {
//   // Set the HTTP headers required by the Twitch API.
//   const headers = {
//     "Client-ID": clientId,
//     "Content-Type": "application/json",
//     Authorization: bearerPrefix + makeServerToken(channelId),
//   };

//   // Create the POST body for the Twitch API request.
//   // const currentColor = color(channelColors[channelId] || initialColor).hex();
//   const body = JSON.stringify({
//     content_type: "text/html",
//     message: htmlResponse,
//     targets: ["broadcast"],
//   });

//   // Send the broadcast request to the Twitch API.
//   // verboseLog(STRINGS.colorBroadcast, currentColor, channelId);
//   request(
//     `https://api.twitch.tv/extensions/message/${channelId}`,
//     {
//       method: "POST",
//       headers,
//       body,
//     },
//     (err, res) => {
//       if (err) {
//         console.log(STRINGS.messageSendError, channelId, err);
//       } else {
//         verboseLog(STRINGS.pubsubResponse, channelId, res.statusCode);
//       }
//     }
//   );
// }

// function sendColorBroadcast(channelId) {
//   // Set the HTTP headers required by the Twitch API.
//   const headers = {
//     "Client-ID": clientId,
//     "Content-Type": "application/json",
//     Authorization: bearerPrefix + makeServerToken(channelId),
//   };

//   // Create the POST body for the Twitch API request.
//   const currentColor = color(channelColors[channelId] || initialColor).hex();
//   const body = JSON.stringify({
//     content_type: "application/json",
//     message: currentColor,
//     targets: ["broadcast"],
//   });

//   // Send the broadcast request to the Twitch API.
//   verboseLog(STRINGS.colorBroadcast, currentColor, channelId);
//   request(
//     `https://api.twitch.tv/extensions/message/${channelId}`,
//     {
//       method: "POST",
//       headers,
//       body,
//     },
//     (err, res) => {
//       if (err) {
//         console.log(STRINGS.messageSendError, channelId, err);
//       } else {
//         verboseLog(STRINGS.pubsubResponse, channelId, res.statusCode);
//       }
//     }
//   );
// }

// Create and return a JWT for use by this service.
// function makeServerToken(channelId) {
//   const payload = {
//     exp: Math.floor(Date.now() / 1000) + serverTokenDurationSec,
//     channel_id: channelId,
//     user_id: ownerId, // extension owner ID for the call to Twitch PubSub
//     role: "external",
//     pubsub_perms: {
//       send: ["*"],
//     },
//   };
//   return jsonwebtoken.sign(payload, secret, { algorithm: "HS256" });
// }

// function userIsInCooldown(opaqueUserId) {
//   // Check if the user is in cool-down.
//   const cooldown = userCooldowns[opaqueUserId];
//   const now = Date.now();
//   if (cooldown && cooldown > now) {
//     return true;
//   }

//   // Voting extensions must also track per-user votes to prevent skew.
//   userCooldowns[opaqueUserId] = now + userCooldownMs;
//   return false;
// }
