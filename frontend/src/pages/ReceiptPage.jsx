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
    const [serviceFee, setServiceFee] = useState(0);
    const [discount, setDiscount] = useState(0);
    const [tips, setTips] = useState(0);
    const [amount, setAmount] = useState(0);
    const [participants, setParticipants] = useState([
        { id: 1, name: 'Anna', amount: 0 },
        { id: 2, name: 'Ivan', amount: 0 },
        { id: 3, name: 'Maria', amount: 0 }
    ]);

    const [itemAssignments, setItemAssignments] = useState({});
    const [sberBonusAmount, setSberBonusAmount] = useState(0);

    // Verify the total sum calculation
    const verifyTotal = (data) => {
        if (!data || !data.items || !Array.isArray(data.items)) {
            console.warn("Cannot verify total: Invalid data format");
            return;
        }

        let calculatedTotal = 0;
        data.items.forEach((item) => {
            if (item.total_item_price != null && typeof item.total_item_price === 'number') {
                calculatedTotal += item.total_item_price;
            } else {
                console.warn(`Invalid price for item '${item.name}', skipping in total calculation`);
            }
        });

        calculatedTotal = parseFloat(calculatedTotal.toFixed(2));
        const grandTotal = data.grand_total ? parseFloat(data.grand_total.toFixed(2)) : 0;

        console.log(`\n--- Receipt Total Verification ---`);
        console.log(`Calculated sum of all items: ${calculatedTotal.toFixed(2)} ₽`);
        console.log(`Grand total from receipt: ${grandTotal.toFixed(2)} ₽`);
        console.log(`Difference: ${(grandTotal - calculatedTotal).toFixed(2)} ₽`);
        console.log(`----------------------------------\n`);
    };

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
                    setServiceFee(data.service_fee || 0);
                    setDiscount(data.discount || 0);
                    setTips(data.tips || 0);
                    setAmount(data.amount || 0);
                    // Verify and log the total calculation
                    verifyTotal(data);
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
                <h1>Чек #{receiptId}</h1>
                <div className={styles.receiptTotal}>
                    {/* Total amount removed from UI as requested */}
                </div>
            </div>

            <div className={styles.columnsContainer}>
                <div className={styles.participantsColumn}> 
                    <h2>Участники</h2>
                    <LeftCol 
                        totalAmount={totalAmount} 
                        serviceFee={serviceFee}
                        discount={discount}
                        tips={tips}
                        amount={amount}
                        participants={participants} 
                        onAddParticipant={handleAddParticipant} 
                        available={1000}
                        selectedBonus={sberBonusAmount}
                        setSelectedBonus={setSberBonusAmount}
                    />
                </div>

                <div className={styles.itemsColumn}> 
                    <h2>Позиции</h2>
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
