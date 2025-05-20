#!/bin/bash
# Production setup script for rankCentral

# Colors for terminal output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Setting up rankCentral production environment...${NC}"

# Check if docker and docker-compose are installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Docker is not installed. Please install Docker first.${NC}"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}Docker Compose is not installed. Please install Docker Compose first.${NC}"
    exit 1
fi

# Create directories
mkdir -p letsencrypt
mkdir -p tmp/uploads

# Check if .env.production file exists
if [ ! -f ".env.production" ]; then
    echo -e "${RED}.env.production file not found. Creating from template...${NC}"
    
    if [ ! -f ".env.production.template" ]; then
        echo -e "${RED}.env.production.template file not found. Please create it first.${NC}"
        exit 1
    fi
    
    cp .env.production.template .env.production
    echo -e "${YELLOW}Please edit .env.production to update environment variables for production.${NC}"
    echo -e "${YELLOW}After updating, run this script again.${NC}"
    exit 1
fi

# Log in to GitLab Container Registry
echo -e "${YELLOW}Logging into GitLab Container Registry...${NC}"
echo -e "${YELLOW}Please enter your GitLab registry credentials:${NC}"
docker login registry.gitlab.com

# Pull latest images
echo -e "${GREEN}Pulling latest Docker images...${NC}"
docker-compose -f docker-compose.prod.yml pull

# Start the services
echo -e "${GREEN}Starting production services...${NC}"
docker-compose -f docker-compose.prod.yml up -d

# Check if containers are running
if [ $? -eq 0 ]; then
    echo -e "${GREEN}Production environment is now running!${NC}"
    echo -e "${GREEN}Your application should be available at your configured domain.${NC}"
    echo -e "${YELLOW}Use 'docker-compose -f docker-compose.prod.yml logs -f' to view logs${NC}"
    echo -e "${YELLOW}Use 'docker-compose -f docker-compose.prod.yml down' to stop the services${NC}"
else
    echo -e "${RED}Failed to start Docker containers. See error messages above.${NC}"
    exit 1
fi
