const API_BASE_URL = 'https://atsbackend-jozn.onrender.com';

// Tab functionality
document.querySelectorAll('.tab-button').forEach(button => {
    button.addEventListener('click', () => {
        const tabName = button.dataset.tab;
        
        // Remove active class from all tabs and content
        document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        
        // Add active class to clicked tab and corresponding content
        button.classList.add('active');
        document.getElementById(`${tabName}-tab`).classList.add('active');
        
        // Clear results
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
    
    const formData = new FormData();
    formData.append('resume', resumeFile);
    formData.append('jd', jdText);
    
    try {
        showLoading();
        
        const response = await fetch(`${API_BASE_URL}/score`, {
            method: 'POST',
            body: formData
        });
        
        hideLoading();
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        displayScoreResults(data);
        
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
    
    const formData = new FormData();
    formData.append('resume', resumeFile);
    if (jdText) {
        formData.append('jd', jdText);
    }
    
    try {
        showLoading();
        
        const response = await fetch(`${API_BASE_URL}/improve`, {
            method: 'POST',
            body: formData
        });
        
        hideLoading();
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        displayImproveResults(data);
        
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
    
    // Handle the JSON response from your score function
    if (data.overall_score !== undefined) {
        html = `
            <div class="score-display">
                <div class="score-number">${data.overall_score}%</div>
                <div class="score-label">ATS Compatibility Score</div>
            </div>
        `;
        
        // Display category scores if available
        if (data.category_scores) {
            html += `
                <div class="category-scores">
            `;
            
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
        
        // Display skill gaps if available
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
        // Fallback for any other response format
        html = `
            <div class="suggestions">
                <h3>Analysis Results</h3>
                <pre>${JSON.stringify(data, null, 2)}</pre>
            </div>
        `;
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
    
    if (data.suggestions) {
        // Handle string response from your improve function
        if (typeof data.suggestions === 'string') {
            // Split by bullet points or line breaks for better formatting
            const suggestions = data.suggestions
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
                html += `<p>${data.suggestions}</p>`;
            }
        } else if (Array.isArray(data.suggestions)) {
            html += `
                <ul>
                    ${data.suggestions.map(suggestion => `<li>${suggestion}</li>`).join('')}
                </ul>
            `;
        } else {
            html += `<p>${data.suggestions}</p>`;
        }
    } else {
        html += `<pre>${JSON.stringify(data, null, 2)}</pre>`;
    }
    
    html += '</div>';
    
    container.innerHTML = html;
    container.classList.add('show');
}