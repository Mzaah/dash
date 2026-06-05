// ============================================================
// SUPABASE SETUP
// ============================================================
const { createClient } = supabase

const db = createClient(
  'https://xlljzsodolwsqjjitevg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhsbGp6c29kb2x3c3Fqaml0ZXZnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkyMzM1MzgsImV4cCI6MjA5NDgwOTUzOH0.rx7H11JYqUgi74ZVhEbGItu6jlIQE5MlWh0CxPRghlI'
)

const USER_ID = 'liam'

// ============================================================
// HJÄLPFUNKTIONER
// ============================================================
function getLocalDayString(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const todayStr = getLocalDayString(new Date())

// ============================================================
// HÄLSNING
// ============================================================
function updateGreeting() {
  const hour = new Date().getHours()
  const greetingEl = document.getElementById('greeting-title')
  if (hour < 10) {
    greetingEl.textContent = 'God morgon, Liam. 🙏'
  } else if (hour < 18) {
    greetingEl.textContent = 'God dag, Liam. 🙏'
  } else {
    greetingEl.textContent = 'God kväll, Liam. 🙏'
  }
}

// ============================================================
// FLIKAR (TABS) OCH SUB-TABS
// ============================================================
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'))
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'))
    btn.classList.add('active')
    document.getElementById(btn.dataset.target).classList.add('active')

    if (btn.dataset.target === 'tab-health') {
      renderWeightChart()
    }

    if (btn.dataset.target === 'tab-ideas') {
      setTimeout(() => {
        document.querySelectorAll('#tab-ideas textarea').forEach(textarea => {
          autoResize(textarea)
        })
      }, 10)
    }
  })
})

document.querySelectorAll('.sub-tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.sub-tab-btn').forEach(b => b.classList.remove('active'))
    document.querySelectorAll('.sub-tab-content').forEach(c => c.classList.remove('active'))
    btn.classList.add('active')
    document.getElementById(btn.dataset.target).classList.add('active')
    
    if (btn.dataset.target === 'health-oversikt') {
      renderWeightChart()
    }
  })
})

// ============================================================
// TO-DO LISTA (Global & Dagens Fokus)
// ============================================================
let globalTodos = []

async function loadTodos() {
  const { data } = await db
    .from('todos')
    .select('*')
    .eq('user_id', USER_ID)
    .eq('date', 'global')
    .maybeSingle()

  globalTodos = data?.todos || []
  renderGlobalTodos()
  renderDashboardTodos()
}

async function saveTodos() {
  await db.from('todos').upsert({
    user_id: USER_ID,
    date: 'global',
    todos: globalTodos,
    updated_at: new Date().toISOString()
  }, { onConflict: 'user_id,date' })
}

function renderGlobalTodos() {
  const list = document.getElementById('global-todo-list')
  if(!list) return
  list.innerHTML = ''
  
  globalTodos.forEach((todo, index) => {
    const card = document.createElement('div')
    card.className = 'todo-card'
    if (todo.checked) card.classList.add('checked')

    const left = document.createElement('div')
    left.className = 'todo-left'
    
    const checkbox = document.createElement('input')
    checkbox.type = 'checkbox'
    checkbox.className = 'list-checkbox'
    checkbox.checked = todo.checked
    checkbox.addEventListener('change', async (e) => {
      todo.checked = e.target.checked
      await saveTodos()
      renderGlobalTodos()
      renderDashboardTodos()
    })

    const text = document.createElement('span')
    text.className = 'list-text'
    text.textContent = todo.text

    left.appendChild(checkbox)
    left.appendChild(text)

    const right = document.createElement('div')
    right.className = 'todo-right'

    const starBtn = document.createElement('button')
    starBtn.className = 'todo-star-btn ' + (todo.starred ? 'active' : '')
    starBtn.innerHTML = '★'
    starBtn.addEventListener('click', async () => {
      todo.starred = !todo.starred
      await saveTodos()
      renderGlobalTodos()
      renderDashboardTodos()
    })

    const delBtn = document.createElement('button')
    delBtn.className = 'list-delete'
    delBtn.textContent = '×'
    delBtn.addEventListener('click', async () => {
      globalTodos.splice(index, 1)
      await saveTodos()
      renderGlobalTodos()
      renderDashboardTodos()
    })

    right.appendChild(starBtn)
    right.appendChild(delBtn)

    card.appendChild(left)
    card.appendChild(right)
    list.appendChild(card)
  })
}

function renderDashboardTodos() {
  const list = document.getElementById('dashboard-todo-list')
  if(!list) return
  list.innerHTML = ''

  const starredTodos = globalTodos.filter(t => t.starred)
  
  if(starredTodos.length === 0) {
    list.innerHTML = '<p style="color: var(--text-muted); font-size: 14px; font-style: italic;">Inga stjärnmärkta uppgifter. Gå till To-Do fliken för att markera uppgifter för idag.</p>'
    return
  }

  starredTodos.forEach(todo => {
    const item = document.createElement('div')
    item.className = 'list-item'
    if (todo.checked) item.classList.add('checked')

    const checkbox = document.createElement('input')
    checkbox.type = 'checkbox'
    checkbox.className = 'list-checkbox'
    checkbox.checked = todo.checked
    checkbox.addEventListener('change', async (e) => {
      todo.checked = e.target.checked
      await saveTodos()
      renderGlobalTodos()
      renderDashboardTodos()
    })

    const text = document.createElement('span')
    text.className = 'list-text'
    text.textContent = todo.text

    item.appendChild(checkbox)
    item.appendChild(text)
    list.appendChild(item)
  })
}

document.getElementById('add-global-todo-btn').addEventListener('click', addGlobalTodo)
document.getElementById('new-global-todo-input').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') addGlobalTodo()
})

async function addGlobalTodo() {
  const input = document.getElementById('new-global-todo-input')
  const val = input.value.trim()
  if (val) {
    globalTodos.push({ text: val, checked: false, starred: false })
    await saveTodos()
    renderGlobalTodos()
    renderDashboardTodos()
    input.value = ''
  }
}

// ============================================================
// VECKOPLANERARE
// ============================================================
const DAYS = ['Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lördag', 'Söndag']
let plannerData = {}

async function loadPlanner() {
  const { data } = await db.from('planner').select('*').eq('user_id', USER_ID)
  if (data) data.forEach(row => { plannerData[row.day] = row.content })
  initializePlanner()
}

async function savePlannerDay(day, content) {
  await db.from('planner').upsert({
    user_id: USER_ID, day: day, content: content, updated_at: new Date().toISOString()
  }, { onConflict: 'user_id,day' })
}

function autoResize(textarea) {
  textarea.style.height = 'auto'
  textarea.style.height = (textarea.scrollHeight + 2) + 'px'
}

function initializePlanner() {
  const plannerContainer = document.getElementById('planner-container')
  plannerContainer.innerHTML = ''
  DAYS.forEach(day => {
    const block = document.createElement('div')
    block.className = 'day-block'
    const title = document.createElement('h3')
    title.className = 'day-title'
    title.innerHTML = `<span style="color: var(--text-muted);">•</span> ${day}`
    const textarea = document.createElement('textarea')
    textarea.placeholder = 'Skriv något...'
    textarea.setAttribute('rows', '1')
    if (plannerData[day]) {
      textarea.value = plannerData[day]
      setTimeout(() => autoResize(textarea), 50)
    }
    textarea.addEventListener('input', async (e) => {
      autoResize(e.target)
      await savePlannerDay(day, e.target.value)
    })
    block.appendChild(title)
    block.appendChild(textarea)
    plannerContainer.appendChild(block)
  })
}

// ============================================================
// HABIT TRACKER (Kategoriserad med Cirkel & Accordion)
// ============================================================
let habitCategories = []
let habitData = {}
let expandedCategories = {} // Håller koll på vilka kategorier som är utfällda

async function loadHabitData() {
  const { data } = await db.from('habits').select('*').eq('user_id', USER_ID).maybeSingle()
  
  if (data) {
    if (data.habits && !data.categories) {
      habitCategories = [{ name: 'Mina Habits', items: data.habits }]
    } else {
      habitCategories = data.categories || []
    }
    habitData = data.habit_data || {}
  } else {
    habitCategories = [{ name: 'Morgonrutin', items: ['Stretcha', 'Drick vatten'] }]
    habitData = {}
  }

  if (!habitData[todayStr]) habitData[todayStr] = { checked: [] }

  renderHabits()
  updateStats()
}

async function saveHabitData() {
  await db.from('habits').upsert({
    user_id: USER_ID,
    categories: habitCategories,
    habit_data: habitData,
    updated_at: new Date().toISOString()
  }, { onConflict: 'user_id' })
  updateStats()
}

function renderHabits() {
  const container = document.getElementById('habit-categories-container')
  container.innerHTML = ''
  
  let totalHabitsAll = 0
  let checkedHabitsAll = 0

  habitCategories.forEach((category, catIndex) => {
    // Sätt standard-läge till stängd (false) om den inte finns i expandedCategories
    if (expandedCategories[category.name] === undefined) {
      expandedCategories[category.name] = false
    }

    let catTotal = category.items.length
    let catChecked = 0

    // Bygg HTML-struktur för de individuella vanorna först för att kunna räkna
    const contentDiv = document.createElement('div')
    contentDiv.className = 'habit-category-content'

    const itemList = document.createElement('div')
    category.items.forEach((item, itemIndex) => {
      totalHabitsAll++
      const isChecked = habitData[todayStr].checked.includes(item)
      if (isChecked) {
        checkedHabitsAll++
        catChecked++
      }

      const itemDiv = document.createElement('div')
      itemDiv.className = 'list-item'
      if (isChecked) itemDiv.classList.add('checked')

      const checkbox = document.createElement('input')
      checkbox.type = 'checkbox'
      checkbox.className = 'list-checkbox'
      checkbox.checked = isChecked
      checkbox.addEventListener('change', async (e) => {
        if (e.target.checked) {
          if (!habitData[todayStr].checked.includes(item)) habitData[todayStr].checked.push(item)
        } else {
          habitData[todayStr].checked = habitData[todayStr].checked.filter(h => h !== item)
        }
        await saveHabitData()
        renderHabits() // Renderar om när man klickar för att uppdatera räknare direkt
      })

      const text = document.createElement('span')
      text.className = 'list-text'
      text.textContent = item

      const delBtn = document.createElement('button')
      delBtn.className = 'list-delete'
      delBtn.textContent = '×'
      delBtn.addEventListener('click', async () => {
        category.items.splice(itemIndex, 1)
        habitData[todayStr].checked = habitData[todayStr].checked.filter(h => h !== item)
        await saveHabitData()
        renderHabits()
      })

      itemDiv.appendChild(checkbox)
      itemDiv.appendChild(text)
      itemDiv.appendChild(delBtn)
      itemList.appendChild(itemDiv)
    })
    
    contentDiv.appendChild(itemList)

    const addItemDiv = document.createElement('div')
    addItemDiv.className = 'add-habit-container add-sub-habit'
    addItemDiv.innerHTML = `
      <input type="text" id="new-item-${catIndex}" placeholder="Lägg till i ${category.name}...">
      <button onclick="addHabitItem(${catIndex})">+</button>
    `
    contentDiv.appendChild(addItemDiv)

    // Bygg lådan
    const catBlock = document.createElement('div')
    catBlock.className = 'habit-category-block'
    if (!expandedCategories[category.name]) {
      catBlock.classList.add('collapsed')
    }

    // Bygg det klickbara locket
    const catHeader = document.createElement('div')
    catHeader.className = 'habit-category-header'
    catHeader.onclick = (e) => {
      if (e.target.classList.contains('list-delete')) return // Förhindra expand när man klickar på radera
      expandedCategories[category.name] = !expandedCategories[category.name]
      renderHabits()
    }

    const isAllDone = (catTotal > 0 && catChecked === catTotal)

// ... (Här slutar din befintliga kod för catHeader.innerHTML) ...
    catHeader.innerHTML = `
      <div class="habit-category-header-left">
        <span class="habit-category-chevron">›</span>
        <span class="habit-category-title">${category.name}</span>
        <span class="habit-category-counter ${isAllDone ? 'done' : ''}">${catChecked}/${catTotal}</span>
      </div>
      <button class="list-delete" onclick="deleteCategory(${catIndex})">×</button>
    `

    // ============================================================
    // NYTT: SKAPA PROGRESSBAR FÖR KATEGORIN
    // ============================================================
    const progressBar = document.createElement('div')
    progressBar.className = 'habit-category-progress'

    const progressFill = document.createElement('div')
    progressFill.className = 'habit-category-progress-fill'

    // Räkna ut procenten för just den här lådan
    const catPercent = catTotal === 0 ? 0 : (catChecked / catTotal) * 100
    progressFill.style.width = `${catPercent}%`

    // Om alla habits i lådan är klara, lägg till klassen 'done'
    if (catPercent === 100 && catTotal > 0) {
      progressFill.classList.add('done')
    }

    progressBar.appendChild(progressFill)
    // ============================================================

    catBlock.appendChild(catHeader)
    catBlock.appendChild(progressBar) // <-- NYTT: Lägg till progressbaren här emellan!
    catBlock.appendChild(contentDiv)

    container.appendChild(catBlock)
  })

  updateProgressCircle(totalHabitsAll, checkedHabitsAll)
}
// Funktion för att fälla ner/gömma det nya inmatningsfältet
document.getElementById('toggle-category-btn').addEventListener('click', () => {
  const wrapper = document.getElementById('new-category-wrapper');
  
  // toggle('show') lägger till klassen om den saknas, och tar bort den om den finns
  wrapper.classList.toggle('show'); 
  
  // Om rutan precis öppnades, sätt muspekaren i fältet automatiskt
  if (wrapper.classList.contains('show')) {
    document.getElementById('new-category-input').focus();
  }
});
document.getElementById('add-category-btn').addEventListener('click', addCategory)
document.getElementById('new-category-input').addEventListener('keypress', (e) => { if (e.key === 'Enter') addCategory() })

async function addCategory() {
  const input = document.getElementById('new-category-input')
  const val = input.value.trim()
  if (val) {
    habitCategories.push({ name: val, items: [] })
    expandedCategories[val] = true // Fäll ut lådan direkt när den nyskapas
    await saveHabitData()
    renderHabits()
    document.getElementById('new-category-wrapper').classList.remove('show');
    input.value = ''
  }
}

window.deleteCategory = async function(index) {
  if (confirm(`Vill du verkligen ta bort hela kategorin "${habitCategories[index].name}"?`)) {
    const catName = habitCategories[index].name
    delete expandedCategories[catName] // Rensa upp minnet för den expanderade rutan
    habitCategories.splice(index, 1)
    await saveHabitData()
    renderHabits()
  }
}

window.addHabitItem = async function(catIndex) {
  const input = document.getElementById(`new-item-${catIndex}`)
  const val = input.value.trim()
  if (val && !habitCategories[catIndex].items.includes(val)) {
    habitCategories[catIndex].items.push(val)
    await saveHabitData()
    renderHabits()
  }
}

function updateProgressCircle(total, checked) {
  const circle = document.getElementById('habit-progress-circle')
  const text = document.getElementById('habit-progress-text')
  
  if (!circle || !text) return

  const radius = circle.r.baseVal.value
  const circumference = radius * 2 * Math.PI
  const percent = total === 0 ? 0 : (checked / total) * 100
  
  circle.style.strokeDasharray = `${circumference} ${circumference}`
  const offset = circumference - (percent / 100) * circumference
  circle.style.strokeDashoffset = offset
  
  text.textContent = `${Math.round(percent)}%`
}

// ============================================================
// STATS
// ============================================================
function updateStats() {
  const now = new Date()
  const start = new Date(now.getFullYear(), 0, 1)
  const end = new Date(now.getFullYear() + 1, 0, 1)
  const percent = ((now - start) / (end - start)) * 100

  document.getElementById('year-percent').textContent = percent.toFixed(1) + '%'
  document.getElementById('year-label').textContent = `av ${now.getFullYear()} avklarat`
  setTimeout(() => {
    document.getElementById('year-progress-fill').style.width = percent + '%'
  }, 100)

  let currentStreak = 0
  const today = new Date()
  for (let i = 0; i < 365; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    const dateStr = getLocalDayString(d)
    const data = habitData[dateStr]

    if (data && data.checked && data.checked.length > 0) {
      currentStreak++
    } else {
      if (i === 0) continue
      else break
    }
  }
  document.getElementById('streak-counter').textContent = currentStreak
}

// ============================================================
// IDÉ & PROJEKT
// ============================================================
const ideaCategories = [
  { id: 'drakenberg', label: 'DRAKENBERG' },
  { id: 'ines', label: 'INES' },
  { id: 'isk', label: 'ISK' },
  { id: 'annat', label: 'ANNAT' }
]
let projectIdeas = { drakenberg: '', ines: '', isk: '', annat: '' }

async function loadIdeas() {
  const { data } = await db.from('ideas').select('*').eq('user_id', USER_ID).maybeSingle()
  if (data?.ideas) { projectIdeas = { drakenberg: '', ines: '', isk: '', annat: '', ...data.ideas } }
  initializeIdeas()
}

async function saveIdeas() {
  await db.from('ideas').upsert({ user_id: USER_ID, ideas: projectIdeas, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
}

function initializeIdeas() {
  const container = document.getElementById('ideas-container')
  container.innerHTML = ''
  ideaCategories.forEach(cat => {
    const block = document.createElement('div')
    block.className = 'day-block'
    const title = document.createElement('h2')
    title.className = 'section-title'
    title.style.marginBottom = '12px'
    title.textContent = cat.label
    const textarea = document.createElement('textarea')
    textarea.placeholder = 'Skriv ner tankar, planer eller idéer...'
    textarea.setAttribute('rows', '1')
    if (Array.isArray(projectIdeas[cat.id])) textarea.value = projectIdeas[cat.id].join('\n')
    else textarea.value = projectIdeas[cat.id] || ''
    setTimeout(() => autoResize(textarea), 50)
    textarea.addEventListener('input', async (e) => {
      autoResize(e.target)
      projectIdeas[cat.id] = e.target.value
      await saveIdeas()
    })
    block.appendChild(title)
    block.appendChild(textarea)
    container.appendChild(block)
  })
}

// ============================================================
// SUPPLEMENT TRACKER
// ============================================================
let supplements = []
let supplementLog = {}

async function loadSupplements() {
  const { data } = await db.from('supplements').select('*').eq('user_id', USER_ID).maybeSingle()
  if (data) { supplements = data.supplements || []; supplementLog = data.log || {} }
  if (!supplementLog[todayStr]) supplementLog[todayStr] = []
  renderSupplements()
}

async function saveSupplements() {
  await db.from('supplements').upsert({ user_id: USER_ID, supplements: supplements, log: supplementLog, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
}

function getLast5Days() {
  const days = []; for (let i = 4; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); days.push(getLocalDayString(d)) } return days
}

function renderSupplements() {
  const container = document.getElementById('supplement-list')
  container.innerHTML = ''
  const last5 = getLast5Days()
  supplements.forEach((supp, index) => {
    const isTakenToday = supplementLog[todayStr]?.includes(supp)
    const card = document.createElement('div')
    card.className = 'supplement-card' + (isTakenToday ? ' taken' : ' not-taken')
    const left = document.createElement('div')
    left.className = 'supplement-left'
    const name = document.createElement('span')
    name.className = 'supplement-name'
    name.textContent = supp
    const streak = document.createElement('div')
    streak.className = 'supplement-streak'
    last5.forEach(dateStr => {
      const dot = document.createElement('div')
      const taken = supplementLog[dateStr]?.includes(supp)
      dot.className = 'streak-dot' + (taken ? ' done' : ' missed')
      streak.appendChild(dot)
    })
    left.appendChild(name)
    left.appendChild(streak)
    const right = document.createElement('div')
    right.className = 'supplement-right'
    const toggle = document.createElement('button')
    toggle.className = 'supplement-toggle' + (isTakenToday ? ' active' : '')
    toggle.textContent = isTakenToday ? 'Tagen ✓' : 'Markera'
    toggle.addEventListener('click', async () => {
      if (supplementLog[todayStr].includes(supp)) supplementLog[todayStr] = supplementLog[todayStr].filter(s => s !== supp)
      else supplementLog[todayStr].push(supp)
      await saveSupplements()
      renderSupplements()
    })
    const delBtn = document.createElement('button')
    delBtn.className = 'list-delete'
    delBtn.textContent = '×'
    delBtn.addEventListener('click', async () => {
      supplements.splice(index, 1)
      Object.keys(supplementLog).forEach(date => { supplementLog[date] = supplementLog[date].filter(s => s !== supp) })
      await saveSupplements()
      renderSupplements()
    })
    right.appendChild(toggle)
    right.appendChild(delBtn)
    card.appendChild(left)
    card.appendChild(right)
    container.appendChild(card)
  })
}

document.getElementById('add-supplement-btn').addEventListener('click', addSupplement)
document.getElementById('new-supplement-input').addEventListener('keypress', (e) => { if (e.key === 'Enter') addSupplement() })
async function addSupplement() {
  const input = document.getElementById('new-supplement-input')
  const val = input.value.trim()
  if (val && !supplements.includes(val)) {
    supplements.push(val)
    if (!supplementLog[todayStr]) supplementLog[todayStr] = []
    await saveSupplements()
    renderSupplements()
    input.value = ''
  }
}

// ============================================================
// VIKT & HÄLSA
// ============================================================
let weightData = []
let weightChartInstance = null

async function loadWeightData() {
  const { data } = await db.from('weight').select('*').eq('user_id', USER_ID).maybeSingle()
  if (data?.weight_data) weightData = data.weight_data
  renderWeightChart()
}
async function saveWeightData() { await db.from('weight').upsert({ user_id: USER_ID, weight_data: weightData, updated_at: new Date().toISOString() }, { onConflict: 'user_id' }) }

function renderWeightChart() {
  const ctx = document.getElementById('weightChart').getContext('2d')
  if (weightChartInstance) weightChartInstance.destroy()
  Chart.defaults.color = '#8e8a86'
  Chart.defaults.font.family = 'ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif'
  weightChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: weightData.map(d => d.date),
      datasets: [{
        label: 'Vikt (kg)', data: weightData.map(d => d.weight),
        borderColor: '#3dd68c', backgroundColor: 'rgba(61, 214, 140, 0.1)', borderWidth: 2,
        pointBackgroundColor: '#1c1a19', pointBorderColor: '#3dd68c', pointBorderWidth: 2, pointRadius: 4, fill: true, tension: 0.3
      }]
    },
    options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: false, grid: { color: '#2c2927' } }, x: { grid: { display: false } } }, plugins: { legend: { display: false } } }
  })
}

document.getElementById('add-weight-btn').addEventListener('click', addWeight)
document.getElementById('new-weight-input').addEventListener('keypress', (e) => { if (e.key === 'Enter') addWeight() })
async function addWeight() {
  const input = document.getElementById('new-weight-input')
  const val = parseFloat(input.value.replace(',', '.'))
  if (!isNaN(val)) {
    const dateStr = getLocalDayString(new Date())
    const existingIndex = weightData.findIndex(d => d.date === dateStr)
    if (existingIndex !== -1) weightData[existingIndex].weight = val
    else weightData.push({ date: dateStr, weight: val })
    weightData.sort((a, b) => new Date(a.date) - new Date(b.date))
    await saveWeightData()
    renderWeightChart()
    input.value = ''
  }
}

// ============================================================
// GYM & PROGRESSIVE OVERLOAD
// ============================================================
let gymExercises = []
async function loadGymData() { const { data } = await db.from('gym').select('*').eq('user_id', USER_ID).maybeSingle(); if (data?.exercises) gymExercises = data.exercises; renderGym() }
async function saveGymData() { await db.from('gym').upsert({ user_id: USER_ID, exercises: gymExercises, updated_at: new Date().toISOString() }, { onConflict: 'user_id' }) }

function renderGym() {
  const list = document.getElementById('gym-list')
  list.innerHTML = ''
  gymExercises.sort((a, b) => a.name.localeCompare(b.name, 'sv'))
  gymExercises.forEach((ex, index) => {
    const container = document.createElement('div')
    container.className = 'gym-card-container'
    const underlayDelete = document.createElement('div')
    underlayDelete.className = 'gym-delete-underlay'
    underlayDelete.textContent = 'Radera'
    underlayDelete.addEventListener('click', async () => {
      if (confirm(`Vill du ta bort övningen "${ex.name}"?`)) { gymExercises.splice(index, 1); await saveGymData(); renderGym() }
    })
    const card = document.createElement('div')
    card.className = 'gym-card'
    const name = document.createElement('div')
    name.className = 'gym-name'
    name.textContent = ex.name
    const inputs = document.createElement('div')
    inputs.className = 'gym-inputs'
    const kgGroup = document.createElement('div')
    kgGroup.className = 'gym-input-group'
    const kgInput = document.createElement('input')
    kgInput.type = 'number'
    kgInput.step = '0.5'
    kgInput.value = ex.weight || ''
    kgInput.placeholder = '-'
    kgInput.addEventListener('change', async (e) => { ex.weight = e.target.value; await saveGymData() })
    const kgLabel = document.createElement('label')
    kgLabel.textContent = 'kg'
    kgGroup.appendChild(kgInput); kgGroup.appendChild(kgLabel)
    const repGroup = document.createElement('div')
    repGroup.className = 'gym-input-group'
    const repInput = document.createElement('input')
    repInput.type = 'number'
    repInput.value = ex.reps || ''
    repInput.placeholder = '-'
    repInput.addEventListener('change', async (e) => { ex.reps = e.target.value; await saveGymData() })
    const repLabel = document.createElement('label')
    repLabel.textContent = 'reps'
    repGroup.appendChild(repInput); repGroup.appendChild(repLabel)
    inputs.appendChild(kgGroup); inputs.appendChild(repGroup)
    card.appendChild(name); card.appendChild(inputs)
    let touchStartX = 0; let touchStartY = 0
    card.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; touchStartY = e.touches[0].clientY }, { passive: true })
    card.addEventListener('touchend', e => {
      const touchEndX = e.changedTouches[0].clientX; const touchEndY = e.changedTouches[0].clientY
      const swipeDistanceX = touchStartX - touchEndX; const swipeDistanceY = Math.abs(touchStartY - touchEndY)
      if (swipeDistanceY < 40) {
        if (swipeDistanceX > 60) { document.querySelectorAll('.gym-card').forEach(c => { if (c !== card) c.classList.remove('swiped') }); card.classList.add('swiped') }
        else if (swipeDistanceX < -60) card.classList.remove('swiped')
      }
    }, { passive: true })
    container.appendChild(underlayDelete); container.appendChild(card); list.appendChild(container)
  })
}

document.getElementById('add-exercise-btn').addEventListener('click', addExercise)
document.getElementById('new-exercise-input').addEventListener('keypress', (e) => { if (e.key === 'Enter') addExercise() })
async function addExercise() {
  const input = document.getElementById('new-exercise-input')
  const val = input.value.trim()
  if (val && !gymExercises.find(e => e.name.toLowerCase() === val.toLowerCase())) {
    gymExercises.push({ name: val, weight: '', reps: '' })
    await saveGymData()
    renderGym()
    input.value = ''
  }
}

// ============================================================
// REALTIDSSYNK & INIT
// ============================================================
function setupRealtimeSync() {
  db.channel('dashboard-sync')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'habits', filter: `user_id=eq.${USER_ID}` }, () => { loadHabitData() })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'todos', filter: `user_id=eq.${USER_ID}` }, () => { loadTodos() })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'planner', filter: `user_id=eq.${USER_ID}` }, () => { loadPlanner() })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'ideas', filter: `user_id=eq.${USER_ID}` }, () => { loadIdeas() })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'weight', filter: `user_id=eq.${USER_ID}` }, () => { loadWeightData() })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'supplements', filter: `user_id=eq.${USER_ID}` }, () => { loadSupplements() })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'gym', filter: `user_id=eq.${USER_ID}` }, () => { loadGymData() })
    .subscribe()
}

async function loadDailyVerse() {
  try {
    const response = await fetch('https://labs.bible.org/api/?passage=votd&type=json')
    const data = await response.json()
    if (data && data.length > 0) {
      const cleanText = data[0].text.replace(/<[^>]+>/g, '').trim()
      document.getElementById('bible-text').innerText = `"${cleanText}"`
      document.getElementById('bible-reference').innerText = `— ${data[0].bookname} ${data[0].chapter}:${data[0].verse}`
    }
  } catch (error) {
    document.getElementById('bible-text').innerText = '"I can do all things through Christ who strengthens me."'
    document.getElementById('bible-reference').innerText = "— Philippians 4:13"
  }
}

async function init() {
  updateGreeting()
  loadDailyVerse()
  await Promise.all([ loadHabitData(), loadTodos(), loadPlanner(), loadIdeas(), loadWeightData(), loadSupplements(), loadGymData() ])
  setupRealtimeSync()
}

init()
