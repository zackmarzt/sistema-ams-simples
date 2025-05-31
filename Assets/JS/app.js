// Asset Management System - JavaScript
// Initial data from the provided JSON

const API_URL = "http://localhost:3000/assets";

// Global variables
let assets = [];
let filterAssets = [];
let currentEditingAsset = [];


async function loadAssetsFromAPI() {
    const res = await fetch(API_URL);
    assets = await res.json();
    filterAssets = [...assets];
}

// Initialize the application
document.addEventListener('DOMContentLoaded', async function() {
    await loadAssetsFromAPI(); 
    updateDashboard();
    setupEventListeners();
});


async function saveAsset() {
    const form = document.getElementById('assetForm');
    if (!form.checkVisibility()) {
        form.reportValidity();
    }

    const assetData = {
        nome: document.getElementById('assetName').value.trim(),
        categoria: document.getElementById('assetCategory').value.trim(),
        localizacao: document.getElementById('assetLocation').value.trim(),
        status: document.getElementById('assetStatus').value.trim(),
        dataAquisicao: document.getElementById('assetAcquisitionDate').value.trim(),
        valorAquisicao: document.getElementById('assetValue').value.trim(),
        responsavel: document.getElementById('assetResponsible').value.trim(),
        observacoes: document.getElementById('assetObservations').value.trim(),
    };

    if (currentEditingAsset) {
        await fetch('http://localhost:3000/assets/${currentEditinAsset.id}', {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(assetData)
        });
    } else {
        await fetch('http://localhost:3000/assets', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(assetData)
        });
    }

    await loadAssetsFromAPI();
    updateDashboard();
    filterAssets();
    closeModal();
    alert(currentEditingAsset ? 'Ativo atualizado com sucesso!' : 'Ativo adicionado com sucesso!');
}

// Event listeners setup
function setupEventListeners() {
    // Search input
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', debounce(filterAssets, 300));
    
    // Filter selects
    const categoryFilter = document.getElementById('categoryFilter');
    const statusFilter = document.getElementById('statusFilter');
    
    categoryFilter.addEventListener('change', filterAssets);
    statusFilter.addEventListener('change', filterAssets);
    
    // Form submission
    document.getElementById('assetForm').addEventListener('submit', function(e) {
        e.preventDefault();
        saveAsset();
    });
}

// Utility function for debouncing
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Navigation functions
function showSection(sectionName) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
        section.style.display = 'none';
    });
    
    // Remove active class from all tabs
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Show selected section and activate tab
    document.getElementById(sectionName).style.display = 'block';
    event.target.classList.add('active');
    
    // Update data if needed
    if (sectionName === 'dashboard') {
        updateDashboard();
    } else if (sectionName === 'assets') {
        renderAssetsTable();
    }
}

// Dashboard functions
function updateDashboard() {
    updateMetrics();
    updateCategoriesChart();
}

function updateMetrics() {
    const totalAssets = assets.length;
    const activeAssets = assets.filter(asset => asset.status === 'Ativo').length;
    const maintenanceAssets = assets.filter(asset => asset.status === 'Manutenção').length;
    const totalValue = assets.reduce((sum, asset) => sum + asset.valorAquisicao, 0);
    
    document.getElementById('totalAssets').textContent = totalAssets;
    document.getElementById('activeAssets').textContent = activeAssets;
    document.getElementById('maintenanceAssets').textContent = maintenanceAssets;
    document.getElementById('totalValue').textContent = formatCurrency(totalValue);
}

function updateCategoriesChart() {
    const categories = ['Hardware', 'Software', 'Equipamento', 'Móveis'];
    const categoriesChart = document.getElementById('categoriesChart');
    
    const categoryData = categories.map(category => {
        const count = assets.filter(asset => asset.categoria === category).length;
        return { name: category, count };
    });
    
    categoriesChart.innerHTML = categoryData.map(item => `
        <div class="category-item">
            <div class="category-item__icon">${getCategoryIcon(item.name)}</div>
            <div class="category-item__name">${item.name}</div>
            <div class="category-item__count">${item.count}</div>
        </div>
    `).join('');
}

function getCategoryIcon(category) {
    const icons = {
        'Hardware': '💻',
        'Software': '💿',
        'Equipamento': '⚙️',
        'Móveis': '🪑'
    };
    return icons[category] || '📦';
}

// Asset management functions
function renderAssetsTable() {
    const tbody = document.getElementById('assetsTableBody');
    
    if (filterAssets.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="empty-state">
                    <div class="empty-state__icon">📦</div>
                    <div class="empty-state__title">Nenhum ativo encontrado</div>
                    <div class="empty-state__description">Tente ajustar os filtros ou adicione um novo ativo</div>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = filterAssets.map(asset => `
        <tr>
            <td>${asset.id}</td>
            <td>
                <span class="category-icon category-icon--${asset.categoria.toLowerCase()}">${getCategoryIcon(asset.categoria)}</span>
                ${asset.nome}
            </td>
            <td>${asset.categoria}</td>
            <td>${asset.localizacao}</td>
            <td><span class="status-badge status-badge--${asset.status.toLowerCase().replace(' ', '')}">${asset.status}</span></td>
            <td>${asset.responsavel}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn--action btn--view" onclick="viewAsset(${asset.id})">Ver</button>
                    <button class="btn btn--action btn--edit" onclick="editAsset(${asset.id})">Editar</button>
                </div>
            </td>
        </tr>
    `).join('');
}

function filterAssets() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const categoryFilter = document.getElementById('categoryFilter').value;
    const statusFilter = document.getElementById('statusFilter').value;
    
    filterAssets = assets.filter(asset => {
        const matchesSearch = asset.nome.toLowerCase().includes(searchTerm) ||
                            asset.categoria.toLowerCase().includes(searchTerm) ||
                            asset.responsavel.toLowerCase().includes(searchTerm);
        
        const matchesCategory = !categoryFilter || asset.categoria === categoryFilter;
        const matchesStatus = !statusFilter || asset.status === statusFilter;
        
        return matchesSearch && matchesCategory && matchesStatus;
    });
    
    renderAssetsTable();
}

// Modal functions
function showAddAssetForm() {
    currentEditingAsset = null;
    document.getElementById('modalTitle').textContent = 'Adicionar Ativo';
    document.getElementById('assetForm').reset();
    document.getElementById('assetId').value = '';
    document.getElementById('assetModal').style.display = 'flex';
}

function editAsset(assetId) {
    const asset = assets.find(a => a.id === assetId);
    if (!asset) return;
    
    currentEditingAsset = asset;
    document.getElementById('modalTitle').textContent = 'Editar Ativo';
    
    // Populate form
    document.getElementById('assetId').value = asset.id;
    document.getElementById('assetName').value = asset.nome;
    document.getElementById('assetCategory').value = asset.categoria;
    document.getElementById('assetLocation').value = asset.localizacao;
    document.getElementById('assetStatus').value = asset.status;
    document.getElementById('assetAcquisitionDate').value = asset.dataAquisicao;
    document.getElementById('assetValue').value = asset.valorAquisicao;
    document.getElementById('assetResponsible').value = asset.responsavel;
    document.getElementById('assetObservations').value = asset.observacoes;
    
    document.getElementById('assetModal').style.display = 'flex';
}

function viewAsset(assetId) {
    const asset = assets.find(a => a.id === assetId);
    if (!asset) return;
    
    const detailsHTML = `
        <div class="asset-detail">
            <div class="asset-detail__label">ID:</div>
            <div class="asset-detail__value">${asset.id}</div>
        </div>
        <div class="asset-detail">
            <div class="asset-detail__label">Nome:</div>
            <div class="asset-detail__value">${asset.nome}</div>
        </div>
        <div class="asset-detail">
            <div class="asset-detail__label">Categoria:</div>
            <div class="asset-detail__value">
                <span class="category-icon category-icon--${asset.categoria.toLowerCase()}">${getCategoryIcon(asset.categoria)}</span>
                ${asset.categoria}
            </div>
        </div>
        <div class="asset-detail">
            <div class="asset-detail__label">Localização:</div>
            <div class="asset-detail__value">${asset.localizacao}</div>
        </div>
        <div class="asset-detail">
            <div class="asset-detail__label">Status:</div>
            <div class="asset-detail__value">
                <span class="status-badge status-badge--${asset.status.toLowerCase().replace(' ', '')}">${asset.status}</span>
            </div>
        </div>
        <div class="asset-detail">
            <div class="asset-detail__label">Data de Aquisição:</div>
            <div class="asset-detail__value">${formatDate(asset.dataAquisicao)}</div>
        </div>
        <div class="asset-detail">
            <div class="asset-detail__label">Valor de Aquisição:</div>
            <div class="asset-detail__value">${formatCurrency(asset.valorAquisicao)}</div>
        </div>
        <div class="asset-detail">
            <div class="asset-detail__label">Responsável:</div>
            <div class="asset-detail__value">${asset.responsavel}</div>
        </div>
        <div class="asset-detail">
            <div class="asset-detail__label">Observações:</div>
            <div class="asset-detail__value">${asset.observacoes || 'Nenhuma observação'}</div>
        </div>
    `;
    
    document.getElementById('assetDetails').innerHTML = detailsHTML;
    document.getElementById('detailsModal').style.display = 'flex';
    
    // Store current asset for editing from details modal
    window.currentViewingAsset = asset;
}

function closeModal() {
    document.getElementById('assetModal').style.display = 'none';
    currentEditingAsset = null;
}

function closeDetailsModal() {
    document.getElementById('detailsModal').style.display = 'none';
    window.currentViewingAsset = null;
}

function editAssetFromDetails() {
    closeDetailsModal();
    if (window.currentViewingAsset) {
        editAsset(window.currentViewingAsset.id);
    }
}

// Save asset function
function saveAsset() {
    const form = document.getElementById('assetForm');
    
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    const assetData = {
        nome: document.getElementById('assetName').value.trim(),
        categoria: document.getElementById('assetCategory').value,
        localizacao: document.getElementById('assetLocation').value.trim(),
        status: document.getElementById('assetStatus').value,
        dataAquisicao: document.getElementById('assetAcquisitionDate').value,
        valorAquisicao: parseFloat(document.getElementById('assetValue').value),
        responsavel: document.getElementById('assetResponsible').value.trim(),
        observacoes: document.getElementById('assetObservations').value.trim()
    };
    
    if (currentEditingAsset) {
        // Update existing asset
        const index = assets.findIndex(a => a.id === currentEditingAsset.id);
        if (index !== -1) {
            assets[index] = { ...assets[index], ...assetData };
        }
    } else {
        // Add new asset
        const newId = Math.max(...assets.map(a => a.id)) + 1;
        assets.push({ id: newId, ...assetData });
    }
    
    // Update displays
    updateDashboard();
    filterAssets(); // This will re-render the table
    closeModal();
    
    // Show success message (simple alert for now)
    alert(currentEditingAsset ? 'Ativo atualizado com sucesso!' : 'Ativo adicionado com sucesso!');
}

// Utility functions
function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR').format(date);
}

// Close modals when clicking outside
window.addEventListener('click', function(event) {
    const assetModal = document.getElementById('assetModal');
    const detailsModal = document.getElementById('detailsModal');
    
    if (event.target === assetModal) {
        closeModal();
    }
    
    if (event.target === detailsModal) {
        closeDetailsModal();
    }
});

// Close modals with Escape key
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        const assetModal = document.getElementById('assetModal');
        const detailsModal = document.getElementById('detailsModal');
        
        if (assetModal.style.display === 'flex') {
            closeModal();
        }
        
        if (detailsModal.style.display === 'flex') {
            closeDetailsModal();
        }
    }
});