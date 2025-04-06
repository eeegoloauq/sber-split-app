import React from 'react';
import styles from './positionItem.module.css'; 

const PositionItem = ({ item }) => { 
    if (!item) {
        return null;
    }

    return (
        <div className={styles.positionItem}> 
            <div className={styles.itemHeader}> 
                <h2>{item.name}</h2>
                <div className={styles.price}>{item.price} ₽</div> 
            </div>
            <div className={styles.whoPays}> 
                Кто платит:
            </div>
        </div>  
    );
};

export default PositionItem; 