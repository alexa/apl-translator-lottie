import fs from 'fs';
import { convertFile } from "./index";
 
const content = convertFile('./test/local/lottie.json');
 
fs.writeFile('./test/local/apl.json', content, err => {
    if (err) {
      console.error(err);
    }
    console.error('File written successfully.');
  });