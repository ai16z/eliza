import express from "express";
import bodyParser from "body-parser";
import cors from "cors";

import {
    AgentRuntime,
    elizaLogger,
    validateCharacterConfig,
} from "@ai16z/eliza";

import { REST, Routes } from "discord.js";

export function createApiRouter(agents: Map<string, AgentRuntime>, directClient) {
    const router = express.Router();

    router.use(cors());
    router.use(bodyParser.json());
    router.use(bodyParser.urlencoded({ extended: true }));

    router.get("/", (req, res) => {
        res.send("Welcome, this is the REST API!");
    });

    router.get("/hello", (req, res) => {
        res.json({ message: "Hello World!" });
    });

    router.get("/agents", (req, res) => {
        const agentsList = Array.from(agents.values()).map((agent) => ({
            id: agent.agentId,
            name: agent.character.name,
            clients: Object.keys(agent.clients),
        }));
        res.json({ agents: agentsList });
    });

    router.get("/agents/:agentId", (req, res) => {
        const agentId = req.params.agentId;
        const agent = agents.get(agentId);

        if (!agent) {
            res.status(404).json({ error: "Agent not found" });
            return;
        }

        res.json({
            id: agent.agentId,
            character: agent.character,
        });
    });

    // can use 0 for agentId to start an agent
    router.post("/agents/:agentId/set", async (req, res) => {
        const agentId = req.params.agentId;
        let agent:AgentRuntime = agents.get(agentId);

        // is it an agent update?
        if (agent) {
            // stop agent
            agent.stop()
            directClient.unregisterAgent(agent)
            // if it has a different name, the agentId will change
        }

        // load character from body
        const character = req.body
        try {
          validateCharacterConfig(character)
        } catch(e) {
          elizaLogger.error(`Error parsing character: ${e}`);
          res.status(400).json({
            success: false,
            message: e.message,
          });
          return;
        }

        // start it up (and register it)
        agent = await directClient.startAgent(character)
        elizaLogger.log(`${character.name} started`)

        res.json({
            id: character.id,
            character: character,
        });
    });


    router.get("/agents/:agentId/channels", async (req, res) => {
        const agentId = req.params.agentId;
        const runtime = agents.get(agentId);

        if (!runtime) {
            res.status(404).json({ error: "Runtime not found" });
            return;
        }

        const API_TOKEN = runtime.getSetting("DISCORD_API_TOKEN") as string;
        const rest = new REST({ version: "10" }).setToken(API_TOKEN);

        try {
            const guilds = (await rest.get(Routes.userGuilds())) as Array<any>;

            res.json({
                id: runtime.agentId,
                guilds: guilds,
                serverCount: guilds.length,
            });
        } catch (error) {
            console.error("Error fetching guilds:", error);
            res.status(500).json({ error: "Failed to fetch guilds" });
        }
    });

    router.post("/agents/:agentId/memory/add", async (req, resp) => {
        // Validate input
        const errors = []
        const { memoryString } = req.body;
        if (!memoryString) {
            errors.push('memory is required')
        }
        const agentId = req.params.agentId;
        const runtime = agents.get(agentId);
        if (!runtime) {
            errors.push('Runtime not found')
        }
        if (errors.length) {
            res.status(404).json({ errors });
            return;
        }

        const res = runtime.addStringToMemory(memoryString)
        // lock return format incase internals change
        resp.json({
            id: res.id,
            have: res.have,
        });
    })

    return router;
}
