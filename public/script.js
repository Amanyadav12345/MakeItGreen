let chart;

document.getElementById('projectForm').addEventListener('submit', async e => {
  e.preventDefault();
  const projectName = document.getElementById('projectName').value.trim();
  const priority = document.getElementById('priority').value;

  if (!projectName) return;

  await fetch('/api/projects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projectName, priority })
  });

  document.getElementById('projectName').value = '';
  loadProjects();
});

document.getElementById('projectSelect').addEventListener('change', e => {
  const project = e.target.value;
  loadWorkers(project);
});

document.querySelector('.track-button').addEventListener('click', () => {
    window.location.href = 'watch-workers.html';  // 👈 Redirect to new page
  });

document.getElementById('workerForm').addEventListener('submit', async e => {
    e.preventDefault();
    const name = document.getElementById('name').value;
    const role = document.getElementById('role').value;
    const isExtra = document.getElementById('isExtra').checked;
    const project = document.getElementById('projectSelect').value;
  
    await fetch(`/api/projects/${project}/workers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, role, isExtra })
    });
  
    document.getElementById('name').value = '';
    document.getElementById('role').value = '';
    document.getElementById('isExtra').checked = false;
  
    loadWorkers(project);
    loadProjects(); // Update chart and dropdown
  });
  document.getElementById('chatForm').addEventListener('submit', async e => {
    e.preventDefault();
    const input = document.getElementById('chatInput').value;
    const output = document.getElementById('chatOutput');
  
    output.innerHTML = '<em>Thinking...</em>';
    document.getElementById('chatInput').value = '';
  
    try {
      const res = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userQuery: input })
      });
  
      const data = await res.json();
  
      const cleanedHtml = data.reply
      .replace(/^```html\s*/i, '')  // remove starting ```html
      .replace(/```$/i, '');        // remove ending ```
    
    output.innerHTML = sanitizeHTML(cleanedHtml);
    } catch (err) {
      output.textContent = 'Something went wrong.';
    }
  });
document.getElementById('aiBtn').addEventListener('click', async () => {
  const btn = document.getElementById('aiBtn');
  const output = document.getElementById('aiOutput');
  btn.disabled = true;
  btn.textContent = 'Analyzing...';
  output.textContent = '';

  try {
    const res = await fetch('/api/recommendations', { method: 'POST' });
    const data = await res.json();
    output.textContent = data.recommendation;
  } catch (err) {
    output.textContent = 'Something went wrong. Try again later.';
  }

  btn.disabled = false;
  btn.textContent = 'Get Recommendations';
});
function sanitizeHTML(html) {
  const template = document.createElement('template');
  template.innerHTML = html.trim();

  // Remove any <script> tags for safety
  const scripts = template.content.querySelectorAll('script');
  scripts.forEach(script => script.remove());

  return template.innerHTML;
}
async function loadProjects() {
    const res = await fetch('/api/projects');
    const projects = await res.json();
  
    const select = document.getElementById('projectSelect');
    const currentSelection = select.value; // 👈 Remember selected project
    select.innerHTML = '';
  
    let found = false;
    projects.forEach(p => {
      const option = document.createElement('option');
      option.value = p.name;
      option.textContent = `${p.name} [${p.priority}]`;
      if (p.name === currentSelection) {
        option.selected = true;
        found = true;
      }
      select.appendChild(option);
    });
  
    // If project was removed or not found, fallback to first
    const activeProject = found ? currentSelection : (projects[0]?.name || '');
    if (activeProject) {
      loadWorkers(activeProject);
    }
  
    updateChart(projects);
  }

async function loadWorkers(project) {
  const res = await fetch(`/api/projects/${encodeURIComponent(project)}/workers`);
  const workers = await res.json();
  const tbody = document.querySelector('#workerTable tbody');
  tbody.innerHTML = '';

  workers.forEach(w => {
    const row = document.createElement('tr');

    if (w.isExtra) {
      row.classList.add('extra-worker'); // Optional: add CSS class for orange background
    }

    // ✅ Append (Extra) to role if marked extra
    const roleText = w.role + (w.isExtra ? ' (Extra)' : '');

    row.innerHTML = `
      <td>${w.name}</td>
      <td>${roleText}</td>
    `;

    tbody.appendChild(row);
  });
}
function updateChart(projects) {
  const labels = projects.map(p => p.name);
  const data = projects.map(p => p.workerCount);

  if (chart) chart.destroy();

  const ctx = document.getElementById('projectChart').getContext('2d');
  chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Number of Workers',
        data: data,
        backgroundColor: 'rgba(54, 162, 235, 0.7)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
}

loadProjects();