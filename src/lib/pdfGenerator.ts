import jsPDF from 'jspdf';

export const generateProjectPDF = (projectData: any): string => {
  const pdf = new jsPDF();
  const timestamp = new Date().toLocaleString();
  let yPosition = 20;

  // Title
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  pdf.text('PROJECT DETAILS REPORT', 105, yPosition, { align: 'center' });
  
  yPosition += 10;
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Generated: ${timestamp}`, 105, yPosition, { align: 'center' });
  
  yPosition += 15;

  // Project Information
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('PROJECT INFORMATION', 20, yPosition);
  yPosition += 10;

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  const projectInfo = [
    `Project Name: ${projectData.project?.project_name || 'N/A'}`,
    `Description: ${projectData.project?.description || 'N/A'}`,
    `Status: ${projectData.project?.status || 'N/A'}`,
    `Start Date: ${projectData.project?.start_date || 'N/A'}`,
    `Repository: ${projectData.project?.repo_link || 'N/A'}`,
    `Live Site: ${projectData.project?.live_link || 'N/A'}`,
  ];

  projectInfo.forEach(info => {
    pdf.text(info, 20, yPosition);
    yPosition += 7;
  });

  // Technology Stack
  yPosition += 5;
  pdf.text('Technology Stack:', 20, yPosition);
  yPosition += 7;
  if (projectData.project?.technology_stack?.length > 0) {
    projectData.project.technology_stack.forEach((tech: string) => {
      pdf.text(`  • ${tech}`, 25, yPosition);
      yPosition += 7;
    });
  } else {
    pdf.text('  No technologies listed', 25, yPosition);
    yPosition += 7;
  }

  // Development Notes
  yPosition += 10;
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text(`DEVELOPMENT NOTES (${projectData.notes?.length || 0})`, 20, yPosition);
  yPosition += 10;

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  if (projectData.notes && projectData.notes.length > 0) {
    projectData.notes.forEach((note: any, index: number) => {
      if (yPosition > 270) {
        pdf.addPage();
        yPosition = 20;
      }
      pdf.text(`Note #${index + 1}`, 20, yPosition);
      yPosition += 7;
      pdf.text(`Date: ${new Date(note.created_at).toLocaleDateString()}`, 20, yPosition);
      yPosition += 7;
      const content = note.content || 'No content';
      const splitContent = pdf.splitTextToSize(content, 170);
      pdf.text(splitContent, 20, yPosition);
      yPosition += (splitContent.length * 7) + 10;
    });
  } else {
    pdf.text('No notes available.', 20, yPosition);
    yPosition += 7;
  }

  // Issues & Bugs
  if (yPosition > 250) {
    pdf.addPage();
    yPosition = 20;
  }
  yPosition += 10;
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text(`ISSUES & BUGS (${projectData.issues?.length || 0})`, 20, yPosition);
  yPosition += 10;

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  if (projectData.issues && projectData.issues.length > 0) {
    projectData.issues.forEach((issue: any, index: number) => {
      if (yPosition > 270) {
        pdf.addPage();
        yPosition = 20;
      }
      pdf.text(`Issue #${index + 1}: ${issue.title}`, 20, yPosition);
      yPosition += 7;
      pdf.text(`Priority: ${issue.priority}`, 20, yPosition);
      yPosition += 7;
      pdf.text(`Status: ${issue.status}`, 20, yPosition);
      yPosition += 7;
      pdf.text(`Description: ${issue.description || 'No description'}`, 20, yPosition);
      yPosition += 7;
      pdf.text(`Created: ${new Date(issue.created_at).toLocaleDateString()}`, 20, yPosition);
      yPosition += 10;
    });
  } else {
    pdf.text('No issues reported.', 20, yPosition);
    yPosition += 7;
  }

  // Team Members
  if (yPosition > 250) {
    pdf.addPage();
    yPosition = 20;
  }
  yPosition += 10;
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text(`TEAM MEMBERS (${projectData.team?.length || 0})`, 20, yPosition);
  yPosition += 10;

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  if (projectData.team && projectData.team.length > 0) {
    projectData.team.forEach((member: any) => {
      pdf.text(`• ${member.name} (${member.role})`, 20, yPosition);
      yPosition += 7;
      pdf.text(`  Contact: ${member.contact || 'Not provided'}`, 20, yPosition);
      yPosition += 10;
    });
  } else {
    pdf.text('No team members listed.', 20, yPosition);
    yPosition += 7;
  }

  // Project Goals
  if (yPosition > 250) {
    pdf.addPage();
    yPosition = 20;
  }
  yPosition += 10;
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text(`PROJECT GOALS (${projectData.goals?.length || 0})`, 20, yPosition);
  yPosition += 10;

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  if (projectData.goals && projectData.goals.length > 0) {
    projectData.goals.forEach((goal: any, index: number) => {
      const status = goal.completed ? '✓' : '○';
      pdf.text(`${status} Goal #${index + 1}: ${goal.goal}`, 20, yPosition);
      yPosition += 7;
      pdf.text(`Status: ${goal.completed ? 'Completed' : 'In Progress'}`, 25, yPosition);
      yPosition += 10;
    });
  } else {
    pdf.text('No goals defined.', 20, yPosition);
  }

  return pdf.output('datauristring');
};