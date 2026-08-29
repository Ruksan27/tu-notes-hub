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
      <div className="text-center mb-5 leading-snug">
        <h1 className="text-[17pt] font-bold uppercase tracking-wide mb-1">{data.university || 'TRIBHUVAN UNIVERSITY'}</h1>
        <h2 className="text-[14pt] font-bold mb-1">{data.faculty || 'Faculty of Humanities & Social Sciences'}</h2>
        <h3 className="text-[13pt] font-bold uppercase mb-1">{data.office || 'OFFICE OF THE DEAN'}</h3>
        <div className="text-[14pt] font-bold">{data.year || new Date().getFullYear()}</div>
      </div>

      {/* Course Details */}
      <div className="text-[13pt] leading-relaxed">
        <div className="flex justify-between">
          <span><span className="font-bold">{data.program || 'Bachelor in Computer Application'}</span></span>
          <span className="font-bold">Full Marks: {data.fullMarks || '60'}</span>
        </div>
        <div className="flex justify-between">
          <span><span className="font-bold">Course Title:</span> {data.courseTitle || ''}</span>
          <span className="font-bold">Pass Marks: {data.passMarks || '24'}</span>
        </div>
        <div className="flex justify-between">
          <span><span className="font-bold">Code No:</span> {data.codeNo || ''}</span>
          <span className="font-bold">Time: {data.time || '3 hours'}</span>
        </div>
        <div className="flex justify-between">
          <span><span className="font-bold">Semester:</span> {data.semester || ''}</span>
          <span></span>
        </div>
      </div>

      <div className="italic text-[13pt] mt-2 mb-3 pb-1 border-b-[1.5px] border-black">
        {data.instruction || 'Candidates are required to answer the questions in their own words as far as possible.'}
      </div>

      {/* Questions */}
      {data.groups && data.groups.map((group, gIndex) => (
        <div key={gIndex} className="mb-6">
          <div className="text-center font-bold text-[13pt] mt-3 mb-2 relative flex justify-center items-center">
            <span>{group.groupName}</span>
            {group.marks && <span className="absolute right-0 font-bold">{group.marks}</span>}
          </div>
          {group.instruction && (
            <p className="font-bold mb-2 text-[13pt]">{group.instruction}</p>
          )}

          <ol className="pl-6 mb-3 list-decimal text-[13.5pt]" start={group.questions[0]?.number || 1}>
            {group.questions.map((q, qIndex) => (
              <li key={qIndex} className="mb-[10px] text-justify pl-2">
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
