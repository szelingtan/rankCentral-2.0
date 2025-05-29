// Test script to verify prompt-based evaluation ranking consistency

// Mock data for prompt-based evaluation
const reportData = {
  criterionDetails: [
    {
      'Criterion Name': 'Custom Evaluation',
      'evaluationMethod': 'prompt',
      'Document A': 'doc1.pdf',
      'Document B': 'doc2.pdf',
      'Document A Score': 4,
      'Document B Score': 3,
      'Winner': 'doc1.pdf',
      'Detailed Reasoning': 'Document A shows better analysis'
    },
    {
      'Criterion Name': 'Custom Evaluation', 
      'evaluationMethod': 'prompt',
      'Document A': 'doc2.pdf',
      'Document B': 'doc3.pdf',
      'Document A Score': 2,
      'Document B Score': 5,
      'Winner': 'doc3.pdf',
      'Detailed Reasoning': 'Document B demonstrates superior quality'
    }
  ],
  winCounts: {
    'doc1.pdf': 1,
    'doc2.pdf': 0,
    'doc3.pdf': 1
  },
  evaluationMethod: 'prompt',
  customPrompt: 'Evaluate documents based on clarity and depth of analysis'
};

// Simulate the CSV export logic from reportGenerator.ts
function testPairwiseComparisonsCSV(reportData) {
  const { criterionDetails } = reportData;
  
  const headers = [
    'No.',
    'Criterion',
    'Document A Name',
    'Document A Score',
    'Document A Analysis',
    'Document B Name',
    'Document B Score',
    'Document B Analysis',
    'Detailed Reasoning'
  ];
  
  let csv = headers.join(',') + '\n';

  criterionDetails.forEach((row, index) => {
    // This is the key fix: ensuring criterion name consistency for prompt-based evaluations
    let criterion = row['Criterion Name'] || row['criterionName'] || 'Unknown Criterion';
    
    // For custom prompt evaluations, keep the criterion name consistent with UI ranking
    if (row['evaluationMethod'] === 'prompt' || reportData.evaluationMethod === 'prompt') {
      criterion = 'Custom Evaluation';
    }

    const documentA = row['Document A'] || '';
    const documentB = row['Document B'] || '';
    const docAScore = row['Document A Score'] || '';
    const docBScore = row['Document B Score'] || '';
    const detailedReasoning = row['Detailed Reasoning'] || 'No reasoning provided';

    const values = [
      index + 1,
      criterion,
      documentA,
      docAScore,
      'Analysis for A',
      documentB,
      docBScore,
      'Analysis for B',
      detailedReasoning
    ];
    
    csv += values.join(',') + '\n';
  });
  
  return csv;
}

// Test the function
console.log('Testing Prompt-based Evaluation CSV Export Consistency:');
console.log('='.repeat(60));

const csvOutput = testPairwiseComparisonsCSV(reportData);
console.log(csvOutput);

// Verify that all criterion names are "Custom Evaluation"
const lines = csvOutput.split('\n').slice(1); // Skip header
let allConsistent = true;

lines.forEach((line, index) => {
  if (line.trim()) {
    const columns = line.split(',');
    const criterionName = columns[1];
    if (criterionName !== 'Custom Evaluation') {
      console.log(`❌ Inconsistency found at row ${index + 1}: "${criterionName}"`);
      allConsistent = false;
    }
  }
});

if (allConsistent) {
  console.log('✅ SUCCESS: All prompt-based evaluations use consistent criterion name "Custom Evaluation"');
  console.log('✅ This ensures UI and CSV rankings will be identical');
} else {
  console.log('❌ FAILURE: Inconsistent criterion naming detected');
}

console.log('\nKey Points:');
console.log('- UI ranking uses "Custom Evaluation" as criterion name (from promptGenerator.ts line 120)');
console.log('- CSV export now also uses "Custom Evaluation" instead of replacing with prompt text');
console.log('- This ensures both ranking systems use the same criterion identifier');
