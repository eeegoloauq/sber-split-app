const fs = require("fs");
const path = require("path");
const https = require("https");

// Convert image file to base64
function fileToBase64(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Image file not found: ${filePath}`);
  }
  return Buffer.from(fs.readFileSync(filePath)).toString("base64");
}

// Function for HTTP requests
function makeRequest(url, data) {
  return new Promise((resolve, reject) => {
    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    };

    const req = https.request(url, options, (res) => {
      let responseData = "";
      res.on("data", (chunk) => {
        responseData += chunk;
      });
      res.on("end", () => {
        try {
          const parsedData = JSON.parse(responseData);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(parsedData);
          } else {
            console.error("API Error:", responseData);
            reject(new Error(`Request error: ${res.statusCode}: ${JSON.stringify(parsedData)}`));
          }
        } catch (error) {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ rawText: responseData });
          } else {
            console.error("Unprocessed error response:", responseData);
            reject(new Error(`Request error: ${res.statusCode}. Response: ${responseData}`));
          }
        }
      });
    });

    req.on("error", (error) => {
      reject(error);
    });

    req.write(JSON.stringify(data));
    req.end();
  });
}

// Verify total sum of items against grand total
function verifyTotalSum(jsonData) {
  if (!jsonData || !jsonData.items || !Array.isArray(jsonData.items) || typeof jsonData.grand_total !== 'number') {
    console.warn("JSON data missing 'items' array or 'grand_total' number for verification.");
    return;
  }

  let calculatedTotal = 0;
  jsonData.items.forEach((item) => {
    if (item.total_item_price != null && typeof item.total_item_price === 'number' && !isNaN(item.total_item_price)) {
      calculatedTotal += item.total_item_price;
    } else {
      console.warn(`Invalid or missing price ('${item.total_item_price}') for item '${item.name}', skipping in verification.`);
    }
  });

  // Apply any discount, service charge, or tips
  if (jsonData.discount && typeof jsonData.discount === 'number' && !isNaN(jsonData.discount)) {
    calculatedTotal -= jsonData.discount;
    console.log(`Applied discount: -${jsonData.discount.toFixed(2)}`);
  }
  
  if (jsonData.service_charge && typeof jsonData.service_charge === 'number' && !isNaN(jsonData.service_charge)) {
    calculatedTotal += jsonData.service_charge;
    console.log(`Applied service charge: +${jsonData.service_charge.toFixed(2)}`);
  }
  
  if (jsonData.tips && typeof jsonData.tips === 'number' && !isNaN(jsonData.tips)) {
    calculatedTotal += jsonData.tips;
    console.log(`Applied tips: +${jsonData.tips.toFixed(2)}`);
  }

  calculatedTotal = parseFloat(calculatedTotal.toFixed(2));
  const grandTotal = parseFloat(jsonData.grand_total.toFixed(2));

  console.log(`\n--- Checking Total Sum ---`);
  console.log(`Calculated sum of items: ${calculatedTotal.toFixed(2)}`);
  console.log(`Grand total from receipt: ${grandTotal.toFixed(2)}`);

  const tolerance = 0.01; // Acceptable margin of error
  if (Math.abs(calculatedTotal - grandTotal) <= tolerance) {
    console.log("Verification successful: calculated sum matches receipt grand total.");
  } else {
    console.error(`Verification FAILED: calculated sum (${calculatedTotal.toFixed(2)}) doesn't match grand total (${grandTotal.toFixed(2)}). Difference: ${(calculatedTotal - grandTotal).toFixed(2)}`);
  }
  console.log(`---------------------------\n`);
}

module.exports = {
  fileToBase64,
  makeRequest,
  verifyTotalSum
}; 