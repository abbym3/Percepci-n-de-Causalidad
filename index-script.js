import { ref, set } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-database.js";
import { db, auth } from "./firebase-init.js"; 
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

function saveInitialUserData(nombre, edad, grupo) {
  // Esperamos a que el estado de autenticación esté disponible
  onAuthStateChanged(auth, (user) => {
    if (user) {
      const uid = user.uid; // ID único del usuario autenticado
      const userKey = uid;  // Lo usamos como clave en la base

      const data = {
        0: [`${nombre}`, `${edad}`, `${grupo}`] // Primer renglón en la base
      };

      const userRef = ref(db, `participantes/${userKey}`); // Ruta en Firebase

      set(userRef, data)
        .then(() => {
          console.log("Datos guardados correctamente en Firebase.");
          localStorage.setItem('currentUserId', uid); // Guardamos para usar en game.html
          location.assign('game.html'); // Redirigir al experimento
        })
        .catch((error) => {
          console.error("Error al guardar en Firebase:", error);
          alert("Hubo un problema al guardar tus datos. Intenta de nuevo.");
        });
    } else {
      console.error("Usuario no autenticado.");
      alert("No se pudo autenticar al usuario.");
    }
  });
}


document.addEventListener("DOMContentLoaded", function () { 
//Esperar a que el DOM esté listo

  localStorage.removeItem('currentUserId');

  const nameInput = document.getElementById('name');
  const ageInput = document.getElementById('age');
  const universidadInput = document.getElementById('universidad');
  const startBtn = document.getElementById('startBtn');

  function validateForm() {
    const nameFilled = nameInput.value.trim() !== '';
    const ageFilled = ageInput.value.trim() !== '' && !isNaN(ageInput.value);
    const universidadFilled = universidadInput.value.trim() !== '';
    startBtn.disabled = !(nameFilled && ageFilled && universidadFilled);
  }
  //Funcion de validación

  // Event listeners para validación en tiempo real
  nameInput.addEventListener('input', validateForm);
  ageInput.addEventListener('input', validateForm);
  universidadInput.addEventListener('input', validateForm);

  startBtn?.addEventListener("click", function () {
    const nombre = nameInput.value;
    const edad = ageInput.value;
    const grupo = universidadInput.value; // El dato de universidad se guarda en la variable 'grupo'
    saveInitialUserData(nombre, edad, grupo);
    //window.location.href = "game.html"; // Redirigir al experimento
  });
  // Acción del botón
});