#!/bin/bash
# spring-microservices/build-and-push.sh

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Config
DOCKERHUB_USER="phihiep92988"  # Thay bằng username của bạn
VERSION="1.0.0"

SERVICES=("api-gateway" "identity-service" "course-service" "chat-service" "file-service")

echo -e "${YELLOW}🚀 Building and pushing Docker images...${NC}"
echo ""

for SERVICE in "${SERVICES[@]}"; do
    echo -e "${YELLOW}📦 Building $SERVICE...${NC}"
    cd $SERVICE

    # Build JAR
    echo "  ⚙️  Building JAR..."
    mvn clean package -DskipTests -q

    # Build Docker images
    echo "  🐳 Building Docker image..."
    docker build -t $DOCKERHUB_USER/$SERVICE:$VERSION . -q
    docker tag $DOCKERHUB_USER/$SERVICE:$VERSION $DOCKERHUB_USER/$SERVICE:latest

    # Push to Docker Hub
    echo "  ⬆️  Pushing to Docker Hub..."
    docker push $DOCKERHUB_USER/$SERVICE:$VERSION -q
    docker push $DOCKERHUB_USER/$SERVICE:latest -q

    echo -e "${GREEN}  ✅ $SERVICE completed!${NC}"
    echo ""
    cd ..
done

echo -e "${GREEN}🎉 All images built and pushed successfully!${NC}"