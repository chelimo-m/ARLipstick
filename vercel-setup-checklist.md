# Vercel Environment Variables Setup Checklist

## 🔗 Quick Links

- **Vercel Dashboard**: https://vercel.com/dashboard
- **Firebase Console**: https://console.firebase.google.com/project/arlipstick-84040
- **Test API**: https://arl-ipstick.vercel.app/api/products

## 📋 Step-by-Step Setup

### 1. Access Vercel Dashboard

- [ ] Go to https://vercel.com/dashboard
- [ ] Select project: `arl-ipstick`
- [ ] Go to `Settings` tab
- [ ] Click `Environment Variables`

### 2. Add Firebase Variables (Required)

#### Public Variables (NEXT*PUBLIC*\*)

- [ ] **NEXT_PUBLIC_FIREBASE_API_KEY**

  - Value: `AIzaSyDGDsfQA_URHm5EaKUfH7gXh5K6Oh-_-7A`
  - Environment: Production

- [ ] **NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN**

  - Value: `arlipstick-84040.firebaseapp.com`
  - Environment: Production

- [ ] **NEXT_PUBLIC_FIREBASE_PROJECT_ID**

  - Value: `arlipstick-84040`
  - Environment: Production

- [ ] **NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET**

  - Value: `arlipstick-84040.firebasestorage.app`
  - Environment: Production

- [ ] **NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID**

  - Value: `429071766693`
  - Environment: Production

- [ ] **NEXT_PUBLIC_FIREBASE_APP_ID**

  - Value: `1:429071766693:web:829b26ffd1f1fcfc7fa94c`
  - Environment: Production

- [ ] **NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID**
  - Value: `G-XYR7D1HKY8`
  - Environment: Production

#### Private Variables

- [ ] **FIREBASE_CLIENT_EMAIL**

  - Value: `firebase-adminsdk-fbsvc@arlipstick-84040.iam.gserviceaccount.com`
  - Environment: Production

- [ ] **FIREBASE_PRIVATE_KEY**
  - Value: (Copy the entire private key from firebase-migration-template.env)
  - Environment: Production

### 3. Add Cloudinary Variables (Required for Image Upload)

- [ ] **CLOUDINARY_CLOUD_NAME**

  - Value: (Your Cloudinary cloud name)
  - Environment: Production

- [ ] **CLOUDINARY_API_KEY**

  - Value: (Your Cloudinary API key)
  - Environment: Production

- [ ] **CLOUDINARY_API_SECRET**
  - Value: (Your Cloudinary API secret)
  - Environment: Production

### 4. Redeploy

- [ ] Go to `Deployments` tab
- [ ] Click `Redeploy` on latest deployment
- [ ] Wait for deployment to complete

### 5. Test

- [ ] Test API: https://arl-ipstick.vercel.app/api/products
- [ ] Test App: https://arl-ipstick.vercel.app/
- [ ] Check if products are loading

## 🚨 Important Notes

- Make sure to set Environment to "Production" for all variables
- The FIREBASE_PRIVATE_KEY should include the entire key including `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`
- If you don't have Cloudinary credentials, you can skip those for now (image upload won't work)

## 🔍 Troubleshooting

- If API returns "Firebase credentials not configured" → Check FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY
- If API returns "Failed to initialize Firebase Admin" → Check private key format
- If API returns empty array → Products exist but might be in different database
