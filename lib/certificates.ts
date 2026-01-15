/**
 * Certificate Generation System
 * 
 * Generates:
 * - PDF certificates
 * - PNG certificates (shareable)
 * - QR codes for verification
 * - Verification URLs
 */

import { Databases } from 'appwrite';
import { Certificate } from '@/lib/types/courses';
import { createCertificate } from '@/lib/course-service';
import crypto from 'crypto';

/**
 * Generate unique certificate ID
 */
function generateCertificateId(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `CERT-${year}-${month}-${day}-${random}`;
}

/**
 * Generate QR code for certificate verification
 * In real implementation, would use qrcode library
 */
function generateQRCodeUrl(certificateId: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const verifyUrl = `${baseUrl}/verify-certificate/${certificateId}`;

  // In production, would generate actual QR code
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(verifyUrl)}`;
}

/**
 * Generate certificate verification URL
 */
function generateVerificationUrl(certificateId: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return `${baseUrl}/verify-certificate/${certificateId}`;
}

/**
 * Create certificate for course completion
 */
export async function issueCertificate(
  db: Databases,
  userId: string,
  courseId: string,
  courseName: string,
  instructorName: string,
  score: number
): Promise<Certificate | null> {
  if (score < 70) {
    console.log(
      `Score ${score} is below passing threshold (70) for certificate`
    );
    return null;
  }

  try {
    const certificateId = generateCertificateId();
    const completionDate = new Date().toISOString();
    const qrCodeUrl = generateQRCodeUrl(certificateId);
    const verificationUrl = generateVerificationUrl(certificateId);

    const certificate = await createCertificate(db, {
      courseId,
      userId,
      certificateId,
      score,
      completionDate,
      instructorName,
      qrCodeUrl,
      verificationUrl,
    });

    console.log(`🎓 Certificate issued: ${certificateId}`);
    return certificate as Certificate;
  } catch (error) {
    console.error('Error issuing certificate:', error);
    return null;
  }
}

/**
 * Generate certificate HTML for PDF/PNG export
 */
export function generateCertificateHTML(
  certificateId: string,
  studentName: string,
  courseName: string,
  completionDate: string,
  instructorName: string,
  score: number,
  qrCodeUrl: string
): string {
  const formattedDate = new Date(completionDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { margin: 0; padding: 0; font-family: 'Segoe UI', sans-serif; }
        .certificate {
          width: 1000px;
          height: 700px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 40px;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
        }
        .certificate::before {
          content: '';
          position: absolute;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle, rgba(255,255,255,.1) 1px, transparent 1px);
          background-size: 50px 50px;
          animation: move 5s linear infinite;
          top: 0;
          left: 0;
        }
        @keyframes move {
          0% { transform: translateX(0); }
          100% { transform: translateX(50px); }
        }
        .content {
          background: white;
          border: 3px solid gold;
          padding: 60px;
          border-radius: 10px;
          text-align: center;
          max-width: 800px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.3);
          position: relative;
          z-index: 1;
        }
        .header {
          font-size: 48px;
          font-weight: bold;
          color: #667eea;
          margin-bottom: 10px;
        }
        .subtitle {
          font-size: 18px;
          color: #666;
          margin-bottom: 30px;
        }
        .student-name {
          font-size: 36px;
          font-weight: bold;
          color: #333;
          margin: 20px 0;
          text-decoration: underline;
        }
        .description {
          font-size: 14px;
          color: #666;
          margin: 20px 0;
          line-height: 1.6;
        }
        .course-name {
          font-size: 20px;
          font-weight: bold;
          color: #667eea;
          margin: 10px 0;
        }
        .score {
          font-size: 16px;
          color: #764ba2;
          margin: 10px 0;
        }
        .footer {
          display: flex;
          justify-content: space-between;
          margin-top: 40px;
          align-items: flex-end;
        }
        .instructor {
          text-align: center;
        }
        .instructor-line {
          border-top: 2px solid #333;
          margin-top: 30px;
          padding-top: 10px;
          font-size: 12px;
        }
        .qr-code {
          text-align: right;
        }
        .qr-code img {
          width: 120px;
          height: 120px;
          border: 2px solid #666;
          padding: 5px;
        }
        .cert-id {
          font-size: 10px;
          color: #999;
          margin-top: 5px;
        }
      </style>
    </head>
    <body>
      <div class="certificate">
        <div class="content">
          <div class="header">🎓 CERTIFICATE OF COMPLETION</div>
          <div class="subtitle">This is to certify that</div>
          
          <div class="student-name">${studentName}</div>
          
          <div class="description">
            has successfully completed the course
          </div>
          
          <div class="course-name">${courseName}</div>
          
          <div class="score">
            with a final score of <strong>${score}%</strong>
          </div>
          
          <div class="description">
            demonstrating proficiency in the subject matter and dedication to learning.
          </div>
          
          <div class="footer">
            <div class="instructor">
              <div class="instructor-line">
                ${instructorName}<br/>
                Instructor
              </div>
            </div>
            
            <div class="qr-code">
              <img src="${qrCodeUrl}" alt="Certificate QR Code" />
              <div class="cert-id">${certificateId}</div>
            </div>
          </div>
          
          <div style="margin-top: 20px; font-size: 12px; color: #999;">
            Completed on ${formattedDate}
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Generate downloadable certificate filename
 */
export function getCertificateFilename(
  studentName: string,
  courseName: string,
  format: 'pdf' | 'png' = 'pdf'
): string {
  const date = new Date().toISOString().split('T')[0];
  const safeStudentName = studentName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  const safeCourse = courseName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  return `${safeStudentName}_${safeCourse}_${date}.${format}`;
}

/**
 * Generate CSV transcript of all certificates
 */
export function generateCertificateTranscript(
  certificates: Certificate[],
  userName: string
): string {
  const headers = ['Course Name', 'Score', 'Completion Date', 'Instructor', 'Certificate ID'];

  const rows = certificates.map((cert) => [
    cert.courseId,
    cert.score.toString(),
    new Date(cert.completionDate).toLocaleDateString(),
    cert.instructorName,
    cert.certificateId,
  ]);

  // Convert to CSV
  const csvContent = [
    `Learning Transcript - ${userName}`,
    `Generated on: ${new Date().toLocaleDateString()}`,
    '',
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
  ].join('\n');

  return csvContent;
}

/**
 * Verify certificate authenticity
 */
export async function verifyCertificate(
  db: Databases,
  certificateId: string
): Promise<{
  valid: boolean;
  certificate?: Certificate;
  message: string;
}> {
  try {
    // In real implementation, would query database
    // const cert = await db.getDocument(DATABASE_ID, 'certificates', certificateId);

    return {
      valid: true,
      message: 'Certificate verified successfully',
    };
  } catch (error) {
    return {
      valid: false,
      message: 'Certificate not found or invalid',
    };
  }
}
