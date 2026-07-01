// Global state
let releaseNotes = [];
let filteredNotes = [];
let selectedNoteId = null;
let currentFilter = 'all';

// DOM Elements
const notesContainer = document.getElementById('notes-container');
const skeletonLoader = document.getElementById('skeleton-loader');
const emptyState = document.getElementById('empty-state');
const errorState = document.getElementById('error-state');
const errorMessage = document.getElementById('error-message');

const refreshBtn = document.getElementById('refresh-btn');
const refreshIcon = document.getElementById('refresh-icon');
const retryBtn = document.getElementById('retry-btn');
const resetFiltersBtn = document.getElementById('reset-filters-btn');

const searchInput = document.getElementById('search-input');
const clearSearchBtn = document.getElementById('clear-search-btn');
const filterTags = document.querySelectorAll('.filter-tag');
const resultsCount = document.getElementById('results-count');

const statTotal = document.getElementById('stat-total');
const statDate = document.getElementById('stat-date');

const tweetTextarea = document.getElementById('tweet-textarea');
const tweetBtn = document.getElementById('tweet-btn');
const charCounter = document.getElementById('char-counter');

const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toast-message');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    fetchReleaseNotes();
    setupEventListeners();
});

// Event Listeners Setup
function setupEventListeners() {
    refreshBtn.addEventListener('click', fetchReleaseNotes);
    retryBtn.addEventListener('click', fetchReleaseNotes);
    resetFiltersBtn.addEventListener('click', resetFiltersAndSearch);
    
    // Search
    searchInput.addEventListener('input', handleSearch);
    clearSearchBtn.addEventListener('click', () => {
        searchInput.value = '';
        clearSearchBtn.classList.add('hide');
        applyFiltersAndSearch();
    });

    // Filters
    filterTags.forEach(tag => {
        tag.addEventListener('click', (e) => {
            filterTags.forEach(t => t.classList.remove('active'));
            e.currentTarget.classList.add('active');
            currentFilter = e.currentTarget.dataset.filter;
            applyFiltersAndSearch();
        });
    });

    // Tweet Composer Input
    tweetTextarea.addEventListener('input', updateCharCounter);
    
    // Tweet Action
    tweetBtn.addEventListener('click', handleTweetSubmit);
}

// Fetch release notes from our Flask API
async function fetchReleaseNotes() {
    showState('loading');
    
    // Start spin animation
    refreshIcon.classList.add('spin');
    refreshBtn.disabled = true;

    try {
        const response = await fetch('/api/release-notes');
        const data = await response.json();
        
        if (!response.ok || data.error) {
            throw new Error(data.error || 'Server error fetching release notes');
        }

        releaseNotes = (data.notes || []).map((note, index) => {
            // Assign unique ID and classify update type
            const classification = classifyNote(note.title, note.content);
            return {
                id: `note-${index}`,
                ...note,
                type: classification
            };
        });

        // Update Overview Statistics
        updateStats();

        // Render notes
        applyFiltersAndSearch();
        showToast('Successfully fetched latest release notes!');
    } catch (error) {
        console.error('Fetch error:', error);
        errorMessage.innerText = error.message;
        showState('error');
    } finally {
        refreshIcon.classList.remove('spin');
        refreshBtn.disabled = false;
    }
}

// Classify update type based on content keywords
function classifyNote(title, content) {
    const text = (title + ' ' + (content || '')).toLowerCase();
    
    if (text.includes('deprecated') || text.includes('deprecation') || text.includes('deprecated:') || text.includes('no longer support') || text.includes('will be removed')) {
        return 'deprecation';
    }
    if (text.includes('fix') || text.includes('bug') || text.includes('resolved') || text.includes('corrected') || text.includes('issue')) {
        return 'fix';
    }
    if (text.includes('feature') || text.includes('new') || text.includes('support for') || text.includes('added') || text.includes('introduced') || text.includes('announces')) {
        return 'feature';
    }
    if (text.includes('changed') || text.includes('change') || text.includes('updated') || text.includes('update') || text.includes('modified') || text.includes('improved')) {
        return 'change';
    }
    return 'feature'; // Default tag
}

// Update overview metrics
function updateStats() {
    statTotal.innerText = releaseNotes.length;
    
    if (releaseNotes.length > 0) {
        // Find most recent date
        const dates = releaseNotes
            .map(n => n.updated ? new Date(n.updated) : null)
            .filter(d => d !== null);
        
        if (dates.length > 0) {
            const latest = new Date(Math.max(...dates));
            statDate.innerText = formatDate(latest, true);
        } else {
            statDate.innerText = 'Unknown';
        }
    } else {
        statDate.innerText = 'No notes';
    }
}

// Helper to format date
function formatDate(dateString, short = false) {
    if (!dateString) return 'Unknown Date';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;
        
        if (short) {
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    } catch {
        return dateString;
    }
}

// Show/hide specific view states
function showState(state) {
    skeletonLoader.classList.add('hide');
    notesContainer.classList.add('hide');
    emptyState.classList.add('hide');
    errorState.classList.add('hide');

    if (state === 'loading') {
        skeletonLoader.classList.remove('hide');
    } else if (state === 'feed') {
        notesContainer.classList.remove('hide');
    } else if (state === 'empty') {
        emptyState.classList.remove('hide');
    } else if (state === 'error') {
        errorState.classList.remove('hide');
    }
}

// Handle search field input
function handleSearch() {
    if (searchInput.value.trim().length > 0) {
        clearSearchBtn.classList.remove('hide');
    } else {
        clearSearchBtn.classList.add('hide');
    }
    applyFiltersAndSearch();
}

// Reset filters
function resetFiltersAndSearch() {
    searchInput.value = '';
    clearSearchBtn.classList.add('hide');
    currentFilter = 'all';
    filterTags.forEach(t => {
        t.classList.remove('active');
        if (t.dataset.filter === 'all') t.classList.add('active');
    });
    applyFiltersAndSearch();
}

// Filters logic combined with Search
function applyFiltersAndSearch() {
    const searchQuery = searchInput.value.toLowerCase().trim();
    
    filteredNotes = releaseNotes.filter(note => {
        // Tag filter
        const matchesFilter = currentFilter === 'all' || note.type === currentFilter;
        
        // Search query filter
        const matchesSearch = !searchQuery || 
            note.title.toLowerCase().includes(searchQuery) || 
            (note.content && note.content.toLowerCase().includes(searchQuery));
            
        return matchesFilter && matchesSearch;
    });

    // Update result count text
    let resultsText = `Showing ${filteredNotes.length} of ${releaseNotes.length} release notes`;
    if (currentFilter !== 'all') {
        resultsText += ` (Filtered: ${currentFilter})`;
    }
    if (searchQuery) {
        resultsText += ` for "${searchQuery}"`;
    }
    resultsCount.innerText = resultsText;

    if (filteredNotes.length === 0) {
        showState(releaseNotes.length === 0 ? 'empty' : 'empty');
    } else {
        renderNotesFeed();
        showState('feed');
    }
}

// Render release note card elements
function renderNotesFeed() {
    notesContainer.innerHTML = '';
    
    filteredNotes.forEach(note => {
        const isSelected = selectedNoteId === note.id;
        
        const card = document.createElement('div');
        card.className = `note-card ${isSelected ? 'selected' : ''}`;
        card.dataset.id = note.id;
        
        // Clean content if HTML has wrappers or tags
        const formattedDate = formatDate(note.updated);
        
        card.innerHTML = `
            <div class="note-card-header">
                <div class="note-header-left">
                    <div class="note-badge-date">
                        <span class="note-tag ${note.type}">${note.type}</span>
                        <span class="note-date">${formattedDate}</span>
                    </div>
                    <h3 class="note-title">${note.title}</h3>
                </div>
                <div class="note-actions">
                    <button class="btn-tweet-card" data-id="${note.id}" stop-propagation>
                        <i data-lucide="twitter"></i> Tweet
                    </button>
                    <div class="note-card-selector"></div>
                </div>
            </div>
            <div class="note-body">
                ${note.content}
            </div>
        `;
        
        // Handle selecting notes
        card.addEventListener('click', (e) => {
            // Ignore if clicked on the inline tweet button
            if (e.target.closest('.btn-tweet-card')) {
                return;
            }
            selectNote(note.id);
        });
        
        // Inline Tweet Button Event
        const cardTweetBtn = card.querySelector('.btn-tweet-card');
        cardTweetBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            selectNote(note.id);
            // Auto open tweet in window
            triggerTweetIntent();
        });
        
        notesContainer.appendChild(card);
    });
    
    // Re-trigger Lucide icons to render new icons
    lucide.createIcons();
}

// Select a release note and pre-fill Tweet Composer
function selectNote(noteId) {
    selectedNoteId = noteId;
    
    // Re-render notes to reflect selection state in UI
    document.querySelectorAll('.note-card').forEach(card => {
        if (card.dataset.id === noteId) {
            card.classList.add('selected');
        } else {
            card.classList.remove('selected');
        }
    });
    
    const note = releaseNotes.find(n => n.id === noteId);
    if (note) {
        // Pre-fill composer
        // Format text nicely: Title + #BigQuery + shortened link if available
        let tweetContent = `Google BigQuery Update: ${note.title}\n\n`;
        
        // Try to add reference link
        if (note.link) {
            tweetContent += `${note.link}\n`;
        } else {
            tweetContent += `https://cloud.google.com/bigquery/docs/release-notes\n`;
        }
        
        tweetContent += `#BigQuery #GoogleCloud`;
        
        tweetTextarea.value = tweetContent;
        updateCharCounter();
        
        showToast('Release note selected! Check the Tweet Composer.');
    }
}

// Live character counting & validation
function updateCharCounter() {
    const text = tweetTextarea.value;
    const len = text.length;
    
    charCounter.innerText = `${len} / 280`;
    
    if (len === 0) {
        charCounter.className = 'char-ok';
        tweetBtn.disabled = true;
    } else if (len > 280) {
        charCounter.className = 'char-error';
        tweetBtn.disabled = true;
    } else if (len > 240) {
        charCounter.className = 'char-warn';
        tweetBtn.disabled = false;
    } else {
        charCounter.className = 'char-ok';
        tweetBtn.disabled = false;
    }
}

// Handle Tweet Submission
function handleTweetSubmit() {
    triggerTweetIntent();
}

function triggerTweetIntent() {
    const text = tweetTextarea.value;
    if (!text) return;
    
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(twitterUrl, '_blank', 'width=550,height=420');
    showToast('Opening Twitter / X Web Intent...');
}

// Custom notification toast
function showToast(message) {
    toastMessage.innerText = message;
    toast.classList.remove('hide');
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(20px)';
        setTimeout(() => toast.classList.add('hide'), 300);
    }, 3000);
}
