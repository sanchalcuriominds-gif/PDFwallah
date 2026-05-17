// Seed data for initial setup
import { db } from './db';

export async function seedDatabase() {
  // Check if data already exists
  const classCount = await db.class.count();
  if (classCount > 0) {
    return { message: 'Database already seeded', skipped: true };
  }

  // Create Classes
  const class9 = await db.class.create({
    data: { name: 'Class 9', slug: 'class-9', sortOrder: 1 }
  });
  const class10 = await db.class.create({
    data: { name: 'Class 10', slug: 'class-10', sortOrder: 2 }
  });
  const class11 = await db.class.create({
    data: { name: 'Class 11', slug: 'class-11', sortOrder: 3 }
  });
  const class12 = await db.class.create({
    data: { name: 'Class 12', slug: 'class-12', sortOrder: 4 }
  });

  // Create Subjects for Class 10
  const science10 = await db.subject.create({
    data: { name: 'Science', slug: 'science', classId: class10.id }
  });
  const maths10 = await db.subject.create({
    data: { name: 'Mathematics', slug: 'mathematics', classId: class10.id }
  });
  const english10 = await db.subject.create({
    data: { name: 'English', slug: 'english', classId: class10.id }
  });
  const socialScience10 = await db.subject.create({
    data: { name: 'Social Science', slug: 'social-science', classId: class10.id }
  });
  const hindi10 = await db.subject.create({
    data: { name: 'Hindi', slug: 'hindi', classId: class10.id }
  });

  // Create Subjects for Class 9
  const science9 = await db.subject.create({
    data: { name: 'Science', slug: 'science', classId: class9.id }
  });
  const maths9 = await db.subject.create({
    data: { name: 'Mathematics', slug: 'mathematics', classId: class9.id }
  });

  // Create Subjects for Class 11
  const physics11 = await db.subject.create({
    data: { name: 'Physics', slug: 'physics', classId: class11.id }
  });
  const chemistry11 = await db.subject.create({
    data: { name: 'Chemistry', slug: 'chemistry', classId: class11.id }
  });
  const maths11 = await db.subject.create({
    data: { name: 'Mathematics', slug: 'mathematics', classId: class11.id }
  });

  // Create Subjects for Class 12
  const physics12 = await db.subject.create({
    data: { name: 'Physics', slug: 'physics', classId: class12.id }
  });
  const chemistry12 = await db.subject.create({
    data: { name: 'Chemistry', slug: 'chemistry', classId: class12.id }
  });
  const maths12 = await db.subject.create({
    data: { name: 'Mathematics', slug: 'mathematics', classId: class12.id }
  });

  // Create Chapters for Class 10 Science
  const ch1Light = await db.chapter.create({
    data: { name: 'Light - Reflection and Refraction', slug: 'light-reflection-refraction', subjectId: science10.id }
  });
  const ch2HumanEye = await db.chapter.create({
    data: { name: 'Human Eye and Colourful World', slug: 'human-eye-colourful-world', subjectId: science10.id }
  });
  const ch3Electricity = await db.chapter.create({
    data: { name: 'Electricity', slug: 'electricity', subjectId: science10.id }
  });
  const ch4Magnetic = await db.chapter.create({
    data: { name: 'Magnetic Effects of Electric Current', slug: 'magnetic-effects', subjectId: science10.id }
  });
  const ch5Carbon = await db.chapter.create({
    data: { name: 'Carbon and its Compounds', slug: 'carbon-compounds', subjectId: science10.id }
  });
  const ch6Life = await db.chapter.create({
    data: { name: 'Life Processes', slug: 'life-processes', subjectId: science10.id }
  });

  // Create Chapters for Class 10 Maths
  const ch1Real = await db.chapter.create({
    data: { name: 'Real Numbers', slug: 'real-numbers', subjectId: maths10.id }
  });
  const ch2Poly = await db.chapter.create({
    data: { name: 'Polynomials', slug: 'polynomials', subjectId: maths10.id }
  });
  const ch3LinEq = await db.chapter.create({
    data: { name: 'Pair of Linear Equations', slug: 'linear-equations', subjectId: maths10.id }
  });
  const ch4Quad = await db.chapter.create({
    data: { name: 'Quadratic Equations', slug: 'quadratic-equations', subjectId: maths10.id }
  });
  const ch5AP = await db.chapter.create({
    data: { name: 'Arithmetic Progressions', slug: 'arithmetic-progressions', subjectId: maths10.id }
  });
  const ch6Tri = await db.chapter.create({
    data: { name: 'Triangles', slug: 'triangles', subjectId: maths10.id }
  });

  // Create Topics under Light chapter
  const topic1 = await db.topic.create({
    data: { name: 'Handwritten Notes', slug: 'handwritten-notes', chapterId: ch1Light.id }
  });
  const topic2 = await db.topic.create({
    data: { name: 'Previous Year Questions', slug: 'pyq', chapterId: ch1Light.id }
  });
  const topic3 = await db.topic.create({
    data: { name: 'Numericals', slug: 'numericals', chapterId: ch1Light.id }
  });
  const topic4 = await db.topic.create({
    data: { name: 'Important Questions', slug: 'important-questions', chapterId: ch1Light.id }
  });
  const topic5 = await db.topic.create({
    data: { name: 'Mind Maps', slug: 'mind-maps', chapterId: ch1Light.id }
  });
  const topic6 = await db.topic.create({
    data: { name: 'Revision Notes', slug: 'revision-notes', chapterId: ch1Light.id }
  });

  // Create Topics under Electricity chapter
  const topic7 = await db.topic.create({
    data: { name: 'Handwritten Notes', slug: 'handwritten-notes', chapterId: ch3Electricity.id }
  });
  const topic8 = await db.topic.create({
    data: { name: 'Previous Year Questions', slug: 'pyq', chapterId: ch3Electricity.id }
  });
  const topic9 = await db.topic.create({
    data: { name: 'Numericals', slug: 'numericals', chapterId: ch3Electricity.id }
  });

  // Create Topics under Real Numbers chapter
  const topic10 = await db.topic.create({
    data: { name: 'Handwritten Notes', slug: 'handwritten-notes', chapterId: ch1Real.id }
  });
  const topic11 = await db.topic.create({
    data: { name: 'Previous Year Questions', slug: 'pyq', chapterId: ch1Real.id }
  });
  const topic12 = await db.topic.create({
    data: { name: 'Important Questions', slug: 'important-questions', chapterId: ch1Real.id }
  });

  // Create sample PDFs
  const samplePdfs = [
    {
      title: 'Light - Reflection & Refraction Handwritten Notes',
      description: 'Comprehensive handwritten notes covering all concepts of light reflection and refraction. Includes ray diagrams, lens formulas, mirror formulas, and numerical solving techniques. Perfect for board exam preparation.',
      price: 49,
      pdfPath: 'pdfs/sample-light-notes.pdf',
      pageCount: 25,
      featured: true,
      classId: class10.id,
      subjectId: science10.id,
      chapterId: ch1Light.id,
      topicId: topic1.id,
    },
    {
      title: 'Light PYQ - Last 10 Years',
      description: 'Previous year questions from CBSE board exams for the Light chapter. Includes detailed solutions and marking scheme. Covers all question types - MCQ, short answer, long answer, and numerical problems.',
      price: 29,
      pdfPath: 'pdfs/sample-light-pyq.pdf',
      pageCount: 18,
      featured: true,
      classId: class10.id,
      subjectId: science10.id,
      chapterId: ch1Light.id,
      topicId: topic2.id,
    },
    {
      title: 'Light - Numericals Practice Set',
      description: 'Extensive collection of numerical problems on light reflection and refraction. Graduated from easy to difficult levels. Includes hints and complete solutions for all problems.',
      price: 39,
      pdfPath: 'pdfs/sample-light-numericals.pdf',
      pageCount: 30,
      featured: false,
      classId: class10.id,
      subjectId: science10.id,
      chapterId: ch1Light.id,
      topicId: topic3.id,
    },
    {
      title: 'Light - Important Questions Bank',
      description: 'Curated collection of the most important questions likely to appear in board exams. Based on analysis of past 10 years papers and current syllabus pattern.',
      price: 35,
      pdfPath: 'pdfs/sample-light-important.pdf',
      pageCount: 15,
      featured: false,
      classId: class10.id,
      subjectId: science10.id,
      chapterId: ch1Light.id,
      topicId: topic4.id,
    },
    {
      title: 'Light Chapter - Mind Maps',
      description: 'Visual mind maps covering all concepts of the Light chapter. Great for quick revision before exams. Color-coded and easy to remember.',
      price: 19,
      pdfPath: 'pdfs/sample-light-mindmaps.pdf',
      pageCount: 8,
      featured: false,
      classId: class10.id,
      subjectId: science10.id,
      chapterId: ch1Light.id,
      topicId: topic5.id,
    },
    {
      title: 'Electricity - Handwritten Notes',
      description: 'Detailed handwritten notes on Electricity chapter. Covers Ohm\'s law, resistance, series and parallel circuits, electric power, and heating effect. Includes solved examples and practice problems.',
      price: 49,
      pdfPath: 'pdfs/sample-electricity-notes.pdf',
      pageCount: 28,
      featured: true,
      classId: class10.id,
      subjectId: science10.id,
      chapterId: ch3Electricity.id,
      topicId: topic7.id,
      salesCount: 45,
    },
    {
      title: 'Electricity PYQ Collection',
      description: 'Complete collection of previous year board questions on Electricity. Organized by year and difficulty level with detailed solutions.',
      price: 29,
      pdfPath: 'pdfs/sample-electricity-pyq.pdf',
      pageCount: 20,
      featured: false,
      classId: class10.id,
      subjectId: science10.id,
      chapterId: ch3Electricity.id,
      topicId: topic8.id,
      salesCount: 32,
    },
    {
      title: 'Real Numbers - Complete Notes',
      description: 'Thorough notes on Real Numbers including Euclid\'s Division Lemma, Fundamental Theorem of Arithmetic, and irrational numbers. Step-by-step proofs and examples included.',
      price: 39,
      pdfPath: 'pdfs/sample-real-numbers-notes.pdf',
      pageCount: 22,
      featured: true,
      classId: class10.id,
      subjectId: maths10.id,
      chapterId: ch1Real.id,
      topicId: topic10.id,
      salesCount: 67,
    },
    {
      title: 'Real Numbers - PYQ with Solutions',
      description: 'All previous year questions from Real Numbers chapter with detailed step-by-step solutions. Perfect for understanding exam patterns and scoring high.',
      price: 25,
      pdfPath: 'pdfs/sample-real-pyq.pdf',
      pageCount: 14,
      featured: false,
      classId: class10.id,
      subjectId: maths10.id,
      chapterId: ch1Real.id,
      topicId: topic11.id,
      salesCount: 28,
    },
  ];

  for (const pdf of samplePdfs) {
    await db.pdf.create({ data: pdf });
  }

  return { message: 'Database seeded successfully', classes: 4, subjects: 11, chapters: 12, pdfs: samplePdfs.length };
}
