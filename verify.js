// Verification script for dist/index.html
const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'dist', 'index.html');
const html = fs.readFileSync(file, 'utf8');

let errors = [];

// 1. Basic tag pairing check (void elements excluded)
const voidTags = new Set(['area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr','rect','line','path','circle','stop']);
const tagRe = /<\/?([a-zA-Z][a-zA-Z0-9-]*)\b[^>]*?(\/?)>/g;
let stack = [];
let m;
while((m = tagRe.exec(html)) !== null){
  const tag = m[1].toLowerCase();
  const isClosing = m[0][1] === '/';
  const selfClose = m[2] === '/' || voidTags.has(tag);
  if(tag === '!doctype' || tag.startsWith('!')) continue;
  if(isClosing){
    if(stack.length === 0 || stack[stack.length-1] !== tag){
      errors.push(`Mismatched closing tag </${tag}> at position ${m.index}, stack top: ${stack[stack.length-1]}`);
    } else {
      stack.pop();
    }
  } else if(!selfClose){
    stack.push(tag);
  }
}
if(stack.length > 0){
  errors.push(`Unclosed tags remaining: ${stack.join(', ')}`);
}

// 2. Count <line> elements (expect 30 = 3 logos x 10 crown lines: nav, hero card, footer)
const lineCount = (html.match(/<line\b/g) || []).length;
if(lineCount !== 30){
  errors.push(`Expected 30 <line> elements, found ${lineCount}`);
}

// 3. Count wordmark groups (expect 3)
const wordmarkCount = (html.match(/class="wordmark"/g) || []).length;
if(wordmarkCount !== 3){
  errors.push(`Expected 3 wordmark groups, found ${wordmarkCount}`);
}

// 4. crown-lines groups should be 3, each containing 10 <line>
const crownGroupCount = (html.match(/class="crown-lines"/g) || []).length;
if(crownGroupCount !== 3){
  errors.push(`Expected 3 crown-lines groups, found ${crownGroupCount}`);
}

// 5. data-kaz / data-ru count parity
const kazCount = (html.match(/data-kaz=/g) || []).length;
const ruCount = (html.match(/data-ru=/g) || []).length;
if(kazCount !== ruCount){
  errors.push(`data-kaz count (${kazCount}) !== data-ru count (${ruCount})`);
}
if(kazCount === 0){
  errors.push('No data-kaz attributes found');
}

// Report
console.log(`Tags: ${stack.length === 0 ? 'OK (balanced)' : 'FAIL'}`);
console.log(`<line> elements: ${lineCount} (expected 30)`);
console.log(`wordmark groups: ${wordmarkCount} (expected 3)`);
console.log(`crown-lines groups: ${crownGroupCount} (expected 3)`);
console.log(`data-kaz: ${kazCount}, data-ru: ${ruCount}`);

if(errors.length){
  console.error('\nFAILED:');
  errors.forEach(e => console.error(' - ' + e));
  process.exit(1);
} else {
  console.log('\nAll checks passed.');
}
