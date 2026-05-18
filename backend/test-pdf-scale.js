const puppeteer = require('puppeteer');
const fs = require('fs');

async function run() {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          @page { size: A4 landscape; margin: 0; }
          html, body {
            width: 100%;
            height: 100%;
            margin: 0;
            padding: 0;
            background-color: blue;
            -webkit-print-color-adjust: exact;
          }
          .certificate {
            width: 100%;
            height: 100%;
            background-color: red;
            box-sizing: border-box;
            border: 10px solid green;
          }
        </style>
      </head>
      <body>
        <div class="certificate">
          <h1>Test PDF</h1>
        </div>
      </body>
    </html>
  `;
  
  await page.setContent(html, { waitUntil: 'networkidle0' });
  
  await page.setViewport({ width: 1122, height: 794, deviceScaleFactor: 1 });
  
  const pdf100 = await page.pdf({
    format: 'A4',
    landscape: true,
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
    printBackground: true,
    scale: 1,
    preferCSSPageSize: true,
  });
  
  fs.writeFileSync('test100.pdf', pdf100);
  
  const htmlFixed = html.replace(/width: 100%;/g, 'width: 1122px;').replace(/height: 100%;/g, 'height: 794px;');
  
  await page.setContent(htmlFixed, { waitUntil: 'networkidle0' });
  const pdfFixed = await page.pdf({
    width: '1122px',
    height: '794px',
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
    printBackground: true,
    scale: 1,
  });
  
  fs.writeFileSync('testFixed.pdf', pdfFixed);
  
  await browser.close();
  console.log('PDFs generated: test100.pdf, testFixed.pdf');
}

run();
