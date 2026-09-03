'use client'
import { useState, useEffect } from 'react'
import { toast } from 'react-toastify'

export default function AdminMcqsTab() {
  const [faculties, setFaculties] = useState<any[]>([])
  const [semesters, setSemesters] = useState<any[]>([])
  const [subjects, setSubjects] = useState<any[]>([])
  const [mcqs, setMcqs] = useState<any[]>([])

  const [selectedFaculty, setSelectedFaculty] = useState('')
  const [selectedSemester, setSelectedSemester] = useState('')
  const [selectedSubject, setSelectedSubject] = useState('')

  const [loading, setLoading] = useState(false)
  
  const [question, setQuestion] = useState('')
  const [option1, setOption1] = useState('')
  const [option2, setOption2] = useState('')
  const [option3, setOption3] = useState('')
  const [option4, setOption4] = useState('')
  const [correctOption, setCorrectOption] = useState<number>(0)
  const [explanation, setExplanation] = useState('')

  useEffect(() => {
    fetch('/api/admin/faculties')
      .then(res => res.json())
      .then(data => setFaculties(data.faculties || []))
  }, [])

  useEffect(() => {
    if (!selectedFaculty) { setSemesters([]); return }
    fetch(`/api/admin/semesters?facultyId=${selectedFaculty}`)
      .then(res => res.json())
      .then(data => setSemesters(data.semesters || []))
  }, [selectedFaculty])

  useEffect(() => {
    if (!selectedSemester) { setSubjects([]); return }
    fetch(`/api/admin/subjects?semesterId=${selectedSemester}`)
      .then(res => res.json())
      .then(data => setSubjects(data.subjects || []))
  }, [selectedSemester])

  useEffect(() => {
    if (!selectedSubject) { setMcqs([]); return }
    loadMcqs()
  }, [selectedSubject])

  async function loadMcqs() {
    try {
      const res = await fetch(`/api/admin/mcqs?subjectId=${selectedSubject}`)
      const data = await res.json()
      setMcqs(data.mcqs || [])
    } catch (e) {
      toast.error('Failed to load MCQs')
    }
  }

  async function handleAddMcq(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedSubject) return toast.error('Select a subject first')
    if (!question || !option1 || !option2 || !option3 || !option4) {
      return toast.error('All fields except explanation are required')
    }
    
    setLoading(true)
    const payload = [{
      question,
      options: [option1, option2, option3, option4],
      correctOption,
      explanation
    }]

    try {
      const res = await fetch('/api/admin/mcqs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subjectId: selectedSubject, mcqs: payload })
      })
      const data = await res.json()
      if (res.ok) {
        toast.success('MCQ added successfully!')
        setQuestion('')
        setOption1('')
        setOption2('')
        setOption3('')
        setOption4('')
        setExplanation('')
        setCorrectOption(0)
        loadMcqs()
      } else {
        toast.error(data.error || 'Failed to add MCQ')
      }
    } catch (error) {
      toast.error('Network error')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this MCQ?')) return
    try {
      const res = await fetch(`/api/admin/mcqs?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('MCQ deleted')
        loadMcqs()
      } else {
        toast.error('Failed to delete')
      }
    } catch (e) {
      toast.error('Error deleting MCQ')
    }
  }

  return (
    <div className="glass-card" style={{ padding: '24px' }}>
      <h2 className="text-2xl font-bold mb-4">Manage Multiple Choice Questions (MCQs)</h2>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '24px' }}>
        <div>
          <label className="block text-sm mb-1 text-[var(--clr-text-2)]">Faculty</label>
          <select className="form-input" value={selectedFaculty} onChange={e => setSelectedFaculty(e.target.value)}>
            <option value="">Select Faculty...</option>
            {faculties.map(f => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm mb-1 text-[var(--clr-text-2)]">Semester</label>
          <select className="form-input" value={selectedSemester} onChange={e => setSelectedSemester(e.target.value)} disabled={!selectedFaculty}>
            <option value="">Select Semester...</option>
            {semesters.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm mb-1 text-[var(--clr-text-2)]">Subject</label>
          <select className="form-input" value={selectedSubject} onChange={e => setSelectedSubject(e.target.value)} disabled={!selectedSemester}>
            <option value="">Select Subject...</option>
            {subjects.map(s => (
              <option key={s.id} value={s.id}>{s.code} - {s.title}</option>
            ))}
          </select>
        </div>
      </div>

      {selectedSubject && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
          <div>
            <h3 className="text-lg font-bold mb-4">Add New MCQ</h3>
            <form onSubmit={handleAddMcq} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label className="block text-sm mb-1 text-[var(--clr-text-2)]">Question</label>
                <textarea 
                  className="form-input" 
                  rows={3}
                  value={question} 
                  onChange={e => setQuestion(e.target.value)} 
                  required 
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="block text-sm mb-1 text-[var(--clr-text-2)]">Option 1</label>
                  <input type="text" className="form-input" value={option1} onChange={e => setOption1(e.target.value)} required />
                </div>
                <div>
                  <label className="block text-sm mb-1 text-[var(--clr-text-2)]">Option 2</label>
                  <input type="text" className="form-input" value={option2} onChange={e => setOption2(e.target.value)} required />
                </div>
                <div>
                  <label className="block text-sm mb-1 text-[var(--clr-text-2)]">Option 3</label>
                  <input type="text" className="form-input" value={option3} onChange={e => setOption3(e.target.value)} required />
                </div>
                <div>
                  <label className="block text-sm mb-1 text-[var(--clr-text-2)]">Option 4</label>
                  <input type="text" className="form-input" value={option4} onChange={e => setOption4(e.target.value)} required />
                </div>
              </div>
              <div>
                <label className="block text-sm mb-1 text-[var(--clr-text-2)]">Correct Option</label>
                <select className="form-input" value={correctOption} onChange={e => setCorrectOption(Number(e.target.value))}>
                  <option value={0}>Option 1</option>
                  <option value={1}>Option 2</option>
                  <option value={2}>Option 3</option>
                  <option value={3}>Option 4</option>
                </select>
              </div>
              <div>
                <label className="block text-sm mb-1 text-[var(--clr-text-2)]">Explanation (Optional)</label>
                <textarea 
                  className="form-input" 
                  rows={2}
                  value={explanation} 
                  onChange={e => setExplanation(e.target.value)} 
                />
              </div>
              <button type="submit" className="btn btn-primary mt-2" disabled={loading}>
                {loading ? 'Adding...' : 'Add MCQ'}
              </button>
            </form>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-4">Existing MCQs ({mcqs.length})</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '600px', overflowY: 'auto', paddingRight: '8px' }}>
              {mcqs.length === 0 ? (
                <div style={{ color: 'var(--clr-text-3)' }}>No MCQs for this subject yet.</div>
              ) : (
                mcqs.map((m, i) => (
                  <div key={m.id} style={{ background: 'var(--clr-bg-2)', padding: '16px', borderRadius: '8px', border: '1px solid var(--clr-border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <p style={{ fontWeight: 600, fontSize: '15px' }}>{i + 1}. {m.question}</p>
                      <button onClick={() => handleDelete(m.id)} style={{ color: 'var(--clr-danger)', background: 'none', border: 'none', cursor: 'pointer' }}>
                        🗑️
                      </button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '13px' }}>
                      {m.options.map((opt: string, idx: number) => (
                        <div key={idx} style={{ 
                          padding: '6px 10px', 
                          borderRadius: '4px', 
                          background: m.correctOption === idx ? 'rgba(34, 197, 94, 0.15)' : 'var(--clr-bg-3)',
                          border: m.correctOption === idx ? '1px solid var(--clr-success)' : '1px solid transparent',
                          color: m.correctOption === idx ? 'var(--clr-success)' : 'inherit'
                        }}>
                          {String.fromCharCode(65 + idx)}. {opt} {m.correctOption === idx && '✓'}
                        </div>
                      ))}
                    </div>
                    {m.explanation && (
                      <p style={{ fontSize: '12px', color: 'var(--clr-text-3)', marginTop: '8px' }}>
                        <strong>Explanation:</strong> {m.explanation}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
