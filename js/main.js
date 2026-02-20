import PerfectCarousel from './components/PerfectCarousel.js';
import FrozenVideo from './components/FrozenVideo.js';
import { HorizontalScrollSection } from './components/HorizontalScrollSection.js';
import { DreamForm } from './components/DreamForm.js';


document.addEventListener('DOMContentLoaded', () => {
    // Инициализация всех каруселей
    document.querySelectorAll('.carousel__container').forEach(container => {
        new PerfectCarousel(container);
    });

    // мозги замерзших картинок
    new FrozenVideo();

    document.querySelectorAll('.horizontal').forEach(el => {
        new HorizontalScrollSection(el);
    })

    const form =
        document.getElementById('dreamForm');
    if (form) {
        new DreamForm(form);
    }
});