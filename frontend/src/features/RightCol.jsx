import React from 'react';
// Импортируем переименованный компонент для ОДНОГО товара
import PositionItem from '../components/receipt/PositionItem.jsx'; 
import styles from './RightCol.module.css';

// Тестовый массив данных (позже будет приходить с бэка)
const testItems = [
  { id: 1, name: 'Кофе Латте', price: 150.00 },
  { id: 2, name: 'Круассан с миндалем', price: 120.50 },
  { id: 3, name: 'Салат Цезарь', price: 350.00 },
  { id: 4, name: 'Чизкейк', price: 210.00 },
];

const RightCol = () => {
    return (
        // Этот контейнер может иметь общие стили для колонки, 
        // включая рамку, тень, padding и т.д., если нужно.
        <div className={styles.rightColContainer}> 
            {/* Проходимся по массиву и рендерим PositionItem для каждого товара */}
            {testItems.map((item) => (
                // Передаем данные товара в пропс item
                // Обязательно добавляем уникальный key для элементов списка
                <PositionItem key={item.id} item={item} /> 
            ))}

            {/* Можно добавить кнопку "Добавить позицию" или что-то еще */} 
        </div>
    );
};

export default RightCol;