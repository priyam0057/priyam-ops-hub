// Simple PDF-like text file generator for project data
export const generateProjectPDF = (projectData: any): string => {
  const timestamp = new Date().toLocaleString();
  
  let content = `
╔══════════════════════════════════════════════════════════════╗
║                   PROJECT DETAILS REPORT                      ║
║                 Generated: ${timestamp}                  ║
╚══════════════════════════════════════════════════════════════╝

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PROJECT INFORMATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Project Name:     ${projectData.project?.project_name || 'N/A'}
Description:      ${projectData.project?.description || 'N/A'}
Status:           ${projectData.project?.status || 'N/A'}
Start Date:       ${projectData.project?.start_date || 'N/A'}
Repository:       ${projectData.project?.repo_link || 'N/A'}
Live Site:        ${projectData.project?.live_link || 'N/A'}

Technology Stack:
${projectData.project?.technology_stack?.map((tech: string) => `  • ${tech}`).join('\n') || '  No technologies listed'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DEVELOPMENT NOTES (${projectData.notes?.length || 0})
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

`;

  if (projectData.notes && projectData.notes.length > 0) {
    projectData.notes.forEach((note: any, index: number) => {
      content += `
Note #${index + 1}
Date: ${new Date(note.created_at).toLocaleDateString()}
Content:
${note.content || 'No content'}

${'-'.repeat(60)}
`;
    });
  } else {
    content += '\nNo notes available.\n';
  }

  content += `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ISSUES & BUGS (${projectData.issues?.length || 0})
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

`;

  if (projectData.issues && projectData.issues.length > 0) {
    projectData.issues.forEach((issue: any, index: number) => {
      content += `
Issue #${index + 1}: ${issue.title}
Priority:     ${issue.priority}
Status:       ${issue.status}
Description:  ${issue.description || 'No description'}
Created:      ${new Date(issue.created_at).toLocaleDateString()}

${'-'.repeat(60)}
`;
    });
  } else {
    content += '\nNo issues reported.\n';
  }

  content += `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TEAM MEMBERS (${projectData.team?.length || 0})
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

`;

  if (projectData.team && projectData.team.length > 0) {
    projectData.team.forEach((member: any) => {
      content += `
  • ${member.name} (${member.role})
    Contact: ${member.contact || 'Not provided'}
`;
    });
  } else {
    content += '\nNo team members listed.\n';
  }

  content += `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PROJECT GOALS (${projectData.goals?.length || 0})
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

`;

  if (projectData.goals && projectData.goals.length > 0) {
    projectData.goals.forEach((goal: any, index: number) => {
      const status = goal.completed ? '✓' : '○';
      content += `
  ${status} Goal #${index + 1}: ${goal.goal}
    Status: ${goal.completed ? 'Completed' : 'In Progress'}
`;
    });
  } else {
    content += '\nNo goals defined.\n';
  }

  content += `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                        END OF REPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;

  return content;
};