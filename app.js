// --- CONFIGURACIÓN E INICIALIZACIÓN ---
document.addEventListener("DOMContentLoaded", () => {
    // Establecer la fecha actual en la cabecera de la ficha
    const fechaActual = new Date().toLocaleDateString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
    document.getElementById("view-fecha").innerText = fechaActual;

    // Escuchadores reactivos para los campos del formulario
    setupReactiveInput("input-maquina", "view-maquina");
    setupReactiveInput("input-codigo", "view-codigo");
    setupReactiveInput("input-autor", "view-autor");

    // Cargar datos almacenados o inicializar con ejemplos de planta
    loadLotoData();
});

// Estado global de los puntos LOTO de la máquina
let pointsList = [];

// Enlaza campos del formulario con el documento final de forma inmediata
function setupReactiveInput(inputId, viewId) {
    const inputEl = document.getElementById(inputId);
    inputEl.addEventListener("input", (e) => {
        document.getElementById(viewId).innerText = e.target.value || "-";
        saveToLocalStorage();
    });
}

// Carga inicial de datos desde LocalStorage o Mock predeterminado para Cerámica Mayor
function loadLotoData() {
    const savedData = localStorage.getItem("cm_loto_data");
    const savedMeta = localStorage.getItem("cm_loto_meta");

    if (savedData) {
        pointsList = JSON.parse(savedData);
    } else {
        // Datos por defecto iniciales (Caso: Línea de trinchado/apilado)
        pointsList = [
            { tipo: "electrica", elemento: "Interruptor General Armario Rittal Q1", ubicacion: "Cabecera de Línea - Zona 1" },
            { tipo: "neumatica", elemento: "Válvula de Corte Manual con Candado V-01", ubicacion: "Entrada del Regulador Neumático - Apilador" }
        ];
    }

    if (savedMeta) {
        const meta = JSON.parse(savedMeta);
        document.getElementById("input-maquina").value = meta.maquina || "";
        document.getElementById("input-codigo").value = meta.codigo || "";
        document.getElementById("input-autor").value = meta.autor || "";
        
        document.getElementById("view-maquina").innerText = meta.maquina || "-";
        document.getElementById("view-codigo").innerText = meta.codigo || "-";
        document.getElementById("view-autor").innerText = meta.autor || "-";
    }

    renderApp();
}

// Guarda de forma transparente el progreso en la caché local del navegador
function saveToLocalStorage() {
    localStorage.setItem("cm_loto_data", JSON.stringify(pointsList));
    
    const meta = {
        maquina: document.getElementById("input-maquina").value,
        codigo: document.getElementById("input-codigo").value,
        autor: document.getElementById("input-autor").value
    };
    localStorage.setItem("cm_loto_meta", JSON.stringify(meta));
}

// Renderiza simultáneamente la tabla del formulario y la vista de impresión
function renderApp() {
    renderEditorTable();
    renderPrintTable();
}

// Genera el panel de edición (Formulario)
function renderEditorTable() {
    const tbody = document.getElementById("editor-points-body");
    tbody.innerHTML = "";

    pointsList.forEach((pt, index) => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>
                <select onchange="updatePoint(${index}, 'tipo', this.value)">
                    <option value="electrica" ${pt.tipo === 'electrica' ? 'selected' : ''}>⚡ Eléctrica</option>
                    <option value="neumatica" ${pt.tipo === 'neumatica' ? 'selected' : ''}>💨 Neumática</option>
                    <option value="hidraulica" ${pt.tipo === 'hidraulica' ? 'selected' : ''}>💧 Hidráulica</option>
                    <option value="termica" ${pt.tipo === 'termica' ? 'selected' : ''}>🔥 Térmica</option>
                    <option value="quimica" ${pt.tipo === 'quimica' ? 'selected' : ''}>🧪 Química</option>
                </select>
            </td>
            <td>
                <input type="text" value="${pt.elemento}" placeholder="Ej: Magnetotérmico Q1" oninput="updatePoint(${index}, 'elemento', this.value)">
            </td>
            <td>
                <input type="text" value="${pt.ubicacion}" placeholder="Ej: Cuadro Principal" oninput="updatePoint(${index}, 'ubicacion', this.value)">
            </td>
            <td style="text-align: center;">
                <button type="button" class="btn btn-danger" onclick="deletePointRow(${index})">X</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Genera la tabla limpia del documento DIN A4 que se imprimirá o guardará en PDF
function renderPrintTable() {
    const tbody = document.getElementById("view-points-body");
    tbody.innerHTML = "";

    if (pointsList.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:#94a3b8;">No se han definido puntos de corte de seguridad.</td></tr>`;
        return;
    }

    pointsList.forEach((pt, index) => {
        const row = document.createElement("tr");
        
        // Mapear nombres técnicos y clases CSS según el tipo de energía
        let energyName = pt.tipo;
        if(pt.tipo === 'electrica') energyName = '⚡ Eléctrica';
        if(pt.tipo === 'neumatica') energyName = '💨 Neumática';
        if(pt.tipo === 'hidraulica') energyName = '💧 Hidráulica';
        if(pt.tipo === 'termica') energyName = '🔥 Térmica';
        if(pt.tipo === 'quimica') energyName = '🧪 Química';

        row.innerHTML = `
            <td style="text-align: center; font-weight: bold; background-color: #f8fafc;">
                ${index + 1}
            </td>
            <td>
                <span class="badge-energy energy-${pt.tipo}">
                    ${energyName}
                </span>
            </td>
            <td style="font-weight: 600;">
                ${pt.elemento || "-"}
            </td>
            <td>
                ${pt.ubicacion || "-"}
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Añade una nueva fila limpia
function addPointRow() {
    pointsList.push({ tipo: "electrica", elemento: "", ubicacion: "" });
    renderApp();
    saveToLocalStorage();
}

// Actualiza en tiempo real los valores cambiados en el formulario
function updatePoint(index, field, value) {
    pointsList[index][field] = value;
    renderPrintTable(); // Actualiza el documento sin redibujar el formulario para mantener el foco del teclado
    saveToLocalStorage();
}

// Elimina un punto del listado
function deletePointRow(index) {
    pointsList.splice(index, 1);
    renderApp();
    saveToLocalStorage();
}
