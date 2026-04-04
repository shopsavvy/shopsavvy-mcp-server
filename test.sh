#!/bin/bash
set -e

echo "ShopSavvy MCP Server Tests"
echo "==========================="

if [ "$1" = "--integration" ]; then
  if [ -z "$SHOPSAVVY_API_KEY" ]; then
    echo "Set SHOPSAVVY_API_KEY env var to run integration tests"
    echo "  Get a key at https://shopsavvy.com/data"
    exit 1
  fi
  echo "Running integration tests (live API)..."
  echo ""

  echo "Testing API connectivity..."
  RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "Authorization: Bearer $SHOPSAVVY_API_KEY" \
    -H "User-Agent: ShopSavvy-MCP-Test/1.0" \
    "https://api.shopsavvy.com/v1/usage")
  if [ "$RESPONSE" = "200" ]; then
    echo "  API key valid"
  else
    echo "  API returned HTTP $RESPONSE"
    exit 1
  fi

  echo "Testing product search..."
  SEARCH=$(curl -s \
    -H "Authorization: Bearer $SHOPSAVVY_API_KEY" \
    -H "User-Agent: ShopSavvy-MCP-Test/1.0" \
    "https://api.shopsavvy.com/v1/products/search?q=airpods+pro&limit=1")
  if echo "$SEARCH" | grep -q '"success":true'; then
    echo "  Product search works"
  else
    echo "  Product search failed"
    exit 1
  fi

  echo ""
  echo "All integration tests passed"
else
  echo "Running structural checks..."
  echo ""

  echo "Checking required files..."
  REQUIRED="src/index.ts package.json README.md LICENSE"
  MISSING=0
  for f in $REQUIRED; do
    if [ ! -f "$f" ]; then
      echo "  Missing: $f"
      MISSING=$((MISSING + 1))
    fi
  done
  if [ $MISSING -eq 0 ]; then
    echo "  All required files present ($(echo $REQUIRED | wc -w | tr -d ' ') files)"
  else
    echo "  $MISSING required files missing"
    exit 1
  fi

  echo "Checking TypeScript syntax..."
  if command -v bun &> /dev/null; then
    if bun build --no-bundle src/index.ts --outfile /tmp/mcp-ss-check.js > /dev/null 2>&1; then
      echo "  TypeScript syntax OK"
    else
      echo "  TypeScript syntax error"
      exit 1
    fi
    rm -f /tmp/mcp-ss-check.js
  else
    echo "  bun not installed -- skipping"
  fi

  echo "Checking package.json..."
  if command -v node &> /dev/null; then
    node -e "
      const pkg = require('./package.json');
      const checks = [];
      checks.push(['name', pkg.name === '@shopsavvy/mcp-server']);
      checks.push(['main', !!pkg.main]);
      let ok = true;
      checks.forEach(([name, pass]) => { if (!pass) { console.log('  Missing: ' + name); ok = false; } });
      if (ok) console.log('  Package structure valid');
      else process.exit(1);
    "
  fi

  echo ""
  echo "All unit checks passed"
fi
