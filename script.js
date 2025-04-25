// Load QA pairs from JSON file
let qaData = [];
let fuse;

document.addEventListener('DOMContentLoaded', () => {
    console.log('Page loaded, fetching JSON data...');
    fetch('output.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to load JSON file');
            }
            return response.json();
        })
        .then(data => {
            qaData = data;
            console.log('JSON data loaded:', qaData);
            const options = {
                includeScore: true,
                keys: ['Suwaal', 'Jawaab'], // Default to searching both fields
                threshold: 0.3,
            };
            fuse = new Fuse(qaData, options);
            displayQAPairs(qaData);
        })
        .catch(error => {
            console.error('Error loading JSON:', error);
            document.getElementById('qaContainer').innerHTML = '<p>Error loading data. Please check the console for details.</p>';
        });

    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', debounce(searchQA, 300));

    window.addEventListener('resize', debounce(() => {
        console.log('Window resized, re-rendering...');
        const searchInput = document.getElementById('searchInput').value.trim();
        if (searchInput) {
            searchQA();
        } else {
            displayQAPairs(qaData);
        }
    }, 300));
});

// Display QA pairs as cards with highlighted keywords
function displayQAPairs(data, searchTerm = '', isBestMatch = false) {
    const qaContainer = isBestMatch ? document.getElementById('bestMatchContainer') : document.getElementById('qaContainer');
    qaContainer.innerHTML = '';

    if (!data.length && !isBestMatch) {
        qaContainer.innerHTML = '<p>No results found.</p>';
        return;
    }

    data.forEach(item => {
        const pair = item.item || item;
        const suwaalText = searchTerm ? highlightText(pair.Suwaal, searchTerm) : pair.Suwaal;
        const jawaabText = searchTerm ? highlightText(pair.Jawaab, searchTerm) : pair.Jawaab;

        const card = document.createElement('div');
        if (isBestMatch) {
            card.className = 'best-match';
            card.innerHTML = `
                <h4>Best Match</h4>
                <h5>Suwaal: ${suwaalText}</h5>
                <p><strong>Jawaab:</strong> ${jawaabText}</p>
            `;
        } else {
            card.className = 'col-md-6 col-lg-4 qa-card';
            card.innerHTML = `
                <h5>Suwaal: ${suwaalText}</h5>
                <p><strong>Jawaab:</strong> ${jawaabText}</p>
            `;
        }
        qaContainer.appendChild(card);
    });
}

// Highlight matched keywords in text
function highlightText(text, searchTerm) {
    if (!searchTerm) return text;
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    return text.replace(regex, '<span class="highlight">$1</span>');
}

// Debounce function to limit search frequency
function debounce(func, wait) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

// Advanced search functionality with best match for questions
function searchQA() {
    const searchInput = document.getElementById('searchInput').value.trim();

    console.log('Search triggered with input:', searchInput);

    document.getElementById('bestMatchContainer').innerHTML = '';

    if (!searchInput) {
        displayQAPairs(qaData);
        return;
    }

    const questionFuseOptions = {
        includeScore: true,
        keys: ['Suwaal'],
        threshold: 0.3,
    };
    let questionFuse = new Fuse(qaData, questionFuseOptions);
    const questionResult = questionFuse.search(searchInput);

    if (questionResult.length > 0 && questionResult[0].score < 0.4) {
        console.log('Best match found:', questionResult[0]);
        displayQAPairs([questionResult[0]], searchInput, true);
    } else {
        console.log('No close match found for question.');
        document.getElementById('bestMatchContainer').innerHTML = '<p>No close match found for your question.</p>';
    }

    const fuseOptions = {
        includeScore: true,
        threshold: 0.3,
        keys: ['Suwaal', 'Jawaab'], // Default to both fields
    };
    fuse = new Fuse(qaData, fuseOptions);
    const result = fuse.search(searchInput);

    const bestMatchRef = questionResult.length > 0 ? questionResult[0].refIndex : -1;
    const otherResults = result.filter(item => item.refIndex !== bestMatchRef);

    displayQAPairs(otherResults, searchInput);
}

// Clear search input and reset results
function clearSearch() {
    const searchInput = document.getElementById('searchInput');
    searchInput.value = '';
    document.getElementById('bestMatchContainer').innerHTML = '';
    displayQAPairs(qaData);
}