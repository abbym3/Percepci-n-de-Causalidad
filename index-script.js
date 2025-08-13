import { db, ref, set, push, serverTimestamp } from "./firebase-init.js";

document.addEventListener("DOMContentLoaded", function () { 
//Esperar a que el DOM esté listo

  const nameInput = document.getElementById('name');
  const ageInput = document.getElementById('age');
  const startBtn = document.getElementById('startBtn');
  const groupCards = document.querySelectorAll('.group-card'); //Es un array con todas las tarjetas (Cada tarjeta (imagen) es un grupo)
  let selectedGroup = null;

  function validateForm() {
    const nameFilled = nameInput.value.trim() !== '';
    const ageFilled = ageInput.value.trim() !== '' && !isNaN(ageInput.value);
    // Si alguno está vacío, también limpiamos la selección
    if (!nameFilled || !ageFilled) {
      groupCards.forEach(c => c.classList.remove('selected'));
      selectedGroup = null;
    }
    const groupSelected = selectedGroup !== null;
    startBtn.disabled = !(nameFilled && ageFilled && groupSelected);
  }
  //Funcion de validación

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
    const userId = `${nameInput.value}_${ageInput.value}_${Date.now() % 1000}`;  // Ej: "Erick_25_100"
    localStorage.setItem('currentUserId', userId); // Guardamos para usarlo en game.html

    // Primer registro: Inicio de sesión
    const Record = {
        "0": ["MIS", new Date().toISOString()]
    };

    // Guardar en Firebase
    const userRef = ref(db, `usuarios/${userId}`);
    set(userRef, Record)
      .then(() => {
        window.location.href = "game.html";
      })
      .catch((error) => {
        console.error("Error guardando inicio en Firebase:", error);
      });
  });
  // Acción del botón
});