document.addEventListener("DOMContentLoaded", function () {
  const initbutton = document.getElementById("initButton");
  if (initbutton) {
      initbutton.addEventListener("click", function () {
      window.location.href = "https://erick-m-8.github.io/Percepci-n-de-Causalidad/game.html" //"game.html";
    });
  } else {
    console.error("No se encontró el botón con id 'initButton'");
  }
});