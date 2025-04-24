// popup.js
// Load saved options
document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.local.get({
    highlightFields: true,
    confirmEach: false,
    skipNonZero: false
  }, (items) => {
    document.getElementById('highlightFields').checked = items.highlightFields;
    document.getElementById('confirmEach').checked = items.confirmEach;
    document.getElementById('skipNonZero').checked = items.skipNonZero;
  });
});

// Save options when changed
document.getElementById('highlightFields').addEventListener('change', (e) => {
  chrome.storage.local.set({ highlightFields: e.target.checked });
});

document.getElementById('confirmEach').addEventListener('change', (e) => {
  chrome.storage.local.set({ confirmEach: e.target.checked });
});

document.getElementById('skipNonZero').addEventListener('change', (e) => {
  chrome.storage.local.set({ skipNonZero: e.target.checked });
});

// Handle copy button click
document.getElementById('copyButton').addEventListener('click', async () => {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  // Get current options
  chrome.storage.local.get({
    highlightFields: true,
    confirmEach: false,
    skipNonZero: false
  }, (options) => {
    // Send options to content script
    chrome.tabs.sendMessage(tab.id, { 
      action: 'copyWantToHave',
      options: options
    });
  });
});