import React, { useState } from 'react';
import styles from './ReceiptPage.module.css';
import LeftCol from '../features/LeftCol.jsx';
import RightCol from '../features/RightCol.jsx';

const testItems = [
    { id: 1, name: 'Кофе Латте', price: 340.00 },
    { id: 2, name: 'Круассан с миндалем', price: 120.50 },
    { id: 3, name: 'Салат Цезарь', price: 350.00 },
    { id: 4, name: 'Чизкейк', price: 210.00 },
    { id: 5, name: 'Чизкейк', price: 210.00 },
    { id: 6, name: 'Чизкейк', price: 210.00 },
    { id: 7, name: 'Чизкейк', price: 210.00 },
    { id: 8, name: 'Чизкейк', price: 210.00 },
    { id: 9, name: 'Чизкейк', price: 210.00 },
    
  ];
  
const totalAmount = testItems.reduce((sum, item) => sum + item.price, 0);

function ReceiptPage() {
    const receiptId = 'test-12345'; 
    console.log("Рендер страницы чека для ID:", receiptId);

    const [participants, setParticipants] = useState([
        { id: 1, name: 'Анна', amount: 0 },
        { id: 2, name: 'Иван', amount: 0 },
        { id: 3, name: 'Мария', amount: 0 }
    ]);

    const [itemAssignments, setItemAssignments] = useState({});


    const handleSelectPayer = (itemId, selectedPayerIds, amountPerPerson) => {

        const updatedParticipants = [...participants];
        

        const prevAssignment = itemAssignments[itemId] || { payerIds: [], amountPerPerson: 0 };

        if (prevAssignment.payerIds.length > 0) {
            prevAssignment.payerIds.forEach(payerId => {
                const participant = updatedParticipants.find(p => p.id === payerId);
                if (participant) {
                    participant.amount -= prevAssignment.amountPerPerson;
                }
            });
        }

        selectedPayerIds.forEach(payerId => {
            const participant = updatedParticipants.find(p => p.id === payerId);
            if (participant) {
                participant.amount += amountPerPerson;
            }
        });
        
        setParticipants(updatedParticipants);

        setItemAssignments({
            ...itemAssignments,
            [itemId]: { payerIds: selectedPayerIds, amountPerPerson }
        });
    };

    const handleAddParticipant = (name) => {
        if (name && name.trim()) { 
            const newParticipant = {
                id: Date.now(),
                name: name.trim(),
                amount: 0
            };
            setParticipants([...participants, newParticipant]);
        }
    };

    return (
        <div className={styles.receiptContainer}>
            {/* <h1>Детали чека #{receiptId}</h1> */}

            <div className={styles.columnsContainer}>
                
                <div className={styles.participantsColumn}> 
                    <h2>Участники</h2>
                    <LeftCol 
                        totalAmount={totalAmount} 
                        participants={participants} 
                        onAddParticipant={handleAddParticipant} 
                    />
                </div>

                <div className={styles.itemsColumn}> 
                    <h2>Позиции чека</h2>
                        
                    <RightCol 
                        items={testItems} 
                        participants={participants} 
                        onSelectPayer={handleSelectPayer}
                    />
                </div>

            </div>
        </div>
    );
}

export default ReceiptPage;
