var token = "";
var tuid = "";
var ebs = "";

// because who wants to type this every time?
var twitch = window.Twitch.ext;

// https://www.dofusroom.com/buildroom/build/show/185472
// https://www.dofus.com/fr/mmorpg/communaute/annuaires/pages-persos/866675000036-sorry-pl/caracteristiques

// create the request options for our Twitch API calls
var requests = {
  get: createRequest("GET", "stuff"),
};

var config = {};
function loadConfig() {
  if (JSON.stringify(config) === JSON.stringify({})) {
    config = $.parseJSON(twitch.configuration.broadcaster.content);
    twitch.rig.log("Chargement de la config OK");
  }
  setDataReqs();
}

function setDataReqs() {
  Object.keys(requests).forEach((req) => {
    twitch.rig.log("Setting data request");
    requests[req].data = { url: config.link, mode: config.mode };
  });
}

function createRequest(type, method) {
  return {
    type: type,
    url: location.protocol + "//localhost:8081/" + method,
    success: updateBlock,
    error: logError,
  };
}

function setAuth(token) {
  Object.keys(requests).forEach((req) => {
    twitch.rig.log("Setting auth headers");
    requests[req].headers = { Authorization: "Bearer " + token };
  });

  twitch.rig.log(JSON.stringify(requests));
}

twitch.onContext(function (context) {
  //twitch.rig.log(context);
});

twitch.onAuthorized(function (auth) {
  // save our credentials
  token = auth.token;
  tuid = auth.userId;
  twitch.rig.log("twitch.onAuthorized");

  var hasConfig =
    typeof twitch.configuration.broadcaster !== "undefined" &&
    typeof twitch.configuration.broadcaster.content !== "undefined" &&
    typeof $.parseJSON(twitch.configuration.broadcaster.content).mode !== "undefined" &&
    $.parseJSON(twitch.configuration.broadcaster.content).mode !== null
      ? true
      : false;

  // enable the button
  $("#cycle").removeAttr("disabled");

  if (hasConfig) loadConfig();

  setAuth(token);

  // Dofus Room div principal : #build-block
  $.ajax(requests.get);

  //$.ajax(requests.get);
});

function updateBlock(response) {
  twitch.rig.log("Updating block color");
  html = modifImgSrc(response);
  documentHTML = $($.parseHTML(html));
  //twitch.rig.log(response);
  // debugger;
  if (config.mode == "dr") {
    $("#link").html(documentHTML.find("h4[data-build-name='']").html());

    newImg("#amulet", getImg(documentHTML, ".item-box-amulet img"));
    newImg("#ring[data-position='1']", getImg(documentHTML, ".item-box-ring[data-position='bottom'] img"));
    newImg("#ring[data-position='2']", getImg(documentHTML, ".item-box-ring[data-position='top'] img"));

    newImg("#character", getImg(documentHTML, "#character img"));

    newImg("#hat", getImg(documentHTML, ".item-box-hat img"));
    newImg("#cape", getImg(documentHTML, ".item-box-cape img"));
    newImg("#belt", getImg(documentHTML, ".item-box-belt img"));
    newImg("#boots", getImg(documentHTML, ".item-box-boots img"));

    newImg("#weapon", getImg(documentHTML, ".item-box-weapon img"));
    newImg("#shield", getImg(documentHTML, ".item-box-shield img"));

    newImg("#creature", getImg(documentHTML, ".item-box-creature img"));

    newImg("#trofus[data-position='1']", getImg(documentHTML, ".item-box-trophus[data-position='1'] img"));
    newImg("#trofus[data-position='2']", getImg(documentHTML, ".item-box-trophus[data-position='2'] img"));
    newImg("#trofus[data-position='3']", getImg(documentHTML, ".item-box-trophus[data-position='3'] img"));
    newImg("#trofus[data-position='4']", getImg(documentHTML, ".item-box-trophus[data-position='4'] img"));
    newImg("#trofus[data-position='5']", getImg(documentHTML, ".item-box-trophus[data-position='5'] img"));
    newImg("#trofus[data-position='6']", getImg(documentHTML, ".item-box-trophus[data-position='6'] img"));
  } else if (config.mode == "dpp") {
    $("#link").html(documentHTML.find(".ak-directories-breed").html());
    debugger;
    newImg("#amulet", getImg(documentHTML, "#ak-dofus-character-equipment-item-amulet span img"));
    newImg("#ring[data-position='1']", getImg(documentHTML, "#ak-dofus-character-equipment-item-ring1 span img"));
    newImg("#ring[data-position='2']", getImg(documentHTML, "#ak-dofus-character-equipment-item-ring2 span img"));

    // Ankama et leur background image..
    var bg_img = documentHTML
      .find(".ak-entitylook")
      .css("background-image")
      .replace(/^url\(['"](.+)['"]\)/, "$1");

    newImg("#character", bg_img);

    newImg("#hat", getImg(documentHTML, "#ak-dofus-character-equipment-item-hat span img"));
    newImg("#cape", getImg(documentHTML, "#ak-dofus-character-equipment-item-cap span img"));
    newImg("#belt", getImg(documentHTML, "#ak-dofus-character-equipment-item-belt span img"));
    newImg("#boots", getImg(documentHTML, "#ak-dofus-character-equipment-item-amulet span img"));

    newImg("#weapon", getImg(documentHTML, "#ak-dofus-character-equipment-item-weapon span img"));
    newImg("#shield", getImg(documentHTML, "#ak-dofus-character-equipment-item-shield span img"));

    newImg("#creature", getImg(documentHTML, "#ak-dofus-character-equipment-item-pet span img"));

    newImg("#trofus[data-position='1']", getImg(documentHTML, ".ak-equipment-dofus span img", 0));
    newImg("#trofus[data-position='2']", getImg(documentHTML, "#ak-dofus-character-equipment-item-amulet span img", 1));
    newImg("#trofus[data-position='3']", getImg(documentHTML, "#ak-dofus-character-equipment-item-amulet span img", 2));
    newImg("#trofus[data-position='4']", getImg(documentHTML, "#ak-dofus-character-equipment-item-amulet span img", 3));
    newImg("#trofus[data-position='5']", getImg(documentHTML, "#ak-dofus-character-equipment-item-amulet span img", 4));
    newImg("#trofus[data-position='6']", getImg(documentHTML, "#ak-dofus-character-equipment-item-amulet span img", 5));
  }
}

function logError(_, error, status) {
  // debugger;
  twitch.rig.log("EBS request returned " + status + " (" + error + ")");
}

function logSuccess(hex, status) {
  // we could also use the output to update the block synchronously here,
  // but we want all views to get the same broadcast response at the same time.
  twitch.rig.log("EBS request returned " + hex + " (" + status + ")");
}

$(function () {
  // when we click the cycle button
  $("#cycle").click(function () {
    if (!token) {
      return twitch.rig.log("Not authorized");
    }
    twitch.rig.log("Requesting a color cycle");
    $.ajax(requests.set);
  });

  $("#link").html(config.link);

  twitch.rig.log("Listen for broadcast");
  // listen for incoming broadcast message from our EBS
  twitch.listen("broadcast", function (target, contentType, html) {
    twitch.rig.log("Received broadcast color");
    updateBlock(html);
  });
});
