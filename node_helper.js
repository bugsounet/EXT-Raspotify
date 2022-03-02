"use strict"

var NodeHelper = require("node_helper")
const systemd = require("@bugsounet/systemd")

module.exports = NodeHelper.create({
  start: function () {
    this.raspotify= null
  },

  stop: async function () {
    if (this.raspotify) {
      const RaspotifyStop = await this.raspotify.stop()
      if (RaspotifyStop.error) {
        console.error("[RASPOTIFY] Error: Raspotify can't stop !")
        console.error("[RASPOTIFY] Detail:", RaspotifyStop.error)
        return
      }
      console.log("[RASPOTIFY] Just stop now!")
    }
  },

  socketNotificationReceived: function (noti, payload) {
    switch (noti) {
      case "INIT":
        console.log("[RASPOTIFY] EXT-Raspotify Version:", require('./package.json').version, "rev:", require('./package.json').rev)
        this.initialize()
        break
      case "PLAYER-RECONNECT":
        this.Raspotify(true)
        break
    }
  },

  initialize: function() {
    console.log("[RASPOTIFY] Launch Raspotify...")
    this.raspotify = new systemd("raspotify")
    this.Raspotify()
  },

  Raspotify: async function (force = false) {
    if (!this.raspotify) {
      this.sendSocketNotification("WARNING" , { message: "RaspotifyError", values: "systemd library error" })
      return console.error("[RASPOTIFY] systemd library error!")
    }
    const RaspotifyStatus = await this.raspotify.status()
    if (RaspotifyStatus.error) {
      this.sendSocketNotification("WARNING" , { message: "RaspotifyNoInstalled" })
      return console.error("[RASPOTIFY] Error: Raspotify is not installed!")
    }
    if (RaspotifyStatus.state == "running" && !force) return console.log("[RASPOTIFY] Already Running.")

    const RaspotifyRestart = await this.raspotify.restart()
    if (RaspotifyRestart.error) {
      this.sendSocketNotification("WARNING" , { message: "RaspotifyError", values: "restart failed!" })
      console.error("[RASPOTIFY] Error on restart!")
    }
    else console.log("[RASPOTIFY] Restart.")
  }
})
