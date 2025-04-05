import { useState, useRef, useCallback } from 'react';

function useFileInput(accept = 'image/*') { // По умолчанию принимаем изображения
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileError, setFileError] = useState(null);

  // Создаем ref для доступа к скрытому input элементу
  const fileInputRef = useRef(null);

  // Этот обработчик обновляет состояние, когда файл выбран
  const handleFileChange = useCallback((event) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setFileError(null);
      console.log("useFileInput: Файл выбран", file); // Добавим лог
    } else {
      setSelectedFile(null);
      console.log("useFileInput: Файл НЕ выбран (диалог закрыт?)"); // Добавим лог
    }
    // Очищаем value инпута, чтобы можно было выбрать тот же файл снова
    if (event.target) {
      event.target.value = null;
    }
  }, []);

  // Эта функция просто вызывает клик по input
  const openGallery = useCallback(() => {
    setFileError(null);
    setSelectedFile(null); // Сбрасываем перед открытием
    if (fileInputRef.current) {
      console.log("useFileInput: Вызов click() на input"); // Добавим лог
      fileInputRef.current.click(); 
    }
    // Больше не возвращаем Promise
  }, []);

  // Создаем скрытый input элемент при первом рендере хука
  // Используем `document.createElement` вне рендера, чтобы избежать лишних DOM-операций
  // Лучше сделать это через JSX в компоненте, если возможно, но для инкапсуляции в хуке - так.
  // **Более современный подход:** Не создавать input здесь, а ожидать ref на input из компонента.
  // Но для простоты пока так:
  useState(() => {
    // Проверяем, не создан ли уже input (на случай HMR)
    let input = document.getElementById('hiddenFileInput');
    if (!input) {
        input = document.createElement('input');
        input.id = 'hiddenFileInput'; // Даем ID для проверки
        input.type = 'file';
        input.accept = accept;
        input.style.display = 'none';
        document.body.appendChild(input); // Добавляем в DOM
    }
    // Всегда обновляем ref и слушатель
    input.accept = accept; // Обновляем accept на случай изменения
    // Удаляем старый слушатель перед добавлением нового (на всякий случай)
    input.removeEventListener('change', handleFileChange); 
    input.addEventListener('change', handleFileChange); 
    fileInputRef.current = input;

    // Очистка при размонтировании хука
    return () => {
      // Слушатель удаляется автоматически для input в DOM?
      // Проверим удаление:
      if (input) {
        input.removeEventListener('change', handleFileChange); 
        // Не удаляем сам input из DOM, чтобы избежать проблем при HMR?
        // Или удаляем? Попробуем удалить.
        if (input.parentNode) {
             console.log("useFileInput: Удаление input из DOM");
             input.parentNode.removeChild(input);
             fileInputRef.current = null; // Сброс ref
        }
      }
    };
  }, [accept, handleFileChange]); 

  return { openGallery, selectedFile, fileError };
}

export default useFileInput;
