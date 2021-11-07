const twitch = window.Twitch.ext;

twitch.onContext((context) => {
  twitch.rig.log(context);
});

twitch.onAuthorized((auth) => {});

function updateTitleLink(el) {
  let title_link;
  let exampleLinkImg;
  switch (el.val()) {
    case "dpp":
      title_link = "Identifiant de la page perso";
      exampleLinkImg = "dofuspagepersosexample.png";
      break;
    case "dr":
      title_link = "Numéro du build Dofus Room";
      exampleLinkImg = "dofusroomexample.png";
      break;
    case "db":
      title_link = "Identifiant du build Dofus Book";
      break;
  }
  $("#exampleLink").attr("src", exampleLinkImg);
  $("#title_link").text(title_link);
}

// Compress-Archive -Path .\public\* -DestinationPath .\public\public.zip -Force
// https://dev.twitch.tv/docs/tutorials/extension-101-tutorial-series/introduction

let config = [{}];

twitch.configuration.onChanged(() => {
  // Checks if configuration is defined
  if (typeof twitch.configuration.broadcaster !== "undefined" && typeof twitch.configuration.broadcaster.content !== "undefined") {
    // Parsing the array saved in broadcaster content
    config = JSON.parse(twitch.configuration.broadcaster.content);

    // Updating the value of the options array to be the content from config
    if (config[0].mode) {
      $("[name=mode][value=" + config[0].mode + "]").prop("checked", true);
    }

    updateTitleLink($("[name=mode]:checked"));
    if (config[0].link) {
      $("#link").val(config[0].link);
    }
  } else {
    console.log("Invalid config");
  }

  // save configurations
  $("#save").click(function () {
    const numBuild = $(".build.selected")[0].innerHTML - 1;

    config[numBuild].mode = $("[name=mode]:checked").val();
    config[numBuild].link = $("#link").val();

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

const preparedClass = "build px-2 align-center mx-2";

function manageStuff(action) {
  const nbBuilds = $(".build").length;
  switch (action) {
    case "add":
      if (nbBuilds < 8) {
        $("#builds").append($("<div>" + (nbBuilds + 1) + "</div>").addClass(preparedClass));
        config.push({ mode: "dpp", link: "" });
      }
      break;

    case "sub":
      if (nbBuilds > 1) {
        if ($($(".build")[nbBuilds - 1]).hasClass("selected")) {
          $($(".build")[0]).addClass("selected");
        }
        $(".build")[nbBuilds - 1].remove();
        config.splice(nbBuilds - 1, 1);
      }
      break;
  }
}

$("#builds").on("click", (event) => {
  if ($(event.target).hasClass("build")) {
    $(".build.selected").removeClass("selected");
    $(event.target).addClass("selected");

    const numBuild = $(".build.selected")[0].innerHTML - 1;

    // Updating the value of the options array to be the content from config
    if (config[numBuild].mode) {
      $("[name=mode][value=" + config[numBuild].mode + "]").prop("checked", true);
    }

    updateTitleLink($("[name=mode]:checked"));
    $("#link").val(config[numBuild].link);
  }
});
