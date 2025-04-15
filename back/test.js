const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs");
const path = require("path");

const apiKey =
  process.env.GOOGLE_API_KEY || "AIzaSyADrldInv0tdpC8F2Xcf7opHOLJy8XEmMs";
const modelName = "gemini-1.5-flash-latest";
const imageFilePath = "../checks/all (3).jpg";
const outputJsonFile = "output.json";

const genAI = new GoogleGenerativeAI(apiKey);

function fileToGenerativePart(filePath, mimeType) {
  const absolutePath = path.resolve(__dirname, filePath);
  console.log(`Reading image file from: ${absolutePath}`);
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Image file not found at: ${absolutePath}`);
  }
  return {
    inlineData: {
      data: Buffer.from(fs.readFileSync(absolutePath)).toString("base64"),
      mimeType,
    },
  };
}

async function run() {
  try {
    console.log(`Using model: ${modelName}`);
    const model = genAI.getGenerativeModel({ model: modelName });

    const prompt =
      "Analyze the restaurant bill image. Extract only the meal/drink items and prices. Ignore other lines. Be careful with spaced prices (e.g., '1 400' is 1400). Output a JSON object with two keys: 'meals' and 'total'. The 'meals' key should be an array of objects, each containing 'name', 'amount', and 'price' keys. Include the final total price under the 'total' key.  Respond in valid JSON format.";

    console.log("Preparing image data...");
    const imageParts = [fileToGenerativePart(imageFilePath, "image/jpeg")];

    console.log("Sending request to Gemini API...");
    const result = await model.generateContent([prompt, ...imageParts]);
    const response = result.response;

    if (!response || !response.text) {
      console.error("ERROR: Failed to get text response from API.");
      const blockReason = response?.promptFeedback?.blockReason;
      const safetyRatings = response?.candidates?.[0]?.safetyRatings;
      if (blockReason) console.error(`Reason: ${blockReason}`);
      if (safetyRatings)
        console.error(
          `Safety Ratings: ${JSON.stringify(safetyRatings, null, 2)}`
        );
      return;
    }

    try {
      const jsonData = JSON.parse(response.text());

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
      console.error("Raw response text:", response.text()); // Print the raw response for debugging.
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
