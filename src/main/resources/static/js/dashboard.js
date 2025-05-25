document.addEventListener('DOMContentLoaded', function() {
    // Get DOM elements
    const editor = document.getElementById('editor');
    const titleInput = document.getElementById('titleInput');
    const saveBtn = document.getElementById('saveBtn');
    const deleteBtn = document.getElementById('deleteBtn');
    const entriesList = document.getElementById('entriesList');
    const wordCount = document.getElementById('wordCount');
    const lastSaved = document.getElementById('lastSaved');
    const userMenuBtn = document.getElementById('userMenuBtn');
    const userDropdown = document.getElementById('userDropdown');
    const logoutBtn = document.getElementById('logoutBtn');
    const searchInput = document.getElementById('searchInput');
    const newEntryBtn = document.getElementById('newEntryBtn');
    const newEntryModal = document.getElementById('newEntryModal');
    const closeModal = document.getElementById('closeModal');
    const createEntryBtn = document.getElementById('createEntryBtn');
    const cancelEntryBtn = document.getElementById('cancelEntryBtn');

    let currentEntry = null;
    let entries = [];

    // Event Listeners
    saveBtn.addEventListener('click', saveEntry);
    deleteBtn.addEventListener('click', () => {
        if (currentEntry) {
            deleteEntry(currentEntry.id);
        }
    });
    editor.addEventListener('input', updateWordCount);
    userMenuBtn.addEventListener('click', toggleUserMenu);
    logoutBtn.addEventListener('click', logout);
    newEntryBtn.addEventListener('click', () => newEntryModal.style.display = 'block');
    closeModal.addEventListener('click', () => newEntryModal.style.display = 'none');
    cancelEntryBtn.addEventListener('click', () => newEntryModal.style.display = 'none');
    searchInput.addEventListener('input', searchEntries);

    // Initialize
    loadEntries();
    updateWordCount();

    // Functions
    function loadEntries() {
        fetch('/journal', {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            },
            credentials: 'include'
        })
        .then(response => {
            if (!response.ok) {
                if (response.status === 401) {
                    window.location.href = '/login.html';
                    return;
                }
                throw new Error('Failed to load entries');
            }
            return response.json();
        })
        .then(data => {
            entries = data.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
            displayEntries();
        })
        .catch(error => {
            console.error('Error loading entries:', error);
            showNotification('Error loading entries', 'error');
        });
    }

    function displayEntries() {
        entriesList.innerHTML = '';
        entries.forEach(entry => {
            const entryElement = createEntryElement(entry);
            entriesList.appendChild(entryElement);
        });
    }

    function createEntryElement(entry) {
        const div = document.createElement('div');
        div.className = 'entry-item';
        div.setAttribute('data-id', entry.id);
        
        if (currentEntry && currentEntry.id === entry.id) {
            div.classList.add('active');
        }

        const date = entry.date ? new Date(entry.date).toLocaleDateString() : 'No date';
        const preview = entry.content ? entry.content.substring(0, 100) + '...' : 'No content';

        div.innerHTML = `
            <div class="entry-header">
                <h3>${entry.title || 'Untitled Entry'}</h3>
                <span class="entry-date">${date}</span>
            </div>
            <div class="entry-preview">${preview}</div>
        `;

        div.addEventListener('click', () => loadEntry(entry));
        return div;
    }

    function loadEntry(entry) {
        if (currentEntry && currentEntry.id === entry.id) {
            return;
        }

        fetch(`/journal/id/${entry.id}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            },
            credentials: 'include'
        })
        .then(response => {
            if (!response.ok) throw new Error('Failed to load entry');
            return response.json();
        })
        .then(loadedEntry => {
            currentEntry = loadedEntry;
            titleInput.value = loadedEntry.title || '';
            editor.value = loadedEntry.content || '';
            updateWordCount();
            updateLastSaved(loadedEntry.date);

            // Update active state
            const activeEntry = entriesList.querySelector('.entry-item.active');
            if (activeEntry) {
                activeEntry.classList.remove('active');
            }
            const newActiveEntry = entriesList.querySelector(`[data-id="${loadedEntry.id}"]`);
            if (newActiveEntry) {
                newActiveEntry.classList.add('active');
            }
        })
        .catch(error => {
            console.error('Error loading entry:', error);
            showNotification('Error loading entry details', 'error');
        });
    }

    function saveEntry() {
        const title = titleInput.value.trim();
        const content = editor.value.trim();

        if (!content) {
            showNotification('Please enter some content', 'error');
            return;
        }

        const entryData = {
            title: title || 'Untitled Entry',
            content: content,
            date: new Date().toISOString()
        };

        const url = currentEntry ? `/journal/id/${currentEntry.id}` : '/journal';
        const method = currentEntry ? 'PUT' : 'POST';

        fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(entryData)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to save entry');
            }
            return response.json();
        })
        .then(savedEntry => {
            if (currentEntry) {
                // Update existing entry
                const index = entries.findIndex(e => e.id === currentEntry.id);
                if (index !== -1) {
                    entries[index] = savedEntry;
                }
            } else {
                // Add new entry
                entries.unshift(savedEntry);
                currentEntry = savedEntry;
            }
            
            displayEntries();
            updateLastSaved(savedEntry.date);
            showNotification('Entry saved successfully', 'success');
        })
        .catch(error => {
            console.error('Error saving entry:', error);
            showNotification('Error saving entry', 'error');
        });
    }

    function deleteEntry(entryId) {
        if (!confirm('Are you sure you want to delete this entry?')) {
            return;
        }

        fetch(`/journal/id/${entryId}`, {
            method: 'DELETE',
            credentials: 'include'
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to delete entry');
            }
            
            entries = entries.filter(e => e.id !== entryId);
            if (currentEntry && currentEntry.id === entryId) {
                currentEntry = null;
                titleInput.value = '';
                editor.value = '';
                updateWordCount();
                updateLastSaved();
            }
            
            displayEntries();
            showNotification('Entry deleted successfully', 'success');
        })
        .catch(error => {
            console.error('Error deleting entry:', error);
            showNotification('Error deleting entry', 'error');
        });
    }

    function updateWordCount() {
        const words = editor.value.trim().split(/\s+/).filter(word => word.length > 0).length;
        wordCount.textContent = `${words} word${words === 1 ? '' : 's'}`;
    }

    function updateLastSaved(date) {
        if (date) {
            const formattedDate = new Date(date).toLocaleString();
            lastSaved.textContent = `Last saved: ${formattedDate}`;
        } else {
            lastSaved.textContent = 'Not saved yet';
        }
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
            method: 'POST',
            credentials: 'include'
        })
        .then(() => {
            window.location.href = '/login.html';
        })
        .catch(error => {
            console.error('Error logging out:', error);
            showNotification('Error logging out', 'error');
        });
    }

    // Create new entry button
    document.getElementById('newEntryBtn').addEventListener('click', () => {
        currentEntry = null;
        titleInput.value = '';
        editor.value = '';
        updateWordCount();
        updateLastSaved();

        const activeEntry = entriesList.querySelector('.entry-item.active');
        if (activeEntry) {
            activeEntry.classList.remove('active');
        }
    });

    function searchEntries() {
        const searchTerm = searchInput.value.toLowerCase();
        const filteredEntries = entries.filter(entry => 
            entry.title.toLowerCase().includes(searchTerm) || 
            entry.content.toLowerCase().includes(searchTerm)
        );
        
        entriesList.innerHTML = '';
        filteredEntries.forEach(entry => {
            const entryElement = createEntryElement(entry);
            entriesList.appendChild(entryElement);
        });
    }
}); 