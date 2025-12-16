#!/bin/bash
# Build images locally without pushing to Docker Hub

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Load environment variables from .env file
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Config
DOCKERHUB_USER="${DOCKERHUB_USER:-devzeus}"
VERSION="${VERSION:-1.0.0}"

SERVICES=("api-gateway" "identity-service" "course-service" "chat-service" "file-service")

echo -e "${YELLOW}🚀 Building Docker images locally...${NC}"
echo -e "${YELLOW}📋 Docker Hub User: $DOCKERHUB_USER${NC}"
echo -e "${YELLOW}📋 Version: $VERSION${NC}"
echo ""

for SERVICE in "${SERVICES[@]}"; do
    echo -e "${YELLOW}📦 Building $SERVICE...${NC}"

    if [ ! -d "$SERVICE" ]; then
        echo -e "${RED}  ❌ Directory $SERVICE not found, skipping...${NC}"
        continue
    fi

    cd $SERVICE

    # Build JAR
    echo "  ⚙️  Building JAR..."
    mvn clean package -DskipTests

    # Build Docker image
    echo "  🐳 Building Docker image..."
    docker build -t $DOCKERHUB_USER/$SERVICE:$VERSION .
    docker tag $DOCKERHUB_USER/$SERVICE:$VERSION $DOCKERHUB_USER/$SERVICE:latest

    echo -e "${GREEN}  ✅ $SERVICE completed!${NC}"
    echo ""
    cd ..
done

echo -e "${GREEN}🎉 All images built successfully!${NC}"
echo ""
echo -e "${YELLOW}💡 To start the services:${NC}"
echo -e "   docker-compose up -d"
