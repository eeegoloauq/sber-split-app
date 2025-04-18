import React from "react";
import styles from "./header.module.css";
import logo from "../../assets/logo.png";

function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.headerContainer}>
        <a href="/" className={styles.headerBrandLink}>
          <img src={logo} alt="СберСплит" className={styles.headerLogo} />
        </a>

        <nav className={styles.navLinks}>
          <a href="/history" className={styles.navLink}>
            История
          </a>
          <a href="/login" className={styles.navLink}>
            Войти
          </a>
        </nav>
      </div>
    </header>
  );
}
export default Header;
