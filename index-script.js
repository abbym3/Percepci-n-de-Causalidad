document.addEventListener("DOMContentLoaded", function () {
  const nameInput = document.getElementById('name');
  const ageInput = document.getElementById('age');
  const startBtn = document.getElementById('startBtn');
  const groupCards = document.querySelectorAll('.group-card');

  let selectedGroup = null;

  function validateForm() {
    const nameValid = nameInput.value.trim().length > 0;
    const ageValue = parseInt(ageInput.value, 10);
    const ageValid = !isNaN(ageValue) && ageValue >= 1 && ageValue <= 120;
    const groupValid = selectedGroup !== null;
    startBtn.disabled = !(nameValid && ageValid && groupValid);
  }

  // Eventos en inputs
  nameInput.addEventListener('input', validateForm);
  ageInput.addEventListener('input', validateForm);

  // Selección de grupo
  groupCards.forEach(card => {
    card.addEventListener('click', () => {
      groupCards.forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      selectedGroup = card.getAttribute('data-group');
      validateForm();
    });
  });

  // Acción del botón
  startBtn?.addEventListener("click", function () {
    window.location.href = "game.html"; //"https://erick-m-8.github.io/Percepci-n-de-Causalidad/game.html" //
  });
});