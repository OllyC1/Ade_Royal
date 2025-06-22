// Simple Socket Connection Monitor for Debugging
// Run this in your browser's console to monitor socket connections

console.log('🔍 Socket Connection Monitor Started');

// Monitor localStorage changes
const originalSetItem = localStorage.setItem;
localStorage.setItem = function(key, value) {
  if (key === 'token' || key === 'user') {
    console.log(`📦 LocalStorage ${key} updated:`, value);
  }
  originalSetItem.apply(this, arguments);
};

// Monitor socket events (if window.socket is available)
if (window.io) {
  const originalConnect = window.io.connect;
  window.io.connect = function(...args) {
    console.log('🔌 Socket.IO connect called with:', args);
    return originalConnect.apply(this, arguments);
  };
}

// Helper function to check current state
window.checkSocketState = function() {
  console.log('🔍 Current Application State:');
  console.log('- Token:', !!localStorage.getItem('token'));
  console.log('- User:', localStorage.getItem('user') ? 'Present' : 'None');
  console.log('- Socket Connected:', window.socket?.connected || 'Unknown');
  console.log('- React DevTools Available:', !!window.__REACT_DEVTOOLS_GLOBAL_HOOK__);
};

// Auto-run check
setTimeout(() => {
  window.checkSocketState();
}, 2000);

console.log('💡 Run checkSocketState() in console to see current state'); 