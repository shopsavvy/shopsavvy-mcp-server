# ShopSavvy Data API MCP Server

A [Model Context Protocol](https://modelcontextprotocol.io/) (MCP) server that provides AI assistants with access to ShopSavvy's comprehensive product data, pricing information, and historical price tracking.

## Overview

This MCP server enables AI assistants to:
- **Look up products** by barcode, ASIN, URL, model number, or ShopSavvy ID
- **Get current pricing** from multiple retailers
- **Access historical pricing data** with date ranges
- **Schedule products** for automatic price monitoring
- **Track API usage** and credit consumption

## Features

### 🔍 Product Lookup Tools
- `product_lookup` - Find products by various identifiers (barcode, ASIN, URL, etc.)
- `product_lookup_batch` - Look up multiple products at once

### 💰 Pricing Tools
- `product_offers` - Get current offers from all retailers
- `product_offers_retailer` - Get offers from a specific retailer
- `product_price_history` - Get historical pricing data with date ranges

### 📅 Scheduling Tools
- `product_schedule` - Schedule products for automatic refresh (hourly/daily/weekly)
- `product_unschedule` - Remove products from refresh schedule
- `scheduled_products_list` - View all scheduled products

### 📊 Analytics Tools
- `api_usage` - View current API usage and credit consumption

## Installation

```bash
npm install @shopsavvy/mcp-server
```

## Configuration

### 1. Get API Key

First, get your ShopSavvy Data API key:

1. Visit [https://shopsavvy.com/data](https://shopsavvy.com/data)
2. Sign up and choose a subscription plan
3. Create an API key in your dashboard
4. Copy your API key (starts with `ss_live_` or `ss_test_`)

### 2. Claude Desktop Setup

Add this to your Claude Desktop configuration file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\\Claude\\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "shopsavvy": {
      "command": "npx",
      "args": [
        "@shopsavvy/mcp-server"
      ],
      "env": {
        "SHOPSAVVY_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

### 3. Environment Variables

Set your API key as an environment variable:

```bash
export SHOPSAVVY_API_KEY="ss_live_your_key_here"
```

Or create a `.env` file:
```
SHOPSAVVY_API_KEY=ss_live_your_key_here
```

## Usage Examples

### Product Lookup
```
Look up the product with barcode 012345678901
```

### Current Pricing
```
Get current prices for ASIN B08N5WRWNW from all retailers
```

### Price History
```
Get price history for product 012345678901 from January 1-15, 2024
```

### Schedule Monitoring
```
Schedule daily price monitoring for products: 012345678901, B08N5WRWNW
```

## API Limits & Pricing

- **Starter Plan**: 1,000 credits/month - $49/month
- **Professional Plan**: 10,000 credits/month - $199/month
- **Enterprise Plan**: 100,000 credits/month - $499/month

### Credit Usage:
- Product lookup: 1 credit per product found
- Current offers (all retailers): 3 credits per product
- Current offers (single retailer): 2 credits per product
- Historical data: 3 credits + 1 credit per day of history
- Scheduling: 1 credit per product scheduled

## Development

### Running Locally

```bash
# Clone the repository
git clone https://github.com/shopsavvy/shopsavvy-mcp-server
cd shopsavvy-mcp-server

# Install dependencies
npm install

# Set your API key
export SHOPSAVVY_API_KEY="your_key_here"

# Test with MCP CLI
npm run dev

# Or inspect with MCP Inspector
npm run inspect
```

### Building

```bash
npm run build
```

## Error Handling

The server provides detailed error messages for:
- Invalid API keys
- Insufficient credits
- Rate limiting
- Invalid product identifiers
- API service issues

## Support

- **Documentation**: [https://shopsavvy.com/data/documentation](https://shopsavvy.com/data/documentation)
- **Dashboard**: [https://shopsavvy.com/data/dashboard](https://shopsavvy.com/data/dashboard)
- **Issues**: [https://github.com/shopsavvy/shopsavvy-mcp-server/issues](https://github.com/shopsavvy/shopsavvy-mcp-server/issues)

## Changelog

### v1.0.0 (2025-07-28)

🎉 **Initial Release**

- **Features**: Complete ShopSavvy Data API integration with MCP support
- **Product Tools**: Lookup by barcode, ASIN, URL, model number, or ShopSavvy ID
- **Pricing Tools**: Current offers from all/specific retailers, historical pricing data
- **Scheduling Tools**: Automatic product monitoring (hourly/daily/weekly)
- **Analytics Tools**: API usage tracking and credit consumption monitoring
- **npm Package**: Published as `@shopsavvy/mcp-server` under ShopSavvy organization
- **TypeScript**: Full TypeScript support with proper error handling
- **Documentation**: Comprehensive README with examples and configuration guides

## License

MIT License - see [LICENSE](LICENSE) file for details.

---

Made with ❤️ by [ShopSavvy](https://shopsavvy.com) - Empowering everyone to always get the best deal, every time.