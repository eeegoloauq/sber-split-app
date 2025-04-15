const fs = require("fs");
const path = require("path");
const https = require("https");

const apiKey = process.env.GOOGLE_API_KEY || "AIzaSyADrldInv0tdpC8F2Xcf7opHOLJy8XEmMs";
const modelName = "gemini-2.0-flash";
const imageFilePath = "../checks/all (3).jpg";
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

    const prompt =
      "Analyze the restaurant bill image. Extract only the meal/drink items and prices. Ignore other lines. Be careful with spaced prices (e.g., '1 400' is 1400). Output a JSON object with two keys: 'meals' and 'total'. The 'meals' key should be an array of objects, each containing 'name', 'amount', and 'price' keys. Include the final total price under the 'total' key.  Respond in valid JSON format.";

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
