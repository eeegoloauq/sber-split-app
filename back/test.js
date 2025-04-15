const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs");

const genAI = new GoogleGenerativeAI("AIzaSyADrldInv0tdpC8F2Xcf7opHOLJy8XEmMs");

// Converts local file information to base64
function fileToGenerativePart(path, mimeType) {
  return {
    inlineData: {
      data: Buffer.from(fs.readFileSync(path)).toString("base64"),
      mimeType,
    },
  };
}

async function run() {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const prompt =
    "This is a bill from a restaurant. Your task is to find the price of  the meals, firstly analyse line by line  what is a meal in the check,if there is non meal fields than dont put them.fields like bonus shouldnt go in the check. then find the corresponding price then,create a csv with the table meal, amount, price and at the bottom the final price. DO this like your life depends on it";

  const imageParts = [
    fileToGenerativePart("../checks/all (1).jpg", "image/jpeg"),
  ];

  const generatedContent = await model.generateContent([prompt, ...imageParts]);

  console.log(generatedContent.response.text());
}

run();
