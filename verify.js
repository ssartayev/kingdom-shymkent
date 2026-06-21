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

// 2. Logo assets present (mask-based logo marks use these PNGs)
const crownImgExists = fs.existsSync(path.join(__dirname, 'dist', 'logo-crown.png'));
const fullImgExists = fs.existsSync(path.join(__dirname, 'dist', 'logo-full.png'));
if(!crownImgExists) errors.push('Missing dist/logo-crown.png');
if(!fullImgExists) errors.push('Missing dist/logo-full.png');

// 3. Logo marks referenced in HTML (nav + footer crown, hero full lockup)
const crownMarkCount = (html.match(/logo-mark--crown/g) || []).length;
const fullMarkCount = (html.match(/logo-mark--full/g) || []).length;
if(crownMarkCount < 2){
  errors.push(`Expected >=2 crown logo marks (nav, footer), found ${crownMarkCount}`);
}
if(fullMarkCount < 1){
  errors.push(`Expected >=1 full logo mark (hero), found ${fullMarkCount}`);
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
console.log(`logo-crown.png: ${crownImgExists ? 'OK' : 'MISSING'}, logo-full.png: ${fullImgExists ? 'OK' : 'MISSING'}`);
console.log(`crown marks: ${crownMarkCount} (expected >=2), full marks: ${fullMarkCount} (expected >=1)`);
console.log(`data-kaz: ${kazCount}, data-ru: ${ruCount}`);

if(errors.length){
  console.error('\nFAILED:');
  errors.forEach(e => console.error(' - ' + e));
  process.exit(1);
} else {
  console.log('\nAll checks passed.');
}
