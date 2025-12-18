'use client';

import { useMemo, useState } from 'react';
import axios, { AxiosError } from 'axios';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/components/ui/toast';
import { Plus, Upload, FileDown, Eye, Pencil, Trash2 } from 'lucide-react';

type Grade = { id: string; name: string };
type Subject = { id: string; name: string; gradeId: string };
type Paper = {
  id: string;
  title: string;
  medium: string;
  term: string;
  year: number;
  fileUrl: string;
  createdAt: string;
};

type PastPapersTree = {
  grades: Array<{
    id: string;
    name: string;
    subjects: Array<{
      id: string;
      name: string;
      papers: Paper[];
    }>;
  }>;
};

const TERMS = ['1st Term', '2nd Term', '3rd Term'];
const MEDIUMS = ['English', 'Sinhala', 'Tamil'];

const fetchGrades = async (): Promise<Grade[]> => (await axios.get('/api/admin/pastpapers/grades')).data;
const fetchSubjects = async (gradeId: string): Promise<Subject[]> => (await axios.get(`/api/admin/pastpapers/subjects?gradeId=${encodeURIComponent(gradeId)}`)).data;
const fetchTree = async (): Promise<PastPapersTree> => (await axios.get('/api/pastpapers')).data;

export default function AdminPastPapersPage() {
  const queryClient = useQueryClient();

  // Create states
  const [newGradeName, setNewGradeName] = useState('');
  const [selectedGradeIdForSubject, setSelectedGradeIdForSubject] = useState('');
  const [newSubjectName, setNewSubjectName] = useState('');

  const [selectedGradeIdForUpload, setSelectedGradeIdForUpload] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [medium, setMedium] = useState('');
  const [term, setTerm] = useState('');
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [files, setFiles] = useState<FileList | null>(null);

  // Edit states
  const [editingGrade, setEditingGrade] = useState<Grade | null>(null);
  const [editingSubject, setEditingSubject] = useState<{ id: string; name: string; gradeId: string } | null>(null);
  const [editingPaper, setEditingPaper] = useState<Paper | null>(null);

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'grade' | 'subject' | 'paper'; id: string; name: string } | null>(null);

  const { data: grades = [], isLoading: gradesLoading } = useQuery({ queryKey: ['pp-grades'], queryFn: fetchGrades });
  const { data: tree, isLoading: treeLoading } = useQuery({ queryKey: ['pp-tree'], queryFn: fetchTree });

  const { data: subjects = [], isLoading: subjectsLoading } = useQuery({
    queryKey: ['pp-subjects', selectedGradeIdForUpload],
    queryFn: () => fetchSubjects(selectedGradeIdForUpload),
    enabled: !!selectedGradeIdForUpload,
  });

  // Create mutations
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
      fd.append('term', term);
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

  // Update mutations
  const updateGradeMutation = useMutation({
    mutationFn: async (data: { id: string; name: string }) => {
      return (await axios.put(`/api/admin/pastpapers/grades/${data.id}`, { name: data.name })).data;
    },
    onSuccess: () => {
      setEditingGrade(null);
      queryClient.invalidateQueries({ queryKey: ['pp-grades'] });
      queryClient.invalidateQueries({ queryKey: ['pp-tree'] });
      toast.success('Grade updated');
    },
    onError: (e: AxiosError<{ error?: string }>) => toast.error(e.response?.data?.error || e.message),
  });

  const updateSubjectMutation = useMutation({
    mutationFn: async (data: { id: string; name: string }) => {
      return (await axios.put(`/api/admin/pastpapers/subjects/${data.id}`, { name: data.name })).data;
    },
    onSuccess: () => {
      setEditingSubject(null);
      queryClient.invalidateQueries({ queryKey: ['pp-tree'] });
      toast.success('Subject updated');
    },
    onError: (e: AxiosError<{ error?: string }>) => toast.error(e.response?.data?.error || e.message),
  });

  const updatePaperMutation = useMutation({
    mutationFn: async (data: { id: string; title: string; term: string; medium: string; year: number }) => {
      return (await axios.put(`/api/admin/pastpapers/papers/${data.id}`, data)).data;
    },
    onSuccess: () => {
      setEditingPaper(null);
      queryClient.invalidateQueries({ queryKey: ['pp-tree'] });
      toast.success('Paper updated');
    },
    onError: (e: AxiosError<{ error?: string }>) => toast.error(e.response?.data?.error || e.message),
  });

  // Delete mutations
  const deleteGradeMutation = useMutation({
    mutationFn: async (id: string) => (await axios.delete(`/api/admin/pastpapers/grades/${id}`)).data,
    onSuccess: () => {
      setDeleteConfirm(null);
      queryClient.invalidateQueries({ queryKey: ['pp-grades'] });
      queryClient.invalidateQueries({ queryKey: ['pp-tree'] });
      toast.success('Grade deleted');
    },
    onError: (e: AxiosError<{ error?: string }>) => toast.error(e.response?.data?.error || e.message),
  });

  const deleteSubjectMutation = useMutation({
    mutationFn: async (id: string) => (await axios.delete(`/api/admin/pastpapers/subjects/${id}`)).data,
    onSuccess: () => {
      setDeleteConfirm(null);
      queryClient.invalidateQueries({ queryKey: ['pp-tree'] });
      toast.success('Subject deleted');
    },
    onError: (e: AxiosError<{ error?: string }>) => toast.error(e.response?.data?.error || e.message),
  });

  const deletePaperMutation = useMutation({
    mutationFn: async (id: string) => (await axios.delete(`/api/admin/pastpapers/papers/${id}`)).data,
    onSuccess: () => {
      setDeleteConfirm(null);
      queryClient.invalidateQueries({ queryKey: ['pp-tree'] });
      toast.success('Paper deleted');
    },
    onError: (e: AxiosError<{ error?: string }>) => toast.error(e.response?.data?.error || e.message),
  });

  const gradeOptions = useMemo(() => grades.slice().sort((a, b) => a.name.localeCompare(b.name)), [grades]);

  const handleDelete = () => {
    if (!deleteConfirm) return;
    if (deleteConfirm.type === 'grade') deleteGradeMutation.mutate(deleteConfirm.id);
    else if (deleteConfirm.type === 'subject') deleteSubjectMutation.mutate(deleteConfirm.id);
    else if (deleteConfirm.type === 'paper') deletePaperMutation.mutate(deleteConfirm.id);
  };

  return (
    <div className="space-y-8">
      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900">Confirm Delete</h3>
            <p className="mt-2 text-gray-600">
              Are you sure you want to delete <span className="font-semibold">{deleteConfirm.name}</span>?
              {deleteConfirm.type === 'grade' && ' This will also delete all subjects and papers under this grade.'}
              {deleteConfirm.type === 'subject' && ' This will also delete all papers under this subject.'}
            </p>
            <div className="mt-4 flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                className="btn-secondary px-4 py-2"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleteGradeMutation.isPending || deleteSubjectMutation.isPending || deletePaperMutation.isPending}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                {(deleteGradeMutation.isPending || deleteSubjectMutation.isPending || deletePaperMutation.isPending) ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Grade Modal */}
      {editingGrade && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900">Edit Grade</h3>
            <input
              value={editingGrade.name}
              onChange={e => setEditingGrade({ ...editingGrade, name: e.target.value })}
              className="mt-4 w-full border-gray-300 rounded-md shadow-sm"
              placeholder="Grade name"
            />
            <div className="mt-4 flex gap-3 justify-end">
              <button type="button" onClick={() => setEditingGrade(null)} className="btn-secondary px-4 py-2">
                Cancel
              </button>
              <button
                type="button"
                onClick={() => updateGradeMutation.mutate({ id: editingGrade.id, name: editingGrade.name })}
                disabled={!editingGrade.name.trim() || updateGradeMutation.isPending}
                className="btn-primary px-4 py-2"
              >
                {updateGradeMutation.isPending ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Subject Modal */}
      {editingSubject && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900">Edit Subject</h3>
            <input
              value={editingSubject.name}
              onChange={e => setEditingSubject({ ...editingSubject, name: e.target.value })}
              className="mt-4 w-full border-gray-300 rounded-md shadow-sm"
              placeholder="Subject name"
            />
            <div className="mt-4 flex gap-3 justify-end">
              <button type="button" onClick={() => setEditingSubject(null)} className="btn-secondary px-4 py-2">
                Cancel
              </button>
              <button
                type="button"
                onClick={() => updateSubjectMutation.mutate({ id: editingSubject.id, name: editingSubject.name })}
                disabled={!editingSubject.name.trim() || updateSubjectMutation.isPending}
                className="btn-primary px-4 py-2"
              >
                {updateSubjectMutation.isPending ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Paper Modal */}
      {editingPaper && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900">Edit Paper</h3>
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Title</label>
                <input
                  value={editingPaper.title}
                  onChange={e => setEditingPaper({ ...editingPaper, title: e.target.value })}
                  className="mt-1 w-full border-gray-300 rounded-md shadow-sm"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Term</label>
                  <select
                    value={editingPaper.term}
                    onChange={e => setEditingPaper({ ...editingPaper, term: e.target.value })}
                    className="mt-1 w-full border-gray-300 rounded-md shadow-sm"
                  >
                    {TERMS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Medium</label>
                  <select
                    value={editingPaper.medium}
                    onChange={e => setEditingPaper({ ...editingPaper, medium: e.target.value })}
                    className="mt-1 w-full border-gray-300 rounded-md shadow-sm"
                  >
                    {MEDIUMS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Year</label>
                  <input
                    type="number"
                    value={editingPaper.year}
                    onChange={e => setEditingPaper({ ...editingPaper, year: Number(e.target.value) })}
                    min={1900}
                    max={2100}
                    className="mt-1 w-full border-gray-300 rounded-md shadow-sm"
                  />
                </div>
              </div>
            </div>
            <div className="mt-4 flex gap-3 justify-end">
              <button type="button" onClick={() => setEditingPaper(null)} className="btn-secondary px-4 py-2">
                Cancel
              </button>
              <button
                type="button"
                onClick={() => updatePaperMutation.mutate({
                  id: editingPaper.id,
                  title: editingPaper.title,
                  term: editingPaper.term,
                  medium: editingPaper.medium,
                  year: editingPaper.year,
                })}
                disabled={!editingPaper.title.trim() || updatePaperMutation.isPending}
                className="btn-primary px-4 py-2"
              >
                {updatePaperMutation.isPending ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div>
        <h1 className="text-3xl font-bold">Manage Past Papers</h1>
        <p className="text-gray-600 mt-1">Create grades & subjects, then upload multiple PDF past papers by term, medium and year.</p>
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
            <ul className="text-sm text-gray-700 space-y-1 max-h-64 overflow-y-auto">
              {gradeOptions.map(g => (
                <li key={g.id} className="flex items-center justify-between border-b border-gray-100 py-2">
                  <span>{g.name}</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="text-xs text-blue-600 hover:underline"
                      onClick={() => setSelectedGradeIdForSubject(g.id)}
                    >
                      Use
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingGrade({ id: g.id, name: g.name })}
                      className="p-1 text-gray-500 hover:text-blue-600"
                      title="Edit"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteConfirm({ type: 'grade', id: g.id, name: g.name })}
                      className="p-1 text-gray-500 hover:text-red-600"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
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

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Term</label>
              <select
                value={term}
                onChange={e => setTerm(e.target.value)}
                className="w-full border-gray-300 rounded-md shadow-sm"
              >
                <option value="">Select term</option>
                {TERMS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Medium</label>
              <select
                value={medium}
                onChange={e => setMedium(e.target.value)}
                className="w-full border-gray-300 rounded-md shadow-sm"
              >
                <option value="">Select</option>
                {MEDIUMS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
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
            disabled={!selectedSubjectId || !term.trim() || !medium.trim() || !year.trim() || !files?.length || uploadMutation.isPending}
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
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-gray-800">{g.name}</h3>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingGrade({ id: g.id, name: g.name })}
                      className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                      title="Edit Grade"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteConfirm({ type: 'grade', id: g.id, name: g.name })}
                      className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
                      title="Delete Grade"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="mt-3 space-y-4">
                  {g.subjects.length ? g.subjects.map(s => (
                    <div key={s.id} className="pl-3 border-l">
                      <div className="flex items-center justify-between">
                        <div className="font-semibold text-gray-700">{s.name}</div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingSubject({ id: s.id, name: s.name, gradeId: g.id })}
                            className="p-1 text-gray-500 hover:text-blue-600"
                            title="Edit Subject"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteConfirm({ type: 'subject', id: s.id, name: s.name })}
                            className="p-1 text-gray-500 hover:text-red-600"
                            title="Delete Subject"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      {s.papers.length ? (
                        <div className="mt-2 overflow-x-auto">
                          <table className="min-w-full text-sm">
                            <thead>
                              <tr className="text-left text-gray-500">
                                <th className="py-2 pr-4">Title</th>
                                <th className="py-2 pr-4">Term</th>
                                <th className="py-2 pr-4">Medium</th>
                                <th className="py-2 pr-4">Year</th>
                                <th className="py-2 pr-4">Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {s.papers.map(p => (
                                <tr key={p.id} className="border-t">
                                  <td className="py-2 pr-4 text-gray-800">{p.title}</td>
                                  <td className="py-2 pr-4 text-gray-700">{p.term}</td>
                                  <td className="py-2 pr-4 text-gray-700">{p.medium}</td>
                                  <td className="py-2 pr-4 text-gray-700">{p.year}</td>
                                  <td className="py-2 pr-4">
                                    <div className="flex gap-2">
                                      <a
                                        href={p.fileUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="btn-secondary inline-flex items-center px-2 py-1.5 text-xs"
                                      >
                                        <Eye className="w-3.5 h-3.5 mr-1" /> View
                                      </a>
                                      <a
                                        href={`${p.fileUrl}?download=1`}
                                        className="btn-secondary inline-flex items-center px-2 py-1.5 text-xs"
                                      >
                                        <FileDown className="w-3.5 h-3.5 mr-1" /> Download
                                      </a>
                                      <button
                                        type="button"
                                        onClick={() => setEditingPaper(p)}
                                        className="btn-secondary inline-flex items-center px-2 py-1.5 text-xs"
                                      >
                                        <Pencil className="w-3.5 h-3.5 mr-1" /> Edit
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setDeleteConfirm({ type: 'paper', id: p.id, name: p.title })}
                                        className="inline-flex items-center px-2 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded border border-red-200"
                                      >
                                        <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
                                      </button>
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
