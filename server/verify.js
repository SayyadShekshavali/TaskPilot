import { runTier1Heuristics } from './utils/ai.js';
import { executeCode } from './utils/judge0.js';
import dotenv from 'dotenv';

dotenv.config();

async function runVerification() {
  console.log('--- TaskPilot Server Unit Verification ---');
  
  // 1. Test Heuristics
  const task = {
    type: 'coding',
    evaluationRules: 'Function must contain calculateTotal'
  };
  const workspaceState = {
    files: {
      'index.js': 'function main() { console.log("Hello"); }'
    }
  };
  
  const issues = runTier1Heuristics(task, workspaceState);
  console.log('Heuristics output:', issues);
  
  // 2. Test Judge0 Runner
  const code = 'console.log("Compiler active!");';
  const result = await executeCode(code);
  console.log('Code Execution Output:', result);
  
  console.log('--- Verification complete ---');
}

runVerification();
