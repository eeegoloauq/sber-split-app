import React, { useState, useEffect } from 'react';
import Participants from '../components/receipt/participants.jsx';
import Summary from '../components/receipt/summary.jsx';
// import { sendReceiptToBackend } from '../services/api'; 
import styles from './LeftCol.module.css';

const LeftCol = () => {
    return (
        <div className={styles.leftColContainer}>
            <Participants />
            <Summary />
        </div>
    );
};

export default LeftCol;