// Generate VAPID keys for Web Push Notifications
const webPush = require('web-push');

// Generate VAPID keys
const vapidKeys = webPush.generateVAPIDKeys();

console.log('VAPID Keys generated successfully!');
console.log('\n=== Add these to your environment variables ===');
console.log('VAPID_PUBLIC_KEY=' + vapidKeys.publicKey);
console.log('VAPID_PRIVATE_KEY=' + vapidKeys.privateKey);
console.log('VAPID_MAILTO=your-email@example.com');
console.log('\n=== Add this to your client-side code ===');
console.log('const vapidPublicKey = \'' + vapidKeys.publicKey + '\';');

// Example of how to use these keys in your PWA manager
console.log('\n=== Example usage in PWA manager ===');
console.log(`// In your PWA manager configuration
const vapidPublicKey = '${vapidKeys.publicKey}';

// When sending notifications
webPush.setVapidDetails(
  'mailto:your-email@example.com',
  vapidPublicKey,
  '${vapidKeys.privateKey}'
);`);
