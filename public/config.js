let token, userId;

const twitch = window.Twitch.ext;

twitch.onContext((context) => {
  twitch.rig.log(context);
});

twitch.onAuthorized((auth) => {
  token = auth.token;
  userId = auth.userId;
});

$(function () {
  // save configurations
  $("#save").click(function () {
    config.enabled = $("[name=mode]:checked").val();
    config.amount = $("[name=link]").val();

    twitch.configuration.set("broadcaster", "1.0", JSON.stringify(config));
  });

  // when we click the mode button
  $("input[name='mode']").click(function () {
    let title_link;
    switch (this.id) {
      case "dpp":
        title_link = "Lien de la page perso";
        break;
      case "dr":
        title_link = "Lien du build Dofus Room";
        break;
    }
    $("#title_link").text(title_link);
  });
});
