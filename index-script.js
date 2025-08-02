document.addEventListener("DOMContentLoaded", function () { 
//Esperar a que el DOM esté listo

  function validateForm() {
    const nameFilled = nameInput.value.trim() !== '';
    const ageFilled = ageInput.value.trim() !== '';
    // Si alguno está vacío, también limpiamos la selección
    if (!nameFilled || !ageFilled) {
      groupCards.forEach(c => c.classList.remove('selected'));
      selectedGroup = null;
    }
    const groupSelected = selectedGroup !== null;
    startBtn.disabled = !(nameFilled && ageFilled && groupSelected);
  }
  //Funcion de validación

  const nameInput = document.getElementById('name');
  const ageInput = document.getElementById('age');
  const startBtn = document.getElementById('startBtn');
  const groupCards = document.querySelectorAll('.group-card'); //Es un array con todas las tarjetas (Cada tarjeta (imagen) es un grupo)
  //Referencias a elementos del DOM

  let selectedGroup = null;
  groupCards.forEach(card => { //Esto recorre cada tarjeta ...
    card.addEventListener('click', () => { // y le pone un event listenner (función que se ejecuta al hacer un click)
      groupCards.forEach(c => c.classList.remove('selected')); // Le quita a todas las tarjetas la clase selected (borde azul)
      card.classList.add('selected'); //Le pone la clase selected a la tarjeta que se clickeó
      selectedGroup = card.getAttribute('data-group'); //Guarda el valor del atributo data-group (nombre de imagen) de esa tarjeta
      validateForm();
    });
  });
  // Selección de grupo
  
  startBtn?.addEventListener("click", function () {
    const jugador = {
      datosPersonales: {
        nombre: nameInput.value,
        edad: ageInput.value,
        grupo: selectedGroup
      }
    };
    localStorage.setItem("jugador", JSON.stringify(jugador));
    // Guarda los datos en localStorage
    window.location.href = "game.html";
    //Lleva al usuario al juego
  });
  // Acción del botón

});