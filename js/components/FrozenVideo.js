export default class FrozenVideo {
    constructor() {
        this.videos = document.querySelectorAll('.js-frozen-video');
        this.init();
    }

    init() {
        this.videos.forEach(video => {
            // Устанавливаем первый кадр как постер
            video.addEventListener('loadedmetadata', () => {
                video.currentTime = 0.1; // Ставим на первый кадр (не 0 из-за багов)
            });

            // Запуск по наведению
            video.addEventListener('mouseenter', () => {
                video.play().catch(e => {
                    // Если браузер блокирует автовоспроизведение
                    console.log('Автовоспроизведение заблокировано');
                });
            });

            // Пауза при уходе мыши
            video.addEventListener('mouseleave', () => {
                video.pause();
            });

            // Для мобилок: запуск по тапу
            video.addEventListener('touchstart', (e) => {
                e.preventDefault();
                if (video.paused) {
                    video.play();
                } else {
                    video.pause();
                }
            }, { passive: false });
        });
    }
}