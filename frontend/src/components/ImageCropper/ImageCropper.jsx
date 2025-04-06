import React, { useState, useRef } from 'react';
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import styles from './imageCropper.module.css';

function ImageCropper({ image, onCropComplete, onCancel }) {
  const [crop, setCrop] = useState({
    unit: '%',
    width: 80,
    height: 80,
    x: 10,
    y: 10
  });
  const [completedCrop, setCompletedCrop] = useState(null);
  const imgRef = useRef(null);

  // Function to get the cropped image as a blob
  const getCroppedImg = () => {
    if (!completedCrop || !imgRef.current) return null;

    const canvas = document.createElement('canvas');
    const scaleX = imgRef.current.naturalWidth / imgRef.current.width;
    const scaleY = imgRef.current.naturalHeight / imgRef.current.height;
    const pixelRatio = window.devicePixelRatio;
    
    canvas.width = completedCrop.width * scaleX * pixelRatio;
    canvas.height = completedCrop.height * scaleY * pixelRatio;
    
    const ctx = canvas.getContext('2d');
    ctx.scale(pixelRatio, pixelRatio);
    ctx.imageSmoothingQuality = 'high';
    
    ctx.drawImage(
      imgRef.current,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY
    );
    
    // Convert canvas to blob
    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          // Create a new file from the blob with the original filename
          const file = new File([blob], image.name, {
            type: 'image/jpeg',
            lastModified: new Date().getTime()
          });
          resolve(file);
        }, 
        'image/jpeg', 
        0.95
      );
    });
  };

  // Handle confirm button click
  const handleConfirm = async () => {
    if (!completedCrop) return;
    
    try {
      const croppedImage = await getCroppedImg();
      if (croppedImage) {
        onCropComplete(croppedImage);
      }
    } catch (e) {
      console.error('Error creating cropped image:', e);
    }
  };

  return (
    <div className={styles.cropperContainer}>
      <h3 className={styles.cropperTitle}>Выделите область чека</h3>
      <div className={styles.cropperImageContainer}>
        <ReactCrop
          crop={crop}
          onChange={(c) => setCrop(c)}
          onComplete={(c) => setCompletedCrop(c)}
          aspect={undefined}
        >
          <img 
            ref={imgRef}
            src={URL.createObjectURL(image)} 
            alt="Изображение для кадрирования"
            className={styles.cropperImage}
          />
        </ReactCrop>
      </div>
      <div className={styles.cropperActions}>
        <button 
          className={styles.cropperCancel}
          onClick={onCancel}
        >
          Отмена
        </button>
        <button 
          className={styles.cropperConfirm}
          onClick={handleConfirm}
          disabled={!completedCrop?.width || !completedCrop?.height}
        >
          Подтвердить
        </button>
      </div>
    </div>
  );
}

export default ImageCropper; 