// ==UserScript==
// @name         Grepolis - Gestor de Tiempos del Senado
// @namespace    http://tampermonkey.net/
// @version      8.18
// @description  alarma de cola de construcción versión 8.18 con nombres limpios (ej. 001) y contador en el menú desplegable
// @author       Gabiotaz
// @match        https://*.grepolis.com/game/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // 1. Estilos CSS adaptados
    const css = `
        #grepo-alarm-btn {
            position: fixed;
            right: 0;
            bottom: 25px;
            width: 42px;
            height: 42px;
            background: linear-gradient(to bottom, #d5b16e, #8c6a28);
            color: #fff;
            border: 2px solid #5a3d0d;
            border-radius: 6px 0 0 6px;
            font-size: 26px;
            font-weight: bold;
            cursor: pointer;
            z-index: 99999;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: -3px 2px 6px rgba(0,0,0,0.6);
            transition: width 0.2s;
        }
        #grepo-alarm-btn:hover {
            width: 50px;
            background: linear-gradient(to bottom, #e3c485, #9e7832);
        }
        #grepo-modal {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 490px;
            background: #f4e4bc;
            border: 3px solid #7d5a3c;
            border-radius: 8px;
            box-shadow: 0 0 25px rgba(0,0,0,0.8);
            z-index: 100000;
            font-family: Arial, sans-serif;
            color: #333;
            display: none;
            padding: 15px;
            box-sizing: border-box;
        }
        #grepo-modal h2 {
            margin-top: 0;
            color: #5a3d0d;
            font-size: 15px;
            border-bottom: 2px solid #c7b288;
            padding-bottom: 6px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        #grepo-modal .close-modal {
            background: #a93226;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            padding: 2px 8px;
            font-size: 13px;
        }
        .grepo-section {
            margin-bottom: 12px;
        }
        .grepo-btn {
            background: #7d5a3c;
            color: white;
            border: 1px solid #5a3d0d;
            padding: 6px 10px;
            border-radius: 4px;
            cursor: pointer;
            font-weight: bold;
            font-size: 13px;
        }
        .grepo-btn:hover {
            background: #5a3d0d;
        }
        #grepo-empire-container {
            display: flex;
            gap: 6px;
            align-items: center;
            margin-bottom: 8px;
        }
        #grepo-city-select {
            flex: 1;
            padding: 6px;
            border: 1px solid #c7b288;
            border-radius: 4px;
            background: #fff;
            font-size: 13px;
            font-weight: bold;
            color: #5a3d0d;
        }
        #grepo-timers-list {
            max-height: 220px;
            overflow-y: auto;
            border: 1px solid #c7b288;
            background: #fff;
            padding: 6px;
            border-radius: 4px;
        }
        .grepo-timer-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 5px 6px;
            border-bottom: 1px solid #f0f0f0;
            font-size: 13px;
        }
        .grepo-timer-item.active-building {
            background: #fef9e7;
            border-left: 3px solid #f39c12;
        }
        .grepo-timer-item:last-child {
            border-bottom: none;
        }
        .grepo-level-badge {
            background: #000000;
            color: #00ff00;
            padding: 1px 5px;
            border-radius: 3px;
            font-family: monospace;
            font-weight: bold;
            font-size: 11px;
            display: inline-block;
            white-space: nowrap;
        }
        .grepo-input-group {
            display: flex;
            gap: 4px;
            margin-top: 6px;
            align-items: center;
            width: 100%;
            box-sizing: border-box;
        }
        #grepo-building-name {
            flex: 1;
            min-width: 90px;
            padding: 5px;
            border: 1px solid #c7b288;
            border-radius: 3px;
            font-size: 12px;
        }
        .time-input {
            width: 35px !important;
            flex: 0 0 35px !important;
            text-align: center;
            padding: 5px 1px;
            border: 1px solid #c7b288;
            border-radius: 3px;
            font-size: 12px;
        }
        #grepo-stop-alarm {
            background: #c0392b;
            color: white;
            width: 100%;
            padding: 10px;
            font-size: 14px;
            font-weight: bold;
            border: 2px dashed #ffeaa7;
            border-radius: 6px;
            cursor: pointer;
            margin-bottom: 10px;
            display: none;
            animation: pulse-alarm 1s infinite;
            text-align: center;
        }
        #grepo-next-alarm-summary {
            background: #fef9e7;
            border: 1px dashed #d5b16e;
            border-radius: 6px;
            padding: 8px 10px;
            font-size: 12px;
            color: #5a3d0d;
            display: flex;
            flex-direction: column;
            gap: 2px;
        }
        @keyframes pulse-alarm {
            0% { transform: scale(1); }
            50% { transform: scale(1.02); background: #e74c3c; }
            100% { transform: scale(1); }
        }
    `;

    const styleNode = document.createElement('style');
    styleNode.innerHTML = css;
    document.head.appendChild(styleNode);

    // 2. Estructura HTML de la interfaz
    const html = `
        <div id="grepo-alarm-btn" title="Gestor de Tiempos del Senado">+</div>
        <div id="grepo-modal">
            <h2>
                <span>🏛️ Gestor de Tiempos Grepolis</span>
                <div style="display: flex; gap: 6px; align-items: center;">
                    <button class="grepo-btn" id="grepo-mute-all" style="padding: 3px 8px; font-size: 11px;">🔔 Activadas</button>
                    <button class="close-modal" id="grepo-close">X</button>
                </div>
            </h2>
            <button id="grepo-stop-alarm">🛑 ¡APAGAR ALARMA ACTIVADA!</button>
            
            <div class="grepo-section">
                <strong>Seleccionar Ciudad:</strong>
                <div id="grepo-empire-container">
                    <select id="grepo-city-select"></select>
                    <button class="grepo-btn" id="grepo-rename-city" style="background: #2980b9; padding: 6px 10px;" title="Renombrar ciudad actual">✏️</button>
                    <button class="grepo-btn" id="grepo-delete-city" style="background: #a93226; padding: 6px 10px;" title="Borrar ciudad actual">🗑️</button>
                </div>
            </div>

            <div class="grepo-section">
                <strong>Tipo de Sonido de Alarma:</strong>
                <select id="grepo-sound-select" style="width: 100%; padding: 5px; margin-top: 4px; border: 1px solid #c7b288; border-radius: 3px; background: #fff; font-size: 12px;">
                    <option value="1">1. Tono Clásico (Suave)</option>
                    <option value="2">2. Tono Agudo (Campana)</option>
                    <option value="3">3. Alerta Fuerte (Pulso)</option>
                    <option value="4">4. La Cucaracha</option>
                    <option value="5">5. Alarma de Auto</option>
                    <option value="6">6. Grillo</option>
                    <option value="7">7. Campanas</option>
                    <option value="8">8. Sonido de Guerra</option>
                    <option value="9">9. Sonido de Celular</option>
                    <option value="10">10. Sirena de Policía</option>
                </select>
            </div>
            <div class="grepo-section">
                <button class="grepo-btn" id="grepo-sync" style="width: 100%;">🔄 Sincronizar Senado</button>
            </div>
            <div class="grepo-section">
                <strong id="grepo-current-city-label">Cola de construcción:</strong>
                <div id="grepo-timers-list" style="margin-top: 4px;">
                    <!-- Los casilleros se renderizan dinámicamente -->
                </div>
                <div style="margin-top: 5px; display: flex; justify-content: flex-start;">
                    <button class="grepo-btn" id="grepo-sub-update-btn" style="background: #2980b9; padding: 3px 8px; font-size: 11px;">Actualizar</button>
                </div>
            </div>
            <div class="grepo-section" style="margin-bottom: 0;">
                <strong>Agregar manual a esta ciudad:</strong>
                <div class="grepo-input-group">
                    <input type="text" id="grepo-building-name" placeholder="Edificio (ej. Senado Nivel 5)">
                    <input type="text" class="time-input" id="grepo-h" placeholder="HH" maxlength="2">
                    <input type="text" class="time-input" id="grepo-m" placeholder="MM" maxlength="2">
                    <input type="text" class="time-input" id="grepo-s" placeholder="SS" maxlength="2">
                    <button class="grepo-btn" id="grepo-add-btn">Añadir</button>
                </div>
            </div>

            <div class="grepo-section" style="margin-top: 12px; margin-bottom: 0;">
                <div id="grepo-next-alarm-summary">
                    <strong>⏳ Próxima alarma en sonar:</strong>
                    <span id="grepo-summary-text" style="font-weight: bold; color: #8c6a28;">Buscando alarmas...</span>
                </div>
            </div>
        </div>
    `;

    const container = document.createElement('div');
    container.innerHTML = html;
    document.body.appendChild(container);

    // 3. Estado y Persistencia
    let cities = JSON.parse(localStorage.getItem('grepo_senate_cities_v86') || '[]');
    let activeCityId = localStorage.getItem('grepo_active_city_v86') || null;
    let selectedSound = localStorage.getItem('grepo_selected_sound_v86') || '1';
    let globalMuted = JSON.parse(localStorage.getItem('grepo_global_muted_v86') || 'false');
    let isAlarmRinging = false;
    let alarmIntervalId = null;
    let lastTriggeredCityId = null;
    let lastTimestamp = Date.now();

    const btnOpen = document.getElementById('grepo-alarm-btn');
    const modal = document.getElementById('grepo-modal');
    const btnClose = document.getElementById('grepo-close');
    const btnMuteAll = document.getElementById('grepo-mute-all');
    const btnAdd = document.getElementById('grepo-add-btn');
    const btnSync = document.getElementById('grepo-sync');
    const btnSubUpdate = document.getElementById('grepo-sub-update-btn');
    const btnDeleteCity = document.getElementById('grepo-delete-city');
    const btnRenameCity = document.getElementById('grepo-rename-city');
    const btnStopAlarm = document.getElementById('grepo-stop-alarm');
    const soundSelect = document.getElementById('grepo-sound-select');
    const citySelect = document.getElementById('grepo-city-select');
    const timersList = document.getElementById('grepo-timers-list');
    const currentCityLabel = document.getElementById('grepo-current-city-label');
    const summaryText = document.getElementById('grepo-summary-text');

    soundSelect.value = selectedSound;

    function updateMuteButtonUI() {
        if (globalMuted) {
            btnMuteAll.style.background = '#c0392b';
            btnMuteAll.innerText = '🔕 Silenciadas';
            btnMuteAll.title = 'Todas las alarmas están silenciadas. Clic para activar.';
        } else {
            btnMuteAll.style.background = '#27ae60';
            btnMuteAll.innerText = '🔔 Activadas';
            btnMuteAll.title = 'Alarmas activas. Clic para silenciar todas.';
        }
    }
    updateMuteButtonUI();

    btnMuteAll.addEventListener('click', () => {
        globalMuted = !globalMuted;
        localStorage.setItem('grepo_global_muted_v86', JSON.stringify(globalMuted));
        if (globalMuted && isAlarmRinging) {
            stopAlarmAndAdvanceQueue();
        }
        updateMuteButtonUI();
    });

    soundSelect.addEventListener('change', (e) => {
        selectedSound = e.target.value;
        localStorage.setItem('grepo_selected_sound_v86', selectedSound);
        if (!globalMuted) {
            playSingleSound(selectedSound);
        }
    });

    btnOpen.addEventListener('click', () => {
        modal.style.display = modal.style.display === 'block' ? 'none' : 'block';
        renderUI();
    });

    btnClose.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    btnStopAlarm.addEventListener('click', () => {
        stopAlarmAndAdvanceQueue();
    });

    // Lógica inteligente para el botón Actualizar
    btnSubUpdate.addEventListener('click', () => {
        const currentCity = getActiveCity();
        if (!currentCity) {
            alert('⚠️ Selecciona o sincroniza una ciudad primero.');
            return;
        }

        const activeWindows = document.querySelectorAll('.ui_window, .gpwindow_content, .window_content');
        if (activeWindows.length === 0) {
            alert('⚠️ Debes abrir la ventana del Senado dentro del juego para poder actualizar.');
            return;
        }

        let foundOrders = [];
        activeWindows.forEach(win => {
            const allElements = win.querySelectorAll('*');
            allElements.forEach(el => {
                if (el.children.length === 0) {
                    const text = el.innerText ? el.innerText.trim() : '';
                    if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(text)) {
                        const seconds = parseTimeString(text);
                        if (seconds > 5) {
                            let buildingName = `Construcción`;
                            let buildingLevel = "";
                            let parent = el.closest('div, li, tr');
                            
                            if (parent) {
                                let blockText = parent.innerText;
                                let lines = blockText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
                                
                                for (let line of lines) {
                                    if (line === text) continue;
                                    if (/nivel|niv|lvl|senado|cantera|aserradero|muralla|mercado|puerto|cuartel|templo|estatua|torre|teatro|termas|faro|biblioteca|granja|almacén|mina/i.test(line)) {
                                        let parsed = parseBuildingInfoText(line);
                                        buildingName = parsed.name;
                                        buildingLevel = parsed.level;
                                        break;
                                    }
                                }
                                
                                if (buildingName === `Construcción` && lines.length > 0) {
                                    for (let line of lines) {
                                        if (line !== text && !/^\d+$/.test(line)) {
                                            let parsed = parseBuildingInfoText(line);
                                            buildingName = parsed.name;
                                            buildingLevel = parsed.level;
                                            break;
                                        }
                                    }
                                }
                            }

                            if (!foundOrders.some(o => o.remaining === seconds)) {
                                foundOrders.push({ name: buildingName, level: buildingLevel, remaining: seconds, paused: false });
                            }
                        }
                    }
                }
            });
        });

        if (foundOrders.length === 0) {
            alert('⚠️ No se detectaron temporizadores en la ventana del Senado.');
            return;
        }

        let activeTimer = currentCity.timers.length > 0 ? currentCity.timers[0] : null;
        let existingTimers = currentCity.timers.slice(1);
        let newScannedOrders = foundOrders.slice(1);

        let addedCount = 0;
        newScannedOrders.forEach(newOrder => {
            let exists = existingTimers.some(t => t.remaining === newOrder.remaining || (t.name === newOrder.name && t.level === newOrder.level));
            if (!exists) {
                existingTimers.push(newOrder);
                addedCount++;
            }
        });

        let updatedTimers = [];
        if (activeTimer) {
            updatedTimers.push(activeTimer);
        } else if (foundOrders.length > 0) {
            updatedTimers.push(foundOrders[0]);
            existingTimers = foundOrders.slice(1);
        }
        updatedTimers = updatedTimers.concat(existingTimers);

        currentCity.timers = updatedTimers;
        saveState();
        renderUI();
        alert(`¡Actualización exitosa para esta ciudad! Se añadieron ${addedCount} nuevos edificios.`);
    });

    citySelect.addEventListener('change', (e) => {
        activeCityId = e.target.value;
        saveState();
        renderUI();
    });

    function saveState() {
        cities.sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true, sensitivity: 'base' }));
        localStorage.setItem('grepo_senate_cities_v86', JSON.stringify(cities));
        localStorage.setItem('grepo_active_city_v86', activeCityId || '');
    }

    function getActiveCity() {
        return cities.find(c => c.id === activeCityId);
    }

    function secondsToTime(totalSeconds) {
        if (totalSeconds <= 0) return '00:00:00';
        const h = Math.floor(totalSeconds / 3600);
        const m = Math.floor((totalSeconds % 3600) / 60);
        const s = totalSeconds % 60;
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }

    function updateNextAlarmSummary() {
        if (!summaryText) return;
        let closestTime = Infinity;
        let closestCityName = '';

        cities.forEach(city => {
            if (city.timers.length > 0) {
                let firstTimer = city.timers[0];
                if (firstTimer && firstTimer.remaining > 0 && !firstTimer.paused) {
                    if (firstTimer.remaining < closestTime) {
                        closestTime = firstTimer.remaining;
                        closestCityName = city.id;
                    }
                }
            }
        });

        if (closestTime === Infinity) {
            summaryText.innerText = 'No hay alarmas activas en este momento.';
        } else {
            summaryText.innerText = `Ciudad ${closestCityName} (Faltan ${secondsToTime(closestTime)})`;
        }
    }

    function renderUI() {
        saveState();
        citySelect.innerHTML = '';
        
        if (cities.length === 0) {
            const opt = document.createElement('option');
            opt.value = '';
            opt.innerText = 'No hay ciudades sincronizadas';
            citySelect.appendChild(opt);
            
            timersList.innerHTML = '';
            for (let i = 0; i < 7; i++) {
                const emptyItem = document.createElement('div');
                emptyItem.className = 'grepo-timer-item';
                emptyItem.style.color = '#888';
                emptyItem.style.fontStyle = 'italic';
                emptyItem.innerHTML = `<div style="flex: 1; padding: 4px; font-size: 12px;">#${i + 1} - Casillero vacío</div>`;
                timersList.appendChild(emptyItem);
            }

            currentCityLabel.innerText = 'Cola de construcción:';
            updateNextAlarmSummary();
            return;
        }

        if (!activeCityId || !cities.some(c => c.id === activeCityId)) {
            activeCityId = cities[0].id;
        }

        cities.forEach(city => {
            const opt = document.createElement('option');
            opt.value = city.id;
            const count = city.timers.length;
            opt.innerText = `${city.id} (${count} edificio${count === 1 ? '' : 's'})`;
            if (city.id === activeCityId) opt.selected = true;
            citySelect.appendChild(opt);
        });

        const currentCity = getActiveCity();
        if (!currentCity) return;

        currentCityLabel.innerText = `Cola de construcción (${currentCity.id}):`;

        timersList.innerHTML = '';
        
        for (let i = 0; i < 7; i++) {
            const t = currentCity.timers[i];
            const item = document.createElement('div');

            if (t) {
                item.className = 'grepo-timer-item' + (i === 0 && !t.paused ? ' active-building' : '');
                
                let statusText = i === 0 ? (t.paused ? '⏸ Pausado' : '⏳ En construcción') : 'En espera';
                if (t.remaining <= 0) statusText = '✅ ¡Completado!';

                const refreshBtn = (i === 0) ? `<button class="grepo-btn grepo-row-refresh-btn" style="background: #2980b9; padding: 4px 7px; font-size: 11px;" title="Refrescar tiempo con el Senado">🔄</button>` : '';
                const levelBadge = t.level ? `<span class="grepo-level-badge">Niv. ${t.level}</span>` : '';

                item.innerHTML = `
                    <div style="flex: 1; min-width: 0; padding-right: 5px; display: flex; align-items: center; gap: 6px;">
                        <span style="font-weight: bold; color: #5a3d0d; white-space: nowrap;">#${i + 1}</span>
                        ${levelBadge}
                        <div style="min-width: 0; flex: 1;">
                            <strong>${t.name}</strong> <span style="font-size: 11px; color: #666;">(${statusText})</span><br>
                            <span class="countdown-display" data-index="${i}" style="color: ${t.remaining <= 0 ? '#c0392b' : '#27ae60'}; font-weight: bold; font-size: 14px;">
                                ${secondsToTime(t.remaining)}
                            </span>
                        </div>
                    </div>
                    <div style="display: flex; gap: 4px; align-items: center; flex-shrink: 0;">
                        ${refreshBtn}
                        <button class="grepo-btn grepo-row-pause-btn" data-index="${i}" style="background: ${t.paused ? '#27ae60' : '#d68910'}; padding: 4px 7px; font-size: 11px;" title="${t.paused ? 'Reanudar' : 'Pausar'}">${t.paused ? '▶' : '⏸'}</button>
                        <button class="grepo-btn grepo-delete-btn" data-index="${i}" style="background: #a93226; padding: 4px 7px; font-size: 11px;" title="Borrar">🗑️</button>
                    </div>
                `;
            } else {
                item.className = 'grepo-timer-item';
                item.style.color = '#888';
                item.style.fontStyle = 'italic';
                item.innerHTML = `
                    <div style="flex: 1; padding: 4px; font-size: 12px;">
                        #${i + 1} - Casillero vacío
                    </div>
                `;
            }
            timersList.appendChild(item);
        }

        document.querySelectorAll('.grepo-row-refresh-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const activeWindows = document.querySelectorAll('.ui_window, .gpwindow_content, .window_content');
                if (activeWindows.length === 0) {
                    alert('⚠️ Debes abrir la ventana del Senado dentro del juego para poder refrescar el tiempo.');
                    return;
                }

                let foundSeconds = null;
                activeWindows.forEach(win => {
                    if (foundSeconds !== null) return;
                    const allElements = win.querySelectorAll('*');
                    for (let el of allElements) {
                        if (el.children.length === 0) {
                            const text = el.innerText ? el.innerText.trim() : '';
                            if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(text)) {
                                foundSeconds = parseTimeString(text);
                                break;
                            }
                        }
                    }
                });

                if (foundSeconds !== null && foundSeconds > 0) {
                    currentCity.timers[0].remaining = foundSeconds;
                    saveState();
                    renderUI();
                } else {
                    alert('⚠️ No se detectó un temporizador activo en la ventana del Senado abierta.');
                }
            });
        });

        document.querySelectorAll('.grepo-row-pause-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = parseInt(e.currentTarget.getAttribute('data-index'));
                if (currentCity.timers[idx]) {
                    currentCity.timers[idx].paused = !currentCity.timers[idx].paused;
                    saveState();
                    renderUI();
                }
            });
        });

        document.querySelectorAll('.grepo-delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = parseInt(e.currentTarget.getAttribute('data-index'));
                currentCity.timers.splice(idx, 1);
                saveState();
                renderUI();
            });
        });

        updateNextAlarmSummary();
    }

    btnRenameCity.addEventListener('click', () => {
        const currentCity = getActiveCity();
        if (!currentCity) return;

        const newNameInput = prompt(`Introduce un nuevo nombre para la ciudad:`, currentCity.id);
        if (newNameInput && newNameInput.trim() !== '') {
            let baseName = newNameInput.trim();
            let finalName = baseName;
            let counter = 1;

            while (cities.some(c => c.id === finalName && c.id !== currentCity.id)) {
                finalName = `${baseName}.${counter}`;
                counter++;
            }

            currentCity.id = finalName;
            activeCityId = finalName;
            saveState();
            renderUI();
        }
    });

    btnDeleteCity.addEventListener('click', () => {
        if (!activeCityId) return;
        if (confirm(`¿Estás seguro de borrar la ciudad "${activeCityId}" y todos sus tiempos?`)) {
            cities = cities.filter(c => c.id !== activeCityId);
            activeCityId = cities.length > 0 ? cities[0].id : null;
            saveState();
            renderUI();
        }
    });

    btnAdd.addEventListener('click', () => {
        const currentCity = getActiveCity();
        if (!currentCity) {
            alert('Sincroniza o selecciona una ciudad primero.');
            return;
        }

        const nameInput = document.getElementById('grepo-building-name');
        const hInput = document.getElementById('grepo-h');
        const mInput = document.getElementById('grepo-m');
        const sInput = document.getElementById('grepo-s');

        let rawInputText = nameInput.value.trim();
        const h = parseInt(hInput.value) || 0;
        const m = parseInt(mInput.value) || 0;
        const s = parseInt(sInput.value) || 0;

        if (!rawInputText) {
            alert('Por favor, introduce el nombre del edificio.');
            return;
        }

        const totalSeconds = h * 3600 + m * 60 + s;
        if (totalSeconds <= 0) {
            alert('Por favor, introduce un tiempo válido mayor a 0.');
            return;
        }

        let parsed = parseBuildingInfoText(rawInputText);

        currentCity.timers.push({ name: parsed.name, level: parsed.level, remaining: totalSeconds, paused: false });
        saveState();
        renderUI();

        nameInput.value = '';
        hInput.value = '';
        mInput.value = '';
        sInput.value = '';
    });

    function parseBuildingInfoText(text) {
        let name = text;
        let level = "";
        
        text = text.replace(/[\n\r]+/g, ' ').trim();
        
        const explicitMatch = text.match(/(?:nivel|niv\.?|lvl|level)\s*(\d+)/i);
        const parenMatch = text.match(/\((\d+)\)$/);
        
        if (explicitMatch) {
            level = explicitMatch[1];
            name = text.replace(/(?:nivel|niv\.?|lvl|level)\s*\d+/i, '').replace(/[()]/g, '').trim();
        } else if (parenMatch) {
            let num = parseInt(parenMatch[1]);
            if (num > 0 && num <= 50) {
                level = parenMatch[1];
                name = text.replace(/\(\d+\)$/, '').trim();
            }
        }
        
        name = name.replace(/[-–—]\s*\d+$/, '').replace(/[-–—]\s*$/, '').trim();
        if (!name || /^\d+$/.test(name)) name = "Construcción";
        return { name, level };
    }

    btnSync.addEventListener('click', () => {
        const activeWindows = document.querySelectorAll('.ui_window, .gpwindow_content, .window_content');
        
        if (activeWindows.length === 0) {
            alert('⚠️ Debes abrir la ventana del Senado dentro del juego para poder sincronizar.');
            return;
        }

        let foundOrders = [];

        activeWindows.forEach(win => {
            const allElements = win.querySelectorAll('*');
            allElements.forEach(el => {
                if (el.children.length === 0) {
                    const text = el.innerText ? el.innerText.trim() : '';
                    if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(text)) {
                        const seconds = parseTimeString(text);
                        if (seconds > 5) {
                            let buildingName = `Construcción`;
                            let buildingLevel = "";
                            let parent = el.closest('div, li, tr');
                            
                            if (parent) {
                                let blockText = parent.innerText;
                                let lines = blockText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
                                
                                for (let line of lines) {
                                    if (line === text) continue;
                                    if (/nivel|niv|lvl|senado|cantera|aserradero|muralla|mercado|puerto|cuartel|templo|estatua|torre|teatro|termas|faro|biblioteca|granja|almacén|mina/i.test(line)) {
                                        let parsed = parseBuildingInfoText(line);
                                        buildingName = parsed.name;
                                        buildingLevel = parsed.level;
                                        break;
                                    }
                                }
                                
                                if (buildingName === `Construcción` && lines.length > 0) {
                                    for (let line of lines) {
                                        if (line !== text && !/^\d+$/.test(line)) {
                                            let parsed = parseBuildingInfoText(line);
                                            buildingName = parsed.name;
                                            buildingLevel = parsed.level;
                                            break;
                                        }
                                    }
                                }
                            }

                            if (!foundOrders.some(o => o.remaining === seconds)) {
                                foundOrders.push({ name: buildingName, level: buildingLevel, remaining: seconds, paused: false });
                            }
                        }
                    }
                }
            });
        });

        if (foundOrders.length > 0) {
            let maxNum = 0;
            cities.forEach(c => {
                const match = c.id.match(/^(\d+)/);
                if (match) {
                    const num = parseInt(match[1], 10);
                    if (num > maxNum) maxNum = num;
                }
            });
            const nextNum = maxNum + 1;

            let newCityId = String(nextNum).padStart(3, '0');
            let counter = 1;
            while (cities.some(c => c.id === newCityId)) {
                newCityId = `${String(nextNum).padStart(3, '0')}.${counter}`;
                counter++;
            }

            cities.push({ id: newCityId, timers: foundOrders });
            activeCityId = newCityId;
            saveState();
            renderUI();
            alert(`¡Sincronización exitosa! Se guardó la ciudad "${newCityId}" con ${foundOrders.length} temporizadores.`);
        } else {
            alert('⚠️ No se detectaron temporizadores activos en las ventanas abiertas.');
        }
    });

    function parseTimeString(str) {
        const parts = str.replace(/[^\d:]/g, '').split(':').map(Number);
        if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
        if (parts.length === 2) return parts[0] * 60 + parts[1];
        if (parts.length === 1 && !isNaN(parts[0])) return parts[0];
        return 0;
    }

    setInterval(() => {
        const nowTime = Date.now();
        const elapsedSeconds = Math.floor((nowTime - lastTimestamp) / 1000);

        if (elapsedSeconds <= 0) return;
        
        lastTimestamp += (elapsedSeconds * 1000);

        if (cities.length === 0) return;

        let alarmTriggered = false;
        let cityObjFound = null;
        let activeTimer = null;

        for (let i = 0; i < cities.length; i++) {
            let city = cities[i];
            if (city.timers.length > 0) {
                let timer = city.timers[0];
                if (timer && timer.remaining > 0 && !timer.paused) {
                    timer.remaining -= elapsedSeconds;
                    if (timer.remaining < 0) timer.remaining = 0;

                    if ((timer.remaining === 300 || timer.remaining <= 0) && !alarmTriggered && !globalMuted) {
                        alarmTriggered = true;
                        cityObjFound = city;
                        activeTimer = timer;
                    }
                }
            }
        }

        saveState();

        if (alarmTriggered && cityObjFound && activeTimer && !globalMuted) {
            lastTriggeredCityId = cityObjFound.id;
            let timeMsg = activeTimer.remaining <= 0 ? 'Finalizado' : 'Faltan 5 min';
            triggerContinuousAlarm(cityObjFound.id, activeTimer.name, timeMsg);
        }

        if (modal.style.display === 'block') {
            const currentCity = getActiveCity();
            if (currentCity) {
                document.querySelectorAll('.countdown-display').forEach(el => {
                    const idx = parseInt(el.getAttribute('data-index'));
                    if (currentCity.timers[idx]) {
                        el.innerText = secondsToTime(currentCity.timers[idx].remaining);
                        if (idx === 0) {
                            el.style.color = currentCity.timers[idx].remaining <= 0 ? '#c0392b' : '#27ae60';
                        }
                    }
                });
            }
            updateNextAlarmSummary();
        }
    }, 500);

    function triggerContinuousAlarm(cityName, buildingName, statusMsg) {
        if (isAlarmRinging || globalMuted) return;
        isAlarmRinging = true;

        btnStopAlarm.style.display = 'block';
        btnStopAlarm.innerHTML = `🛑 Ciudad ${cityName} - ${buildingName} (${statusMsg})<br><span style="font-size: 13px; text-decoration: underline;">(Apagar y avanzar)</span>`;
        modal.style.display = 'block';

        playSingleSound(selectedSound);
        alarmIntervalId = setInterval(() => {
            if (globalMuted) {
                stopAlarmAndAdvanceQueue();
                return;
            }
            playSingleSound(selectedSound);
        }, 1300);

        if (Notification && Notification.permission === 'granted' && !globalMuted) {
            new Notification('Grepolis - Alerta', {
                body: `Ciudad ${cityName}: ${buildingName} (${statusMsg}). ¡Haz clic para apagar y avanzar!`,
            });
        }
    }

    function stopAlarmAndAdvanceQueue() {
        isAlarmRinging = false;
        if (alarmIntervalId) {
            clearInterval(alarmIntervalId);
            alarmIntervalId = null;
        }
        btnStopAlarm.style.display = 'none';

        let targetCityId = lastTriggeredCityId || activeCityId;
        let targetCity = cities.find(c => c.id === targetCityId);

        if (targetCity && targetCity.timers.length > 0) {
            targetCity.timers.shift();
        }

        lastTriggeredCityId = null;
        saveState();
        renderUI();
    }

    function playSingleSound(type) {
        if (globalMuted) return;
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const now = ctx.currentTime;

            if (type === '1') {
                const osc = ctx.createOscillator(); const gain = ctx.createGain();
                osc.connect(gain); gain.connect(ctx.destination);
                osc.type = 'sine'; osc.frequency.value = 587.33;
                gain.gain.setValueAtTime(0.5, now);
                osc.start(now); osc.stop(now + 0.5);
            } else if (type === '2') {
                const osc = ctx.createOscillator(); const gain = ctx.createGain();
                osc.connect(gain); gain.connect(ctx.destination);
                osc.type = 'triangle'; osc.frequency.value = 880;
                gain.gain.setValueAtTime(0.5, now);
                osc.start(now); osc.stop(now + 0.3);
            } else if (type === '3') {
                const osc = ctx.createOscillator(); const gain = ctx.createGain();
                osc.connect(gain); gain.connect(ctx.destination);
                osc.type = 'sawtooth'; osc.frequency.value = 440;
                gain.gain.setValueAtTime(0.6, now);
                osc.start(now); osc.stop(now + 0.7);
            } else if (type === '4') {
                const notes = [261.63, 261.63, 261.63, 349.23, 440];
                notes.forEach((freq, i) => {
                    const osc = ctx.createOscillator(); const gain = ctx.createGain();
                    osc.connect(gain); gain.connect(ctx.destination);
                    osc.type = 'sine'; osc.frequency.value = freq;
                    const startTime = now + (i * 0.12);
                    gain.gain.setValueAtTime(0.4, startTime);
                    osc.start(startTime); osc.stop(startTime + 0.1);
                });
            } else if (type === '5') {
                for (let i = 0; i < 3; i++) {
                    const osc = ctx.createOscillator(); const gain = ctx.createGain();
                    osc.connect(gain); gain.connect(ctx.destination);
                    osc.type = 'sawtooth'; osc.frequency.value = 950;
                    const startTime = now + (i * 0.15);
                    gain.gain.setValueAtTime(0.5, startTime);
                    osc.start(startTime); osc.stop(startTime + 0.1);
                }
            } else if (type === '6') {
                for (let i = 0; i < 5; i++) {
                    const osc = ctx.createOscillator(); const gain = ctx.createGain();
                    osc.connect(gain); gain.connect(ctx.destination);
                    osc.type = 'sine'; osc.frequency.value = 4000;
                    const startTime = now + (i * 0.05);
                    gain.gain.setValueAtTime(0.2, startTime);
                    osc.start(startTime); osc.stop(startTime + 0.03);
                }
            } else if (type === '7') {
                [523.25, 783.99].forEach((freq) => {
                    const osc = ctx.createOscillator(); const gain = ctx.createGain();
                    osc.connect(gain); gain.connect(ctx.destination);
                    osc.type = 'sine'; osc.frequency.value = freq;
                    gain.gain.setValueAtTime(0.5, now);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
                    osc.start(now); osc.stop(now + 0.8);
                });
            } else if (type === '8') {
                const notes = [330, 392, 523, 392, 523];
                notes.forEach((freq, i) => {
                    const osc = ctx.createOscillator(); const gain = ctx.createGain();
                    osc.connect(gain); gain.connect(ctx.destination);
                    osc.type = 'triangle'; osc.frequency.value = freq;
                    const startTime = now + (i * 0.15);
                    gain.gain.setValueAtTime(0.5, startTime);
                    osc.start(startTime); osc.stop(startTime + 0.12);
                });
            } else if (type === '9') {
                for (let i = 0; i < 2; i++) {
                    const osc = ctx.createOscillator(); const gain = ctx.createGain();
                    osc.connect(gain); gain.connect(ctx.destination);
                    osc.type = 'sine'; osc.frequency.value = i === 0 ? 850 : 950;
                    const startTime = now + (i * 0.2);
                    gain.gain.setValueAtTime(0.4, startTime);
                    osc.start(startTime); osc.stop(startTime + 0.18);
                }
            } else if (type === '10') {
                const osc = ctx.createOscillator(); const gain = ctx.createGain();
                osc.connect(gain); gain.connect(ctx.destination);
                osc.type = 'sine';
                osc.frequency.setValueAtTime(600, now);
                osc.frequency.linearRampToValueAtTime(1100, now + 0.3);
                osc.frequency.linearRampToValueAtTime(600, now + 0.6);
                gain.gain.setValueAtTime(0.4, now);
                osc.start(now); osc.stop(now + 0.6);
            }
        } catch(e) {
            console.log('Audio bloqueado.');
        }
    }

    if (Notification && Notification.permission === 'default') {
        Notification.requestPermission();
    }

})();