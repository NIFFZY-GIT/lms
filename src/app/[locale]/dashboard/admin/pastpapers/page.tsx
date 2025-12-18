'use client';

import { useMemo, useState } from 'react';
import axios, { AxiosError } from 'axios';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/components/ui/toast';
import { Plus, Upload, FileDown, Eye } from 'lucide-react';

type Grade = { id: string; name: string };
type Subject = { id: string; name: string; gradeId: string };

type PastPapersTree = {
  grades: Array<{
    id: string;
    name: string;
    subjects: Array<{
      id: string;
      name: string;
      papers: Array<{
        id: string;
        title: string;
        medium: string;
        year: number;
        fileUrl: string;
        createdAt: string;
      }>;
    }>;
  }>;
};

const fetchGrades = async (): Promise<Grade[]> => (await axios.get('/api/admin/pastpapers/grades')).data;
const fetchSubjects = async (gradeId: string): Promise<Subject[]> => (await axios.get(`/api/admin/pastpapers/subjects?gradeId=${encodeURIComponent(gradeId)}`)).data;
const fetchTree = async (): Promise<PastPapersTree> => (await axios.get('/api/pastpapers')).data;

export default function AdminPastPapersPage() {
  const queryClient = useQueryClient();

  const [newGradeName, setNewGradeName] = useState('');
  const [selectedGradeIdForSubject, setSelectedGradeIdForSubject] = useState('');
  const [newSubjectName, setNewSubjectName] = useState('');

  const [selectedGradeIdForUpload, setSelectedGradeIdForUpload] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [medium, setMedium] = useState('');
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [files, setFiles] = useState<FileList | null>(null);

  const { data: grades = [], isLoading: gradesLoading } = useQuery({ queryKey: ['pp-grades'], queryFn: fetchGrades });
  const { data: tree, isLoading: treeLoading } = useQuery({ queryKey: ['pp-tree'], queryFn: fetchTree });

  const { data: subjects = [], isLoading: subjectsLoading } = useQuery({
    queryKey: ['pp-subjects', selectedGradeIdForUpload],
    queryFn: () => fetchSubjects(selectedGradeIdForUpload),
    enabled: !!selectedGradeIdForUpload,
  });

  const createGradeMutation = useMutation({
    mutationFn: async () => (await axios.post('/api/admin/pastpapers/grades', { name: newGradeName })).data as Grade,
    onSuccess: () => {
      setNewGradeName('');
      queryClient.invalidateQueries({ queryKey: ['pp-grades'] });
      queryClient.invalidateQueries({ queryKey: ['pp-tree'] });
      toast.success('Grade created');
    },
    onError: (e: AxiosError<{ error?: string }>) => toast.error(e.response?.data?.error || e.message),
  });

  const createSubjectMutation = useMutation({
    mutationFn: async () => {
      return (await axios.post('/api/admin/pastpapers/subjects', { gradeId: selectedGradeIdForSubject, name: newSubjectName })).data as Subject;
    },
    onSuccess: () => {
      setNewSubjectName('');
      queryClient.invalidateQueries({ queryKey: ['pp-tree'] });
      toast.success('Subject created');
    },
    onError: (e: AxiosError<{ error?: string }>) => toast.error(e.response?.data?.error || e.message),
  });

  const uploadMutation = useMutation({
    mutationFn: async () => {
      const fd = new FormData();
      fd.append('subjectId', selectedSubjectId);
      fd.append('medium', medium);
      fd.append('year', year);
      if (files) {
        Array.from(files).forEach(f => fd.append('files', f));
      }
      return (await axios.post('/api/admin/pastpapers/papers', fd)).data as { created: unknown[] };
    },
    onSuccess: () => {
      setFiles(null);
      queryClient.invalidateQueries({ queryKey: ['pp-tree'] });
      toast.success('Past papers uploaded');
    },
    onError: (e: AxiosError<{ error?: string }>) => toast.error(e.response?.data?.error || e.message),
  });

  const gradeOptions = useMemo(() => grades.slice().sort((a, b) => a.name.localeCompare(b.name)), [grades]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Manage Past Papers</h1>
        <p className="text-gray-600 mt-1">Create grades & subjects, then upload multiple PDF past papers by medium and year.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create Grade */}
        <div className="bg-white p-6 rounded-lg shadow-md space-y-4">
          <h2 className="text-lg font-bold">Grades</h2>
          <div className="flex gap-2">
            <input
              value={newGradeName}
              onChange={e => setNewGradeName(e.target.value)}
              placeholder="e.g. Grade 10"
              className="w-full border-gray-300 rounded-md shadow-sm"
            />
            <button
              type="button"
              onClick={() => createGradeMutation.mutate()}
              disabled={!newGradeName.trim() || createGradeMutation.isPending}
              className="btn-primary flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" /> Add
            </button>
          </div>
          {gradesLoading ? <p className="text-sm text-gray-500">Loading grades…</p> : (
            <ul className="text-sm text-gray-700 space-y-1">
              {gradeOptions.map(g => (
                <li key={g.id} className="flex items-center justify-between border-b border-gray-100 py-1">
                  <span>{g.name}</span>
                  <button
                    type="button"
                    className="text-xs text-blue-600 hover:underline"
                    onClick={() => setSelectedGradeIdForSubject(g.id)}
                  >
                    Use
                  </button>
                </li>
              ))}
              {gradeOptions.length === 0 && <li className="text-gray-500">No grades yet.</li>}
            </ul>
          )}
        </div>

        {/* Create Subject */}
        <div className="bg-white p-6 rounded-lg shadow-md space-y-4">
          <h2 className="text-lg font-bold">Subjects</h2>

          <label className="block text-sm font-medium text-gray-700">Grade</label>
          <select
            value={selectedGradeIdForSubject}
            onChange={e => setSelectedGradeIdForSubject(e.target.value)}
            className="w-full border-gray-300 rounded-md shadow-sm"
          >
            <option value="">Select a grade</option>
            {gradeOptions.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>

          <div className="flex gap-2">
            <input
              value={newSubjectName}
              onChange={e => setNewSubjectName(e.target.value)}
              placeholder="e.g. Mathematics"
              className="w-full border-gray-300 rounded-md shadow-sm"
            />
            <button
              type="button"
              onClick={() => createSubjectMutation.mutate()}
              disabled={!selectedGradeIdForSubject || !newSubjectName.trim() || createSubjectMutation.isPending}
              className="btn-primary flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" /> Add
            </button>
          </div>

          <p className="text-xs text-gray-500">Tip: create subjects per grade (e.g. Grade 10 → Science).</p>
        </div>

        {/* Upload Papers */}
        <div className="bg-white p-6 rounded-lg shadow-md space-y-4">
          <h2 className="text-lg font-bold">Upload Past Papers</h2>

          <label className="block text-sm font-medium text-gray-700">Grade</label>
          <select
            value={selectedGradeIdForUpload}
            onChange={e => {
              setSelectedGradeIdForUpload(e.target.value);
              setSelectedSubjectId('');
            }}
            className="w-full border-gray-300 rounded-md shadow-sm"
          >
            <option value="">Select a grade</option>
            {gradeOptions.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>

          <label className="block text-sm font-medium text-gray-700">Subject</label>
          <select
            value={selectedSubjectId}
            onChange={e => setSelectedSubjectId(e.target.value)}
            disabled={!selectedGradeIdForUpload}
            className="w-full border-gray-300 rounded-md shadow-sm"
          >
            <option value="">{subjectsLoading ? 'Loading…' : 'Select a subject'}</option>
            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Medium</label>
              <input
                value={medium}
                onChange={e => setMedium(e.target.value)}
                placeholder="e.g. English"
                className="w-full border-gray-300 rounded-md shadow-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Year</label>
              <input
                value={year}
                onChange={e => setYear(e.target.value)}
                type="number"
                min={1900}
                max={2100}
                className="w-full border-gray-300 rounded-md shadow-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">PDF files (multiple)</label>
            <input
              type="file"
              accept="application/pdf"
              multiple
              onChange={e => setFiles(e.target.files)}
              className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
            />
            {files?.length ? <p className="text-xs text-gray-500 mt-1">Selected: {files.length} file(s)</p> : null}
          </div>

          <button
            type="button"
            onClick={() => uploadMutation.mutate()}
            disabled={!selectedSubjectId || !medium.trim() || !year.trim() || !files?.length || uploadMutation.isPending}
            className="btn-primary w-full flex items-center justify-center"
          >
            <Upload className="w-4 h-4 mr-2" /> {uploadMutation.isPending ? 'Uploading…' : 'Upload'}
          </button>

          <p className="text-xs text-gray-500">Only PDF files are accepted.</p>
        </div>
      </div>

      {/* Existing Papers */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-xl font-bold">Existing Past Papers</h2>
          <p className="text-sm text-gray-500">Preview opens in a new tab.</p>
        </div>

        {treeLoading ? (
          <p className="text-gray-600 mt-4">Loading…</p>
        ) : (
          <div className="mt-4 space-y-6">
            {tree?.grades?.length ? tree.grades.map(g => (
              <div key={g.id} className="border rounded-lg p-4">
                <h3 className="font-bold text-gray-800">{g.name}</h3>
                <div className="mt-3 space-y-4">
                  {g.subjects.length ? g.subjects.map(s => (
                    <div key={s.id} className="pl-3 border-l">
                      <div className="font-semibold text-gray-700">{s.name}</div>
                      {s.papers.length ? (
                        <div className="mt-2 overflow-x-auto">
                          <table className="min-w-full text-sm">
                            <thead>
                              <tr className="text-left text-gray-500">
                                <th className="py-2 pr-4">Title</th>
                                <th className="py-2 pr-4">Medium</th>
                                <th className="py-2 pr-4">Year</th>
                                <th className="py-2 pr-4">Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {s.papers.map(p => (
                                <tr key={p.id} className="border-t">
                                  <td className="py-2 pr-4 text-gray-800">{p.title}</td>
                                  <td className="py-2 pr-4 text-gray-700">{p.medium}</td>
                                  <td className="py-2 pr-4 text-gray-700">{p.year}</td>
                                  <td className="py-2 pr-4">
                                    <div className="flex gap-2">
                                      <a
                                        href={p.fileUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="btn-secondary inline-flex items-center px-3 py-2"
                                      >
                                        <Eye className="w-4 h-4 mr-2" /> Preview
                                      </a>
                                      <a
                                        href={`${p.fileUrl}?download=1`}
                                        className="btn-secondary inline-flex items-center px-3 py-2"
                                      >
                                        <FileDown className="w-4 h-4 mr-2" /> Download
                                      </a>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 mt-2">No papers uploaded yet.</p>
                      )}
                    </div>
                  )) : (
                    <p className="text-sm text-gray-500">No subjects yet.</p>
                  )}
                </div>
              </div>
            )) : (
              <div className="text-center py-12 text-gray-500">No past papers yet.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
