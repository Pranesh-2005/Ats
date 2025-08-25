function parseMarkdown(md) {
  if (!md) return "";
  // Ensure blank lines before headings and lists for marked.js compatibility
  md = md.replace(/([^\n])(\n## )/g, '$1\n\n$2');
  md = md.replace(/([^\n])(\n- )/g, '$1\n\n$2');
  return marked.parse(md.trim());
}

async function scoreResume() {
  const resumeFile = document.getElementById("resume").files[0];
  const jobDesc = document.getElementById("jd").value;
  const scoreBox = document.getElementById("score");
  const scoreSection = document.getElementById("score-section");
  const improveSection = document.getElementById("improve-section");
  const resultsCard = document.querySelector(".results-card");

  if (!resumeFile || !jobDesc) {
    alert("Please upload resume and enter job description");
    return;
  }

  const formData = new FormData();
  formData.append("resume", resumeFile);
  formData.append("jd", jobDesc);

  // Show results card and score section only
  resultsCard.classList.add("show");
  scoreSection.style.display = "block";
  improveSection.style.display = "none";
  scoreBox.innerHTML = '<div class="loading"><div class="loading-spinner"></div>Analyzing...</div>';

  try {
    const response = await fetch('https://gradioatsbackend.onrender.com/score', {
      method: "POST",
      body: formData
    });

    const data = await response.json();
    if (data.error) {
      scoreBox.innerHTML = "❌ Error: " + data.error;
      return;
    }

    const htmlContent = parseMarkdown(data.result);
    scoreBox.innerHTML = htmlContent;
    scoreSection.scrollIntoView({ behavior: "smooth", block: "center" });

    const scoreMatch = data.result.match(/(\d+)%/);
    if (scoreMatch) {
      const scoreValue = scoreMatch[1];
      scoreBox.innerHTML = `<div class="score-display">${scoreValue}%</div>` + htmlContent;
    }

  } catch (err) {
    scoreBox.innerHTML = "❌ Request failed: " + err.message;
  }
}

async function improveResume() {
  const resumeFile = document.getElementById("resume").files[0];
  const jobDesc = document.getElementById("jd").value;
  const improvementsBox = document.getElementById("improvements");
  const scoreSection = document.getElementById("score-section");
  const improveSection = document.getElementById("improve-section");
  const resultsCard = document.querySelector(".results-card");

  if (!resumeFile || !jobDesc) {
    alert("Please upload resume and enter job description");
    return;
  }

  const formData = new FormData();
  formData.append("resume", resumeFile);
  formData.append("jd", jobDesc);

  // Show results card and improve section only
  resultsCard.classList.add("show");
  scoreSection.style.display = "none";
  improveSection.style.display = "block";
  improvementsBox.innerHTML = '<div class="loading"><div class="loading-spinner"></div>Generating suggestions...</div>';

  try {
    const response = await fetch('https://gradioatsbackend.onrender.com/improve', {
      method: "POST",
      body: formData
    });

    const data = await response.json();
    if (data.error) {
      improvementsBox.innerHTML = "❌ Error: " + data.error;
      return;
    }

    if (typeof data.result === "string") {
      improvementsBox.innerHTML = parseMarkdown(data.result);
      improveSection.scrollIntoView({ behavior: "smooth", block: "center" });
    } else if (Array.isArray(data.result)) {
      improvementsBox.innerHTML = "<h3>💡 Suggestions:</h3><ul>" +
        data.result.map(s => `<li>${s}</li>`).join("") +
        "</ul>";
    } else {
      improvementsBox.innerHTML = `<p>${data.result}</p>`;
    }

  } catch (err) {
    improvementsBox.innerHTML = "❌ Request failed: " + err.message;
  }
}

document.getElementById('resume').addEventListener('change', function(e) {
  const file = e.target.files[0];
  if (file) {
    const fileInfo = document.createElement('div');
    fileInfo.style.cssText = 'margin-top: 0.5rem; color: var(--text-secondary); font-size: 0.875rem;';
    fileInfo.textContent = `Selected: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`;

    const existing = e.target.parentNode.querySelector('[data-file-info]');
    if (existing) existing.remove();

    fileInfo.setAttribute('data-file-info', 'true');
    e.target.parentNode.appendChild(fileInfo);
  }
});