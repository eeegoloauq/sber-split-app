// frontend/src/services/api.js

// URL of our Express backend
const API_BASE_URL = 'http://localhost:5000';

/**
 * Sends a receipt image to the backend for processing.
 * @param {FormData} formData - FormData object containing the file under the key 'file'.
 * @returns {Promise<object>} - Promise that resolves with the response from the backend in JSON format.
 * @throws {Error} - Throws an error if the request fails or the response is not JSON.
 */
export const sendReceiptToBackend = async (formData) => {
  console.log("Sending data to:", `${API_BASE_URL}/upload`);
  try {
    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      body: formData,
      // Important: Don't set 'Content-Type': 'multipart/form-data' manually!
      // The browser will do this automatically, including the correct boundary.
    });

    if (!response.ok) {
      // Try to read the error body if it exists
      let errorBody = null;
      try {
        errorBody = await response.json();
      } catch (jsonError) {
        // Error reading JSON, use text status
        console.error("Error reading JSON from error response:", jsonError);
      }
      const errorMessage = errorBody?.error || `Server error: ${response.status} ${response.statusText}`;
      console.error("Server response error:", response.status, errorMessage, errorBody);
      throw new Error(errorMessage);
    }

    // If response is successful, parse JSON
    const data = await response.json();
    console.log("Response from backend:", data);
    return data;

  } catch (error) {
    console.error("Network error or error during sending:", error);
    // Re-throw the error so it can be caught in the component
    throw new Error(error.message || 'Could not connect to server');
  }
};

/**
 * Fetches a specific receipt by ID.
 * @param {string} receiptId - The ID of the receipt to fetch.
 * @returns {Promise<object>} - Promise that resolves with the receipt data.
 * @throws {Error} - Throws an error if the request fails.
 */
export const getReceiptById = async (receiptId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/receipts/${receiptId}`);
    
    if (!response.ok) {
      let errorData = null;
      try {
        errorData = await response.json();
      } catch (e) {
        // If we can't parse JSON, use status text
      }
      throw new Error(errorData?.error || `Failed to fetch receipt: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error fetching receipt:", error);
    throw error;
  }
}; 