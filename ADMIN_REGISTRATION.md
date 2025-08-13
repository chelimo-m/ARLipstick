# Admin Registration Script

## Overview

The admin registration script creates administrator users with proper role assignment and permissions for the AR Lipstick application. This script ensures that admin users are created with the correct schema and permissions.

## Features

- ✅ **Interactive CLI**: User-friendly command-line interface
- ✅ **Role Management**: Creates admin and user roles with proper permissions
- ✅ **Firebase Integration**: Creates users in both Firebase Auth and Firestore
- ✅ **Data Validation**: Validates input and checks for existing users
- ✅ **Error Handling**: Comprehensive error handling and cleanup
- ✅ **Cart Creation**: Automatically creates shopping cart for new users

## Prerequisites

Before running the script, ensure you have:

1. **Environment Variables**: All Firebase credentials must be set in `.env.local`
2. **Firebase Project**: Firebase project must be configured
3. **Node.js**: Node.js 18+ installed

### Required Environment Variables

```bash
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

## Usage

### Method 1: Using npm script (Recommended)

```bash
npm run register-admin
```

### Method 2: Direct execution

```bash
node scripts/register-admin.js
```

### Method 3: Using the executable

```bash
./scripts/register-admin.js
```

## Script Flow

### 1. Initialization
- ✅ Checks Firebase credentials
- ✅ Initializes Firebase Admin SDK
- ✅ Validates environment setup

### 2. Role Setup
- ✅ Checks if admin role exists
- ✅ Creates admin role if missing
- ✅ Creates user role if missing
- ✅ Sets up proper permissions

### 3. User Input
- ✅ Prompts for admin details
- ✅ Validates input data
- ✅ Checks for existing users

### 4. User Creation
- ✅ Creates user in Firebase Auth
- ✅ Creates user document in Firestore
- ✅ Assigns admin role
- ✅ Creates shopping cart

### 5. Completion
- ✅ Displays success message
- ✅ Shows user details
- ✅ Provides login instructions

## Admin Role Permissions

The admin role includes the following permissions:

```javascript
const ADMIN_PERMISSIONS = [
  'manage_users',        // Create, edit, delete users
  'manage_products',     // Add, edit, delete products
  'manage_orders',       // Process and manage orders
  'manage_payments',     // Handle payment processing
  'view_analytics',      // Access analytics dashboard
  'manage_inventory',    // Manage product inventory
  'manage_settings',     // System configuration
  'view_reports'         // Generate and view reports
];
```

## User Role Permissions

The regular user role includes:

```javascript
const USER_PERMISSIONS = [
  'view_products',       // Browse product catalog
  'place_orders',        // Create new orders
  'view_own_orders',     // View personal order history
  'manage_own_profile'   // Edit personal information
];
```

## Data Schema

### User Document Structure

```typescript
interface User {
  userId: string;           // Firebase Auth UID
  email: string;            // User email
  displayName?: string;     // Display name
  photoURL?: string;        // Profile photo URL
  roleId: string;           // Role ID (admin/user)
  phone?: string;           // Phone number
  bio?: string;             // User bio
  profileCompleted: boolean; // Profile completion status
  status: string;           // User status (active/inactive)
  createdAt: string;        // Creation timestamp
  updatedAt?: string;       // Last update timestamp
}
```

### Role Document Structure

```typescript
interface UserRole {
  roleId: string;           // Role identifier
  roleName: string;         // Human-readable name
  description?: string;     // Role description
  permissions?: string[];   // Array of permissions
  createdAt: string;        // Creation timestamp
}
```

## Example Usage

```bash
$ npm run register-admin

🎯 Admin Registration Script
============================

📋 Checking roles...
✅ Admin role already exists
✅ User role already exists

📝 Enter Admin Details:
Email: admin@joannakcosmetics.com
Password (min 6 characters): securepassword123
Display Name: Joanna K Admin
Phone (optional): +254700000000
Bio (optional): System Administrator

🔍 Checking if user already exists...
✅ User does not exist

👤 Creating user in Firebase Auth...
✅ User created in Firebase Auth: abc123def456

📄 Creating user document in Firestore...
✅ User document created in Firestore

🛒 Creating user cart...
✅ Cart created for user

🎉 Admin Registration Successful!
================================
User ID: abc123def456
Email: admin@joannakcosmetics.com
Display Name: Joanna K Admin
Role: Administrator
Status: Active

✅ The admin can now log in to the dashboard
```

## Error Handling

The script includes comprehensive error handling:

### Common Errors

1. **Missing Environment Variables**
   ```
   ❌ Firebase credentials not found in environment variables
   Please ensure the following are set:
   - NEXT_PUBLIC_FIREBASE_PROJECT_ID
   - FIREBASE_CLIENT_EMAIL
   - FIREBASE_PRIVATE_KEY
   ```

2. **User Already Exists**
   ```
   ❌ User with this email already exists
   ```

3. **Invalid Password**
   ```
   ❌ Password must be at least 6 characters long
   ```

4. **Firebase Connection Issues**
   ```
   ❌ Failed to initialize Firebase Admin: [error details]
   ```

### Cleanup Process

If user creation fails after Firebase Auth creation, the script automatically:

1. ✅ Detects the failure
2. ✅ Deletes the partially created user from Firebase Auth
3. ✅ Reports cleanup status

## Security Considerations

1. **Password Requirements**: Minimum 6 characters
2. **Email Verification**: Admin users are created with email verified
3. **Role-Based Access**: Proper permission assignment
4. **Input Validation**: All inputs are validated and sanitized
5. **Error Logging**: Comprehensive error logging for debugging

## Troubleshooting

### Script Won't Run

1. **Check Node.js version**: Ensure Node.js 18+ is installed
2. **Check permissions**: Ensure script is executable (`chmod +x scripts/register-admin.js`)
3. **Check environment**: Verify all environment variables are set

### Firebase Connection Issues

1. **Check credentials**: Verify Firebase service account credentials
2. **Check project**: Ensure Firebase project is active
3. **Check permissions**: Verify service account has proper permissions

### User Creation Fails

1. **Check email format**: Ensure valid email format
2. **Check password**: Ensure password meets requirements
3. **Check existing users**: Verify email is not already registered

## Integration with Application

After running the script, the admin user can:

1. **Login**: Use email/password to log in
2. **Access Dashboard**: Navigate to `/dashboard/admin`
3. **Manage Products**: Add, edit, delete products
4. **Manage Orders**: Process customer orders
5. **View Analytics**: Access system analytics
6. **Manage Users**: Create and manage other users

## Maintenance

### Updating Permissions

To update admin permissions, modify the `ADMIN_ROLE` object in the script:

```javascript
const ADMIN_ROLE = {
  // ... existing properties
  permissions: [
    // Add or remove permissions as needed
    'manage_users',
    'manage_products',
    // ... other permissions
  ]
};
```

### Adding New Roles

To add new roles, create new role objects and add them to the role creation process:

```javascript
const NEW_ROLE = {
  roleId: 'moderator',
  roleName: 'Moderator',
  description: 'Content moderator with limited permissions',
  permissions: ['view_products', 'manage_products'],
  createdAt: new Date().toISOString()
};
```

## Support

For issues or questions:

1. **Check logs**: Review console output for error details
2. **Verify setup**: Ensure all prerequisites are met
3. **Test connectivity**: Verify Firebase connection
4. **Check permissions**: Ensure proper service account permissions

The admin registration script provides a secure and reliable way to create administrator users for the AR Lipstick application. 