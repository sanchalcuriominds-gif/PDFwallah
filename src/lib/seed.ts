// Seed data for initial setup
import { db } from './db';

export async function seedDatabase() {
  // Check if data already exists
  const classCount = await db.class.count();
  if (classCount > 0) {
    return { message: 'Database already seeded', skipped: true };
  }

  // Create School Classes
  const class9 = await db.class.create({
    data: { name: 'Class 9', slug: 'class-9', type: 'school', sortOrder: 1 }
  });
  const class10 = await db.class.create({
    data: { name: 'Class 10', slug: 'class-10', type: 'school', sortOrder: 2 }
  });
  const class11 = await db.class.create({
    data: { name: 'Class 11', slug: 'class-11', type: 'school', sortOrder: 3 }
  });
  const class12 = await db.class.create({
    data: { name: 'Class 12', slug: 'class-12', type: 'school', sortOrder: 4 }
  });

  // Create Competitive Exam Classes
  const jee = await db.class.create({
    data: { name: 'JEE', slug: 'jee', type: 'competitive', sortOrder: 10 }
  });
  const neet = await db.class.create({
    data: { name: 'NEET', slug: 'neet', type: 'competitive', sortOrder: 11 }
  });
  const cuet = await db.class.create({
    data: { name: 'CUET', slug: 'cuet', type: 'competitive', sortOrder: 12 }
  });
  const reet = await db.class.create({
    data: { name: 'REET', slug: 'reet', type: 'competitive', sortOrder: 13 }
  });
  const ssc = await db.class.create({
    data: { name: 'SSC', slug: 'ssc', type: 'competitive', sortOrder: 14 }
  });
  const railway = await db.class.create({
    data: { name: 'Railway', slug: 'railway', type: 'competitive', sortOrder: 15 }
  });

  // Create Subjects for JEE
  const jeePhysics = await db.subject.create({
    data: { name: 'Physics', slug: 'physics', classId: jee.id }
  });
  const jeeChemistry = await db.subject.create({
    data: { name: 'Chemistry', slug: 'chemistry', classId: jee.id }
  });
  const jeeMaths = await db.subject.create({
    data: { name: 'Mathematics', slug: 'mathematics', classId: jee.id }
  });

  // Create Subjects for NEET
  const neetPhysics = await db.subject.create({
    data: { name: 'Physics', slug: 'physics', classId: neet.id }
  });
  const neetChemistry = await db.subject.create({
    data: { name: 'Chemistry', slug: 'chemistry', classId: neet.id }
  });
  const neetBiology = await db.subject.create({
    data: { name: 'Biology', slug: 'biology', classId: neet.id }
  });

  // Create Chapters for JEE Physics
  const jeeMechanics = await db.chapter.create({
    data: { name: 'Mechanics', slug: 'mechanics', subjectId: jeePhysics.id }
  });
  const jeeThermo = await db.chapter.create({
    data: { name: 'Thermodynamics', slug: 'thermodynamics', subjectId: jeePhysics.id }
  });
  const jeeElectro = await db.chapter.create({
    data: { name: 'Electrostatics', slug: 'electrostatics', subjectId: jeePhysics.id }
  });

  // Create Chapters for JEE Chemistry
  const jeeOrganic = await db.chapter.create({
    data: { name: 'Organic Chemistry', slug: 'organic-chemistry', subjectId: jeeChemistry.id }
  });
  const jeeInorganic = await db.chapter.create({
    data: { name: 'Inorganic Chemistry', slug: 'inorganic-chemistry', subjectId: jeeChemistry.id }
  });

  // Create Chapters for JEE Maths
  const jeeCalculus = await db.chapter.create({
    data: { name: 'Calculus', slug: 'calculus', subjectId: jeeMaths.id }
  });
  const jeeAlgebra = await db.chapter.create({
    data: { name: 'Algebra', slug: 'algebra', subjectId: jeeMaths.id }
  });

  // Create Chapters for NEET Biology
  const neetBotany = await db.chapter.create({
    data: { name: 'Botany', slug: 'botany', subjectId: neetBiology.id }
  });
  const neetZoology = await db.chapter.create({
    data: { name: 'Zoology', slug: 'zoology', subjectId: neetBiology.id }
  });

  // Create Topics for JEE chapters
  const jeeMechanicsNotes = await db.topic.create({
    data: { name: 'Handwritten Notes', slug: 'handwritten-notes', chapterId: jeeMechanics.id }
  });
  const jeeMechanicsPyq = await db.topic.create({
    data: { name: 'Previous Year Questions', slug: 'pyq', chapterId: jeeMechanics.id }
  });
  const jeeThermoNotes = await db.topic.create({
    data: { name: 'Handwritten Notes', slug: 'handwritten-notes', chapterId: jeeThermo.id }
  });
  const jeeCalculusNotes = await db.topic.create({
    data: { name: 'Handwritten Notes', slug: 'handwritten-notes', chapterId: jeeCalculus.id }
  });
  const jeeOrganicNotes = await db.topic.create({
    data: { name: 'Handwritten Notes', slug: 'handwritten-notes', chapterId: jeeOrganic.id }
  });

  // Create Topics for NEET chapters
  const neetBotanyNotes = await db.topic.create({
    data: { name: 'Handwritten Notes', slug: 'handwritten-notes', chapterId: neetBotany.id }
  });
  const neetZoologyNotes = await db.topic.create({
    data: { name: 'Handwritten Notes', slug: 'handwritten-notes', chapterId: neetZoology.id }
  });

  // Create competitive exam PDFs
  const competitivePdfs = [
    {
      title: 'JEE Mechanics - Complete Notes',
      description: 'Comprehensive handwritten notes covering all topics in Mechanics for JEE Main & Advanced. Includes Newton\'s Laws, Work-Energy, Rotational Motion, and Gravitation with solved examples.',
      price: 99,
      pdfPath: 'pdfs/jee-mechanics-notes.pdf',
      pageCount: 45,
      featured: true,
      classId: jee.id,
      subjectId: jeePhysics.id,
      chapterId: jeeMechanics.id,
      topicId: jeeMechanicsNotes.id,
      salesCount: 120,
    },
    {
      title: 'JEE Mechanics - PYQ Last 15 Years',
      description: 'Previous year questions from JEE Main & Advanced for Mechanics chapter. Detailed solutions with shortcut tricks and multiple approaches.',
      price: 69,
      pdfPath: 'pdfs/jee-mechanics-pyq.pdf',
      pageCount: 35,
      featured: true,
      classId: jee.id,
      subjectId: jeePhysics.id,
      chapterId: jeeMechanics.id,
      topicId: jeeMechanicsPyq.id,
      salesCount: 85,
    },
    {
      title: 'JEE Thermodynamics - Handwritten Notes',
      description: 'Complete handwritten notes on Thermodynamics for JEE preparation. Covers laws of thermodynamics, heat transfer, and kinetic theory of gases.',
      price: 79,
      pdfPath: 'pdfs/jee-thermo-notes.pdf',
      pageCount: 30,
      featured: false,
      classId: jee.id,
      subjectId: jeePhysics.id,
      chapterId: jeeThermo.id,
      topicId: jeeThermoNotes.id,
      salesCount: 55,
    },
    {
      title: 'JEE Calculus - Master Notes',
      description: 'In-depth notes covering Differential and Integral Calculus for JEE. Includes limits, continuity, differentiation, integration, and differential equations.',
      price: 89,
      pdfPath: 'pdfs/jee-calculus-notes.pdf',
      pageCount: 50,
      featured: true,
      classId: jee.id,
      subjectId: jeeMaths.id,
      chapterId: jeeCalculus.id,
      topicId: jeeCalculusNotes.id,
      salesCount: 95,
    },
    {
      title: 'JEE Organic Chemistry - Complete Guide',
      description: 'Comprehensive guide to Organic Chemistry for JEE. Covers reaction mechanisms, named reactions, and stereochemistry with practice problems.',
      price: 85,
      pdfPath: 'pdfs/jee-organic-notes.pdf',
      pageCount: 40,
      featured: false,
      classId: jee.id,
      subjectId: jeeChemistry.id,
      chapterId: jeeOrganic.id,
      topicId: jeeOrganicNotes.id,
      salesCount: 72,
    },
    {
      title: 'NEET Biology - Botany Notes',
      description: 'Complete botany notes for NEET preparation. Covers cell biology, plant physiology, ecology, and genetics with diagrams and mnemonics.',
      price: 79,
      pdfPath: 'pdfs/neet-botany-notes.pdf',
      pageCount: 55,
      featured: true,
      classId: neet.id,
      subjectId: neetBiology.id,
      chapterId: neetBotany.id,
      topicId: neetBotanyNotes.id,
      salesCount: 150,
    },
    {
      title: 'NEET Biology - Zoology Notes',
      description: 'Comprehensive zoology notes for NEET. Human physiology, animal kingdom, and evolutionary biology with NCERT-based content.',
      price: 79,
      pdfPath: 'pdfs/neet-zoology-notes.pdf',
      pageCount: 48,
      featured: true,
      classId: neet.id,
      subjectId: neetBiology.id,
      chapterId: neetZoology.id,
      topicId: neetZoologyNotes.id,
      salesCount: 130,
    },
  ];

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

  for (const pdf of competitivePdfs) {
    await db.pdf.create({ data: pdf });
  }

  return {
    message: 'Database seeded successfully',
    classes: 10,
    subjects: 17,
    chapters: 21,
    pdfs: samplePdfs.length + competitivePdfs.length,
  };
}
