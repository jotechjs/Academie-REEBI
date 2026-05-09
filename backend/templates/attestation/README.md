# Template Attestation REEBI

## Fichiers générés
- `certificate-template.html`
- `styles.css`

## Variables dynamiques autorisées
Remplacer uniquement ces variables dans le HTML :
- `{{firstName}}`
- `{{lastName}}`
- `{{codeUnique}}`
- `{{issueDate}}`
- `{{signatureImage}}`

Le reste du texte doit rester identique.

## Assets
- Logo fixe attendu : `./assets/logo-reebi.png`
- Signature dynamique : `{{signatureImage}}`

## Utilisation Puppeteer (exemple)
```js
import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer';

const templatePath = path.resolve('backend/templates/attestation/certificate-template.html');
const html = await fs.readFile(templatePath, 'utf8');
const logoPath = path.resolve('backend/templates/attestation/assets/logo-reebi.png');
const signaturePath = path.resolve('backend/templates/attestation/assets/signature.png');

const rendered = html
  .replace('./assets/logo-reebi.png', pathToFileURL(logoPath).href)
  .replace(/{{firstName}}/g, 'Josaphat')
  .replace(/{{lastName}}/g, 'LOKO')
  .replace(/{{codeUnique}}/g, 'deb04022026')
  .replace(/{{issueDate}}/g, '30 avril 2026')
  .replace(/{{signatureImage}}/g, pathToFileURL(signaturePath).href);

const browser = await puppeteer.launch({ headless: true });
const page = await browser.newPage();
await page.setContent(rendered, { waitUntil: 'networkidle0' });
await page.pdf({
  path: 'attestation.pdf',
  printBackground: true,
  preferCSSPageSize: true,
});
await browser.close();
```
