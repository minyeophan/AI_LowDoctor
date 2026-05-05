import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { load } from 'cheerio';
import FormData from 'form-data';
import axios from 'axios';
import Upload from '../schemas/upload_db.js';
import { maskPII } from '../utils/maskPII.js';

const AI_SERVER_URL = process.env.AI_SERVER_URL || 'http://localhost:8000';

const execAsync = promisify(exec);

export const convertDocument = async (req, res, next) => {
    try {
        const { documentId } = req.body;
        if (!documentId) {
            return res.status(400).json({ message: 'documentId가 필요합니다.' });
        }

        const upload = await Upload.findOne({ documentId });
        if (!upload) {
            return res.status(404).json({ message: '문서를 찾을 수 없습니다.' });
        }

        const originalPath = path.resolve(upload.filePath);
        const ext = path.extname(upload.filename).toLowerCase();

        let htmlContent = '';

        if (['.hwp', '.hwpx'].includes(ext)) {
            // HWP/HWPX: AI 서버(hwp5html → xhtml 파싱)로 변환
            const formData = new FormData();
            formData.append('file', fs.createReadStream(originalPath), { filename: `input${ext}` });

            const response = await axios.post(
                `${AI_SERVER_URL}/api/convert-hwp`,
                formData,
                { headers: formData.getHeaders(), timeout: 90000 }
            );
            htmlContent = response.data.html;

        } else if (ext === '.pdf') {
            // PDF: AI 서버(pdfplumber)로 변환
            const formData = new FormData();
            formData.append('file', fs.createReadStream(originalPath), { filename: 'input.pdf' });

            const response = await axios.post(
                `${AI_SERVER_URL}/api/convert-pdf`,
                formData,
                { headers: formData.getHeaders(), timeout: 90000 }
            );
            htmlContent = response.data.html;

        } else {
            // 기타 형식: LibreOffice로 변환
            const tmpDir = `/tmp/convert_${documentId}`;
            const safeSrcPath = `/tmp/input_${documentId}${ext}`;

            await fs.promises.mkdir(tmpDir, { recursive: true });
            await fs.promises.copyFile(originalPath, safeSrcPath);

            try {
                const { stdout, stderr } = await execAsync(
                    `libreoffice --headless --convert-to html --outdir ${tmpDir} ${safeSrcPath}`,
                    { timeout: 60000 }
                );
                if (stderr) console.log('LibreOffice stderr:', stderr);

                const files = await fs.promises.readdir(tmpDir);
                const htmlFile = files.find(f => f.endsWith('.html') || f.endsWith('.htm'));
                if (!htmlFile) {
                    throw new Error(`HTML 변환 실패. 생성된 파일: ${files.join(', ')}`);
                }
                htmlContent = await fs.promises.readFile(path.join(tmpDir, htmlFile), 'utf8');
            } finally {
                await fs.promises.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
                await fs.promises.rm(safeSrcPath, { force: true }).catch(() => {});
            }
        }

        // Cheerio로 HTML 정제
        const $ = load(htmlContent, { decodeEntities: false });

        $('script, style, meta, link, head').remove();

        $('*').each((_, el) => {
            if (el.type !== 'tag') return;
            const tag = el.name;

            // img 태그는 src/alt 유지를 위해 속성 제거 제외
            if (tag === 'img') return;

            const colspan = $(el).attr('colspan');
            const rowspan = $(el).attr('rowspan');

            Object.keys(el.attribs || {}).forEach(attr => $(el).removeAttr(attr));

            if (['td', 'th'].includes(tag)) {
                if (colspan) $(el).attr('colspan', colspan);
                if (rowspan) $(el).attr('rowspan', rowspan);
            }
        });

        const cleanHtml = $('body').html() || $.html();

        const maskedHtml = maskPII(cleanHtml);

        res.status(200).json({ html: maskedHtml });

    } catch (error) {
        console.error('변환 오류:', error);
        next(error);
    }
};
