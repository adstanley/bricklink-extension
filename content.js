// content.js
// Store for pending tasks
let pendingCopies = [];
let currentIndex = 0;
let options = {
  highlightFields: true,
  confirmEach: false,
  skipNonZero: false
};

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'copyWantToHave') {
    options = message.options;
    startCopyProcess();
  }
  return true;
});

// Function to get all paired inputs
function getQuantityPairs() {
  const quantityCells = document.querySelectorAll('div.wl-col-quantity.wl-edit-cell');
  const pairs = [];
  
  quantityCells.forEach(cell => {
    const allDivs = cell.querySelectorAll('div.full-width');
    
    if (allDivs.length >= 2) {
      const wantDiv = Array.from(allDivs).find(div => 
        div.textContent.includes('Want:'));
      
      const haveDiv = Array.from(allDivs).find(div => 
        div.textContent.includes('Have:'));
      
      if (wantDiv && haveDiv) {
        const wantInput = wantDiv.querySelector('input[type="number"].form-text.width-small');
        const haveInput = haveDiv.querySelector('input[type="number"].form-text.width-small');
        
        if (wantInput && haveInput) {
          // Skip if "Have" already has a non-zero value and skipNonZero is enabled
          if (options.skipNonZero && haveInput.value && parseInt(haveInput.value) > 0) {
            return;
          }
          
          pairs.push({
            wantInput,
            haveInput,
            value: wantInput.value
          });
        }
      }
    }
  });
  
  return pairs;
}

// Start the copy process
function startCopyProcess() {
  pendingCopies = getQuantityPairs();
  currentIndex = 0;
  
  if (pendingCopies.length === 0) {
    alert('No quantities to copy! (All "Have" fields may already be filled)');
    return;
  }
  
  if (options.confirmEach) {
    processNextConfirmation();
  } else {
    // Process all at once with optional highlighting
    let processed = 0;
    
    pendingCopies.forEach(pair => {
      if (options.highlightFields) {
        highlightField(pair.wantInput, 'bl-highlight-want');
        highlightField(pair.haveInput, 'bl-highlight-have');
      }
      
      // Copy the value
      copyValue(pair.wantInput, pair.haveInput);
      processed++;
      
      // Remove highlights after a delay
      if (options.highlightFields) {
        setTimeout(() => {
          removeHighlight(pair.wantInput, 'bl-highlight-want');
          removeHighlight(pair.haveInput, 'bl-highlight-have');
        }, 1000);
      }
    });
    
    alert(`Copied ${processed} Want quantities to Have quantities!`);
  }
}

// Process the next confirmation
function processNextConfirmation() {
  if (currentIndex >= pendingCopies.length) {
    alert(`Completed! Copied ${currentIndex} Want quantities to Have quantities.`);
    return;
  }
  
  const pair = pendingCopies[currentIndex];
  
  // Highlight fields
  if (options.highlightFields) {
    highlightField(pair.wantInput, 'bl-highlight-want');
    highlightField(pair.haveInput, 'bl-highlight-have');
  }
  
  // Scroll the item into view
  pair.wantInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
  
  // Create confirmation modal
  createConfirmationModal(pair, () => {
    // On confirm
    copyValue(pair.wantInput, pair.haveInput);
    currentIndex++;
    
    // Remove highlights
    if (options.highlightFields) {
      removeHighlight(pair.wantInput, 'bl-highlight-want');
      removeHighlight(pair.haveInput, 'bl-highlight-have');
    }
    
    // Process next pair
    setTimeout(processNextConfirmation, 300);
  }, () => {
    // On skip
    currentIndex++;
    
    // Remove highlights
    if (options.highlightFields) {
      removeHighlight(pair.wantInput, 'bl-highlight-want');
      removeHighlight(pair.haveInput, 'bl-highlight-have');
    }
    
    // Process next pair
    setTimeout(processNextConfirmation, 300);
  }, () => {
    // On cancel
    // Remove all highlights
    pendingCopies.forEach(p => {
      if (options.highlightFields) {
        removeHighlight(p.wantInput, 'bl-highlight-want');
        removeHighlight(p.haveInput, 'bl-highlight-have');
      }
    });
    
    alert(`Cancelled. Copied ${currentIndex} out of ${pendingCopies.length} quantities.`);
  });
}

// Create a confirmation modal
function createConfirmationModal(pair, onConfirm, onSkip, onCancel) {
  // Remove any existing modal
  const existingModal = document.querySelector('.bl-extension-modal');
  if (existingModal) {
    existingModal.remove();
  }
  
  // Get part info
  const row = getParentRow(pair.wantInput);
  let partInfo = "this part";
  
  if (row) {
    const cells = row.querySelectorAll('td');
    if (cells.length > 1) {
      const partNameCell = cells[1]; // Assuming the second cell has the part name
      if (partNameCell) {
        partInfo = partNameCell.textContent.trim();
      }
    }
  }
  
  const modal = document.createElement('div');
  modal.className = 'bl-extension-modal';
  
  const content = document.createElement('div');
  content.className = 'bl-extension-modal-content';
  
  content.innerHTML = `
    <h3>Confirm Copy</h3>
    <p>Copy Want (${pair.value}) to Have for:</p>
    <p><strong>${partInfo}</strong></p>
    <p>(${currentIndex + 1} of ${pendingCopies.length})</p>
    <div class="bl-extension-checkbox-container">
      <input type="checkbox" id="applyToAll">
      <label for="applyToAll">Apply to all remaining items</label>
    </div>
    <div class="bl-extension-button-container">
      <button class="bl-extension-button confirm">Copy</button>
      <button class="bl-extension-button skip">Skip</button>
      <button class="bl-extension-button cancel">Cancel</button>
    </div>
  `;
  
  modal.appendChild(content);
  document.body.appendChild(modal);
  
  // Handle buttons
  const confirmButton = modal.querySelector('.confirm');
  const skipButton = modal.querySelector('.skip');
  const cancelButton = modal.querySelector('.cancel');
  const applyToAllCheckbox = modal.querySelector('#applyToAll');
  
  confirmButton.addEventListener('click', () => {
    modal.remove();
    
    if (applyToAllCheckbox.checked) {
      // Apply to all remaining items
      for (let i = currentIndex; i < pendingCopies.length; i++) {
        const p = pendingCopies[i];
        if (options.highlightFields) {
          highlightField(p.wantInput, 'bl-highlight-want');
          highlightField(p.haveInput, 'bl-highlight-have');
        }
        
        copyValue(p.wantInput, p.haveInput);
        
        if (options.highlightFields) {
          setTimeout(() => {
            removeHighlight(p.wantInput, 'bl-highlight-want');
            removeHighlight(p.haveInput, 'bl-highlight-have');
          }, 300);
        }
      }
      
      alert(`Completed! Copied ${pendingCopies.length} Want quantities to Have quantities.`);
    } else {
      onConfirm();
    }
  });
  
  skipButton.addEventListener('click', () => {
    modal.remove();
    
    if (applyToAllCheckbox.checked) {
      // Skip all remaining and finish
      currentIndex = pendingCopies.length;
      onSkip();
    } else {
      onSkip();
    }
  });
  
  cancelButton.addEventListener('click', () => {
    modal.remove();
    onCancel();
  });
}

// Helper function to find the parent row
function getParentRow(element) {
  let current = element;
  while (current && current.tagName !== 'TR') {
    current = current.parentElement;
  }
  return current;
}

// Helper function to highlight a field
function highlightField(element, className) {
  element.classList.add(className);
}

// Helper function to remove highlight
function removeHighlight(element, className) {
  element.classList.remove(className);
}

// Helper function to copy value and trigger events
function copyValue(fromElement, toElement) {
  toElement.value = fromElement.value;
  
  // Trigger events
  ['change', 'input'].forEach(eventType => {
    const event = new Event(eventType, { bubbles: true });
    toElement.dispatchEvent(event);
  });
}

// Add the buttons to the page when it loads
window.addEventListener('load', () => {
  // Wait a bit for React to fully render the page
  setTimeout(addButtons, 1000);
});

// Also try to add the button periodically in case the page loads dynamically
setInterval(checkAndAddButtons, 2000);

function checkAndAddButtons() {
  // Check if our button already exists
  if (!document.getElementById('bl-copy-want-to-have')) {
    addButtons();
  }
}

function addButtons() {
  // Look for a good place to insert the buttons
  const quantityHeader = Array.from(document.querySelectorAll('th')).find(th => 
    th.textContent.includes('Quantity'));
  
  if (quantityHeader) {
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'bl-extension-button-container';
    
    // Copy all button
    const copyAllButton = document.createElement('button');
    copyAllButton.id = 'bl-copy-want-to-have';
    copyAllButton.className = 'bl-extension-button';
    copyAllButton.textContent = 'Copy All Want to Have';
    
    copyAllButton.addEventListener('click', () => {
      // Get saved options
      chrome.storage.local.get({
        highlightFields: true,
        confirmEach: false,
        skipNonZero: false
      }, (items) => {
        options = items;
        startCopyProcess();
      });
    });
    
    // Add confirmation mode button
    const confirmButton = document.createElement('button');
    confirmButton.id = 'bl-copy-want-to-have-confirm';
    confirmButton.className = 'bl-extension-button';
    confirmButton.textContent = 'Copy With Confirmation';
    
    confirmButton.addEventListener('click', () => {
      // Get saved options but override confirmEach
      chrome.storage.local.get({
        highlightFields: true,
        skipNonZero: false
      }, (items) => {
        options = {
          ...items,
          confirmEach: true
        };
        startCopyProcess();
      });
    });
    
    buttonContainer.appendChild(copyAllButton);
    buttonContainer.appendChild(confirmButton);
    
    // Insert after the quantity header
    quantityHeader.parentNode.parentNode.insertAdjacentElement('afterend', buttonContainer);
  }
}