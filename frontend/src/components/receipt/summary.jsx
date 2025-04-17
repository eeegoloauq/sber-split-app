import React from 'react';
import styles from './summary.module.css';
const Summary = ({totalAmount, amount, serviceFee, discount, tips}) => {
    return (
        
        // Примерная структура (не меняя ваш файл)
<div className={styles.summaryContainer}>
    <div className={styles.summaryHeader}>
        {/* Каждый пункт в своем контейнере */}
        <div className={styles.summaryRow}>
            <h3 className={styles.summaryLabel}>Сумма:</h3>
            <span className={styles.summaryValue}>{amount} ₽</span>
        </div>
        
        <div className={styles.summaryRow}>
            <h3 className={styles.summaryLabel}>Сервисный сбор:</h3>
            <span className={styles.summaryValue}>{serviceFee} ₽</span>
        </div>
        
        <div className={styles.summaryRow}>
            <h3 className={styles.summaryLabel}>Скидка:</h3>
            <span className={styles.summaryDiscount}>-{discount} ₽</span>
        </div>
        
        <div className={`${styles.summaryRow} ${styles.withBottomBorder}`}>
            <h3 className={styles.summaryLabel}>Чаевые:</h3>
            <span className={styles.summaryValue}>{tips} ₽</span>
        </div>
        
        <div className={styles.summaryRow}>
            <h2 className={styles.summaryTitle}>Итого:</h2>
            <span className={styles.summaryAmount}>{totalAmount} ₽</span>
        </div>
    </div>
    <button className={styles.summaryButton}>Разделить и оплатить</button>
    </div>
    );
};

export default Summary;