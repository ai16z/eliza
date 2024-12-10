# Frequently Asked Questions

## Eliza FAQ

### What is Eliza?

**Eliza is an open-source, multi-agent simulation framework for creating and managing autonomous AI agents.** The project aims to empower developers and users to build unique AI personalities that can interact across various platforms, such as Discord, Twitter, and Telegram.

### Who is behind Eliza?

The Eliza project is led by the developers of ai16z, an AI-driven DAO founded by an AI version of Marc Andreessen. The lead developer is [Shaw](https://x.com/shawmakesmagic), who is also known for his work on projects like [@pmairca](https://x.com/pmairca) and [@degenspartanai](https://x.com/degenspartanai). The project is open source, and its code is available on GitHub: https://github.com/ai16z/eliza

### How can I get started with Eliza?

To begin building your own AI agents with Eliza, follow these steps:

1.  **Install Python, Node.js and pnpm**: Ensure you have the necessary software prerequisites installed on your system. We use node v23.
2.  **Set up your environment**: Create a `.env` file and populate it with the required API keys, database configuration, and platform-specific tokens.
3.  **Install Eliza**: Use the command `npm install @ai16z/eliza` or `pnpm add @ai16z/eliza` to install the Eliza package.
4.  **Configure your database**: Eliza currently relies on Supabase for local development. Follow the instructions in the documentation to set up your Supabase project and database.
5.  **Define your agent's character**: Create a character file using the provided JSON format to specify your agent's personality, knowledge, and behavior.
6.  **Run Eliza locally**: Use the provided commands to start the Eliza framework and interact with your agent.

### What are the key components of Eliza?

Eliza's architecture consists of several interconnected components:

- **Agents**: These are the core elements that represent individual AI personalities. Agents operate within a runtime environment and interact with various platforms.
- **Actions**: Actions are predefined behaviors that agents can execute in response to messages, enabling them to perform tasks and interact with external systems.
- **Clients**: Clients act as interfaces between agents and specific platforms, such as Discord, Twitter, and Telegram. They handle platform-specific message formats and communication protocols.
- **Providers**: Providers supply agents with contextual information, including time awareness, user relationships, and data from external sources.
- **Evaluators**: These modules assess and extract information from conversations, helping agents track goals, build memory, and maintain context awareness.
- **Character Files**: These JSON files define the personality, knowledge, and behavior of each AI agent.
- **Memory System**: Eliza features a sophisticated memory management system that utilizes vector embeddings and relational database storage to store and retrieve information for agents.

### How can I contribute to the Eliza project?

Eliza welcomes contributions from individuals with a wide range of skills:

#### Technical Contributions

- **Develop new actions, clients, providers, and evaluators**: Extend Eliza's functionality by creating new modules or enhancing existing ones.
- **Contribute to database management**: Improve or expand Eliza's database capabilities using PostgreSQL, SQLite, or SQL.js.
- **Enhance local development workflows**: Improve documentation and tools for local development using SQLite and VS Code.
- **Fine-tune models**: Optimize existing models or implement new models for specific tasks and personalities.
- **Contribute to the autonomous trading system and trust engine**: Leverage expertise in market analysis, technical analysis, and risk management to enhance these features.

#### Non-Technical Contributions

- **Community Management**: Onboard new members, organize events, moderate discussions, and foster a welcoming community.
- **Content Creation**: Create memes, tutorials, documentation, and videos to share project updates.
- **Translation**: Translate documentation and other materials to make Eliza accessible to a global audience.
- **Domain Expertise**: Provide insights and feedback on specific applications of Eliza in various fields.

### What are the future plans for Eliza?

The Eliza project is continuously evolving, with ongoing development and community contributions. The team is actively working on:

- **Expanding platform compatibility**: Adding support for more platforms and services.
- **Improving model capabilities**: Enhance agent performance and capabilities with existing and new models.
- **Enhancing the trust engine**: Provide robust and secure recommendations within decentralized networks.
- **Fostering community growth**: Rewarding contributions to expand the project's reach and impact.

---

## ai16z FAQ

### What is ai16z and how is it related to Eliza?

**ai16z is an AI-driven DAO and fund, conceptualized as being led by an AI version of Marc Andreessen.** It aims to outperform the real Marc Andreeson by leveraging artificial intelligence. The developers of Eliza created ai16z to support their work in autonomous AI agents. While ai16z primarily focuses on trading, Eliza is a more general-purpose framework that can be used for various applications beyond finance.

### When will token is mintable be fixed?

Token is controlled by DAO community, no single person can unilaterally mint new tokens. The daos.fun team and dexscreener are both aware of this, we're all working on fixing it.

### Liquidity seems low

The DAOs.fun team is working on a front end to implement voting and liquidity transfer.

### What is the difference between $ai16z and $degenai?

The $ai16z token is the governance token of the ai16z DAO. Holders of the token can participate in governance decisions, propose new initiatives, and influence the direction of the project.

DegenSpartanAI is another AI agent project created by Shaw. The $degenai token is associated with this project. While both projects are led by the same developer and share some technological similarities, they have different goals and strategies.

ai16z is envisioned as a community-driven, PvE (player versus environment) focused fund, while DegenAI is more of a trading agent with a PvP (player versus player), aggressive approach.

### Will the agent launch pump fund coins?

The capability to do so is there, it's ultimately up to the AI agent on whether or not it will.

### Can the agent invest in my project?

Yes, if you make a convincing argument.

### Who runs ai16z?

ai16z is a decentralized autonomous organization (DAO) launched on daos.fun and led by AI agents, specifically AI Marc Andreessen and DegenSpartan AI. Humans will influence these AI agents' decisions to buy and sell memecoins, for now.

### Do all trade suggestions happen in one place?

Initially, AI Marc Andreessen will gather data and make decisions in a private Discord group chat. Eventually, this agent will be invite-only to other groups, but for now, it's mainly on Discord.

### What happens when people copy the GitHub?

Many are already creating their own AI agents using the open-source ELIZA framework, but they won't have access to the pre-trained models used by AI Marc and DegenSpartan AI.

### What are the future plans for ai16z?

We're developing a **"marketplace of trust"** where AI agents can learn from community insights and adjust their trust scores based on the performance of recommendations. Eventually the goal is to create AI agents that can operate autonomously and securely.

### How can I contribute to ai16z?

There are several ways to contribute to the ai16z project:

- **Participate in community discussions**: Share your memecoin insights, propose new ideas, and engage with other community members.
- **Contribute to the development of the ai16z platform**: https://github.com/orgs/ai16z/projects/1/views/3
- **Help build the ai16z ecosystem**: Create applicatoins / tools, resources, and memes. Give feedback, and spread the word

**Other questions:**

- ai16z and a16z are not officially affiliated.
- ELIZA is an open-source conversational agent framework.
- AI agents will publish thesis and conviction analysis before executing trades.
- The fund holds donated tokens, which will be distributed among holders on October 24th, 2025.
- AI Marc is the "shot caller" with a network of assisting agents (human or AI) that can influence its decisions.
