
const categories = [
    { id: 'marriage', name: 'Marriage Decorations', icon: '💒' },
    { id: 'haldi', name: 'Haldi Decorations', icon: '🌼' },
    { id: 'engagement', name: 'Engagement Decorations', icon: '💍' },
    { id: 'birthday', name: 'Birthday Decorations', icon: '🎂' },
    { id: 'reception', name: 'Reception Decorations', icon: '🎊' },
    { id: 'temple', name: 'Temple Decorations', icon: '🛕' },
    { id: 'home', name: 'Home Decorations', icon: '🏡' }
];

let currentCategory = null;
let currentTab = 'photos';
let isAdmin = false;

async function init() {
    renderCategories();
    populateAdminCategories();
    await checkAuth();
    updateMenu();
}

function renderCategories() {
    const grid = document.getElementById('categoryGrid');
    grid.innerHTML = categories.map(cat => `
        <div class="category-card" onclick="viewCategory('${cat.id}')">
            <div class="category-icon">${cat.icon}</div>
            <div class="category-info">
                <h3>${cat.name}</h3>
                <p>Click to view gallery</p>
            </div>
        </div>
    `).join('');
}

function populateAdminCategories() {
    const select = document.getElementById('uploadCategory');
    select.innerHTML = categories.map(cat => 
        `<option value="${cat.id}">${cat.name}</option>`
    ).join('');
}

async function checkAuth() {
    try {
        const res = await fetch('/api/check-auth');
        const data = await res.json();
        if (data.authenticated) {
            isAdmin = true;
        }
    } catch (e) {
        console.error('Auth check failed');
    }
}

function updateMenu() {
    const menuBtn = document.getElementById('adminMenuBtn');
    menuBtn.textContent = isAdmin ? 'Admin Panel' : 'Admin Login';
}

async function viewCategory(categoryId) {
    currentCategory = categoryId;
    const category = categories.find(c => c.id === categoryId);
    
    document.getElementById('hero').classList.add('hidden');
    document.getElementById('categoriesSection').classList.add('hidden');
    document.getElementById('adminPanel').classList.add('hidden');
    document.getElementById('galleryView').classList.remove('hidden');
    document.getElementById('galleryTitle').textContent = category.name;
    
    window.scrollTo(0, 0);
    
    await loadGallery();
}

async function loadGallery() {
    const grid = document.getElementById('galleryGrid');
    grid.innerHTML = '<div class="empty-gallery">Loading...</div>';

    try {
        const res = await fetch(`/api/media/${currentCategory}/${currentTab}`);
        const files = await res.json();
        
        if (files.length > 0) {
            grid.innerHTML = files.map(url => {
                if (currentTab === 'photos') {
                    return `<div class="gallery-item" onclick="openMedia('${url}', 'photo')">
                        <img src="${url}" alt="Photo" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 300 300%22><rect fill=%22%23f0f0f0%22 width=%22300%22 height=%22300%22/><text x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22%23999%22 font-size=%2220%22>Image</text></svg>'">
                    </div>`;
                } else {
                    return `<div class="gallery-item" onclick="openMedia('${url}', 'video')">
                        <video src="${url}" preload="metadata"></video>
                    </div>`;
                }
            }).join('');
        } else {
            grid.innerHTML = '<div class="empty-gallery">No content available yet</div>';
        }
    } catch (error) {
        grid.innerHTML = '<div class="empty-gallery">No content available yet</div>';
        console.error('Load gallery error:', error);
    }
}

function switchTab(tab) {
    currentTab = tab;
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    loadGallery();
}

function openMedia(url, type) {
    const modal = document.getElementById('mediaModal');
    const content = document.getElementById('mediaContent');
    
    if (type === 'photo') {
        content.innerHTML = `<img src="${url}" alt="Photo">`;
    } else {
        content.innerHTML = `<video src="${url}" controls autoplay></video>`;
    }
    
    modal.classList.add('active');
}

function closeMediaModal() {
    document.getElementById('mediaModal').classList.remove('active');
}

function backToHome() {
    document.getElementById('hero').classList.remove('hidden');
    document.getElementById('categoriesSection').classList.remove('hidden');
    document.getElementById('galleryView').classList.add('hidden');
    currentCategory = null;
    window.scrollTo(0, 0);
}

function updateFileAccept() {
    const type = document.getElementById('uploadType').value;
    const fileInput = document.getElementById('uploadFile');
    
    if (type === 'photo') {
        fileInput.accept = 'image/*';
    } else {
        fileInput.accept = 'video/*';
    }
    
    document.getElementById('filePreview').innerHTML = '';
}

function previewFile() {
    const file = document.getElementById('uploadFile').files[0];
    const preview = document.getElementById('filePreview');
    const type = document.getElementById('uploadType').value;
    
    if (file) {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            if (type === 'photo') {
                preview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
            } else {
                preview.innerHTML = `<video src="${e.target.result}" controls></video>`;
            }
        };
        
        reader.readAsDataURL(file);
    }
}

function toggleMenu() {
    const menu = document.getElementById('mobileMenu');
    const btn = document.getElementById('hamburgerBtn');
    menu.classList.toggle('hidden');
    btn.classList.toggle('active');
}

function showAdminLogin() {
    toggleMenu(); // Close menu after click
    if (isAdmin) {
        showAdminPanel();
    } else {
        const modal = document.getElementById('loginModal');
        modal.classList.add('active');
        // Pre-fill email if not already
        document.getElementById('username').value = 'akannadevara@gmail.com';
        // Automatically send password to email
        forgotPassword();
    }
}

function closeModal() {
    document.getElementById('loginModal').classList.remove('active');
}

async function login() {
    const email = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    if (!email || !password) {
        alert('Please enter email and password');
        return;
    }
    
    try {
        const res = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: email, password })
        });
        const data = await res.json();
        
        if (data.success) {
            isAdmin = true;
            localStorage.setItem('token', data.token);
            closeModal();
            showAdminPanel();
            updateMenu();
        } else {
            alert('Invalid credentials. If you forgot your password, use the "Forgot Password?" link.');
        }
    } catch (error) {
        alert('Login failed. Please try again.');
    }
}

async function forgotPassword() {
    const email = document.getElementById('username').value;
    
    if (!email) {
        alert('Please enter your email');
        return;
    }
    
    try {
        const res = await fetch('/api/forgot-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        const data = await res.json();
        alert(data.message);
    } catch (error) {
        alert('Failed to send password reset email. Please try again.');
    }
}

function showAdminPanel() {
    document.getElementById('hero').classList.add('hidden');
    document.getElementById('categoriesSection').classList.add('hidden');
    document.getElementById('galleryView').classList.add('hidden');
    document.getElementById('adminPanel').classList.remove('hidden');
    window.scrollTo(0, 0);
}

async function logout() {
    isAdmin = false;
    localStorage.removeItem('token');
    try {
        await fetch('/api/logout');
    } catch (e) {
        console.error('Logout failed');
    }
    document.getElementById('hero').classList.remove('hidden');
    document.getElementById('categoriesSection').classList.remove('hidden');
    document.getElementById('adminPanel').classList.add('hidden');
    updateMenu();
    window.scrollTo(0, 0);
}

async function uploadContent() {
    const category = document.getElementById('uploadCategory').value;
    const type = document.getElementById('uploadType').value;
    const file = document.getElementById('uploadFile').files[0];
    const uploadBtn = document.getElementById('uploadBtn');
    const statusDiv = document.getElementById('uploadStatus');

    if (!file) {
        statusDiv.innerHTML = '<div class="upload-status error">Please select a file</div>';
        return;
    }

    if (file.size > 5 * 1024 * 1024) {
        statusDiv.innerHTML = '<div class="upload-status error">File is too large. Maximum size is 5MB.</div>';
        return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
        alert('Please login again');
        return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);
    formData.append('type', type);

    uploadBtn.disabled = true;
    uploadBtn.textContent = 'Uploading...';
    statusDiv.innerHTML = '<div class="upload-status">Uploading your file...</div>';

    try {
        const res = await fetch('/api/upload', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });
        const data = await res.json();
        
        if (data.success) {
            statusDiv.innerHTML = '<div class="upload-status success">✓ Content uploaded successfully! Redirecting to view...</div>';
            document.getElementById('uploadFile').value = '';
            document.getElementById('filePreview').innerHTML = '';
            
            setTimeout(() => {
                currentTab = type + 's';
                viewCategory(category);
            }, 1500);
        } else {
            statusDiv.innerHTML = `<div class="upload-status error">Upload failed: ${data.message}</div>`;
        }
    } catch (error) {
        console.error('Upload error:', error);
        statusDiv.innerHTML = '<div class="upload-status error">Upload failed. Please try again.</div>';
    } finally {
        uploadBtn.disabled = false;
        uploadBtn.textContent = 'Upload';
    }
}

init();
