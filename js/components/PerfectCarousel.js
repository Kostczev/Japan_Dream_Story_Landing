import { debounce } from '../utils/debounce.js';

/**
 * PerfectCarousel
 *
 * Горизонтальная карусель с:
 * - snap-позиционированием
 * - drag-перетаскиванием
 * - инерцией
 * - кнопочной навигацией
 *
 * Архитектура:
 * snapPoints — единственный источник истины для всех допустимых translateX
 * Вся логика (drag, inertia, кнопки) работает через них
 *
 * Основной поток:
 * init → calculate → bindEvents
 * drag → inertia → snapToNearest → goTo
*/
export default class PerfectCarousel {
    constructor(container) {
        this.container = container;
        this.track = container.querySelector('.carousel__track');
        this.items = Array.from(this.track.children);

        this.prevButton = container.querySelector('.carousel__button--prev');
        this.nextButton = container.querySelector('.carousel__button--next');

        // ============================
        // Position state
        // ============================
        this.currentIndex = 0;
        this.currentTranslate = 0;

        // ============================
        // Drag state
        // ============================
        this.startX = 0;
        this.startTranslate = 0;
        this.isDragging = false;

        // ============================
        // Animation & physics
        // ============================
        this.animationId = null;

        this.lastX = 0;
        this.lastTime = 0;

        this.velocity = 0;
        this.deceleration = 0.95;
        this.minVelocity = 0.1;
        this.maxVelocity = 3;

        // ============================
        // Geometry
        // ============================
        this.isScrollable = false;

        // snapPoints — single source of truth
        // for all allowed translateX positions
        this.snapPoints = [0];

        this.maxIndex = 0;
        this.minTranslate = 0;
        this.maxTranslate = 0;

        this.init();
    }

    init() {
        this.calculate();
        this.updateControlsVisibility();
        this.goTo(0, false);
        this.bindEvents();
    }

    /**
     * Включает / выключает видимость кнопок
    */
    updateControlsVisibility() {
        if (this.prevButton) {
            this.prevButton.style.display = this.isScrollable ? '' : 'none';
        }
        if (this.nextButton) {
            this.nextButton.style.display = this.isScrollable ? '' : 'none';
        }
    }

    /**
     * Пересчитывает геометрию карусели
     *
     * Вычисляет:
     * - containerWidth
     * - trackWidth
     * - количество видимых элементов
     * - snapPoints
     * - границы translate
     *
     * Вызывается при:
     * - инициализации
     * - resize
    */
    calculate() {
        if (!this.items.length) return;

        this.containerWidth = this.container.clientWidth;
        this.trackWidth = this.track.scrollWidth;

        if (this.containerWidth >= this.trackWidth) {
            this.isScrollable = false;
            this.resetParams();
            this.applyTransform();
            return;
        }

        this.isScrollable = true;

        const styles = getComputedStyle(this.track);
        const gap = parseFloat(styles.columnGap || styles.gap) || 0;

        const itemWidth = this.items[0].clientWidth;
        const stepWidth = itemWidth + gap;

        const visibleCount = Math.floor(this.containerWidth / stepWidth);
        this.maxIndex = Math.max(0, this.items.length - visibleCount);

        this.snapPoints = [];
        for (let i = 0; i <= this.maxIndex - 1; i++) {
            this.snapPoints.push(-i * stepWidth);
        }
        this.snapPoints.push(this.containerWidth - this.trackWidth);

        this.minTranslate = this.snapPoints.at(-1);
    }

    resetParams() {
        this.snapPoints = [0];
        this.maxIndex = 0;
        this.minTranslate = 0;
        this.currentIndex = 0;
        this.currentTranslate = 0;
    }

    bindEvents() {
        // Drag
        this.track.addEventListener('mousedown', this.startDrag);
        this.track.addEventListener('touchstart', this.startDrag, { passive: true });

        // Buttons
        this.prevButton?.addEventListener('click', () => {
                this.container.focus();
                this.goToPrev();
            }
        );
        this.nextButton?.addEventListener('click', () => {
                this.container.focus();
                this.goToNext();
            }
        );

        this.bindKeyboard();

        // Resize
        this.onResize = debounce(() => {
            this.calculate();
            this.updateControlsVisibility();
            this.goTo(this.currentIndex, false);
        }, 150);

        window.addEventListener('resize', this.onResize);
    }

    goToPrev() {
        this.goTo(this.currentIndex - 1);
    }
    goToNext() {
        this.goTo(this.currentIndex + 1);
    }

    bindKeyboard() {
        this.container.setAttribute('tabindex', '0');

        this.container.addEventListener('keydown', (e) => {
            if (!this.isScrollable) return;

            if (e.key === 'ArrowLeft') {
                this.goToPrev();
            }

            if (e.key === 'ArrowRight') {
                this.goToNext();
            }
        });
    }

    /**
     * Начало drag-перетаскивания
     *
     * Сохраняем стартовые координаты и translate
     * Подписываемся на move/end события
     * Сбрасываем инерцию, если была активна
    */
    startDrag = (e) => {
        if (!this.isScrollable) return;

        this.container.focus();

        cancelAnimationFrame(this.animationId);

        this.isDragging = true;
        this.startX = this.getX(e);
        this.startTranslate = this.currentTranslate;
        this.velocity = 0;
        this.lastX = this.startX;
        this.lastTime = performance.now();

        document.addEventListener('mousemove', this.onDrag);
        document.addEventListener('mouseup', this.endDrag);
        document.addEventListener('touchmove', this.onDrag, { passive: true });
        document.addEventListener('touchend', this.endDrag);
    };

    /**
     * Обработка движения pointer
     *
     * Обновляет currentTranslate в реальном времени
     * Применяет soft bounds за пределами допустимой области
     * Вычисляет скорость для последующей инерции
    */
    onDrag = (e) => {
        if (!this.isDragging) return;

        const x = this.getX(e);
        const diff = x - this.startX;
        let newTranslate = this.startTranslate + diff;

        // Soft bounds
        if (newTranslate > this.maxTranslate)
            newTranslate =
                this.maxTranslate + (newTranslate - this.maxTranslate) * 0.3;

        if (newTranslate < this.minTranslate)
            newTranslate =
                this.minTranslate + (newTranslate - this.minTranslate) * 0.3;

        // Velocity
        const now = performance.now();
        const dt = now - this.lastTime;

        if (dt > 0) {
            this.velocity = (x - this.lastX) / dt;
            this.lastX = x;
            this.lastTime = now;
        }

        this.currentTranslate = newTranslate;
        this.applyTransform();
    };

    /**
     * Завершает drag
     *
     * Отписывается от move/end событий
     * Запускает инерцию или переход к ближайшей точке
    */
    endDrag = () => {
        this.isDragging = false;

        document.removeEventListener('mousemove', this.onDrag);
        document.removeEventListener('mouseup', this.endDrag);
        document.removeEventListener('touchmove', this.onDrag);
        document.removeEventListener('touchend', this.endDrag);

        if (Math.abs(this.velocity) > this.minVelocity) {
            this.applyInertia();
        } else {
            this.snapToNearest();
        }
    };

    /**
     * Применяет инерционное движение после отпускания drag.
     *
     * Каждый кадр:
     * - уменьшаем скорость (deceleration)
     * - смещаем translate
     * - проверяем выход за границы
     *
     * Останавливаемся при достижении minVelocity
     * или при выходе за пределы.
    */
    applyInertia() {
        this.velocity = Math.max(
            -this.maxVelocity,
            Math.min(this.maxVelocity, this.velocity)
        );

        const step = () => {
            this.velocity *= this.deceleration;
            this.currentTranslate += this.velocity * 16;

            if (
                this.currentTranslate > this.maxTranslate ||
                this.currentTranslate < this.minTranslate
            ) {
                this.snapToNearest();
                return;
            }

            this.applyTransform();

            if (Math.abs(this.velocity) > this.minVelocity) {
                this.animationId = requestAnimationFrame(step);
            } else {
                this.snapToNearest();
            }
        };

        this.animationId = requestAnimationFrame(step);
    }

    /**
     * Получает ближайшую snap-позицию
     * и запускает переход к ней.
    */
    snapToNearest() {
        const nearest = this.findNearestIndex();
        this.goTo(nearest);
    }

    /**
     * Вычисляет ближайшую snap-позицию
    */
    findNearestIndex() {
        let nearest = 0;
        let minDist = Infinity;

        this.snapPoints.forEach((point, i) => {
            const dist = Math.abs(point - this.currentTranslate);
            if (dist < minDist) {
                minDist = dist;
                nearest = i;
            }
        });

        return nearest;
    }

    /**
     * Переход к конкретному индексу snapPoints.
     *
     * Используется:
     * - кнопками
     * - snapToNearest
     * - resize-коррекцией
    */
    goTo(index, animate = true) {
        if (index < 0 || index >= this.maxIndex + 1) return;

        this.currentIndex = index;
        const target = this.snapPoints[index];
        this.updateNavigationState();

        if (!animate) {
            this.currentTranslate = target;
            this.applyTransform();
            return;
        }

        this.animateTo(target);
    }

    /**
     * Анимированный переход к конкретному translate значению
     *
     * Использует requestAnimationFrame и ease-out кривую
     * В конце фиксирует точное значение и синхронизирует навигацию
    */
    animateTo(target) {
        cancelAnimationFrame(this.animationId);

        const start = this.currentTranslate;
        const duration = 350;
        const startTime = performance.now();

        // Cubic ease-out
        const ease = (t) => 1 - Math.pow(1 - t, 3);

        const step = (now) => {
            const progress = Math.min((now - startTime) / duration, 1);
            this.currentTranslate =
                start + (target - start) * ease(progress);

            this.applyTransform();

            if (progress < 1) {
                this.animationId = requestAnimationFrame(step);
            } else {
                this.currentTranslate = target;
                this.velocity = 0;
                this.updateNavigationState();
            }
        };

        this.animationId = requestAnimationFrame(step);
    }

    /**
     * Синхронизировать состояние кнопок с текущим индексом
    */
    updateNavigationState() {
        const atStart = this.currentIndex === 0;
        const atEnd = this.currentIndex === this.maxIndex;

        if (this.prevButton) this.prevButton.disabled = atStart;
        if (this.nextButton) this.nextButton.disabled = atEnd;
    }

    applyTransform() {
        this.track.style.transform = `translateX(${this.currentTranslate}px)`;
    }

    /**
     * Нормализует получение координаты X
     * для mouse и touch событий.
    */
    getX(e) {
        return e.type.includes('mouse')
            ? e.clientX
            : e.touches[0].clientX;
    }
}
