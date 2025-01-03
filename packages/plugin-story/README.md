# @elizaos/plugin-story

A plugin for managing intellectual property (IP) operations through Story Protocol's IP management and licensing system on the Odyssey testnet.

## Overview and Purpose

The Plugin Story simplifies the process of managing intellectual property by providing APIs and utilities for:

- Registering IP assets on Story Protocol
- Licensing IP assets
- Attaching license terms to IP assets
- Querying IP asset details and available licenses
- Managing wallet interactions with Story Protocol
- Integration with IPFS for decentralized storage

## Installation

```bash
pnpm install @elizaos/plugin-story
```

## Configuration Requirements

The plugin requires the following environment variables and dependencies:

```env
STORY_PRIVATE_KEY=your_private_key
STORY_API_KEY=your_api_key
STORY_API_BASE_URL=https://api.story.xyz
PINATA_JWT=your_pinata_jwt_token
```

Dependencies:
- `@story-protocol/core-sdk`
- `@pinata/sdk`
- `viem`
- `ethers`
- `@elizaos/core`
- `ipfs-http-client`

## Usage Examples

### Register Intellectual Property

```typescript
import { registerIP } from '@elizaos/plugin-story/actions/registerIP';

const ipDetails = {
  name: 'My First IP',
  description: 'A sample intellectual property',
  owner: '0x123...456',
};

try {
  const registrationResult = await registerIP(ipDetails);
  console.log('IP Registered Successfully:', registrationResult);
} catch (error) {
  console.error('IP Registration Failed:', error);
}
```

### License Intellectual Property

```typescript
import { licenseIP } from '@elizaos/plugin-story/actions/licenseIP';

const licenseData = {
  ipId: 'IP123',
  licenseType: 'Exclusive',
  duration: 12, // in months
};

try {
  const licenseResult = await licenseIP(licenseData);
  console.log('IP Licensed Successfully:', licenseResult);
} catch (error) {
  console.error('IP Licensing Failed:', error);
}
```

### Upload Data to IPFS

```typescript
import { uploadJSONToIPFS } from '@elizaos/plugin-story/functions/uploadJSONToIPFS';

const jsonData = {
  name: 'Sample Data',
  description: 'Data to be stored on IPFS',
};

try {
  const ipfsHash = await uploadJSONToIPFS(jsonData);
  console.log('Data uploaded to IPFS. Hash:', ipfsHash);
} catch (error) {
  console.error('IPFS Upload Failed:', error);
}
```

## API Reference

### Actions

- `REGISTER_IP`: Register a new IP asset
- `LICENSE_IP`: License an existing IP asset
- `ATTACH_TERMS`: Attach license terms to an IP
- `GET_IP_DETAILS`: Get details about an IP
- `GET_AVAILABLE_LICENSES`: Get available licenses for an IP

### Functions

#### `uploadJSONToIPFS`

Uploads JSON data to IPFS.

**Parameters:**
- `data: object`

**Returns:**
- `Promise<string>` - The IPFS hash of the uploaded data.

### Providers

- `storyWalletProvider`: Manages wallet interactions with Story Protocol

## Common Issues/Troubleshooting

### Issue: IPFS Upload Fails
- **Cause:** Invalid or large JSON data
- **Solution:** Validate and compress JSON data before uploading

### Issue: IP Registration Fails
- **Cause:** Missing or invalid owner address
- **Solution:** Verify the owner's blockchain address

## Development

### Building and Testing

```bash
npm run build
npm run test
```

### Security Best Practices
- Validate all inputs for IP management actions
- Ensure proper authentication and authorization for licensing
- Keep dependencies updated to prevent vulnerabilities

### Performance Optimization
- Optimize IPFS uploads by compressing data
- Cache frequently accessed IP details for faster retrieval

## Future Enhancements

1. **IP Management**

    - Batch IP registration
    - Advanced metadata management
    - IP relationship mapping
    - Automated IP verification
    - Collection management
    - IP analytics dashboard

2. **Licensing Features**

    - Custom license templates
    - License negotiation tools
    - Automated royalty distribution
    - Usage tracking system
    - License violation detection
    - Bulk licensing tools

3. **Rights Management**

    - Advanced permission systems
    - Rights transfer automation
    - Usage rights tracking
    - Derivative works management
    - Rights verification tools
    - Dispute resolution system

4. **Smart Contract Integration**

    - Contract deployment templates
    - Automated verification
    - Contract upgrade system
    - Security analysis tools
    - Gas optimization
    - Multi-signature support

5. **Content Management**

    - Media file handling
    - Content versioning
    - Distribution tracking
    - Content authentication
    - Storage optimization
    - Format conversion tools

6. **Revenue Management**

    - Automated payments
    - Revenue sharing tools
    - Payment tracking
    - Financial reporting
    - Tax documentation
    - Audit trail system

7. **Developer Tools**

    - Enhanced SDK features
    - Testing framework
    - Documentation generator
    - CLI improvements
    - Integration templates
    - Performance monitoring

8. **Analytics and Reporting**
    - Usage statistics
    - Revenue analytics
    - License tracking
    - Performance metrics
    - Custom reporting
    - Market analysis tools

We welcome community feedback and contributions to help prioritize these enhancements.

## Contributing

Contributions are welcome! Please see the [CONTRIBUTING.md](CONTRIBUTING.md) file for more information.

## Credits

This plugin integrates with and builds upon several key technologies:

- [Story Protocol](https://www.story.xyz/): IP management and licensing platform
- [@story-protocol/core-sdk](https://www.npmjs.com/package/@story-protocol/core-sdk): Official Story Protocol SDK
- [@pinata/sdk](https://www.npmjs.com/package/@pinata/sdk): IPFS pinning service
- [viem](https://www.npmjs.com/package/viem): Ethereum interaction library

Special thanks to:

- The Story Protocol team for developing the IP management platform
- The Story Protocol Developer community
- The Pinata team for IPFS infrastructure
- The Eliza community for their contributions and feedback

For more information about Story Protocol capabilities:

- [Story Protocol Documentation](https://docs.story.xyz/)
- [Story Protocol Dashboard](https://app.story.xyz/)
- [Story Protocol Blog](https://www.story.xyz/blog)
- [Story Protocol GitHub](https://github.com/storyprotocol)

## License

This plugin is part of the Eliza project. See the main project repository for license information.
