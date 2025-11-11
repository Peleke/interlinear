#!/bin/bash
#
# Test: Content Generation API Endpoint
#
# Tests POST /api/workflows/content-generation with sample readings
#

set -e

echo "🧪 Testing Content Generation API Endpoint"
echo "=========================================="

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# A1 Spanish reading
A1_READING='Me llamo María. Todos los días me levanto a las siete de la mañana. Desayuno café con leche y pan. Después, voy al trabajo en autobús.'

# B2 Spanish reading
B2_READING='La tecnología ha transformado profundamente nuestra sociedad. Los dispositivos móviles se han convertido en herramientas imprescindibles para la comunicación. Sin embargo, algunos expertos advierten sobre los riesgos de la dependencia tecnológica.'

# C1 Spanish reading
C1_READING='La ética contemporánea se enfrenta a dilemas sin precedentes en la historia de la humanidad. Los avances científicos plantean cuestiones fundamentales sobre la naturaleza de la conciencia y la identidad.'

echo ""
echo "📝 Test 1: A1 Spanish - Daily Routine"
echo "--------------------------------------"

curl -X POST http://localhost:3000/api/workflows/content-generation \
  -H "Content-Type: application/json" \
  -d "{
    \"lessonId\": \"test-a1-$(date +%s)\",
    \"readingText\": \"$A1_READING\",
    \"targetLevel\": \"A1\",
    \"language\": \"es\",
    \"maxVocabularyItems\": 10
  }" \
  -s -w "\nHTTP Status: %{http_code}\n" | jq '.' || echo -e "${RED}❌ Test 1 failed${NC}"

echo ""
echo "📝 Test 2: B2 Spanish - Technology"
echo "-----------------------------------"

curl -X POST http://localhost:3000/api/workflows/content-generation \
  -H "Content-Type: application/json" \
  -d "{
    \"lessonId\": \"test-b2-$(date +%s)\",
    \"readingText\": \"$B2_READING\",
    \"targetLevel\": \"B2\",
    \"language\": \"es\",
    \"maxVocabularyItems\": 10
  }" \
  -s -w "\nHTTP Status: %{http_code}\n" | jq '.' || echo -e "${RED}❌ Test 2 failed${NC}"

echo ""
echo "📝 Test 3: C1 Spanish - Philosophy"
echo "-----------------------------------"

curl -X POST http://localhost:3000/api/workflows/content-generation \
  -H "Content-Type: application/json" \
  -d "{
    \"lessonId\": \"test-c1-$(date +%s)\",
    \"readingText\": \"$C1_READING\",
    \"targetLevel\": \"C1\",
    \"language\": \"es\",
    \"maxVocabularyItems\": 10
  }" \
  -s -w "\nHTTP Status: %{http_code}\n" | jq '.' || echo -e "${RED}❌ Test 3 failed${NC}"

echo ""
echo "=========================================="
echo "✅ API endpoint tests complete"
echo ""
echo "NOTE: These tests require:"
echo "  1. Dev server running (npm run dev)"
echo "  2. User authentication (may fail with 401)"
echo "  3. MERRIAM_WEBSTER_API_KEY configured"
