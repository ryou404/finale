const fs = require('fs');
const path = require('path');
require('dotenv').config();
const { connectDB } = require('./src/db/connection');
const { KnowledgeChunk } = require('./src/db/models/KnowledgeChunk');
const { ingestDocument } = require('./src/services/ingestionService');

async function reingestAll() {
  await connectDB();
  console.log('--- BẮT ĐẦU NẠP LẠI TÀI LIỆU KHÓA HỌC VỚI COURSE-AWARE CHUNKER ---');

  const files = [
    {
      fileName: 'pu_courses_AI_v5.md',
      title: 'pu_courses_AI_v5.md',
      department: 'AI',
      category: 'Course Syllabus - AI'
    },
    {
      fileName: 'pu_courses_CS_v5.md',
      title: 'pu_courses_CS_v5.md',
      department: 'CS',
      category: 'Course Syllabus - CS'
    },
    {
      fileName: 'pu_courses_IM_v5.md',
      title: 'pu_courses_IM_v5.md',
      department: 'IM',
      category: 'Course Syllabus - IM'
    }
  ];

  for (const f of files) {
    const filePath = path.resolve(__dirname, f.fileName);
    if (!fs.existsSync(filePath)) {
      console.error(`File không tồn tại: ${filePath}`);
      continue;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    console.log(`\n[Đọc file] ${f.fileName} (${(content.length / 1024).toFixed(1)} KB)...`);

    // Clean old chunks with title matching filename
    const delRes = await KnowledgeChunk.deleteMany({ title: f.title });
    console.log(`[Dọn dẹp] Đã xóa ${delRes.deletedCount} chunks cũ của "${f.title}".`);

    // Ingest with new chunker
    const res = await ingestDocument({
      title: f.title,
      content: content,
      scope: 'public',
      userId: null,
      metadata: {
        category: f.category,
        department: f.department,
        source: 'course_markdown'
      }
    });

    console.log(`[Thành công] Nạp "${f.title}" hoàn tất! DocId: ${res.docId}, Chunks: ${res.totalChunks}`);
  }

  // Verify course 1776 in database
  console.log('\n--- KIỂM TRA CHUNKS MÔN 1776 TRONG DATABASE ---');
  const chunk1776 = await KnowledgeChunk.find({
    $or: [
      { 'metadata.courseCode': '1776' },
      { text: { $regex: '1776' } }
    ]
  }).select('title docId metadata text');

  console.log(`Tìm thấy ${chunk1776.length} chunk chứa 1776:`);
  for (const c of chunk1776) {
    console.log(`Doc: ${c.title} | Code: ${c.metadata?.courseCode} | Dept: ${c.metadata?.department} | Name: ${c.metadata?.courseName} | GV: ${c.metadata?.instructor}`);
    console.log('Snippet:\n' + c.text.slice(0, 300) + '...\n');
  }

  console.log('HOÀN TẤT NẠP LẠI TOÀN BỘ!');
  process.exit(0);
}

reingestAll().catch(err => {
  console.error('Lỗi khi nạp lại tài liệu:', err);
  process.exit(1);
});
