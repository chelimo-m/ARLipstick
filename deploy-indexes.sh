#!/bin/bash

echo "Deploying Firestore indexes..."

# Deploy indexes
firebase deploy --only firestore:indexes

echo "Indexes deployed successfully!"
echo ""
echo "Note: It may take a few minutes for the indexes to be fully created."
echo "You can monitor the progress in the Firebase Console:"
echo "https://console.firebase.google.com/project/$(firebase use --json | jq -r '.current')/firestore/indexes" 