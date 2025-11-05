import jsPDF from 'jspdf';

export const generateProjectPDF = (projectData: any): string => {
  const pdf = new jsPDF();
  const timestamp = new Date().toLocaleString();
  let yPosition = 20;

  // Color palette
  const colors = {
    primary: [41, 128, 185],      // Blue
    secondary: [52, 152, 219],    // Light Blue
    success: [46, 204, 113],      // Green
    warning: [241, 196, 15],      // Yellow
    danger: [231, 76, 60],        // Red
    dark: [44, 62, 80],           // Dark Blue
    light: [236, 240, 241],       // Light Gray
    white: [255, 255, 255]
  };

  // Helper function to add colored background
  const addColoredHeader = (text: string, y: number, color: number[]) => {
    pdf.setFillColor(color[0], color[1], color[2]);
    pdf.rect(15, y - 7, 180, 12, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text(text, 20, y);
    pdf.setTextColor(0, 0, 0);
  };

  // Helper function to add info box
  const addInfoBox = (label: string, value: string, y: number, labelColor: number[] = colors.dark) => {
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(labelColor[0], labelColor[1], labelColor[2]);
    pdf.text(label, 25, y);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(0, 0, 0);
    const splitValue = pdf.splitTextToSize(value, 140);
    pdf.text(splitValue, 75, y);
    return splitValue.length * 7;
  };

  // Cover Page with gradient effect
  pdf.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  pdf.rect(0, 0, 210, 100, 'F');
  
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(28);
  pdf.setFont('helvetica', 'bold');
  pdf.text('PROJECT REPORT', 105, 40, { align: 'center' });
  
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'normal');
  pdf.text(projectData.project?.project_name || 'Untitled Project', 105, 55, { align: 'center' });
  
  pdf.setFontSize(12);
  pdf.text(`Generated: ${timestamp}`, 105, 70, { align: 'center' });

  // Decorative line
  pdf.setDrawColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]);
  pdf.setLineWidth(1);
  pdf.line(40, 80, 170, 80);

  yPosition = 110;
  pdf.setTextColor(0, 0, 0);

  // Project Information Section
  addColoredHeader('PROJECT INFORMATION', yPosition, colors.primary);
  yPosition += 15;

  const projectInfo = [
    { label: 'Project Name:', value: projectData.project?.project_name || 'N/A' },
    { label: 'Description:', value: projectData.project?.description || 'N/A' },
    { label: 'Status:', value: projectData.project?.status || 'N/A' },
    { label: 'Start Date:', value: projectData.project?.start_date || 'N/A' },
    { label: 'Repository:', value: projectData.project?.repo_link || 'N/A' },
    { label: 'Live Site:', value: projectData.project?.live_link || 'N/A' }
  ];

  projectInfo.forEach(info => {
    const height = addInfoBox(info.label, info.value, yPosition);
    yPosition += Math.max(height, 7) + 3;
  });

  // Technology Stack with colored tags
  yPosition += 5;
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
  pdf.text('Technology Stack:', 25, yPosition);
  yPosition += 8;
  
  pdf.setFont('helvetica', 'normal');
  if (projectData.project?.technology_stack?.length > 0) {
    let xPos = 30;
    projectData.project.technology_stack.forEach((tech: string, index: number) => {
      const techWidth = pdf.getTextWidth(tech) + 10;
      
      if (xPos + techWidth > 190) {
        xPos = 30;
        yPosition += 10;
      }
      
      // Colored tag background
      const tagColors = [colors.secondary, colors.success, colors.warning];
      const tagColor = tagColors[index % tagColors.length];
      pdf.setFillColor(tagColor[0], tagColor[1], tagColor[2]);
      pdf.roundedRect(xPos, yPosition - 5, techWidth, 7, 2, 2, 'F');
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(9);
      pdf.text(tech, xPos + 5, yPosition);
      
      xPos += techWidth + 5;
    });
    yPosition += 10;
  } else {
    pdf.setTextColor(150, 150, 150);
    pdf.text('No technologies listed', 30, yPosition);
    yPosition += 7;
  }

  pdf.setTextColor(0, 0, 0);

  // Development Notes Section
  if (yPosition > 250) {
    pdf.addPage();
    yPosition = 20;
  }
  yPosition += 10;
  addColoredHeader(`DEVELOPMENT NOTES (${projectData.notes?.length || 0})`, yPosition, colors.secondary);
  yPosition += 15;

  if (projectData.notes && projectData.notes.length > 0) {
    projectData.notes.forEach((note: any, index: number) => {
      if (yPosition > 260) {
        pdf.addPage();
        yPosition = 20;
      }
      
      // Note card background
      pdf.setFillColor(colors.light[0], colors.light[1], colors.light[2]);
      const noteHeight = 30;
      pdf.roundedRect(20, yPosition - 5, 170, noteHeight, 3, 3, 'F');
      
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
      pdf.text(`Note #${index + 1}`, 25, yPosition + 2);
      
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'italic');
      pdf.setTextColor(100, 100, 100);
      pdf.text(new Date(note.created_at).toLocaleDateString(), 160, yPosition + 2);
      
      yPosition += 10;
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(0, 0, 0);
      const content = note.content || 'No content';
      const splitContent = pdf.splitTextToSize(content, 160);
      pdf.text(splitContent, 25, yPosition);
      yPosition += noteHeight + 5;
    });
  } else {
    pdf.setTextColor(150, 150, 150);
    pdf.text('No notes available.', 25, yPosition);
    yPosition += 7;
  }

  pdf.setTextColor(0, 0, 0);

  // Issues & Bugs Section
  if (yPosition > 240) {
    pdf.addPage();
    yPosition = 20;
  }
  yPosition += 10;
  addColoredHeader(`ISSUES & BUGS (${projectData.issues?.length || 0})`, yPosition, colors.danger);
  yPosition += 15;

  if (projectData.issues && projectData.issues.length > 0) {
    projectData.issues.forEach((issue: any, index: number) => {
      if (yPosition > 250) {
        pdf.addPage();
        yPosition = 20;
      }
      
      // Issue card
      pdf.setFillColor(colors.light[0], colors.light[1], colors.light[2]);
      pdf.roundedRect(20, yPosition - 5, 170, 40, 3, 3, 'F');
      
      // Priority badge
      const priorityColor = issue.priority === 'high' ? colors.danger : 
                          issue.priority === 'medium' ? colors.warning : colors.success;
      pdf.setFillColor(priorityColor[0], priorityColor[1], priorityColor[2]);
      pdf.roundedRect(160, yPosition - 3, 25, 6, 2, 2, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(8);
      pdf.text(issue.priority?.toUpperCase() || 'LOW', 165, yPosition + 1);
      
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(colors.danger[0], colors.danger[1], colors.danger[2]);
      const title = pdf.splitTextToSize(`Issue #${index + 1}: ${issue.title}`, 130);
      pdf.text(title, 25, yPosition + 2);
      
      yPosition += 10;
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(0, 0, 0);
      pdf.text(`Status: ${issue.status}`, 25, yPosition);
      yPosition += 7;
      const desc = pdf.splitTextToSize(`Description: ${issue.description || 'No description'}`, 160);
      pdf.text(desc, 25, yPosition);
      yPosition += desc.length * 5 + 2;
      
      pdf.setFontSize(8);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`Created: ${new Date(issue.created_at).toLocaleDateString()}`, 25, yPosition);
      yPosition += 15;
    });
  } else {
    pdf.setTextColor(150, 150, 150);
    pdf.text('No issues reported.', 25, yPosition);
    yPosition += 7;
  }

  pdf.setTextColor(0, 0, 0);

  // Team Members Section
  if (yPosition > 240) {
    pdf.addPage();
    yPosition = 20;
  }
  yPosition += 10;
  addColoredHeader(`TEAM MEMBERS (${projectData.team?.length || 0})`, yPosition, colors.success);
  yPosition += 15;

  if (projectData.team && projectData.team.length > 0) {
    projectData.team.forEach((member: any) => {
      if (yPosition > 270) {
        pdf.addPage();
        yPosition = 20;
      }
      
      // Member card
      pdf.setFillColor(colors.light[0], colors.light[1], colors.light[2]);
      pdf.roundedRect(20, yPosition - 5, 170, 18, 3, 3, 'F');
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(colors.success[0], colors.success[1], colors.success[2]);
      pdf.text(`• ${member.name}`, 25, yPosition + 2);
      
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(0, 0, 0);
      pdf.text(`(${member.role})`, 25 + pdf.getTextWidth(`• ${member.name}`) + 3, yPosition + 2);
      
      yPosition += 8;
      pdf.setFontSize(9);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`Contact: ${member.contact || 'Not provided'}`, 25, yPosition);
      yPosition += 15;
    });
  } else {
    pdf.setTextColor(150, 150, 150);
    pdf.text('No team members listed.', 25, yPosition);
    yPosition += 7;
  }

  pdf.setTextColor(0, 0, 0);

  // Project Goals Section
  if (yPosition > 240) {
    pdf.addPage();
    yPosition = 20;
  }
  yPosition += 10;
  addColoredHeader(`PROJECT GOALS (${projectData.goals?.length || 0})`, yPosition, colors.warning);
  yPosition += 15;

  if (projectData.goals && projectData.goals.length > 0) {
    projectData.goals.forEach((goal: any, index: number) => {
      if (yPosition > 270) {
        pdf.addPage();
        yPosition = 20;
      }
      
      const statusColor = goal.completed ? colors.success : colors.dark;
      const checkmark = goal.completed ? '✓' : '○';
      
      pdf.setFillColor(colors.light[0], colors.light[1], colors.light[2]);
      pdf.roundedRect(20, yPosition - 5, 170, 15, 3, 3, 'F');
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
      pdf.text(`${checkmark} Goal #${index + 1}:`, 25, yPosition + 2);
      
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(0, 0, 0);
      const goalText = pdf.splitTextToSize(goal.goal, 130);
      pdf.text(goalText, 65, yPosition + 2);
      
      yPosition += 8;
      pdf.setFontSize(8);
      pdf.setTextColor(100, 100, 100);
      pdf.text(`Status: ${goal.completed ? 'Completed ✓' : 'In Progress'}`, 25, yPosition);
      yPosition += 12;
    });
  } else {
    pdf.setTextColor(150, 150, 150);
    pdf.text('No goals defined.', 25, yPosition);
  }

  // Footer on last page
  const pageCount = pdf.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);
    pdf.setFontSize(8);
    pdf.setTextColor(150, 150, 150);
    pdf.text(`Page ${i} of ${pageCount}`, 105, 290, { align: 'center' });
    pdf.text('Generated by Priyam Project Manager', 105, 285, { align: 'center' });
  }

  return pdf.output('datauristring');
};