    // frontend/src/pages/HomePage.jsx
    import React from 'react';
    import styles from './homePage.module.css'
    import ScanBox from '../features/ScanBox';

    function HomePage() {
      return (
        <div className={styles.homeContainer}>
          <div className={styles.infoText}>
            <h1>Разделяйте счета<br />легко и быстро</h1>
            <p>
              Сканируйте чеки, распределяйте позиции между друзьями и отправляйте запросы
              на оплату — всё в одном приложении.
            </p>
            <ol className={styles.stepsList}>
              <li><span>1</span> Отсканируйте чек или загрузите фото</li>
              <li><span>2</span> Распределите позиции между участниками</li>
              <li><span>3</span> Отправьте запросы на оплату</li>
            </ol>
          </div>
          <ScanBox />
        </div>
      );
    }

    export default HomePage;