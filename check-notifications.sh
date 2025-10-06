#!/bin/bash

# Notification System Diagnostic Script
# Run this to check if everything is set up correctly

echo "🔍 FireForce Notification System Diagnostics"
echo "=============================================="
echo ""

# Check if we're in the right directory
if [ ! -d "module-rp-fireforce-web" ]; then
    echo "❌ Error: Please run this script from the RP-FireForce root directory"
    exit 1
fi

echo "✅ In correct directory"
echo ""

# Check if useNotifications.js exists
echo "📁 Checking files..."
if [ -f "module-rp-fireforce-web/src/hooks/useNotifications.js" ]; then
    echo "✅ useNotifications.js exists"
    FILE_SIZE=$(wc -c < "module-rp-fireforce-web/src/hooks/useNotifications.js")
    echo "   Size: $FILE_SIZE bytes (expected: ~8000+)"
else
    echo "❌ useNotifications.js is missing!"
    echo "   Expected location: module-rp-fireforce-web/src/hooks/useNotifications.js"
fi
echo ""

# Check if TopNavigation.jsx was updated
echo "📝 Checking TopNavigation.jsx..."
if grep -q "import useNotifications from '../../hooks/useNotifications'" "module-rp-fireforce-web/src/components/layout/TopNavigation.jsx"; then
    echo "✅ TopNavigation.jsx imports useNotifications"
else
    echo "❌ TopNavigation.jsx doesn't import useNotifications"
fi
echo ""

# Check if DashboardLayout.jsx was updated
echo "📝 Checking DashboardLayout.jsx..."
if grep -q "onNavigateToIncident" "module-rp-fireforce-web/src/components/layout/DashboardLayout.jsx"; then
    echo "✅ DashboardLayout.jsx has onNavigateToIncident prop"
else
    echo "❌ DashboardLayout.jsx missing onNavigateToIncident prop"
fi
echo ""

# Check if node_modules exists
echo "📦 Checking dependencies..."
if [ -d "module-rp-fireforce-web/node_modules" ]; then
    echo "✅ node_modules exists"
else
    echo "⚠️  node_modules not found. Run: cd module-rp-fireforce-web && npm install"
fi
echo ""

# Check if package.json exists
if [ -f "module-rp-fireforce-web/package.json" ]; then
    echo "✅ package.json exists"
else
    echo "❌ package.json is missing!"
fi
echo ""

# Test API connectivity
echo "🌐 Testing API connectivity..."
API_URL="https://incident-webhook-api.rapidresponse.workers.dev/api/incidents"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL")

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Backend API is accessible (HTTP $HTTP_CODE)"
elif [ "$HTTP_CODE" = "000" ]; then
    echo "❌ Cannot reach backend API (network issue)"
else
    echo "⚠️  Backend API returned HTTP $HTTP_CODE"
fi
echo ""

# Check if dev server is running
echo "🖥️  Checking dev server..."
if lsof -Pi :5173 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "✅ Dev server running on port 5173"
elif lsof -Pi :5174 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "✅ Dev server running on port 5174"
else
    echo "⚠️  Dev server not detected. Start it with:"
    echo "   cd module-rp-fireforce-web && npm run dev"
fi
echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Next steps:"
echo "1. If dev server is not running:"
echo "   cd module-rp-fireforce-web && npm run dev"
echo ""
echo "2. Open browser to: http://localhost:5173/ (or 5174)"
echo ""
echo "3. Open browser console (F12) and check for errors"
echo ""
echo "4. Look for the bell icon (🔔) in the top navigation"
echo ""
echo "5. Create an incident and wait 30 seconds"
echo ""
echo "For detailed testing guide, see:"
echo "   NOTIFICATION_TESTING_GUIDE.md"
echo ""
