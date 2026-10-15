export const tutorialSteps = [
  {
    title: 'Decide what deserves your time.',
    icon: 'help',
    description:
      'The Eisenhower Matrix sorts tasks using two questions. Is it important? Is it urgent?',
    exampleTitle: 'Important and urgent are different.',
    example:
      'Important tasks move your goals, health, or responsibilities forward. Urgent tasks need attention soon because waiting has a consequence. A loud notification can be urgent without being important.',
  },
  {
    q: 'do',
    title: 'Do first',
    icon: 'do',
    description:
      'Important and urgent. These tasks have a real consequence if you wait. Pick one and take the next useful step.',
    exampleTitle: 'For example',
    example:
      'A client proposal is due today. Completing it matters, and the deadline is close, so it belongs here.',
  },
  {
    q: 'schedule',
    title: 'Schedule',
    icon: 'schedule',
    description:
      'Important, but not urgent. Give these tasks a date or a place in your calendar before they become last-minute problems.',
    exampleTitle: 'For example',
    example:
      'Preparing for an interview next month matters to your career. Plan time this week, even though nobody is chasing you today.',
  },
  {
    q: 'delegate',
    title: 'Delegate',
    icon: 'delegate',
    description:
      'Urgent, but less important to your own goals. Ask whether someone else can handle it, or reduce the time you spend on it.',
    exampleTitle: 'For example',
    example:
      'Meeting notes need formatting today, and a teammate can do it. Ask for help so you can spend your time on the work that needs you.',
  },
  {
    q: 'eliminate',
    title: 'Let go',
    icon: 'eliminate',
    description:
      'Neither important nor urgent. Skip, limit, or remove tasks that add little value. Rest and activities that support your wellbeing can still be important.',
    exampleTitle: 'For example',
    example:
      'Checking the same social feed again has no deadline and does not help your goals. You can let it go.',
  },
  {
    title: 'Turn the matrix into a small plan.',
    icon: 'plus',
    description:
      'Use the circular + button in a quadrant to add a task. Add a category, project, and optional due date. Click a task to edit it, and check its box when it is done.',
    exampleTitle: 'Start small',
    example:
      'Write down three tasks. Decide where each belongs, then choose one Do first task to begin. Drag tasks between quadrants, or change the quadrant in the editor on a phone.',
  },
  {
    title: 'Keep your space useful.',
    icon: 'lock',
    description:
      'Review your matrix when priorities change. Search or filter by project, and use A+ in Settings if you want larger text. Open Settings, then Help, anytime to replay this walkthrough.',
    exampleTitle: 'Your tasks save in this browser.',
    example:
      'Tasks and projects do not sync across devices. Use Export backup regularly and Import to restore them. Clearing browser data removes local tasks. Choose Start with example tasks to add one editable task to each quadrant, or choose Use my own tasks to continue with your current matrix.',
  },
] as const;
