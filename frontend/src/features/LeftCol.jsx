import React from 'react';
import Participants from '../components/receipt/participants.jsx';
import Summary from '../components/receipt/summary.jsx';
import Sberspasibo from '../components/receipt/sberspasibo.jsx';
// import { sendReceiptToBackend } from '../services/api'; 
import styles from './LeftCol.module.css';

const LeftCol = ({
    totalAmount, 
    participants, 
    onAddParticipant, 
    serviceFee, 
    discount, 
    tips, 
    amount, 
    available, 
    selectedBonus, 
    setSelectedBonus
}) => {
    return (
        <div className={styles.leftColContainer}>
            <Participants participants={participants} onAddParticipant={onAddParticipant} />
            <Sberspasibo 
                available={available} 
                min={0} 
                onChange={setSelectedBonus} 
            />
            <Summary 
                totalAmount={totalAmount} 
                serviceFee={serviceFee} 
                discount={discount} 
                tips={tips} 
                amount={amount} 
                available={selectedBonus} 
            />
        </div>
    );
};

export default LeftCol;