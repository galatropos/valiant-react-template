import { useCallback } from 'react';

export const useSnapShotVideo = () => {
  const snapShotVideo = useCallback(async (times, src) => {
    if (!src || !Array.isArray(times) || times.length === 0) return [];

    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) return [];

    video.src = src;
    video.crossOrigin = 'anonymous';
    video.muted = true;
    video.playsInline = true;
    video.preload = 'auto';

    await new Promise((resolve, reject) => {
      const onLoadedMetadata = () => {
        cleanup();
        resolve(true);
      };

      const onError = () => {
        cleanup();
        reject(new Error('No se pudo cargar el video'));
      };

      const cleanup = () => {
        video.removeEventListener('loadedmetadata', onLoadedMetadata);
        video.removeEventListener('error', onError);
      };

      video.addEventListener('loadedmetadata', onLoadedMetadata);
      video.addEventListener('error', onError);
      video.load();
    });

    const captureFrame = (time) =>
      new Promise((resolve, reject) => {
        const onSeeked = () => {
          cleanup();

          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;

          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/png'));
        };

        const onError = () => {
          cleanup();
          reject(new Error(`No se pudo capturar el frame en ${time}ms`));
        };

        const cleanup = () => {
          video.removeEventListener('seeked', onSeeked);
          video.removeEventListener('error', onError);
        };

        video.addEventListener('seeked', onSeeked);
        video.addEventListener('error', onError);

        video.currentTime = time / 1000;
      });

    const images = [];

    for (const time of times) {
      const image = await captureFrame(time);
      images.push(image);
    }

    return images;
  }, []);

  return { snapShotVideo };
};