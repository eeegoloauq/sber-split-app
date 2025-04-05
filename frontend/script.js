// --- Configuration --- //
// Assumes the backend Flask server is running on the default port 5000
const BACKEND_URL = 'http://127.0.0.1:5000';

// --- DOM Elements --- //
const receiptFileInput = document.getElementById('receiptFile');
const uploadButton = document.getElementById('uploadButton');
const uploadStatusDiv = document.getElementById('upload-status');
const imagePreview = document.getElementById('image-preview');

const resultSection = document.getElementById('result-section');
const ocrStatusDiv = document.getElementById('ocr-status');
const parsedDataPre = document.getElementById('parsed-data');
const parsedItemsUl = document.getElementById('parsed-items');
const parsedTotalP = document.getElementById('parsed-total');

const splitSection = document.getElementById('split-section');
const splitMethodSelect = document.getElementById('splitMethod');
const numPeopleInput = document.getElementById('numPeople');
const splitButton = document.getElementById('splitButton');
const splitStatusDiv = document.getElementById('split-status');
const splitResultPre = document.getElementById('split-result');
const receiptIdInput = document.getElementById('receipt-id-for-split');

const historySection = document.getElementById('history-section');
const historyListUl = document.getElementById('receipt-history-list');
const refreshHistoryButton = document.getElementById('refreshHistoryButton');
const historyStatusDiv = document.getElementById('history-status');

// --- Functions --- //

// Helper to display status messages
function showStatus(element, message, type = 'info') {
    element.textContent = message;
    element.className = `status-message ${type}`; // Add type class (loading, success, error)
    element.style.display = 'block';
}

// Helper to hide status messages
function hideStatus(element) {
    element.textContent = '';
    element.style.display = 'none';
}

// Function to handle the file upload and processing
async function uploadAndProcessReceipt(file) {
    if (!file) {
        showStatus(uploadStatusDiv, 'Please select a file first.', 'error');
        return;
    }

    showStatus(uploadStatusDiv, 'Uploading and processing... this may take a moment.', 'loading');
    hideStatus(ocrStatusDiv);
    hideStatus(splitStatusDiv);
    resultSection.style.display = 'none';
    splitSection.style.display = 'none';
    parsedItemsUl.innerHTML = ''; // Clear previous items
    parsedTotalP.textContent = 'N/A';
    parsedDataPre.textContent = '';
    splitResultPre.textContent = '';

    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await fetch(`${BACKEND_URL}/upload`, {
            method: 'POST',
            body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || `HTTP error! status: ${response.status}`);
        }

        showStatus(uploadStatusDiv, 'Upload and processing successful!', 'success');
        displayResults(data); // Display the parsed data
        await fetchReceiptHistory(); // Refresh history after upload

    } catch (error) {
        console.error('Upload error:', error);
        showStatus(uploadStatusDiv, `Error: ${error.message}`, 'error');
        resultSection.style.display = 'none';
        splitSection.style.display = 'none';
    }
}

// Function to display the results from the backend
function displayResults(receiptData) {
    console.log("Received data:", receiptData);
    resultSection.style.display = 'block';
    splitSection.style.display = 'block'; // Show split section now
    hideStatus(ocrStatusDiv);

    // Display raw JSON for debugging/completeness
    parsedDataPre.textContent = JSON.stringify(receiptData, null, 2); // Pretty print JSON

    // Display items
    parsedItemsUl.innerHTML = ''; // Clear previous items
    if (receiptData.items && receiptData.items.length > 0) {
        receiptData.items.forEach(item => {
            const li = document.createElement('li');
            li.textContent = `${item.quantity}x ${item.name} - ${item.price.toFixed(2)}`;
            parsedItemsUl.appendChild(li);
        });
    } else {
        parsedItemsUl.innerHTML = '<li>No items parsed.</li>';
    }

    // Display total
    parsedTotalP.textContent = receiptData.parsed_total_amount !== null && receiptData.parsed_total_amount !== undefined
                                ? receiptData.parsed_total_amount.toFixed(2)
                                : 'Not found';

    // Store receipt ID for splitting
    receiptIdInput.value = receiptData.id;

    // Reset split result
    splitResultPre.textContent = '';
    hideStatus(splitStatusDiv);
}

// Function to calculate the bill split
async function calculateSplit() {
    const receiptId = receiptIdInput.value;
    const method = splitMethodSelect.value;
    const numPeople = parseInt(numPeopleInput.value, 10);

    if (!receiptId) {
        showStatus(splitStatusDiv, 'No receipt loaded to split.', 'error');
        return;
    }

    showStatus(splitStatusDiv, 'Calculating split...', 'loading');
    splitResultPre.textContent = ''; // Clear previous result

    let requestBody = {};

    if (method === 'equal') {
        if (isNaN(numPeople) || numPeople < 1) {
             showStatus(splitStatusDiv, 'Please enter a valid number of people.', 'error');
             return;
        }
        requestBody = {
            method: 'equal',
            people: numPeople
        };
    } else if (method === 'proportional') {
        // TODO: Gather item assignments from the UI when this is implemented
        showStatus(splitStatusDiv, 'Proportional split UI not implemented yet.', 'error');
        return; // Stop here for now
        // requestBody = {
        //     method: 'proportional',
        //     people: { /* Person-to-item assignments map */ }
        // };
    } else {
        showStatus(splitStatusDiv, 'Invalid split method selected.', 'error');
        return;
    }

    try {
        const response = await fetch(`${BACKEND_URL}/receipts/${receiptId}/split`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });

        const data = await response.json();

        if (!response.ok) {
             throw new Error(data.error || `HTTP error! status: ${response.status}`);
        }

        showStatus(splitStatusDiv, 'Split calculated successfully!', 'success');
        splitResultPre.textContent = JSON.stringify(data, null, 2); // Display split result

    } catch (error) {
        console.error('Split calculation error:', error);
        showStatus(splitStatusDiv, `Error: ${error.message}`, 'error');
        splitResultPre.textContent = 'Error calculating split.';
    }
}

// Function to fetch and display receipt history
async function fetchReceiptHistory() {
    showStatus(historyStatusDiv, 'Loading history...', 'loading');
    historyListUl.innerHTML = ''; // Clear existing list

    try {
        const response = await fetch(`${BACKEND_URL}/receipts`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const history = await response.json();

        if (history && history.length > 0) {
            hideStatus(historyStatusDiv);
            history.forEach(receipt => {
                const li = document.createElement('li');
                li.setAttribute('data-id', receipt.id);

                // Delete button
                const deleteBtn = document.createElement('button');
                deleteBtn.textContent = 'Delete';
                deleteBtn.onclick = (event) => {
                    event.stopPropagation(); // Prevent li click when clicking button
                    deleteReceipt(receipt.id, li);
                };

                // Receipt info
                const infoSpan = document.createElement('span');
                infoSpan.textContent = `ID: ${receipt.id} - ${receipt.original_filename} (Status: ${receipt.status}) - Uploaded: ${new Date(receipt.upload_timestamp).toLocaleString()}`;

                li.appendChild(infoSpan);
                li.appendChild(deleteBtn);

                // Add click listener to load this receipt's details
                li.addEventListener('click', () => loadReceiptDetails(receipt.id));

                historyListUl.appendChild(li);
            });
        } else {
            showStatus(historyStatusDiv, 'No receipts found in history.', 'info');
        }

    } catch (error) {
        console.error('Error fetching history:', error);
        showStatus(historyStatusDiv, `Error fetching history: ${error.message}`, 'error');
    }
}

// Function to load details of a specific receipt from history
async function loadReceiptDetails(receiptId) {
    showStatus(uploadStatusDiv, `Loading details for receipt ${receiptId}...`, 'loading');
    hideStatus(ocrStatusDiv);
    hideStatus(splitStatusDiv);
    resultSection.style.display = 'none';
    splitSection.style.display = 'none';

    try {
        const response = await fetch(`${BACKEND_URL}/receipts/${receiptId}`);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || `HTTP error! status: ${response.status}`);
        }

        hideStatus(uploadStatusDiv); // Hide loading message
        displayResults(data); // Display the loaded data
        // Scroll to top maybe?
         window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (error) {
        console.error(`Error loading receipt ${receiptId}:`, error);
        showStatus(uploadStatusDiv, `Error loading receipt: ${error.message}`, 'error');
        resultSection.style.display = 'none';
        splitSection.style.display = 'none';
    }
}

// Function to delete a receipt
async function deleteReceipt(receiptId, listItemElement) {
    if (!confirm(`Are you sure you want to delete receipt ${receiptId}? This cannot be undone.`)) {
        return;
    }

    showStatus(historyStatusDiv, `Deleting receipt ${receiptId}...`, 'loading');

    try {
        const response = await fetch(`${BACKEND_URL}/receipts/${receiptId}`, {
            method: 'DELETE',
        });
        const data = await response.json();

        if (!response.ok) {
             throw new Error(data.error || `HTTP error! status: ${response.status}`);
        }

        showStatus(historyStatusDiv, `Receipt ${receiptId} deleted successfully.`, 'success');
        // Remove the item from the list visually
        if (listItemElement) {
            listItemElement.remove();
        }
        // Optionally clear the main display if the deleted receipt was shown
        if (receiptIdInput.value == receiptId) {
             resultSection.style.display = 'none';
             splitSection.style.display = 'none';
             receiptIdInput.value = '';
        }

    } catch (error) {
        console.error(`Error deleting receipt ${receiptId}:`, error);
        showStatus(historyStatusDiv, `Error deleting receipt: ${error.message}`, 'error');
    }
}

// --- Event Listeners --- //

uploadButton.addEventListener('click', () => {
    const file = receiptFileInput.files[0];
    uploadAndProcessReceipt(file);
});

// Add preview for selected image
receiptFileInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            imagePreview.src = e.target.result;
            imagePreview.style.display = 'block';
        }
        reader.readAsDataURL(file);
        hideStatus(uploadStatusDiv); // Hide previous status when new file selected
    } else {
        imagePreview.style.display = 'none';
        imagePreview.src = '#';
    }
});

splitButton.addEventListener('click', calculateSplit);

refreshHistoryButton.addEventListener('click', fetchReceiptHistory);

// --- Initial Load --- //
document.addEventListener('DOMContentLoaded', () => {
    fetchReceiptHistory(); // Load history when the page loads
}); 