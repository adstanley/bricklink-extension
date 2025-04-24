 // content.js
 function copyWantToHaveValues() {
    // Find all quantity cells
    const quantityCells = document.querySelectorAll('div.wl-col-quantity.wl-edit-cell');
    let count = 0;
    
    // Process each cell
    quantityCells.forEach(cell => {
      // Find the Want and Have divs within this cell
      const allDivs = cell.querySelectorAll('div.full-width');
      
      // We need at least 2 divs (one for Want, one for Have)
      if (allDivs.length >= 2) {
        // First div with "Want:" text
        const wantDiv = Array.from(allDivs).find(div => 
          div.textContent.includes('Want:'));
        
        // Second div with "Have:" text
        const haveDiv = Array.from(allDivs).find(div => 
          div.textContent.includes('Have:'));
        
        if (wantDiv && haveDiv) {
          // Get input fields
          const wantInput = wantDiv.querySelector('input[type="number"].form-text.width-small');
          const haveInput = haveDiv.querySelector('input[type="number"].form-text.width-small');
          
          if (wantInput && haveInput) {
            // Copy the Want value to the Have field
            haveInput.value = wantInput.value;
            
            // Trigger change and input events to ensure React updates
            const events = ['change', 'input'];
            events.forEach(eventType => {
              const event = new Event(eventType, { bubbles: true });
              haveInput.dispatchEvent(event);
            });
            
            count++;
          }
        }
      }
    });
    
    alert(`Copied ${count} Want quantities to Have quantities!`);
  }
  
  // Add the button to the page when it loads
  window.addEventListener('load', () => {
    // Wait a bit for React to fully render the page
    setTimeout(addButton, 1000);
  });
  
  // Also try to add the button periodically in case the page loads dynamically
  setInterval(checkAndAddButton, 2000);
  
  function checkAndAddButton() {
    // Check if our button already exists
    if (!document.getElementById('bl-copy-want-to-have')) {
      addButton();
    }
  }
  
  function addButton() {
    // Look for a good place to insert the button
    const quantityHeader = Array.from(document.querySelectorAll('th')).find(th => 
      th.textContent.includes('Quantity'));
    
    if (quantityHeader) {
      const buttonContainer = document.createElement('div');
      buttonContainer.style.margin = '10px 0';
      buttonContainer.style.textAlign = 'center';
      
      const button = document.createElement('button');
      button.id = 'bl-copy-want-to-have';
      button.textContent = 'Copy All Want → Have';
      button.style.padding = '8px 16px';
      button.style.backgroundColor = '#4285f4';
      button.style.color = 'white';
      button.style.border = 'none';
      button.style.borderRadius = '4px';
      button.style.cursor = 'pointer';
      button.style.margin = '10px 0';
      
      button.addEventListener('click', copyWantToHaveValues);
      
      buttonContainer.appendChild(button);
      
      // Insert after the quantity header
      quantityHeader.parentNode.parentNode.insertAdjacentElement('afterend', buttonContainer);
    }
  }