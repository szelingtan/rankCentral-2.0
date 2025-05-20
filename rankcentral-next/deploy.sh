#!/bin/bash

# This files automates the deployment of the RankCentral Next.js application to Airbase.

# Build the Docker image
echo "Building Docker image..."
docker build --platform linux/amd64 -t szelingtan04/rankcentral-next-nextjs:latest .

# Push to Docker Hubx
echo "Pushing to Docker Hub..."
docker push szelingtan04/rankcentral-next-nextjs:latest

# Deploy to Airbase
echo "Deploying to Airbase..."
airbase container deploy --image szelingtan04/rankcentral-next-nextjs:latest

echo "Deployment complete!"