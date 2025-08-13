# Fixing Firestore Index Issues

## Problem

The application is encountering Firestore index errors when trying to query the `loginCodes` and `registrationCodes` collections. This happens because Firestore requires composite indexes for queries that use multiple `where` clauses or range queries.

## Solution

### Option 1: Deploy Indexes (Recommended)

1. **Deploy the indexes to Firebase**:

   ```bash
   # Make sure you're logged into Firebase
   firebase login

   # Deploy only the indexes
   firebase deploy --only firestore:indexes
   ```

2. **Wait for index creation**:

   - Index creation can take 1-5 minutes
   - Monitor progress in Firebase Console: https://console.firebase.google.com/project/YOUR_PROJECT/firestore/indexes

3. **Test the application**:
   - Try sending a verification code again
   - The error should be resolved once indexes are created

### Option 2: Create Indexes Manually

If the automatic deployment doesn't work, you can create indexes manually:

1. **Go to Firebase Console**:

   - Navigate to Firestore Database
   - Click on "Indexes" tab

2. **Create the following composite indexes**:

   **For loginCodes collection:**

   - Collection ID: `loginCodes`
   - Fields:

     - `userId` (Ascending)
     - `createdAt` (Descending)
     - `__name__` (Ascending)

   - Collection ID: `loginCodes`
   - Fields:
     - `userId` (Ascending)
     - `code` (Ascending)
     - `used` (Ascending)

   **For registrationCodes collection:**

   - Collection ID: `registrationCodes`
   - Fields:

     - `userId` (Ascending)
     - `createdAt` (Descending)
     - `__name__` (Ascending)

   - Collection ID: `registrationCodes`
   - Fields:
     - `userId` (Ascending)
     - `code` (Ascending)
     - `used` (Ascending)

   **For emailQueue collection:**

   - Collection ID: `emailQueue`
   - Fields:
     - `status` (Ascending)
     - `attempts` (Ascending)
     - `createdAt` (Ascending)

### Option 3: Use the Direct Link

Firebase provides a direct link to create the required index. Click this link (replace with your project ID):

```
https://console.firebase.google.com/v1/r/project/joannak-try-on/firestore/indexes?create_composite=ClFwcm9qZWN0cy9qb2FubmFrLXRyeS1vbi9kYXRhYmFzZXMvKGRlZmF1bHQpL2NvbGxlY3Rpb25Hcm91cHMvbG9naW5Db2Rlcy9pbmRleGVzL18QARoKCgZ1c2VySWQQARoNCgljcmVhdGVkQXQQARoMCghfX25hbWVfXxAB
```

## Index Details

### Required Indexes

1. **loginCodes - Recent Codes Query**:

   - Used for: Checking recent codes to prevent spam
   - Fields: `userId`, `createdAt`
   - Query: `where("userId", "==", userId).where("createdAt", ">", timestamp)`

2. **loginCodes - Code Verification**:

   - Used for: Verifying login codes
   - Fields: `userId`, `code`, `used`
   - Query: `where("userId", "==", userId).where("code", "==", code).where("used", "==", false)`

3. **registrationCodes - Code Verification**:

   - Used for: Verifying registration codes
   - Fields: `userId`, `code`, `used`
   - Query: `where("userId", "==", userId).where("code", "==", code).where("used", "==", false)`

4. **emailQueue - Processing**:
   - Used for: Processing email queue
   - Fields: `status`, `attempts`, `createdAt`
   - Query: `where("status", "==", "pending").where("attempts", "<", maxAttempts)`

## Troubleshooting

### Common Issues

1. **"Index still building"**:

   - Wait 1-5 minutes for index creation
   - Check Firebase Console for progress

2. **"Permission denied"**:

   - Ensure you have proper Firebase permissions
   - Check if you're logged into the correct Firebase project

3. **"Index not found"**:
   - Verify the index was created correctly
   - Check field names and order match exactly

### Verification

After creating indexes, test the application:

1. **Send a login code**:

   - Go to `/login`
   - Enter an email address
   - Click "Send Login Code"
   - Should work without index errors

2. **Check Firebase Console**:
   - Go to Firestore > Indexes
   - Verify all indexes show "Enabled" status

## Performance Notes

- **Index creation time**: 1-5 minutes
- **Index storage cost**: Minimal (included in Firestore pricing)
- **Query performance**: Significantly improved with proper indexes
- **Maintenance**: Indexes are automatically maintained by Firebase

## Next Steps

Once indexes are created:

1. **Test the full flow**:

   - Send verification code
   - Enter code in 6-box input
   - Verify login/registration

2. **Monitor performance**:

   - Check Firebase Console for query performance
   - Monitor function execution logs

3. **Set up alerts** (optional):
   - Configure alerts for failed queries
   - Monitor index usage and performance
