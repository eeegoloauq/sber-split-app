// frontend/src/features/ScanBox.jsx
import React, { useState, useEffect } from 'react';
import ScanButton from '../components/MainButtons/Scan.jsx';
import useFileInput from '../hooks/useFileInput.jsx';
// Импортируем функцию для отправки на бэкенд
import { sendReceiptToBackend } from '../services/api'; 
import styles from './scanbox.module.css';

// Убраны комментарии и компонент CameraPreview

function ScanBox() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [resultMessage, setResultMessage] = useState('');

  const { openGallery, selectedFile, fileError } = useFileInput(); 

  // --- Обработка и отправка изображения --- 
  const handleSendImage = async (file, source) => {
    if (!file) return;

    setIsLoading(true);
    setError(null);
    setResultMessage('');
    console.log(`Получено изображение из: ${source}`, file);

    try {
      // 1. Создаем FormData
      const formData = new FormData();
      // Добавляем файл под ключом 'file', как ожидает бэкенд
      formData.append('file', file, file.name); 
      console.log("Подготовлено FormData для отправки:", formData.get('file'));

      // 2. Вызываем функцию отправки на бэкенд
      setResultMessage("Отправка чека на сервер..."); // Сообщение об отправке
      const backendResponse = await sendReceiptToBackend(formData);

      // 3. Обрабатываем успешный ответ от бэкенда
      console.log("Успешный ответ от бэкенда:", backendResponse);
      // Отображаем сообщение об успехе (можно добавить больше деталей из backendResponse)
      setResultMessage(`Чек успешно обработан! ID: ${backendResponse?.id || 'N/A'}`); 

    } catch (err) {
      // 4. Обрабатываем ошибку (сетевую или от бэкенда)
      console.error("Ошибка при отправке/обработке чека:", err);
      // Отображаем сообщение об ошибке, полученное из api.js
      setError(err.message || "Произошла неизвестная ошибка при отправке."); 
      setResultMessage(''); // Сбрасываем сообщение об успехе/отправке
    } finally {
      // 5. В любом случае убираем статус загрузки
      setIsLoading(false);
    }
  };

  // --- Обработчик клика по кнопке --- 
  const handleSelectFileClick = () => {
    setError(null);
    setResultMessage('');
    console.log("Вызов openGallery...");
    openGallery();
  };

  // --- Эффекты --- 

  // Эффект для обработки выбранного файла
  useEffect(() => {
    console.log("ScanBox useEffect: selectedFile изменился", selectedFile);
    if (selectedFile) {
      // Вызываем новую функцию обработки и отправки
      handleSendImage(selectedFile, 'галерея'); 
    }
  }, [selectedFile]);

  // Эффект для обработки ошибки из useFileInput
  useEffect(() => {
    if (fileError) {
      console.error("Ошибка из useFileInput:", fileError);
      setError(fileError);
    }
  }, [fileError]);

  // --- Рендер компонента --- 
  return (
      <div className={styles.scanBox}> 
        {isLoading && <p className={styles.statusMessage}>{resultMessage || 'Загрузка...'}</p>} 
        {!isLoading && error && <p className={`${styles.statusMessage} ${styles.errorMessage}`}>{error}</p>} 
        {!isLoading && !error && resultMessage && <p className={`${styles.statusMessage} ${styles.successMessage}`}>{resultMessage}</p>} 
        <ScanButton onClick={handleSelectFileClick} disabled={isLoading} /> 
      </div>
  );
}

export default ScanBox;