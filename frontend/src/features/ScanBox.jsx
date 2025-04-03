// frontend/src/features/ScanBox.jsx
import React, { useState, useEffect } from 'react';
import ScanButton from '../components/MainButtons/Scan.jsx';
import useFileInput from '../hooks/useFileInput.jsx';
// import { sendReceiptToBackend } from '../services/api'; 
import styles from './scanbox.module.css';

// Убраны комментарии и компонент CameraPreview

function ScanBox() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [resultMessage, setResultMessage] = useState('');

  const { openGallery, selectedFile, fileError } = useFileInput(); 

  // --- Обработка изображения --- 
  const handleSendImage = async (imageData, source) => {
    if (!imageData) return;

    setIsLoading(true);
    setError(null);
    setResultMessage('');
    console.log(`Получено изображение из: ${source}`, imageData);

    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      const formData = new FormData();
      const fileName = imageData instanceof File ? imageData.name : 'receipt.jpg';
      formData.append('receiptImage', imageData, fileName);
      console.log("Подготовлено для отправки (FormData):", formData.get('receiptImage'));
      setResultMessage(`Изображение из '${source}' (${fileName}) готово к отправке.`);
    } catch (err) {
      console.error("Ошибка при обработке/отправке:", err);
      setError("Произошла ошибка при обработке изображения.");
    } finally {
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
      handleSendImage(selectedFile, 'галерея');
    }
  }, [selectedFile]);

  // Эффект для обработки ошибки
  useEffect(() => {
    if (fileError) {
      console.error("Ошибка из useFileInput:", fileError);
      setError(fileError);
    }
  }, [fileError]);

  // --- Рендер компонента --- 
  return (
      <div className={styles.scanBox}> 
        {isLoading && <p className={styles.statusMessage}>Обработка...</p>} 
        {!isLoading && error && <p className={`${styles.statusMessage} ${styles.errorMessage}`}>{error}</p>} 
        {!isLoading && resultMessage && <p className={`${styles.statusMessage} ${styles.successMessage}`}>{resultMessage}</p>} 
        <ScanButton onClick={handleSelectFileClick} disabled={isLoading} /> 
      </div>
  );
}

export default ScanBox;