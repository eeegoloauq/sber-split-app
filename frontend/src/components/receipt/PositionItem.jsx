import React, { useState } from 'react';
import styles from './positionItem.module.css'; 


const AVATAR_COLORS = [
  '#EC4899', // Pink
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#14B8A6', // Teal
  '#F59E0B', // Amber
  '#10B981', // Emerald
  '#F43F5E', // Rose
  '#6366F1', // Indigo
  '#06B6D4', // Cyan
  '#F97316'  // Orange
];

const PositionItem = ({ item, participants = [], onSelectPayer = () => {} }) => { 
    // State to store selected participants for this item
    const [selectedPayers, setSelectedPayers] = useState([]);
    
    if (!item) {
        return null;
    }

    // Function to select/deselect a participant
    const togglePayer = (participant) => {
        const participantId = participant.id;
        let newSelectedPayers;
        
        if (selectedPayers.includes(participantId)) {
            // If already selected - remove
            newSelectedPayers = selectedPayers.filter(id => id !== participantId);
        } else {
            // If not selected - add
            newSelectedPayers = [...selectedPayers, participantId];
        }
        
        setSelectedPayers(newSelectedPayers);
        
        // Calculate amount per person (evenly between all selected)
        const amountPerPerson = newSelectedPayers.length > 0 
            ? item.price / newSelectedPayers.length 
            : 0;
            
        // Call parent function to update amounts
        onSelectPayer(item.id, newSelectedPayers, amountPerPerson);
    };

    // Format price with currency
    const formatPrice = (price) => {
        return `${price.toFixed(2)} ₽`;
    };

    return (
        <div className={styles.positionItem}> 
            <div className={styles.itemHeader}> 
                <div className={styles.itemInfo}>
                    <h2>{item.name}</h2>
                    {item.quantity && item.quantity !== 1 && (
                        <div className={styles.quantity}>x{item.quantity}</div>
                    )}
                </div>
                <div className={styles.price}>{formatPrice(item.price)}</div> 
            </div>
            <div className={styles.whoPays}> 
                <div className={styles.whoPaysFlex}>
                    <span className={styles.whoPaysLabel}>Who pays:</span>
                    
                    <div className={styles.payerAvatars}>
                        {participants.map((participant, index) => {
                            const isSelected = selectedPayers.includes(participant.id);
                            return (
                                <div 
                                    key={participant.id}
                                    className={`${styles.payerAvatar} ${isSelected ? styles.selected : ''}`}
                                    style={{ 
                                        backgroundColor: isSelected ? AVATAR_COLORS[index % AVATAR_COLORS.length] : '#f1f5f9',
                                        color: isSelected ? 'white' : '#64748b'
                                    }}
                                    onClick={() => togglePayer(participant)}
                                >
                                    {isSelected ? '✓' : participant.name.charAt(0)}
                                </div>
                            );
                        })}
                    </div>
                </div>
                
                {selectedPayers.length > 0 && (
                    <div className={styles.splitInfo}>
                        {formatPrice(item.price / selectedPayers.length)} per person
                    </div>
                )}
            </div>
        </div>  
    );
};

export default PositionItem; 