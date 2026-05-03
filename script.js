const DAYS = ['Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lördag', 'Söndag'];
const container = document.getElementById('planner-container');

// Funktion för att få textfältet att växa automatiskt (Notion-känsla)
function autoResize(textarea) {
  textarea.style.height = 'auto';
  textarea.style.height = textarea.scrollHeight + 'px';
}

function initializePlanner() {
  DAYS.forEach(day => {
    // Skapa blocket för dagen
    const block = document.createElement('div');
    block.className = 'day-block';

    // Skapa rubriken
    const title = document.createElement('h3');
    title.className = 'day-title';
    // Lägger till en liten prick för stilrenhet
    title.innerHTML = `<span style="color: var(--text-muted);">•</span> ${day}`;

    // Skapa textfältet
    const textarea = document.createElement('textarea');
    textarea.placeholder = "Skriv något...";
    textarea.setAttribute('rows', '1');
    
    // Ladda sparad data
    const savedPlan = localStorage.getItem(`notion_plan_${day}`);
    if (savedPlan) {
      textarea.value = savedPlan;
      // Fördröj resize en millisekund så att webbläsaren hinner rendera texten
      setTimeout(() => autoResize(textarea), 0);
    }

    // Spara data och anpassa storlek när du skriver
    textarea.addEventListener('input', (e) => {
      localStorage.setItem(`notion_plan_${day}`, e.target.value);
      autoResize(e.target);
    });

    // Sätt ihop allt
    block.appendChild(title);
    block.appendChild(textarea);
    container.appendChild(block);
  });
}

initializePlanner();