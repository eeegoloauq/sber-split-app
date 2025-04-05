import React from 'react';
import styles from './header.module.css'
function Header() {
    return (
        <header className={styles.header}>
            <a href = "/" className={styles.headerBrandLink}>СберСплит</a>
        </header>
    )
}
export default Header;