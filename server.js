const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const app = express();
const PORT = 3000;
const fileUpload = require('express-fileupload');
const Jimp = require('jimp').default;
app.use(fileUpload());

// In-memory data structure
let projectData = {}; // { projectName: { priority: 'High', workers: [ {name, role, isExtra}, ... ] } }

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// =================== AI Chat Endpoint ===================
app.post('/api/ai-chat', async (req, res) => {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const { userQuery } = req.body;

    let prompt = `Here is the current team/project data:\n\n`;

    for (const [projectName, projectInfo] of Object.entries(projectData)) {
      const extras = projectInfo.workers.filter(w => w.isExtra);
      prompt += `Project: ${projectName}\n`;
      prompt += `- Priority: ${projectInfo.priority}\n`;
      prompt += `- Total Workers: ${projectInfo.workers.length}\n`;
      prompt += `- Extras: ${extras.length} (${extras.map(w => w.name).join(', ') || 'none'})\n\n`;
    }

    prompt += `\nNow here is a user query:\n"${userQuery}"\n\n`;
    prompt += `Based on the project data and extra workers, suggest a reallocation plan.`;
    prompt += ` Respond in clean HTML format, avoid Markdown (**).`;

    const result = await model.generateContent(prompt);
    const text = await result.response.text();

    res.json({ reply: text });
  } catch (err) {
    console.error(err);
    res.status(500).json({ reply: 'AI failed to generate a response.' });
  }
});
app.post('/api/detect-anomalies', async (req, res) => {
  try {
    const img1 = req.files?.img1;
    const img2 = req.files?.img2;

    if (!img1 || !img2) {
      return res.status(400).json({ result: "Both images are required." });
    }

    const [image1, image2] = await Promise.all([
      Jimp.read(img1.data),
      Jimp.read(img2.data)
    ]);

    if (
      image1.bitmap.width !== image2.bitmap.width ||
      image1.bitmap.height !== image2.bitmap.height
    ) {
      return res.status(400).json({ result: "Images must be the same size." });
    }

    let diffCount = 0;

    image1.scan(0, 0, image1.bitmap.width, image1.bitmap.height, function (x, y, idx) {
      const pixel1 = {
        r: this.bitmap.data[idx + 0],
        g: this.bitmap.data[idx + 1],
        b: this.bitmap.data[idx + 2]
      };

      const pixel2 = {
        r: image2.bitmap.data[idx + 0],
        g: image2.bitmap.data[idx + 1],
        b: image2.bitmap.data[idx + 2]
      };

      const distance = Math.abs(pixel1.r - pixel2.r) +
                       Math.abs(pixel1.g - pixel2.g) +
                       Math.abs(pixel1.b - pixel2.b);

      if (distance > 30) {
        diffCount++;
      }
    });

    const totalPixels = image1.bitmap.width * image1.bitmap.height;
    const diffPercent = ((diffCount / totalPixels) * 100).toFixed(2);

    let message = `✅ Images compared successfully.<br><strong>Difference:</strong> ${diffPercent}% of pixels changed.`;

    if (diffPercent > 10) {
      message += `<br><strong>🔍 Significant changes detected.</strong>`;
    } else {
      message += `<br><strong>✅ Minor or no visible changes.</strong>`;
    }

    return res.json({ result: message });
  } catch (err) {
    console.error(err);
    res.status(500).json({ result: '❌ Image comparison failed.' });
  }
});

// =================== Project Creation ===================
app.post('/api/projects', (req, res) => {
  const { projectName, priority } = req.body;
  if (projectName && !projectData[projectName]) {
    projectData[projectName] = { priority, workers: [] };
    return res.status(201).json({ message: 'Project created' });
  }
  res.status(400).json({ error: 'Invalid or duplicate project name' });
});

// =================== Get All Projects ===================
app.get('/api/projects', (req, res) => {
  const allProjects = Object.entries(projectData).map(([name, data]) => ({
    name,
    priority: data.priority,
    workerCount: data.workers.length
  }));
  res.json(allProjects);
});

// =================== Get Workers for a Project ===================
app.get('/api/projects/:projectName/workers', (req, res) => {
  const { projectName } = req.params;
  console.log("Looking for project:", projectName);
  console.log("All projects:", Object.keys(projectData));

  if (!projectData[projectName]) {
    return res.status(404).json({ error: 'Project not found' });
  }

  res.json(projectData[projectName].workers);
});


app.post('/api/forecast-waste', async (req, res) => {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const {
      buildingSize,
      wasteFactor,
      method,
      phase,
      completionPercent,
      climate
    } = req.body;

    const prompt = `
You're an environmental construction advisor. Given the following inputs:

- Building Size: ${buildingSize} sq. ft.
- Material Waste Factor: ${wasteFactor}%
- Construction Method: ${method}
- Project Phase: ${phase}
- Project Completion: ${completionPercent}%
- Climate Conditions: ${climate}

Please provide:
1. A forecast of likely material waste and which materials are most vulnerable.
2. Recommendations to reduce that waste.
3. Environmental benefits of implementing those recommendations.

Respond in clean HTML format.
`;

    const result = await model.generateContent(prompt);
    const text = await result.response.text();

    res.json({
      forecast: text
        .replace(/^```html\s*/i, '')
        .replace(/```$/i, '')
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ forecast: 'AI failed to generate a forecast.' });
  }
});
// =================== Add Worker to Project ===================
app.post('/api/projects/:projectName/workers', (req, res) => {
  const { projectName } = req.params;
  const { name, role, isExtra } = req.body;

  if (!projectData[projectName]) {
    return res.status(404).json({ error: 'Project not found' });
  }

  if (name && role) {
    projectData[projectName].workers.push({ name, role, isExtra });
    return res.status(201).json({ message: 'Worker added' });
  }

  res.status(400).json({ error: 'Invalid data' });
});

// =================== Start Server ===================
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
