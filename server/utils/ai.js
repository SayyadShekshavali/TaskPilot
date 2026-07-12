import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini API
let genAI = null;
if (process.env.GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
} else {
  console.warn('GEMINI_API_KEY is not defined. AI reviews will be mocked.');
}

async function generateWithFallback(prompt, responseMimeType = null) {
  if (!genAI) throw new Error('GoogleGenerativeAI is not initialized.');
  
  const models = [
    'gemini-flash-latest',
    'gemini-flash-lite-latest',
    'gemini-3.1-flash-lite',
    'gemini-3-flash-preview'
  ];
  let lastError = null;
  
  for (const modelName of models) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        ...(responseMimeType ? { generationConfig: { responseMimeType } } : {})
      });
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      console.warn(`[AI Fallback] Model "${modelName}" failed, trying next:`, error.message.substring(0, 150));
      lastError = error;
    }
  }
  throw lastError;
}

function detectLanguage(title, description) {
  const text = `${title} ${description}`.toLowerCase();
  
  if (text.includes('python') || text.includes(' py ') || text.includes('.py')) {
    return { lang: 'python', ext: 'py', defaultFile: 'main.py' };
  }
  if (text.includes('typescript') || text.includes(' ts ') || text.includes('.ts') || text.includes('angular')) {
    return { lang: 'typescript', ext: 'ts', defaultFile: 'index.ts' };
  }
  if (text.includes('java') && !text.includes('javascript') && !text.includes('script')) {
    return { lang: 'java', ext: 'java', defaultFile: 'Main.java' };
  }
  if (text.includes('c++') || text.includes('cpp') || text.includes('.cpp') || text.includes(' c ')) {
    return { lang: 'cpp', ext: 'cpp', defaultFile: 'main.cpp' };
  }
  if (text.includes('go ') || text.includes('golang') || text.includes(' go/')) {
    return { lang: 'go', ext: 'go', defaultFile: 'main.go' };
  }
  if (text.includes('html') || text.includes('css')) {
    return { lang: 'html/css', ext: 'html', defaultFile: 'index.html' };
  }
  
  // Default is JS
  return { lang: 'javascript', ext: 'js', defaultFile: 'index.js' };
}

/**
 * Generate starter folder structures based on task description
 */
export const generateScaffold = async (title, type, description) => {
  if (type === 'writing') {
    return {
      content: `<h1>${title}</h1>\n<p>Write your draft here...</p>`
    };
  }

  const { lang, ext, defaultFile } = detectLanguage(title, description);
  const text = `${title} ${description}`.toLowerCase();
  const isFrontend = text.includes('react') || text.includes('frontend') || text.includes('component') || text.includes('html') || text.includes('css') || text.includes('cart') || text.includes('fullstack') || text.includes('web');
  let defaultCoding;

  // Extractor regex to find any file names mentioned in title or description
  const filenameRegex = /[a-zA-Z0-9_\-\.\/]+\.(py|js|jsx|ts|tsx|java|cpp|h|html|css|go|txt|json)/gi;
  const extractedFiles = [...new Set([...text.matchAll(filenameRegex)].map(m => m[0].trim()))];

  if (extractedFiles.length > 0) {
    const filesMap = {};
    let firstFile = null;
    extractedFiles.forEach(file => {
      if (!firstFile) firstFile = file;
      const fileLower = file.toLowerCase();
      let commentSymbol = '//';
      if (fileLower.endsWith('.py') || fileLower.endsWith('.txt')) {
        commentSymbol = '#';
      }
      
      filesMap[file] = `${commentSymbol} File: ${file}\n${commentSymbol} TODO: Implement boilerplate for ${title} here\n`;
    });
    defaultCoding = {
      files: filesMap,
      activeFile: firstFile
    };
  } else if (isFrontend && lang === 'javascript') {
    defaultCoding = {
      files: {
        'index.html': `<!DOCTYPE html>\n<html>\n<head>\n  <title>${title}</title>\n  <link rel="stylesheet" href="styles.css">\n</head>\n<body>\n  <div id="root"></div>\n  <script src="index.js"></script>\n</body>\n</html>\n`,
        'index.js': `// Entry Point\nimport React from 'react';\nimport ReactDOM from 'react-dom';\nimport App from './App';\n\nReactDOM.render(<App />, document.getElementById('root'));\n`,
        'App.jsx': `// Main App Component\nimport React, { useState } from 'react';\nimport CartList from './components/CartList';\n\nfunction App() {\n  return (\n    <div className="app">\n      <h1>${title}</h1>\n      {/* TODO: Implement cart actions here */}\n      <CartList />\n    </div>\n  );\n}\n\nexport default App;\n`,
        'components/CartList.jsx': `// CartList component\nimport React from 'react';\n\nfunction CartList() {\n  // TODO: Add remove cart item action\n  return (\n    <div className="cart-list">\n      <h3>Shopping Cart</h3>\n      <p>No items in cart</p>\n    </div>\n  );\n}\n\nexport default CartList;\n`,
        'styles.css': `body {\n  background-color: #09090b;\n  color: #f4f4f5;\n  font-family: sans-serif;\n  margin: 20px;\n}\n.app {\n  max-width: 600px;\n  margin: 0 auto;\n}\n`
      },
      activeFile: 'App.jsx'
    };
  } else {
    // If multi-file is implied, generate standard files (3 files)
    const isMultiFileImplied = text.includes('fullstack') || text.includes('react app') || text.includes('express server') || text.includes('api endpoints') || text.includes('database integration') || text.includes('multiple pages') || text.includes('website');
    
    if (isMultiFileImplied) {
      if (lang === 'python') {
        defaultCoding = {
          files: {
            'main.py': `# Main entry point for ${title}\n# TODO: Implement main execution logic\n\nif __name__ == "__main__":\n    pass\n`,
            'utils.py': `# Helper functions for ${title}\n# TODO: Implement utility helpers\n`,
            'test_main.py': `# Unit tests for ${title}\n# TODO: Implement test cases\n`
          },
          activeFile: 'main.py'
        };
      } else if (lang === 'java') {
        defaultCoding = {
          files: {
            'Main.java': `// Main entry class\npublic class Main {\n    public static void main(String[] args) {\n        // TODO: Implement main\n    }\n}\n`,
            'Helper.java': `// Helper classes\npublic class Helper {\n    // TODO: Implement helper functions\n}\n`,
            'MainTest.java': `// Unit tests\npublic class MainTest {\n    // TODO: Implement test cases\n}\n`
          },
          activeFile: 'Main.java'
        };
      } else if (lang === 'cpp') {
        defaultCoding = {
          files: {
            'main.cpp': `// Main entry point\n#include "helpers.h"\n\nint main() {\n    // TODO: Implement logic\n    return 0;\n}\n`,
            'helpers.h': `// Header declarations\n#ifndef HELPERS_H\n#define HELPERS_H\n\n// TODO: Add helper signatures\n\n#endif\n`,
            'helpers.cpp': `// Helper implementations\n#include "helpers.h"\n\n// TODO: Implement helper logic\n`
          },
          activeFile: 'main.cpp'
        };
      } else if (lang === 'go') {
        defaultCoding = {
          files: {
            'main.go': `package main\n\nimport "fmt"\n\nfunc main() {\n    // TODO: Implement main\n}\n`,
            'utils.go': `package main\n\n// TODO: Implement utilities\n`,
            'go.mod': `module taskpilot\n\ngo 1.20\n`
          },
          activeFile: 'main.go'
        };
      } else {
        defaultCoding = {
          files: {
            'index.js': `// Entry Point for ${title}\n// TODO: Implement primary execution\n`,
            'utils.js': `// Utility helpers\n// TODO: Implement helper functions\n`,
            'index.test.js': `// Tests\n// TODO: Implement testing checks\n`
          },
          activeFile: 'index.js'
        };
      }
    } else {
      let defaultCode = '';
      if (lang === 'python') {
        defaultCode = `# ${title}\n# Write your Python solution here\n\ndef main():\n    print("Hello, TaskPilot!")\n\nif __name__ == "__main__":\n    main()\n`;
      } else if (lang === 'java') {
        defaultCode = `// ${title}\n// Write your Java solution here\n\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, TaskPilot!");\n    }\n}\n`;
      } else if (lang === 'cpp') {
        defaultCode = `// ${title}\n// Write your C++ solution here\n\n#include <iostream>\n\nint main() {\n    std::cout << "Hello, TaskPilot!" << std::endl;\n    return 0;\n}\n`;
      } else if (lang === 'go') {
        defaultCode = `package main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Hello, TaskPilot!")\n}\n`;
      } else {
        defaultCode = `// ${title}\n// Write your solution here\n\nfunction main() {\n  console.log("Hello, TaskPilot!");\n}\n\nmodule.exports = main;\n`;
      }

      defaultCoding = {
        files: {
          [defaultFile]: defaultCode
        },
        activeFile: defaultFile
      };
    }
  }

  if (!genAI) return defaultCoding;

  try {
    const prompt = `
      You are an AI scaffolding engine. The user is creating a coding task titled "${title}".
      Task Description: "${description}".
      
      The detected target programming language is: "${lang}" (primary file extension: ".${ext}").
      
      Generate a folder/file tree structure appropriate for the task and the target programming language.
      Ensure there are starter/boilerplate files using the correct extensions (.${ext}) and correct syntax for "${lang}".
      Do NOT write Javascript files if the target language is Python, Java, C++, Go, etc. Use correct syntax conventions (commenting style, naming rules, package imports) for "${lang}".
      
      CRITICAL BOILERPLATE RULES:
      1. Do NOT include the final working solution, algorithm implementations, or business logic. All generated files must be empty code skeletons, function shells, or basic interface outlines.
      2. If a function or method is needed, provide only its signature/header and an empty body, returning a stub value (e.g. return null; or throw new Error('Not implemented'); or pass in Python). Add a clear "# TODO" or "// TODO: Implement this" comment.
      3. For example, if the task is to "remove a cart item", do NOT write the filter logic or state modifications. Simply output:
         const handleRemoveItem = (itemId) => {
           // TODO: Implement item removal logic
         };
      4. The candidate is being assessed on their coding ability. Providing working logic defeats the test.
      
      CRITICAL FILE COUNT & CONTEXT ANALYSIS RULES:
      1. Analyze the context of the task description carefully. Generate ONLY the files that are strictly necessary to build, compile, and execute the requested features. Do NOT create speculative extra files (like separate tests, config files, package JSONs, or utility modules) for simple stubs.
      2. If the task description is simple (e.g. implementing a single algorithm, a math calculation, or a basic helper function), you MUST generate exactly ONE file (e.g., "main.py" or "index.js").
      3. For complex tasks (such as a full modular React web view, a REST API with routing, or database integration), generate only the realistic components and stylesheets required to structure the app layout cleanly (usually 2 to 4 files max). Do not build out unnecessary bloat files.
      
      Return a JSON object matching this structure EXACTLY:
      {
        "files": {
          "primary_filename.${ext}": "file content here",
          "helpers/utils.${ext}": "file content here"
        },
        "activeFile": "primary_filename.${ext}"
      }
    `;

    const text = await generateWithFallback(prompt, 'application/json');
    return JSON.parse(text);
  } catch (error) {
    console.error('Error generating scaffold from Gemini:', error);
    return defaultCoding;
  }
};

/**
 * Tier 1 Heuristic Review - Instant check (<100ms)
 */
export const runTier1Heuristics = (task, workspaceState) => {
  const issues = [];
  const type = task.type;

  if (type === 'coding') {
    const files = workspaceState.files || {};
    const fileNames = Object.keys(files);

    if (fileNames.length === 0) {
      issues.push({
        message: 'No source files detected in workspace',
        line: 1,
        file: '',
        severity: 'error',
        type: 'syntax'
      });
      return issues;
    }

    // Check for syntax issues (basic brackets matching)
    for (const [name, content] of Object.entries(files)) {
      const openCurly = (content.match(/\{/g) || []).length;
      const closeCurly = (content.match(/\}/g) || []).length;
      if (openCurly !== closeCurly) {
        issues.push({
          message: `Mismatched curly braces { } in code (open: ${openCurly}, close: ${closeCurly})`,
          line: content.split('\n').length,
          file: name,
          severity: 'warning',
          type: 'syntax'
        });
      }

      // Check if required keywords from evaluation rules are missing
      if (task.evaluationRules) {
        const rules = task.evaluationRules.toLowerCase();
        // If rules mention a specific function, e.g. "calculateTotal"
        const funcMatches = rules.match(/function\s+([a-zA-Z0-9_]+)/g) || [];
        for (const fm of funcMatches) {
          const fnName = fm.split(/\s+/)[1];
          if (content.indexOf(fnName) === -1) {
            issues.push({
              message: `Missing required function definition: ${fnName}`,
              line: 1,
              file: name,
              severity: 'error',
              type: 'alignment'
            });
          }
        }
      }
    }
  } else {
    // Writing heuristics
    const content = workspaceState.content || '';
    // Strip HTML tags for word count
    const text = content.replace(/<[^>]*>/g, ' ').trim();
    const words = text ? text.split(/\s+/).length : 0;

    if (words < 10) {
      issues.push({
        message: 'Content is too brief. Please begin writing your response.',
        line: 1,
        file: 'document',
        severity: 'info',
        type: 'alignment'
      });
    }

    // Check if task rules outline sections
    if (task.evaluationRules) {
      const rules = task.evaluationRules.toLowerCase();
      // E.g., if rules contain "introduction", check if text contains "introduction"
      const sectionKeywords = ['introduction', 'conclusion', 'abstract', 'methodology', 'summary'];
      for (const kw of sectionKeywords) {
        if (rules.includes(kw) && !text.toLowerCase().includes(kw)) {
          issues.push({
            message: `Document may be missing a required section: "${kw.charAt(0).toUpperCase() + kw.slice(1)}"`,
            line: 1,
            file: 'document',
            severity: 'warning',
            type: 'alignment'
          });
        }
      }
    }

    // Check for Lorem Ipsum placeholder
    if (text.toLowerCase().includes('lorem ipsum')) {
      issues.push({
        message: 'Placeholder text "Lorem Ipsum" detected. Please replace with your original content.',
        line: 1,
        file: 'document',
        severity: 'warning',
        type: 'style'
      });
    }
  }

  return issues;
};

/**
 * Tier 2 Semantic Review - Deep Gemini Check
 */
export const runTier2SemanticReview = async (task, workspaceState) => {
  // If no API Key, return simulated/mock response
  if (!genAI) {
    return simulateTier2Review(task, workspaceState);
  }

  try {
    const isCoding = task.type === 'coding';
    const workspaceRepresentation = isCoding
      ? JSON.stringify(workspaceState.files, null, 2)
      : workspaceState.content;

    const prompt = `
      You are an AI code and writing reviewer. Review the candidate's active work-in-progress against the following task specification.

      TASK SPECIFICATION:
      Title: "${task.title}"
      Type: "${task.type}"
      Description: "${task.description}"
      Evaluation Rules: "${task.evaluationRules || 'Assess logic and correctness'}"
      Custom Prompt Context: "${task.customPrompt || 'None'}"

      CANDIDATE'S CURRENT WORKSPACE STATE:
      ${isCoding ? 'File structure & contents (JSON):' : 'Rich text content:'}
      ${workspaceRepresentation}

      CRITICAL FEEDBACK RULES:
      1. Check if the work aligns with the task's required rules, parameters, structure, and code expectations.
      2. Flag drift or misalignment. If the candidate changed a required function name, forgot an import, or left out a required paragraph section, flag it.
      3. Keep issue messages short and actionable (1 line: what is wrong + file/location). Do not write paragraphs.
      4. Score progress from 0 (empty/unstarted) to 100 (fully correct, matching all specs, passing logic).
      5. Provide a 2-3 sentence overview summary of their current progress.
      6. IMPORTANT: For any logical errors, syntax bugs, rule mismatches, or task misalignments, assign severity as "error". For style guidelines or minor drift, assign severity as "warning" or "info". Any "error" severity will be styled in red to alert the candidate.
      7. SUGGESTION & TARGET SELECTION:
         - If the candidate has written code but it has errors, you MUST:
           a. Set "target" to the EXACT, precise substring of incorrect code currently in their editor file that needs to be replaced.
           b. Set "suggestion" to the corrected code block that should replace it.
         - If the candidate is missing required code completely (meaning no code is written yet for the required functionality), you MUST:
           a. Set "target" to an empty string "".
           b. Set "suggestion" to the boilerplate/stub/implementation code to be added.

      Return a JSON object matching this structure EXACTLY:
      {
        "score": 85,
        "summary": "The candidate has implemented the basic structure and imports. However, there are some missing tests and functions.",
        "issues": [
          {
            "message": "Wrong return logic in reverse_string",
            "line": 15,
            "file": "index.js",
            "severity": "error", // error, warning, info
            "type": "alignment", // alignment, style, syntax
            "target": "return s.reverse();",
            "suggestion": "return s.split('').reverse().join('');"
          }
        ]
      }
    `;

    const text = await generateWithFallback(prompt, 'application/json');
    return JSON.parse(text);
  } catch (error) {
    console.error('Error running Tier 2 Semantic Review:', error);
    return simulateTier2Review(task, workspaceState);
  }
};

/**
 * Mock semantic review when API key is missing or failed
 */
function simulateTier2Review(task, workspaceState) {
  const isCoding = task.type === 'coding';
  const issues = [];
  let score = 50;
  let summary = '';

  if (isCoding) {
    const files = workspaceState.files || {};
    const mainCode = files['index.js'] || '';
    
    if (!mainCode || mainCode.includes('// Write your solution here')) {
      score = 10;
      summary = 'Task has been initialized, but no solution has been drafted yet.';
      issues.push({
        message: 'Starter boilerplate code is unmodified.',
        line: 3,
        file: 'index.js',
        severity: 'info',
        type: 'alignment'
      });
    } else {
      score = 75;
      summary = 'Basic logic structure looks good. However, you should add edge-case checks and verify all requirements are met.';
      if (!mainCode.includes('try') && !mainCode.includes('catch')) {
        issues.push({
          message: 'Missing error handling in main function (try/catch blocks)',
          line: 5,
          file: 'index.js',
          severity: 'warning',
          type: 'style'
        });
      }
    }
  } else {
    const content = workspaceState.content || '';
    const text = content.replace(/<[^>]*>/g, ' ').trim();
    if (text.length < 50) {
      score = 20;
      summary = 'Writing is in the initial drafting phase. Expand on the introductory elements.';
    } else {
      score = 80;
      summary = 'Good start on the document structure. Ensure you refine your tone to match a professional audience and double-check spelling.';
    }
  }

  return {
    score,
    summary,
    issues
  };
}
