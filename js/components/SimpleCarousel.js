export default class SimpleCarousel {
    constructor(container) {
        this.container = container;
        this.track = container.querySelector('.carousel__track');
        this.items = Array.from(this.track.children);

        this.prevBtn = container.querySelector('.carousel__button--prev');
        this.nextBtn = container.querySelector('.carousel__button--next');

        this.currentIndex = 0;

        this.bindEvents();
        // this.initDrag();
        this.updateButtons();
    }

    bindEvents() {
        this.track.addEventListener('scroll', () => {
            this.updateIndex();
        });

        this.prevBtn?.addEventListener('click', () => this.prev());
        this.nextBtn?.addEventListener('click', () => this.next());
    }

    updateIndex() {
        const itemWidth = this.items[0].offsetWidth;
        const scrollLeft = this.track.scrollLeft;

        this.currentIndex = Math.round(scrollLeft / itemWidth);
        this.updateButtons();
    }

    next() {
        if (this.currentIndex < this.items.length - 1) {
            this.currentIndex++;
            this.scrollToIndex();
        }
    }

    prev() {
        if (this.currentIndex > 0) {
            this.currentIndex--;
            this.scrollToIndex();
        }
    }

    scrollToIndex() {
        const itemWidth = this.items[0].offsetWidth;
        this.track.scrollTo({
            left: itemWidth * this.currentIndex,
            behavior: 'smooth'
        });
    }

    initDrag() {
        let isDown = false;
        let startX;
        let scrollLeft;

        this.track.addEventListener('mousedown', (e) => {
            isDown = true;
            this.track.classList.add('is-dragging');

            startX = e.pageX - this.track.offsetLeft;
            scrollLeft = this.track.scrollLeft;
        });

        this.track.addEventListener('mouseleave', () => {
            isDown = false;
            this.track.classList.remove('is-dragging');
        });

        this.track.addEventListener('mouseup', () => {
            isDown = false;
            this.track.classList.remove('is-dragging');
        });

        this.track.addEventListener('mousemove', (e) => {
            if (!isDown) return;

            e.preventDefault();
            const x = e.pageX - this.track.offsetLeft;
            const walk = x - startX;

            this.track.scrollLeft = scrollLeft - walk;
        });
    }

    updateButtons() {
        if (this.prevBtn) {
            this.prevBtn.disabled = this.currentIndex === 0;
        }
        if (this.nextBtn) {
            this.nextBtn.disabled =
                this.currentIndex === this.items.length - 1;
        }
    }
}
