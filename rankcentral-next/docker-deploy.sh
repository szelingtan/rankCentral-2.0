#!/bin/bash
# Script to build and run Docker containers for rankCentral Next.js app

# Colors for terminal output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting rankCentral Docker build process...${NC}"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Docker is not installed. Please install Docker first.${NC}"
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}Docker Compose is not installed. Please install Docker Compose first.${NC}"
    exit 1
fi

# Check if .env.docker file exists
if [ ! -f ".env.docker" ]; then
    echo -e "${RED}.env.docker file not found. Creating from template...${NC}"
    cp .env .env.docker
    echo -e "${YELLOW}Please edit .env.docker to update environment variables for Docker.${NC}"
    exit 1
fi

# Build and start the containers
echo -e "${GREEN}Building and starting Docker containers...${NC}"
docker-compose up --build -d

# Check if containers are running
if [ $? -eq 0 ]; then
    echo -e "${GREEN}Docker containers are now running!${NC}"
    echo -e "${GREEN}Next.js app is available at: http://localhost:3000${NC}"
    echo -e "${YELLOW}MongoDB is running at: localhost:27017${NC}"
    echo -e "${YELLOW}Use 'docker-compose logs -f' to view logs${NC}"
    echo -e "${YELLOW}Use 'docker-compose down' to stop the services${NC}"
else
    echo -e "${RED}Failed to start Docker containers. See error messages above.${NC}"
    exit 1
fi
