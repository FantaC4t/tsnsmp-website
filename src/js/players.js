document.addEventListener('DOMContentLoaded', function() {
    console.log('Players page loaded');
    console.log('Player data:', typeof playerData !== 'undefined' ? playerData : 'playerData not found');
    
    const playersGrid = document.querySelector('.players-grid');
    const searchInput = document.getElementById('player-search');
    const rankFilters = document.querySelectorAll('.rank-filter');

    if (!playersGrid) {
        console.error('Players grid not found');
        return;
    }

    // Check if playerData exists
    if (typeof playerData === 'undefined') {
        console.error('playerData is not defined - make sure playerData.js is loaded');
        playersGrid.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">Error: Player data not loaded</p>';
        return;
    }

    // Function to create a player card
    function createPlayerCard(player) {
        return `
            <div class="player-card" data-rank="${player.rank}">
                <div class="player-avatar">
                    <img src="https://mc-heads.net/avatar/${player.username}/64" alt="${player.username} Avatar">
                </div>
                <div class="player-info">
                    <h3 class="custom-name" style="color: ${player.color};">${player.username}</h3>
                    <p class="player-pronouns">${player.pronouns}</p>
                    <p class="player-rank ${player.rank}">${player.rank.charAt(0).toUpperCase() + player.rank.slice(1)}</p>
                </div>
            </div>
        `;
    }

    // Function to render all players
    function renderPlayers(players = playerData) {
        console.log('Rendering players:', players.length);
        playersGrid.innerHTML = players.map(player => createPlayerCard(player)).join('');
    }

    // Initial render
    renderPlayers();

    // Search functionality
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            const filteredPlayers = playerData.filter(player => 
                player.username.toLowerCase().includes(searchTerm)
            );
            renderPlayers(filteredPlayers);
        });
    }

    // Rank filter functionality
    rankFilters.forEach(filter => {
        filter.addEventListener('click', function() {
            // Remove active class from all filters
            rankFilters.forEach(f => f.classList.remove('active'));
            // Add active class to clicked filter
            this.classList.add('active');

            const selectedRank = this.getAttribute('data-rank');
            let filteredPlayers;

            if (selectedRank === 'all') {
                filteredPlayers = playerData;
            } else {
                filteredPlayers = playerData.filter(player => player.rank === selectedRank);
            }

            renderPlayers(filteredPlayers);
        });
    });
});