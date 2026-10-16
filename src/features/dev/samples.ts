import { newId } from '../../lib/id';
import { quadrantIds } from '../../domain/models';
import type { Matrix, Task, QuadrantId } from '../../domain/models';

export function createSamples(today: string): Matrix {
  const base = new Date(today + 'T12:00:00Z');
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(today) ||
    Number.isNaN(base.getTime()) ||
    base.toISOString().slice(0, 10) !== today
  )
    throw new Error('Invalid date');
  const date = (days: number) => {
    const d = new Date(base);
    d.setUTCDate(d.getUTCDate() + days);
    return d.toISOString().slice(0, 10);
  };
  const projects = [
    { id: 'dev-project-launch', name: 'Dev · Client launch' },
    { id: 'dev-project-learning', name: 'Dev · Learning' },
    { id: 'dev-project-life', name: 'Dev · Personal' },
  ];
  const groups: Record<QuadrantId, [string, Task['category'], number, number | null][]> = {
    do: [
      ['Send the launch proposal before the deadline', 'Work', 0, 0],
      ['Fix the sign-in issue reported by the client', 'Work', 0, -1],
      ['Pay the electricity bill', 'Personal', 2, 0],
      ['Collect today’s prescription', 'Health', 2, 0],
      ['Confirm tomorrow’s appointment', 'Health', 2, 1],
      ['Submit the course assignment before tonight’s deadline', 'Learning', 1, 0],
    ],
    schedule: [
      ['Plan next week’s priorities', 'Work', 0, 3],
      ['Study system design for 30 minutes', 'Learning', 1, 4],
      ['Book a workout for the weekend', 'Health', 2, 5],
      ['Outline a small portfolio project', 'Learning', 1, 7],
      ['Read the documentation for the new API', 'Learning', 1, 6],
      [
        'Plan a weekend trip and compare travel dates, accommodation options, and the family budget',
        'Personal',
        2,
        8,
      ],
    ],
    delegate: [
      ['Ask a teammate to format the meeting notes', 'Work', 0, 0],
      ['Ask a family member to collect the parcel today', 'Personal', 2, 0],
      ['Ask the clinic to send the appointment details', 'Health', 2, 0],
      ['Hand off the weekly report formatting', 'Work', 0, 2],
      ['Ask a housemate to pick up groceries', 'Personal', 2, 0],
      ['Ask the course coordinator to resend the class link', 'Learning', 1, 0],
    ],
    eliminate: [
      ['Skip another unplanned social media scroll', 'Personal', 2, null],
      ['Archive newsletters I never read', 'Personal', 2, null],
      ['Stop checking the same dashboard every five minutes', 'Work', 0, null],
      ['Skip comparing fitness gadgets I do not need', 'Health', 2, null],
      ['Stop collecting tutorials without studying them', 'Learning', 1, null],
      ['Stop refreshing the step counter throughout the day', 'Health', 2, null],
    ],
  };
  const sampleNotes = {
    Work: 'Check the brief and agree on the next step with the team.',
    Personal: 'Check the household calendar and budget before making plans.',
    Health: 'Check appointment details and make time for the routine.',
    Learning: 'Set aside 30 minutes and write down what you learned.',
  };
  const tasks: Task[] = [];
  for (const q of quadrantIds)
    groups[q].forEach(([title, category, p, days], i) =>
      tasks.push({
        id: 'dev-task-' + newId(),
        title,
        q,
        category,
        projectId: projects[p]!.id,
        done: i === 5 && q !== 'do',
        notes:
          i % 2 === 0
            ? `Dev sample task. Safe to edit or remove.\n${sampleNotes[category || 'Work']}`
            : '',
        owner: '',
        due: days === null ? '' : date(days),
        created: Date.now() + tasks.length,
        isDevSample: true,
      }),
    );
  return { projects, tasks };
}
