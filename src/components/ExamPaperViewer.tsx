'use client';

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import 'katex/dist/katex.min.css';
import AiAnswerModal from './AiAnswerModal';

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
      options?: string[];
      correctOption?: number;
      explanation?: string;
    }[];
  }[];
}

interface Props {
  data: ExamPaperData;
}

export default function ExamPaperViewer({ data }: Props) {
  const [hoveredQ, setHoveredQ] = useState<string | null>(null)
  const [aiModalOpen, setAiModalOpen] = useState(false)
  const [aiQuestion, setAiQuestion] = useState('')

  const openAiModal = (questionText: string) => {
    setAiQuestion(questionText)
    setAiModalOpen(true)
  }

  return (
    <>
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
              {group.questions.map((q, qIndex) => {
                const qKey = `${gIndex}-${qIndex}`
                const isHovered = hoveredQ === qKey

                // Handle MCQ options parsing if options array isn't provided but embedded in text
                let mainQuestion = q.text
                let rawOptions: string[] = q.options ? [...q.options] : []
                const correctOptionIndex = q.correctOption
                const explanation = q.explanation

                if (rawOptions.length === 0 && /[a-d]\)/i.test(mainQuestion)) {
                  const optRegex = /([a-d]\)\s*[\s\S]+?)(?=\s*[a-d]\)|$)/gi
                  const matches = mainQuestion.match(optRegex)
                  if (matches && matches.length >= 2) {
                    const firstOptIdx = mainQuestion.search(/[a-d]\)/i)
                    if (firstOptIdx > 0) {
                      rawOptions = matches.map(m => m.trim())
                      mainQuestion = mainQuestion.substring(0, firstOptIdx).trim()
                    }
                  }
                }

                return (
                  <li
                    key={qIndex}
                    className="mb-[14px] text-justify pl-2"
                    style={{ position: 'relative' }}
                    onMouseEnter={() => setHoveredQ(qKey)}
                    onMouseLeave={() => setHoveredQ(null)}
                  >
                    <div style={{ display: 'inline' }}>
                      <ReactMarkdown
                        remarkPlugins={[remarkMath, remarkGfm]}
                        rehypePlugins={[rehypeKatex]}
                        components={{ p: (props: any) => <>{props.children}</> }}
                      >
                        {mainQuestion}
                      </ReactMarkdown>

                      {/* Gemini AI Button — appears on hover */}
                      {isHovered && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginLeft: '8px' }}>
                          <button
                            onClick={() => openAiModal(q.text)}
                            title="Ask Scholar AI for answer"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              padding: '3px 10px 3px 6px',
                              borderRadius: '20px',
                              border: '1px solid rgba(99,102,241,0.3)',
                              background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(236,72,153,0.05))',
                              cursor: 'pointer',
                              fontSize: '11px',
                              fontWeight: 600,
                              color: '#4f46e5',
                              fontFamily: 'Inter, sans-serif',
                              boxShadow: '0 2px 8px rgba(99,102,241,0.1)',
                              transition: 'all 0.15s',
                              verticalAlign: 'middle',
                            }}
                          >
                            <video src="/Live%20chatbot.webm" autoPlay loop muted playsInline style={{ width: '18px', height: '18px', objectFit: 'contain', transform: 'scale(1.2)', pointerEvents: 'none' }} />
                            Smart Answer
                          </button>
                        </span>
                      )}
                    </div>

                    {/* MCQ Options Rendering */}
                    {rawOptions.length > 0 && (
                      <ul style={{ listStyleType: 'none', paddingLeft: '0', margin: '8px 0 12px 0' }}>
                        {rawOptions.map((opt, idx) => {
                          const isCorrect = correctOptionIndex === idx
                          const cleanOptText = opt.replace(/^[a-d][\).\s]+/i, '')

                          return (
                            <li
                              key={idx}
                              style={{
                                marginBottom: '6px',
                                padding: '6px 12px',
                                borderRadius: '6px',
                                backgroundColor: isCorrect ? 'rgba(16, 185, 129, 0.14)' : 'transparent',
                                border: isCorrect ? '1px solid #10b981' : '1px solid transparent',
                                fontWeight: isCorrect ? 'bold' : 'normal',
                                color: isCorrect ? '#047857' : '#1e293b',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                fontSize: '11.5pt'
                              }}
                            >
                              <span>{String.fromCharCode(97 + idx)}) {cleanOptText}</span>
                              {isCorrect && (
                                <span style={{ fontSize: '11px', marginLeft: 'auto', background: '#10b981', color: '#ffffff', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
                                  ✓ Correct Answer
                                </span>
                              )}
                            </li>
                          )
                        })}
                      </ul>
                    )}

                    {/* Explanation Box */}
                    {explanation && (
                      <div style={{ marginTop: '8px', padding: '8px 12px', background: '#f1f5f9', borderRadius: '6px', fontSize: '10.5pt', color: '#1e293b', borderLeft: '4px solid #0284c7' }}>
                        <strong style={{ color: '#0369a1' }}>💡 Explanation:</strong> {explanation}
                      </div>
                    )}
                  </li>
                )
              })}
            </ol>
          </div>
        ))}
      </div>

      {/* AI Answer Modal */}
      <AiAnswerModal
        isOpen={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        questionText={aiQuestion}
      />
    </>
  );
}
