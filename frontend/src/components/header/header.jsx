import React from 'react';
import styles from './header.module.css'

function Header() {
    return (
        <header className={styles.header}>
            <div className={styles.headerContainer}>
                <a href = "/" className={styles.headerBrandLink}>СберСплит</a>

                <nav className={styles.navLinks}>
                    <a href="/" className={styles.navLink}>Главная</a>
                    {/* <a href="/history" className={styles.navLink}>История</a> */}
                    <a href="/receipt/1" className={styles.navLink}>ЧекСплит</a>
                </nav>
            </div>
        </header>
    )
}
export default Header;