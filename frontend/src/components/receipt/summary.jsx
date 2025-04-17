import React from 'react';
import styles from './summary.module.css';
const Summary = ({totalAmount}) => {
    return (
        
        <div className={styles.summaryContainer}>
            <div className={styles.summaryHeader}>
                <h3 className={styles.summarySubtitle}>Сумма: </h3>
                <h3 className={styles.summaryService}>Сервисный сбор:</h3>
                <h3 className={styles.summaryReduction}>Скидка:</h3>
                <h3 className={styles.summaryTips}>Чаевые:</h3>
                <h2 className={styles.summaryTitle}>Итого: </h2>
                <div className={styles.summaryAmount}>{totalAmount} ₽</div>
            </div>
            <button className={styles.summaryButton}>Разделить и оплатить</button>
        </div>
    );
};

export default Summary;