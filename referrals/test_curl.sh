#!/bin/bash

# Test create_referral endpoint with curl
# Run with: bash referrals/test_curl.sh

echo "Testing create_referral endpoint..."
echo ""

# Basic test with required fields only
curl -X POST "https://rem-29188.bubbleapps.io/version-test/api/1.1/wf/create_referral/initialize" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Bobs Plumbing",
    "desc": "Bob is a plumber who has been in the business for 10 years and is known for his quality work",
    "agent_score": 5,
    "agent_id": "agent123",
    "requests": 0
  }'

echo ""
echo ""
echo "---"
echo ""

# Test with all fields including optional ones
curl -X POST "https://rem-29188.bubbleapps.io/version-test/api/1.1/wf/create_referral/initialize" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Bobs Plumbing",
    "desc": "Bob is a plumber who has been in the business for 10 years and is known for his quality work",
    "agent_score": 5,
    "agent_id": "agent123",
    "link": "https://bobsplumbing.com",
    "picture": "https://example.com/picture.jpg",
    "pricing_details": "$$",
    "type": "plumber",
    "requests": 0
  }'

echo ""


