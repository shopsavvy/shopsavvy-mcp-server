# ShopSavvy Data API MCP Server - Usage Examples

This document provides examples of how to interact with the ShopSavvy Data API MCP Server in Claude Desktop.

## Product Lookup Examples

### Basic Product Lookup
```
Look up the product with barcode 012345678901
```

```  
Find product information for ASIN B08N5WRWNW
```

```
Get details for this product: https://www.amazon.com/dp/B08N5WRWNW
```

### Batch Product Lookup
```
Look up these products: 012345678901, B08N5WRWNW, 045496596439
```

## Current Pricing Examples

### All Retailers
```
Get current prices for ASIN B08N5WRWNW from all retailers
```

```
Show me current offers for barcode 012345678901
```

### Specific Retailer
```
Get Amazon prices for product B08N5WRWNW
```

```
Show me Target offers for barcode 012345678901
```

## Price History Examples

### Basic History
```
Get price history for product 012345678901 from January 1-15, 2024
```

```
Show me price trends for ASIN B08N5WRWNW from 2024-03-01 to 2024-03-31
```

### Retailer-Specific History
```
Get Amazon price history for B08N5WRWNW from 2024-01-01 to 2024-01-31
```

## Product Scheduling Examples

### Schedule Monitoring
```
Schedule daily price monitoring for products: 012345678901, B08N5WRWNW
```

```
Set up hourly monitoring for ASIN B08N5WRWNW at Amazon only
```

```
Schedule weekly price checks for these barcodes: 045496596439, 012345678901
```

### Manage Scheduled Products
```
Show me all my scheduled products
```

```
Remove products 012345678901 and B08N5WRWNW from monitoring
```

## API Usage Examples

### Check Usage
```
Show me my current API usage and remaining credits
```

```
How many credits do I have left this month?
```

## Complex Workflow Examples

### Price Comparison Workflow
```
I'm interested in buying a Nintendo Switch. Look up ASIN B07VGRJDFY, show me current prices from all retailers, and give me the price history for the last 30 days.
```

### Deal Monitoring Setup
```
I want to monitor prices for these gaming products: B07VGRJDFY, B08H75RTZ8, B08J6SX9K4. Set up daily monitoring and show me current prices from Best Buy and GameStop.
```

### Historical Analysis
```
Analyze the price trends for ASIN B08N5WRWNW over the past 3 months. Show me the price history and identify the best deals.
```

## Tips for Best Results

1. **Use specific identifiers**: Barcodes, ASINs, and product URLs work best
2. **Be specific about date ranges**: Use YYYY-MM-DD format for dates
3. **Mention retailer preferences**: Specify retailers when you want focused results
4. **Ask for comparisons**: Request price comparisons across multiple retailers
5. **Set up monitoring**: Use scheduling for products you're interested in buying

## Common Use Cases

- **Price research before purchase**
- **Historical price analysis**
- **Deal hunting and monitoring**  
- **Competitive pricing analysis**
- **Inventory and purchasing planning**
- **Market trend analysis**