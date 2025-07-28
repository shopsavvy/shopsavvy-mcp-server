# Contributing to ShopSavvy Data API MCP Server

Thank you for your interest in contributing to the ShopSavvy Data API MCP Server! This document provides guidelines for contributing to this open-source project.

## Development Setup

### Prerequisites

- Node.js 18 or higher
- Bun (recommended) or npm
- A ShopSavvy Data API key (get one at [https://shopsavvy.com/data](https://shopsavvy.com/data))

### Setup Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/shopsavvy/data-api-mcp
   cd data-api-mcp
   ```

2. **Install dependencies**
   ```bash
   bun install
   # or
   npm install
   ```

3. **Set up environment**
   ```bash
   export SHOPSAVVY_API_KEY="your_api_key_here"
   ```

4. **Test the server**
   ```bash
   bun run dev
   # or
   npm run dev
   ```

## Development Workflow

### Running Tests
```bash
# Test with MCP CLI
bun run dev

# Inspect with MCP Inspector
bun run inspect
```

### Building
```bash
bun run build
```

### Code Style

- Use TypeScript for all code
- Follow existing code formatting
- Use meaningful variable and function names
- Add JSDoc comments for public functions
- Use Zod for input validation

## Project Structure

```
src/
├── index.ts           # Main server implementation
├── types.ts          # Type definitions (future)
├── utils.ts          # Utility functions (future)
└── tools/            # Individual tool implementations (future)
    ├── products.ts
    ├── pricing.ts
    └── scheduling.ts
```

## Adding New Tools

When adding new MCP tools:

1. **Follow the naming convention**: Use descriptive names like `product_lookup`, `price_history`
2. **Add proper validation**: Use Zod schemas for parameter validation
3. **Include error handling**: Wrap API calls in try-catch blocks
4. **Add logging**: Use the provided `log` context for debugging
5. **Format responses**: Return human-readable, well-formatted responses
6. **Update documentation**: Add examples to the README and usage examples

### Example Tool Structure

```typescript
server.addTool({
  name: "tool_name",
  description: "Clear description of what this tool does",
  parameters: z.object({
    param1: z.string().describe("Description of parameter"),
    param2: z.string().optional().describe("Optional parameter")
  }),
  execute: async ({ param1, param2 }, { log }) => {
    log.info(`Tool execution started`, { param1, param2 })

    try {
      const result = await apiRequest("/endpoint", { param1, param2 })
      
      // Format and return response
      return formatResponse(result)
    } catch (error) {
      log.error("Tool execution failed", { error: error.message })
      return `❌ Error: ${error.message}`
    }
  }
})
```

## API Integration Guidelines

### Rate Limiting
- Be mindful of API rate limits
- Include usage information in responses
- Handle rate limit errors gracefully

### Error Handling
- Always wrap API calls in try-catch blocks
- Provide user-friendly error messages
- Log errors with context for debugging

### Response Formatting
- Use consistent formatting (markdown for rich text)
- Include usage statistics when available
- Provide actionable information to users

## Testing

### Manual Testing
- Test all tools with various inputs
- Verify error handling with invalid inputs
- Test with both live and test API keys

### Integration Testing
- Test with Claude Desktop
- Verify all tools work in real scenarios
- Test error conditions

## Documentation

### README Updates
- Update examples when adding new features
- Keep API documentation current
- Update installation instructions if needed

### Code Comments
- Document complex logic
- Explain API interactions
- Include examples in JSDoc

## Submitting Changes

### Pull Request Process

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make your changes**
4. **Test thoroughly**
5. **Update documentation**
6. **Submit a pull request**

### Pull Request Guidelines

- **Clear title**: Describe what the PR does
- **Detailed description**: Explain the changes and why they're needed
- **Test results**: Include testing information
- **Screenshots**: If applicable, include screenshots of the changes

### Code Review

All pull requests will be reviewed for:
- Code quality and style
- Functionality and testing
- Documentation completeness
- API integration best practices

## Support

- **Issues**: Report bugs and request features via GitHub Issues
- **Discussions**: Use GitHub Discussions for questions and ideas
- **Documentation**: Check the README and examples first

## License

By contributing to this project, you agree that your contributions will be licensed under the MIT License.

---

Thank you for helping make the ShopSavvy Data API MCP Server better for everyone! 🛍️