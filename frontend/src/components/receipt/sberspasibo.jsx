import React, { useState, useEffect } from 'react';
import styles from './sberspasibo.module.css';

const Sberspasibo = ({ min = 0, available = 1000, onChange }) => {
    const [selectedAmount, setSelectedAmount] = useState(min);

    const handleSliderChange = (event) => {
        const newValue = Number(event.target.value);
        setSelectedAmount(newValue);
        
        // Вызываем onChange при изменении значения
        if (onChange) {
            onChange(newValue);
        }
    };
    
    // При первом рендере передаем начальное значение в родительский компонент
    useEffect(() => {
        if (onChange) {
            onChange(selectedAmount);
        }
    }, []);

    const percentage = available > min ? ((selectedAmount - min) / (available - min)) * 100 : 0;

    return (
        <div className={styles.sberspasiboContainer}>
            <div className={styles.sberspasiboHeader}>СберСпасибо</div>
            <div className={styles.sberspasiboAvailable}>
                Доступно: {available} бонусов
            </div>

            <div className={styles.sliderContainer}>
                <input 
                    type="range"
                    min={min} 
                    max={available}
                    value={selectedAmount}
                    onChange={handleSliderChange}
                    className={styles.sberSpasiboSlider}
                    style={{ '--slider-percentage': `${percentage}%` }}
                />
                <div className={styles.selectedValue}>
                    Списать: {selectedAmount} ₽
                </div>
            </div>
        </div>
    );
};

export default Sberspasibo;