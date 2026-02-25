#!/bin/bash
# MyCAE Tracker Deployment Script
# This script deploys the application to production

echo "Starting MyCAE Tracker Deployment..."

# Deploy Frontend
echo "Deploying Frontend..."
DEPLOYPATH=/home/mycaet40/public_html/
rm -rf $DEPLOYPATH/*
cp -R /home/mycaet40/repositories/MyCAE-App-v3/dist/* $DEPLOYPATH/
echo "Frontend deployed to $DEPLOYPATH"

# Deploy Backend  
echo "Deploying Backend..."
BACKENDPATH=/home/mycaet40/mycaetracker-backend/
mkdir -p $BACKENDPATH
rm -rf $BACKENDPATH/dist
rm -f $BACKENDPATH/package.json
rm -f $BACKENDPATH/package-lock.json
cp -R /home/mycaet40/repositories/MyCAE-App-v3/backend/dist $BACKENDPATH/
cp /home/mycaet40/repositories/MyCAE-App-v3/backend/package.json $BACKENDPATH/
cp /home/mycaet40/repositories/MyCAE-App-v3/backend/package-lock.json $BACKENDPATH/
echo "Backend deployed to $BACKENDPATH"

# Check if .env exists, if not copy example
if [ ! -f $BACKENDPATH.env ]; then
    echo "Creating .env from example..."
    cp /home/mycaet40/repositories/MyCAE-App-v3/backend/.env.example $BACKENDPATH.env
fi

echo "Deployment Complete!"
echo "Please ensure your .env file is configured with production credentials."
