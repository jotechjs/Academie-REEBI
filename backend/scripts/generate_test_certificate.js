const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const os = require('os');

(async () => {
  try {
    const root = path.resolve(__dirname, '..'); // backend
    const templatePath = path.join(root, 'templates', 'attestation', 'certificate-template.html');
    const stylesPath = path.join(root, 'templates', 'attestation', 'styles.css');
    const logoPath = path.join(root, 'templates', 'attestation', 'assets', 'logo-reebi.png');
    const signaturePath = path.join(root, 'templates', 'attestation', 'assets', 'signature.png');

    console.log('Reading template and assets...');
    const template = fs.readFileSync(templatePath, 'utf8');
    const styles = fs.readFileSync(stylesPath, 'utf8');
    const logoBase64 = fs.readFileSync(logoPath).toString('base64');
    const signatureBase64 = fs.readFileSync(signaturePath).toString('base64');

    const replacements = {
      '{{firstName}}': 'Hospice',
      '{{lastName}}': 'ADJA',
      '{{moyenne}}': '18',
      '{{codeUnique}}': 'TEST123',
      '{{issueDate}}': new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }),
      './assets/logo-reebi.png': `data:image/png;base64,${logoBase64}`,
      '{{signatureImage}}': `data:image/png;base64,${signatureBase64}`,
    };

    let html = template;
    Object.entries(replacements).forEach(([k, v]) => {
      html = html.split(k).join(v);
    });

    const injectStyles = `\n<style>\n${styles}\n@page{size:A4 landscape;margin:0;}\n*{margin:0;padding:0;box-sizing:border-box;}\nhtml,body{width:1122px;height:794px;margin:0;padding:0;overflow:hidden;}\n</style>\n`;
    html = html.replace('</head>', `${injectStyles}</head>`);

    console.log('Launching puppeteer...');
    const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/google-chrome';
    const browser = await puppeteer.launch({
      headless: true,
      executablePath,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1122, height: 794, deviceScaleFactor: 2 });

    console.log('Setting page content...');
    await page.setContent(html, { waitUntil: 'domcontentloaded' });

    console.log('Waiting for images and fonts...');
    await page.evaluate(async () => {
      const imgs = Array.from(document.images || []);
      await Promise.all(imgs.map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise(res => { img.onload = img.onerror = res; });
      }));
      if (document.fonts && document.fonts.ready) await document.fonts.ready;
    });

    const outPath = path.join(os.homedir(), 'Téléchargements', 'Attestation_Test_Hospice_ADJA.pdf');
    console.log('Generating PDF to', outPath);
    const pdf = await page.pdf({ width: '1122px', height: '794px', margin: { top: 0, right: 0, bottom: 0, left: 0 }, printBackground: true, scale: 1 });
    fs.writeFileSync(outPath, pdf);

    await browser.close();
    console.log('PDF generated successfully at', outPath);
    process.exit(0);
  } catch (err) {
    console.error('Error in test generation:', err);
    process.exit(2);
  }
})();
