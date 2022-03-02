/**
 ** Module : EXT-Raspotify
 ** @bugsounet
 ** ©02-2022
 ** support: http://forum.bugsounet.fr
 **/

Module.register("EXT-Raspotify", {
  defaults: {
    debug: false
  },

  getDom: function() {
    var dom = document.createElement("div")
    dom.style.display = 'none'
    return dom
  },

  getTranslations: function() {
    return {
      en: "translations/en.json",
      fr: "translations/fr.json",
      it: "translations/it.json",
      de: "translations/de.json",
      es: "translations/es.json",
      nl: "translations/nl.json",
      pt: "translations/pt.json",
      ko: "translations/ko.json"
    }
  },

  notificationReceived: function(noti, payload, sender) {
    switch(noti) {
      case "DOM_OBJECTS_CREATED":
        this.sendSocketNotification("INIT", this.config)
        break
      case "GAv4_READY":
        if (sender.name == "MMM-GoogleAssistant") this.sendNotification("EXT_HELLO", this.name)
        break
      case "EXT_PLAYER-SPOTIFY_RECONNECT":
        this.sendSocketNotification("PLAYER-RECONNECT")
        break
    }
  },

  socketNotificationReceived: function(noti, payload) {
    if (noti == "WARNING") {
      this.sendNotification("EXT_ALERT", {
        type: "warning",
        message: this.translate(payload.message, {VALUES: payload.values}),
        icon: "modules/EXT-Raspotify/resources/Spotify-Logo.png"
      })
    }
  },

  getCommands: function(commander) {
    commander.add({
      command: "raspotify",
      description: this.translate("TBRestart"),
      callback: "tbRaspotify"
    })
  },

  tbRaspotify: function(command, handler) {
    this.sendSocketNotification("PLAYER-RECONNECT")
    handler.reply("TEXT", this.translate("TBRestarted"))
  }
})
