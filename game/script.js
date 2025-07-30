document.addEventListener("DOMContentLoaded", function () {
  const shootbutton = document.getElementById("shootButton");
  if (shootbutton ) {
      shootbutton .addEventListener("click", function () {
      alert('Aiuda :c')
    });
  } else {
    console.error("No se encontró el botón con id 'shootbutton '");
  }
});