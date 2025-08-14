import { ref, set } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-database.js";
import { db } from "./firebase-init.js"; 

function saveInitialUserData(nombre, edad, grupo) {
  const timestamp = Math.floor(Date.now() / 1000); // Ej: 1755144881
  const lastThree = timestamp % 1000;              // Ej: 881
  const userKey = `${nombre}_${edad}_${lastThree}`;

  const data = {
    0: [`${nombre}`,`${edad}`,`${grupo}`] // Primer renglón en la base
  };

  const userRef = ref(db, `participantes/${userKey}`); // Ruta en Firebase
  set(userRef, data)
    .then(() => {
      console.log("Datos guardados correctamente en Firebase.");
      localStorage.setItem('currentUserId', userKey); // Guardamos para usar en game.html
      window.location.href = "game.html"; // Redirigir al experimento
    })
    .catch((error) => {
      console.error("Error al guardar en Firebase:", error);
      alert("Hubo un problema al guardar tus datos. Intenta de nuevo.");
    });
}

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
    const nombre = nameInput.value;
    const edad = ageInput.value;
    const grupo = selectedGroup;
    saveInitialUserData(nombre, edad, grupo);
  });
  // Acción del botón
});