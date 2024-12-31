# Plugin Web Search

## Overview

The Web Search Plugin enables powerful and customizable web search capabilities, offering flexibility and ease of integration for modern applications.

## Features

- Efficient search query handling.
- Configurable options for advanced customization.
- Optimized for performance and scalability.

## Handlers

### `search`

The `search` handler executes web search queries with specified parameters, returning results in a structured format.

#### Usage

```typescript
import { WebSearch } from 'web-search-plugin';

const search = new WebSearch({
  apiEndpoint: 'https://api.example.com/search',
  timeout: 5000,
});

try {
  const results = await search.query('example query', {
    limit: 10,
    sortBy: 'relevance',
  });
  console.log('Search Results:', results);
} catch (error) {
  console.error('Search failed:', error);
}
```

#### Features

- **Query Customization**: Specify query parameters such as `limit` and `sortBy`.
- **Error Handling**: Handles common search errors gracefully.

## Configuration

### Environment Variables

Set the following environment variables for optimal performance:

| Variable Name    | Description                       |
| ---------------- | --------------------------------- |
| `API_ENDPOINT`   | URL for the search API endpoint.  |
| `SEARCH_TIMEOUT` | Timeout duration in milliseconds. |

Example `.env` file:

```env
API_ENDPOINT=https://api.example.com/search
SEARCH_TIMEOUT=5000
```

### TypeScript Configuration

Ensure your `tsconfig.json` is properly configured:

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "CommonJS",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  }
}
```

## Example Workflow

Streamline your search operations with the following example:

```typescript
import { WebSearch } from 'web-search-plugin';

const search = new WebSearch({ apiEndpoint: 'https://api.example.com/search' });

(async () => {
  try {
    // Execute a search query
    const results = await search.query('example', { limit: 5 });
    console.log('Search Results:', results);
  } catch (error) {
    console.error('Error executing search:', error);
  }
})();
```

## Local Testing

To test locally, you can set up a mock server for the API endpoint:

1. Install `json-server`:

   ```bash
   npm install -g json-server
   ```

2. Create a `db.json` file with mock search data.

3. Start the mock server:

   ```bash
   json-server --watch db.json --port 3000
   ```

4. Update your `.env` file:
   ```env
   API_ENDPOINT=http://localhost:3000
   ```

## Common Issues

### "API endpoint not defined"

- Ensure the `API_ENDPOINT` is set in your environment variables.

### "Search query timeout"

- Increase the `SEARCH_TIMEOUT` value in the configuration.

## Dependencies

This plugin relies on the following:

- `axios` for HTTP requests.
- `dotenv` for managing environment variables.

## Development Guide

### Setup

1. Clone the repository:

   ```bash
   git clone https://github.com/your-repo/web-search-plugin.git
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Testing

Run tests with:

```bash
npm test
```

### Contribution Guidelines

- Fork the repository.
- Create a feature branch.
- Submit a pull request with a clear description.

### Security Best Practices

- Validate user inputs to prevent injection attacks.
- Use HTTPS for secure API communication.

## Performance Optimization

- Use caching for frequently queried terms.
- Optimize query parameters for faster responses.

---

This documentation aims to streamline onboarding, reduce support queries, and enable faster adoption of the Web Search Plugin.
