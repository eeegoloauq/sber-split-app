import React, { useState } from 'react';
import styles from './participants.module.css';

// Массив цветов для аватарок
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

const Participants = ({ participants = [], onAddParticipant = () => {} }) => {

    const [showAddForm, setShowAddForm] = useState(false);
    const [newName, setNewName] = useState('');

    const handleAddClick = () => {
        setShowAddForm(true);
    };

    const formatAmount = (amount) => {
        return amount.toFixed(0);
    };

    const handleAddSubmit = () => {
        onAddParticipant(newName);  
        setNewName(''); 
        setShowAddForm(false);
    };

    return (
        <div className={styles.participantsContainer}>
            {participants.map((participant, index) => (
                <div key={participant.id} className={styles.participantItem}>
                    <div 
                        className={styles.avatarCircle}
                        style={{ 
                            borderColor: AVATAR_COLORS[index % AVATAR_COLORS.length],
                            borderWidth: '2px',
                            borderStyle: 'solid'
                        }}
                    >
                        {participant.name.charAt(0)}
                    </div>
                    <div className={styles.participantInfo}>
                        <div className={styles.participantName}>
                            {participant.name}
                        </div>
                        <div className={styles.participantAmount}>
                            {formatAmount(participant.amount)} ₽
                        </div>
                    </div>
                </div>
            ))}

            {showAddForm ? (
                <div className={styles.addForm}>
                    <input
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="Имя участника"
                        className={styles.nameInput}
                        autoFocus 
                    />
                    <button className={styles.addButton} onClick={handleAddSubmit}>
                        Добавить
                    </button>
                </div>
            ) : (
                <div className={styles.addParticipantRow} onClick={handleAddClick}>
                    <div className={styles.addCircle}>+</div>
                    <div>Добавить</div>
                </div>
            )}
            <button className={styles.HalfButton}>
                Поделить пополам
            </button>
        </div>
    );
};

export default Participants;