import React from 'react';
import styles from './scan.module.css';

function ScanButton(props) {
    return (
        <button className={styles.ScanButton} {...props}>
            Сканировать чек
        </button>
    );
}

export default ScanButton;