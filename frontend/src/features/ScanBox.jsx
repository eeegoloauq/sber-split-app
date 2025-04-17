// frontend/src/features/ScanBox.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ScanButton from '../components/MainButtons/Scan.jsx';
import useFileInput from '../hooks/useFileInput.jsx';
// Импортируем функцию для отправки на бэкенд
import { sendReceiptToBackend } from '../services/api'; 
import styles from './scanbox.module.css';
// Импортируем компонент для кадрирования изображения
import ImageCropper from '../components/ImageCropper';

// Убраны комментарии и компонент CameraPreview

function ScanBox() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [resultMessage, setResultMessage] = useState('');
  const [showCropper, setShowCropper] = useState(false);
  const [selectedImageForCrop, setSelectedImageForCrop] = useState(null);
  const navigate = useNavigate();

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
      
      // Если у нас есть объект receiptData с элементами, переходим на страницу чека
      if (backendResponse?.receiptData?.items) {
        // Переходим на страницу чека с ID чека
        navigate(`/receipt/${backendResponse.id}`);
      } else {
        // Отображаем сообщение об успехе (можно добавить больше деталей из backendResponse)
        setResultMessage(`Чек успешно обработан! ID: ${backendResponse?.id || 'N/A'}`); 
      }

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

  // --- Обработчики для кропа изображения ---
  const handleCropComplete = (croppedImage) => {
    console.log("Изображение обрезано:", croppedImage);
    setShowCropper(false);
    setSelectedImageForCrop(null);
    // Отправляем обрезанное изображение на бэкенд
    handleSendImage(croppedImage, 'кроп-галерея');
  };

  const handleCropCancel = () => {
    console.log("Кадрирование отменено");
    setShowCropper(false);
    setSelectedImageForCrop(null);
    setError(null);
    setResultMessage('');
  };

  // --- Эффекты --- 

  // Эффект для обработки выбранного файла
  useEffect(() => {
    console.log("ScanBox useEffect: selectedFile изменился", selectedFile);
    if (selectedFile) {
      // Вместо отправки показываем интерфейс для кадрирования
      setSelectedImageForCrop(selectedFile);
      setShowCropper(true);
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
  if (showCropper && selectedImageForCrop) {
    // If cropping, render ONLY the cropper
    return (
      <ImageCropper 
        image={selectedImageForCrop}
        onCropComplete={handleCropComplete}
        onCancel={handleCropCancel}
      />
    );
  }

  // Otherwise, render the original ScanBox content
  return (
    <div className={styles.scanBox}> 
      {isLoading && <p className={styles.statusMessage}>{resultMessage || 'Загрузка...'}</p>} 
      {!isLoading && error && <p className={`${styles.statusMessage} ${styles.errorMessage}`}>{error}</p>} 
      {!isLoading && !error && resultMessage && <p className={`${styles.statusMessage} ${styles.successMessage}`}>{resultMessage}</p>} 
      <div className={styles.Welcome}>Добро пожаловать</div>
      <div className={styles.WelcomeText}>Отсканируйте чек, чтобы разделить его между друзьями</div>
      
      <ScanButton onClick={handleSelectFileClick} disabled={isLoading} /> 
      <p className={styles.sberPrimeText}>
        А с подпиской СберПрайм — кэшбек 5% бонусами за оплату!
      </p>
    </div>
  );
}

export default ScanBox;