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

const isProduction = process.env.NODE_ENV === 'production';

@Injectable()
export class CertificateService {
  private async getTemplatePath(): Promise<string> {
    const rootDir = process.cwd();
    const templatePath = path.join(rootDir, 'templates/attestation/certificate-template.html');
    console.log('[PDF] Template path résolu:', templatePath);
    console.log('[PDF] Template existe:', fs.existsSync(templatePath));
    return templatePath;
  }

  private async generateHTML(data: CertificateData): Promise<string> {
    const templatePath = await this.getTemplatePath();
    const rootDir = process.cwd();
    
    const stylesPath = path.join(rootDir, 'templates/attestation/styles.css');
    const logoPath = path.join(rootDir, 'templates/attestation/assets/logo-reebi.png');
    const signaturePath = path.join(rootDir, 'templates/attestation/assets/signature.png');

    console.log('[PDF] Styles path:', stylesPath, '- Existe:', fs.existsSync(stylesPath));
    console.log('[PDF] Logo path:', logoPath, '- Existe:', fs.existsSync(logoPath));
    console.log('[PDF] Signature path:', signaturePath, '- Existe:', fs.existsSync(signaturePath));

    try {
      let template = fs.readFileSync(templatePath, 'utf8');
      const styles = fs.readFileSync(stylesPath, 'utf8');
      const logoBase64 = fs.readFileSync(logoPath).toString('base64');
      const signatureBase64 = fs.readFileSync(signaturePath).toString('base64');

      console.log('[PDF] Template chargé, taille:', template.length, 'bytes');
      console.log('[PDF] Styles chargés, taille:', styles.length, 'bytes');
      console.log('[PDF] Logo base64, taille:', logoBase64.length, 'bytes');
      console.log('[PDF] Signature base64, taille:', signatureBase64.length, 'bytes');

      const issueDate = data.issueDate || new Date().toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });

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
          img {
             display: block;
             max-width: 100%;
             height: auto;
          }
        </style>
      `;

      template = template.replace('<link rel="stylesheet" href="./styles.css" />', '');
      template = template.replace('</head>', `${injectStyles}</head>`);

      console.log('[PDF] HTML généré, taille totale:', template.length, 'bytes');
      return template;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('[PDF] ERREUR génération HTML:', errorMessage);
      throw new BadRequestException(`Failed to generate certificate HTML: ${errorMessage}`);
    }
  }

  async generatePDF(data: CertificateData): Promise<Buffer> {
    // Désactiver le cache en production/serverless
    const useCache = !isProduction && !process.env.VERCEL && !process.env.RENDER;
    
    let cacheFilePath: string | null = null;
    
    if (useCache) {
      const cacheDir = path.resolve(process.cwd(), '.cache', 'pdfs');
      const cacheFileName = `${data.codeAttestation || data.firstName + '_' + data.lastName}.pdf`;
      cacheFilePath = path.join(cacheDir, cacheFileName);
      
      if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true });
      }
      
      if (fs.existsSync(cacheFilePath)) {
        console.log('[PDF] Cache hit, lecture depuis:', cacheFilePath);
        const cached = fs.readFileSync(cacheFilePath);
        console.log('[PDF] Cache lu, taille:', cached.length, 'bytes');
        return cached;
      }
    }

    let browser;
    try {
      console.log('[PDF] Démarrage génération PDF...');
      console.log('[PDF] Environment:', isProduction ? 'PRODUCTION' : 'DEVELOPMENT');
      console.log('[PDF] Utilisation cache:', useCache);
      
      const html = await this.generateHTML(data);
      console.log('[PDF] HTML prêt pour Puppeteer');

      // Import dynamique de @sparticuz/chromium pour production
      let launchOptions: any = {
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--font-render-hinting=none',
          '--disable-gpu',
          '--disable-software-rasterizer',
        ],
      };

      // En production, utiliser @sparticuz/chromium
      if (isProduction || process.env.VERCEL || process.env.RENDER) {
        try {
          const chromium = require('@sparticuz/chromium');
          chromium.setHeadlessMode = true;
          chromium.setGraphicsMode = false;
          
          launchOptions.executablePath = await chromium.executablePath();
          launchOptions.args = [...launchOptions.args, ...chromium.args];
          
          console.log('[PDF] Chromium serverless (@sparticuz) activé');
        } catch (chromiumError) {
          console.error('[PDF] ERREUR chargement @sparticuz/chromium:', (chromiumError as Error).message);
          // Fallback: utiliser Puppeteer default sans executablePath (utilise bundled)
          console.log('[PDF] Fallback: utilisation Puppeteer bundled');
        }
      } else {
        // En local, utiliser l'exécutable système ou Puppeteer default
        const customPath = process.env.PUPPETEER_EXECUTABLE_PATH;
        if (customPath && fs.existsSync(customPath)) {
          launchOptions.executablePath = customPath;
          console.log('[PDF] Chrome custom:', customPath);
        } else {
          console.log('[PDF] Utilisation Puppeteer default (bundled)');
        }
      }

      console.log('[PDF] Lancement Puppeteer...');
      browser = await puppeteer.launch(launchOptions);
      console.log('[PDF] Puppeteer lancé avec succès');

      const page = await browser.newPage();
      console.log('[PDF] Page Puppeteer créée');

      await page.setViewport({
        width: 1122,
        height: 794,
        deviceScaleFactor: 2,
      });

      await page.setContent(html, {
        waitUntil: ['networkidle2'],
        timeout: 30000,
      });

      console.log('[PDF] Contenu HTML injecté');

      // Wait for all resources and render
      await page.waitForSelector('.certificate', { timeout: 10000 }).catch(() => {
        console.log('[PDF] Certificate selector not found, continuing...');
      });

      // Check if content exists
      const pageContent = await page.content();
      console.log('[PDF] Page content length:', pageContent.length);

      await page.evaluate(async () => {
        // Wait for all images to load
        const images = Array.from(document.images);
        console.log('[PDF] Nombre d\'images dans le document:', images.length);
        
        for (const img of images) {
          if (!img.complete) {
            await new Promise((resolve) => {
              img.onload = resolve;
              img.onerror = resolve;
              setTimeout(resolve, 5000);
            });
          }
        }
        
        // Wait for fonts
        if (document.fonts && document.fonts.ready) {
          await document.fonts.ready.catch(() => {});
        }
        
        // Force a repaint
        document.body.offsetHeight;
      });
      
      console.log('[PDF] Images et fonts chargés');

      await new Promise(resolve => setTimeout(resolve, 2000));

      const pdfBufferRaw = await page.pdf({
        width: '1122px',
        height: '794px',
        margin: { top: 0, right: 0, bottom: 0, left: 0 },
        printBackground: true,
        scale: 1.5,
        displayHeaderFooter: false,
        preferCSSPageSize: false
      });

      const pdfBuffer = Buffer.from(pdfBufferRaw);
      console.log('[PDF] PDF généré, taille buffer:', pdfBuffer.length, 'bytes');

      if (pdfBuffer.length < 500) {
        console.error('[PDF] ERREUR: PDF généré trop petit (< 500 bytes), possible problème de rendu');
        throw new BadRequestException('PDF généré invalide: contenu trop petit');
      }

      // Sauvegarder en cache uniquement si pas production et chemin valide
      if (useCache && cacheFilePath) {
        try {
          fs.writeFileSync(cacheFilePath, pdfBuffer);
          console.log('[PDF] Sauvegardé en cache:', cacheFilePath);
        } catch (cacheError) {
          console.warn('[PDF] Warning cache:', (cacheError as Error).message);
        }
      }

      return pdfBuffer;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('[PDF] ERREUR génération PDF:', errorMessage);
      console.error('[PDF] Stack:', error instanceof Error ? error.stack : '');
      throw new BadRequestException(`Failed to generate PDF: ${errorMessage}`);
    } finally {
      if (browser) {
        await browser.close();
        console.log('[PDF] Puppeteer fermé');
      }
    }
  }
}
