const fs = require("fs");
const path = require("path");
const https = require("https");

// Конфигурация приложения
const modelName = "gemini-2.0-flash";
const imageFilePath = "../checks/all (10).jpg";
const outputJsonFile = "output.json";
const NETLIFY_FUNCTION_URL = "https://magenta-tartufo-d2e30a.netlify.app/.netlify/functions/gemini-proxy";

// Преобразование файла изображения в base64
function fileToBase64(filePath) {
  const absolutePath = path.resolve(__dirname, filePath);
  console.log(`Чтение файла изображения: ${absolutePath}`);
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Файл изображения не найден: ${absolutePath}`);
  }
  return Buffer.from(fs.readFileSync(absolutePath)).toString("base64");
}

// Функция для HTTP запросов
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
            console.error("Ошибка API:", responseData);
            reject(new Error(`Ошибка запроса: ${res.statusCode}: ${JSON.stringify(parsedData)}`));
          }
        } catch (error) {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ rawText: responseData });
          } else {
            console.error("Необработанный ответ при ошибке:", responseData);
            reject(new Error(`Ошибка запроса: ${res.statusCode}. Ответ: ${responseData}`));
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

// Проверка суммы позиций и общей суммы
function verifyTotalSum(jsonData) {
  if (!jsonData || !jsonData.items || !Array.isArray(jsonData.items) || typeof jsonData.grand_total !== 'number') {
    console.warn("В данных JSON отсутствует массив 'items' или число 'grand_total' для проверки.");
    return;
  }

  let calculatedTotal = 0;
  jsonData.items.forEach((item) => {
    if (item.total_item_price != null && typeof item.total_item_price === 'number' && !isNaN(item.total_item_price)) {
      calculatedTotal += item.total_item_price;
    } else {
      console.warn(`Некорректная или отсутствующая цена ('${item.total_item_price}') для товара '${item.name}', пропускаем при проверке.`);
    }
  });

  calculatedTotal = parseFloat(calculatedTotal.toFixed(2));
  const grandTotal = parseFloat(jsonData.grand_total.toFixed(2));

  console.log(`\n--- Проверка итоговой суммы ---`);
  console.log(`Рассчитанная сумма по позициям: ${calculatedTotal.toFixed(2)}`);
  console.log(`Общая сумма из чека:            ${grandTotal.toFixed(2)}`);

  const tolerance = 0.01; // Допустимая погрешность
  if (Math.abs(calculatedTotal - grandTotal) <= tolerance) {
    console.log("Проверка успешна: рассчитанная сумма совпадает с общей суммой чека.");
  } else {
    console.error(`Проверка НЕ ПРОЙДЕНА: рассчитанная сумма (${calculatedTotal.toFixed(2)}) не совпадает с общей суммой (${grandTotal.toFixed(2)}). Разница: ${(calculatedTotal - grandTotal).toFixed(2)}`);
  }
  console.log(`---------------------------\n`);
}

// Главная функция
async function run() {
  try {
    console.log(`Используется модель: ${modelName}`);
    console.log(`Файл изображения: ${imageFilePath}`);

    const prompt = `
**Task:** Analyze the provided image of a Russian restaurant/cafe receipt. Extract a structured list of purchased items (name, quantity, total price per item line) and the final grand total amount.

**Core Instructions:**

1.  **Target Area:** Focus *exclusively* on the section listing purchased items and their final costs, plus the overall total payable amount. Critically, ignore:
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

4.  **Accuracy & Association:** Meticulously link the correct "name", "quantity", and "total_item_price" for *each horizontal line* representing a purchased item. Receipt formatting can be inconsistent; prioritize horizontal data association for each logical entry.

5.  **Output Format:** Generate **ONLY** a single, valid JSON object. Do **NOT** include any text before or after the JSON object. Do **NOT** wrap the JSON in markdown backticks (\`\`\`). The JSON object must strictly adhere to this structure:

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
  "grand_total": NUMBER
}
\`\`\`

**Example Interpretation:**
*   Receipt line: \`Пшеничное Н/Ф светлое 0.5л 3х0.5л 900\` (assuming 300 was unit price, now ignored) -> JSON item: \`{ "name": "Пшеничное Н/Ф светлое 0.5л", "quantity": 3, "total_item_price": 900.00 }\`
*   Receipt line: \`Фирменный бургер Папа Бейде 1 540.00\` -> JSON item: \`{ "name": "Фирменный бургер Папа Бейде", "quantity": 1, "total_item_price": 540.00 }\`
*   Receipt line: \`Картофель Фри 700.00\` (no quantity shown) -> JSON item: \`{ "name": "Картофель Фри", "quantity": 1, "total_item_price": 700.00 }\`

**Input:** An image of the receipt.
**Output:** The valid JSON object ONLY.
`;

    console.log("Подготовка данных изображения...");
    const imageBase64 = fileToBase64(imageFilePath);

    // Данные для отправки через Netlify Function
    const requestData = {
      // API ключ теперь в переменных окружения Netlify!
      modelName: modelName,
      contents: [
        {
          parts: [
            { text: prompt },
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
        topP: 0.95,
        maxOutputTokens: 4096,
      }
    };

    console.log("Отправка запроса к Gemini API через Netlify Function...");
    console.log(`URL запроса: ${NETLIFY_FUNCTION_URL}`);
    
    const result = await makeRequest(NETLIFY_FUNCTION_URL, requestData);

    // Обработка ответа
    let responseText;
    if (result && result.rawText) {
        responseText = result.rawText;
    } else if (result && result.candidates && result.candidates[0]?.content?.parts?.[0]?.text) {
        responseText = result.candidates[0].content.parts[0].text;
    } else {
        console.error("ОШИБКА: Не удалось получить текстовый ответ от API.");
        console.error("Детали ответа:", JSON.stringify(result, null, 2));
        return;
    }

    // Очистка текста от markdown-разметки
    let cleanedText = responseText.trim();
    const jsonRegex = /^```json\s*([\s\S]*?)\s*```$/;
    const match = cleanedText.match(jsonRegex);
    if (match && match[1]) {
        cleanedText = match[1].trim();
        console.log("Удалены markdown-ограничители из ответа.");
    } else {
        console.log("Markdown-ограничители не обнаружены, используется исходный текст ответа.");
    }

    try {
      // Разбор JSON
      const jsonData = JSON.parse(cleanedText);

      console.log("\n--- Сгенерированные данные JSON ---");
      console.log(JSON.stringify(jsonData, null, 2));
      console.log("--------------------------------\n");

      console.log(`Запись данных в файл ${outputJsonFile}...`);
      fs.writeFileSync(
        outputJsonFile,
        JSON.stringify(jsonData, null, 2),
        "utf8"
      );
      console.log(`Файл JSON успешно создан: ${outputJsonFile}`);

      // Проверка суммы
      verifyTotalSum(jsonData);

    } catch (jsonError) {
      console.error("Ошибка при разборе JSON:", jsonError.message);
      console.error("Текст ответа, который не удалось разобрать:", cleanedText);
      console.error("Исходный текст ответа от API:", responseText);
    }
  } catch (error) {
    console.error("Произошла ошибка:", error.message);
  }
}

run();
