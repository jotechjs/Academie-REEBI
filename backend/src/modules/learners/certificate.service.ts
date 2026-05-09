import { Injectable, BadRequestException } from '@nestjs/common';
import * as puppeteer from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';

interface CertificateData {
  firstName: string;
  lastName: string;
  moyenneCours: number;
  codeAttestation: string;
  issueDate?: string;
}

@Injectable()
export class CertificateService {
  private async generateHTML(data: CertificateData): Promise<string> {
    const rootDir = path.resolve(__dirname, '../../..');
    const templatePath = path.join(
      rootDir,
      'templates/attestation/certificate-template.html'
    );
    const stylesPath = path.join(
      rootDir,
      'templates/attestation/styles.css'
    );
    const logoPath = path.join(
      rootDir,
      'templates/attestation/assets/logo-reebi.png'
    );
    const signaturePath = path.join(
      rootDir,
      'templates/attestation/assets/signature.png'
    );

    try {
      let template = fs.readFileSync(templatePath, 'utf8');
      const styles = fs.readFileSync(stylesPath, 'utf8');
      const logoBase64 = fs.readFileSync(logoPath).toString('base64');
      const signatureBase64 = fs.readFileSync(signaturePath).toString('base64');

      // Format the date
      const issueDate =
        data.issueDate ||
        new Date().toLocaleDateString('fr-FR', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        });

      // Note: Images are actually JPEGs despite .png extension
      const replacements = {
        '{{firstName}}': data.firstName || '',
        '{{lastName}}': data.lastName || '',
        '{{moyenne}}': data.moyenneCours?.toString() || '0',
        '{{codeUnique}}': data.codeAttestation || '',
        '{{issueDate}}': issueDate,
        './assets/logo-reebi.png': `data:image/jpeg;base64,${logoBase64}`,
        '{{signatureImage}}': `data:image/jpeg;base64,${signatureBase64}`,
      };

      Object.entries(replacements).forEach(([key, value]) => {
        template = template.split(key).join(value);
      });

      // Inject styles into head and remove external link
      const injectStyles = `
        <style>
          ${styles}
          @page {
            size: A4 landscape;
            margin: 0;
          }
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          html, body {
            width: 1122px;
            height: 794px;
            margin: 0;
            padding: 0;
            overflow: hidden;
            background-color: #ffffff !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .certificate {
             width: 1122px;
             height: 794px;
             background-color: #ffffff !important;
          }
        </style>
      `;

      template = template.replace('<link rel="stylesheet" href="./styles.css" />', '');
      template = template.replace('</head>', `${injectStyles}</head>`);

      return template;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new BadRequestException(`Failed to generate certificate HTML: ${errorMessage}`);
    }
  }

  async generatePDF(data: CertificateData): Promise<Buffer> {
    const cacheDir = path.resolve(__dirname, '../../..', '.cache', 'pdfs');
    const cacheFileName = `${data.codeAttestation || data.firstName + '_' + data.lastName}.pdf`;
    const cacheFilePath = path.join(cacheDir, cacheFileName);

    // 1. Ensure cache directory exists
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }

    // 2. Check cache first
    if (fs.existsSync(cacheFilePath)) {
      return fs.readFileSync(cacheFilePath);
    }

    let browser;
    try {
      const html = await this.generateHTML(data);

      const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/google-chrome';
      browser = await puppeteer.launch({
        headless: true,
        executablePath,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--font-render-hinting=none',
        ],
      });

      const page = await browser.newPage();

      await page.setViewport({
        width: 1122,
        height: 794,
        deviceScaleFactor: 1,
      });

      await page.setContent(html, {
        waitUntil: ['load', 'networkidle0'],
        timeout: 30000,
      });

      // Ensure all resources are rendered
      await page.evaluate(async () => {
        const images = Array.from(document.images);
        await Promise.all(images.map(img => {
          if (img.complete) return Promise.resolve();
          return new Promise(res => {
            img.onload = img.onerror = res;
          });
        }));
        // @ts-ignore
        if (document.fonts && document.fonts.ready) await document.fonts.ready;
      });

      // Extra wait to be 100% sure
      await new Promise(res => setTimeout(res, 1000));

      const pdfBufferRaw = await page.pdf({
        width: '1122px',
        height: '794px',
        margin: { top: 0, right: 0, bottom: 0, left: 0 },
        printBackground: true,
        scale: 1,
        displayHeaderFooter: false,
        preferCSSPageSize: true
      });

      const pdfBuffer = Buffer.from(pdfBufferRaw);

      // 3. Save to cache
      fs.writeFileSync(cacheFilePath, pdfBuffer);

      return pdfBuffer;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new BadRequestException(
        `Failed to generate PDF: ${errorMessage}`
      );
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }
}
