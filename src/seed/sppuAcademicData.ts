import College from '@/models/College';
import Department from '@/models/Department';
import Subject, { AcademicYear, SubjectType } from '@/models/Subject';
import University from '@/models/University';

type BranchCode = 'CE' | 'AIML' | 'AIDS' | 'ENTC';

type SubjectSeed = {
  code: string;
  name: string;
  type: SubjectType;
  credits: number;
  hoursPerWeek: number;
  year: AcademicYear;
  semester: number;
  isCommon?: boolean;
};

type SubjectSeedRow = [string, string, SubjectType, number, number, AcademicYear, number];

export const SPPU_UNIVERSITY = {
  name: 'Savitribai Phule Pune University',
  shortName: 'SPPU',
  website: 'https://www.unipune.ac.in',
  location: 'Ganeshkhind, Pune, Maharashtra - 411007',
  established: 1949,
  type: 'Public State University / Affiliating University',
};

export const SPPU_COLLEGES = [
  ['Sahyadri Valley College of Engg. & Technology', 'SVCET', 'Pune, Maharashtra', 'A'],
  ['PCCOE - Pimpri Chinchwad College of Engineering', 'PCCOE', 'Pune, Maharashtra', 'A+'],
  ['JSPM Rajarshi Shahu College of Engineering', 'JSPM RSCOE', 'Pune, Maharashtra', 'A'],
  ['DY Patil College of Engineering', 'DYP COE', 'Pune, Maharashtra', 'A'],
  ['Sinhgad College of Engineering', 'SCOE', 'Pune, Maharashtra', 'A'],
] as const;

export const SPPU_BRANCHES = [
  ['Computer Engineering', 'CE'],
  ['Artificial Intelligence and Machine Learning', 'AIML'],
  ['Artificial Intelligence and Data Science', 'AIDS'],
  ['Electronics and Telecommunication Engineering', 'ENTC'],
] as const;

const feCommon: SubjectSeed[] = [
  { code: 'FEC101', name: 'Engineering Mathematics I', type: 'Theory', credits: 4, hoursPerWeek: 4, year: 'FE', semester: 1, isCommon: true },
  { code: 'FEC102', name: 'Engineering Physics', type: 'Theory', credits: 3, hoursPerWeek: 3, year: 'FE', semester: 1, isCommon: true },
  { code: 'FEC103', name: 'Engineering Chemistry', type: 'Theory', credits: 3, hoursPerWeek: 3, year: 'FE', semester: 1, isCommon: true },
  { code: 'FEC104', name: 'Engineering Mechanics', type: 'Theory', credits: 4, hoursPerWeek: 4, year: 'FE', semester: 1, isCommon: true },
  { code: 'FEC105', name: 'Basic Electrical Engineering', type: 'Theory', credits: 4, hoursPerWeek: 4, year: 'FE', semester: 1, isCommon: true },
  { code: 'FEC106', name: 'Engineering Graphics', type: 'Practical', credits: 2, hoursPerWeek: 4, year: 'FE', semester: 1, isCommon: true },
  { code: 'FECL101', name: 'Engineering Physics Lab', type: 'Lab', credits: 1, hoursPerWeek: 2, year: 'FE', semester: 1, isCommon: true },
  { code: 'FECL102', name: 'Engineering Chemistry Lab', type: 'Lab', credits: 1, hoursPerWeek: 2, year: 'FE', semester: 1, isCommon: true },
  { code: 'FECL103', name: 'Basic Electrical Engg. Lab', type: 'Lab', credits: 1, hoursPerWeek: 2, year: 'FE', semester: 1, isCommon: true },
  { code: 'FEC201', name: 'Engineering Mathematics II', type: 'Theory', credits: 4, hoursPerWeek: 4, year: 'FE', semester: 2, isCommon: true },
  { code: 'FEC202', name: 'Engineering Physics II', type: 'Theory', credits: 3, hoursPerWeek: 3, year: 'FE', semester: 2, isCommon: true },
  { code: 'FEC203', name: 'Fundamentals of Programming', type: 'Theory', credits: 4, hoursPerWeek: 4, year: 'FE', semester: 2, isCommon: true },
  { code: 'FEC204', name: 'Digital Electronics', type: 'Theory', credits: 4, hoursPerWeek: 4, year: 'FE', semester: 2, isCommon: true },
  { code: 'FEC205', name: 'Environmental Studies', type: 'Theory', credits: 3, hoursPerWeek: 3, year: 'FE', semester: 2, isCommon: true },
  { code: 'FEC206', name: 'Engineering Drawing & CAD', type: 'Practical', credits: 2, hoursPerWeek: 4, year: 'FE', semester: 2, isCommon: true },
  { code: 'FECL201', name: 'Fundamentals of Programming Lab', type: 'Lab', credits: 1, hoursPerWeek: 2, year: 'FE', semester: 2, isCommon: true },
  { code: 'FECL202', name: 'Digital Electronics Lab', type: 'Lab', credits: 1, hoursPerWeek: 2, year: 'FE', semester: 2, isCommon: true },
];

const branchSpecific: Record<BranchCode, SubjectSeed[]> = {
  CE: ([
    ['CEC301', 'Discrete Mathematics', 'Theory', 4, 4, 'SE', 3], ['CEC302', 'Data Structures', 'Theory', 4, 4, 'SE', 3], ['CEC303', 'Computer Organization & Architecture', 'Theory', 4, 4, 'SE', 3], ['CEC304', 'Analog & Digital Circuits', 'Theory', 4, 4, 'SE', 3], ['CEC305', 'Object Oriented Programming (Java)', 'Theory', 4, 4, 'SE', 3], ['CECL301', 'Data Structures Lab', 'Lab', 1, 2, 'SE', 3], ['CECL302', 'OOP Lab', 'Lab', 1, 2, 'SE', 3], ['CECL303', 'COA Lab', 'Lab', 1, 2, 'SE', 3],
    ['CEC401', 'Engineering Mathematics III', 'Theory', 4, 4, 'SE', 4], ['CEC402', 'Analysis of Algorithms', 'Theory', 4, 4, 'SE', 4], ['CEC403', 'Database Management Systems', 'Theory', 4, 4, 'SE', 4], ['CEC404', 'Operating Systems', 'Theory', 4, 4, 'SE', 4], ['CEC405', 'Theory of Computation', 'Theory', 3, 3, 'SE', 4], ['CEC406', 'Software Engineering', 'Theory', 4, 4, 'SE', 4], ['CECL401', 'DBMS Lab', 'Lab', 1, 2, 'SE', 4], ['CECL402', 'OS Lab', 'Lab', 1, 2, 'SE', 4],
    ['CEC501', 'Computer Networks', 'Theory', 4, 4, 'TE', 5], ['CEC502', 'Microprocessor & Interfacing', 'Theory', 4, 4, 'TE', 5], ['CEC503', 'Software Testing & Quality Assurance', 'Theory', 4, 4, 'TE', 5], ['CEC504', 'Elective I (AI / Cryptography / IoT)', 'Elective', 3, 3, 'TE', 5], ['CEC505', 'Web Technology', 'Theory', 4, 4, 'TE', 5], ['CECL501', 'Computer Networks Lab', 'Lab', 1, 2, 'TE', 5], ['CECL502', 'Web Technology Lab', 'Lab', 1, 2, 'TE', 5], ['CECL503', 'Mini Project I', 'Project', 2, 4, 'TE', 5],
    ['CEC601', 'Compiler Design', 'Theory', 4, 4, 'TE', 6], ['CEC602', 'Machine Learning', 'Theory', 4, 4, 'TE', 6], ['CEC603', 'Cloud Computing', 'Theory', 4, 4, 'TE', 6], ['CEC604', 'Elective II (Blockchain / Big Data / NLP)', 'Elective', 3, 3, 'TE', 6], ['CEC605', 'Human Computer Interaction', 'Theory', 3, 3, 'TE', 6], ['CECL601', 'Machine Learning Lab', 'Lab', 1, 2, 'TE', 6], ['CECL602', 'Cloud Computing Lab', 'Lab', 1, 2, 'TE', 6], ['CECL603', 'Mini Project II', 'Project', 2, 4, 'TE', 6],
    ['CEC701', 'Distributed Systems', 'Theory', 4, 4, 'BE', 7], ['CEC702', 'Information Retrieval', 'Theory', 4, 4, 'BE', 7], ['CEC703', 'Elective III (Deep Learning / AR-VR / DevOps)', 'Elective', 3, 3, 'BE', 7], ['CEC704', 'Elective IV (Cybersecurity / Mobile Computing)', 'Elective', 3, 3, 'BE', 7], ['CEC705', 'Project Management', 'Theory', 3, 3, 'BE', 7], ['CECL701', 'Project Phase I', 'Project', 4, 8, 'BE', 7], ['CECL702', 'Industry Internship / Seminar', 'Seminar', 2, 4, 'BE', 7],
    ['CEC801', 'Elective V (Advanced Algorithms / Quantum Computing)', 'Elective', 3, 3, 'BE', 8], ['CEC802', 'Elective VI (Edge Computing / Digital Forensics)', 'Elective', 3, 3, 'BE', 8], ['CEC803', 'Professional Ethics & IPR', 'Theory', 2, 2, 'BE', 8], ['CECL801', 'Project Phase II', 'Project', 8, 16, 'BE', 8], ['CECL802', 'Comprehensive Viva', 'Viva', 3, 0, 'BE', 8],
  ] as SubjectSeedRow[]).map(toSubject),
  AIML: ([
    ['AIC301', 'Discrete Mathematics', 'Theory', 4, 4, 'SE', 3], ['AIC302', 'Data Structures', 'Theory', 4, 4, 'SE', 3], ['AIC303', 'Computer Organization & Architecture', 'Theory', 4, 4, 'SE', 3], ['AIC304', 'Object Oriented Programming (Python)', 'Theory', 4, 4, 'SE', 3], ['AIC305', 'Probability & Statistics', 'Theory', 4, 4, 'SE', 3], ['AICL301', 'Data Structures Lab', 'Lab', 1, 2, 'SE', 3], ['AICL302', 'OOP with Python Lab', 'Lab', 1, 2, 'SE', 3],
    ['AIC401', 'Engineering Mathematics III', 'Theory', 4, 4, 'SE', 4], ['AIC402', 'Analysis of Algorithms', 'Theory', 4, 4, 'SE', 4], ['AIC403', 'Database Management Systems', 'Theory', 4, 4, 'SE', 4], ['AIC404', 'Operating Systems', 'Theory', 4, 4, 'SE', 4], ['AIC405', 'Linear Algebra for ML', 'Theory', 3, 3, 'SE', 4], ['AIC406', 'Introduction to Machine Learning', 'Theory', 4, 4, 'SE', 4], ['AICL401', 'ML Lab', 'Lab', 1, 2, 'SE', 4], ['AICL402', 'DBMS Lab', 'Lab', 1, 2, 'SE', 4],
    ['AIC501', 'Machine Learning Techniques', 'Theory', 4, 4, 'TE', 5], ['AIC502', 'Deep Learning', 'Theory', 4, 4, 'TE', 5], ['AIC503', 'Natural Language Processing', 'Theory', 4, 4, 'TE', 5], ['AIC504', 'Computer Vision', 'Theory', 4, 4, 'TE', 5], ['AIC505', 'Elective I (Reinforcement Learning / Knowledge Representation)', 'Elective', 3, 3, 'TE', 5], ['AICL501', 'Deep Learning Lab', 'Lab', 1, 2, 'TE', 5], ['AICL502', 'NLP Lab', 'Lab', 1, 2, 'TE', 5], ['AICL503', 'Mini Project I', 'Project', 2, 4, 'TE', 5],
    ['AIC601', 'Big Data Analytics', 'Theory', 4, 4, 'TE', 6], ['AIC602', 'Cloud Computing for AI', 'Theory', 4, 4, 'TE', 6], ['AIC603', 'AI Ethics & Responsible AI', 'Theory', 3, 3, 'TE', 6], ['AIC604', 'Pattern Recognition', 'Theory', 4, 4, 'TE', 6], ['AIC605', 'Elective II (Speech Processing / Robotics & AI)', 'Elective', 3, 3, 'TE', 6], ['AICL601', 'Big Data Lab', 'Lab', 1, 2, 'TE', 6], ['AICL602', 'Mini Project II', 'Project', 2, 4, 'TE', 6],
    ['AIC701', 'Generative AI & Large Language Models', 'Theory', 4, 4, 'BE', 7], ['AIC702', 'MLOps & Model Deployment', 'Theory', 4, 4, 'BE', 7], ['AIC703', 'Elective III (Federated Learning / Explainable AI)', 'Elective', 3, 3, 'BE', 7], ['AIC704', 'Elective IV (AI in Healthcare / Autonomous Systems)', 'Elective', 3, 3, 'BE', 7], ['AIC705', 'Research Methodology', 'Theory', 2, 2, 'BE', 7], ['AICL701', 'Project Phase I', 'Project', 4, 8, 'BE', 7], ['AICL702', 'Seminar / Internship', 'Seminar', 2, 4, 'BE', 7],
    ['AIC801', 'Advanced Topics in AI', 'Elective', 3, 3, 'BE', 8], ['AIC802', 'Elective VI (Quantum ML / AI for IoT)', 'Elective', 3, 3, 'BE', 8], ['AIC803', 'Professional Ethics & IPR', 'Theory', 2, 2, 'BE', 8], ['AICL801', 'Project Phase II', 'Project', 8, 16, 'BE', 8], ['AICL802', 'Comprehensive Viva', 'Viva', 3, 0, 'BE', 8],
  ] as SubjectSeedRow[]).map(toSubject),
  AIDS: ([
    ['DSC301', 'Discrete Mathematics', 'Theory', 4, 4, 'SE', 3], ['DSC302', 'Data Structures & Algorithms', 'Theory', 4, 4, 'SE', 3], ['DSC303', 'Probability & Statistics', 'Theory', 4, 4, 'SE', 3], ['DSC304', 'Python Programming', 'Theory', 4, 4, 'SE', 3], ['DSC305', 'Database Systems', 'Theory', 4, 4, 'SE', 3], ['DSCL301', 'Python Lab', 'Lab', 1, 2, 'SE', 3], ['DSCL302', 'DS Lab', 'Lab', 1, 2, 'SE', 3],
    ['DSC401', 'Engineering Mathematics III', 'Theory', 4, 4, 'SE', 4], ['DSC402', 'Machine Learning Foundations', 'Theory', 4, 4, 'SE', 4], ['DSC403', 'Data Warehousing & Mining', 'Theory', 4, 4, 'SE', 4], ['DSC404', 'R Programming for Data Science', 'Theory', 4, 4, 'SE', 4], ['DSC405', 'NoSQL Databases', 'Theory', 3, 3, 'SE', 4], ['DSC406', 'Operating Systems', 'Theory', 3, 3, 'SE', 4], ['DSCL401', 'ML Lab', 'Lab', 1, 2, 'SE', 4], ['DSCL402', 'R Programming Lab', 'Lab', 1, 2, 'SE', 4],
    ['DSC501', 'Deep Learning', 'Theory', 4, 4, 'TE', 5], ['DSC502', 'Big Data Technologies (Hadoop/Spark)', 'Theory', 4, 4, 'TE', 5], ['DSC503', 'Natural Language Processing', 'Theory', 4, 4, 'TE', 5], ['DSC504', 'Data Visualization', 'Theory', 3, 3, 'TE', 5], ['DSC505', 'Elective I (Time Series Analysis / GIS Data)', 'Elective', 3, 3, 'TE', 5], ['DSCL501', 'Big Data Lab', 'Lab', 1, 2, 'TE', 5], ['DSCL502', 'DL Lab', 'Lab', 1, 2, 'TE', 5], ['DSCL503', 'Mini Project I', 'Project', 2, 4, 'TE', 5],
    ['DSC601', 'Cloud Data Engineering', 'Theory', 4, 4, 'TE', 6], ['DSC602', 'Business Intelligence & Analytics', 'Theory', 4, 4, 'TE', 6], ['DSC603', 'Computer Vision', 'Theory', 4, 4, 'TE', 6], ['DSC604', 'Statistical Learning', 'Theory', 3, 3, 'TE', 6], ['DSC605', 'Elective II (Social Network Analysis / Stream Processing)', 'Elective', 3, 3, 'TE', 6], ['DSCL601', 'BI Lab', 'Lab', 1, 2, 'TE', 6], ['DSCL602', 'Mini Project II', 'Project', 2, 4, 'TE', 6],
    ['DSC701', 'MLOps & DataOps', 'Theory', 4, 4, 'BE', 7], ['DSC702', 'Advanced Analytics & AI', 'Theory', 4, 4, 'BE', 7], ['DSC703', 'Elective III (Responsible AI / Graph Neural Networks)', 'Elective', 3, 3, 'BE', 7], ['DSC704', 'Elective IV (Digital Twin / AI for Finance)', 'Elective', 3, 3, 'BE', 7], ['DSC705', 'Research Methodology & Technical Writing', 'Theory', 2, 2, 'BE', 7], ['DSCL701', 'Project Phase I', 'Project', 4, 8, 'BE', 7], ['DSCL702', 'Seminar / Internship', 'Seminar', 2, 4, 'BE', 7],
    ['DSC801', 'Elective V (Quantum Computing for DS / Edge AI)', 'Elective', 3, 3, 'BE', 8], ['DSC802', 'Elective VI (Privacy in AI / Advanced NLP)', 'Elective', 3, 3, 'BE', 8], ['DSC803', 'Professional Ethics & IPR', 'Theory', 2, 2, 'BE', 8], ['DSCL801', 'Project Phase II', 'Project', 8, 16, 'BE', 8], ['DSCL802', 'Comprehensive Viva', 'Viva', 3, 0, 'BE', 8],
  ] as SubjectSeedRow[]).map(toSubject),
  ENTC: ([
    ['ETC301', 'Engineering Mathematics III', 'Theory', 4, 4, 'SE', 3], ['ETC302', 'Electronic Devices & Circuits', 'Theory', 4, 4, 'SE', 3], ['ETC303', 'Digital Logic Design', 'Theory', 4, 4, 'SE', 3], ['ETC304', 'Signals & Systems', 'Theory', 4, 4, 'SE', 3], ['ETC305', 'Network Analysis', 'Theory', 4, 4, 'SE', 3], ['ETCL301', 'EDC Lab', 'Lab', 1, 2, 'SE', 3], ['ETCL302', 'Digital Logic Design Lab', 'Lab', 1, 2, 'SE', 3],
    ['ETC401', 'Engineering Mathematics IV', 'Theory', 4, 4, 'SE', 4], ['ETC402', 'Analog Circuits', 'Theory', 4, 4, 'SE', 4], ['ETC403', 'Electromagnetic Engineering', 'Theory', 4, 4, 'SE', 4], ['ETC404', 'Microprocessors & Microcontrollers', 'Theory', 4, 4, 'SE', 4], ['ETC405', 'Control Systems', 'Theory', 4, 4, 'SE', 4], ['ETCL401', 'Analog Circuits Lab', 'Lab', 1, 2, 'SE', 4], ['ETCL402', 'Microprocessor Lab', 'Lab', 1, 2, 'SE', 4],
    ['ETC501', 'Communication Engineering', 'Theory', 4, 4, 'TE', 5], ['ETC502', 'VLSI Design', 'Theory', 4, 4, 'TE', 5], ['ETC503', 'Digital Communication', 'Theory', 4, 4, 'TE', 5], ['ETC504', 'Embedded Systems', 'Theory', 4, 4, 'TE', 5], ['ETC505', 'Elective I (IoT / Antenna Design)', 'Elective', 3, 3, 'TE', 5], ['ETCL501', 'Communication Lab', 'Lab', 1, 2, 'TE', 5], ['ETCL502', 'Embedded Systems Lab', 'Lab', 1, 2, 'TE', 5], ['ETCL503', 'Mini Project I', 'Project', 2, 4, 'TE', 5],
    ['ETC601', 'Wireless Communication', 'Theory', 4, 4, 'TE', 6], ['ETC602', 'DSP Processors & Architecture', 'Theory', 4, 4, 'TE', 6], ['ETC603', 'Image Processing', 'Theory', 4, 4, 'TE', 6], ['ETC604', 'Optical Communication', 'Theory', 3, 3, 'TE', 6], ['ETC605', 'Elective II (5G/LTE / Radar Systems)', 'Elective', 3, 3, 'TE', 6], ['ETCL601', 'Wireless Comm Lab', 'Lab', 1, 2, 'TE', 6], ['ETCL602', 'Mini Project II', 'Project', 2, 4, 'TE', 6],
    ['ETC701', 'Advanced Communication Systems', 'Theory', 4, 4, 'BE', 7], ['ETC702', 'Machine Learning for Signal Processing', 'Theory', 4, 4, 'BE', 7], ['ETC703', 'Elective III (Satellite Communication / MIMO Systems)', 'Elective', 3, 3, 'BE', 7], ['ETC704', 'Elective IV (Network Security / SDN)', 'Elective', 3, 3, 'BE', 7], ['ETC705', 'Project Management', 'Theory', 2, 2, 'BE', 7], ['ETCL701', 'Project Phase I', 'Project', 4, 8, 'BE', 7], ['ETCL702', 'Seminar / Internship', 'Seminar', 2, 4, 'BE', 7],
    ['ETC801', 'Elective V (Cognitive Radio / Terahertz Comm)', 'Elective', 3, 3, 'BE', 8], ['ETC802', 'Elective VI (Autonomous Vehicles / Cyber-Physical Systems)', 'Elective', 3, 3, 'BE', 8], ['ETC803', 'Professional Ethics & IPR', 'Theory', 2, 2, 'BE', 8], ['ETCL801', 'Project Phase II', 'Project', 8, 16, 'BE', 8], ['ETCL802', 'Comprehensive Viva', 'Viva', 3, 0, 'BE', 8],
  ] as SubjectSeedRow[]).map(toSubject),
};

function toSubject(row: SubjectSeedRow): SubjectSeed {
  const [code, name, type, credits, hoursPerWeek, year, semester] = row;
  return { code, name, type, credits, hoursPerWeek, year, semester };
}

export function getSubjectsForBranch(branchCode: BranchCode) {
  return [...feCommon, ...branchSpecific[branchCode]];
}

let seedPromise: Promise<void> | null = null;

export async function ensureSppuAcademicSeedData() {
  if (!seedPromise) {
    seedPromise = seedSppuAcademicData();
  }

  return seedPromise;
}

async function seedSppuAcademicData() {
  const university = await University.findOneAndUpdate(
    { shortName: SPPU_UNIVERSITY.shortName },
    SPPU_UNIVERSITY,
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  for (const [name, shortName, location, accreditation] of SPPU_COLLEGES) {
    const college = await College.findOneAndUpdate(
      { universityId: university._id, shortName },
      { universityId: university._id, name, shortName, location, accreditation, aicteApproved: true },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    for (const [branchName, branchCode] of SPPU_BRANCHES) {
      const department = await Department.findOneAndUpdate(
        { collegeId: college._id, code: branchCode },
        { collegeId: college._id, name: branchName, code: branchCode, duration: '4 Years / 8 Semesters' },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      for (const subject of getSubjectsForBranch(branchCode as BranchCode)) {
        await Subject.findOneAndUpdate(
          { departmentId: department._id, code: subject.code },
          {
            ...subject,
            departmentId: department._id,
            collegeId: college._id,
            branchCode,
            isCommon: !!subject.isCommon,
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
      }
    }
  }
}
