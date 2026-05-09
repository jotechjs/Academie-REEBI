import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const templatePath = path.resolve(process.cwd(), '../backend/templates/attestation/certificate-template.html');
    const stylesPath = path.resolve(process.cwd(), '../backend/templates/attestation/styles.css');
    const logoPath = path.resolve(process.cwd(), '../backend/templates/attestation/assets/logo-reebi.png');
    const signaturePath = path.resolve(process.cwd(), '../backend/templates/attestation/assets/signature.png');

    const template = fs.readFileSync(templatePath, 'utf8');
    const styles = fs.readFileSync(stylesPath, 'utf8');
    const logoBase64 = fs.readFileSync(logoPath).toString('base64');
    const signatureBase64 = fs.readFileSync(signaturePath).toString('base64');

    return NextResponse.json({
      template,
      styles,
      logo: `data:image/jpeg;base64,${logoBase64}`,
      signature: `data:image/jpeg;base64,${signatureBase64}`
    });
  } catch (error) {
    console.error('Error loading certificate template:', error);
    return NextResponse.json({ error: 'Failed to load template' }, { status: 500 });
  }
}
