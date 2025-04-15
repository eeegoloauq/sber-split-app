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
    // Состояние для хранения выбранных участников для этого товара
    const [selectedPayers, setSelectedPayers] = useState([]);
    
    if (!item) {
        return null;
    }

    // Функция для выбора/отмены выбора участника
    const togglePayer = (participant) => {
        const participantId = participant.id;
        let newSelectedPayers;
        
        if (selectedPayers.includes(participantId)) {
            // Если уже выбран - убираем
            newSelectedPayers = selectedPayers.filter(id => id !== participantId);
        } else {
            // Если не выбран - добавляем
            newSelectedPayers = [...selectedPayers, participantId];
        }
        
        setSelectedPayers(newSelectedPayers);
        
        // Рассчитываем сумму на человека (равномерно между всеми выбранными)
        const amountPerPerson = newSelectedPayers.length > 0 
            ? item.price / newSelectedPayers.length 
            : 0;
            
        // Вызываем родительскую функцию для обновления сумм
        onSelectPayer(item.id, newSelectedPayers, amountPerPerson);
    };

    return (
        <div className={styles.positionItem}> 
            <div className={styles.itemHeader}> 
                <h2>{item.name}</h2>
                <div className={styles.price}>{item.price} ₽</div> 
            </div>
            <div className={styles.whoPays}> 
                <div className={styles.whoPaysFlex}>
                    <span className={styles.whoPaysLabel}>Кто платит:</span>
                    
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
            </div>
        </div>  
    );
};

export default PositionItem; 