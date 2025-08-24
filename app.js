// ======= Datos demo (puedes editar/migrar a backend) =======
const DEMO = {
  pdvs: [
    { id: "asturias", nombre: "Asturias", usuarios: [
      { id:"caja1", nombre:"Caja 1", pin:"123" },
      { id:"caja2", nombre:"Caja 2", pin:"456" },
    ]}
  ],
  productos: [
    { id:"emp_carne", nombre:"Empanada de carne", precio:2500, stock:100 },
    { id:"emp_pollo", nombre:"Empanada de pollo", precio:2500, stock:100 },
    { id:"emp_queso", nombre:"Empanada de queso", precio:2500, stock:100 },
    { id:"arepa_trifasica", nombre:"Arepa trifásica", precio:8000, stock:60 },
    { id:"arepa_ranchera", nombre:"Arepa ranchera", precio:8000, stock:60 },
    { id:"jugo_maracuya", nombre:"Jugo de maracuyá", precio:6000, stock:80 },
  ],
  combos: [
    { id:"combo1", nombre:"Empanada + Arepa + Jugo", precio:15000, items:[
      { prodId:"emp_carne", cant:1 },
      { prodId:"arepa_trifasica", cant:1 },
      { prodId:"jugo_maracuya", cant:1 }
    ]},
    { id:"combo2", nombre:"2 Empanadas + Jugo", precio:9500, items:[
      { prodId:"emp_pollo", cant:1 },
      { prodId:"emp_queso", cant:1 },
      { prodId:"jugo_maracuya", cant:1 }
    ]},
  ]
};

// ======= Storage helpers =======
const KEY = {
  productos: "mvp_productos",
  combos: "mvp_combos",
  inventario: "mvp_inventario",
  ventas: "mvp_ventas",
  session: "mvp_session"
};

function loadJSON(key, fallback){
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
  catch { return fallback; }
}
function saveJSON(key, data){
  localStorage.setItem(key, JSON.stringify(data));
}

// Inicializar datos si no existen
if(!localStorage.getItem(KEY.productos)){
  saveJSON(KEY.productos, DEMO.productos);
  const inv = {};
  DEMO.productos.forEach(p => inv[p.id] = p.stock);
  saveJSON(KEY.inventario, inv);
}
if(!localStorage.getItem(KEY.combos)){
  saveJSON(KEY.combos, DEMO.combos);
}
if(!localStorage.getItem(KEY.ventas)){
  saveJSON(KEY.ventas, []);
}

// ======= Estado global =======
let state = {
  session: loadJSON(KEY.session, null),
  productos: loadJSON(KEY.productos, []),
  combos: loadJSON(KEY.combos, []),
  inventario: loadJSON(KEY.inventario, {}),
  ventas: loadJSON(KEY.ventas, []),
  carrito: { prods:{}, combos:{} }
};

// ======= Utilidades =======
const $ = sel => document.querySelector(sel);
function money(n){ return (n||0).toLocaleString("es-CO"); }
function todayISO(){ const d=new Date(); d.setHours(0,0,0,0); return d.toISOString().slice(0,10); }
function between(dateISO, d1, d2){
  const t = new Date(dateISO).getTime();
  return (!d1 || t>=new Date(d1).getTime()) && (!d2 || t<=(new Date(d2).getTime()+86399999));
}

// ======= Login =======
function renderLogin(){
  const selPdv = $("#sel-pdv");
  const selUsuario = $("#sel-usuario");
  selPdv.innerHTML = DEMO.pdvs.map(p=>`<option value="${p.id}">${p.nombre}</option>`).join("");
  function fillUsers(){
    const pdv = DEMO.pdvs.find(p=>p.id===selPdv.value);
    selUsuario.innerHTML = pdv.usuarios.map(u=>`<option value="${u.id}">${u.nombre}</option>`).join("");
  }
  selPdv.addEventListener("change", fillUsers);
  fillUsers();

  $("#btn-login").onclick = () => {
    const pdv = DEMO.pdvs.find(p=>p.id===selPdv.value);
    const user = pdv.usuarios.find(u=>u.id===selUsuario.value);
    const pin = $("#pin").value.trim();
    if(pin === user.pin){
      state.session = { pdvId: pdv.id, pdvNombre: pdv.nombre, userId: user.id, userNombre: user.nombre };
      saveJSON(KEY.session, state.session);
      $("#view-login").classList.add("hidden");
      $("#nav").classList.remove("hidden");
      showView("ventas");
    } else {
      alert("PIN incorrecto.");
    }
  };
}

// ======= Navegación =======
function showView(name){
  ["ventas","inventario","reportes"].forEach(v => $(`#view-${v}`).classList.add("hidden"));
  $(`#view-${name}`).classList.remove("hidden");
}

$("#nav-ventas").onclick = ()=>showView("ventas");
$("#nav-inventario").onclick = ()=>{
  renderInventario();
  showView("inventario");
};
$("#nav-reportes").onclick = ()=>{
  renderReportes();
  showView("reportes");
};
$("#btn-logout").onclick = ()=>{
  state.session = null;
  localStorage.removeItem(KEY.session);
  location.reload();
};

// ======= Ventas =======
function renderProductos(){
  const cont = $("#productos-list");
  cont.innerHTML = state.productos.map(p=>{
    const stock = state.inventario[p.id] ?? 0;
    return `<div class="item">
      <div class="row"><strong>${p.nombre}</strong><span>$${money(p.precio)}</span></div>
      <div class="row"><small>Stock: ${stock}</small></div>
      <div class="row">
        <button data-add-prod="${p.id}">+</button>
        <input class="qty-input" id="qty-${p.id}" type="number" min="0" value="${state.carrito.prods[p.id]||0}"/>
        <button data-sub-prod="${p.id}">-</button>
      </div>
    </div>`;
  }).join("");

  cont.querySelectorAll("[data-add-prod]").forEach(btn=>{
    btn.onclick = ()=>{
      const id = btn.getAttribute("data-add-prod");
      state.carrito.prods[id] = (state.carrito.prods[id]||0)+1;
      $(`#qty-${id}`).value = state.carrito.prods[id];
      calcTotales();
    };
  });
  cont.querySelectorAll("[data-sub-prod]").forEach(btn=>{
    btn.onclick = ()=>{
      const id = btn.getAttribute("data-sub-prod");
      state.carrito.prods[id] = Math.max(0,(state.carrito.prods[id]||0)-1);
      $(`#qty-${id}`).value = state.carrito.prods[id];
      calcTotales();
    };
  });
  cont.querySelectorAll(".qty-input").forEach(inp=>{
    inp.oninput = ()=>{
      const id = inp.id.replace("qty-","");
      state.carrito.prods[id] = Math.max(0, Number(inp.value||0));
      calcTotales();
    };
  });
}

function renderCombos(){
  const cont = $("#combos-list");
  cont.innerHTML = state.combos.map(c=>{
    const items = c.items.map(it=>{
      const p = state.productos.find(x=>x.id===it.prodId);
      return `${it.cant}× ${p? p.nombre : it.prodId}`;
    }).join(", ");
    return `<div class="item">
      <div class="row"><strong>${c.nombre}</strong><span>$${money(c.precio)}</span></div>
      <div class="row"><small>${items}</small></div>
      <div class="row">
        <button data-add-combo="${c.id}">+</button>
        <input class="qty-input" id="qtyc-${c.id}" type="number" min="0" value="${state.carrito.combos[c.id]||0}"/>
        <button data-sub-combo="${c.id}">-</button>
      </div>
    </div>`;
  }).join("");

  cont.querySelectorAll("[data-add-combo]").forEach(btn=>{
    btn.onclick = ()=>{
      const id = btn.getAttribute("data-add-combo");
      state.carrito.combos[id] = (state.carrito.combos[id]||0)+1;
      $(`#qtyc-${id}`).value = state.carrito.combos[id];
      calcTotales();
    };
  });
  cont.querySelectorAll("[data-sub-combo]").forEach(btn=>{
    btn.onclick = ()=>{
      const id = btn.getAttribute("data-sub-combo");
      state.carrito.combos[id] = Math.max(0,(state.carrito.combos[id]||0)-1);
      $(`#qtyc-${id}`).value = state.carrito.combos[id];
      calcTotales();
    };
  });
  cont.querySelectorAll(".qty-input").forEach(inp=>{
    inp.oninput = ()=>{
      const id = inp.id.replace("qtyc-","");
      state.carrito.combos[id] = Math.max(0, Number(inp.value||0));
      calcTotales();
    };
  });
}

function calcTotales(){
  let subtotal = 0;
  Object.entries(state.carrito.prods).forEach(([id,cant])=>{
    const p = state.productos.find(x=>x.id===id);
    if(p && cant>0){ subtotal += p.precio * cant; }
  });
  Object.entries(state.carrito.combos).forEach(([id,cant])=>{
    const c = state.combos.find(x=>x.id===id);
    if(c && cant>0){ subtotal += c.precio * cant; }
  });
  $("#subtotal").textContent = money(subtotal);
  const desc = Number($("#descuento").value||0);
  const total = Math.max(0, subtotal - desc);
  $("#total").textContent = money(total);
}

function enoughStockForCart(){
  const needed = {};
  Object.entries(state.carrito.prods).forEach(([id,cant])=>{
    if(cant>0) needed[id] = (needed[id]||0) + cant;
  });
  Object.entries(state.carrito.combos).forEach(([id,cant])=>{
    const combo = state.combos.find(x=>x.id===id);
    if(combo && cant>0){
      combo.items.forEach(it=>{
        needed[it.prodId] = (needed[it.prodId]||0) + (it.cant * cant);
      });
    }
  });
  for(const pid in needed){
    const have = state.inventario[pid]||0;
    if(have < needed[pid]){
      const p = state.productos.find(x=>x.id===pid);
      alert(`Stock insuficiente para ${p? p.nombre : pid}. Necesitas ${needed[pid]}, hay ${have}.`);
      return false;
    }
  }
  return true;
}

function registrarVenta(){
  if(!enoughStockForCart()) return;
  const metodo = $("#metodo-pago").value;
  const subtotal = Number($("#subtotal").textContent.replace(/\./g,"").replace(/,/g,""));
  const descuento = Number($("#descuento").value||0);
  const total = Math.max(0, subtotal - descuento);

  Object.entries(state.carrito.prods).forEach(([id,cant])=>{
    if(cant>0) state.inventario[id] = (state.inventario[id]||0) - cant;
  });
  Object.entries(state.carrito.combos).forEach(([id,cant])=>{
    const combo = state.combos.find(x=>x.id===id);
    if(combo && cant>0){
      combo.items.forEach(it=>{
        state.inventario[it.prodId] = (state.inventario[it.prodId]||0) - (it.cant * cant);
      });
    }
  });
  saveJSON(KEY.inventario, state.inventario);

  const venta = {
    id: "v_" + Date.now(),
    fecha: new Date().toISOString(),
    pdvId: state.session?.pdvId,
    pdvNombre: state.session?.pdvNombre,
    userId: state.session?.userId,
    userNombre: state.session?.userNombre,
    metodo,
    items: { prods: state.carrito.prods, combos: state.carrito.combos },
    subtotal, descuento, total
  };
  state.ventas.push(venta);
  saveJSON(KEY.ventas, state.ventas);

  state.carrito = { prods:{}, combos:{} };
  renderProductos();
  renderCombos();
  calcTotales();
  alert("Venta registrada.");
}

$("#descuento").oninput = calcTotales;
$("#btn-registrar").onclick = registrarVenta;

// ======= Inventario =======
function renderInventario(){
  const cont = $("#inventario-table");
  const rows = state.productos.map(p=>{
    const stock = state.inventario[p.id]??0;
    return `<tr><td>${p.nombre}</td><td>$${money(p.precio)}</td><td>${stock}</td></tr>`;
  }).join("");
  cont.innerHTML = `<table>
    <thead><tr><th>Producto</th><th>Precio</th><th>Stock</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>`;

  const sel = $("#aj-prod");
  sel.innerHTML = state.productos.map(p=>`<option value="${p.id}">${p.nombre}</option>`).join("");
}
$("#btn-ajustar").onclick = ()=>{
  const pid = $("#aj-prod").value;
  const delta = Number($("#aj-cant").value||0);
  state.inventario[pid] = (state.inventario[pid]||0) + delta;
  saveJSON(KEY.inventario, state.inventario);
  renderInventario();
};

// ======= Reportes =======
function renderReportes(){
  const cont = $("#reportes-table");
  const desde = $("#f-desde").value;
  const hasta = $("#f-hasta").value;

  const ventas = state.ventas.filter(v=> between(v.fecha, desde, hasta));
  let efectivo = 0, transferencia = 0, total = 0;
  const rows = ventas.map(v=>{
    if(v.metodo==="efectivo") efectivo += v.total; else transferencia += v.total;
    total += v.total;
    return `<tr>
      <td>${new Date(v.fecha).toLocaleString()}</td>
      <td>${v.pdvNombre} / ${v.userNombre}</td>
      <td>${v.metodo}</td>
      <td>$${money(v.total)}</td>
    </tr>`;
  }).join("");

  cont.innerHTML = `<table>
    <thead><tr><th>Fecha</th><th>PDV / Usuario</th><th>Método</th><th>Total</th></tr></thead>
    <tbody>${rows}</tbody>
    <tfoot><tr><td colspan="3">TOTAL</td><td>$${money(total)}</td></tr></tfoot>
  </table>`;

  $("#res-cant").textContent = ventas.length;
  $("#res-total").textContent = money(total);
  $("#res-efectivo").textContent = money(efectivo);
  $("#res-transf").textContent = money(transferencia);
}

$("#btn-filtrar").onclick = renderReportes;

$("#btn-export-csv").onclick = ()=>{
  const desde = $("#f-desde").value;
  const hasta = $("#f-hasta").value;
  const ventas = state.ventas.filter(v=> between(v.fecha, desde, hasta));

  const headers = ["id","fecha","pdv","usuario","metodo","subtotal","descuento","total"];
  const lines = [headers.join(",")];
  ventas.forEach(v=>{
    lines.push([
      v.id,
      new Date(v.fecha).toISOString(),
      (v.pdvNombre||""),
      (v.userNombre||""),
      v.metodo,
      v.subtotal,
      v.descuento,
      v.total
    ].join(","));
  });
  const blob = new Blob([lines.join("\n")], {type:"text/csv"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "ventas.csv";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

// ======= Bootstrap =======
function init(){
  renderLogin();
  renderProductos();
  renderCombos();
  calcTotales();

  $("#f-desde").value = todayISO();
  $("#f-hasta").value = todayISO();

  if(state.session){
    $("#view-login").classList.add("hidden");
    $("#nav").classList.remove("hidden");
    showView("ventas");
  }
}
document.addEventListener("DOMContentLoaded", init);
