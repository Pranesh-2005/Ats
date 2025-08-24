// Tab functionality
document.querySelectorAll('.tab-button').forEach(button => {
    button.addEventListener('click', () => {
        const tabName = button.dataset.tab;
        document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        button.classList.add('active');
        document.getElementById(`${tabName}-tab`).classList.add('active');
        clearResults();
    });
});

// File upload handlers
document.querySelectorAll('input[type="file"]').forEach(input => {
    input.addEventListener('change', function() {
        const fileName = this.files[0] ? this.files[0].name : 'No file selected';
        const fileNameSpan = document.getElementById(`${this.id}-name`);
        if (fileNameSpan) {
            fileNameSpan.textContent = fileName;
        }
    });
});

// Score form handler
document.getElementById('score-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const resumeFile = document.getElementById('score-resume').files[0];
    const jdText = document.getElementById('score-jd').value.trim();

    if (!resumeFile) {
        showError('score-results', 'Please select a resume file.');
        return;
    }
    if (!jdText) {
        showError('score-results', 'Please enter a job description.');
        return;
    }

    try {
        showLoading();

        const formData = new FormData();
        formData.append('resume', resumeFile);
        formData.append('jd', jdText);

        const response = await fetch('http://127.0.0.1:5000/score', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();
        hideLoading();

        if (data.error) {
            showError('score-results', data.error);
        } else {
            displayScoreResults(data.result);
        }
    } catch (error) {
        hideLoading();
        showError('score-results', `Error: ${error.message}`);
    }
});

// Improve form handler
document.getElementById('improve-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const resumeFile = document.getElementById('improve-resume').files[0];
    const jdText = document.getElementById('improve-jd').value.trim();

    if (!resumeFile) {
        showError('improve-results', 'Please select a resume file.');
        return;
    }

    try {
        showLoading();

        const formData = new FormData();
        formData.append('resume', resumeFile);
        formData.append('jd', jdText);

        const response = await fetch('http://127.0.0.1:5000/improve', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();
        hideLoading();

        if (data.error) {
            showError('improve-results', data.error);
        } else {
            displayImproveResults(data.result);
        }
    } catch (error) {
        hideLoading();
        showError('improve-results', `Error: ${error.message}`);
    }
});

// Helper functions
function showLoading() {
    document.getElementById('loading').classList.add('show');
}

function hideLoading() {
    document.getElementById('loading').classList.remove('show');
}

function clearResults() {
    document.querySelectorAll('.results').forEach(result => {
        result.classList.remove('show');
        result.innerHTML = '';
    });
}

function showError(containerId, message) {
    const container = document.getElementById(containerId);
    container.innerHTML = `<div class="error">${message}</div>`;
    container.classList.add('show');
}

function displayScoreResults(data) {
    const container = document.getElementById('score-results');
    let html = '';

    // If the result is Markdown (from your backend), display as HTML
    if (typeof data === "string" && data.trim().startsWith("##")) {
        html = marked.parse(data); // Use marked.js if you want Markdown parsing
    } else if (typeof data === "string") {
        html = `<pre>${data}</pre>`;
    } else if (data && data.overall_score !== undefined) {
        html = `
            <div class="score-display">
                <div class="score-number">${data.overall_score}%</div>
                <div class="score-label">ATS Compatibility Score</div>
            </div>
        `;
        if (data.category_scores) {
            html += `<div class="category-scores">`;
            Object.entries(data.category_scores).forEach(([category, score]) => {
                html += `
                    <div class="category-score">
                        <div class="score">${score}%</div>
                        <div class="label">${category}</div>
                    </div>
                `;
            });
            html += '</div>';
        }
        if (data.top_skill_gaps && data.top_skill_gaps.length > 0) {
            html += `
                <div class="skill-gaps">
                    <h4>Top Skill Gaps</h4>
                    <div>
                        ${data.top_skill_gaps.map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
                    </div>
                </div>
            `;
        }
    } else {
        html = `<pre>${JSON.stringify(data, null, 2)}</pre>`;
    }

    container.innerHTML = html;
    container.classList.add('show');
}

function displayImproveResults(data) {
    const container = document.getElementById('improve-results');
    let html = `
        <div class="suggestions">
            <h3>Improvement Suggestions</h3>
    `;

    if (typeof data === "string") {
        // Split by bullet points or line breaks for better formatting
        const suggestions = data
            .split(/[\n•]/)
            .filter(s => s.trim())
            .map(s => s.trim().replace(/^[-•\s]+/, ''));
        if (suggestions.length > 1) {
            html += `
                <ul>
                    ${suggestions.map(suggestion => `<li>${suggestion}</li>`).join('')}
                </ul>
            `;
        } else {
            html += `<p>${data}</p>`;
        }
    } else if (Array.isArray(data.suggestions)) {
        html += `
            <ul>
                ${data.suggestions.map(suggestion => `<li>${suggestion}</li>`).join('')}
            </ul>
        `;
    } else {
        html += `<pre>${JSON.stringify(data, null, 2)}</pre>`;
    }

    html += '</div>';
    container.innerHTML = html;
    container.classList.add('show');
}