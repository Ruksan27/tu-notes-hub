'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import 'katex/dist/katex.min.css';

export interface ExamPaperData {
  university: string;
  faculty: string;
  office: string;
  year: string;
  program: string;
  courseTitle: string;
  codeNo: string;
  semester: string;
  fullMarks: string;
  passMarks: string;
  time: string;
  instruction: string;
  groups: {
    groupName: string;
    marks: string;
    instruction: string;
    questions: {
      number: number;
      text: string;
    }[];
  }[];
}

interface Props {
  data: ExamPaperData;
}

export default function ExamPaperViewer({ data }: Props) {
  return (
    <div
      className="bg-white text-black"
      style={{
        fontFamily: '"Times New Roman", Times, serif',
        fontSize: '13.5pt',
        lineHeight: 1.6,
        width: '100%',
        maxWidth: '800px',
        margin: '0 auto',
        padding: 'clamp(28px, 6vw, 64px) clamp(24px, 6vw, 72px)',
        boxShadow: '0 4px 40px rgba(0,0,0,0.22), 0 1px 6px rgba(0,0,0,0.10)',
        borderRadius: '3px',
      }}
    >
      {/* Header */}
      <div className="text-center mb-4">
        <h1 className="text-[16pt] font-bold uppercase tracking-wide">{data.university || 'TRIBHUVAN UNIVERSITY'}</h1>
        <h2 className="text-[13pt] font-normal mt-1">{data.faculty || 'Faculty of Humanities & Social Sciences'}</h2>
        <h3 className="text-[12pt] font-bold uppercase mt-1">{data.office || 'OFFICE OF THE DEAN'}</h3>
        <div className="text-[14pt] font-bold mt-2">{data.year || new Date().getFullYear()}</div>
      </div>

      {/* Course Details */}
      <div className="mt-4 text-[11.5pt]">
        <div className="flex justify-between mb-1">
          <span><strong>{data.program || 'Bachelor in Computer Application'}</strong></span>
          <span><strong>Full Marks: {data.fullMarks || '60'}</strong></span>
        </div>
        <div className="flex justify-between mb-1">
          <span><strong>Course Title:</strong> {data.courseTitle || ''}</span>
          <span><strong>Pass Marks: {data.passMarks || '24'}</strong></span>
        </div>
        <div className="flex justify-between mb-1">
          <span><strong>Code No:</strong> {data.codeNo || ''}</span>
          <span><strong>Time: {data.time || '3 hours'}</strong></span>
        </div>
        <div className="flex justify-between mb-1">
          <span><strong>Semester:</strong> {data.semester || ''}</span>
          <span></span>
        </div>
      </div>

      <div className="italic text-[11pt] mt-3 mb-4 pb-1 border-b border-black">
        {data.instruction || 'Candidates are required to answer the questions in their own words as far as possible.'}
      </div>

      {/* Questions */}
      {data.groups && data.groups.map((group, gIndex) => (
        <div key={gIndex} className="mb-6">
          <div className="text-center font-bold text-[12pt] mt-4 mb-2 relative">
            {group.groupName}
            {group.marks && <span className="absolute right-0 top-0 font-bold">{group.marks}</span>}
          </div>
          {group.instruction && (
            <p className="font-bold mb-2">{group.instruction}</p>
          )}

          <ol className="pl-6 mb-3 list-decimal" start={group.questions[0]?.number || 1}>
            {group.questions.map((q, qIndex) => (
              <li key={qIndex} className="mb-2 text-justify pl-1">
                <ReactMarkdown
                  remarkPlugins={[remarkMath, remarkGfm]}
                  rehypePlugins={[rehypeKatex]}
                  components={{ p: React.Fragment }}
                >
                  {q.text}
                </ReactMarkdown>
              </li>
            ))}
          </ol>
        </div>
      ))}
    </div>
  );
}
