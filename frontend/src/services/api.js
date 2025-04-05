// frontend/src/services/api.js

// URL вашего Flask бэкенда
// Убедитесь, что он доступен с того места, где вы запускаете фронтенд
// Если фронтенд и бэкенд на одной машине, localhost:5000 обычно работает.
const API_BASE_URL = 'http://localhost:5000';

/**
 * Отправляет файл чека на бэкенд для обработки.
 * @param {FormData} formData - Объект FormData, содержащий файл под ключом 'file'.
 * @returns {Promise<object>} - Promise, который разрешается с ответом от бэкенда в формате JSON.
 * @throws {Error} - Выбрасывает ошибку, если запрос неудачный или ответ не JSON.
 */
export const sendReceiptToBackend = async (formData) => {
  console.log("Отправка данных на:", `${API_BASE_URL}/upload`);
  try {
    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      body: formData,
      // Важно: Не устанавливайте заголовок 'Content-Type': 'multipart/form-data' вручную!
      // Браузер сделает это сам, включая правильный boundary.
    });

    if (!response.ok) {
      // Попытаемся прочитать тело ошибки, если оно есть
      let errorBody = null;
      try {
        errorBody = await response.json();
      } catch (jsonError) {
        // Ошибка при чтении JSON, используем текстовый статус
        console.error("Ошибка при чтении JSON из ответа об ошибке:", jsonError);
      }
      const errorMessage = errorBody?.error || `Ошибка сервера: ${response.status} ${response.statusText}`;
      console.error("Ошибка ответа сервера:", response.status, errorMessage, errorBody);
      throw new Error(errorMessage);
    }

    // Если ответ успешен, парсим JSON
    const data = await response.json();
    console.log("Ответ от бэкенда:", data);
    return data;

  } catch (error) {
    console.error("Сетевая ошибка или ошибка при отправке:", error);
    // Перевыбрасываем ошибку, чтобы ее можно было поймать в компоненте
    throw new Error(error.message || 'Не удалось связаться с сервером');
  }
}; 