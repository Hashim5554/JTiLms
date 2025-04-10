#!/bin/bash

# Get current date and time
DATE=$(date +"%Y-%m-%d %H:%M:%S")

# Add all changes
git add .

# Commit with timestamp
git commit -m "Auto commit: $DATE"

# Push to remote repository
git push origin master 