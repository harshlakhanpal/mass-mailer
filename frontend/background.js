import {
  setWindowData,
  getWindowData,
  removeWindowData,
  setAuthToken,
  getAuthToken,
  removeAuthToken,
} from './indexedDB';

const CLIENT_ID =
  '638178568745-b27jhg3njctaqru8vqs9e8pv0tsi46mj.apps.googleusercontent.com';
const REDIRECT_URI = `https://${chrome.runtime.id}.chromiumapp.org`;
const SCOPES = [
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/gmail.send',
];

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'OAUTH_GOOGLE') {
    const authUrl =
      `https://accounts.google.com/o/oauth2/auth?client_id=${CLIENT_ID}` +
      `&response_type=code` +
      `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
      `&access_type=offline` + // <== this is essential for refresh token
      `&scope=${encodeURIComponent(SCOPES.join(' '))}` +
      `&prompt=consent`;

    chrome.identity.launchWebAuthFlow(
      { url: authUrl, interactive: true },
      (redirectUrl) => {
        if (chrome.runtime.lastError || !redirectUrl) {
          return sendResponse({ error: chrome.runtime.lastError?.message });
        }

        const params = new URLSearchParams(new URL(redirectUrl).search);
        const token = params.get('code');
        console.log({ token });

        if (token) {
          sendResponse({ token });
        } else {
          sendResponse({ error: 'Token not found in redirect URL' });
        }
      }
    );

    return true;
  }
});

function updateChromeBrowserAndExtension(windowId) {
  const maxAttempts = 10;
  return new Promise((resolve, reject) => {
    let attempt = 0;

    const tryResizingWindow = (maximisedWindow) => {
      return resizeMaximisedBrowserWindow(maximisedWindow)
        .then((resizedWindow) => {
          console.log(
            'Window resized successfully after maximising:',
            resizedWindow
          );
          resolve(resizedWindow);
        })
        .catch((error) => {
          console.log('Failed to resize window. Attempt:', attempt + 1);
          attempt++;
          if (attempt < maxAttempts) {
            console.log('Retrying resize... First re-maximising browser');

            makeBrowserMaximised(windowId)
              .then((newMaximisedWindow) => {
                console.log('Browser re maximised:', newMaximisedWindow);
                return tryResizingWindow(newMaximisedWindow);
              })
              .catch((error) => {
                console.log(
                  'Failed to maximise browser window after attempt:',
                  attempt + 1,
                  error
                );
                reject(error);
              });
          } else {
            console.log('Max attempts reached. Rejecting...');
            reject(error);
          }
        });
    };

    // First, make the browser maximised
    makeBrowserMaximised(windowId)
      .then((maximisedWindow) => {
        console.log('Browser maximised:', maximisedWindow);

        // Call updateExtension once as soon as the window is maximised
        updateExtension(maximisedWindow);

        // Now attempt to resize the maximised window
        return tryResizingWindow(maximisedWindow);
      })
      .catch((error) => {
        console.log('Failed to maximise browser window the first time:', error);
        reject(error);
      });
  });
}

function areWindowsSameShape(window1, window2) {
  return (
    window1.left === window2.left &&
    window1.top === window2.top &&
    window1.width === window2.width &&
    window1.height === window2.height
  );
}

function makeBrowserMaximised(windowId) {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const maxAttempts = 100;

    chrome.windows.get(windowId, (window) => {
      if (chrome.runtime.lastError) {
        return reject(chrome.runtime.lastError);
      }
      console.log('Initial chrome window state', window);

      if (window.state === 'maximized') {
        console.log('Window is already maximized');
        return resolve(window);
      }

      const initialWindow = { ...window };

      const updateWindow = () => {
        if (
          window.state === 'maximized' &&
          !areWindowsSameShape(window, initialWindow)
        ) {
          console.log(
            'Successfully set window to maximized state and it has changed shape, waiting 30ms to ensure final state'
          );
          setTimeout(() => {
            chrome.windows.get(window?.id, (finalMaximisedWindow) => {
              resolve(finalMaximisedWindow);
            });
          }, 30);
        } else if (attempts >= maxAttempts) {
          console.log(
            'Failed to set window to normal state within 10 attempts'
          );
          resolve(window);
        } else {
          console.log('Setting window to maximized, attempt:', attempts + 1);
          chrome.windows.update(
            window?.id,
            {
              state: 'maximized',
            },
            () => {
              if (chrome.runtime.lastError) {
                return reject(chrome.runtime.lastError);
              }
              setTimeout(() => {
                chrome.windows.get(window?.id, (updatedWindow) => {
                  window = updatedWindow;
                  attempts++;
                  updateWindow();
                });
              }, 10);
            }
          );
        }
      };
      updateWindow();
    });
  });
}

function resizeMaximisedBrowserWindow(maximisedWindow) {
  return new Promise((resolve, reject) => {
    console.log('Resizing window');
    chrome.windows
      .update(maximisedWindow?.id, {
        state: 'normal',
        width: maximisedWindow.width - 400,
      })
      .then(() => {
        chrome.windows.get(maximisedWindow?.id, (window) => {
          resolve(window);
        });
      });
  });
}

function updateExtension(maximisedWindow) {
  getWindowData().then((result) => {
    const windowId = result.windowId;
    console.log('refreshing windowId:', windowId);

    if (windowId !== undefined) {
      chrome.windows.get(windowId, { populate: false }, (window) => {
        if (chrome.runtime.lastError || !window) {
          console.log(
            "Window doesn't exist or error occurred. Recreating window."
          );
          createPopupWindow(maximisedWindow);
        } else {
          console.log('Restoring and resizing existing window');
          resizePopupWindow(windowId, maximisedWindow);
        }
      });
    } else {
      console.log('Creating window');
      createPopupWindow(maximisedWindow);
    }
  });
}

function createPopupWindow(maximisedWindow) {
  chrome.windows.create(
    {
      url: chrome.runtime.getURL('index.html'),
      type: 'popup',
      width: 400,
      height: maximisedWindow.height,
      left: maximisedWindow.left + maximisedWindow.width - 400,
      top: maximisedWindow.top,
      focused: true,
    },
    (newWindow) => {
      if (newWindow?.id) {
        const windowId = newWindow.id;
        const popupTabId = newWindow.tabs[0].id;
        console.log('Extension window created', newWindow);

        setWindowData(windowId, popupTabId).then(() => {
          console.log('windowId and popupTabId stored in IndexedDB');

          chrome.windows.onRemoved.addListener((removedWindowId) => {
            if (removedWindowId === windowId) {
              console.log('Popup window closed, resetting windowId');
              removeWindowData();
            }
          });
        });
      }
    }
  );
}

function resizePopupWindow(extensionWindowId, maximisedWindow) {
  chrome.windows.update(
    extensionWindowId,
    {
      width: 400,
      height: maximisedWindow.height,
      left: maximisedWindow.left + maximisedWindow.width - 400,
      top: maximisedWindow.top,
      focused: true,
    },
    () => {
      chrome.windows.get(extensionWindowId, { populate: false }, (window) => {
        console.log('Extension window resized', window);
      });
    }
  );
}

function refreshPopup() {
  getWindowData().then((result) => {
    const popupTabId = result.popupTabId;
    if (popupTabId !== undefined) {
      chrome.tabs.reload(popupTabId, {}, () => {
        console.log('Popup React app reloaded');
      });
    } else {
      console.log('No popupTabId, cannot reload window');
    }
  });
}

chrome.action.onClicked.addListener(async (tab) => {
  /*always open the extension
    if user is authenticated - stay where they are
    if not authenticated 
       doesn't have a dooglie auth tab open - open one
       else - takes user to a new dooglie tab
    */

  return updateChromeBrowserAndExtension(tab.windowId);
});
