    // frontend/src/pages/HomePage.jsx
    import React from 'react';
    import styles from './homePage.module.css'
    import ScanBox from '../features/ScanBox';
    function HomePage() {
      return (
        <div>
          <div className={styles.Welcome}>Добро пожаловать</div>
          <div className={styles.WelcomeText}>Отсканируйте чек, чтобы разделить его между друзьями</div>
          <ScanBox />
        </div>
      );
    }

    export default HomePage;