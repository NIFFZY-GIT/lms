import 'server-only';

import { db } from '@/lib/db';

type PastPaperRow = {
  grade_id: string;
  grade_name: string;
  subject_id: string | null;
  subject_name: string | null;
  paper_id: string | null;
  paper_title: string | null;
  paper_medium: string | null;
  paper_year: number | null;
  paper_file_url: string | null;
  paper_created_at: string | null;
};

export type PastPapersTree = {
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

export async function fetchPastPapersTree(): Promise<PastPapersTree> {
  const sql = `
    SELECT
      g.id AS grade_id,
      g.name AS grade_name,
      s.id AS subject_id,
      s.name AS subject_name,
      p.id AS paper_id,
      p.title AS paper_title,
      p.medium AS paper_medium,
      p.year AS paper_year,
      p."fileUrl" AS paper_file_url,
      p."createdAt"::text AS paper_created_at
    FROM "PastPaperGrade" g
    LEFT JOIN "PastPaperSubject" s ON s."gradeId" = g.id
    LEFT JOIN "PastPaper" p ON p."subjectId" = s.id
    ORDER BY g.name ASC, s.name ASC, p.year DESC, p."createdAt" DESC;
  `;

  const result = await db.query<PastPaperRow>(sql);

  const gradeMap = new Map<string, PastPapersTree['grades'][number]>();

  for (const row of result.rows) {
    let grade = gradeMap.get(row.grade_id);
    if (!grade) {
      grade = { id: row.grade_id, name: row.grade_name, subjects: [] };
      gradeMap.set(row.grade_id, grade);
    }

    if (!row.subject_id || !row.subject_name) continue;
    let subject = grade.subjects.find(s => s.id === row.subject_id);
    if (!subject) {
      subject = { id: row.subject_id, name: row.subject_name, papers: [] };
      grade.subjects.push(subject);
    }

    if (!row.paper_id) continue;
    if (!row.paper_title || !row.paper_medium || row.paper_year == null || !row.paper_file_url || !row.paper_created_at) continue;

    subject.papers.push({
      id: row.paper_id,
      title: row.paper_title,
      medium: row.paper_medium,
      year: row.paper_year,
      fileUrl: row.paper_file_url,
      createdAt: row.paper_created_at,
    });
  }

  return { grades: Array.from(gradeMap.values()) };
}
