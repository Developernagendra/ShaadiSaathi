const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'VendorManageCabsPage.jsx');
const modalPath = path.join(__dirname, 'temp_modal.jsx');

const code = fs.readFileSync(filePath, 'utf8');
const newModal = fs.readFileSync(modalPath, 'utf8');

const startTag = '{/* 8-Step Multi-Step Modal */}';
const endTag = '</AnimatePresence>';

const startIndex = code.indexOf(startTag);
if (startIndex === -1) {
  console.log('Could not find start tag');
  process.exit(1);
}

let endIndex = code.indexOf(endTag, startIndex);
if (endIndex === -1) {
  console.log('Could not find end tag');
  process.exit(1);
}

endIndex += endTag.length;

const newCode = code.slice(0, startIndex) + newModal + '\n    </div>\n  )\n}\n'

fs.writeFileSync(filePath, newCode);
console.log('Successfully replaced modal');
