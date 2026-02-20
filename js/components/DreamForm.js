export class DreamForm {
  constructor(form) {
    this.form = form;
    this.submitBtn = form.querySelector('[type="submit"]');

    this.handleSubmit = this.handleSubmit.bind(this);

    this.init();
  }

  init() {
    this.form.addEventListener('submit', this.handleSubmit);
  }

  handleSubmit(e) {
    e.preventDefault();

    const isValid = this.validate();

    if (!isValid) return;

    this.showSuccess();
  }

  validate() {
    let valid = true;

    // --- чекбоксы ---
    const checkedInterests =
      this.form.querySelectorAll(
        'input[name="interests"]:checked'
      );

    console.log(checkedInterests);

    const interestError =
      this.form.querySelector(
        '.dream-form__question .dream-form__errore-card'
      );

    if (checkedInterests.length === 0) {
      interestError.classList.add('active');
      valid = false;
    } else {
      interestError.classList.remove('active');
    }

    // --- radio ---
    const selectedRhythm =
      this.form.querySelector(
        'input[name="rhythm"]:checked'
      );

    const rhythmError =
      this.form.querySelectorAll(
        '.dream-form__errore-card'
      )[1];

    if (!selectedRhythm) {
      rhythmError.classList.add('active');
      valid = false;
    } else {
      rhythmError.classList.remove('active');
    }

    // --- текстовые поля ---
    const requiredFields =
      this.form.querySelectorAll(
        '.js-required-field'
      );

    requiredFields.forEach(field => {
      const error =
        field.closest('.input__text-box')
          .querySelector('.form__mesage-errore');

      if (field.value.trim() === '') {
        error.classList.add('active');
        valid = false;
      } else {
        error.classList.remove('active');
      }
    });

    return valid;
  }

  showSuccess() {
    this.submitBtn.disabled = true;
    this.submitBtn.textContent =
      'Мечта отправлена ✨';

    this.form.reset();
  }
}
