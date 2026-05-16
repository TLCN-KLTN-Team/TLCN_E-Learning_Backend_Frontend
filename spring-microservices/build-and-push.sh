#!/bin/bash
# spring-microservices/build-and-push.sh

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Load environment variables from .env if present
if [ -f .env ]; then
    set -a
    . ./.env
    set +a
fi

# Config
DOCKERHUB_USER="${DOCKERHUB_USER:-devzeus}"
VERSION="${VERSION:-1.0.0}"

SERVICES=("api-gateway" "identity-service" "course-service" "chat-service" "file-service" "notification-service" "ai-service")

echo -e "${YELLOW}🚀 Building and pushing Docker images...${NC}"
echo -e "${YELLOW}📋 Docker Hub User: ${DOCKERHUB_USER}${NC}"
echo -e "${YELLOW}📋 Version: ${VERSION}${NC}"
echo ""

for SERVICE in "${SERVICES[@]}"; do
    echo -e "${YELLOW}📦 Building ${SERVICE}...${NC}"

    if [ ! -d "${SERVICE}" ]; then
        echo -e "${RED}  ❌ Directory ${SERVICE} not found, skipping...${NC}"
        echo ""
        continue
    fi

    if [ ! -f "${SERVICE}/pom.xml" ]; then
        echo -e "${RED}  ❌ pom.xml not found in ${SERVICE}, skipping...${NC}"
        echo ""
        continue
    fi

    if [ ! -f "${SERVICE}/Dockerfile" ]; then
        echo -e "${RED}  ❌ Dockerfile not found in ${SERVICE}, skipping...${NC}"
        echo ""
        continue
    fi

    pushd "${SERVICE}" > /dev/null

    echo "  ⚙️  Building JAR..."
    mvn clean package -DskipTests -q

    echo "  🐳 Building Docker image..."
    docker build -t "${DOCKERHUB_USER}/${SERVICE}:${VERSION}" .
    docker tag "${DOCKERHUB_USER}/${SERVICE}:${VERSION}" "${DOCKERHUB_USER}/${SERVICE}:latest"

    echo "  ⬆️  Pushing to Docker Hub..."
    docker push "${DOCKERHUB_USER}/${SERVICE}:${VERSION}"
    docker push "${DOCKERHUB_USER}/${SERVICE}:latest"

    popd > /dev/null

    echo -e "${GREEN}  ✅ ${SERVICE} completed!${NC}"
    echo ""
done

echo -e "${GREEN}🎉 All available images built and pushed successfully!${NC}"