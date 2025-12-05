document.addEventListener('DOMContentLoaded', () => {
  const forms = document.querySelectorAll('form');
  forms.forEach(form => {
    form.addEventListener('submit', (e) => {
      const required = form.querySelectorAll('[required]');
      let valid = true;
      required.forEach(input => {
        if (!input.value.trim()) {
          valid = false;
          input.style.borderColor = 'red';
        } else {
          input.style.borderColor = '#ddd';
        }
      });
      if (!valid) {
        e.preventDefault();
        alert('Please fill all required fields');
      }
    });
  });

  const dueDateInputs = document.querySelectorAll('input[type="date"]');
  dueDateInputs.forEach(input => {
    if (!input.value) input.valueAsDate = new Date();
  });
});