const puppeteer = require('puppeteer');
const fs = require('fs');

async function testPDF() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  const html = `
    <html>
      <head>
        <style>
          @page { size: A4 landscape; margin: 0; }
          * { box-sizing: border-box; margin: 0; padding: 0; }
          html, body {
            width: 1122px; height: 794px;
            background: red;
          }
          .certificate {
            width: 1122px; height: 794px;
            background: blue;
            border: 20px solid yellow;
          }
        </style>
      </head>
      <body>
        <div class="certificate">Hello</div>
      </body>
    </html>
  `;
  
  await page.setContent(html);
  
  await page.pdf({
    path: 'test1.pdf',
    format: 'A4',
    landscape: true,
    scale: 1,
    preferCSSPageSize: true,
    printBackground: true,
    margin: { top: 0, right: 0, bottom: 0, left: 0 }
  });

  await browser.close();
}

testPDF().catch(console.error);
