import React from 'react';
import styles from './summary.module.css';
const Summary = ({ totalAmount = 1000 }) => {
    return (
        
        <div className={styles.summaryContainer}>
            <div className={styles.summaryHeader}>
                <h2 className={styles.summaryTitle}>Итого: </h2>
                <div className={styles.summaryAmount}>{totalAmount} ₽</div>
            </div>
            <button className={styles.summaryButton}>Разделить и оплатить</button>
        </div>
    );
};

export default Summary;