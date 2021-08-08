const twitch = window.Twitch.ext;

twitch.onContext((context) => {
  twitch.rig.log(context);
});

twitch.onAuthorized((auth) => {});

function updateTitleLink(el) {
  let title_link;
  switch (el.val()) {
    case "dpp":
      title_link = "Lien de la page perso";
      break;
    case "dr":
      title_link = "Lien du build Dofus Room";
      break;
  }
  $("#title_link").text(title_link);
}

// Compress-Archive -Path .\public\* -DestinationPath .\public\public.zip -Force
// https://dev.twitch.tv/docs/tutorials/extension-101-tutorial-series/introduction

twitch.configuration.onChanged(() => {
  let config = {};

  console.log("test1");
  // Checks if configuration is defined
  if (typeof twitch.configuration.broadcaster !== "undefined" && typeof twitch.configuration.broadcaster.content !== "undefined") {
    // Parsing the array saved in broadcaster content
    config = JSON.parse(twitch.configuration.broadcaster.content);

    console.log("test2");
    // Updating the value of the options array to be the content from config

    console.log(config);
    if (config.mode) {
      $("[name=mode][value=" + config.mode + "]").prop("checked", true);
    }

    updateTitleLink($("[name=mode]:checked"));
    if (config.link) {
      $("#link").val(config.link);
    }

    console.log("test3");
  } else {
    console.log("Invalid config");
  }

  // save configurations
  $("#save").click(function () {
    config.mode = $("[name=mode]:checked").val();
    config.link = $("#link").val();

    twitch.configuration.set("broadcaster", "1", JSON.stringify(config));

    $("#message").addClass("opacity-100");
    setTimeout(function () {
      $("#message").removeClass("opacity-100");
    }, 3000);
  });
});

$(function () {
  updateTitleLink($("[name=mode]:checked"));
  // when we click the mode button
  $("input[name='mode']").click(function () {
    updateTitleLink($(this));
  });
});
