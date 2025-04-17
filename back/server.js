const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
const { fileToBase64, makeRequest, verifyTotalSum } = require('./testUtils');

// Create Express app
const app = express();
const port = process.env.PORT || 5000;

// Enable CORS for frontend requests
app.use(cors());
app.use(express.json());

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadsDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ storage: storage });

// API Endpoint to process receipt
app.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log('File received:', req.file.path);
    
    // Configuration
    const modelName = "gemini-2.0-flash";
    const NETLIFY_FUNCTION_URL = "https://magenta-tartufo-d2e30a.netlify.app/.netlify/functions/gemini-proxy";

    // Convert image to base64
    const imageBase64 = fileToBase64(req.file.path);

    // Prompt for Gemini API (same as in test.js)
    const prompt = `
**Task:** Analyze the provided image of a Russian restaurant/cafe receipt. Extract a structured list of purchased items (name, quantity, total price per item line), the final grand total amount, and any discounts, service charges, or tips applied.

**Core Instructions:**

1.  **Target Area:** Focus *exclusively* on the section listing purchased items and their final costs, plus the overall total payable amount, and any clearly labeled lines referring to:
    *   **Discounts:** Lines containing terms like "Скидка", "Скид.", "скидка по карте", etc.
    *   **Service charges:** Terms such as "Сервисный сбор", "Обслуживание", "Service", etc.
    *   **Tips:** Lines labeled "Чаевые", "Tips", "Gratuity", etc.
    
    Critically, ignore:
    *   Header/Footer: Establishment details (name, address, TIN), server/cashier info, date/time stamps, VAT summaries, QR codes, tip prompts.
    *   Non-Item Lines: Empty lines, separators, column headers repeated mid-list, purely informational lines without a corresponding item price (e.g., "Bonus applied"), intermediate subtotals appearing before the final grand total.

2.  **Item Extraction (for each distinct item line):**
    *   **\`name\` (String):** Extract the full, exact item name as it appears on the receipt. **Maintain the original Russian language and spelling.** If an item's name wraps onto multiple lines on the receipt, combine them into a single string for this item.
    *   **\`quantity\` (Number):** Determine the item quantity for the line.
        *   Look for an explicit number in columns like 'Кол-во', 'Кол.', 'шт', 'порц'.
        *   If quantity is shown with units (e.g., '3х0.5л', '2 пор', '1.0 шт', '1.00'), extract the leading numerical value (e.g., 3, 2, 1, 1 respectively). If the quantity itself is fractional (e.g., '0.5 порц'), extract that fraction (e.g., 0.5).
        *   **If no explicit quantity number is found on a line with an item name and a price, assume the quantity is 1.**
        *   The result *must* be a number.
    *   **\`total_item_price\` (Number):** Extract the final price for *that specific line item*, typically found in the 'Сумма' or 'Стоимость' column. This represents the total cost for the specified quantity of that item on that line.
        *   The result *must* be a number. Only include lines that clearly associate an item name with a total price.

3.  **Grand Total Extraction:**
    *   **\`grand_total\` (Number):** Find and extract the single, **absolute final amount payable** for the entire receipt. Search for labels such as 'ИТОГО К ОПЛАТЕ', 'ИТОГО:', 'ВСЕГО:', 'К оплате'. Be careful to select the *very last* total amount presented, discarding any prior subtotals (like 'Сумма заказа' if a later 'К оплате' exists).
        *   The result *must* be a number.

4.  **Discount / Service Fee / Tips Extraction:**
    *   **\`discount\` (Number | null):** If a line explicitly indicates a discount (e.g., contains "Скидка"), extract its value as a positive number. If no discount is found, set to \`null\`.
    *   **\`service_charge\` (Number | null):** If a service fee or service charge appears, extract it. If absent, set to \`null\`.
    *   **\`tips\` (Number | null):** If a tip amount is shown explicitly, extract it. Otherwise, set to \`null\`.

5.  **Accuracy & Association:** Meticulously link the correct "name", "quantity", and "total_item_price" for *each horizontal line* representing a purchased item. Receipt formatting can be inconsistent; prioritize horizontal data association for each logical entry.

6.  **Output Format:** Generate **ONLY** a single, valid JSON object. Do **NOT** include any text before or after the JSON object. Do **NOT** wrap the JSON in markdown backticks (\`\`\`). The JSON object must strictly adhere to this structure:

\`\`\`json
{
  "items": [
    {
      "name": "Полное наименование товара на русском",
      "quantity": NUMBER,
      "total_item_price": NUMBER
    }
    // ... more items extracted from the receipt
  ],
  "discount": NUMBER | null,
  "service_charge": NUMBER | null,
  "tips": NUMBER | null,
  "grand_total": NUMBER
}
\`\`\`
`;

    // Data for sending through Netlify Function
    const requestData = {
      modelName: modelName,
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inline_data: {
                mime_type: req.file.mimetype,
                data: imageBase64
              }
            }
          ]
        }
      ],
      generationConfig: {
        temperature: 0.4,
        topK: 32,
        topP: 0.95,
        maxOutputTokens: 4096,
      }
    };

    console.log("Sending request to Gemini API via Netlify Function...");
    const result = await makeRequest(NETLIFY_FUNCTION_URL, requestData);

    // Process response
    let responseText;
    if (result && result.rawText) {
      responseText = result.rawText;
    } else if (result && result.candidates && result.candidates[0]?.content?.parts?.[0]?.text) {
      responseText = result.candidates[0].content.parts[0].text;
    } else {
      console.error("ERROR: Could not get text response from API.");
      console.error("Response details:", JSON.stringify(result, null, 2));
      return res.status(500).json({ error: "Failed to process receipt" });
    }

    // Clean text from markdown
    let cleanedText = responseText.trim();
    const jsonRegex = /^```json\s*([\s\S]*?)\s*```$/;
    const match = cleanedText.match(jsonRegex);
    if (match && match[1]) {
      cleanedText = match[1].trim();
      console.log("Removed markdown delimiters from response.");
    } else {
      console.log("Markdown delimiters not detected, using original response text.");
    }

    try {
      // Parse JSON
      const jsonData = JSON.parse(cleanedText);
      
      // Verify total
      verifyTotalSum(jsonData);
      
      // Save JSON for reference
      const outputPath = path.join(__dirname, 'processedReceipts', `${Date.now()}.json`);
      const dir = path.dirname(outputPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(outputPath, JSON.stringify(jsonData, null, 2), 'utf8');
      
      // Send response to client
      return res.status(200).json({
        success: true,
        receiptData: jsonData,
        id: path.basename(outputPath, '.json')
      });
    } catch (jsonError) {
      console.error("Error parsing JSON:", jsonError.message);
      return res.status(500).json({ error: "Failed to parse receipt data" });
    }
  } catch (error) {
    console.error("Server error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Get processed receipt by ID
app.get('/receipts/:id', (req, res) => {
  const receiptId = req.params.id;
  const filePath = path.join(__dirname, 'processedReceipts', `${receiptId}.json`);
  
  if (fs.existsSync(filePath)) {
    try {
      const data = fs.readFileSync(filePath, 'utf8');
      return res.json(JSON.parse(data));
    } catch (error) {
      return res.status(500).json({ error: "Failed to read receipt data" });
    }
  } else {
    return res.status(404).json({ error: "Receipt not found" });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
}); 