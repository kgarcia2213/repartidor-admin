const API_BASE = "https://api-repartidor-tm.onrender.com/api";

// api.js
//const API_URL = "https://api-repartidor-tm.onrender.com/api";

// === CLIENTES ===
async function cargarClientes() {
  const res = await fetch(`${API_URL}/clientes`);
  const data = await res.json();
  renderTabla("tablaClientes", data);
}

async function guardarCliente(e) {
  e.preventDefault();
  const form = e.target;
  const cliente = {
    nombre: form.nombre.value,
    telefono: form.telefono.value,
    direccion: form.direccion.value
  };
  await fetch(`${API_URL}/clientes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(cliente)
  });
  form.reset();
  cargarClientes();
}

// === REPARTIDORES ===
async function cargarRepartidores() {
  const res = await fetch(`${API_URL}/repartidores`);
  const data = await res.json();
  renderTabla("tablaRepartidores", data);
}

async function guardarRepartidor(e) {
  e.preventDefault();
  const form = e.target;
  const repartidor = {
    nombre: form.nombre.value,
    telefono: form.telefono.value,
    vehiculo: form.vehiculo.value
  };
  await fetch(`${API_URL}/repartidores`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(repartidor)
  });
  form.reset();
  cargarRepartidores();
}

// === PEDIDOS ===
async function cargarPedidos() {
  const res = await fetch(`${API_URL}/pedidos`);
  const data = await res.json();
  renderTabla("tablaPedidos", data);
}

async function guardarPedido(e) {
  e.preventDefault();
  const form = e.target;
  const pedido = {
    cliente_id: form.cliente_id.value,
    repartidor_id: form.repartidor_id ? form.repartidor_id.value : null,
    direccion: form.direccion.value
  };
  await fetch(`${API_URL}/pedidos`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(pedido)
  });
  form.reset();
  cargarPedidos();
}

// === RUTAS ===
async function guardarRuta(e) {
  e.preventDefault();
  const form = e.target;
  const ruta = {
    repartidor_id: form.repartidor_id.value,
    fecha: form.fecha.value,
    lista_de_pedidos: form.lista_de_pedidos.value
  };
  alert("Ruta guardada (pendiente conexión a backend)");
  form.reset();
}

// === FUNCIONES COMUNES ===
function renderTabla(idTabla, data) {
  const tabla = document.getElementById(idTabla);
  if (!data.length) {
    tabla.innerHTML = "<tr><td colspan='5'>Sin datos</td></tr>";
    return;
  }
  const columnas = Object.keys(data[0]);
  const header = "<tr>" + columnas.map(c => `<th>${c}</th>`).join("") + "</tr>";
  const rows = data.map(obj =>
    "<tr>" + columnas.map(c => `<td>${obj[c]}</td>`).join("") + "</tr>"
  ).join("");
  tabla.innerHTML = header + rows;
}

// === NAVEGACIÓN ENTRE SECCIONES ===
function mostrarSeccion(id) {
  document.querySelectorAll(".seccion").forEach(sec => sec.classList.remove("activa"));
  document.getElementById(id).classList.add("activa");

  if (id === "clientes") cargarClientes();
  if (id === "repartidores") cargarRepartidores();
  if (id === "pedidos") cargarPedidos();
}


async function apiDelete(endpoint, id) {
  const res = await fetch(`${API_BASE}/${endpoint}/${id}`, { method: "DELETE" });
  return res.json();
}
