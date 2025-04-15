import React from 'react';
import PositionItem from '../components/receipt/PositionItem.jsx'; 
import styles from './RightCol.module.css';

const RightCol = ({ items, participants = [], onSelectPayer }) => {
    return (
        <div className={styles.rightColContainer}> 
            {items.map((item) => (
                <PositionItem 
                    key={item.id} 
                    item={item} 
                    participants={participants}
                    onSelectPayer={onSelectPayer}
                /> 
            ))}
        </div>
    );
};

export default RightCol;