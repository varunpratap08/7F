// Register Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('/sw.js')
            .then(function(registration) {
                console.log('ServiceWorker registration successful with scope: ', registration.scope);
                
                // Check for updates on the service worker
                if (registration.waiting) {
                    console.log('Service worker waiting to activate');
                }
                
                // Listen for updates
                registration.addEventListener('updatefound', function() {
                    const newWorker = registration.installing;
                    newWorker.addEventListener('statechange', function() {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            console.log('New content is available; please refresh.');
                            // You can show a notification to the user here
                        }
                    });
                });
            })
            .catch(function(error) {
                console.log('ServiceWorker registration failed: ', error);
            });
    });
    
    // Listen for the controllerchange event
    navigator.serviceWorker.addEventListener('controllerchange', function() {
        console.log('Controller changed');
        window.location.reload();
    });
}

// Check if the browser is online/offline
function updateOnlineStatus() {
    if (navigator.onLine) {
        document.documentElement.classList.remove('offline');
    } else {
        document.documentElement.classList.add('offline');
    }
}

// Add event listeners for online/offline status
window.addEventListener('online', updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);

// Initial check
updateOnlineStatus();
