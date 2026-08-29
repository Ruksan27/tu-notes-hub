import { ExamPaperData } from '@/components/ExamPaperViewer';

export function parseLegacyMarkdownToExamData(markdown: string): ExamPaperData | null {
  try {
    // Basic cleanup of markdown bold/italic tags to make parsing easier
    const cleanText = markdown.replace(/\*\*/g, '').replace(/\*/g, '');
    
    // Check if it looks like a TU paper
    if (!cleanText.includes('TRIBHUVAN UNIVERSITY') && !cleanText.includes('OFFICE OF THE DEAN')) {
      return null;
    }

    const data: ExamPaperData = {
      university: 'TRIBHUVAN UNIVERSITY',
      faculty: 'Faculty of Humanities & Social Sciences',
      office: 'OFFICE OF THE DEAN',
      year: new Date().getFullYear().toString(),
      program: '',
      courseTitle: '',
      codeNo: '',
      semester: '',
      fullMarks: '',
      passMarks: '',
      time: '',
      instruction: '',
      groups: []
    };

    // Extract Year
    const yearMatch = cleanText.match(/(20\d{2})/);
    if (yearMatch) data.year = yearMatch[1];

    // Extract Program
    const programMatch = cleanText.match(/(Bachelor in [a-zA-Z\s&]+?)(?=\s+Course Title|\s+Full Marks|\s+Code No|$)/i);
    if (programMatch) data.program = programMatch[1].trim();
    else if (cleanText.includes('B.Sc.')) data.program = 'B.Sc. Computer Science & Information Technology';
    else if (cleanText.includes('BIM')) data.program = 'Bachelor of Information Management';

    // Extract details using regex
    const courseMatch = cleanText.match(/Course Title:\s*(.+?)(?=\s+Code No|\s+Semester|\s+Full Marks|$)/i);
    if (courseMatch) data.courseTitle = courseMatch[1].trim();

    const codeMatch = cleanText.match(/Code No:\s*([a-zA-Z0-9\s]+)(?=\s+Semester|\s+Full Marks|$)/i);
    if (codeMatch) data.codeNo = codeMatch[1].trim();

    const semMatch = cleanText.match(/Semester:\s*([a-zA-Z0-9]+)(?=\s+Full Marks|$)/i);
    if (semMatch) data.semester = semMatch[1].trim();

    const fullMarksMatch = cleanText.match(/Full Marks:\s*(\d+)/i);
    if (fullMarksMatch) data.fullMarks = fullMarksMatch[1].trim();

    const passMarksMatch = cleanText.match(/Pass Marks:\s*(\d+)/i);
    if (passMarksMatch) data.passMarks = passMarksMatch[1].trim();

    const timeMatch = cleanText.match(/Time:\s*(.+?)(?=\s+Candidates|$)/i);
    if (timeMatch) data.time = timeMatch[1].trim();

    const instructionMatch = cleanText.match(/(Candidates are required to answer.+?)(?=\s+Group|$)/i);
    if (instructionMatch) data.instruction = instructionMatch[1].trim();

    // Parse Groups
    const groupRegex = /Group\s+([A-Z])\s+\[(.*?)\]\s+(Attempt.+?questions\.)/gi;
    let match;
    let groupMatches = [];
    
    while ((match = groupRegex.exec(cleanText)) !== null) {
      groupMatches.push({
        groupName: `Group ${match[1]}`,
        marks: `[${match[2]}]`,
        instruction: match[3],
        startIndex: match.index,
        questions: []
      });
    }

    // Extract questions for each group
    for (let i = 0; i < groupMatches.length; i++) {
      const startIdx = groupMatches[i].startIndex;
      const endIdx = i + 1 < groupMatches.length ? groupMatches[i+1].startIndex : cleanText.length;
      const groupBlock = cleanText.substring(startIdx, endIdx);
      
      const qRegex = /(\d+)\.\s+(.+?)(?=\s+\d+\.\s+|$)/g;
      let qMatch;
      // Skip the group header part
      const qBlock = groupBlock.replace(/Group\s+[A-Z]\s+\[.*?\]\s+Attempt.+?questions\./i, '');
      
      while ((qMatch = qRegex.exec(qBlock)) !== null) {
        groupMatches[i].questions.push({
          number: parseInt(qMatch[1]),
          text: qMatch[2].trim()
        });
      }
    }
    
    if (groupMatches.length > 0) {
      data.groups = groupMatches;
    }

    return data;
  } catch (error) {
    return null;
  }
}
