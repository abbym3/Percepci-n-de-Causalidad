document.addEventListener("DOMContentLoaded", function () {
  const initbutton = document.getElementById("initButton");
  if (initbutton) {
      initbutton.addEventListener("click", function () {
      window.location.href = "/game/game.html";
    });
  } else {
    console.error("No se encontró el botón con id 'initButton'");
  }
});