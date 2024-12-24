---
sidebar_position: 18
---

# End-to-end encrypted messaging

AI is transforming consumer tech, with messaging becoming the main channel for interacting with agent services. This shift will scale message traffic astronomically, analogous to the web’s rise in the 2000s. Just as Cloudflare and https secured web traffic, messaging will need robust scalable end-to-end encrypted messages to protect sensitive information.

## Risks

Risks of not using end-to-end encryption for agent interactions exposes the users to what is called as Man in the **Middle Attacks**.

> **Man in the Middle Attacks**: Intercept requests in between to alter or manipulate data sent or received by the AI service

- **Phishing**: Messages can be intercepted and manipulated.
- **Privacy**: Sensitive information read by unwanted parties
- **Tampering**: Content can be altered without detection.

:::tip
More concrete sensitive data could include credit card details, private keys and passwords which is not yet widely spread but as agents become smarter more use cases will include this type of sharing.
:::

## XMTP

Eliza agents come with a ready to use client that uses XMTP providing end-to-end encrypted messaging for every agent intereaction, crucial for privacy, security, and compliance provided by the XMTP network.

### Features:

- **E2EE**: End to end encrypted MLS encryption
- **Multi-agent**: Support multi-agent through group chats
- **Interoperable**: Works across all platforms and frontends
- **Scalable**: Decentralized, open-source
- **Anonymous**: By default every identity is ephemeral and anonymous.

### Installation

Install the `xmtp` package

```bash [cmd]
bun install xmtp
```

### Usage

This is how you can use the `xmtp` package to create an agent and handle messages.

- `WALLET_PRIVATE_KEY`: This will encrypt all messages and make it available through its public address or ens domain.

```tsx
import { XMTP } from "xmtp";

const xmtp = new XMTP(onMessage, {
    encryptionKey: WALLET_PRIVATE_KEY,
});
await xmtp.init();
const onMessage = async (message, user) => {
    console.log(`Decoded message: ${message.content.text} by ${user.address}`);
    // Your AI model response
    await xmtp.send({
        message: response,
        originalMessage: message,
    });
};
```

For more information visit XMTP [website](https://xmtp.org/)
