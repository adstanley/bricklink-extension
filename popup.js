   // popup.js
  document.getElementById('copyButton').addEventListener('click', async () => {
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: copyWantToHave
    });
  });
  
  function copyWantToHave() {
    copyWantToHaveValues();
  }