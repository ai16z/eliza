# Plugin Story

A plugin for managing intellectual property (IP) operations, including registration, licensing, and integration with IPFS for decentralized storage.

## Overview and Purpose

The Plugin Story simplifies the process of managing intellectual property by providing APIs and utilities for registering IP, licensing it, and uploading related data to IPFS. It is designed to streamline workflows for developers dealing with IP management in decentralized or traditional environments.

## Installation Instructions

```bash
npm install @elizaos/plugin-story
```

## Configuration Requirements

Ensure you have the following dependencies installed:

- `ethers`
- `@elizaos/core`
- `ipfs-http-client`

## Usage Examples

### Register Intellectual Property

#### TypeScript Example

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

#### `registerIP`

Registers intellectual property.

**Parameters:**

- `details: { name: string; description: string; owner: string; }`

**Returns:**

- `Promise<any>` - Result of the registration process.

#### `licenseIP`

Licenses registered intellectual property.

**Parameters:**

- `licenseData: { ipId: string; licenseType: string; duration: number; }`

**Returns:**

- `Promise<any>` - Result of the licensing process.

#### `getIPDetails`

Fetches details of a specific intellectual property.

**Parameters:**

- `ipId: string`

**Returns:**

- `Promise<any>` - Details of the requested IP.

### Functions

#### `uploadJSONToIPFS`

Uploads JSON data to IPFS.

**Parameters:**

- `data: object`

**Returns:**

- `Promise<string>` - The IPFS hash of the uploaded data.

### Templates

#### `index`

Provides reusable templates for consistent IP management workflows.

## Common Issues/Troubleshooting

### Issue: IPFS Upload Fails

- **Cause:** Invalid or large JSON data.
- **Solution:** Validate and compress JSON data before uploading.

### Issue: IP Registration Fails

- **Cause:** Missing or invalid owner address.
- **Solution:** Verify the owner's blockchain address.

## Additional Documentation

### Examples Folder

The `examples/` folder contains practical implementations for registering, licensing, and uploading IP data.

### Testing Guide

Run the following command to execute tests:

```bash
npm test
```

### Plugin Development Guide

Developers can extend the plugin by adding new actions and utilities. Refer to the `src/` folder for detailed implementation patterns.

### Security Best Practices

- Validate all inputs for IP management actions.
- Ensure proper authentication and authorization for licensing.
- Keep dependencies updated to prevent vulnerabilities.

### Performance Optimization Guide

- Optimize IPFS uploads by compressing data.
- Cache frequently accessed IP details for faster retrieval.

## Value Add

This plugin enhances intellectual property management workflows, reduces implementation overhead, and ensures compatibility with decentralized storage systems like IPFS.
