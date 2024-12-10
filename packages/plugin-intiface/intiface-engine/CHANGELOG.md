# Intiface Engine v1.4.8 (2023/11/16)

## Features

- Update to Buttplug v7.1.9
  - Added Lovense Solace, OhMiBod Foxy, Chill support

# Intiface Engine v1.4.7 (2023/11/04)

## Features

- Allow logging to use environment variables for setup over command line prefs
- Update to Buttplug v7.1.8
  - Add lovense device support
  - Fix some device support issues

# Intiface Engine v1.4.6 (2023/10/19)

## Features

- Update to Buttplug v7.1.7
  - Fixes memory leak in mDNS handling
  - Defaults to device keepalive being on when compiling for iOS

# Intiface Engine v1.4.5 (2023/10/08)

## Features

- Update to Buttplug v7.1.6
  - Fixes Lovense Dongle support
  - Added Foreo device support

# Intiface Engine v1.4.4 (2023/10/05)

## Bugfixes

- Make mDNS actually work in all cases (but it's still considered experimental)
- Fix compilation issues for android

# Intiface Engine v1.4.3 (2023/10/04)

## Features

- Update to Buttplug v7.1.5
  - Lots of device additions, HID device manager for Joycons
- Add mDNS broadcast capabilities

# Intiface Engine v1.4.2 (2023/07/16)

## Features

- Update to Buttplug v7.1.2
  - Device additions for Magic Motion, Lovense Connect bugfix

# Intiface Engine v1.4.1 (2023/07/09)

## Features

- Update to Buttplug v7.1.1
  - Mostly device additions/updates

# Intiface Engine v1.4.0 (2023/05/21)

## Features

- Update to Buttplug v7.1.0
  - Mostly device additions/updates
  - Some fixes for user configs
- Move ButtplugRemoteServer into Intiface Engine
  - Gives us more flexibility to change things in development
- Updates for user device config updates via Buttplug

# Intiface Engine v1.3.0 (2023/02/19)

## Features

- Added Websocket Client argument for running the engine as a websocket client instead of a server
- Update to Buttplug v7.0.2
  - Hardware protocols updates for Kizuna/Svakom/Sakuraneko

# Intiface Engine v1.2.2 (2023/01/30)

## Bugfixes

- Fix timing issue on sending EngineStopped message on exit

# Intiface Engine v1.2.1 (2023/01/16)

## Features

- Update to Buttplug v7.0.1
  - Hardware protocol updates/fixed, see Buttplug CHANGELOG for more info.

# Intiface Engine v1.2.0 (2023/01/01)

## Features

- Update to Buttplug v7.0.0
  - Major version move because of API breakage.
  - Mostly bugfixes otherwise.
  - Removes IPC Pipes, so removed them in Intiface Engine too.

# Intiface Engine v1.1.0 (2022/12/19)

## Features

- Update to Buttplug v6.3.0
  - Lots of device additions
  - Major bugfixes for WeVibe/Satisfyer/Magic Motion and Lovense Connect

# Intiface Engine v1.0.5 (2022/11/27)

## Bugfixes

- Update to Buttplug v6.2.2
  - Fixes issues with platform dependencies and DCMs
  - Fixes error message in common path in CoreBluetooth
  - Stops devices when server disconnects

# Intiface Engine v1.0.4 (2022/11/24)

## Features

- Update to Buttplug v6.2.1
- Add optional tokio_console feature for task debugging
- Remove crash reporting for now
  - Needs to be updated, more testing, etc...

# Intiface Engine v1.0.3 (2022/11/05)

## Features

- Implemented BackdoorServer, which allows access to server devices directly, while still allowing a
  client to access them simultaneously. Can't possibly see how this could go wrong.
- Added EngineServerCreated Event for IntifaceCentral to know when to bring up the BackdoorServer.

## Bugfixes

- Fixed issue where logging could stay alive through multiple server bringups when run in process.

# Intiface Engine v1.0.2 (2022/10/18)

## Bugfixes

- Vergen should not block building as a library dependency

# Intiface Engine v1.0.1 (2022/10/15)

## Features

- Update to Buttplug v6.1.0
  - Mostly bugfixes
  - Now requires v2.x device config files

# Intiface Engine v1.0.0 (2022/10/01)

## Breaking Changes

- Rebuilt command line arguments
  - Now in kebab case format
  - ALL DCMs require --use statements, there are no default DCMs anymore
- Incorporates changes made during the egui betas.
- The `--stay_open` argument is now assumed. The server will run until either Ctrl-C is pressed or
  an IPC stop message is received.

## Features

- Intiface Engine is now compiled as both a CLI (for desktop) and a Library (for mobile).
- Updated to Buttplug v6
- Moved to semantic versioning, major version denotes CLI argument or breaking IPC protocol change.

# v101 (egui Beta 2) (2021/01/25)

- Add websocket device server port selection

# v100 (egui Beta 1) (2021/01/04)

## Features

- Use JSON over named pipes instead of protobufs over stdio
- Add sentry crash logging
- Server version now uses a shorter tag
- Update to Rust 2021

# v50 (2022/04/26) - Last version of Intiface CLI

## Features

- Update to Buttplug v5.1.9
  - Add Magic Motion Crystal support
  - Fix issues with Satisfyer Plugalicious 2 connections
  - Fix issues with Satisfyer device identification

# v49 (2022/03/05)

## Features

- Update to Buttplug v5.1.8
  - Added Lelo F1s v2 support, more support for Mannuo/Magic Motion/OhMiBod devices
  - May fix issues with windows bluetooth on older Win 10 versions

# v48 (2021/01/24)

## Features

- Update to Buttplug v5.1.7
  - Lovense Calor support, Folove support, more WeVibe/Satisfyer support

# v47 (2022/01/04)

## Bugfixes

- No changes to build, re-release to fix issue with a wrong tag getting pushed.

# v46 (2022/01/01)

## Bugfixes

- Update to Buttplug v5.1.6
  - Fix issues with serial ports blocking, lovense connect data types, log message levels, etc...
  - See Buttplug v5.1.6 changelog for more info.
    (https://github.com/buttplugio/buttplug/blob/master/buttplug/CHANGELOG.md)

# v45 (2021/12/19)

## Bugfixes

- Update to Buttplug v5.1.5
  - Fix issues with Satisfyer name detection and disconnection
  - Fix issues with device scanning always saying it's instantly finished 

# v44 (2021/12/14)

## Bugfixes

- Update to Buttplug v5.1.4
  - Shouldn't change anything in here, all the fixes were FFI related, but eh.
- Try to get crash logs into frontend log output for easier debugging
- #14: Fix issue with intiface-cli not sending events to desktop after first disconnection

# v43 (2021/12/04)

## Bugfixes

- Update to Buttplug v5.1.2
  - Fix race condition with bluetooth advertisements causing multiple simultaneous connects to
    devices
- Update to vergen 5.2.0
  - Last version was yanked

# v42 (2021/12/03)

## Bugfixes

- Update to Buttplug v5.1.1
  - Fix issues with devices w/ advertised services being ignored
  - Fix issues with lovense dongle on linux

# v41 (2021/12/02)

## Features

- Update to Buttplug v5.1
  - Bluetooth library updates
  - Satisfyer/ManNuo/other device support (see Buttplug README)
  - Lots of other fixes
- Update to vergen v5, tracing-subscriber v0.3

# v40 (2021/09/14)

## Features

- Update to Buttplug v5.0.1
  - Better MacOS bluetooth support
  - Better Linux bluetooth support
  - Tons of device additions (see Buttplug README)
  - Adds websocket device interface

# v39 (2021/07/05)

## Features

- Server now throws warnings whenever a client tries to connect when another client is already
  connected.
- Update to Buttplug 4.0.4
  - Added hardware support for TCode devices, Patoo, Vorze Piston SA

## Bugfixes

- Fix cancellation of tasks on shutdown.

# v38 (2021/06/18)

## Bugfixes

- Update to buttplug-rs 4.0.3, which fixes issues with Android phones using the Lovense Connect app.

# v37 (2021/06/11)

## Bugfixes

- Fix timing issue where Process Ended message may not be seen by Intiface Desktop
- Update to buttplug-rs 4.0.2, fixing issue with Intiface Desktop stalling due to logging issues.
- Add Info.plist file for macOS Big Sur and later compat

# v36 (2021/06/10)

## Features

- Added opt-in/out arguments for all available device communication managers
- Added support for Lovense Connect Service

# v35 (2021/04/04)

## Bugfixes

- Update to Buttplug v2.1.9
  - Reduces error log messages thrown by lovense dongle
  - Reduces panics in bluetooth handling on windows
  - Fixes issue with battery checking on lovense devices stalling library on device disconnect

# v34 (2021/03/25)

## Bugfixes

- Update to Buttplug v2.1.8
  - Possibly fixes issue with bluetooth devices not registering disconnection on windows.

# v33 (2021/03/08)

## Bugfixes

- Update to Buttplug v2.1.7
  - Fixes legacy message issues with The Handy and Vorze toys
  - Fixes init issues with some Kiiroo vibrators

# v32 (2021/02/28)

## Bugfixes

- Update to Buttplug v2.1.6
  - Fixes issues with log message spamming
  - Update btleplug to 0.7.0, lots of cleanup

# v31 (2021/02/20)

## Bugfixes

- Update to Buttplug v2.1.5
  - Fixes panic in devices that disconnect during initialize().

# v30 (2021/02/13)

## Features

- Update to Buttplug v2.1.4
- Added Hardware Support
  - The Handy

## Bugfixes

- Fixes issues with the LoveAi Dolp and Lovense Serial Dongle

# v29 (2021/02/06)

## Bugfixes

- Update to Buttplug v2.1.3
  - Fix StopAllDevices so it actually stops all devices again
  - Allow for setting device intensity to 1.0

# v28 (2021/02/06)

## Features

- Update to Buttplug v2.1.1
  - Adds Lovense Diamo and Nobra's Silicone Dreams support
  - Lots of bugfixes and more/better errors being emitted

# v27 (2021/01/24)

## Bugfixes

- Update to Buttplug 2.0.5
  - Fixes issue with v2 protocol conflicts in DeviceMessageInfo

# v26 (2021/01/24)

## Bugfixes

- Update to Buttplug 2.0.4
  - Fixes issue with XInput devices being misaddressed and stopping all scanning.

# v25 (2021/01/19)

## Bugfixes

- Update to Buttplug 2.0.2
  - Fixes issue with scanning status getting stuck on Lovense dongles

# v24 (Yanked) (2021/01/18)

## Features

- Update to Buttplug 2.0.1
  - Event system and API cleanup
  - Lovense Ferri Support
- Backtraces now emitted via logging system when using frontend IPC

# v23 (2021/01/01)

## Bugfixes

- Update to Buttplug 1.0.4
  - Fixes issues with XInput Gamepads causing intiface-cli-rs crashes on reconnect.

# v22 (2021/01/01)

## Bugfixes

- Update to Buttplug 1.0.3
  - Fixes issues with BTLE advertisements and adds XInput device rescanning.

# v21 (2020/12/31)

## Bugfixes

- Update to Buttplug 1.0.1
  - Fixes issue with device scanning races.

# v20 (2020/12/22)

## Bugfixes

- Update to Buttplug 0.11.3
  - Fixes security issues and a memory leak when scanning is called often.

# v19 (2020/12/11)

## Bugfixes

- Update to Buttplug 0.11.2
  - Emits Scanningfinished when scanning is finished. Finally.

# v18 (2020/11/27)

## Features

- Update to buttplug-rs 0.11.1
  - System bugfixes
  - Mysteryvibe support

# v17 (2020/10/25)

## Features

- Update to buttplug-rs 0.10.1
  - Lovense Dongle Bugfixes
  - BLE Toy Connection Bugfixes
- Fix logging output
  - Pay attention to log option on command line again
  - Outputs full tracing JSON to frontend

# v16 (2020/10/17)

## Features

- Update to buttplug-rs 0.10.0
  - Kiiroo Keon Support
  - New raw device commands (use --allowraw option for access)

## Bugfixes

- Update to buttplug-rs 0.10.0
  - Lots of websocket crash fixes

# v15 (2020/10/05)

## Bugfixes

- Update to buttplug-rs 0.9.2 w/ btleplug 0.5.4, fixing an issue with macOS
  panicing whenever it tries to read from a BLE device.

# v14 (2020/10/05)

## Bugfixes

- Update to buttplug-rs 0.9.1 w/ btleplug 0.5.3, fixing an issue with macOS
  panicing whenever it tries to write to a BLE device.

# v13 (2020/10/04)

## Features

- Update to buttplug-rs 0.9.0, which now has Battery level reading capabilites
  for some hardware.

## Bugfixes

- Update to buttplug-rs 0.9.0, which now does not crash when 2 devices are
  connected and one disconnects.

# v12 (2020/10/02)

## Features

- Update to Buttplug-rs 0.8.4, fixing a bunch of device issues.
- Default to outputting info level logs if no env log var set. (Should pick this
  up from command line argument in future version)

## Bugfixes

- Only run for one connection attempt if --stayopen isn't passed in.

# v11 (2020/09/20)

## Bugfixes

- Moves to buttplug-0.8.3, which fixes support for some programs using older
  APIs (FleshlightLaunchFW12Cmd) for Kiiroo stroking products (Onyx, Fleshlight
  Launch, etc).

# v10 (2020/09/13)

## Features

- Added log handling from Buttplug library. Still needs protocol/CLI setting,
  currently outputs everything INFO or higher.

## Bugfixes

- Moves to buttplug-0.8.2, fixing Lovense rotation and adding log output
  support.

# v9 (2020/09/11)

## Bugfixes

- Moves to buttplug-0.7.3, which loads both RSA and pkcs8 certificates. This
  allows us to load the certs that come from Intiface Desktop.

# v8 (2020/09/07)

## Bugfixes

- Move to buttplug-rs 0.7.2, which adds more device configurations and fixes
  websocket listening on all interfaces.

# v7 (2020/09/06)

## Features

- Move to buttplug-rs 0.7.1, which includes status emitting features and way
  more device protocol support.
- Allow frontend to trigger process stop
- Send disconnect to frontend when client disconnects
- Can now relay connected/disconnected devices to GUIs via PBuf protocol

# v6 (2020/08/06)

## Features

- Move to buttplug-rs 0.6.0, which integrates websockets and server lifetime
  handling. intiface-cli-rs is now a very thin wrapper around buttplug-rs,
  handling system bringup and frontend communication and that's about it.

# v5 (2020/05/13)

## Bugfixes

- Move to buttplug-rs 0.3.1, with a couple of unwrap fixes

# v4 (2020/05/10)

## Features

- --stayopen option now actually works, reusing the server between
  client connections.

# v3 (2020/05/09)

## Features

- Added protobuf basis for hooking CLI into Intiface Desktop

## Bugfixes

- Fixed bug where receiving ping message from async_tungstenite would
  panic server
- Update to buttplug 0.2.4, which fixes ServerInfo message ID matching

# v2 (2020/02/15)

## Features

- Move to using rolling versioning, since this is a binary
- Move to using buttplug 0.2, with full server implementation
- Add cert generation
- Add secure websocket capabilities
- Move to using async-tungstenite
- Use Buttplug's built in JSONWrapper
- Add XInput capability on windows
- Add CI building
- Add Simple GUI message output for Intiface Desktop

# v1 (aka v0.0.1) (2020/02/15)

## Features

- First version
- Can bring up insecure websocket, run server, access toys
- Most options not used yet
