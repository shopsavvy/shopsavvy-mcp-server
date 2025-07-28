#!/usr/bin/env node

/**
 * ShopSavvy Data API MCP Server
 * 
 * A Model Context Protocol server that provides AI assistants with access to 
 * ShopSavvy's comprehensive product data, pricing information, and historical price tracking.
 * 
 * Features:
 * - Product lookup by barcode, ASIN, URL, model number, or ShopSavvy ID
 * - Current pricing offers from multiple retailers
 * - Historical pricing data with date ranges
 * - Product scheduling for automatic price monitoring
 * - API usage tracking and credit management
 * 
 * Requires a ShopSavvy Data API key. Get yours at: https://shopsavvy.com/data
 */

import { FastMCP } from "fastmcp"
import { z } from "zod"

// Configuration
const API_BASE_URL = "https://shopsavvy.com/api/v1"
const API_KEY = process.env.SHOPSAVVY_API_KEY

if (!API_KEY) {
  console.error("❌ SHOPSAVVY_API_KEY environment variable is required")
  console.error("Get your API key at: https://shopsavvy.com/data")
  process.exit(1)
}

if (!API_KEY.match(/^ss_(live|test)_[a-zA-Z0-9]{32}$/)) {
  console.error("❌ Invalid SHOPSAVVY_API_KEY format")
  console.error("API key should start with 'ss_live_' or 'ss_test_' followed by 32 characters")
  process.exit(1)
}

// Create the MCP server
const server = new FastMCP({
  name: "ShopSavvy Data API",
  version: "1.0.0",
  instructions: `
This server provides access to ShopSavvy's comprehensive product database and pricing data.

Key capabilities:
- Look up products by barcode, ASIN, URL, model number, or ShopSavvy ID
- Get current pricing offers from multiple retailers
- Access historical pricing data with custom date ranges
- Schedule products for automatic price monitoring (hourly, daily, weekly)
- Track API usage and credit consumption

Credit-based pricing:
- Product lookup: 1 credit per product found
- Current offers (all retailers): 3 credits per product
- Current offers (single retailer): 2 credits per product  
- Historical data: 3 credits + 1 credit per day of history
- Scheduling: 1 credit per product scheduled

Always provide specific, actionable product information to help users make informed purchasing decisions.
  `.trim()
})

// Utility function to make API requests
async function apiRequest(endpoint: string, params: Record<string, any> = {}) {
  const url = new URL(`${API_BASE_URL}${endpoint}`)
  
  // Add query parameters
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.append(key, String(value))
    }
  })

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
      'User-Agent': 'ShopSavvy-MCP-Server/1.0.0'
    }
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(`ShopSavvy API Error (${response.status}): ${data.error || 'Unknown error'}`)
  }

  return data
}

// Product Lookup Tools
server.addTool({
  name: "product_lookup",
  description: "Look up a product by barcode, ASIN, URL, model number, or ShopSavvy product ID",
  parameters: z.object({
    identifier: z.string().describe("Product identifier (barcode/UPC/EAN, ASIN, product URL, model number, or ShopSavvy ID)")
  }),
  execute: async ({ identifier }, { log }) => {
    log.info(`Looking up product: ${identifier}`)

    try {
      const result = await apiRequest("/products", { ids: identifier })
      
      if (result.data && result.data.length > 0) {
        const product = result.data[0]
        
        return {
          content: [
            {
              type: "text",
              text: `## 🛍️ Product Found

**${product.title}**

**Details:**
- Brand: ${product.brand || 'N/A'}
- Category: ${product.category || 'N/A'}
- Color: ${product.color || 'N/A'}
- Model: ${product.model || 'N/A'}
- MPN: ${product.mpn || 'N/A'}
- Barcode: ${product.barcode || 'N/A'}
- Amazon ASIN: ${product.amazon || 'N/A'}
- ShopSavvy ID: ${product.shopsavvy || 'N/A'}

**Images:** ${product.images?.length || 0} available

**Usage:** ${result.meta.credits_used} credits used, ${result.meta.credits_remaining} remaining`
            }
          ]
        }
      } else {
        return `❌ No product found for identifier: ${identifier}`
      }
    } catch (error) {
      log.error("Product lookup failed", { identifier, error: error.message })
      return `❌ Error looking up product: ${error.message}`
    }
  }
})

server.addTool({
  name: "product_lookup_batch",
  description: "Look up multiple products at once using comma-separated identifiers",
  parameters: z.object({
    identifiers: z.string().describe("Comma-separated list of product identifiers (barcodes, ASINs, URLs, etc.)")
  }),
  execute: async ({ identifiers }, { log }) => {
    log.info(`Batch lookup for: ${identifiers}`)

    try {
      const result = await apiRequest("/products", { ids: identifiers })
      
      if (result.data && result.data.length > 0) {
        let response = `## 🛍️ Found ${result.data.length} Products\n\n`
        
        result.data.forEach((product: any, index: number) => {
          response += `### ${index + 1}. ${product.title}\n`
          response += `- Brand: ${product.brand || 'N/A'}\n`
          response += `- Category: ${product.category || 'N/A'}\n`
          response += `- Barcode: ${product.barcode || 'N/A'}\n`
          response += `- ASIN: ${product.amazon || 'N/A'}\n\n`
        })
        
        response += `**Usage:** ${result.meta.credits_used} credits used, ${result.meta.credits_remaining} remaining`
        
        return response
      } else {
        return `❌ No products found for identifiers: ${identifiers}`
      }
    } catch (error) {
      log.error("Batch lookup failed", { identifiers, error: error.message })
      return `❌ Error in batch lookup: ${error.message}`
    }
  }
})

// Pricing Tools
server.addTool({
  name: "product_offers",
  description: "Get current pricing offers for a product from all retailers",
  parameters: z.object({
    identifier: z.string().describe("Product identifier (barcode, ASIN, URL, model number, or ShopSavvy ID)")
  }),
  execute: async ({ identifier }, { log }) => {
    log.info(`Getting offers for: ${identifier}`)

    try {
      const result = await apiRequest("/products/offers", { ids: identifier })
      
      if (result.data && result.data.length > 0) {
        const productData = result.data[0]
        let response = `## 💰 Current Offers for ${productData.title}\n\n`
        
        if (productData.offers && productData.offers.length > 0) {
          // Sort offers by price (lowest first)
          const sortedOffers = productData.offers.sort((a: any, b: any) => {
            if (!a.price) return 1
            if (!b.price) return -1
            return a.price - b.price
          })
          
          response += `**${sortedOffers.length} offers found:**\n\n`
          
          sortedOffers.forEach((offer: any, index: number) => {
            const price = offer.price ? `$${offer.price.toFixed(2)}` : 'Price unavailable'
            const retailer = offer.retailer || 'Unknown retailer'
            const availability = offer.availability || 'Unknown'
            const condition = offer.condition || 'N/A'
            
            response += `${index + 1}. **${retailer}** - ${price}\n`
            response += `   - Availability: ${availability}\n`
            response += `   - Condition: ${condition}\n`
            if (offer.seller) response += `   - Seller: ${offer.seller}\n`
            response += `   - [View Offer](${offer.URL})\n\n`
          })
        } else {
          response += "❌ No current offers available for this product.\n\n"
        }
        
        response += `**Usage:** ${result.meta.credits_used} credits used, ${result.meta.credits_remaining} remaining`
        
        return response
      } else {
        return `❌ No product found for identifier: ${identifier}`
      }
    } catch (error) {
      log.error("Offers lookup failed", { identifier, error: error.message })
      return `❌ Error getting offers: ${error.message}`
    }
  }
})

server.addTool({
  name: "product_offers_retailer",
  description: "Get current pricing offers for a product from a specific retailer",
  parameters: z.object({
    identifier: z.string().describe("Product identifier (barcode, ASIN, URL, model number, or ShopSavvy ID)"),
    retailer: z.string().describe("Retailer domain name (e.g., 'amazon.com', 'bestbuy.com', 'target.com')")
  }),
  execute: async ({ identifier, retailer }, { log }) => {
    log.info(`Getting ${retailer} offers for: ${identifier}`)

    try {
      const result = await apiRequest("/products/offers", { 
        ids: identifier, 
        retailer: retailer 
      })
      
      if (result.data && result.data.length > 0) {
        const productData = result.data[0]
        let response = `## 💰 ${retailer} Offers for ${productData.title}\n\n`
        
        if (productData.offers && productData.offers.length > 0) {
          productData.offers.forEach((offer: any, index: number) => {
            const price = offer.price ? `$${offer.price.toFixed(2)}` : 'Price unavailable'
            const availability = offer.availability || 'Unknown'
            const condition = offer.condition || 'N/A'
            
            response += `**Offer ${index + 1}:**\n`
            response += `- Price: ${price}\n`
            response += `- Availability: ${availability}\n`
            response += `- Condition: ${condition}\n`
            if (offer.seller) response += `- Seller: ${offer.seller}\n`
            response += `- [View Offer](${offer.URL})\n\n`
          })
        } else {
          response += `❌ No current offers available from ${retailer} for this product.\n\n`
        }
        
        response += `**Usage:** ${result.meta.credits_used} credits used, ${result.meta.credits_remaining} remaining`
        
        return response
      } else {
        return `❌ No product found for identifier: ${identifier}`
      }
    } catch (error) {
      log.error("Retailer offers lookup failed", { identifier, retailer, error: error.message })
      return `❌ Error getting ${retailer} offers: ${error.message}`
    }
  }
})

server.addTool({
  name: "product_price_history",
  description: "Get historical pricing data for a product within a specific date range",
  parameters: z.object({
    identifier: z.string().describe("Product identifier (barcode, ASIN, URL, model number, or ShopSavvy ID)"),
    start_date: z.string().describe("Start date in YYYY-MM-DD format (e.g., '2024-01-01')"),
    end_date: z.string().describe("End date in YYYY-MM-DD format (e.g., '2024-01-31')"),
    retailer: z.string().optional().describe("Optional: specific retailer domain name to filter results")
  }),
  execute: async ({ identifier, start_date, end_date, retailer }, { log }) => {
    log.info(`Getting price history for: ${identifier} from ${start_date} to ${end_date}`)

    try {
      const params: any = { 
        ids: identifier, 
        start: start_date, 
        end: end_date 
      }
      if (retailer) params.retailer = retailer

      const result = await apiRequest("/products/offers/history", params)
      
      if (result.data && result.data.length > 0) {
        const productData = result.data[0]
        let response = `## 📈 Price History for ${productData.title}\n`
        response += `**Period:** ${start_date} to ${end_date}\n\n`
        
        if (productData.offers && productData.offers.length > 0) {
          productData.offers.forEach((offer: any) => {
            const retailerName = offer.retailer || 'Unknown retailer'
            response += `### ${retailerName}\n`
            
            if (offer.history && offer.history.length > 0) {
              response += `**${offer.history.length} price points:**\n\n`
              
              offer.history.forEach((point: any) => {
                const date = new Date(point.timestamp).toLocaleDateString()
                const price = point.price ? `$${point.price.toFixed(2)}` : 'N/A'
                const availability = point.availability || 'Unknown'
                
                response += `- ${date}: ${price} (${availability})\n`
              })
            } else {
              response += "No historical data available\n"
            }
            response += "\n"
          })
        } else {
          response += "❌ No price history available for this product in the specified date range.\n\n"
        }
        
        response += `**Usage:** ${result.meta.credits_used} credits used, ${result.meta.credits_remaining} remaining`
        
        return response
      } else {
        return `❌ No product found for identifier: ${identifier}`
      }
    } catch (error) {
      log.error("Price history lookup failed", { identifier, start_date, end_date, error: error.message })
      return `❌ Error getting price history: ${error.message}`
    }
  }
})

// Scheduling Tools
server.addTool({
  name: "product_schedule",
  description: "Schedule products for automatic price monitoring at regular intervals",
  parameters: z.object({
    identifiers: z.string().describe("Comma-separated list of product identifiers"),
    schedule: z.enum(["hourly", "daily", "weekly"]).describe("Monitoring frequency"),
    retailer: z.string().optional().describe("Optional: specific retailer domain to monitor")
  }),
  execute: async ({ identifiers, schedule, retailer }, { log }) => {
    log.info(`Scheduling ${schedule} monitoring for: ${identifiers}`)

    try {
      const params: any = { 
        ids: identifiers, 
        schedule: schedule 
      }
      if (retailer) params.retailer = retailer

      const result = await apiRequest("/products/scheduled", params, "PUT")
      
      if (result.data && result.data.length > 0) {
        let response = `## ⏰ Successfully Scheduled ${result.data.length} Products\n\n`
        response += `**Monitoring Frequency:** ${schedule.charAt(0).toUpperCase() + schedule.slice(1)}\n`
        if (retailer) response += `**Retailer Filter:** ${retailer}\n`
        response += "\n**Scheduled Products:**\n\n"
        
        result.data.forEach((product: any, index: number) => {
          response += `${index + 1}. ${product.title}\n`
          response += `   - ShopSavvy ID: ${product.shopsavvy}\n`
          response += `   - Schedule: ${product.schedule}\n`
          if (product.retailer) response += `   - Retailer: ${product.retailer}\n`
          response += "\n"
        })
        
        response += `**Usage:** ${result.meta.credits_used} credits used, ${result.meta.credits_remaining} remaining`
        
        return response
      } else {
        return `❌ No products found for identifiers: ${identifiers}`
      }
    } catch (error) {
      log.error("Product scheduling failed", { identifiers, schedule, error: error.message })
      return `❌ Error scheduling products: ${error.message}`
    }
  }
})

// Helper function for PUT requests
async function apiRequestPut(endpoint: string, params: Record<string, any> = {}) {
  const url = new URL(`${API_BASE_URL}${endpoint}`)
  
  // Add query parameters
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.append(key, String(value))
    }
  })

  const response = await fetch(url.toString(), {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
      'User-Agent': 'ShopSavvy-MCP-Server/1.0.0'
    }
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(`ShopSavvy API Error (${response.status}): ${data.error || 'Unknown error'}`)
  }

  return data
}

// Helper function for DELETE requests
async function apiRequestDelete(endpoint: string, params: Record<string, any> = {}) {
  const url = new URL(`${API_BASE_URL}${endpoint}`)
  
  // Add query parameters
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.append(key, String(value))
    }
  })

  const response = await fetch(url.toString(), {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
      'User-Agent': 'ShopSavvy-MCP-Server/1.0.0'
    }
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(`ShopSavvy API Error (${response.status}): ${data.error || 'Unknown error'}`)
  }

  return data
}

// Update the scheduling tool to use the PUT helper
server.addTool({
  name: "product_schedule",
  description: "Schedule products for automatic price monitoring at regular intervals",
  parameters: z.object({
    identifiers: z.string().describe("Comma-separated list of product identifiers"),
    schedule: z.enum(["hourly", "daily", "weekly"]).describe("Monitoring frequency"),
    retailer: z.string().optional().describe("Optional: specific retailer domain to monitor")
  }),
  execute: async ({ identifiers, schedule, retailer }, { log }) => {
    log.info(`Scheduling ${schedule} monitoring for: ${identifiers}`)

    try {
      const params: any = { 
        ids: identifiers, 
        schedule: schedule 
      }
      if (retailer) params.retailer = retailer

      const result = await apiRequestPut("/products/scheduled", params)
      
      if (result.data && result.data.length > 0) {
        let response = `## ⏰ Successfully Scheduled ${result.data.length} Products\n\n`
        response += `**Monitoring Frequency:** ${schedule.charAt(0).toUpperCase() + schedule.slice(1)}\n`
        if (retailer) response += `**Retailer Filter:** ${retailer}\n`
        response += "\n**Scheduled Products:**\n\n"
        
        result.data.forEach((product: any, index: number) => {
          response += `${index + 1}. ${product.title}\n`
          response += `   - ShopSavvy ID: ${product.shopsavvy}\n`
          response += `   - Schedule: ${product.schedule}\n`
          if (product.retailer) response += `   - Retailer: ${product.retailer}\n`
          response += "\n"
        })
        
        response += `**Usage:** ${result.meta.credits_used} credits used, ${result.meta.credits_remaining} remaining`
        
        return response
      } else {
        return `❌ No products found for identifiers: ${identifiers}`
      }
    } catch (error) {
      log.error("Product scheduling failed", { identifiers, schedule, error: error.message })
      return `❌ Error scheduling products: ${error.message}`
    }
  }
})

server.addTool({
  name: "product_unschedule",
  description: "Remove products from the automatic price monitoring schedule",
  parameters: z.object({
    identifiers: z.string().describe("Comma-separated list of product identifiers to unschedule")
  }),
  execute: async ({ identifiers }, { log }) => {
    log.info(`Unscheduling products: ${identifiers}`)

    try {
      const result = await apiRequestDelete("/products/scheduled", { ids: identifiers })
      
      return `✅ Successfully removed products from monitoring schedule.\n\n**Usage:** No credits used for unscheduling`
    } catch (error) {
      log.error("Product unscheduling failed", { identifiers, error: error.message })
      return `❌ Error unscheduling products: ${error.message}`
    }
  }
})

server.addTool({
  name: "scheduled_products_list",
  description: "View all products currently scheduled for automatic price monitoring",
  execute: async (args, { log }) => {
    log.info("Getting scheduled products list")

    try {
      const result = await apiRequest("/products/scheduled")
      
      if (result.data && result.data.length > 0) {
        let response = `## ⏰ Scheduled Products (${result.data.length} total)\n\n`
        
        // Group by schedule frequency
        const bySchedule: Record<string, any[]> = {}
        result.data.forEach((product: any) => {
          const schedule = product.schedule || 'unknown'
          if (!bySchedule[schedule]) bySchedule[schedule] = []
          bySchedule[schedule].push(product)
        })
        
        Object.entries(bySchedule).forEach(([schedule, products]) => {
          response += `### ${schedule.charAt(0).toUpperCase() + schedule.slice(1)} (${products.length})\n\n`
          
          products.forEach((product, index) => {
            response += `${index + 1}. **${product.title}**\n`
            response += `   - ShopSavvy ID: ${product.shopsavvy}\n`
            if (product.barcode) response += `   - Barcode: ${product.barcode}\n`
            if (product.amazon) response += `   - ASIN: ${product.amazon}\n`
            if (product.retailer) response += `   - Retailer Filter: ${product.retailer}\n`
            response += "\n"
          })
        })
        
        response += `**Usage:** No credits used for listing scheduled products`
        
        return response
      } else {
        return "📭 No products are currently scheduled for monitoring.\n\nUse the `product_schedule` tool to start monitoring products."
      }
    } catch (error) {
      log.error("Scheduled products list failed", { error: error.message })
      return `❌ Error getting scheduled products: ${error.message}`
    }
  }
})

// Analytics Tools
server.addTool({
  name: "api_usage",
  description: "View current API usage statistics and credit consumption",
  execute: async (args, { log }) => {
    log.info("Getting API usage statistics")

    try {
      const result = await apiRequest("/usage")
      
      if (result.data) {
        const usage = result.data
        const period = usage.current_period
        
        let response = `## 📊 API Usage Statistics\n\n`
        response += `**Current Billing Period:** ${period.start_date} to ${period.end_date}\n\n`
        response += `**Credit Usage:**\n`
        response += `- Used: ${period.credits_used.toLocaleString()} credits\n`
        response += `- Limit: ${period.credits_limit.toLocaleString()} credits\n`
        response += `- Remaining: ${period.credits_remaining.toLocaleString()} credits\n`
        response += `- Usage: ${usage.usage_percentage}%\n\n`
        response += `**Requests Made:** ${period.requests_made.toLocaleString()}\n\n`
        
        // Usage indicator
        if (usage.usage_percentage >= 90) {
          response += `⚠️ **High Usage Warning:** You've used ${usage.usage_percentage}% of your monthly credits.`
        } else if (usage.usage_percentage >= 75) {
          response += `⚡ **Usage Notice:** You've used ${usage.usage_percentage}% of your monthly credits.`
        } else {
          response += `✅ **Usage Status:** Good - ${usage.usage_percentage}% of monthly credits used.`
        }
        
        return response
      } else {
        return "❌ Unable to retrieve usage statistics"
      }
    } catch (error) {
      log.error("Usage statistics failed", { error: error.message })
      return `❌ Error getting usage statistics: ${error.message}`
    }
  }
})

// Start the server
server.start({
  transportType: "stdio"
})

console.log("🛍️ ShopSavvy Data API MCP Server started successfully!")
console.log("📍 API Base URL:", API_BASE_URL)
console.log("🔑 API Key configured:", API_KEY.substring(0, 10) + "...")