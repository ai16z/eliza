import {
    ButtplugClient,
    ButtplugNodeWebsocketClientConnector,
    ButtplugClientDevice,
} from "buttplug";
import { LovenseNora } from "./fake-buttplug";

import { spawn } from "child_process";
import net from "net";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const WEBSOCKET_PORT = 54817;

export async function isPortAvailable(port: number): Promise<boolean> {
    return new Promise((resolve) => {
        const server = net
            .createServer()
            .once("error", () => resolve(false))
            .once("listening", () => {
                server.close();
                resolve(true);
            })
            .listen(port);
    });
}

interface TestDevice {
    name: string;
    vibrate(speed: number): Promise<void>;
    stop(): Promise<void>;
    disconnect(): Promise<void>;
    getBatteryLevel?(): Promise<number>;
}

class ButtplugDeviceWrapper implements TestDevice {
    constructor(
        private device: ButtplugClientDevice,
        private client: ButtplugClient
    ) {
        this.name = device.name;
    }
    name: string;

    async vibrate(speed: number) {
        try {
            await this.device.vibrate(speed);
            console.log(
                `[Simulation] Vibrating ${this.name} at ${speed * 100}%`
            );
        } catch (err) {
            console.error("Vibration error:", err);
            throw err;
        }
    }

    async stop() {
        try {
            await this.device.stop();
            console.log(`[Simulation] Stopping ${this.name}`);
        } catch (err) {
            console.error("Stop error:", err);
            throw err;
        }
    }

    async disconnect() {
        try {
            await this.device.stop();
            await this.client.disconnect();
            // Kill the Intiface Engine server process
            try {
                const killCommand =
                    process.platform === "win32"
                        ? spawn("taskkill", [
                              "/F",
                              "/IM",
                              "intiface-engine.exe",
                          ])
                        : spawn("pkill", ["intiface-engine"]);

                await new Promise((resolve) => {
                    killCommand.on("close", resolve);
                });
            } catch (killErr) {
                console.error("Error killing Intiface Engine:", killErr);
            }
        } catch (err) {
            console.error("Disconnect error:", err);
        }
    }

    async getBatteryLevel(): Promise<number> {
        try {
            const battery = await this.device.battery();
            console.log(
                `[Simulation] Battery level for ${this.name}: ${battery * 100}%`
            );
            return battery;
        } catch (err) {
            console.error("Battery check error:", err);
            throw err;
        }
    }
}

export async function startIntifaceEngine(): Promise<void> {
    try {
        const child = spawn(
            path.join(__dirname, "../intiface-engine/intiface-engine"),
            [
                "--websocket-port",
                "12345",
                "--use-bluetooth-le",
                "--server-name",
                "Eliza Buttplugin Server",
                "--log",
                "debug",
                "--use-device-websocket-server",
                "--device-websocket-server-port",
                WEBSOCKET_PORT.toString(),
                "--user-device-config-file",
                path.join(__dirname, "buttplug-user-device-config-test.json"),
            ],
            {
                detached: true,
                stdio: "ignore",
                windowsHide: true,
            }
        );

        child.unref();
        await new Promise((resolve) => setTimeout(resolve, 5000));
    } catch (error) {
        throw new Error(`Failed to start Intiface Engine: ${error}`);
    }
}

async function getTestDevice(): Promise<TestDevice> {
    const client = new ButtplugClient("Test Client");
    const connector = new ButtplugNodeWebsocketClientConnector(
        "ws://localhost:12345"
    );

    try {
        await client.connect(connector);
        client.on("deviceremoved", () => {
            console.log("Device disconnected");
        });

        await client.startScanning();
        await new Promise((r) => setTimeout(r, 2000));

        const devices = client.devices;
        if (devices.length > 0) {
            console.log("Using real Buttplug device:", devices[0].name);
            return new ButtplugDeviceWrapper(devices[0], client);
        }

        await client.disconnect();
        console.log("No real devices found, falling back to simulator");
        return new LovenseNora(WEBSOCKET_PORT);
    } catch (err) {
        console.log(
            "Couldn't connect to Buttplug server, attempting to start Intiface Engine..."
        );
        try {
            const portAvailable = await isPortAvailable(12345);
            if (portAvailable) {
                await startIntifaceEngine();
                await new Promise((resolve) => setTimeout(resolve, 5000));

                await client.connect(connector);
                await client.startScanning();
                await new Promise((r) => setTimeout(r, 5000));

                const devices = client.devices;
                if (devices.length > 0) {
                    console.log("Using real Buttplug device:", devices[0].name);
                    return new ButtplugDeviceWrapper(devices[0], client);
                }
            }
            await client.disconnect();
        } catch (startupErr) {
            console.log("Failed to start Intiface Engine:", startupErr);
            try {
                await client.disconnect();
            } catch {} // Ignore disconnect errors
        }
        console.log("Falling back to simulator");
        return new LovenseNora(WEBSOCKET_PORT);
    }
}

async function runTestSequence(device: TestDevice) {
    console.log("Starting test sequence with:", device.name);
    await new Promise((r) => setTimeout(r, 1000));

    // Check battery level if supported
    if (device.getBatteryLevel) {
        console.log("\n=== Testing Battery Level ===");
        try {
            const batteryLevel = await device.getBatteryLevel();
            console.log(`Battery level: ${batteryLevel * 100}%`);
        } catch (err) {
            console.log("Battery level check not supported or failed");
        }
        await new Promise((r) => setTimeout(r, 1000));
    }

    // Test vibration
    console.log("\n=== Testing Vibration ===");
    console.log("Vibrating at 25%");
    await device.vibrate(0.25);
    await new Promise((r) => setTimeout(r, 2000));

    console.log("Vibrating at 75%");
    await device.vibrate(0.75);
    await new Promise((r) => setTimeout(r, 2000));

    console.log("Stopping vibration");
    await device.stop();
    await new Promise((r) => setTimeout(r, 1000));

    // Test rotation if available
    if ("rotate" in device) {
        console.log("\n=== Testing Rotation ===");
        console.log("Rotating at 30%");
        await (device as LovenseNora).rotate(0.3);
        await new Promise((r) => setTimeout(r, 2000));

        console.log("Rotating at 90%");
        await (device as LovenseNora).rotate(0.9);
        await new Promise((r) => setTimeout(r, 2000));

        console.log("Stopping rotation");
        await device.stop();
        await new Promise((r) => setTimeout(r, 1000));
    }

    // Test combined movements if available
    if ("rotate" in device) {
        console.log("\n=== Testing Combined Movements ===");
        console.log("Vibrating at 50% and rotating at 60%");
        await device.vibrate(0.5);
        await (device as LovenseNora).rotate(0.6);
        await new Promise((r) => setTimeout(r, 3000));

        console.log("Stopping all motors");
        await device.stop();
        await new Promise((r) => setTimeout(r, 1000));
    }

    // Test rapid changes
    console.log("\n=== Testing Rapid Changes ===");
    for (let i = 0; i < 5; i++) {
        console.log(`Quick pulse ${i + 1}/5`);
        await device.vibrate(0.8);
        await new Promise((r) => setTimeout(r, 200));
        await device.stop();
        await new Promise((r) => setTimeout(r, 300));
    }

    // Check battery level again after usage
    if (device.getBatteryLevel) {
        console.log("\n=== Checking Battery After Usage ===");
        try {
            const batteryLevel = await device.getBatteryLevel();
            console.log(`Battery level after tests: ${batteryLevel * 100}%`);
        } catch (err) {
            console.log("Battery level check not supported or failed");
        }
        await new Promise((r) => setTimeout(r, 1000));
    }

    // Final cleanup
    console.log("\n=== Test Sequence Complete ===");
    await device.stop();
    await new Promise((r) => setTimeout(r, 500));
}

async function main() {
    let device: TestDevice | null = null;
    try {
        device = await getTestDevice();
        await runTestSequence(device);
    } catch (err) {
        console.error("Error during test:", err);
    } finally {
        if (device) {
            await new Promise((r) => setTimeout(r, 500));
            try {
                await device.disconnect();
            } catch (err) {
                console.error("Error during disconnect:", err);
            }
        }
        process.exit(0);
    }
}

main().catch((err) => {
    console.error("Unhandled error:", err);
    process.exit(1);
});
