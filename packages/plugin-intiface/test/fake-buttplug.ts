import WebSocket from "ws";
import EventEmitter from "events";

interface DeviceHandshake {
    identifier: string;
    address: string;
    version: number;
}

abstract class SimulatedDevice extends EventEmitter {
    protected ws: WebSocket | null = null;
    protected connected = false;
    protected shouldReconnect = true;
    name: string;
    protected cmdLog: Record<number, string> = {};

    constructor(
        protected port: number,
        protected deviceType: string,
        protected address: string
    ) {
        super();
        this.name = `Simulated ${deviceType}`;
        this.connect();
    }

    private connect(): void {
        if (this.ws || !this.shouldReconnect) return;

        console.log(
            `[fake-buttplug] Connecting ${this.deviceType} to port ${this.port}`
        );
        this.ws = new WebSocket(`ws://127.0.0.1:${this.port}`);

        this.ws.on("open", () => {
            this.connected = true;
            console.log(`[fake-buttplug] ${this.deviceType} connected`);
            const handshake: DeviceHandshake = {
                identifier: this.getIdentifier(),
                address: this.address,
                version: 0,
            };
            this.ws?.send(JSON.stringify(handshake));
        });

        this.ws.on("message", (data: string) => {
            const message = data.toString();
            console.log(
                `[fake-buttplug] ${this.deviceType} received:`,
                message
            );
            this.handleMessage(message);
        });

        this.ws.on("error", (error) => {
            if (this.shouldReconnect) {
                console.log(
                    `[fake-buttplug] ${this.deviceType} error:`,
                    error.message
                );
                this.reconnect();
            }
        });

        this.ws.on("close", () => {
            if (this.shouldReconnect) {
                console.log(`[fake-buttplug] ${this.deviceType} disconnected`);
                this.connected = false;
                this.reconnect();
            }
        });
    }

    private reconnect(): void {
        if (!this.connected && this.shouldReconnect) {
            this.ws = null;
            setTimeout(() => this.connect(), 1000);
        }
    }

    protected abstract getIdentifier(): string;
    protected abstract handleMessage(message: string): void;

    async disconnect(): Promise<void> {
        this.shouldReconnect = false;
        if (this.ws) {
            await this.stop();
            this.ws.close();
            this.ws = null;
        }
        this.connected = false;
    }

    abstract stop(): Promise<void>;
}

export class LovenseNora extends SimulatedDevice {
    private batteryQueryReceived = false;
    private batteryLevel = 0.9;
    private vibrateCmdLog: Record<number, string> = {};
    private rotateCmdLog: Record<number, string> = {};

    constructor(port: number = 54817) {
        super(port, "Lovense Nora", "696969696969");
    }

    protected getIdentifier(): string {
        return "LVSDevice";
    }

    protected handleMessage(message: string): void {
        if (message.startsWith("DeviceType;")) {
            this.ws?.send(`A:${this.address}:10`);
            console.log(
                `[fake-buttplug] Sent device type response: A:${this.address}:10`
            );
        } else if (message.startsWith("Vibrate:")) {
            const match = message.match(/Vibrate:(\d+);/);
            if (match) {
                const speed = parseInt(match[1]);
                if (
                    speed === 0 &&
                    Object.keys(this.vibrateCmdLog).length === 0
                ) {
                    return;
                }
                this.vibrateCmdLog[Date.now()] = message;
                console.log(
                    `[fake-buttplug] Vibrate command logged: ${message}`
                );
            }
        } else if (message.startsWith("Rotate:")) {
            const match = message.match(/Rotate:(\d+);/);
            if (match) {
                const speed = parseInt(match[1]);
                if (
                    speed === 0 &&
                    Object.keys(this.rotateCmdLog).length === 0
                ) {
                    return;
                }
                this.rotateCmdLog[Date.now()] = message;
                console.log(
                    `[fake-buttplug] Rotate command logged: ${message}`
                );
            }
        } else if (message.startsWith("Battery")) {
            this.batteryQueryReceived = true;
            const response = `${Math.floor(this.batteryLevel * 100)};`;
            this.ws?.send(response);
            console.log(
                `[fake-buttplug] Battery query received, responding with: ${response}`
            );
        }
    }

    async vibrate(speed: number): Promise<void> {
        if (!this.connected || !this.ws) {
            throw new Error("Device not connected");
        }
        const command = `Vibrate:${Math.floor(speed * 100)};`;
        this.ws.send(command);
        console.log(`[fake-buttplug] Sending vibrate command: ${command}`);
    }

    async rotate(speed: number): Promise<void> {
        if (!this.connected || !this.ws) {
            throw new Error("Device not connected");
        }
        const command = `Rotate:${Math.floor(speed * 100)};`;
        this.ws.send(command);
        console.log(`[fake-buttplug] Sending rotate command: ${command}`);
    }

    async stop(): Promise<void> {
        if (this.connected && this.ws) {
            this.ws.send("Vibrate:0;");
            this.ws.send("Rotate:0;");
            console.log("[fake-buttplug] Stopping all motors");
        }
    }

    async getBatteryLevel(): Promise<number> {
        if (!this.connected || !this.ws) {
            throw new Error("Device not connected");
        }
        this.ws.send("Battery;");
        return this.batteryLevel;
    }
}

// Start simulator if run directly
if (import.meta.url === new URL(import.meta.url).href) {
    console.log("[fake-buttplug] Starting simulator service");
    const simulator = new LovenseNora();

    process.on("SIGINT", async () => {
        console.log("[fake-buttplug] Shutting down simulator");
        await simulator.disconnect();
        process.exit(0);
    });
}
