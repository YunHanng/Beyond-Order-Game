// ========== API Configuration ==========
const API_ENDPOINTS = {
    // Using JokeAPI - Free API for jokes
    ANY: 'https://v2.jokeapi.dev/joke/Any',
    GENERAL: 'https://v2.jokeapi.dev/joke/General',
    PROGRAMMING: 'https://v2.jokeapi.dev/joke/Programming',
    'KNOCK-KNOCK': 'https://v2.jokeapi.dev/joke/Knock-Knock',
};

// ========== State Management ==========
const jokeState = {
    currentJoke: null,
    jokeHistory: [],
    jokeCount: 0,
    selectedCategory: '',
    isLoading: false,
};

// ========== DOM Elements ==========
const elements = {
    jokText: document.getElementById('joke-text'),
    jokeType: document.getElementById('joke-type'),
    getJokeBtn: document.getElementById('get-joke-btn'),
    shareBtn: document.getElementById('share-btn'),
    loading: document.getElementById('loading'),
    errorMessage: document.getElementById('error-message'),
    jokeCount: document.getElementById('joke-count'),
    categoryDisplay: document.getElementById('category-display'),
    categorySelect: document.getElementById('category-select'),
    historyList: document.getElementById('history-list'),
};

// ========== Event Listeners ==========
elements.getJokeBtn.addEventListener('click', getRandomJoke);
elements.shareBtn.addEventListener('click', shareJoke);
elements.categorySelect.addEventListener('change', handleCategoryChange);

// ========== Main Functions ==========

async function getRandomJoke() {
    // Prevent multiple simultaneous requests
    if (jokeState.isLoading) return;
    
    jokeState.isLoading = true;
    showLoading(true);
    hideError();
    elements.getJokeBtn.disabled = true;
    
    try {
        const category = jokeState.selectedCategory || 'Any';
        const apiUrl = API_ENDPOINTS[category] || API_ENDPOINTS.ANY;
        
        // Fetch joke from API
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Check if API returned an error
        if (data.error) {
            throw new Error('Failed to fetch joke');
        }
        
        // Process the joke
        const jokeText = formatJoke(data);
        jokeState.currentJoke = {
            text: jokeText,
            category: data.category || 'Any',
            type: data.type || 'unknown',
            timestamp: new Date().toLocaleString(),
        };
        
        // Update display
        displayJoke(jokeState.currentJoke);
        
        // Update stats
        jokeState.jokeCount++;
        jokeState.jokeHistory.unshift(jokeState.currentJoke);
        
        // Keep only last 10 jokes
        if (jokeState.jokeHistory.length > 10) {
            jokeState.jokeHistory.pop();
        }
        
        updateStats();
        updateHistory();
        
    } catch (error) {
        showError(`Failed to load joke: ${error.message}`);
        console.error('Error fetching joke:', error);
    } finally {
        jokeState.isLoading = false;
        showLoading(false);
        elements.getJokeBtn.disabled = false;
    }
}

function formatJoke(jokeData) {
    // JokeAPI returns jokes in two formats:
    // 1. Single format: { setup, delivery }
    // 2. Two-part format: { joke }
    
    if (jokeData.type === 'single') {
        return jokeData.joke;
    } else if (jokeData.type === 'twopart') {
        return `${jokeData.setup}\n\n${jokeData.delivery}`;
    }
    return 'Joke format not recognized';
}

function displayJoke(joke) {
    elements.jokText.textContent = joke.text;
    elements.jokeType.textContent = `${joke.type.toUpperCase()} • ${joke.category}`;
    elements.shareBtn.style.display = 'inline-block';
    
    // Add animation
    const jokeBox = document.querySelector('.joke-box');
    jokeBox.style.animation = 'none';
    setTimeout(() => {
        jokeBox.style.animation = 'fadeIn 0.5s ease-out';
    }, 10);
}

function shareJoke() {
    if (!jokeState.currentJoke) return;
    
    const jokeText = jokeState.currentJoke.text;
    const shareText = `😂 Check out this joke:\n\n${jokeText}\n\n🤣 Get more at the Random Joke Generator!`;
    
    // Use Web Share API if available
    if (navigator.share) {
        navigator.share({
            title: 'Random Joke',
            text: shareText,
        }).catch(err => console.log('Error sharing:', err));
    } else {
        // Fallback: Copy to clipboard
        navigator.clipboard.writeText(shareText).then(() => {
            showNotification('Joke copied to clipboard!');
        }).catch(err => {
            showError('Failed to copy joke');
        });
    }
}

function handleCategoryChange(event) {
    jokeState.selectedCategory = event.target.value.toUpperCase();
    updateCategoryDisplay();
}

function updateStats() {
    elements.jokeCount.textContent = jokeState.jokeCount;
}

function updateCategoryDisplay() {
    const display = jokeState.selectedCategory || 'Any';
    elements.categoryDisplay.textContent = display;
}

function updateHistory() {
    if (jokeState.jokeHistory.length === 0) {
        elements.historyList.innerHTML = '<li class="empty-history">No jokes yet</li>';
        return;
    }
    
    elements.historyList.innerHTML = jokeState.jokeHistory.map((joke, index) => {
        const preview = joke.text.substring(0, 50) + (joke.text.length > 50 ? '...' : '');
        return `
            <li title="${joke.text}" data-index="${index}">
                <strong>${joke.category}</strong> - ${preview}
                <br><small>${joke.timestamp}</small>
            </li>
        `;
    }).join('');
    
    // Add click handlers to history items
    document.querySelectorAll('.history-list li[data-index]').forEach(item => {
        item.addEventListener('click', (e) => {
            const index = parseInt(e.currentTarget.dataset.index);
            const historicalJoke = jokeState.jokeHistory[index];
            displayJoke(historicalJoke);
        });
    });
}

// ========== UI Helper Functions ==========

function showLoading(show) {
    elements.loading.style.display = show ? 'flex' : 'none';
}

function showError(message) {
    elements.errorMessage.textContent = message;
    elements.errorMessage.style.display = 'block';
}

function hideError() {
    elements.errorMessage.style.display = 'none';
}

function showNotification(message) {
    // Create temporary notification
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #667eea;
        color: white;
        padding: 15px 25px;
        border-radius: 8px;
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
        z-index: 1000;
        animation: slideIn 0.3s ease-out;
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideIn 0.3s ease-out reverse';
        setTimeout(() => notification.remove(), 300);
    }, 2000);
}

// ========== Initialization ==========

window.addEventListener('DOMContentLoaded', () => {
    console.log('✅ Joke Generator Loaded');
    console.log('📡 Using JokeAPI (https://jokeapi.dev/)');
    console.log('Available Categories: General, Programming, Knock-Knock');
    
    updateCategoryDisplay();
});

// ========== Service Worker (optional - for offline support) ==========

// Register service worker if available
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('joke-sw.js').catch(() => {
        console.log('Service Worker registration skipped');
    });
}
