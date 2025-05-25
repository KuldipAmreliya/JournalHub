document.addEventListener('DOMContentLoaded', function() {
    // Get DOM elements
    const userSearch = document.getElementById('userSearch');
    const roleFilter = document.getElementById('roleFilter');
    const usersTableBody = document.getElementById('usersTableBody');
    const createAdminBtn = document.getElementById('createAdminBtn');
    const createAdminModal = document.getElementById('createAdminModal');
    const closeModal = document.querySelector('.close-modal');
    const cancelAdminBtn = document.getElementById('cancelAdminBtn');
    const submitAdminBtn = document.getElementById('submitAdminBtn');
    const userMenuBtn = document.getElementById('userMenuBtn');
    const userDropdown = document.getElementById('userDropdown');
    const logoutBtn = document.getElementById('logoutBtn');

    // Event Listeners
    userSearch.addEventListener('input', filterUsers);
    roleFilter.addEventListener('change', filterUsers);
    createAdminBtn.addEventListener('click', () => createAdminModal.style.display = 'block');
    closeModal.addEventListener('click', () => createAdminModal.style.display = 'none');
    cancelAdminBtn.addEventListener('click', () => createAdminModal.style.display = 'none');
    submitAdminBtn.addEventListener('click', createAdminUser);
    userMenuBtn.addEventListener('click', toggleUserMenu);
    logoutBtn.addEventListener('click', logout);

    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === createAdminModal) {
            createAdminModal.style.display = 'none';
        }
    });

    // Load initial data
    loadUsers();
    updateStats();

    // Functions
    function loadUsers() {
        fetch('/admin/all-users')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to load users');
                }
                return response.json();
            })
            .then(users => {
                displayUsers(users);
            })
            .catch(error => {
                console.error('Error loading users:', error);
                showNotification('Error loading users', 'error');
            });
    }

    function displayUsers(users) {
        usersTableBody.innerHTML = '';
        users.forEach(user => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${user.username}</td>
                <td>
                    <span class="role-badge ${user.roles.includes('ROLE_ADMIN') ? 'admin' : 'user'}">
                        ${user.roles.includes('ROLE_ADMIN') ? 'Admin' : 'User'}
                    </span>
                </td>
                <td>${user.journalEntries ? user.journalEntries.length : 0}</td>
                <td class="actions">
                    <button class="btn-icon" onclick="editUser('${user.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-icon delete" onclick="deleteUser('${user.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            usersTableBody.appendChild(row);
        });
    }

    function filterUsers() {
        const searchTerm = userSearch.value.toLowerCase();
        const roleValue = roleFilter.value;
        
        const rows = usersTableBody.getElementsByTagName('tr');
        Array.from(rows).forEach(row => {
            const username = row.cells[0].textContent.toLowerCase();
            const role = row.cells[1].textContent.trim().toLowerCase();
            
            const matchesSearch = username.includes(searchTerm);
            const matchesRole = roleValue === 'all' || role === roleValue;
            
            row.style.display = matchesSearch && matchesRole ? '' : 'none';
        });
    }

    function createAdminUser() {
        const username = document.getElementById('adminUsername').value.trim();
        const password = document.getElementById('adminPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (!username || !password) {
            showNotification('Please fill in all fields', 'error');
            return;
        }

        if (password !== confirmPassword) {
            showNotification('Passwords do not match', 'error');
            return;
        }

        const newAdmin = {
            username: username,
            password: password,
            roles: ['ROLE_ADMIN']
        };

        fetch('/admin/create-admin-user', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newAdmin)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to create admin user');
            }
            createAdminModal.style.display = 'none';
            document.getElementById('adminUsername').value = '';
            document.getElementById('adminPassword').value = '';
            document.getElementById('confirmPassword').value = '';
            showNotification('Admin user created successfully', 'success');
            loadUsers();
            updateStats();
        })
        .catch(error => {
            console.error('Error creating admin user:', error);
            showNotification('Error creating admin user', 'error');
        });
    }

    function updateStats() {
        fetch('/admin/all-users')
            .then(response => response.json())
            .then(users => {
                const totalUsers = users.length;
                const totalEntries = users.reduce((sum, user) => 
                    sum + (user.journalEntries ? user.journalEntries.length : 0), 0);
                
                document.getElementById('totalUsers').textContent = totalUsers;
                document.getElementById('totalEntries').textContent = totalEntries;
            })
            .catch(error => console.error('Error updating stats:', error));
    }

    function showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        document.getElementById('notificationContainer').appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    function toggleUserMenu() {
        userDropdown.style.display = userDropdown.style.display === 'block' ? 'none' : 'block';
    }

    function logout() {
        fetch('/logout', {
            method: 'POST'
        })
        .then(() => {
            window.location.href = '/login.html';
        })
        .catch(error => {
            console.error('Error logging out:', error);
            showNotification('Error logging out', 'error');
        });
    }

    // Global functions for table actions
    window.editUser = function(userId) {
        // Implement user editing functionality
        console.log('Edit user:', userId);
    };

    window.deleteUser = function(userId) {
        if (!confirm('Are you sure you want to delete this user?')) {
            return;
        }

        fetch(`/admin/users/${userId}`, {
            method: 'DELETE'
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to delete user');
            }
            showNotification('User deleted successfully', 'success');
            loadUsers();
            updateStats();
        })
        .catch(error => {
            console.error('Error deleting user:', error);
            showNotification('Error deleting user', 'error');
        });
    };
}); 