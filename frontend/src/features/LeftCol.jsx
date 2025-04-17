import React, { useState, useEffect } from 'react';
import Participants from '../components/receipt/participants.jsx';
import Summary from '../components/receipt/summary.jsx';
// import { sendReceiptToBackend } from '../services/api'; 
import styles from './LeftCol.module.css';

const LeftCol = ({totalAmount, participants, onAddParticipant, serviceFee, discount, tips, amount}) => {
    return (
        <div className={styles.leftColContainer}>
            <Participants participants={participants} onAddParticipant={onAddParticipant} />
            <Summary totalAmount={totalAmount} serviceFee={serviceFee} discount={discount} tips={tips} amount={amount}/>
        </div>
    );
};

export default LeftCol;