/******************************
 * admin.js - Frontend admin
 ******************************/
const API_BASE = "https://api-repartidor-tm.onrender.com"; // <- AJUSTA A TU API

// Simple helper fetch
async function apiFetch(path, opts = {}) {
  try {
    const res = await fetch(API_BASE + path, opts);
    if (!res.ok) {
      const text = await res.text().catch(()=>"");
      throw new Error(res.status + " " + res.statusText + " " + text);
    }
    return res.status !== 204 ? await res.json() : null;
  } catch (err) {
    alert("Error API: " + err.message);
    console.error(err);
    throw err;
  }
}

/* ---------- UI Tab logic ---------- */
document.querySelectorAll("nav button").forEach(btn=>{
  btn.addEventListener("click", ()=> {
    document.querySelectorAll("nav button").forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");
    const tab = btn.dataset.tab;
    document.querySelectorAll(".tab").forEach(t=>t.classList.remove("active"));
    document.getElementById(tab).classList.add("active");
    // when switching, refresh data for that tab
    if(tab === "clientes") loadClientes();
    if(tab === "repartidores") loadRepartidores();
    if(tab === "pedidos") { loadClientes(); loadRepartidores(); loadPedidos(); }
    if(tab === "entregas") { loadPedidos(); loadRepartidores(); loadEntregas(); }
    if(tab === "rutas") loadRutas();
  });
});

/* ---------- Clientes ---------- */
const clientesTbody = document.querySelector("#clientesTable tbody");
const clienteForm = document.getElementById("clienteForm");
clienteForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const f = new FormData(clienteForm);
  const id = f.get("id");
  const body = { nombre: f.get("nombre"), telefono: f.get("telefono"), direccion: f.get("direccion") };
  if (id) {
    await apiFetch(`/clientes/${id}`, { method: "PUT", headers: {"Content-Type":"application/json"}, body: JSON.stringify(body) });
  } else {
    await apiFetch(`/clientes`, { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify(body) });
  }
  clienteForm.reset(); loadClientes();
});
document.getElementById("clienteReset").addEventListener("click", ()=> clienteForm.reset());

async function loadClientes(){
  try {
    const rows = await apiFetch("/clientes");
    clientesTbody.innerHTML = "";
    rows.forEach(r=>{
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${r.id}</td><td>${r.nombre}</td><td>${r.telefono||""}</td><td>${r.direccion||""}</td>
        <td class="actions">
          <button class="small" onclick="editCliente(${r.id})">Editar</button>
          <button class="small" onclick="deleteCliente(${r.id})">Eliminar</button>
        </td>`;
      clientesTbody.appendChild(tr);
    });
  } catch(e){ console.error(e); }
}

window.editCliente = async function(id){
  const r = await apiFetch(`/clientes/${id}`);
  clienteForm.elements["id"].value = r.id;
  clienteForm.elements["nombre"].value = r.nombre;
  clienteForm.elements["telefono"].value = r.telefono || "";
  clienteForm.elements["direccion"].value = r.direccion || "";
}

window.deleteCliente = async function(id){
  if(!confirm("Eliminar cliente?")) return;
  await apiFetch(`/clientes/${id}`, { method: "DELETE" });
  loadClientes();
}

/* Excel import clientes */
document.getElementById("importClientes").addEventListener("click", ()=> {
  const f = document.getElementById("clientesFile").files[0];
  if(!f) return alert("Selecciona un archivo");
  readExcelAndPost(f, mapClientesFromRow, "/clientes/batch");
});

/* ---------- Repartidores ---------- */
const repTbody = document.querySelector("#repartidoresTable tbody");
const repForm = document.getElementById("repartidorForm");
repForm.addEventListener("submit", async (e)=> {
  e.preventDefault();
  const fd = new FormData(repForm);
  const id = fd.get("id");
  const body = { nombre: fd.get("nombre"), telefono: fd.get("telefono"), vehiculo: fd.get("vehiculo") };
  if(id) await apiFetch(`/repartidores/${id}`, { method:"PUT", headers:{"Content-Type":"application/json"}, body:JSON.stringify(body) });
  else await apiFetch(`/repartidores`, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(body) });
  repForm.reset(); loadRepartidores();
});
document.getElementById("repartidorReset").addEventListener("click", ()=> repForm.reset());

async function loadRepartidores(){
  const rows = await apiFetch("/repartidores");
  repTbody.innerHTML = "";
  rows.forEach(r=>{
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${r.id}</td><td>${r.nombre}</td><td>${r.telefono||""}</td><td>${r.vehiculo||""}</td>
      <td class="actions">
        <button class="small" onclick="editRepartidor(${r.id})">Editar</button>
        <button class="small" onclick="deleteRepartidor(${r.id})">Eliminar</button>
      </td>`;
    repTbody.appendChild(tr);
  });
  // fill select lists
  fillSelect("repartidor_id", rows);
  fillSelect("repartidor_id", rows, "entrega"); // for entregas form if present
}
window.editRepartidor = async function(id){
  const r = await apiFetch(`/repartidores/${id}`);
  repForm.elements["id"].value = r.id;
  repForm.elements["nombre"].value = r.nombre;
  repForm.elements["telefono"].value = r.telefono || "";
  repForm.elements["vehiculo"].value = r.vehiculo || "";
}
window.deleteRepartidor = async function(id){
  if(!confirm("Eliminar repartidor?")) return;
  await apiFetch(`/repartidores/${id}`, { method:"DELETE" });
  loadRepartidores();
}
document.getElementById("importRepartidores").addEventListener("click", ()=> {
  const f = document.getElementById("repartidoresFile").files[0];
  if(!f) return alert("Selecciona un archivo");
  readExcelAndPost(f, mapRepartidorFromRow, "/repartidores/batch");
});

/* ---------- Pedidos ---------- */
const pedidosTbody = document.querySelector("#pedidosTable tbody");
const pedidoForm = document.getElementById("pedidoForm");
pedidoForm.addEventListener("submit", async (e)=> {
  e.preventDefault();
  const fd = new FormData(pedidoForm);
  const id = fd.get("id");
  const body = {
    cliente_id: fd.get("cliente_id"),
    repartidor_id: fd.get("repartidor_id") || null,
    direccion: fd.get("direccion"),
    descripcion: fd.get("descripcion"),
    estado: fd.get("estado"),
    fecha_entrega: fd.get("fecha_entrega") || null
  };
  if(id) await apiFetch(`/pedidos/${id}`, { method:"PUT", headers:{"Content-Type":"application/json"}, body:JSON.stringify(body) });
  else await apiFetch(`/pedidos`, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(body) });
  pedidoForm.reset(); loadPedidos();
});
document.getElementById("pedidoReset").addEventListener("click", ()=> pedidoForm.reset());

async function loadPedidos(){
  const rows = await apiFetch("/pedidos");
  pedidosTbody.innerHTML = "";
  rows.forEach(p=>{
    const cliente = p.cliente_nombre || "";
    const repart = p.repartidor_nombre || p.repartidor_id || "";
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${p.id}</td><td>${cliente}</td><td>${repart}</td><td>${p.direccion||""}</td><td>${p.estado||""}</td><td>${p.fecha_entrega||""}</td>
      <td class="actions">
        <button class="small" onclick="editPedido(${p.id})">Editar</button>
        <button class="small" onclick="deletePedido(${p.id})">Eliminar</button>
      </td>`;
    pedidosTbody.appendChild(tr);
  });
  // also fill selects
  const clients = await apiFetch("/clientes");
  fillSelect("cliente_id", clients);
  const reps = await apiFetch("/repartidores");
  fillSelect("repartidor_id", reps);
}
window.editPedido = async function(id){
  const p = await apiFetch(`/pedidos/${id}`);
  pedidoForm.elements["id"].value = p.id;
  pedidoForm.elements["cliente_id"].value = p.cliente_id;
  pedidoForm.elements["repartidor_id"].value = p.repartidor_id || "";
  pedidoForm.elements["direccion"].value = p.direccion || "";
  pedidoForm.elements["descripcion"].value = p.descripcion || "";
  pedidoForm.elements["estado"].value = p.estado || "Pendiente";
  pedidoForm.elements["fecha_entrega"].value = p.fecha_entrega ? p.fecha_entrega.split("T")[0] : "";
}
window.deletePedido = async function(id){
  if(!confirm("Eliminar pedido?")) return;
  await apiFetch(`/pedidos/${id}`, { method:"DELETE" });
  loadPedidos();
}
document.getElementById("importPedidos").addEventListener("click", ()=> {
  const f = document.getElementById("pedidosFile").files[0];
  if(!f) return alert("Selecciona un archivo");
  readExcelAndPost(f, mapPedidoFromRow, "/pedidos/batch");
});

/* ---------- Entregas ---------- */
const entregasTbody = document.querySelector("#entregasTable tbody");
const entregaForm = document.getElementById("entregaForm");
entregaForm.addEventListener("submit", async (e)=> {
  e.preventDefault();
  const fd = new FormData(entregaForm);
  const id = fd.get("id");
  const body = {
    pedido_id: fd.get("pedido_id"),
    repartidor_id: fd.get("repartidor_id"),
    fecha_salida: fd.get("fecha_salida") || null,
    fecha_entrega: fd.get("fecha_entrega") || null,
    status: fd.get("status"),
    comentario: fd.get("comentario")
  };
  if(id) await apiFetch(`/entregas/${id}`, { method:"PUT", headers:{"Content-Type":"application/json"}, body:JSON.stringify(body) });
  else await apiFetch(`/entregas`, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(body) });
  entregaForm.reset(); loadEntregas();
});
document.getElementById("entregaReset").addEventListener("click", ()=> entregaForm.reset());

async function loadEntregas(){
  const rows = await apiFetch("/entregas");
  entregasTbody.innerHTML = "";
  rows.forEach(e=>{
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${e.id}</td><td>${e.pedido_id}</td><td>${e.repartidor_id}</td><td>${e.fecha_entrega||""}</td><td>${e.status||""}</td>
      <td class="actions">
        <button class="small" onclick="editEntrega(${e.id})">Editar</button>
        <button class="small" onclick="deleteEntrega(${e.id})">Eliminar</button>
      </td>`;
    entregasTbody.appendChild(tr);
  });
  // fill selects for forms
  const pedidos = await apiFetch("/pedidos");
  fillSelect("pedido_id", pedidos, "entrega");
  const reps = await apiFetch("/repartidores");
  fillSelect("repartidor_id", reps, "entrega");
}
window.editEntrega = async function(id){
  const e = await apiFetch(`/entregas/${id}`);
  entregaForm.elements["id"].value = e.id;
  entregaForm.elements["pedido_id"].value = e.pedido_id;
  entregaForm.elements["repartidor_id"].value = e.repartidor_id;
  entregaForm.elements["fecha_salida"].value = e.fecha_salida ? new Date(e.fecha_salida).toISOString().slice(0,16) : "";
  entregaForm.elements["fecha_entrega"].value = e.fecha_entrega ? new Date(e.fecha_entrega).toISOString().slice(0,16) : "";
  entregaForm.elements["status"].value = e.status || "";
  entregaForm.elements["comentario"].value = e.comentario || "";
}
window.deleteEntrega = async function(id){
  if(!confirm("Eliminar entrega?")) return;
  await apiFetch(`/entregas/${id}`, { method:"DELETE" });
  loadEntregas();
}
document.getElementById("importEntregas").addEventListener("click", ()=> {
  const f = document.getElementById("entregasFile").files[0];
  if(!f) return alert("Selecciona un archivo");
  readExcelAndPost(f, mapEntregaFromRow, "/entregas/batch");
});

/* ---------- Rutas ---------- */
const rutasTbody = document.querySelector("#rutasTable tbody");
const rutaForm = document.getElementById("rutaForm");
rutaForm.addEventListener("submit", async (e)=> {
  e.preventDefault();
  const fd = new FormData(rutaForm);
  const id = fd.get("id");
  const body = {
    repartidor_id: fd.get("repartidor_id"),
    fecha: fd.get("fecha"),
    lista_de_pedidos: fd.get("lista_de_pedidos")
  };
  if(id) await apiFetch(`/rutas/${id}`, { method:"PUT", headers:{"Content-Type":"application/json"}, body:JSON.stringify(body) });
  else await apiFetch(`/rutas`, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(body) });
  rutaForm.reset(); loadRutas();
});
document.getElementById("rutaReset").addEventListener("click", ()=> rutaForm.reset());

async function loadRutas(){
  const rows = await apiFetch("/rutas");
  rutasTbody.innerHTML = "";
  rows.forEach(r=>{
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${r.id}</td><td>${r.repartidor_id}</td><td>${r.fecha||""}</td><td>${r.lista_de_pedidos||""}</td>
      <td class="actions">
        <button class="small" onclick="editRuta(${r.id})">Editar</button>
        <button class="small" onclick="deleteRuta(${r.id})">Eliminar</button>
      </td>`;
    rutasTbody.appendChild(tr);
  });
  const reps = await apiFetch("/repartidores");
  fillSelect("repartidor_id", reps);
}
window.editRuta = async function(id){
  const r = await apiFetch(`/rutas/${id}`);
  rutaForm.elements["id"].value = r.id;
  rutaForm.elements["repartidor_id"].value = r.repartidor_id;
  rutaForm.elements["fecha"].value = r.fecha ? r.fecha.split("T")[0] : "";
  rutaForm.elements["lista_de_pedidos"].value = r.lista_de_pedidos || "";
}
window.deleteRuta = async function(id){
  if(!confirm("Eliminar ruta?")) return;
  await apiFetch(`/rutas/${id}`, { method:"DELETE" });
  loadRutas();
}
document.getElementById("importRutas").addEventListener("click", ()=> {
  const f = document.getElementById("rutasFile").files[0];
  if(!f) return alert("Selecciona un archivo");
  readExcelAndPost(f, mapRutaFromRow, "/rutas/batch");
});

/* ---------- Utility functions ---------- */

function fillSelect(name, rows, formType){
  // find select(s) with given name and fill
  const selects = Array.from(document.querySelectorAll(`select[name="${name}"]`));
  selects.forEach(sel=>{
    // if formType specified, skip selects not intended for this form (we used the same names in multiple forms)
    sel.innerHTML = `<option value="">${sel.options[0]?.text || "Seleccionar"}</option>`;
    rows.forEach(r=>{
      const text = r.nombre || r.id;
      const opt = document.createElement("option"); opt.value = r.id; opt.textContent = text;
      sel.appendChild(opt);
    });
  });
}

async function readExcelAndPost(file, rowMapper, endpoint){
  const data = await file.arrayBuffer();
  const wb = XLSX.read(data);
  const sheetName = wb.SheetNames[0];
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { defval: "" });
  if(!rows.length) return alert("Archivo sin datos");
  // Map and post in batches of 50
  const batch = rows.map(rowMapper).filter(Boolean);
  await apiFetch(endpoint, { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ items: batch }) });
  alert("Importación enviada");
  // refresh all relevant lists
  loadClientes(); loadRepartidores(); loadPedidos(); loadEntregas(); loadRutas();
}

/* Mappers from Excel rows (expect columns matching these keys) */
function mapClientesFromRow(r){ return { nombre: r.Nombre || r.nombre || r.NOMBRE, telefono: r.Telefono || r.telefono || "", direccion: r.Direccion || r.direccion || "" } }
function mapRepartidorFromRow(r){ return { nombre: r.Nombre || r.nombre, telefono: r.Telefono || "", vehiculo: r.Vehiculo || r.vehiculo || "" } }
function mapPedidoFromRow(r){ return {
  cliente_id: r.cliente_id || r.ClienteID || r.Cliente || "",
  repartidor_id: r.repartidor_id || "",
  direccion: r.Direccion || r.direccion || "",
  descripcion: r.Descripcion || r.descripcion || "",
  estado: r.Estado || "Pendiente",
  fecha_entrega: r.Fecha || r.fecha_entrega || null
}}
function mapEntregaFromRow(r){ return {
  pedido_id: r.pedido_id || r.PedidoID || "",
  repartidor_id: r.repartidor_id || r.RepartidorID || "",
  fecha_salida: r.fecha_salida || "",
  fecha_entrega: r.fecha_entrega || "",
  status: r.status || r.Status || "",
  comentario: r.comentario || ""
}}
function mapRutaFromRow(r){ return {
  repartidor_id: r.repartidor_id || r.RepartidorID || "",
  fecha: r.fecha || "",
  lista_de_pedidos: r.lista_de_pedidos || r.Lista || ""
}}

/* ---------- Init ---------- */
window.addEventListener("DOMContentLoaded", ()=> {
  loadClientes();
  loadRepartidores();
  // default tab Clientes is loaded
});
