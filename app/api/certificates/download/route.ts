import { NextRequest, NextResponse } from 'next/server'
import PDFDocument from 'pdfkit'
import { createAdminClient } from '@/lib/server/appwrite'
import { generateCertificateHTML } from '@/lib/certificates'

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || process.env.APPWRITE_DATABASE_ID || 'peerspark-main-db'

async function getCertificateBundle(certificateId: string) {
  const { databases } = await createAdminClient()
  const certificate = await databases.getDocument(DATABASE_ID, 'certificates', certificateId)
  const course = await databases.getDocument(DATABASE_ID, 'courses', certificate.courseId)
  const profile = await databases.getDocument(DATABASE_ID, 'profiles', certificate.userId)

  return {
    certificate,
    course,
    profile,
  }
}
function renderCertificatePdf(data: {
  certificate: any
  course: any
  profile: any
}) {
  return new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 })
    const chunks: Buffer[] = []

    doc.on('data', (chunk) => chunks.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    doc.fontSize(26).text('Certificate of Completion', { align: 'center' })
    doc.moveDown()
    doc.fontSize(14).text('This certifies that', { align: 'center' })
    doc.moveDown(0.5)
    doc.fontSize(22).text(data.profile.name || 'Learner', { align: 'center', underline: true })
    doc.moveDown()
    doc.fontSize(14).text('has successfully completed the course', { align: 'center' })
    doc.moveDown(0.5)
    doc.fontSize(18).text(data.course.title || 'Course', { align: 'center' })
    doc.moveDown()
    doc.fontSize(12).text(`Score: ${data.certificate.score || 0}%`, { align: 'center' })
    doc.text(`Completion Date: ${new Date(data.certificate.completionDate || data.certificate.createdAt).toLocaleDateString()}`, { align: 'center' })
    doc.moveDown(2)
    doc.text(`Instructor: ${data.certificate.instructorName || 'Instructor'}`, { align: 'left' })
    doc.text(`Certificate ID: ${data.certificate.certificateId || data.certificate.$id}`, { align: 'left' })
    doc.text(`Verification URL: ${data.certificate.verificationUrl || ''}`, { align: 'left' })
    doc.end()
  })
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const certificateId = searchParams.get('certificateId')
    const format = searchParams.get('format') || 'pdf'

    if (!certificateId) {
      return NextResponse.json({ error: 'Missing certificateId parameter' }, { status: 400 })
    }

    if (!['pdf', 'html'].includes(format)) {
      return NextResponse.json({ error: 'Format must be pdf or html' }, { status: 400 })
    }

    const bundle = await getCertificateBundle(certificateId)

    if (format === 'html') {
      const html = generateCertificateHTML(
        bundle.certificate.certificateId || bundle.certificate.$id,
        bundle.profile.name || 'Learner',
        bundle.course.title || 'Course',
        bundle.certificate.completionDate || bundle.certificate.createdAt,
        bundle.certificate.instructorName || 'Instructor',
        bundle.certificate.score || 0,
        bundle.certificate.qrCodeUrl || '',
      )

      return new Response(html, {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      })
    }

    const pdf = await renderCertificatePdf(bundle)
    const pdfBytes = new Uint8Array(pdf)
    const filename = `Certificate_${bundle.certificate.certificateId || certificateId}.pdf`

    return new Response(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error: any) {
    console.error('Error downloading certificate:', error)
    return NextResponse.json({ error: error.message || 'Failed to download certificate' }, { status: 500 })
  }
}
