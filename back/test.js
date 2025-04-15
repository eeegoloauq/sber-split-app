const fs = require("fs");
const path = require("path");
const https = require("https");

const apiKey = process.env.GOOGLE_API_KEY || "AIzaSyADrldInv0tdpC8F2Xcf7opHOLJy8XEmMs";
const modelName = "gemini-2.0-flash";
const imageFilePath = "../checks/all (5).jpg";
const outputJsonFile = "output.json";

// Proxy configuration
const PROXY_URL = "https://gemini-proxy.zhora-solovev-2017.workers.dev";
const API_ENDPOINT = "/v1beta/models/${modelName}:generateContent";

function fileToBase64(filePath) {
  const absolutePath = path.resolve(__dirname, filePath);
  console.log(`Reading image file from: ${absolutePath}`);
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Image file not found at: ${absolutePath}`);
  }
  return Buffer.from(fs.readFileSync(absolutePath)).toString("base64");
}

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
            console.error("Response data:", responseData);
            reject(new Error(`Request failed with status code ${res.statusCode}: ${JSON.stringify(parsedData)}`));
          }
        } catch (error) {
          console.error("Raw response:", responseData);
          reject(new Error(`Failed to parse response: ${error.message}`));
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

async function run() {
  try {
    console.log(`Using model: ${modelName}`);

    const prompt = `
Analyze the provided image of a Russian restaurant/cafe receipt. Your goal is to extract structured information about the purchased items and the total amount.

**Instructions:**

1.  **Focus Area:** Concentrate *only* on the main section of the receipt that lists the purchased items (dishes, drinks, services) with their quantities and prices, and the final total amount. Ignore header information (establishment name, address, TIN), server/cashier details, date/time (unless needed for context within an item line), discount/bonus information (unless itemized as a separate line with a price), VAT summaries at the bottom, QR codes for tips/feedback, and any other peripheral text.

2.  **Item Extraction:** For each distinct item line in the main section:
    *   **\`name\` (String):** Accurately extract the full name of the item exactly as written on the receipt. Preserve the original Russian language and spelling. If a name spans multiple physical lines on the receipt, combine them into a single string for this item.
    *   **\`quantity\` (Number):** Determine the quantity for the item.
        *   Look for numbers in columns typically labeled 'Кол-во', 'Кол.', 'шт', 'порц', or similar quantity indicators.
        *   If the quantity is presented combined with units (e.g., '3х0.5л', '2 пор', '1 шт', '1.00', '0.5'), extract *only* the primary numerical multiplier (e.g., 3, 2, 1, 1, 0.5 respectively).
        *   If no quantity is explicitly stated for an item line that has a price, assume the quantity is 1.
        *   The result *must* be a numerical value.
    *   **\`unit_price\` (Number or Null):** Identify the price per single unit of the item.
        *   Look for a dedicated column often labeled 'Цена'. If present, use this value.
        *   If a 'Цена' column is absent or unclear, but 'quantity' (Кол-во) and 'total_item_price' (Сумма) are available for the line, calculate the unit price as \`total_item_price / quantity\`.
        *   If the unit price cannot be reliably determined or calculated (e.g., quantity is zero or ambiguous), set the value to \`null\`.
        *   The result *must* be a numerical value or \`null\`.
    *   **\`total_item_price\` (Number):** Extract the total cost for that specific item line, usually found in the column labeled 'Сумма' or 'Стоимость'. This represents the price for *all units* of that item on that line (\`quantity\` * \`unit_price\`).
        *   The result *must* be a numerical value.

3.  **Grand Total Extraction:**
    *   **\`grand_total\` (Number):** Locate and extract the *final, total amount payable* for the entire receipt. Look for labels like 'ИТОГО К ОПЛАТЕ', 'ИТОГО:', 'ВСЕГО:', 'Сумма заказов', 'К оплате'. Ensure you capture the ultimate final sum, not any intermediate subtotals.
        *   The result *must* be a numerical value.

4.  **Filtering:** Ignore rows that are clearly not purchased items. This includes empty lines, decorative separators, repeated column headers within the item list, informational lines without a price (like 'БОНУС к первой кружке'), etc.

5.  **Accuracy:** Pay close attention to correctly associating the \`name\`, \`quantity\`, \`unit_price\`, and \`total_item_price\` for *each specific row*. Receipt layouts can vary, and columns might not align perfectly; strive to interpret the data horizontally for each logical item entry.

6.  **Output Format:** Return the extracted information *strictly* as a single, valid JSON object. Do **NOT** include any introductory text, explanations, apologies, or any other text outside the JSON structure. The JSON object must follow this exact format:

\`\`\`json
{
  "items": [
    {
      "name": "Полное наименование на русском",
      "quantity": NUMBER,
      "unit_price": NUMBER_OR_NULL,
      "total_item_price": NUMBER
    }
    // ... more items extracted from the receipt
  ],
  "grand_total": NUMBER
}
\`\`\`

**Example Interpretation:**
*   Receipt line: \`Пшеничное Н/Ф светлое 0.5л 300 3х0.5л 900\` -> JSON item: \`{ "name": "Пшеничное Н/Ф светлое 0.5л", "quantity": 3, "unit_price": 300.00, "total_item_price": 900.00 }\`
*   Receipt line: \`Фирменный бургер Папа Бейде 1 540.00\` -> JSON item: \`{ "name": "Фирменный бургер Папа Бейде", "quantity": 1, "unit_price": 540.00, "total_item_price": 540.00 }\` (assuming unit_price derived from total/quantity if 'Цена' column missing)

**Input:** The input will be an image of the receipt.
**Output:** ONLY the valid JSON object described above.
`;

    console.log("Preparing image data...");
    const imageBase64 = fileToBase64(imageFilePath);

    // Prepare request payload
    const requestData = {
      contents: [
        {
          parts: [
            {
              text: prompt
            },
            {
              inline_data: {
                mime_type: "image/jpeg",
                data: imageBase64
              }
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.4,
        topK: 32,
        topP: 1,
        maxOutputTokens: 4096,
      }
    };

    // Use the proxy URL to access the Google API
    const targetEndpoint = `/v1beta/models/${modelName}:generateContent`;
    const requestUrl = `${PROXY_URL}${targetEndpoint}?key=${apiKey}`;

    console.log("Sending request to Gemini API via proxy...");
    console.log(`Request URL: ${requestUrl}`);
    const result = await makeRequest(requestUrl, requestData);
    
    if (!result || !result.candidates || !result.candidates[0] || !result.candidates[0].content) {
      console.error("ERROR: Failed to get text response from API.");
      console.error("API Response:", JSON.stringify(result, null, 2));
      const blockReason = result?.promptFeedback?.blockReason;
      const safetyRatings = result?.candidates?.[0]?.safetyRatings;
      if (blockReason) console.error(`Reason: ${blockReason}`);
      if (safetyRatings)
        console.error(
          `Safety Ratings: ${JSON.stringify(safetyRatings, null, 2)}`
        );
      return;
    }

    // Extract text from response
    const responseText = result.candidates[0].content.parts[0].text;

    try {
      const jsonData = JSON.parse(responseText);

      console.log("\n--- Generated JSON Data ---");
      console.log(JSON.stringify(jsonData, null, 2));
      console.log("------------------------\n");

      console.log(`Writing data to ${outputJsonFile}...`);
      fs.writeFileSync(
        outputJsonFile,
        JSON.stringify(jsonData, null, 2),
        "utf8"
      );
      console.log(`Successfully created JSON file: ${outputJsonFile}`);

      // --- Sum the amounts and print the total ---
      let totalAmount = 0;
      if (jsonData.meals && Array.isArray(jsonData.meals)) {
        jsonData.meals.forEach((item) => {
          if (item.amount) {
            const amount = parseFloat(item.amount);
            if (!isNaN(amount)) {
              totalAmount += amount;
            } else {
              console.warn(
                `Invalid amount '${item.amount}' found for meal '${item.name}', skipping.`
              );
            }
          }
        });

        console.log(`\nTotal Amount of Meals: ${totalAmount.toFixed(2)}`);
      } else {
        console.warn(
          "The 'meals' array is missing or not an array in the JSON response."
        );
      }
    } catch (jsonError) {
      console.error("Error parsing JSON:", jsonError);
      console.error("Raw response text:", responseText); // Print the raw response for debugging.
    }
  } catch (error) {
    console.error("An error occurred:", error);
    if (error.response)
      console.error(
        "API Response Error:",
        JSON.stringify(error.response, null, 2)
      );
  }
}

run();
