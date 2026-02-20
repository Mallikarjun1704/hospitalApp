const fs = require('fs');
const f = 'c:/Users/lenovo/Desktop/hospitalApp/hospitalApp/hospitalApp/reactApp/src/details/AddPatient.jsx';
let c = fs.readFileSync(f, 'utf8');
c = c.replace(/className="block text-sm font-semibold text-gray-700 mb-2"/g, 'className="block text-sm font-semibold text-gray-700 mb-3 pb-1 leading-relaxed"');
c = c.replace(/className="block text-sm font-semibold text-gray-700 mb-1"/g, 'className="block text-sm font-semibold text-gray-700 mb-2 pb-1 leading-relaxed"');
c = c.replace(/className="text-xs font-semibold text-gray-700"/g, 'className="block text-xs font-semibold text-gray-700 mb-1 pb-1 leading-relaxed"');
fs.writeFileSync(f, c, 'utf8');
console.log('Fixed labels');
