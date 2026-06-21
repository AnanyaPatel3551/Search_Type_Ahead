import { Trie } from './services/trie/Trie';

function runTests() {
  console.log('--- START TRIE ALGORITHMIC TESTS ---');
  const trie = new Trie();

  // Test Case 1: Insert values
  console.log('\n[Test 1] Inserting search queries...');
  trie.insert('iphone 15', 90);
  trie.insert('iphone charger', 50);
  trie.insert('iphone', 100);
  trie.insert('ipad pro', 80);
  trie.insert('macbook pro', 120);

  // Test Case 2: Perform prefix search
  console.log('\n[Test 2] Searching for prefix "iph"...');
  let results = trie.search('iph');
  console.log('Results (expected ordered by count desc: iphone, iphone 15, iphone charger):');
  console.log(JSON.stringify(results, null, 2));

  // Assert correct ranking order
  if (results[0].query === 'iphone' && results[1].query === 'iphone 15' && results[2].query === 'iphone charger') {
    console.log('✅ Test 2 PASSED: Correct ranking order matches count descending.');
  } else {
    console.log('❌ Test 2 FAILED: Incorrect ranking order.');
    process.exit(1);
  }

  // Test Case 3: Increment counts
  console.log('\n[Test 3] Incrementing "iphone charger" by 60 (new total: 110)...');
  trie.increment('iphone charger', 60);

  results = trie.search('iph');
  console.log('New Results (expected ordered: iphone charger, iphone, iphone 15):');
  console.log(JSON.stringify(results, null, 2));

  if (results[0].query === 'iphone charger' && results[0].count === 110) {
    console.log('✅ Test 3 PASSED: Count incremented and ranking order adjusted dynamically.');
  } else {
    console.log('❌ Test 3 FAILED: Count increment or ranking order failed.');
    process.exit(1);
  }

  // Test Case 4: Capping results to 10
  console.log('\n[Test 4] Inserting more than 10 matches for prefix "iph"...');
  for (let i = 1; i <= 12; i++) {
    trie.insert(`iphone case ${i}`, i);
  }

  results = trie.search('iph');
  console.log(`Results count (expected: 10): ${results.length}`);
  if (results.length === 10) {
    console.log('✅ Test 4 PASSED: Suggestions cap at exactly 10.');
  } else {
    console.log(`❌ Test 4 FAILED: Suggestions count is ${results.length}.`);
    process.exit(1);
  }

  console.log('\n--- ALL ALGORITHMIC TESTS COMPLETED SUCCESSFULLY ---');
}

runTests();
