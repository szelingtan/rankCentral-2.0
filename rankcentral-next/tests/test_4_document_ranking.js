#!/usr/bin/env node

console.log('🔍 Testing 4-Document Prompt Evaluation Ranking Consistency');
console.log('=' .repeat(60));

const fs = require('fs');
const path = require('path');

// Mock the mergesort implementation from the actual codebase
function mergesort(arr, compareFn) {
  if (arr.length <= 1) return arr;
  
  const mid = Math.floor(arr.length / 2);
  const left = mergesort(arr.slice(0, mid), compareFn);
  const right = mergesort(arr.slice(mid), compareFn);
  
  return merge(left, right, compareFn);
}

function merge(left, right, compareFn) {
  const result = [];
  let i = 0, j = 0;
  
  while (i < left.length && j < right.length) {
    if (compareFn(left[i], right[j]) <= 0) {
      result.push(left[i]);
      i++;
    } else {
      result.push(right[j]);
      j++;
    }
  }
  
  return result.concat(left.slice(i)).concat(right.slice(j));
}

// Test 4-document scenario with various score patterns
const testCases = [
  {
    name: "Sequential Scores (1,2,3,4)",
    documents: [
      { id: 'doc1', name: 'Document 1', score: 1 },
      { id: 'doc2', name: 'Document 2', score: 2 },
      { id: 'doc3', name: 'Document 3', score: 3 },
      { id: 'doc4', name: 'Document 4', score: 4 }
    ]
  },
  {
    name: "Reverse Order (4,3,2,1)",
    documents: [
      { id: 'doc1', name: 'Document 1', score: 4 },
      { id: 'doc2', name: 'Document 2', score: 3 },
      { id: 'doc3', name: 'Document 3', score: 2 },
      { id: 'doc4', name: 'Document 4', score: 1 }
    ]
  },
  {
    name: "Mixed Scores (3,1,4,2)",
    documents: [
      { id: 'doc1', name: 'Document 1', score: 3 },
      { id: 'doc2', name: 'Document 2', score: 1 },
      { id: 'doc3', name: 'Document 3', score: 4 },
      { id: 'doc4', name: 'Document 4', score: 2 }
    ]
  },
  {
    name: "Tied Scores (2,2,3,3)",
    documents: [
      { id: 'doc1', name: 'Document 1', score: 2 },
      { id: 'doc2', name: 'Document 2', score: 2 },
      { id: 'doc3', name: 'Document 3', score: 3 },
      { id: 'doc4', name: 'Document 4', score: 3 }
    ]
  }
];

function simulateUIRanking(documents) {
  // Simulate how the UI sorts documents (highest score first)
  return documents
    .slice()
    .sort((a, b) => b.score - a.score)
    .map((doc, index) => ({
      rank: index + 1,
      document: doc.name,
      score: doc.score
    }));
}

function simulateCSVRanking(documents) {
  // Simulate how CSV export ranks documents using mergesort
  const compareFn = (a, b) => b.score - a.score; // Higher score wins
  const sorted = mergesort(documents.slice(), compareFn);
  
  return sorted.map((doc, index) => ({
    rank: index + 1,
    document: doc.name,
    score: doc.score
  }));
}

function rankingsMatch(uiRanking, csvRanking) {
  if (uiRanking.length !== csvRanking.length) return false;
  
  for (let i = 0; i < uiRanking.length; i++) {
    if (uiRanking[i].rank !== csvRanking[i].rank || 
        uiRanking[i].document !== csvRanking[i].document) {
      return false;
    }
  }
  return true;
}

// Run tests
let allTestsPassed = true;

testCases.forEach((testCase, index) => {
  console.log(`\n📋 Test Case ${index + 1}: ${testCase.name}`);
  console.log('-'.repeat(40));
  
  const uiRanking = simulateUIRanking(testCase.documents);
  const csvRanking = simulateCSVRanking(testCase.documents);
  
  console.log('UI Ranking:');
  uiRanking.forEach(item => {
    console.log(`  ${item.rank}. ${item.document} (Score: ${item.score})`);
  });
  
  console.log('CSV Ranking:');
  csvRanking.forEach(item => {
    console.log(`  ${item.rank}. ${item.document} (Score: ${item.score})`);
  });
  
  const matches = rankingsMatch(uiRanking, csvRanking);
  console.log(`\n${matches ? '✅' : '❌'} Rankings match: ${matches}`);
  
  if (!matches) {
    allTestsPassed = false;
    console.log('🔍 DISCREPANCY DETECTED!');
  }
});

console.log('\n' + '='.repeat(60));
console.log(`🎯 Overall Result: ${allTestsPassed ? 'ALL TESTS PASSED' : 'DISCREPANCIES FOUND'}`);

if (!allTestsPassed) {
  console.log('\n🚨 INVESTIGATION NEEDED:');
  console.log('   • Check if UI and CSV use different sorting algorithms');
  console.log('   • Verify criterion name consistency in prompt evaluations');
  console.log('   • Look for edge cases in mergesort implementation');
}
