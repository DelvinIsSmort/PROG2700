async function fetchData() {
    try {
        const errorDisplay = document.getElementById("errorMessage");
        const pokemonName = document.getElementById("pokemonName").value.toLowerCase();
        if (!pokemonName) return;

        // 1. CACHE CHECK
        const cacheKey = `pokemon_${pokemonName}`;
        const cachedData = localStorage.getItem(cacheKey);

        if (cachedData) {
            console.log("Serving from cache...");
            renderPokemonData(JSON.parse(cachedData));
            return; 
        }

        // 2. FETCH
        const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonName}`);
        if (!response.ok) throw new Error("Could not fetch resource");

        const data = await response.json();

        // 3. SAVE TO CACHE
        localStorage.setItem(cacheKey, JSON.stringify(data));
        
        // 4. DISPLAY
        renderPokemonData(data);

    } catch (error) {
        console.error(error);
    }
}

function renderPokemonData(data) {
    // --- 1. Image ---
    const img = document.getElementById("pokemonSprite");
    img.src = data.sprites.other.showdown.front_default;
    img.style.display = "block";

    // --- 2. Basic Info ---
    const detailsBox = document.getElementById("pokemonDetails");
    const types = data.types.map(i => i.type.name).join(", ");
    const abilities = data.abilities.map(i => i.ability.name).join(", ");
    
    let statsHTML = "<ul>";
    data.stats.forEach(i => {
        statsHTML += `<li><strong>${i.stat.name.toUpperCase()}:</strong> ${i.base_stat}</li>`;
    });
    statsHTML += "</ul>";

    detailsBox.innerHTML = `
        <h2>${data.name.toUpperCase()}</h2>
        <p><strong>Types:</strong> ${types}</p>
        <p><strong>Abilities:</strong> ${abilities}</p>
        <strong>Stats:</strong> ${statsHTML}
    `;

    // --- 4. Level-Up Moves ---
    const moveBody = document.getElementById("p_moves");
    const moveTable = document.getElementById("moveTable");

    moveBody.innerHTML = ""; 
    
    const levelUpMoves = data.moves.map(m => {
        const levelEntry = m.version_group_details.find(d => d.move_learn_method.name === "level-up");
        return levelEntry ? { name: m.move.name, level: levelEntry.level_learned_at } : null;
    }).filter(m => m !== null);

    levelUpMoves.sort((a, b) => a.level - b.level);

    if (levelUpMoves.length > 0) {
        moveTable.style.display = "table";
        levelUpMoves.forEach(m => {
            const row = `<tr>
                            <td>Lvl ${m.level}</td>
                            <td>${m.name.replace("-", " ")}</td>
                         </tr>`;
            moveBody.innerHTML += row;
        });
    }

    // --- 5. TM Moves (NEW) ---
    const tmBody = document.getElementById("p_tm_moves");
    const tmTable = document.getElementById("tmTable");

    if (tmBody && tmTable) {
        tmBody.innerHTML = ""; // Clear old moves

        // Filter moves learned by "machine" (TMs/HMs)
        const tmMoves = data.moves.filter(m => {
            return m.version_group_details.some(d => d.move_learn_method.name === "machine");
        }).map(m => m.move.name);

        tmMoves.sort(); // Sort alphabetically

        if (tmMoves.length > 0) {
            tmTable.style.display = "table";
            tmMoves.forEach(name => {
                const row = `<tr>
                                <td>${name.replace("-", " ")}</td>
                             </tr>`;
                tmBody.innerHTML += row;
            });
        } else {
            tmTable.style.display = "none";
        }
    }
}