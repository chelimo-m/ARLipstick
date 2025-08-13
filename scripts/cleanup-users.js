const admin = require('firebase-admin');

// Initialize Firebase Admin
const serviceAccount = require('../src/secret/firebase-service-account.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function cleanupUsers() {
  console.log('Starting user cleanup...');
  
  try {
    // Get all users
    const usersSnapshot = await db.collection('users').get();
    const users = [];
    
    usersSnapshot.forEach(doc => {
      users.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    console.log(`Found ${users.length} total users`);
    
    // Group users by email
    const emailGroups = {};
    users.forEach(user => {
      if (!emailGroups[user.email]) {
        emailGroups[user.email] = [];
      }
      emailGroups[user.email].push(user);
    });
    
    // Find duplicates and fix roles
    let duplicatesFixed = 0;
    let rolesFixed = 0;
    
    for (const [email, userGroup] of Object.entries(emailGroups)) {
      if (userGroup.length > 1) {
        console.log(`\nFound ${userGroup.length} users with email: ${email}`);
        
        // Sort by creation date (oldest first)
        userGroup.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        
        // Keep the oldest user, delete the rest
        const keepUser = userGroup[0];
        const deleteUsers = userGroup.slice(1);
        
        console.log(`Keeping user: ${keepUser.displayName} (${keepUser.id})`);
        console.log(`Deleting ${deleteUsers.length} duplicate(s):`);
        
        for (const deleteUser of deleteUsers) {
          console.log(`  - ${deleteUser.displayName} (${deleteUser.id})`);
          await db.collection('users').doc(deleteUser.id).delete();
          duplicatesFixed++;
        }
        
        // Update the kept user to have the best role (admin > customer > user)
        const bestRole = userGroup.reduce((best, user) => {
          if (user.roleId === 'admin') return 'admin';
          if (user.roleId === 'customer' && best !== 'admin') return 'customer';
          return best;
        }, 'user');
        
        if (keepUser.roleId !== bestRole) {
          console.log(`Updating role from '${keepUser.roleId}' to '${bestRole}'`);
          await db.collection('users').doc(keepUser.id).update({
            roleId: bestRole
          });
          rolesFixed++;
        }
      } else {
        // Single user - just fix role if needed
        const user = userGroup[0];
        if (user.roleId === 'user') {
          console.log(`Fixing role for ${user.displayName} (${user.email}): 'user' -> 'customer'`);
          await db.collection('users').doc(user.id).update({
            roleId: 'customer'
          });
          rolesFixed++;
        }
      }
    }
    
    console.log(`\nCleanup completed!`);
    console.log(`- Duplicates removed: ${duplicatesFixed}`);
    console.log(`- Roles fixed: ${rolesFixed}`);
    
  } catch (error) {
    console.error('Error during cleanup:', error);
  } finally {
    process.exit(0);
  }
}

cleanupUsers(); 