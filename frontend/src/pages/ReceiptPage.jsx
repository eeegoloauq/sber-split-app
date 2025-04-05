import React from 'react';
import styles from './ReceiptPage.module.css';
import LeftCol from '../features/LeftCol.jsx';
import RightCol from '../features/RightCol.jsx';

function ReceiptPage() {
    const receiptId = 'test-123'; 
    console.log("Рендер страницы чека для ID:", receiptId);

    return (
        <div className={styles.receiptContainer}>
            {/* <h1>Детали чека #{receiptId}</h1> */}

            <div className={styles.columnsContainer}>
                
                <div className={styles.participantsColumn}> 
                    <h2>Участники</h2>
                    <LeftCol />
                </div>

                <div className={styles.itemsColumn}> 
                    <h2>Позиции чека</h2>
                        
                    <RightCol />
                </div>

            </div>
        </div>
    );
}

export default ReceiptPage;
