((win, doc, nav) => {
  // Add to HS
  let deferredPrompt;
  const btnAdd = doc.getElementById('add');
  btnAdd.style.display = 'none';

  function showAddHS() {
    addBtn.style.display = 'block';
  }

  // Camera
  const camCanvas = doc.getElementById('camera-input');
  const camCaptureBtn = doc.getElementById('camera-capture');
  const player = document.getElementById('player');
  if ('mediaDevices' in navigator) {
    const context = camCanvas.getContext('2d');
    camCaptureBtn.addEventListener('click', () => {
      // Draw the video frame to the canvas.
      context.drawImage(player, 0, 0, canvas.width, canvas.height);
    });
    navigator.mediaDevices.getUserMedia({video: true}).then((stream) => {
      player.srcObject = stream;
    });
  }

  // Feature detection
  const detectFeatures = (registration) => {
    return {
      'Offline Capabilities': 'caches' in win,
      'Push Notifications': 'pushManager' in registration,
      'Add to Home Screen': 'relList' in HTMLLinkElement.prototype &&
          doc.createElement('link').relList.supports('manifest') &&
          'onbeforeinstallprompt' in win,
      'Background Sync': 'sync' in registration,
      'Periodic Background Sync': 'periodicSync' in registration,
      'Background Fetch': 'backgroundFetch' in registration,
      'Navigation Preload': 'navigationPreload' in registration,
      'Storage Estimation': 'storage' in nav && 'estimate' in nav.storage,
      'Persistent Storage': 'storage' in nav && 'persist' in nav.storage,
      'Cache storage': 'caches' in win,
      'Web Share (Level 1)': 'share' in nav,
      'Web Share (Level 2)': 'share' in nav && 'canShare' in nav,
      'Media Session': 'mediaSession' in nav,
      'Media Capabilities': 'mediaCapabilities' in nav,
      'Device Memory': 'deviceMemory' in nav,
      'Getting Installed Related Apps': 'getInstalledRelatedApps' in nav,
      'Payment Request': 'PaymentRequest' in win,
      'Payment Handler': 'paymentManager' in registration,
      'Apple Pay Payment Handler': 'ApplePaySession' in win,
      'Credential Management': 'credentials' in nav &&
          'preventSilentAccess' in nav.credentials &&
          ('PasswordCredential' in win || 'FederatedCredential' in win),
      'Bluetooth': 'Bluetooth' in win,
      'Gyroscope': 'Gyroscope' in win,
      'Device Orientation': 'DeviceOrientationEvent' in win,
      'Device Motion': 'DeviceMotionEvent' in win,
      'Media input': 'mediaDevices' in nav,
    };
  };

  const updateUserInterface = (pwaFeatures) => {
    const fragment = doc.createDocumentFragment();
    const featureRow = doc.getElementById('featureRow');
    const featureCell = featureRow.content.querySelector('.feature');
    const supportCell = featureRow.content.querySelector('.support');
    for (const feature in pwaFeatures) {
      if (!pwaFeatures.hasOwnProperty(feature)) {
        continue;
      }
      featureCell.textContent = feature;
      supportCell.textContent = pwaFeatures[feature] ? '✅' : '❌';
      fragment.appendChild(doc.importNode(featureRow.content, true));
    }
    const placeholder = doc.getElementById('placeholder');
    placeholder.parentNode.replaceChild(fragment, placeholder);
  };

  win.addEventListener('load', () => {
    doc.getElementById('userAgent').textContent = nav.userAgent;
    if ('serviceWorker' in nav) {
      return nav.serviceWorker.register('sw.min.js')
          .then((registration) => {
            const pwaFeatures = detectFeatures(registration);
            updateUserInterface(pwaFeatures);
          });
    }
    updateUserInterface({'Service Workers Not Supported': false});
  });

  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent Chrome 67 and earlier from automatically showing the prompt
    // Prevent Chrome 76 and later from showing the mini-infobar
    // e.preventDefault();
    // Stash the event so it can be triggered later.
    deferredPrompt = e;
    console.log('beforeinstallprompt fired', deferredPrompt);
    showAddHS();
  });

  btnAdd.addEventListener('click', (e) => {
    // Show the prompt
    deferredPrompt.prompt();
    // Wait for the user to respond to the prompt
    deferredPrompt.userChoice
      .then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the A2HS prompt');
        } else {
          console.log('User dismissed the A2HS prompt');
        }
        deferredPrompt = null;
      });
  });

  window.addEventListener('appinstalled', (evt) => {
    console.log('a2hs installed');
  });

  // iOS
  // Detects if device is on iOS
  const isIos = () => {
    const userAgent = window.navigator.userAgent.toLowerCase();
    return /iphone|ipad|ipod/.test( userAgent );
  }
  // Detects if device is in standalone mode
  const isInStandaloneMode = () => ('standalone' in window.navigator) && (window.navigator.standalone);

  // Checks if should display install popup notification:
  if (isIos() && !isInStandaloneMode()) {
    showAddHS();
  }
})(window, document, navigator);
