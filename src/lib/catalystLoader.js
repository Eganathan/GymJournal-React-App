/* global catalyst */
/**
 * Checks if the Catalyst Web SDK is available.
 * The SDK scripts are loaded in index.html with onerror fallback.
 * Returns a promise that resolves with true/false.
 */
let loadPromise = null;

export function loadCatalystSDK() {
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve) => {
    // Scripts already failed to load?
    if (window.__catalystFailed) {
      resolve(false);
      return;
    }

    // Already loaded and initialized?
    if (isCatalystAvailable()) {
      resolve(true);
      return;
    }

    // Scripts may still be loading — wait a bit then check
    let attempts = 0;
    const check = () => {
      attempts++;
      if (isCatalystAvailable()) {
        resolve(true);
      } else if (window.__catalystFailed || attempts > 10) {
        resolve(false);
      } else {
        setTimeout(check, 300);
      }
    };
    setTimeout(check, 300);
  });

  return loadPromise;
}

export function isCatalystAvailable() {
  return typeof catalyst !== 'undefined' && catalyst.auth != null && catalyst.userManagement != null;
}
