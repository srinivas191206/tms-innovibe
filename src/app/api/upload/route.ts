import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    
    if (!file) {
      return NextResponse.json({ error: 'No file was uploaded.' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Build unique, secure file path
    const ext = path.extname(file.name) || '.pdf';
    const cleanBase = file.name.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 15);
    const filename = `${cleanBase}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}${ext}`;
    
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    
    // Ensure physical uploads folder exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    const filePath = path.join(uploadDir, filename);
    fs.writeFileSync(filePath, buffer);
    
    // Relative public URL path
    const fileUrl = `/uploads/${filename}`;
    
    return NextResponse.json({ filePath: fileUrl });
  } catch (error) {
    console.error('[API UPLOAD ERROR] Failed to save binary file:', error);
    return NextResponse.json({ error: 'Failed to process file upload.' }, { status: 500 });
  }
}
