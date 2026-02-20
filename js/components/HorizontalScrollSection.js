import { debounce } from '../utils/debounce.js';

export class HorizontalScrollSection {
    constructor(container) {
        this.container = container;
        this.track = container.querySelector('.horizontal__track');

        if (!this.track) return;

        this.onScroll = this.onScroll.bind(this);
        this.onResize = this.onResize.bind(this);
        this.handleResize = debounce(this.onResize, 150);

        this.init();
    }

    init() {
        this.calculate();
        this.bindEvents();
    }

    bindEvents() {
        window.addEventListener('scroll', this.onScroll);

        window.addEventListener('resize', this.handleResize);
    }

    calculate() {
        this.trackWidth = this.track.scrollWidth;

        const newHeight = this.trackWidth - window.innerWidth + window.innerHeight;
        this.container.style.height = `${newHeight}px`;

        this.total = this.container.offsetHeight - window.innerHeight;
        this.maxTranslate = this.trackWidth - window.innerWidth;
    }

    onScroll() {
        if (this.total <= 0) return;

        const rect = this.container.getBoundingClientRect();

        const progress = Math.min(
            Math.max(-rect.top / this.total, 0),
            1
        );

        const translate = -progress * this.maxTranslate;
        this.track.style.transform =
            `translateX(${translate}px)`;
    }

    onResize() {
        this.calculate();
        this.onScroll();
    }

    destroy() {
        window.removeEventListener('scroll', this.onScroll);
        window.removeEventListener('resize', this.handleResize);
    }
}