import type { IAgentRuntime, Memory, State, HandlerCallback } from "@elizaos/core";
import { RemoteAttestationProvider } from "../providers/remoteAttestationProvider";
import { fetch, type BodyInit } from "undici";

function hexToUint8Array(hex: string) {
    hex = hex.trim();
    if (!hex) {
      throw new Error("Invalid hex string");
    }
    if (hex.startsWith("0x")) {
      hex = hex.substring(2);
    }
    if (hex.length % 2 !== 0) {
      throw new Error("Invalid hex string");
    }

    const array = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      const byte = parseInt(hex.slice(i, i + 2), 16);
      if (isNaN(byte)) {
        throw new Error("Invalid hex string");
      }
      array[i / 2] = byte;
    }
    return array;
}

async function uploadUint8Array(data: Uint8Array) {
    const blob = new Blob([data], { type: "application/octet-stream" });
    const formData = new FormData();
    formData.append("file", blob, 'quote.bin');

    return await fetch("https://proof.t16z.com/api/upload", {
        method: "POST",
        body: formData as BodyInit,
      });
}

export const remoteAttestationAction = {
    name: "REMOTE_ATTESTATION",
    similes: ["REMOTE_ATTESTATION", "TEE_REMOTE_ATTESTATION", "TEE_ATTESTATION"],
    description: "Generate a remote attestation to prove that the agent is running in a TEE",
    handler: async (
        runtime: IAgentRuntime,
        _message: Memory,
        _state: State,
        _options: { [key: string]: unknown },
        callback: HandlerCallback,
    ) => {
        try {
            // Get the remote attestation of the agentId
            const agentId = runtime.agentId;
            const agentName = runtime.character.name;
            const teeMode = runtime.getSetting("TEE_MODE");
            const provider = new RemoteAttestationProvider(teeMode);
            const attestation = await provider.generateAttestation(agentId, 'raw');
            const attestationData = hexToUint8Array(attestation.quote);
            const response = await uploadUint8Array(attestationData);
            const data = await response.json();
            callback({
                text: `Here's my 🧾 RA Quote 🫡

                https://proof.t16z.com/reports/${data.checksum}`,
                action: "NONE",
            });
            return true;
        } catch (error) {
            console.error("Failed to fetch remote attestation: ", error);
            return false;
        }
    },
    validate: async (_runtime: IAgentRuntime) => {
        return true;
    },
    examples: [
        [
            {
                user: "{{user1}}",
                content: {
                    text: "If you are running in a TEE, generate a remote attestation",
                },
            },
            {
                user: "{{user2}}",
                content: {
                    text: "Of course, one second...",
                    action: "REMOTE_ATTESTATION",
                },
            }
        ],
    ],
};
