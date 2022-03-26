const path = require("path")
const fs = require("fs")
const util = require("util")
const exec = util.promisify(require("child_process").exec)
const readline = require("readline")
const systemd= require("@bugsounet/systemd")

var RaspotifyDeviceName = "MagicMirror"
var RaspotifyEmail = null
var RaspotifyPassword = null
var RaspotifyInitialVolume= 90

// Determinate your DeviceCard with: librespot --device ? 
var RaspotifyDeviceCard= "hw:CARD=Headphones,DEV=0" // for Headphones
//var RaspotifyDeviceCard= "hw:CARD=b1,DEV=0" // for HDMI

function checkConfig() {
  console.log("Read config.js and check EXT-Raspotify module Configuration...\n")
  let file = path.resolve(__dirname, "../../../config/config.js")
  if (fs.existsSync(file)) MMConfig = require(file)
  else return console.error("config.js not found !")
  let RaspotifyModule = MMConfig.modules.find(m => m.module == "EXT-Raspotify")

  if (!RaspotifyModule) {
    console.error("Fatal: EXT-Raspotify configuration not found in config.js !")
    return process.exit(1)
  }

  if (!RaspotifyModule.config) {
    console.log("Fatal: EXT-Raspotify configuration is not defined in config.js")
    return process.exit(1)
  }

  if (!RaspotifyModule.config.deviceName) console.log("Warning: deviceName not found! using default name:", RaspotifyDeviceName, "\n")
  else  RaspotifyDeviceName= RaspotifyModule.config.deviceName

  if (!RaspotifyModule.config.deviceCard) {
    console.log("Warning: deviceCard not found! using default name:", RaspotifyDeviceCard, "(Headphones setting)")
    console.log("You can determinate it with `librespot --device ?` command\n")
  }
  else  RaspotifyDeviceCard= RaspotifyModule.config.deviceCard

  if (!RaspotifyModule.config.email) {
    console.log("Fatal: email field is needed in your configuration")
    return process.exit(1)
  }

  if (!RaspotifyModule.config.password) {
    console.log("Fatal: password field is needed in your configuration")
    return process.exit(1)
  }

  if (!RaspotifyModule.config.maxVolume) console.log("Warning: maxVolume field is not defined in your config. Using default value:", RaspotifyInitialVolume, "\n")
  else RaspotifyInitialVolume = RaspotifyModule.config.maxVolume

  console.log("Info: deviceName found:", RaspotifyDeviceName)
  console.log("Info: deviceCard found:", RaspotifyDeviceCard)
  console.log("Info: Initial Volume:", RaspotifyInitialVolume)
  RaspotifyEmail = RaspotifyModule.config.email
  RaspotifyPassword = RaspotifyModule.config.password
  console.log("Info: Email found:", RaspotifyEmail)
  console.log("Info: Password found:", "******")
}

async function createConfig() {
  // before overwrite config... let's check if raspotify is installed
  const Systemd = new systemd("raspotify")
  const RaspotifyStatus = await Systemd.status()
  if (RaspotifyStatus.error) {
    console.error("[RASPOTIFY] Error: Raspotify is not installed!")
    return process.exit(1)
  }

  var RaspotifyConfig = `
# /etc/raspotify/conf -- Arguments/configuration for librespot

# A non-exhaustive list of librespot options and flags.

# Please see https://github.com/dtcooper/raspotify/wiki &
# https://github.com/librespot-org/librespot/wiki/Options
# for configuration details and a full list of options and flags.

# You can also find a full list with "librespot -h".

# To avoid name collisions environment variables must be prepended with
# "LIBRESPOT_", so option/flag "foo-bar" becomes "LIBRESPOT_FOO_BAR"".

# Invalid environment variables will be ignored.

# Raspotify defaults may vary from librespot defaults.
# Commenting out the environment variable will fallback to librespot's default
# unless otherwise noted.

# Flags are either on (uncommented) or off (commented),
# their values are otherwise not evaluated (but the "=" is still needed).

# Only log warning and error messages.
LIBRESPOT_QUIET=

# Automatically play similar songs when your music ends.
LIBRESPOT_AUTOPLAY=

# Disable caching of the audio data.
# Enabling audio data caching can take up a lot of space
# if you don't limit the cache size with LIBRESPOT_CACHE_SIZE_LIMIT.
# It can also wear out your Micro SD card. You have been warned. 
LIBRESPOT_DISABLE_AUDIO_CACHE=

# Disable caching of credentials.
# Caching of credentials is not necessary so long as
# LIBRESPOT_DISABLE_DISCOVERY is not set.
LIBRESPOT_DISABLE_CREDENTIAL_CACHE=

# Play all tracks at approximately the same apparent volume.
LIBRESPOT_ENABLE_VOLUME_NORMALISATION=

# Enable verbose log output.
#LIBRESPOT_VERBOSE=

# Disable zeroconf discovery mode.
#LIBRESPOT_DISABLE_DISCOVERY=

# Options will fallback to their defaults if commented out,
# otherwise they must have a valid value.

# Device name.
# Raspotify defaults to "raspotify (*hostname)".
# Librespot defaults to "Librespot".
LIBRESPOT_NAME="${RaspotifyDeviceName}"

# Bitrate (kbps) {96|160|320}. Defaults to 160.
LIBRESPOT_BITRATE="160"

# Output format {F64|F32|S32|S24|S24_3|S16}. Defaults to S16.
LIBRESPOT_FORMAT="S16"

# Displayed device type. Defaults to speaker.
LIBRESPOT_DEVICE_TYPE="speaker"

# Limits the size of the cache for audio files.
# It's possible to use suffixes like K, M or G, e.g. 16G for example.
# Highly advised if audio caching isn't disabled. Otherwise the cache
# size is only limited by disk space.
#LIBRESPOT_CACHE_SIZE_LIMIT=""

# Audio backend to use, alsa or pipe. Defaults to alsa.
LIBRESPOT_BACKEND="alsa"

# Username used to sign in with.
# Credentials are not required if LIBRESPOT_DISABLE_DISCOVERY is not set.
LIBRESPOT_USERNAME="${RaspotifyEmail}"

# Password used to sign in with.
LIBRESPOT_PASSWORD="${RaspotifyPassword}"

# Audio device to use, use "librespot --device ?" to list options.
# Defaults to the system's default.
LIBRESPOT_DEVICE="${RaspotifyDeviceCard}"

# Initial volume in % from 0 - 100.
# Defaults to 50 For the alsa mixer: the current volume.
LIBRESPOT_INITIAL_VOLUME="${RaspotifyInitialVolume}"

# Volume control scale type {cubic|fixed|linear|log}.
# Defaults to log.
LIBRESPOT_VOLUME_CTRL="log"

# Range of the volume control (dB) from 0.0 to 100.0.
# Default for softvol: 60.0.
# For the alsa mixer: what the control supports.
LIBRESPOT_VOLUME_RANGE="50.0"

# Pregain (dB) applied by volume normalisation from -10.0 to 10.0.
# Defaults to 0.0.
#LIBRESPOT_NORMALISATION_PREGAIN="0.0"

# Threshold (dBFS) at which point the dynamic limiter engages
# to prevent clipping from 0.0 to -10.0.
# Defaults to -2.0.
#LIBRESPOT_NORMALISATION_THRESHOLD="-2.0"

# The port the internal server advertises over zeroconf 1 - 65535.
# Ports <= 1024 may require root privileges.
#LIBRESPOT_ZEROCONF_PORT=""

# HTTP proxy to use when connecting.
#LIBRESPOT_PROXY=""
`
  console.log("Writing your Raspotify configuration...\n")
  // push new config
  fs.writeFile("/etc/raspotify/conf", RaspotifyConfig, async (err, data) => {
    if (err) {
      console.log("[RASPOTIFY] Error:", err.message)
      return process.exit(1)
    }
    // apply new config and restart raspotify
    console.log("[RASPOTIFY] Restart Raspotify with new configuration...")
    const RaspotifyRestart = await Systemd.restart()
    if (RaspotifyRestart.error) {
      console.log("[RASPOTIFY] Error when restart Raspotify!")
      return process.exit(1)
    }
    console.log("[RASPOTIFY] Restart done!")
  })
}

async function main() {
  await checkConfig()
  await createConfig()
}

main()
