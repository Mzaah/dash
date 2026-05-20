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
// FLIKAR (TABS)
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
  })
})

// ============================================================
// TO-DO LISTA
// ============================================================
let todos = []

async function loadTodos() {
  const { data } = await db
    .from('todos')
    .select('*')
    .eq('user_id', USER_ID)
    .eq('date', todayStr)
    .maybeSingle()

  todos = data?.todos || []
  renderTodos()
}

async function saveTodos() {
  await db.from('todos').upsert({
    user_id: USER_ID,
    date: todayStr,
    todos: todos,
    updated_at: new Date().toISOString()
  }, { onConflict: 'user_id,date' })
}

function renderTodos() {
  const list = document.getElementById('todo-list')
  list.innerHTML = ''
  todos.forEach((todo, index) => {
    const item = document.createElement('div')
    item.className = 'list-item'
    if (todo.checked) item.classList.add('checked')

    const checkbox = document.createElement('input')
    checkbox.type = 'checkbox'
    checkbox.className = 'list-checkbox'
    checkbox.checked = todo.checked

    checkbox.addEventListener('change', async (e) => {
      todo.checked = e.target.checked
      if (todo.checked) item.classList.add('checked')
      else item.classList.remove('checked')
      await saveTodos()
    })

    const text = document.createElement('span')
    text.className = 'list-text'
    text.textContent = todo.text

    const delBtn = document.createElement('button')
    delBtn.className = 'list-delete'
    delBtn.textContent = '×'
    delBtn.addEventListener('click', async () => {
      todos.splice(index, 1)
      await saveTodos()
      renderTodos()
    })

    item.appendChild(checkbox)
    item.appendChild(text)
    item.appendChild(delBtn)
    list.appendChild(item)
  })
}

document.getElementById('add-todo-btn').addEventListener('click', addTodo)
document.getElementById('new-todo-input').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') addTodo()
})

async function addTodo() {
  const input = document.getElementById('new-todo-input')
  const val = input.value.trim()
  if (val) {
    todos.push({ text: val, checked: false })
    await saveTodos()
    renderTodos()
    input.value = ''
  }
}

// ============================================================
// VECKOPLANERARE
// ============================================================
const DAYS = ['Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lördag', 'Söndag']
let plannerData = {}

async function loadPlanner() {
  const { data } = await db
    .from('planner')
    .select('*')
    .eq('user_id', USER_ID)

  if (data) {
    data.forEach(row => {
      plannerData[row.day] = row.content
    })
  }

  initializePlanner()
}

async function savePlannerDay(day, content) {
  await db.from('planner').upsert({
    user_id: USER_ID,
    day: day,
    content: content,
    updated_at: new Date().toISOString()
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
// HABIT TRACKER & HEATMAP
// ============================================================
let habits = []
let habitData = {}

async function loadHabitData() {
  const { data } = await db
    .from('habits')
    .select('*')
    .eq('user_id', USER_ID)
    .maybeSingle()

  if (data) {
    habits = data.habits || ['Träning', 'Läsning']
    habitData = data.habit_data || {}
  } else {
    habits = ['Träning', 'Läsning']
    habitData = {}
  }

  if (!habitData[todayStr]) {
    habitData[todayStr] = { checked: [], total: habits.length }
  } else {
    habitData[todayStr].total = habits.length
  }

  renderHabits()
  renderHeatmap()
  updateStats()
}

async function saveHabitData() {
  await db.from('habits').upsert({
    user_id: USER_ID,
    habits: habits,
    habit_data: habitData,
    updated_at: new Date().toISOString()
  }, { onConflict: 'user_id' })

  renderHeatmap()
  updateStats()
}

function renderHabits() {
  const list = document.getElementById('habit-list')
  list.innerHTML = ''

  habits.forEach((habit, index) => {
    const item = document.createElement('div')
    item.className = 'list-item'

    const isChecked = habitData[todayStr]?.checked.includes(habit)
    if (isChecked) item.classList.add('checked')

    const checkbox = document.createElement('input')
    checkbox.type = 'checkbox'
    checkbox.className = 'list-checkbox'
    checkbox.checked = isChecked

    checkbox.addEventListener('change', async (e) => {
      if (e.target.checked) {
        if (!habitData[todayStr].checked.includes(habit)) {
          habitData[todayStr].checked.push(habit)
        }
        item.classList.add('checked')
      } else {
        habitData[todayStr].checked = habitData[todayStr].checked.filter(h => h !== habit)
        item.classList.remove('checked')
      }
      await saveHabitData()
    })

    const text = document.createElement('span')
    text.className = 'list-text'
    text.textContent = habit

    const delBtn = document.createElement('button')
    delBtn.className = 'list-delete'
    delBtn.textContent = '×'
    delBtn.addEventListener('click', async () => {
      habits.splice(index, 1)
      habitData[todayStr].checked = habitData[todayStr].checked.filter(h => h !== habit)
      habitData[todayStr].total = habits.length
      await saveHabitData()
      renderHabits()
    })

    item.appendChild(checkbox)
    item.appendChild(text)
    item.appendChild(delBtn)
    list.appendChild(item)
  })
}

document.getElementById('add-habit-btn').addEventListener('click', addHabit)
document.getElementById('new-habit-input').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') addHabit()
})

async function addHabit() {
  const input = document.getElementById('new-habit-input')
  const val = input.value.trim()
  if (val && !habits.includes(val)) {
    habits.push(val)
    habitData[todayStr].total = habits.length
    await saveHabitData()
    renderHabits()
    input.value = ''
  }
}

function renderHeatmap() {
  const heatmap = document.getElementById('heatmap')
  heatmap.innerHTML = ''

  const numDays = 364
  const today = new Date()
  const firstDate = new Date(today)
  firstDate.setDate(today.getDate() - numDays)
  let startDay = firstDate.getDay()
  startDay = startDay === 0 ? 6 : startDay - 1

  for (let i = 0; i < startDay; i++) {
    const empty = document.createElement('div')
    empty.className = 'heatmap-cell empty'
    empty.style.backgroundColor = 'transparent'
    heatmap.appendChild(empty)
  }

  for (let i = numDays; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    const dateStr = getLocalDayString(d)

    const cell = document.createElement('div')
    cell.className = 'heatmap-cell'
    cell.title = dateStr

    const data = habitData[dateStr]
    if (data && data.total > 0) {
      const percentage = data.checked.length / data.total
      if (percentage > 0) {
        if (percentage <= 0.25) cell.classList.add('color-1')
        else if (percentage <= 0.5) cell.classList.add('color-2')
        else if (percentage <= 0.75) cell.classList.add('color-3')
        else cell.classList.add('color-4')
      }
    }
    heatmap.appendChild(cell)
  }

  const wrapper = document.querySelector('.heatmap-wrapper')
  wrapper.scrollLeft = wrapper.scrollWidth
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
  const { data } = await db
    .from('ideas')
    .select('*')
    .eq('user_id', USER_ID)
    .maybeSingle()

  if (data?.ideas) {
    projectIdeas = { drakenberg: '', ines: '', isk: '', annat: '', ...data.ideas }
  }

  initializeIdeas()
}

async function saveIdeas() {
  await db.from('ideas').upsert({
    user_id: USER_ID,
    ideas: projectIdeas,
    updated_at: new Date().toISOString()
  }, { onConflict: 'user_id' })
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

    if (Array.isArray(projectIdeas[cat.id])) {
      textarea.value = projectIdeas[cat.id].join('\n')
    } else {
      textarea.value = projectIdeas[cat.id] || ''
    }

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
// VIKT & HÄLSA
// ============================================================
let weightData = []
let weightChartInstance = null

async function loadWeightData() {
  const { data } = await db
    .from('weight')
    .select('*')
    .eq('user_id', USER_ID)
    .maybeSingle()

  if (data?.weight_data) {
    weightData = data.weight_data
  }

  renderWeightChart()
}

async function saveWeightData() {
  await db.from('weight').upsert({
    user_id: USER_ID,
    weight_data: weightData,
    updated_at: new Date().toISOString()
  }, { onConflict: 'user_id' })
}

function renderWeightChart() {
  const ctx = document.getElementById('weightChart').getContext('2d')

  if (weightChartInstance) {
    weightChartInstance.destroy()
  }

  Chart.defaults.color = '#8e8a86'
  Chart.defaults.font.family = 'ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif'

  weightChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: weightData.map(d => d.date),
      datasets: [{
        label: 'Vikt (kg)',
        data: weightData.map(d => d.weight),
        borderColor: '#3dd68c',
        backgroundColor: 'rgba(61, 214, 140, 0.1)',
        borderWidth: 2,
        pointBackgroundColor: '#1c1a19',
        pointBorderColor: '#3dd68c',
        pointBorderWidth: 2,
        pointRadius: 4,
        fill: true,
        tension: 0.3
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: { beginAtZero: false, grid: { color: '#2c2927' } },
        x: { grid: { display: false } }
      },
      plugins: { legend: { display: false } }
    }
  })
}

document.getElementById('add-weight-btn').addEventListener('click', addWeight)
document.getElementById('new-weight-input').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') addWeight()
})

async function addWeight() {
  const input = document.getElementById('new-weight-input')
  const val = parseFloat(input.value.replace(',', '.'))

  if (!isNaN(val)) {
    const dateStr = getLocalDayString(new Date())
    const existingIndex = weightData.findIndex(d => d.date === dateStr)

    if (existingIndex !== -1) {
      weightData[existingIndex].weight = val
    } else {
      weightData.push({ date: dateStr, weight: val })
    }

    weightData.sort((a, b) => new Date(a.date) - new Date(b.date))
    await saveWeightData()
    renderWeightChart()
    input.value = ''
  }
}

// ============================================================
// REALTIDSSYNK
// ============================================================
function setupRealtimeSync() {
  db.channel('dashboard-sync')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'habits', filter: `user_id=eq.${USER_ID}` }, () => {
      loadHabitData()
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'todos', filter: `user_id=eq.${USER_ID}` }, () => {
      loadTodos()
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'planner', filter: `user_id=eq.${USER_ID}` }, () => {
      loadPlanner()
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'ideas', filter: `user_id=eq.${USER_ID}` }, () => {
      loadIdeas()
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'weight', filter: `user_id=eq.${USER_ID}` }, () => {
      loadWeightData()
    })
    .subscribe()
}

// ============================================================
// STARTA APPEN
// ============================================================
async function init() {
  updateGreeting()
  await Promise.all([
    loadHabitData(),
    loadTodos(),
    loadPlanner(),
    loadIdeas(),
    loadWeightData()
  ])
  setupRealtimeSync()
}

init()
