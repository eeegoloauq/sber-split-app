import React from 'react';
import styles from './header.module.css'
function Header() {
    return (
        <header className={styles.header}>
            <div className={styles.headerContainer}>
                <a href = "/" className={styles.headerBrandLink}>СберСплит</a>
                <a href = "/receipt/1" className={styles.headerBrandLink}>ЧекСплит</a>
            </div>
        </header>
    )
}
export default Header;