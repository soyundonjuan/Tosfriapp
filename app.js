// Datos iniciales (según tu requerimiento)
const PUNTOS = [
  { id: "asturias", name: "Asturias", pin: "1234" }
];

const $ = (s) => document.querySelector(s);
const toast = (m) => {
  const t = $("#toast");
  t.textContent = m; t.style.display = "block";
  setTimeout(()=> t.style.display = "none", 1800);
};

// Rellenar select y wiring
document.addEventListener("DOMContentLoaded", () => {
  const sel = $("#pvSelect");
  PUNTOS.forEach(p => {
    const o = document.createElement("option");
    o.value = p.id; o.textContent = p.name;
    sel.appendChild(o);
  });

  const pinInput = $("#pinInput");
  const btnGo = $("#btnGo");

  // Habilitar botón solo si hay selección y 4 dígitos
  const validate = () => {
    const goodSel = sel.value !== "";
    const goodPin = /^\d{4}$/.test(pinInput.value.trim());
    btnGo.disabled = !(goodSel && goodPin);
  };
  sel.addEventListener("change", validate);
  pinInput.addEventListener("input", (e) => {
    // Solo números, máx 4
    e.target.value = e.target.value.replace(/\D+/g, "").slice(0, 4);
    validate();
  });

  // Enter para enviar
  pinInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !btnGo.disabled) btnGo.click();
  });

  // Clic en flecha: validar y continuar
  btnGo.addEventListener("click", () => {
    const punto = PUNTOS.find(p => p.id === sel.value);
    const pin = $("#pinInput").value.trim();
    if (!punto) return toast("Selecciona un punto de venta");
    if (pin !== punto.pin) return toast("PIN incorrecto");

    // ✅ Acceso concedido: aquí navegas al siguiente frame/ruta
    // Si tu app es SPA, cambia 'window.location' por tu función go('home')
    // go('home');
    toast("Acceso concedido");
    // Ejemplo: redirigir a tu app principal
    // window.location.href = "./index.html#home";
  });

  // Init estado del botón
  validate();
});
