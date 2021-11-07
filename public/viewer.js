var token = "";
var tuid = "";
var ebs = "";

// because who wants to type this every time?
var twitch = window.Twitch.ext;

// https://www.dofusroom.com/buildroom/build/show/185472
// https://www.dofus.com/fr/mmorpg/communaute/annuaires/pages-persos/866675000036-sorry-pl/caracteristiques

const baseUrlBuildDofusRoom = "https://www.dofusroom.com/buildroom/build/show/";
const baseUrlBuildDofusOffi = "https://www.dofus.com/fr/mmorpg/communaute/annuaires/pages-persos/{link}/caracteristiques";

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
    requests[req].data = { url: config[0].link, mode: config[0].mode };
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
    typeof $.parseJSON(twitch.configuration.broadcaster.content)[0].mode !== "undefined" &&
    $.parseJSON(twitch.configuration.broadcaster.content)[0].mode !== null
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

function newImg(selector, objImage) {
  let img = document.createElement("img");
  img.setAttribute("src", objImage.image);
  if (objImage.type !== "character") {
    // img.setAttribute("title", "");
    // img.classList.add("tooltip");
    // http://calebjacob.github.io/tooltipster/
    // debugger;
    $(img).tooltipster({
      content: $("<strong>" + objImage.name + "</strong><div class='text-center'> Level " + objImage.level + "</div>"),
      theme: "tooltipster-borderless",
      contentAsHTML: true,
      delay: 100,
      side: [objImage.tooltipPosition],
    });
  }
  $(selector).html(img);
}

function myFunction() {
  /* Get the text field */
  var copyText = document.getElementById("myInput");

  /* Select the text field */
  copyText.select();
  copyText.setSelectionRange(0, 99999); /* For mobile devices */

  /* Copy the text inside the text field */
  navigator.clipboard.writeText(copyText.value);

  /* Alert the copied text */
  alert("Copied the text: " + copyText.value);
}

function updateBlock(response) {
  twitch.rig.log("Updating block color");
  // debugger;
  //twitch.rig.log(response);
  // debugger;
  // $("#link").html(response.link);

  newImg("#amulet", response.items[0]);
  newImg("#ring[data-position='1']", response.items[1]);
  newImg("#ring[data-position='2']", response.items[2]);

  newImg("#character", response.character);

  let linkEl = document.createElement("a");
  linkEl.setAttribute("href", baseUrlBuildDofusRoom + config[0].link);
  linkEl.setAttribute("target", "_blank");
  // $(linkEl).on("click", copyLinkClipboard);
  $(linkEl).html(response.character.classe + " " + response.character.level);
  $("#link").html(linkEl);

  newImg("#hat", response.items[3]);
  newImg("#cape", response.items[4]);
  newImg("#belt", response.items[5]);
  newImg("#boots", response.items[6]);

  newImg("#weapon", response.items[7]);
  newImg("#shield", response.items[8]);

  newImg("#creature", response.items[9]);

  newImg("#trofus[data-position='1']", response.items[10]);
  newImg("#trofus[data-position='2']", response.items[11]);
  newImg("#trofus[data-position='3']", response.items[12]);
  newImg("#trofus[data-position='4']", response.items[13]);
  newImg("#trofus[data-position='5']", response.items[14]);
  newImg("#trofus[data-position='6']", response.items[15]);
  // debugger;
  // if (config.mode == "dr") {
  //   $("#link").html(documentHTML.find("h4[data-build-name='']").html());

  //   newImg("#amulet", getImg(documentHTML, ".item-box-amulet img"));
  //   newImg("#ring[data-position='1']", getImg(documentHTML, ".item-box-ring[data-position='bottom'] img"));
  //   newImg("#ring[data-position='2']", getImg(documentHTML, ".item-box-ring[data-position='top'] img"));

  //   newImg("#character", getImg(documentHTML, "#character img"));

  //   newImg("#hat", getImg(documentHTML, ".item-box-hat img"));
  //   newImg("#cape", getImg(documentHTML, ".item-box-cape img"));
  //   newImg("#belt", getImg(documentHTML, ".item-box-belt img"));
  //   newImg("#boots", getImg(documentHTML, ".item-box-boots img"));

  //   newImg("#weapon", getImg(documentHTML, ".item-box-weapon img"));
  //   newImg("#shield", getImg(documentHTML, ".item-box-shield img"));

  //   newImg("#creature", getImg(documentHTML, ".item-box-creature img"));

  //   newImg("#trofus[data-position='1']", getImg(documentHTML, ".item-box-trophus[data-position='1'] img"));
  //   newImg("#trofus[data-position='2']", getImg(documentHTML, ".item-box-trophus[data-position='2'] img"));
  //   newImg("#trofus[data-position='3']", getImg(documentHTML, ".item-box-trophus[data-position='3'] img"));
  //   newImg("#trofus[data-position='4']", getImg(documentHTML, ".item-box-trophus[data-position='4'] img"));
  //   newImg("#trofus[data-position='5']", getImg(documentHTML, ".item-box-trophus[data-position='5'] img"));
  //   newImg("#trofus[data-position='6']", getImg(documentHTML, ".item-box-trophus[data-position='6'] img"));
  // } else if (config.mode == "dpp") {
  //   $("#link").html(documentHTML.find(".ak-directories-breed").html());
  //   debugger;
  //   newImg("#amulet", getImg(documentHTML, "#ak-dofus-character-equipment-item-amulet span img"));
  //   newImg("#ring[data-position='1']", getImg(documentHTML, "#ak-dofus-character-equipment-item-ring1 span img"));
  //   newImg("#ring[data-position='2']", getImg(documentHTML, "#ak-dofus-character-equipment-item-ring2 span img"));

  //   // Ankama et leur background image..
  //   var bg_img = documentHTML
  //     .find(".ak-entitylook")
  //     .css("background-image")
  //     .replace(/^url\(['"](.+)['"]\)/, "$1");

  //   newImg("#character", bg_img);

  //   newImg("#hat", getImg(documentHTML, "#ak-dofus-character-equipment-item-hat span img"));
  //   newImg("#cape", getImg(documentHTML, "#ak-dofus-character-equipment-item-cap span img"));
  //   newImg("#belt", getImg(documentHTML, "#ak-dofus-character-equipment-item-belt span img"));
  //   newImg("#boots", getImg(documentHTML, "#ak-dofus-character-equipment-item-amulet span img"));

  //   newImg("#weapon", getImg(documentHTML, "#ak-dofus-character-equipment-item-weapon span img"));
  //   newImg("#shield", getImg(documentHTML, "#ak-dofus-character-equipment-item-shield span img"));

  //   newImg("#creature", getImg(documentHTML, "#ak-dofus-character-equipment-item-pet span img"));

  //   newImg("#trofus[data-position='1']", getImg(documentHTML, ".ak-equipment-dofus span img", 0));
  //   newImg("#trofus[data-position='2']", getImg(documentHTML, "#ak-dofus-character-equipment-item-amulet span img", 1));
  //   newImg("#trofus[data-position='3']", getImg(documentHTML, "#ak-dofus-character-equipment-item-amulet span img", 2));
  //   newImg("#trofus[data-position='4']", getImg(documentHTML, "#ak-dofus-character-equipment-item-amulet span img", 3));
  //   newImg("#trofus[data-position='5']", getImg(documentHTML, "#ak-dofus-character-equipment-item-amulet span img", 4));
  //   newImg("#trofus[data-position='6']", getImg(documentHTML, "#ak-dofus-character-equipment-item-amulet span img", 5));
  // }
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

  // $("#link").html(config.link);
});
