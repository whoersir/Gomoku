#!/bin/bash

echo "========================================"
echo "Starting Release Environment"
echo "========================================"
echo ""
echo "Ports:"
echo "  Backend:  http://localhost:3001"
echo "  Frontend: http://localhost:5174"
echo ""
echo "Press Ctrl+C to stop"
echo ""

docker-compose -f docker-compose.release.yml up --build
