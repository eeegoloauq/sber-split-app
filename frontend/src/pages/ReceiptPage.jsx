import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import styles from './ReceiptPage.module.css';
import LeftCol from '../features/LeftCol.jsx';
import RightCol from '../features/RightCol.jsx';
import { getReceiptById } from '../services/api';

function ReceiptPage() {
    const { receiptId } = useParams();
    console.log("Rendering receipt page for ID:", receiptId);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [receiptData, setReceiptData] = useState(null);
    const [items, setItems] = useState([]);
    const [totalAmount, setTotalAmount] = useState(0);

    const [participants, setParticipants] = useState([
        { id: 1, name: 'Anna', amount: 0 },
        { id: 2, name: 'Ivan', amount: 0 },
        { id: 3, name: 'Maria', amount: 0 }
    ]);

    const [itemAssignments, setItemAssignments] = useState({});

    // Fetch receipt data when component mounts or receiptId changes
    useEffect(() => {
        async function fetchReceiptData() {
            if (!receiptId) return;
            
            setLoading(true);
            setError(null);
            
            try {
                const data = await getReceiptById(receiptId);
                console.log("Received receipt data:", data);
                setReceiptData(data);
                
                // Format items for our component
                if (data.items && Array.isArray(data.items)) {
                    const formattedItems = data.items.map((item, index) => ({
                        id: index + 1,
                        name: item.name,
                        price: item.total_item_price,
                        quantity: item.quantity || 1
                    }));
                    setItems(formattedItems);
                    setTotalAmount(data.grand_total || 0);
                }
            } catch (err) {
                console.error("Error fetching receipt:", err);
                setError(err.message || "Failed to load receipt data");
            } finally {
                setLoading(false);
            }
        }
        
        fetchReceiptData();
    }, [receiptId]);

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

    if (loading) {
        return (
            <div className={styles.receiptContainer}>
                <div className={styles.loadingState}>Loading receipt data...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.receiptContainer}>
                <div className={styles.errorState}>
                    <h2>Error loading receipt</h2>
                    <p>{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.receiptContainer}>
            <div className={styles.receiptHeader}>
                <h1>Receipt #{receiptId}</h1>
                <div className={styles.receiptTotal}>
                    
                </div>
            </div>

            <div className={styles.columnsContainer}>
                <div className={styles.participantsColumn}> 
                    <h2>Participants</h2>
                    <LeftCol 
                        totalAmount={totalAmount} 
                        participants={participants} 
                        onAddParticipant={handleAddParticipant} 
                    />
                </div>

                <div className={styles.itemsColumn}> 
                    <h2>Receipt Items</h2>
                    <RightCol 
                        items={items} 
                        participants={participants} 
                        onSelectPayer={handleSelectPayer}
                    />
                </div>
            </div>
        </div>
    );
}

export default ReceiptPage;
